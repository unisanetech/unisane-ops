import { createHash } from 'node:crypto';
import {
  siteCrawlSnapshotSchema,
  type SiteCrawlDiscoverySource,
  type SiteCrawlFailure,
  type SiteCrawlPage,
  type SiteCrawlSnapshot,
} from '../schema/site-crawl.js';
import { discoverSiteCrawlSitemapUrls, loadSiteCrawlRobotsPolicy } from './discovery.js';
import { throwIfSiteCrawlCancelled } from './errors.js';
import { fetchSiteCrawlPageEvidence } from './fetch-page.js';
import type { SiteCrawlFetch } from './request.js';
import { isRobotsAllowed } from './robots.js';
import { normalizeSameOriginSiteCrawlUrl, normalizeSiteCrawlRequestedUrl } from './url-policy.js';

export { SiteCrawlCancelledError } from './errors.js';
export type { SiteCrawlFetch } from './request.js';

export type CrawlSiteOptions = {
  platformId: string;
  siteUrl: string;
  previousSnapshot?: SiteCrawlSnapshot;
  fetchImpl?: SiteCrawlFetch;
  signal?: AbortSignal;
  userAgent?: string;
  maxPages?: number;
  maxDepth?: number;
  maxSitemaps?: number;
  maxDiscoveredUrls?: number;
  maxResponseBytes?: number;
  timeoutMs?: number;
  freshnessHours?: number;
  discoverSitemaps?: boolean;
  now?: () => Date;
};

type CrawlLimits = SiteCrawlSnapshot['limits'];

type DiscoveryQueueEntry = {
  url: string;
  depth: number;
};

const defaultUserAgent = 'UnisaneGrowthCrawler/1.0';

export async function crawlSite(options: CrawlSiteOptions): Promise<SiteCrawlSnapshot> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const requestedUrl = normalizeSiteCrawlRequestedUrl(options.siteUrl);
  const siteOrigin = new URL(requestedUrl).origin;
  const userAgent = options.userAgent?.trim() || defaultUserAgent;
  const limits = resolveLimits(options);
  validatePreviousSnapshot(options.previousSnapshot, options.platformId, siteOrigin);
  const startedAt = now().toISOString();
  const failures: SiteCrawlFailure[] = [];

  throwIfSiteCrawlCancelled(options.signal);
  const robots = await loadSiteCrawlRobotsPolicy({
    origin: siteOrigin,
    fetchImpl,
    signal: options.signal,
    timeoutMs: limits.timeoutMs,
    maxResponseBytes: limits.maxResponseBytes,
    userAgent,
    failures,
  });
  const sitemapDiscovery =
    options.discoverSitemaps === false || limits.maxSitemaps === 0
      ? { pageUrls: [], fetchedSitemaps: [] }
      : await discoverSiteCrawlSitemapUrls({
          origin: siteOrigin,
          initialSitemaps: robots.sitemapUrls.length
            ? robots.sitemapUrls
            : [new URL('/sitemap.xml', siteOrigin).href],
          fetchImpl,
          signal: options.signal,
          timeoutMs: limits.timeoutMs,
          userAgent,
          maxSitemaps: limits.maxSitemaps,
          maxUrls: limits.maxDiscoveredUrls,
          maxResponseBytes: limits.maxResponseBytes,
          failures,
        });

  const discovery = createDiscoveryQueue(siteOrigin, limits.maxDiscoveredUrls);
  discovery.add(requestedUrl, 0, 'seed');
  for (const url of sitemapDiscovery.pageUrls) {
    discovery.add(url, 0, 'sitemap');
  }

  const previousPages = new Map(
    (options.previousSnapshot?.pages ?? []).map((page) => [page.url, page] as const),
  );
  const pages: SiteCrawlPage[] = [];
  let attemptedPages = 0;
  let queueIndex = 0;
  while (queueIndex < discovery.queue.length && attemptedPages < limits.maxPages) {
    throwIfSiteCrawlCancelled(options.signal);
    const entry = discovery.queue[queueIndex];
    queueIndex += 1;
    if (!entry) {
      continue;
    }
    attemptedPages += 1;
    if (!isRobotsAllowed(robots, new URL(entry.url), userAgent)) {
      failures.push(createRobotsDenial(entry.url));
      continue;
    }

    const page = await fetchSiteCrawlPageEvidence({
      url: entry.url,
      depth: discovery.depthByUrl.get(entry.url) ?? entry.depth,
      discoveredBy: [
        ...(discovery.sourcesByUrl.get(entry.url) ?? new Set(['internal-link'])),
      ].sort(),
      previousPage: previousPages.get(entry.url),
      siteOrigin,
      fetchImpl,
      signal: options.signal,
      timeoutMs: limits.timeoutMs,
      maxResponseBytes: limits.maxResponseBytes,
      userAgent,
      now,
      failures,
    });
    if (!page) {
      continue;
    }
    pages.push(page);
    if (shouldExpandPage(page, entry.depth, limits.maxDepth)) {
      for (const link of page.internalLinks) {
        discovery.add(link, entry.depth + 1, 'internal-link');
      }
    }
  }

  const completed = now();
  const completedAt = completed.toISOString();
  const sortedPages = pages.sort((left, right) => left.url.localeCompare(right.url));
  const sortedFailures = sortFailures(failures);
  const snapshotId = createSnapshotId({
    platformId: options.platformId,
    origin: siteOrigin,
    completedAt,
    pages: sortedPages,
  });
  const freshUntil = new Date(
    completed.getTime() + (options.freshnessHours ?? 24) * 60 * 60 * 1000,
  ).toISOString();

  return siteCrawlSnapshotSchema.parse({
    version: 1,
    snapshotId,
    platformId: options.platformId,
    site: { requestedUrl, origin: siteOrigin },
    source: { kind: 'local-http-crawl', userAgent, staticHtmlOnly: true },
    sampleData: false,
    startedAt,
    completedAt,
    freshness: { observedAt: completedAt, freshUntil },
    ...(options.previousSnapshot
      ? { previousSnapshotId: options.previousSnapshot.snapshotId }
      : {}),
    limits,
    discovery: {
      sitemapUrls: sitemapDiscovery.fetchedSitemaps,
      discoveredUrlCount: discovery.sourcesByUrl.size,
      truncated: discovery.isTruncated() || queueIndex < discovery.queue.length,
    },
    pages: sortedPages,
    failures: sortedFailures,
    summary: summarizeCrawl(sortedPages, sortedFailures),
  });
}

function createDiscoveryQueue(
  origin: string,
  maxUrls: number,
): {
  queue: DiscoveryQueueEntry[];
  sourcesByUrl: Map<string, Set<SiteCrawlDiscoverySource>>;
  depthByUrl: Map<string, number>;
  add: (value: string, depth: number, source: SiteCrawlDiscoverySource) => void;
  isTruncated: () => boolean;
} {
  const queue: DiscoveryQueueEntry[] = [];
  const sourcesByUrl = new Map<string, Set<SiteCrawlDiscoverySource>>();
  const depthByUrl = new Map<string, number>();
  let truncated = false;
  return {
    queue,
    sourcesByUrl,
    depthByUrl,
    add(value, depth, source) {
      const url = normalizeSameOriginSiteCrawlUrl(value, origin);
      if (!url) {
        return;
      }
      const sources = sourcesByUrl.get(url);
      if (sources) {
        sources.add(source);
        depthByUrl.set(url, Math.min(depthByUrl.get(url) ?? depth, depth));
        return;
      }
      if (sourcesByUrl.size >= maxUrls) {
        truncated = true;
        return;
      }
      sourcesByUrl.set(url, new Set([source]));
      depthByUrl.set(url, depth);
      queue.push({ url, depth });
    },
    isTruncated: () => truncated,
  };
}

function resolveLimits(options: CrawlSiteOptions): CrawlLimits {
  const maxPages = positiveInteger(options.maxPages, 100, 'maxPages');
  return {
    maxPages,
    maxDepth: nonnegativeInteger(options.maxDepth, 2, 'maxDepth'),
    maxSitemaps: nonnegativeInteger(options.maxSitemaps, 10, 'maxSitemaps'),
    maxDiscoveredUrls: positiveInteger(
      options.maxDiscoveredUrls,
      Math.max(maxPages, maxPages * 10),
      'maxDiscoveredUrls',
    ),
    maxResponseBytes: positiveInteger(options.maxResponseBytes, 2_000_000, 'maxResponseBytes'),
    timeoutMs: positiveInteger(options.timeoutMs, 10_000, 'timeoutMs'),
  };
}

function positiveInteger(value: number | undefined, fallback: number, label: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return resolved;
}

function nonnegativeInteger(value: number | undefined, fallback: number, label: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 0) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
  return resolved;
}

function validatePreviousSnapshot(
  snapshot: SiteCrawlSnapshot | undefined,
  platformId: string,
  origin: string,
): void {
  if (!snapshot) {
    return;
  }
  siteCrawlSnapshotSchema.parse(snapshot);
  if (snapshot.platformId !== platformId || snapshot.site.origin !== origin) {
    throw new Error('Previous crawl snapshot belongs to a different platform or site origin.');
  }
}

function createRobotsDenial(url: string): SiteCrawlFailure {
  return {
    url,
    stage: 'page',
    code: 'robots-disallowed',
    message: 'robots.txt disallows this URL for the configured crawler user agent.',
  };
}

function shouldExpandPage(page: SiteCrawlPage, depth: number, maxDepth: number): boolean {
  return (
    depth < maxDepth &&
    !page.robotsDirectives.includes('nofollow') &&
    !page.robotsDirectives.includes('none')
  );
}

function sortFailures(failures: SiteCrawlFailure[]): SiteCrawlFailure[] {
  return failures.sort(
    (left, right) =>
      left.url.localeCompare(right.url) ||
      left.stage.localeCompare(right.stage) ||
      left.code.localeCompare(right.code),
  );
}

function summarizeCrawl(
  pages: SiteCrawlPage[],
  failures: SiteCrawlFailure[],
): SiteCrawlSnapshot['summary'] {
  return {
    pageCount: pages.length,
    failureCount: failures.length,
    changedPageCount: pages.filter(
      (page) => page.fetchState === 'fresh' || page.fetchState === 'changed',
    ).length,
    reusedPageCount: pages.filter(
      (page) => page.fetchState === 'not-modified' || page.fetchState === 'unchanged',
    ).length,
  };
}

function createSnapshotId(options: {
  platformId: string;
  origin: string;
  completedAt: string;
  pages: SiteCrawlPage[];
}): string {
  const digest = createHash('sha256')
    .update(options.platformId)
    .update(options.origin)
    .update(options.completedAt)
    .update(options.pages.map((page) => `${page.url}:${page.contentHash}`).join('|'))
    .digest('hex')
    .slice(0, 20);
  return `site-crawl-${digest}`;
}
