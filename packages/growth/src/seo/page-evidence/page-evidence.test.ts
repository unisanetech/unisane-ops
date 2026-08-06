import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SeoPerformanceFile } from '../schema/performance.js';
import type { SiteCrawlSnapshot } from '../schema/site-crawl.js';
import type { SiteRenderSnapshot } from '../schema/site-render.js';
import { configureSeoResearchWorkspace } from '../workspace/configure.js';
import { buildSeoPageEvidence } from './build-inventory.js';
import { generateSeoPageEvidenceFile } from './generate-file.js';

describe('SEO page evidence inventory', () => {
  it('reconciles the union of crawl, failure, search, and Analytics page evidence', () => {
    const artifact = buildSeoPageEvidence({
      crawl: createCrawl(),
      targetMarkets: markets,
      searchConsole: createSearchConsole(),
      ga4: createGa4(),
      generatedAt: '2026-08-04T01:00:00.000Z',
    });

    expect(artifact.summary).toEqual({
      pageCount: 3,
      crawledPageCount: 1,
      crawlFailurePageCount: 1,
      performanceOnlyPageCount: 1,
      searchEvidencePageCount: 2,
      analyticsEvidencePageCount: 1,
    });
    expect(artifact.pages.find((page) => page.path === '/guide')).toMatchObject({
      crawl: { state: 'available', indexability: 'indexable' },
      search: {
        state: 'available',
        rowCount: 2,
        queryCount: 2,
        clicks: 5,
        impressions: 30,
        ctr: 5 / 30,
        averagePosition: 10 / 3,
      },
      analytics: {
        state: 'available',
        sessions: 12,
        analyticsConversions: 2,
      },
    });
    expect(artifact.pages.find((page) => page.path === '/failed')).toMatchObject({
      crawl: { state: 'failed' },
      search: { state: 'not-present-in-source' },
      analytics: { state: 'not-present-in-source' },
    });
    expect(artifact.pages.find((page) => page.path === '/search-only')).toMatchObject({
      crawl: { state: 'not-present-in-source' },
      search: { state: 'available', clicks: 7 },
    });
  });

  it('preserves sample and stale evidence instead of treating it as current live truth', () => {
    const searchConsole = createSearchConsole();
    searchConsole.evidence.sampleData = true;
    const artifact = buildSeoPageEvidence({
      crawl: createCrawl(),
      targetMarkets: markets,
      searchConsole,
      generatedAt: '2026-08-06T00:00:00.000Z',
    });

    expect(artifact.sampleData).toBe(true);
    expect(artifact.freshness.staleSources).toEqual(['crawl', 'search-console']);
    expect(artifact.limitations).toContain('Stale sources: crawl, search-console.');
    expect(artifact.pages.every((page) => page.evidence.stale)).toBe(true);
  });

  it('keeps static crawl provenance and exposes valid rendered page evidence separately', () => {
    const artifact = buildSeoPageEvidence({
      crawl: createCrawl(),
      render: createRender(),
      targetMarkets: markets,
      generatedAt: '2026-08-04T01:00:00.000Z',
    });

    expect(artifact.sources).toMatchObject({
      crawl: { snapshotId: 'crawl-1' },
      render: { renderId: 'render-1', crawlSnapshotId: 'crawl-1' },
    });
    expect(artifact.pages.find((page) => page.path === '/guide')).toMatchObject({
      crawl: { state: 'available', title: 'Guide', wordCount: 500 },
      render: {
        state: 'available',
        title: 'Rendered guide',
        h1: 'Rendered guide',
        wordCount: 650,
      },
      content: { state: 'available', source: 'browser-render', title: 'Rendered guide' },
    });
    expect(artifact.limitations).not.toContain(
      'Crawl evidence represents static HTML and does not prove rendered browser behavior.',
    );
  });

  it('rejects performance evidence from another site', () => {
    const searchConsole = createSearchConsole();
    searchConsole.siteUrl = 'https://other.test/';

    expect(() =>
      buildSeoPageEvidence({
        crawl: createCrawl(),
        targetMarkets: markets,
        searchConsole,
      }),
    ).toThrow('same site');
  });

  it('uses conservative workspace defaults and validates configured provider bindings', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-page-evidence-'));
    try {
      await configureSeoResearchWorkspace({
        cwd,
        platformId: 'example',
        siteUrl: 'https://example.test/',
        markets,
        ownershipConfirmed: true,
        searchConsoleProperty: 'sc-domain:example.test',
        ga4Property: '123456',
      });
      const root = path.join(cwd, 'docs/domains/seo/keyword-research');
      await mkdir(path.join(root, 'site-crawls'), { recursive: true });
      await mkdir(path.join(root, 'normalized'), { recursive: true });
      await writeFile(
        path.join(root, 'site-crawls/latest.json'),
        JSON.stringify(createCrawl(), null, 2),
      );
      await writeFile(
        path.join(root, 'normalized/search-console-performance.latest.json'),
        JSON.stringify(createSearchConsole(), null, 2),
      );
      await writeFile(
        path.join(root, 'normalized/ga4-performance.latest.json'),
        JSON.stringify(createGa4(), null, 2),
      );

      const result = await generateSeoPageEvidenceFile({
        cwd,
        now: () => new Date('2026-08-04T01:00:00.000Z'),
      });
      const artifact = JSON.parse(await readFile(path.join(cwd, result.output), 'utf8')) as {
        version: number;
        summary: { pageCount: number };
      };

      expect(result.output).toBe(
        'docs/domains/seo/keyword-research/page-audits/page-evidence.latest.json',
      );
      expect(artifact).toMatchObject({ version: 1, summary: { pageCount: 3 } });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

const markets = [{ country: 'US', language: 'en' }];

function createCrawl(): SiteCrawlSnapshot {
  return {
    version: 1,
    snapshotId: 'crawl-1',
    platformId: 'example',
    site: { requestedUrl: 'https://example.test/', origin: 'https://example.test/' },
    source: { kind: 'local-http-crawl', userAgent: 'test', staticHtmlOnly: true },
    sampleData: false,
    startedAt: '2026-08-04T00:00:00.000Z',
    completedAt: '2026-08-04T00:01:00.000Z',
    freshness: {
      observedAt: '2026-08-04T00:01:00.000Z',
      freshUntil: '2026-08-05T00:01:00.000Z',
    },
    limits: {
      maxPages: 100,
      maxDepth: 2,
      maxSitemaps: 10,
      maxDiscoveredUrls: 1_000,
      maxResponseBytes: 2_000_000,
      timeoutMs: 10_000,
    },
    discovery: { sitemapUrls: [], discoveredUrlCount: 2, truncated: false },
    pages: [
      {
        url: 'https://example.test/guide',
        depth: 0,
        discoveredBy: ['seed'],
        fetchedAt: '2026-08-04T00:00:30.000Z',
        evidenceObservedAt: '2026-08-04T00:00:30.000Z',
        statusCode: 200,
        contentType: 'text/html',
        fetchState: 'fresh',
        contentHash: 'hash',
        title: 'Guide',
        metaDescription: 'A useful guide.',
        canonicalUrl: 'https://example.test/guide',
        h1: 'Guide',
        headings: ['Guide'],
        robotsDirectives: [],
        schemaTypes: ['Article'],
        wordCount: 500,
        internalLinks: ['https://example.test/'],
        externalLinkCount: 1,
      },
    ],
    failures: [
      {
        url: 'https://example.test/failed',
        stage: 'page',
        code: 'http-status',
        message: 'HTTP 500',
        statusCode: 500,
      },
    ],
    summary: {
      pageCount: 1,
      failureCount: 1,
      changedPageCount: 1,
      reusedPageCount: 0,
    },
  };
}

function createSearchConsole(): SeoPerformanceFile {
  return {
    version: 2,
    platformId: 'example',
    source: 'google-search-console',
    siteUrl: 'https://example.test/',
    targetMarkets: markets,
    property: 'sc-domain:example.test',
    dateRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
    evidence: performanceEvidence(false),
    records: [
      searchRecord('search-1', '/guide', 'guide', 2, 10, 2),
      searchRecord('search-2', '/guide', 'help guide', 3, 20, 4),
      searchRecord('search-3', '/search-only', 'search only', 7, 50, 6),
    ],
  };
}

function createRender(): SiteRenderSnapshot {
  return {
    version: 1,
    renderId: 'render-1',
    platformId: 'example',
    site: { origin: 'https://example.test/' },
    crawlSnapshotId: 'crawl-1',
    source: {
      kind: 'local-browser-render',
      driver: 'playwright',
      browser: 'chromium:chrome',
      javascript: true,
    },
    sampleData: false,
    startedAt: '2026-08-04T00:02:00.000Z',
    completedAt: '2026-08-04T00:02:10.000Z',
    freshness: {
      observedAt: '2026-08-04T00:02:10.000Z',
      freshUntil: '2026-08-05T00:02:10.000Z',
    },
    limits: { maxPages: 10, timeoutMs: 15_000, settleMs: 500, minStaticWordCount: 80 },
    pages: [
      {
        url: 'https://example.test/guide',
        finalUrl: 'https://example.test/guide',
        reasons: ['explicit'],
        renderedAt: '2026-08-04T00:02:05.000Z',
        statusCode: 200,
        contentHash: 'render-hash',
        title: 'Rendered guide',
        h1: 'Rendered guide',
        headings: [],
        robotsDirectives: [],
        schemaTypes: ['Article'],
        wordCount: 650,
        internalLinks: [],
        externalLinkCount: 0,
      },
    ],
    failures: [],
    summary: { selectedPageCount: 1, renderedPageCount: 1, failureCount: 0, truncated: false },
  };
}

function createGa4(): SeoPerformanceFile {
  return {
    version: 2,
    platformId: 'example',
    source: 'ga4',
    siteUrl: 'https://example.test/',
    targetMarkets: markets,
    property: 'properties/123456',
    dateRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
    evidence: performanceEvidence(false),
    records: [
      {
        id: 'ga4-1',
        platformId: 'example',
        source: 'ga4',
        pagePath: '/guide',
        sessions: 12,
        users: 9,
        analyticsConversions: 2,
      },
    ],
  };
}

function searchRecord(
  id: string,
  pagePath: string,
  query: string,
  clicks: number,
  impressions: number,
  position: number,
) {
  return {
    id,
    platformId: 'example',
    source: 'google-search-console' as const,
    pagePath,
    query,
    clicks,
    impressions,
    position,
  };
}

function performanceEvidence(sampleData: boolean): SeoPerformanceFile['evidence'] {
  return {
    acquisition: 'api',
    sampleData,
    observedAt: '2026-08-04T00:00:00.000Z',
    freshUntil: '2026-08-05T00:00:00.000Z',
    limitations: [],
  };
}
