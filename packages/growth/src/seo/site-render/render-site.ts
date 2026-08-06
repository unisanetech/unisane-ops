import { createHash } from 'node:crypto';
import type { SiteCrawlPage, SiteCrawlSnapshot } from '../schema/site-crawl.js';
import {
  siteRenderSnapshotSchema,
  type SiteRenderFailure,
  type SiteRenderFailureCode,
  type SiteRenderReason,
  type SiteRenderSnapshot,
} from '../schema/site-render.js';
import { extractSitePageEvidence } from '../site-crawl/extract-page.js';

const DEFAULT_MAX_PAGES = 10;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_SETTLE_MS = 500;
const DEFAULT_MIN_STATIC_WORD_COUNT = 80;
const DEFAULT_FRESHNESS_HOURS = 24;

export type SitePageRenderRequest = {
  url: string;
  timeoutMs: number;
  settleMs: number;
  signal?: AbortSignal;
};

export type SitePageRenderResponse = {
  finalUrl: string;
  html: string;
  statusCode?: number;
};

export type SitePageRenderer = {
  driver: 'playwright';
  browser: string;
  render(request: SitePageRenderRequest): Promise<SitePageRenderResponse>;
  close(): Promise<void>;
};

export type RenderSiteOptions = {
  crawl: SiteCrawlSnapshot;
  renderer: SitePageRenderer;
  urls?: string[];
  maxPages?: number;
  timeoutMs?: number;
  settleMs?: number;
  minStaticWordCount?: number;
  freshnessHours?: number;
  signal?: AbortSignal;
  now?: () => Date;
};

export class SiteRenderCancelledError extends Error {
  constructor() {
    super('Site render cancelled.');
    this.name = 'SiteRenderCancelledError';
  }
}

export async function renderSite(options: RenderSiteOptions): Promise<SiteRenderSnapshot> {
  const maxPages = positiveInteger(options.maxPages ?? DEFAULT_MAX_PAGES, 'maxPages');
  const timeoutMs = positiveInteger(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 'timeoutMs');
  const settleMs = nonnegativeInteger(options.settleMs ?? DEFAULT_SETTLE_MS, 'settleMs');
  const minStaticWordCount = nonnegativeInteger(
    options.minStaticWordCount ?? DEFAULT_MIN_STATIC_WORD_COUNT,
    'minStaticWordCount',
  );
  const freshnessHours = positiveInteger(
    options.freshnessHours ?? DEFAULT_FRESHNESS_HOURS,
    'freshnessHours',
  );
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const candidates = selectRenderCandidates(options.crawl, options.urls, minStaticWordCount);
  const selected = candidates.slice(0, maxPages);
  const pages: SiteRenderSnapshot['pages'] = [];
  const failures: SiteRenderFailure[] = [];

  try {
    for (const candidate of selected) {
      throwIfCancelled(options.signal);
      try {
        const rendered = await options.renderer.render({
          url: candidate.page.url,
          timeoutMs,
          settleMs,
          signal: options.signal,
        });
        throwIfCancelled(options.signal);
        const finalUrl = normalizeUrl(rendered.finalUrl);
        if (new URL(finalUrl).origin !== new URL(options.crawl.site.origin).origin) {
          failures.push(
            renderFailure(
              candidate,
              'offsite-redirect',
              'Browser navigation left the configured site.',
            ),
          );
          continue;
        }
        const evidence = extractSitePageEvidence({
          html: rendered.html,
          url: finalUrl,
          siteOrigin: new URL(options.crawl.site.origin).origin,
        });
        pages.push({
          url: candidate.page.url,
          finalUrl,
          reasons: candidate.reasons,
          renderedAt: now().toISOString(),
          ...(rendered.statusCode ? { statusCode: rendered.statusCode } : {}),
          ...evidence,
        });
      } catch (error: unknown) {
        if (options.signal?.aborted || error instanceof SiteRenderCancelledError) {
          throw new SiteRenderCancelledError();
        }
        failures.push(
          renderFailure(
            candidate,
            classifyRenderError(error),
            error instanceof Error ? error.message : 'Browser rendering failed.',
          ),
        );
      }
    }
  } finally {
    await options.renderer.close();
  }

  const completedAt = now().toISOString();
  const freshUntil = new Date(
    new Date(completedAt).getTime() + freshnessHours * 60 * 60 * 1000,
  ).toISOString();
  return siteRenderSnapshotSchema.parse({
    version: 1,
    renderId: `render-${createHash('sha256')
      .update(
        `${options.crawl.snapshotId}|${startedAt}|${selected.map((item) => item.page.url).join('|')}`,
      )
      .digest('hex')
      .slice(0, 20)}`,
    platformId: options.crawl.platformId,
    site: { origin: options.crawl.site.origin },
    crawlSnapshotId: options.crawl.snapshotId,
    source: {
      kind: 'local-browser-render',
      driver: options.renderer.driver,
      browser: options.renderer.browser,
      javascript: true,
    },
    sampleData: false,
    startedAt,
    completedAt,
    freshness: { observedAt: completedAt, freshUntil },
    limits: { maxPages, timeoutMs, settleMs, minStaticWordCount },
    pages,
    failures,
    summary: {
      selectedPageCount: selected.length,
      renderedPageCount: pages.length,
      failureCount: failures.length,
      truncated: candidates.length > selected.length,
    },
  });
}

type RenderCandidate = { page: SiteCrawlPage; reasons: SiteRenderReason[] };

function selectRenderCandidates(
  crawl: SiteCrawlSnapshot,
  explicitUrls: string[] | undefined,
  minStaticWordCount: number,
): RenderCandidate[] {
  const byUrl = new Map(crawl.pages.map((page) => [normalizeUrl(page.url), page]));
  if (explicitUrls?.length) {
    return [...new Set(explicitUrls.map(normalizeUrl))].map((url) => {
      const page = byUrl.get(url);
      if (!page) {
        throw new Error(`Render target was not recorded by the selected crawl: ${url}`);
      }
      return { page, reasons: ['explicit'] };
    });
  }
  return crawl.pages.flatMap((page) => {
    const reasons: SiteRenderReason[] = [];
    if (!page.title) reasons.push('missing-title');
    if (!page.h1) reasons.push('missing-h1');
    if (page.wordCount < minStaticWordCount) reasons.push('thin-static-content');
    return reasons.length ? [{ page, reasons }] : [];
  });
}

function renderFailure(
  candidate: RenderCandidate,
  code: SiteRenderFailureCode,
  message: string,
): SiteRenderFailure {
  return { url: candidate.page.url, reasons: candidate.reasons, code, message };
}

function classifyRenderError(error: unknown): SiteRenderFailureCode {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (
    message.includes('browser') &&
    (message.includes('not found') || message.includes('executable'))
  ) {
    return 'browser-unavailable';
  }
  return message.includes('timeout') ? 'render-timeout' : 'navigation-failed';
}

function throwIfCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new SiteRenderCancelledError();
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  if (url.username || url.password) throw new Error('Render URLs must not contain credentials.');
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Render URLs must use HTTP or HTTPS.');
  }
  url.hash = '';
  return url.toString();
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${label} must be a positive integer.`);
  return value;
}

function nonnegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${label} must be a nonnegative integer.`);
  return value;
}
