import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchGa4PerformanceFile, runGa4PerformanceReport } from '../index.js';

describe('GA4 performance provider', () => {
  it('runs a GA4 landing page report through the Data API', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const artifact = await runGa4PerformanceReport({
      platformId: 'true-resume',
      accessToken: 'access-token',
      propertyId: '123456',
      configuredSiteUrl: 'https://true-resume.test/',
      targetMarkets: [{ country: 'US', language: 'en' }],
      startDate: '2026-04-19',
      endDate: '2026-05-16',
      dimensions: ['landingPagePlusQueryString'],
      metrics: ['sessions', 'totalUsers', 'conversions', 'totalRevenue'],
      limit: 100,
      fetchImpl: async (url, init) => {
        const requestUrl = String(url);
        requests.push({ url: requestUrl, init });
        return ga4Response();
      },
      observedAt: '2026-05-17T00:00:00.000Z',
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe(
      'https://analyticsdata.googleapis.com/v1beta/properties/123456:runReport',
    );
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      dateRanges: [{ startDate: '2026-04-19', endDate: '2026-05-16' }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      limit: '100',
      offset: '0',
    });
    expect(artifact).toMatchObject({
      source: 'ga4',
      property: 'properties/123456',
      siteUrl: 'https://true-resume.test/',
      dateRange: { startDate: '2026-04-19', endDate: '2026-05-16' },
      evidence: { acquisition: 'api', sampleData: false },
      records: [
        {
          pagePath: '/resume-examples/data-analyst',
          sessions: 320,
          users: 210,
          analyticsConversions: 12,
          analyticsRevenue: 49.5,
        },
      ],
    });
  });

  it('writes a fetched GA4 performance artifact', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-ga4-api-'));
    try {
      const result = await fetchGa4PerformanceFile({
        cwd,
        platformId: 'true-resume',
        output: 'normalized/ga4-api.json',
        accessToken: 'access-token',
        propertyId: 'properties/123456',
        configuredSiteUrl: 'https://true-resume.test/',
        targetMarkets: [{ country: 'US', language: 'en' }],
        startDate: '2026-04-19',
        endDate: '2026-05-16',
        dimensions: ['landingPagePlusQueryString'],
        metrics: ['sessions', 'totalUsers', 'keyEvents', 'totalRevenue'],
        fetchImpl: async () =>
          ga4Response({
            dimensions: ['/resume-examples'],
            metrics: ['100', '80', '4', '10.25'],
          }),
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/ga4-api.json'), 'utf8'));

      expect(result).toMatchObject({
        output: 'normalized/ga4-api.json',
        propertyId: 'properties/123456',
        recordCount: 1,
        pageCount: 1,
      });
      expect(artifact.records[0]).toMatchObject({
        pagePath: '/resume-examples',
        sessions: 100,
        users: 80,
        analyticsConversions: 4,
        analyticsRevenue: 10.25,
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('paginates GA4 rows when max rows exceeds request limit', async () => {
    const requestBodies: unknown[] = [];
    const artifact = await runGa4PerformanceReport({
      platformId: 'true-resume',
      accessToken: 'access-token',
      propertyId: '123456',
      configuredSiteUrl: 'https://true-resume.test/',
      targetMarkets: [{ country: 'US', language: 'en' }],
      startDate: '2026-04-19',
      endDate: '2026-05-16',
      dimensions: ['landingPagePlusQueryString'],
      metrics: ['sessions'],
      limit: 1,
      maxRows: 2,
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        requestBodies.push(body);
        return ga4Response({
          dimensions: [`/resume-examples/${body.offset}`],
          metrics: ['1'],
        });
      },
    });

    expect(requestBodies).toEqual([
      expect.objectContaining({ limit: '1', offset: '0' }),
      expect.objectContaining({ limit: '1', offset: '1' }),
    ]);
    expect(artifact.records.map((record) => record.pagePath)).toEqual([
      '/resume-examples/0',
      '/resume-examples/1',
    ]);
  });
});

function ga4Response(
  row: { dimensions: string[]; metrics: string[] } = {
    dimensions: ['/resume-examples/data-analyst'],
    metrics: ['320', '210', '12', '49.5'],
  },
): Response {
  return new Response(
    JSON.stringify({
      rows: [
        {
          dimensionValues: row.dimensions.map((value) => ({ value })),
          metricValues: row.metrics.map((value) => ({ value })),
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
