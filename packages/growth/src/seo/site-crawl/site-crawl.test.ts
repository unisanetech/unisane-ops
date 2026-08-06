import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteCrawlSnapshotSchema } from '../schema/site-crawl.js';
import { crawlSiteFile } from './crawl-file.js';
import { crawlSite, SiteCrawlCancelledError, type SiteCrawlFetch } from './crawl-site.js';
import { extractSitePageEvidence } from './extract-page.js';
import { isRobotsAllowed, parseRobotsText } from './robots.js';
import { parseSitemapXml } from './sitemap.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('site crawl evidence extraction', () => {
  it('extracts readable metadata and deduplicated same-origin links from static HTML', () => {
    const evidence = extractSitePageEvidence({
      url: 'https://example.test/start',
      siteOrigin: 'https://example.test',
      html: `<!doctype html><html><head>
        <title> Example page </title>
        <meta name="description" content="A useful page">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="/canonical">
        <script type="application/ld+json">{"@type":"Article"}</script>
      </head><body>
        <h1>Primary heading</h1><h2>Details</h2>
        <p>Readable evidence for the local crawler.</p>
        <a href="/next#section">Next</a><a href="/next">Next again</a>
        <a href="https://outside.test/page">Outside</a>
      </body></html>`,
    });

    expect(evidence).toMatchObject({
      title: 'Example page',
      metaDescription: 'A useful page',
      canonicalUrl: 'https://example.test/canonical',
      h1: 'Primary heading',
      headings: ['Details'],
      robotsDirectives: ['follow', 'index'],
      schemaTypes: ['Article'],
      internalLinks: ['https://example.test/next'],
      externalLinkCount: 1,
    });
    expect(evidence.wordCount).toBeGreaterThan(5);
    expect(evidence.contentHash).toHaveLength(64);
  });
});

describe('robots and sitemap parsing', () => {
  it('uses the most specific matching robots rule and reads sitemap locations', () => {
    const policy = parseRobotsText(`
      User-agent: *
      Disallow: /private/
      Allow: /private/public$
      Sitemap: https://example.test/sitemap.xml
    `);

    expect(isRobotsAllowed(policy, new URL('https://example.test/private/secret'), 'Unisane')).toBe(
      false,
    );
    expect(isRobotsAllowed(policy, new URL('https://example.test/private/public'), 'Unisane')).toBe(
      true,
    );
    expect(policy.sitemapUrls).toEqual(['https://example.test/sitemap.xml']);
    expect(
      parseSitemapXml('<urlset><url><loc>https://example.test/a?a=1&amp;b=2</loc></url></urlset>'),
    ).toEqual({
      kind: 'url-set',
      urls: ['https://example.test/a?a=1&b=2'],
    });
  });
});

describe('bounded local site crawling', () => {
  it('discovers sitemap and internal pages while denying robots and cross-origin URLs', async () => {
    const requested: string[] = [];
    const fetchImpl = createRouteFetch(
      {
        'https://example.test/robots.txt': textResponse(
          'User-agent: *\nDisallow: /private\nSitemap: https://example.test/sitemap.xml',
        ),
        'https://example.test/sitemap.xml': xmlResponse(
          '<urlset><url><loc>https://example.test/from-sitemap</loc></url><url><loc>https://example.test/private</loc></url></urlset>',
        ),
        'https://example.test/': htmlResponse(
          '<html><head><title>Home</title></head><body><a href="/linked">Linked</a><a href="https://outside.test/page">Outside</a></body></html>',
        ),
        'https://example.test/from-sitemap': htmlResponse(
          '<html><head><title>Sitemap page</title></head><body></body></html>',
        ),
        'https://example.test/linked': htmlResponse(
          '<html><head><title>Linked page</title></head><body></body></html>',
        ),
      },
      requested,
    );

    const snapshot = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      fetchImpl,
      maxPages: 10,
      maxDepth: 1,
      maxDiscoveredUrls: 20,
    });

    expect(snapshot.pages.map((page) => page.url)).toEqual([
      'https://example.test/',
      'https://example.test/from-sitemap',
      'https://example.test/linked',
    ]);
    expect(snapshot.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: 'https://example.test/private', code: 'robots-disallowed' }),
      ]),
    );
    expect(requested).not.toContain('https://example.test/private');
    expect(requested).not.toContain('https://outside.test/page');
    expect(snapshot.sampleData).toBe(false);
    expect(siteCrawlSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('stops at both page and discovery bounds', async () => {
    const links = Array.from(
      { length: 20 },
      (_, index) => `<a href="/page-${index}">Page</a>`,
    ).join('');
    const snapshot = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      fetchImpl: createRouteFetch({
        'https://example.test/robots.txt': new Response('', { status: 404 }),
        'https://example.test/': htmlResponse(`<html><body>${links}</body></html>`),
      }),
      discoverSitemaps: false,
      maxPages: 1,
      maxDepth: 3,
      maxDiscoveredUrls: 5,
    });

    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.discovery.discoveredUrlCount).toBe(5);
    expect(snapshot.discovery.truncated).toBe(true);
  });

  it('denies cross-origin redirects before following them', async () => {
    const requested: string[] = [];
    const snapshot = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      discoverSitemaps: false,
      maxPages: 1,
      fetchImpl: createRouteFetch(
        {
          'https://example.test/robots.txt': new Response('', { status: 404 }),
          'https://example.test/': new Response(null, {
            status: 302,
            headers: { location: 'https://outside.test/page' },
          }),
        },
        requested,
      ),
    });

    expect(snapshot.pages).toHaveLength(0);
    expect(snapshot.failures).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'invalid-url' })]),
    );
    expect(requested).not.toContain('https://outside.test/page');
  });

  it('does not expand links from a page-level nofollow directive', async () => {
    const requested: string[] = [];
    const snapshot = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      discoverSitemaps: false,
      maxPages: 5,
      maxDepth: 2,
      fetchImpl: createRouteFetch(
        {
          'https://example.test/robots.txt': new Response('', { status: 404 }),
          'https://example.test/': htmlResponse(
            '<html><head><meta name="robots" content="nofollow"></head><body><a href="/hidden">Hidden</a></body></html>',
          ),
        },
        requested,
      ),
    });

    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0]?.robotsDirectives).toEqual(['nofollow']);
    expect(requested).not.toContain('https://example.test/hidden');
  });

  it('rejects response bodies larger than the configured byte limit', async () => {
    const snapshot = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      discoverSitemaps: false,
      maxPages: 1,
      maxResponseBytes: 20,
      fetchImpl: createRouteFetch({
        'https://example.test/robots.txt': new Response('', { status: 404 }),
        'https://example.test/': htmlResponse(
          '<html><body>This response is deliberately too large.</body></html>',
        ),
      }),
    });

    expect(snapshot.pages).toHaveLength(0);
    expect(snapshot.failures).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'response-too-large' })]),
    );
  });

  it('sends conditional validators and reuses page evidence after HTTP 304', async () => {
    const first = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      discoverSitemaps: false,
      maxPages: 1,
      fetchImpl: createRouteFetch({
        'https://example.test/robots.txt': new Response('', { status: 404 }),
        'https://example.test/': htmlResponse('<html><head><title>Stable</title></head></html>', {
          etag: '"page-v1"',
          'last-modified': 'Mon, 03 Aug 2026 12:00:00 GMT',
        }),
      }),
    });
    const secondFetch = vi.fn<SiteCrawlFetch>(async (input, init) => {
      const url = requestUrl(input);
      if (url.endsWith('/robots.txt')) {
        return new Response('', { status: 404 });
      }
      const headers = new Headers(init?.headers);
      expect(headers.get('if-none-match')).toBe('"page-v1"');
      expect(headers.get('if-modified-since')).toBe('Mon, 03 Aug 2026 12:00:00 GMT');
      return new Response(null, { status: 304 });
    });

    const second = await crawlSite({
      platformId: 'example',
      siteUrl: 'https://example.test',
      previousSnapshot: first,
      discoverSitemaps: false,
      maxPages: 1,
      fetchImpl: secondFetch,
    });

    expect(second.pages[0]).toMatchObject({
      title: 'Stable',
      contentHash: first.pages[0]?.contentHash,
      fetchState: 'not-modified',
    });
    expect(second.summary.reusedPageCount).toBe(1);
    expect(second.previousSnapshotId).toBe(first.snapshotId);
  });

  it('stops before network work when cancellation is already requested', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn<SiteCrawlFetch>();

    await expect(
      crawlSite({
        platformId: 'example',
        siteUrl: 'https://example.test',
        signal: controller.signal,
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(SiteCrawlCancelledError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('site crawl workspace artifact', () => {
  it('writes the default versioned snapshot inside the existing SEO workspace', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-site-crawl-'));
    temporaryDirectories.push(cwd);
    const result = await crawlSiteFile({
      cwd,
      platformId: 'example',
      siteUrl: 'https://example.test',
      discoverSitemaps: false,
      maxPages: 1,
      fetchImpl: createRouteFetch({
        'https://example.test/robots.txt': new Response('', { status: 404 }),
        'https://example.test/': htmlResponse('<html><head><title>Home</title></head></html>'),
      }),
    });

    expect(result.output).toBe('docs/domains/seo/keyword-research/site-crawls/latest.json');
    const written = JSON.parse(await readFile(path.join(cwd, result.output), 'utf8')) as unknown;
    expect(siteCrawlSnapshotSchema.parse(written).snapshotId).toBe(result.snapshotId);
  });
});

function createRouteFetch(
  routes: Record<string, Response>,
  requested: string[] = [],
): SiteCrawlFetch {
  return (async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    requested.push(url);
    const response = routes[url];
    if (!response) {
      throw new Error(`Unexpected URL: ${url}`);
    }
    return response.clone();
  }) as SiteCrawlFetch;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function htmlResponse(html: string, headers: Record<string, string> = {}): Response {
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
  });
}

function textResponse(text: string): Response {
  return new Response(text, { status: 200, headers: { 'content-type': 'text/plain' } });
}

function xmlResponse(xml: string): Response {
  return new Response(xml, { status: 200, headers: { 'content-type': 'application/xml' } });
}
