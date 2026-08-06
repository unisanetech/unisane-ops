import { describe, expect, it } from 'vitest';
import type { SiteCrawlSnapshot } from '../schema/site-crawl.js';
import { renderSite, SiteRenderCancelledError, type SitePageRenderer } from './render-site.js';

describe('targeted browser render evidence', () => {
  it('selects only static evidence gaps and records separate rendered evidence', async () => {
    const renderedUrls: string[] = [];
    const snapshot = await renderSite({
      crawl: createCrawl(),
      renderer: createRenderer(renderedUrls),
      maxPages: 1,
      now: sequenceClock([
        '2026-08-04T00:00:00.000Z',
        '2026-08-04T00:00:01.000Z',
        '2026-08-04T00:00:02.000Z',
      ]),
    });

    expect(renderedUrls).toEqual(['https://example.test/thin']);
    expect(snapshot).toMatchObject({
      source: { kind: 'local-browser-render', driver: 'playwright', javascript: true },
      sampleData: false,
      pages: [
        {
          url: 'https://example.test/thin',
          title: 'Rendered title',
          h1: 'Rendered heading',
          reasons: ['missing-title', 'missing-h1', 'thin-static-content'],
        },
      ],
      summary: { selectedPageCount: 1, renderedPageCount: 1, failureCount: 0 },
    });
  });

  it('rejects explicit targets that were not recorded by the crawl', async () => {
    await expect(
      renderSite({
        crawl: createCrawl(),
        renderer: createRenderer([]),
        urls: ['https://example.test/not-recorded'],
      }),
    ).rejects.toThrow('not recorded');
  });

  it('records an offsite redirect without accepting its content', async () => {
    const renderer = createRenderer([]);
    renderer.render = async () => ({
      finalUrl: 'https://outside.test/',
      html: '<title>Outside</title>',
      statusCode: 200,
    });
    const snapshot = await renderSite({
      crawl: createCrawl(),
      renderer,
      urls: ['https://example.test/thin'],
    });
    expect(snapshot.pages).toEqual([]);
    expect(snapshot.failures).toMatchObject([{ code: 'offsite-redirect' }]);
  });

  it('closes the renderer and reports cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    let closed = false;
    const renderer = createRenderer([]);
    renderer.close = async () => {
      closed = true;
    };
    await expect(
      renderSite({ crawl: createCrawl(), renderer, signal: controller.signal }),
    ).rejects.toBeInstanceOf(SiteRenderCancelledError);
    expect(closed).toBe(true);
  });
});

function createRenderer(renderedUrls: string[]): SitePageRenderer {
  return {
    driver: 'playwright',
    browser: 'test-browser',
    async render(request) {
      renderedUrls.push(request.url);
      return {
        finalUrl: request.url,
        statusCode: 200,
        html: '<html><head><title>Rendered title</title></head><body><h1>Rendered heading</h1><p>Useful rendered content.</p></body></html>',
      };
    },
    async close() {},
  };
}

function createCrawl(): SiteCrawlSnapshot {
  const page = (url: string, wordCount: number, title?: string, h1?: string) => ({
    url,
    depth: 0,
    discoveredBy: ['seed' as const],
    fetchedAt: '2026-08-04T00:00:00.000Z',
    evidenceObservedAt: '2026-08-04T00:00:00.000Z',
    statusCode: 200,
    contentType: 'text/html',
    fetchState: 'fresh' as const,
    contentHash: `hash-${url}`,
    ...(title ? { title } : {}),
    ...(h1 ? { h1 } : {}),
    headings: [],
    robotsDirectives: [],
    schemaTypes: [],
    wordCount,
    internalLinks: [],
    externalLinkCount: 0,
  });
  return {
    version: 1,
    snapshotId: 'crawl-1',
    platformId: 'example',
    site: { requestedUrl: 'https://example.test/', origin: 'https://example.test/' },
    source: { kind: 'local-http-crawl', userAgent: 'test', staticHtmlOnly: true },
    sampleData: false,
    startedAt: '2026-08-04T00:00:00.000Z',
    completedAt: '2026-08-04T00:00:00.000Z',
    freshness: {
      observedAt: '2026-08-04T00:00:00.000Z',
      freshUntil: '2026-08-05T00:00:00.000Z',
    },
    limits: {
      maxPages: 10,
      maxDepth: 1,
      maxSitemaps: 1,
      maxDiscoveredUrls: 100,
      maxResponseBytes: 1_000_000,
      timeoutMs: 10_000,
    },
    discovery: { sitemapUrls: [], discoveredUrlCount: 2, truncated: false },
    pages: [
      page('https://example.test/thin', 10),
      page('https://example.test/complete', 500, 'Complete', 'Complete'),
    ],
    failures: [],
    summary: { pageCount: 2, failureCount: 0, changedPageCount: 2, reusedPageCount: 0 },
  };
}

function sequenceClock(values: string[]): () => Date {
  const fallback = values[0];
  if (!fallback) throw new Error('Sequence clock requires at least one value.');
  let index = 0;
  return () => new Date(values[Math.min(index++, values.length - 1)] ?? fallback);
}
