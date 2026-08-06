import { createHash } from 'node:crypto';
import {
  seoPageEvidenceFileSchema,
  type SeoPageAnalyticsEvidence,
  type SeoPageCrawlEvidence,
  type SeoPageContentEvidence,
  type SeoPageEvidence,
  type SeoPageEvidenceFile,
  type SeoPageRenderEvidence,
  type SeoPageSearchEvidence,
} from '../schema/page-evidence.js';
import {
  assertCompatibleSeoPerformanceFiles,
  type SeoPerformanceFile,
  type SeoPerformanceRecord,
  type SeoPerformanceTargetMarket,
} from '../schema/performance.js';
import type { SiteCrawlPage, SiteCrawlSnapshot } from '../schema/site-crawl.js';
import type { SiteRenderSnapshot } from '../schema/site-render.js';

export type BuildSeoPageEvidenceOptions = {
  crawl: SiteCrawlSnapshot;
  render?: SiteRenderSnapshot;
  targetMarkets: SeoPerformanceTargetMarket[];
  searchConsole?: SeoPerformanceFile;
  ga4?: SeoPerformanceFile;
  generatedAt?: string;
};

export function buildSeoPageEvidence(options: BuildSeoPageEvidenceOptions): SeoPageEvidenceFile {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const performanceFiles = [options.searchConsole, options.ga4].filter(
    (file): file is SeoPerformanceFile => file !== undefined,
  );
  assertCompatibleSeoPerformanceFiles(performanceFiles);
  assertSource(options.searchConsole, 'google-search-console');
  assertSource(options.ga4, 'ga4');
  assertCrawlCompatibility(options.crawl, performanceFiles);
  assertRenderCompatibility(options.crawl, options.render);

  const siteUrl = normalizeSiteUrl(options.crawl.site.origin);
  const crawlPages = new Map(
    options.crawl.pages.map((page) => [normalizePagePath(page.url, siteUrl), page]),
  );
  const crawlFailures = groupCrawlFailures(options.crawl, siteUrl);
  const renderPages = new Map(
    (options.render?.pages ?? []).map((page) => [normalizePagePath(page.url, siteUrl), page]),
  );
  const renderFailures = groupRenderFailures(options.render, siteUrl);
  const searchRows = groupRecords(options.searchConsole, siteUrl);
  const analyticsRows = groupRecords(options.ga4, siteUrl);
  const paths = new Set([
    ...crawlPages.keys(),
    ...crawlFailures.keys(),
    ...renderPages.keys(),
    ...renderFailures.keys(),
    ...searchRows.keys(),
    ...analyticsRows.keys(),
  ]);
  const sourceFreshness = readSourceFreshness(options);
  const sampleData = performanceFiles.some((file) => file.evidence.sampleData);
  const pages = [...paths]
    .sort((left, right) => left.localeCompare(right))
    .map((pagePath) =>
      buildPage({
        pagePath,
        siteUrl,
        crawlPage: crawlPages.get(pagePath),
        crawlFailures: crawlFailures.get(pagePath),
        renderPage: renderPages.get(pagePath),
        renderFailures: renderFailures.get(pagePath),
        hasRenderSource: options.render !== undefined,
        searchRows: searchRows.get(pagePath),
        analyticsRows: analyticsRows.get(pagePath),
        hasSearchSource: options.searchConsole !== undefined,
        hasAnalyticsSource: options.ga4 !== undefined,
        sampleData,
        sourceFreshness,
        generatedAt,
      }),
    );
  const staleSources = sourceFreshness
    .filter((source) => source.freshUntil <= generatedAt)
    .map((source) => source.source);
  const limitations = buildLimitations(options, staleSources);

  return seoPageEvidenceFileSchema.parse({
    version: 1,
    platformId: options.crawl.platformId,
    siteUrl,
    targetMarkets: options.targetMarkets,
    generatedAt,
    sources: {
      crawl: {
        snapshotId: options.crawl.snapshotId,
        observedAt: options.crawl.freshness.observedAt,
        freshUntil: options.crawl.freshness.freshUntil,
        truncated: options.crawl.discovery.truncated,
        failureCount: options.crawl.summary.failureCount,
      },
      ...(options.render
        ? {
            render: {
              renderId: options.render.renderId,
              crawlSnapshotId: options.render.crawlSnapshotId,
              observedAt: options.render.freshness.observedAt,
              freshUntil: options.render.freshness.freshUntil,
              browser: options.render.source.browser,
              failureCount: options.render.summary.failureCount,
              truncated: options.render.summary.truncated,
            },
          }
        : {}),
      ...(options.searchConsole
        ? { searchConsole: performanceSourceReference(options.searchConsole) }
        : {}),
      ...(options.ga4 ? { ga4: performanceSourceReference(options.ga4) } : {}),
    },
    sampleData,
    freshness: {
      freshUntil: earliestFreshUntil(sourceFreshness),
      staleSources,
    },
    limitations,
    summary: {
      pageCount: pages.length,
      crawledPageCount: pages.filter((page) => page.crawl.state === 'available').length,
      crawlFailurePageCount: pages.filter((page) => page.crawl.state === 'failed').length,
      performanceOnlyPageCount: pages.filter(
        (page) =>
          page.crawl.state === 'not-present-in-source' &&
          (page.search.state === 'available' || page.analytics.state === 'available'),
      ).length,
      searchEvidencePageCount: pages.filter((page) => page.search.state === 'available').length,
      analyticsEvidencePageCount: pages.filter((page) => page.analytics.state === 'available')
        .length,
    },
    pages,
  });
}

type SourceFreshness = {
  source: 'crawl' | 'render' | 'search-console' | 'ga4';
  freshUntil: string;
};

type CanonicalEvidence = {
  state: 'self' | 'other-internal' | 'external' | 'missing';
  url?: string;
};

function buildPage(options: {
  pagePath: string;
  siteUrl: string;
  crawlPage?: SiteCrawlPage;
  crawlFailures?: Array<{ code: string; message: string; statusCode?: number }>;
  renderPage?: SiteRenderSnapshot['pages'][number];
  renderFailures?: Array<{ code: string; message: string }>;
  hasRenderSource: boolean;
  searchRows?: SeoPerformanceRecord[];
  analyticsRows?: SeoPerformanceRecord[];
  hasSearchSource: boolean;
  hasAnalyticsSource: boolean;
  sampleData: boolean;
  sourceFreshness: SourceFreshness[];
  generatedAt: string;
}): SeoPageEvidence {
  const freshUntil = earliestFreshUntil(options.sourceFreshness);
  const limitations: string[] = [];
  if (!options.crawlPage && !options.crawlFailures) {
    limitations.push('The page was not present in the crawl snapshot.');
  }
  if (options.crawlPage && options.crawlFailures?.length) {
    limitations.push(
      'The crawl recorded both page evidence and one or more failures for this URL.',
    );
  }
  if (options.hasSearchSource && !options.searchRows) {
    limitations.push(
      'The page was not present in the Search Console report; zero traffic is not assumed.',
    );
  }
  if (options.hasAnalyticsSource && !options.analyticsRows) {
    limitations.push('The page was not present in the GA4 report; zero activity is not assumed.');
  }
  if ((options.analyticsRows?.length ?? 0) > 1) {
    limitations.push(
      'Analytics users are summed across multiple provider rows and may not be deduplicated.',
    );
  }
  if (freshUntil <= options.generatedAt) {
    limitations.push('One or more source artifacts are stale.');
  }
  const crawl = buildCrawlEvidence(options.crawlPage, options.crawlFailures, options.siteUrl);
  const render = buildRenderEvidence(
    options.renderPage,
    options.renderFailures,
    options.hasRenderSource,
    options.siteUrl,
  );
  return {
    id: createPageId(options.siteUrl, options.pagePath),
    url: new URL(options.pagePath, options.siteUrl).toString(),
    path: options.pagePath,
    crawl,
    render,
    content: buildContentEvidence(crawl, render),
    search: buildSearchEvidence(options.searchRows, options.hasSearchSource),
    analytics: buildAnalyticsEvidence(options.analyticsRows, options.hasAnalyticsSource),
    evidence: {
      sampleData: options.sampleData,
      stale: freshUntil <= options.generatedAt,
      freshUntil,
      limitations,
    },
  };
}

function buildContentEvidence(
  crawl: SeoPageCrawlEvidence,
  render: SeoPageRenderEvidence,
): SeoPageContentEvidence {
  if (render.state === 'available') {
    return {
      state: 'available',
      source: 'browser-render',
      observedAt: render.renderedAt,
      ...(render.title ? { title: render.title } : {}),
      ...(render.metaDescription ? { metaDescription: render.metaDescription } : {}),
      ...(render.h1 ? { h1: render.h1 } : {}),
      wordCount: render.wordCount,
      internalLinkCount: render.internalLinkCount,
      externalLinkCount: render.externalLinkCount,
      canonical: render.canonical,
      robotsDirectives: render.robotsDirectives,
      schemaTypes: render.schemaTypes,
    };
  }
  if (crawl.state === 'available') {
    return {
      state: 'available',
      source: 'static-html',
      observedAt: crawl.fetchedAt,
      ...(crawl.title ? { title: crawl.title } : {}),
      ...(crawl.metaDescription ? { metaDescription: crawl.metaDescription } : {}),
      ...(crawl.h1 ? { h1: crawl.h1 } : {}),
      wordCount: crawl.wordCount,
      internalLinkCount: crawl.internalLinkCount,
      externalLinkCount: crawl.externalLinkCount,
      canonical: crawl.canonical,
      robotsDirectives: crawl.robotsDirectives,
      schemaTypes: crawl.schemaTypes,
    };
  }
  return { state: 'unavailable' };
}

function buildCrawlEvidence(
  page: SiteCrawlPage | undefined,
  failures: Array<{ code: string; message: string; statusCode?: number }> | undefined,
  siteUrl: string,
): SeoPageCrawlEvidence {
  if (page) {
    return {
      state: 'available',
      fetchedAt: page.fetchedAt,
      statusCode: page.statusCode,
      fetchState: page.fetchState,
      indexability: resolveIndexability(page),
      ...(page.title ? { title: page.title } : {}),
      ...(page.metaDescription ? { metaDescription: page.metaDescription } : {}),
      ...(page.h1 ? { h1: page.h1 } : {}),
      wordCount: page.wordCount,
      internalLinkCount: page.internalLinks.length,
      externalLinkCount: page.externalLinkCount,
      canonical: resolveCanonical(page, siteUrl),
      robotsDirectives: page.robotsDirectives,
      schemaTypes: page.schemaTypes,
    };
  }
  if (failures?.length) {
    return {
      state: 'failed',
      failures,
      indexability: 'unknown',
      canonical: { state: 'not-recorded' },
    };
  }
  return {
    state: 'not-present-in-source',
    indexability: 'unknown',
    canonical: { state: 'not-recorded' },
  };
}

function buildRenderEvidence(
  page: SiteRenderSnapshot['pages'][number] | undefined,
  failures: Array<{ code: string; message: string }> | undefined,
  sourceRecorded: boolean,
  siteUrl: string,
): SeoPageRenderEvidence {
  if (page) {
    return {
      state: 'available',
      renderedAt: page.renderedAt,
      finalUrl: page.finalUrl,
      reasons: page.reasons,
      ...(page.statusCode ? { statusCode: page.statusCode } : {}),
      ...(page.title ? { title: page.title } : {}),
      ...(page.metaDescription ? { metaDescription: page.metaDescription } : {}),
      ...(page.h1 ? { h1: page.h1 } : {}),
      wordCount: page.wordCount,
      internalLinkCount: page.internalLinks.length,
      externalLinkCount: page.externalLinkCount,
      canonical: resolveCanonical({ url: page.finalUrl, canonicalUrl: page.canonicalUrl }, siteUrl),
      robotsDirectives: page.robotsDirectives,
      schemaTypes: page.schemaTypes,
    };
  }
  if (failures?.length) return { state: 'failed', failures };
  return { state: sourceRecorded ? 'not-selected' : 'not-recorded' };
}

function buildSearchEvidence(
  rows: SeoPerformanceRecord[] | undefined,
  sourceRecorded: boolean,
): SeoPageSearchEvidence {
  if (!rows?.length) {
    return { state: sourceRecorded ? 'not-present-in-source' : 'not-recorded' };
  }
  const clicks = sum(rows, 'clicks');
  const impressions = sum(rows, 'impressions');
  const positionedRows = rows.filter((row) => row.position !== undefined);
  const weightedPositionTotal = positionedRows.reduce(
    (total, row) => total + (row.position ?? 0) * Math.max(row.impressions ?? 0, 1),
    0,
  );
  const positionWeight = positionedRows.reduce(
    (total, row) => total + Math.max(row.impressions ?? 0, 1),
    0,
  );
  return {
    state: 'available',
    rowCount: rows.length,
    queryCount: new Set(rows.flatMap((row) => row.query ?? [])).size,
    clicks,
    impressions,
    ...(impressions > 0 ? { ctr: clicks / impressions } : {}),
    ...(positionWeight > 0 ? { averagePosition: weightedPositionTotal / positionWeight } : {}),
  };
}

function buildAnalyticsEvidence(
  rows: SeoPerformanceRecord[] | undefined,
  sourceRecorded: boolean,
): SeoPageAnalyticsEvidence {
  if (!rows?.length) {
    return { state: sourceRecorded ? 'not-present-in-source' : 'not-recorded' };
  }
  return {
    state: 'available',
    rowCount: rows.length,
    ...sumOptional(rows, 'sessions'),
    ...sumOptional(rows, 'users'),
    ...sumOptional(rows, 'analyticsConversions'),
    ...sumOptional(rows, 'analyticsRevenue'),
  };
}

function sumOptional<
  TKey extends 'sessions' | 'users' | 'analyticsConversions' | 'analyticsRevenue',
>(rows: SeoPerformanceRecord[], key: TKey): Partial<Record<TKey, number>> {
  if (!rows.some((row) => row[key] !== undefined)) return {};
  const result: Partial<Record<TKey, number>> = {};
  result[key] = sum(rows, key);
  return result;
}

function sum(
  rows: SeoPerformanceRecord[],
  key:
    | 'clicks'
    | 'impressions'
    | 'sessions'
    | 'users'
    | 'analyticsConversions'
    | 'analyticsRevenue',
): number {
  return rows.reduce((total, row) => total + (row[key] ?? 0), 0);
}

function resolveIndexability(page: SiteCrawlPage): 'indexable' | 'noindex' | 'non-success-status' {
  if (page.statusCode < 200 || page.statusCode >= 300) {
    return 'non-success-status';
  }
  return page.robotsDirectives.some((directive) => directive.toLowerCase().includes('noindex'))
    ? 'noindex'
    : 'indexable';
}

function resolveCanonical(
  page: Pick<SiteCrawlPage, 'canonicalUrl' | 'url'>,
  siteUrl: string,
): CanonicalEvidence {
  if (!page.canonicalUrl) {
    return { state: 'missing' };
  }
  const canonical = new URL(page.canonicalUrl);
  const pageUrl = new URL(page.url);
  const site = new URL(siteUrl);
  const state =
    canonical.toString() === pageUrl.toString()
      ? 'self'
      : canonical.origin === site.origin
        ? 'other-internal'
        : 'external';
  return { state, url: canonical.toString() };
}

function groupCrawlFailures(
  crawl: SiteCrawlSnapshot,
  siteUrl: string,
): Map<string, Array<{ code: string; message: string; statusCode?: number }>> {
  const grouped = new Map<string, Array<{ code: string; message: string; statusCode?: number }>>();
  for (const failure of crawl.failures.filter((item) => item.stage === 'page')) {
    const path = normalizePagePath(failure.url, siteUrl);
    const current = grouped.get(path) ?? [];
    current.push({
      code: failure.code,
      message: failure.message,
      ...(failure.statusCode ? { statusCode: failure.statusCode } : {}),
    });
    grouped.set(path, current);
  }
  return grouped;
}

function groupRecords(
  file: SeoPerformanceFile | undefined,
  siteUrl: string,
): Map<string, SeoPerformanceRecord[]> {
  const grouped = new Map<string, SeoPerformanceRecord[]>();
  for (const record of file?.records ?? []) {
    const path = normalizePagePath(record.pagePath, siteUrl);
    const current = grouped.get(path) ?? [];
    current.push(record);
    grouped.set(path, current);
  }
  return grouped;
}

function groupRenderFailures(
  render: SiteRenderSnapshot | undefined,
  siteUrl: string,
): Map<string, Array<{ code: string; message: string }>> {
  const grouped = new Map<string, Array<{ code: string; message: string }>>();
  for (const failure of render?.failures ?? []) {
    const pagePath = normalizePagePath(failure.url, siteUrl);
    const current = grouped.get(pagePath) ?? [];
    current.push({ code: failure.code, message: failure.message });
    grouped.set(pagePath, current);
  }
  return grouped;
}

function normalizePagePath(value: string, siteUrl: string): string {
  const url = new URL(value, siteUrl);
  if (url.origin !== new URL(siteUrl).origin) {
    throw new Error(`Page evidence URL is outside the configured site: ${value}`);
  }
  return `${url.pathname}${url.search}` || '/';
}

function assertSource(
  file: SeoPerformanceFile | undefined,
  source: 'google-search-console' | 'ga4',
): void {
  if (file && file.source !== source) {
    throw new Error(`Expected ${source} performance evidence.`);
  }
}

function assertCrawlCompatibility(crawl: SiteCrawlSnapshot, files: SeoPerformanceFile[]): void {
  for (const file of files) {
    if (file.platformId !== crawl.platformId) {
      throw new Error('Crawl and performance evidence must belong to the same platform.');
    }
    if (new URL(file.siteUrl).origin !== new URL(crawl.site.origin).origin) {
      throw new Error('Crawl and performance evidence must belong to the same site.');
    }
  }
}

function assertRenderCompatibility(
  crawl: SiteCrawlSnapshot,
  render: SiteRenderSnapshot | undefined,
): void {
  if (!render) return;
  if (
    render.platformId !== crawl.platformId ||
    render.crawlSnapshotId !== crawl.snapshotId ||
    new URL(render.site.origin).origin !== new URL(crawl.site.origin).origin
  ) {
    throw new Error('Browser render evidence must belong to the selected crawl snapshot.');
  }
}

function readSourceFreshness(options: BuildSeoPageEvidenceOptions): SourceFreshness[] {
  return [
    { source: 'crawl', freshUntil: options.crawl.freshness.freshUntil } as const,
    ...(options.render
      ? [{ source: 'render' as const, freshUntil: options.render.freshness.freshUntil }]
      : []),
    ...(options.searchConsole
      ? [
          {
            source: 'search-console' as const,
            freshUntil: options.searchConsole.evidence.freshUntil,
          },
        ]
      : []),
    ...(options.ga4
      ? [{ source: 'ga4' as const, freshUntil: options.ga4.evidence.freshUntil }]
      : []),
  ];
}

function earliestFreshUntil(sources: SourceFreshness[]): string {
  const freshUntil = sources.map((source) => source.freshUntil).sort()[0];
  if (!freshUntil) {
    throw new Error('Page evidence requires at least one freshness-bearing source.');
  }
  return freshUntil;
}

function performanceSourceReference(file: SeoPerformanceFile) {
  return {
    property: file.property,
    dateRange: file.dateRange,
    evidence: file.evidence,
  };
}

function buildLimitations(
  options: BuildSeoPageEvidenceOptions,
  staleSources: Array<'crawl' | 'render' | 'search-console' | 'ga4'>,
): string[] {
  const limitations = options.render
    ? [
        'Browser rendering is bounded to selected pages; static crawl provenance remains authoritative for discovery.',
      ]
    : ['Crawl evidence represents static HTML and does not prove rendered browser behavior.'];
  if (options.render?.failures.length) {
    limitations.push(
      `${options.render.failures.length} browser render failure(s) remain recorded.`,
    );
  }
  if (options.crawl.discovery.truncated) {
    limitations.push('The crawl reached a configured discovery or request limit.');
  }
  if (options.crawl.failures.length > 0) {
    limitations.push(`${options.crawl.failures.length} crawl failure(s) remain recorded.`);
  }
  if (!options.searchConsole) {
    limitations.push('Search Console evidence was not supplied.');
  } else {
    limitations.push(...options.searchConsole.evidence.limitations);
  }
  if (!options.ga4) {
    limitations.push('GA4 evidence was not supplied.');
  } else {
    limitations.push(...options.ga4.evidence.limitations);
  }
  if (staleSources.length > 0) {
    limitations.push(`Stale sources: ${staleSources.join(', ')}.`);
  }
  return [...new Set(limitations)];
}

function createPageId(siteUrl: string, pagePath: string): string {
  return `page-${createHash('sha1').update(`${siteUrl}|${pagePath}`).digest('hex').slice(0, 16)}`;
}

function normalizeSiteUrl(value: string): string {
  return `${new URL(value).origin}/`;
}
