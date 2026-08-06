import { createHash } from 'node:crypto';
import {
  competitorResearchFileSchema,
  type CompetitorPage,
  type CompetitorResearchFile,
} from '../schema/competitor.js';
import { fetchSiteCrawlResponse, readSiteCrawlResponseText } from '../site-crawl/request.js';
import { isRobotsAllowed, parseRobotsText, type RobotsPolicy } from '../site-crawl/robots.js';
import { extractCompetitorHtmlMetadata } from './extract-html.js';

export type CompetitorUrlInput = {
  url: string;
  keyword?: string;
  position?: number;
  pageType?: string;
  notes?: string;
};

export type FetchLike = typeof fetch;

export type FetchCompetitorUrlsOptions = {
  platformId: string;
  urls: CompetitorUrlInput[];
  market?: string;
  sourceFile?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  userAgent?: string;
  maxPages?: number;
  maxResponseBytes?: number;
  now?: () => Date;
};

export type FetchCompetitorUrlsResult = {
  competitorFile: CompetitorResearchFile;
  failedUrls: Array<{ url: string; message: string }>;
};

export async function fetchCompetitorUrls(
  options: FetchCompetitorUrlsOptions,
): Promise<FetchCompetitorUrlsResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxPages = options.maxPages ?? 25;
  const userAgent = options.userAgent ?? 'UnisaneOpsSEOResearch/1.0';
  const maxResponseBytes = options.maxResponseBytes ?? 2_000_000;
  const requestedUrls = options.urls.slice(0, maxPages);
  const pages: CompetitorPage[] = [];
  const failedUrls: Array<{ url: string; message: string }> = [];
  const robotsByOrigin = new Map<string, Promise<RobotsPolicy>>();

  for (const [index, input] of requestedUrls.entries()) {
    try {
      const targetUrl = new URL(input.url);
      const robotsPolicy = await loadRobotsPolicy({
        origin: targetUrl.origin,
        fetchImpl,
        timeoutMs: options.timeoutMs ?? 10_000,
        userAgent,
        maxResponseBytes: Math.min(maxResponseBytes, 500_000),
        cache: robotsByOrigin,
      });
      if (!isRobotsAllowed(robotsPolicy, targetUrl, userAgent)) {
        throw new Error('Robots policy disallows this URL.');
      }
      const html = await fetchHtml({
        url: input.url,
        fetchImpl,
        timeoutMs: options.timeoutMs ?? 10_000,
        userAgent,
        maxResponseBytes,
      });
      const metadata = extractCompetitorHtmlMetadata({ html, url: input.url });
      pages.push(
        createCompetitorPage({
          input,
          metadata,
          index,
          platformId: options.platformId,
          sourceFile: options.sourceFile,
        }),
      );
    } catch (error: unknown) {
      failedUrls.push({
        url: input.url,
        message: error instanceof Error ? error.message : 'Unknown fetch error',
      });
    }
  }

  return {
    competitorFile: competitorResearchFileSchema.parse({
      version: 1,
      platformId: options.platformId,
      market: cleanOptional(options.market),
      source: 'url-fetch',
      evidence: {
        observedAt: (options.now ?? (() => new Date()))().toISOString(),
        sampleData: false,
        limitations: [
          `Static HTML metadata fetch was bounded to ${maxPages} pages and ${maxResponseBytes} bytes per response.`,
          'robots.txt retrieval and policy evaluation were attempted per origin before page retrieval.',
          ...(failedUrls.length > 0
            ? [`${failedUrls.length} URL fetch failure(s) were recorded.`]
            : []),
        ],
        failures: failedUrls.map((failure) => ({ url: failure.url, reason: failure.message })),
      },
      pages,
    }),
    failedUrls,
  };
}

async function fetchHtml(options: {
  url: string;
  fetchImpl: FetchLike;
  timeoutMs: number;
  userAgent: string;
  maxResponseBytes: number;
}): Promise<string> {
  const response = await fetchSiteCrawlResponse(options.url, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': options.userAgent,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('html')) {
    throw new Error(`Expected HTML response, received ${contentType}`);
  }
  return readSiteCrawlResponseText(response, options.maxResponseBytes);
}

async function loadRobotsPolicy(options: {
  origin: string;
  fetchImpl: FetchLike;
  timeoutMs: number;
  userAgent: string;
  maxResponseBytes: number;
  cache: Map<string, Promise<RobotsPolicy>>;
}): Promise<RobotsPolicy> {
  const cached = options.cache.get(options.origin);
  if (cached) return cached;
  const pending = (async () => {
    const response = await fetchSiteCrawlResponse(`${options.origin}/robots.txt`, {
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      headers: { accept: 'text/plain,*/*', 'user-agent': options.userAgent },
    });
    if (response.status === 404) return parseRobotsText('');
    if (!response.ok) throw new Error(`robots.txt request failed with HTTP ${response.status}.`);
    return parseRobotsText(await readSiteCrawlResponseText(response, options.maxResponseBytes));
  })();
  options.cache.set(options.origin, pending);
  return pending;
}

function createCompetitorPage(options: {
  input: CompetitorUrlInput;
  metadata: ReturnType<typeof extractCompetitorHtmlMetadata>;
  index: number;
  platformId: string;
  sourceFile?: string;
}): CompetitorPage {
  const domain = getDomain(options.input.url);
  const page: CompetitorPage = {
    id: `competitor-${stableId(options.input.url, options.index)}`,
    platformId: options.platformId,
    source: 'url-fetch',
    sourceFile: cleanOptional(options.sourceFile),
    keyword: cleanOptional(options.input.keyword),
    position: options.input.position,
    url: options.input.url,
    domain,
    title: options.metadata.title,
    h1: options.metadata.h1,
    metaDescription: options.metadata.metaDescription,
    canonicalUrl: options.metadata.canonicalUrl,
    pageType: cleanOptional(options.input.pageType),
    categoryPath: options.metadata.categoryPath,
    headings: options.metadata.headings,
    contentPatterns: options.metadata.contentPatterns,
    keywordSignals: options.metadata.keywordSignals,
    onPageSignals: options.metadata.onPageSignals,
    notes: cleanOptional(options.input.notes),
  };

  return page;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown-domain';
  }
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function stableId(value: string, fallbackIndex: number): string {
  const seed = value.length > 0 ? value : String(fallbackIndex + 1);
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}
