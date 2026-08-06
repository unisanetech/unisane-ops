import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { crawlSiteFile } from '../site-crawl/crawl-file.js';
import type { SiteCrawlFetch } from '../site-crawl/request.js';
import { configureSeoResearchWorkspace, parseSeoTargetMarket } from './configure.js';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) =>
      rm(directory, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('configureSeoResearchWorkspace', () => {
  it('writes normalized site and market identity with conservative crawl defaults', async () => {
    const cwd = await createWorkspace();
    const result = await configureSeoResearchWorkspace({
      cwd,
      platformId: 'example',
      siteUrl: 'https://Example.test/some/path',
      markets: [parseSeoTargetMarket('us/EN'), parseSeoTargetMarket('GB/en')],
      ownershipConfirmed: true,
      searchConsoleProperty: 'sc-domain:example.test',
      ga4Property: 'properties/123456',
      now: () => new Date('2026-08-04T00:00:00.000Z'),
    });

    expect(result.config).toMatchObject({
      version: 2,
      platformId: 'example',
      site: {
        url: 'https://example.test/',
        ownershipConfirmedAt: '2026-08-04T00:00:00.000Z',
        crawl: {
          maxPages: 100,
          maxDepth: 2,
          maxDiscoveredUrls: 1_000,
          maxResponseBytes: 2_000_000,
          discoverSitemaps: true,
        },
      },
      markets: [
        { country: 'US', language: 'en' },
        { country: 'GB', language: 'en' },
      ],
      providers: {
        searchConsole: { enabled: true, property: 'sc-domain:example.test' },
        ga4: { enabled: true, property: 'properties/123456' },
      },
    });
    const written = JSON.parse(
      await readFile(path.join(cwd, result.configPath), 'utf8'),
    ) as unknown;
    expect(written).toEqual(result.config);
  });

  it('preserves unrelated and prior crawl settings while applying explicit overrides', async () => {
    const cwd = await createWorkspace();
    await configureSeoResearchWorkspace({
      cwd,
      platformId: 'example',
      siteUrl: 'https://example.test',
      markets: [parseSeoTargetMarket('US/en')],
      ownershipConfirmed: true,
      crawl: { maxPages: 25, maxDepth: 1 },
    });
    const updated = await configureSeoResearchWorkspace({
      cwd,
      siteUrl: 'https://example.test',
      markets: [parseSeoTargetMarket('CA/fr')],
      ownershipConfirmed: true,
      crawl: { maxDepth: 3 },
    });

    expect(updated.source).toBe('file');
    expect(updated.config.site?.crawl).toMatchObject({ maxPages: 25, maxDepth: 3 });
    expect(updated.config.markets).toEqual([{ country: 'CA', language: 'fr' }]);
    expect(updated.config.seoPatternPack).toBe('generic');
  });

  it('requires explicit local ownership confirmation', async () => {
    const cwd = await createWorkspace();
    await expect(
      configureSeoResearchWorkspace({
        cwd,
        platformId: 'example',
        siteUrl: 'https://example.test',
        markets: [parseSeoTargetMarket('US/en')],
        ownershipConfirmed: false,
      }),
    ).rejects.toThrow('own or are authorized');
  });

  it('rejects a Search Console binding outside the configured site', async () => {
    const cwd = await createWorkspace();
    await expect(
      configureSeoResearchWorkspace({
        cwd,
        platformId: 'example',
        siteUrl: 'https://example.test',
        markets: [parseSeoTargetMarket('US/en')],
        ownershipConfirmed: true,
        searchConsoleProperty: 'sc-domain:other.test',
      }),
    ).rejects.toThrow('does not cover the configured site');
  });

  it('lets the crawler consume configured identity and limits without repeated flags', async () => {
    const cwd = await createWorkspace();
    await configureSeoResearchWorkspace({
      cwd,
      platformId: 'example',
      siteUrl: 'https://example.test',
      markets: [parseSeoTargetMarket('US/en')],
      ownershipConfirmed: true,
      crawl: { maxPages: 1, discoverSitemaps: false },
    });
    const requested: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      requested.push(url);
      if (url.endsWith('/robots.txt')) {
        return new Response('', { status: 404 });
      }
      return new Response('<html><body><a href="/second">Second</a></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }) as SiteCrawlFetch;

    const result = await crawlSiteFile({ cwd, fetchImpl });

    expect(result.siteUrl).toBe('https://example.test/');
    expect(result.pageCount).toBe(1);
    expect(result.snapshot.limits.maxPages).toBe(1);
    expect(requested).not.toContain('https://example.test/sitemap.xml');
    expect(requested).not.toContain('https://example.test/second');
  });
});

async function createWorkspace(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'unisane-seo-configure-'));
  directories.push(directory);
  return directory;
}
