import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fetchSearchConsolePerformanceFile,
  querySearchConsolePerformance,
  readGoogleSearchConsoleCredentials,
} from '../index.js';

describe('Search Console performance provider', () => {
  it('reads credentials from dedicated or shared Google OAuth env', () => {
    expect(
      readGoogleSearchConsoleCredentials({
        GOOGLE_OAUTH_CLIENT_ID: 'client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
        GOOGLE_OAUTH_REFRESH_TOKEN: 'refresh-token',
      }),
    ).toEqual({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    });

    expect(() => readGoogleSearchConsoleCredentials({})).toThrow(
      'Missing Google Search Console env',
    );
  });

  it('fetches Search Console performance through the Google API', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const artifact = await querySearchConsolePerformance({
      platformId: 'true-resume',
      credentials: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
      },
      siteUrl: 'https://true-resume.test/',
      startDate: '2026-04-19',
      endDate: '2026-05-16',
      dimensions: ['query', 'page'],
      rowLimit: 100,
      fetchImpl: async (url, init) => {
        const requestUrl = String(url);
        requests.push({ url: requestUrl, init });
        return requestUrl === 'https://oauth2.googleapis.com/token'
          ? tokenResponse()
          : searchConsoleResponse();
      },
      fetchedAt: '2026-05-17T00:00:00.000Z',
    });

    expect(requests).toHaveLength(2);
    expect(requests[1]?.url).toBe(
      'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Ftrue-resume.test%2F/searchAnalytics/query',
    );
    expect(JSON.parse(String(requests[1]?.init?.body))).toMatchObject({
      startDate: '2026-04-19',
      endDate: '2026-05-16',
      dimensions: ['query', 'page'],
      rowLimit: 100,
      type: 'web',
    });
    expect(artifact).toMatchObject({
      source: 'google-search-console',
      property: 'https://true-resume.test/',
      dateRange: '2026-04-19..2026-05-16',
      records: [
        {
          pagePath: '/resume-examples/data-analyst',
          query: 'data analyst resume example',
          clicks: 42,
          impressions: 1200,
        },
      ],
    });
  });

  it('writes a fetched Search Console performance artifact', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-search-console-api-'));
    try {
      const result = await fetchSearchConsolePerformanceFile({
        cwd,
        platformId: 'true-resume',
        output: 'normalized/gsc-api.json',
        credentials: {
          clientId: 'client-id',
          clientSecret: 'client-secret',
          refreshToken: 'refresh-token',
        },
        siteUrl: 'sc-domain:true-resume.test',
        startDate: '2026-04-19',
        endDate: '2026-05-16',
        dimensions: ['page'],
        fetchImpl: async (url) =>
          String(url) === 'https://oauth2.googleapis.com/token'
            ? tokenResponse()
            : searchConsoleResponse({
                keys: ['https://true-resume.test/resume-examples'],
                clicks: 12,
                impressions: 300,
              }),
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/gsc-api.json'), 'utf8'));

      expect(result).toMatchObject({
        output: 'normalized/gsc-api.json',
        siteUrl: 'sc-domain:true-resume.test',
        recordCount: 1,
        pageCount: 1,
      });
      expect(artifact.records[0]).toMatchObject({
        pagePath: '/resume-examples',
        clicks: 12,
        impressions: 300,
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('paginates Search Console rows when max rows exceeds page size', async () => {
    const requestBodies: unknown[] = [];
    const artifact = await querySearchConsolePerformance({
      platformId: 'true-resume',
      credentials: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
      },
      siteUrl: 'https://true-resume.test/',
      startDate: '2026-04-19',
      endDate: '2026-05-16',
      dimensions: ['page'],
      rowLimit: 1,
      maxRows: 2,
      fetchImpl: async (url, init) => {
        if (String(url) === 'https://oauth2.googleapis.com/token') {
          return tokenResponse();
        }
        const body = JSON.parse(String(init?.body));
        requestBodies.push(body);
        return searchConsoleResponse({
          keys: [`https://true-resume.test/resume-examples/${body.startRow}`],
          clicks: 1,
          impressions: 10,
        });
      },
    });

    expect(requestBodies).toEqual([
      expect.objectContaining({ rowLimit: 1, startRow: 0 }),
      expect.objectContaining({ rowLimit: 1, startRow: 1 }),
    ]);
    expect(artifact.records.map((record) => record.pagePath)).toEqual([
      '/resume-examples/0',
      '/resume-examples/1',
    ]);
  });
});

function tokenResponse(): Response {
  return new Response(JSON.stringify({ access_token: 'access-token' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function searchConsoleResponse(
  row: {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr?: number;
    position?: number;
  } = {
    keys: ['data analyst resume example', 'https://true-resume.test/resume-examples/data-analyst'],
    clicks: 42,
    impressions: 1200,
    ctr: 0.035,
    position: 4.2,
  },
): Response {
  return new Response(JSON.stringify({ rows: [row] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
