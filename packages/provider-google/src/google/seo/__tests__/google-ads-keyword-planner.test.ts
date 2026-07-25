import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fetchGoogleAdsKeywordIdeas,
  fetchGoogleAdsKeywordMetricsFile,
  readGoogleAdsKeywordPlannerCredentials,
} from '../index.js';

describe('Google Ads Keyword Planner provider', () => {
  it('validates required env without exposing secret values', () => {
    expect(() =>
      readGoogleAdsKeywordPlannerCredentials({
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
      }),
    ).toThrow(
      'Missing Google Ads Keyword Planner env: GOOGLE_ADS_CLIENT_ID or GOOGLE_OAUTH_CLIENT_ID or GOOGLE_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET or GOOGLE_OAUTH_CLIENT_SECRET or GOOGLE_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID.',
    );
  });

  it('reuses shared Google OAuth client env for Google Ads metrics', () => {
    const credentials = readGoogleAdsKeywordPlannerCredentials({
      GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
      GOOGLE_OAUTH_CLIENT_ID: 'shared-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'shared-client-secret',
      GOOGLE_ADS_REFRESH_TOKEN: 'refresh-token',
      GOOGLE_ADS_CUSTOMER_ID: '123-456-7890',
    });

    expect(credentials).toMatchObject({
      clientId: 'shared-client-id',
      clientSecret: 'shared-client-secret',
      customerId: '1234567890',
    });
  });

  it('fetches keyword idea metrics through OAuth and Google Ads REST', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      if (String(input).includes('oauth2.googleapis.com')) {
        return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          results: [
            {
              text: 'data analyst resume example',
              keywordIdeaMetrics: {
                avgMonthlySearches: '1900',
                competition: 'MEDIUM',
                competitionIndex: 48,
                lowTopOfPageBidMicros: '1200000',
                highTopOfPageBidMicros: '3200000',
              },
            },
          ],
        }),
        { status: 200 },
      );
    };

    const metricFile = await fetchGoogleAdsKeywordIdeas({
      platformId: 'true-resume',
      credentials: {
        developerToken: 'developer-token',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
        customerId: '1234567890',
        loginCustomerId: '9988776655',
        apiVersion: 'v24',
      },
      country: 'US',
      language: 'en',
      languageId: '1000',
      locationIds: ['2840'],
      currencyCode: 'USD',
      keywords: ['data analyst resume example'],
      clusterId: 'resume-examples',
      campaignIntent: 'Resume examples SEO and search ads',
      fetchImpl,
      fetchedAt: '2026-05-17T00:00:00.000Z',
    });

    const requestBody = JSON.parse(String(calls[1]?.init?.body));
    expect(calls[1]?.url).toBe(
      'https://googleads.googleapis.com/v24/customers/1234567890:generateKeywordIdeas',
    );
    expect(calls[1]?.init?.headers).toMatchObject({
      authorization: 'Bearer access-token',
      'developer-token': 'developer-token',
      'login-customer-id': '9988776655',
    });
    expect(requestBody).toMatchObject({
      language: 'languageConstants/1000',
      geoTargetConstants: ['geoTargetConstants/2840'],
      keywordSeed: { keywords: ['data analyst resume example'] },
    });
    expect(metricFile.metrics[0]).toMatchObject({
      term: 'data analyst resume example',
      normalizedTerm: 'data analyst resume example',
      avgMonthlySearches: 1900,
      competition: 'MEDIUM',
      competitionIndex: 48,
      lowTopOfPageBidMicros: 1200000,
      highTopOfPageBidMicros: 3200000,
    });
    expect(metricFile).toMatchObject({
      version: 2,
      runId: 'true-resume-us-en-2026-05-17T00-00-00-000Z',
      fetchedAt: '2026-05-17T00:00:00.000Z',
      market: {
        country: 'US',
        language: 'en',
        languageId: '1000',
        locationIds: ['2840'],
        currencyCode: 'USD',
      },
      source: {
        kind: 'keyword-seed',
        clusterId: 'resume-examples',
        campaignIntent: 'Resume examples SEO and search ads',
        seedKeywords: ['data analyst resume example'],
      },
    });
  });

  it('writes normalized metrics from candidate files', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-google-ads-'));
    try {
      await mkdir(join(cwd, 'normalized'), { recursive: true });
      await writeFile(
        join(cwd, 'candidates.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          sourceSeedFile: 'seeds/manual.seed.json',
          patternPack: 'resume-examples',
          candidates: [
            {
              id: 'true-resume:data-analyst:example',
              term: 'data analyst resume example',
              normalizedTerm: 'data analyst resume example',
              platformId: 'true-resume',
              sourceSeedId: 'seed-data-analyst',
              sourceTerm: 'data analyst',
              pattern: '{role} resume example',
              patternPack: 'resume-examples',
              intent: 'both',
            },
          ],
        }),
      );
      const fetchImpl: typeof fetch = async (input) => {
        if (String(input).includes('oauth2.googleapis.com')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            results: [
              {
                text: 'data analyst resume example',
                keywordIdeaMetrics: { avgMonthlySearches: '1900', competition: 'LOW' },
              },
            ],
          }),
          { status: 200 },
        );
      };

      const result = await fetchGoogleAdsKeywordMetricsFile({
        cwd,
        platformId: 'true-resume',
        candidates: 'candidates.json',
        output: 'normalized/google-ads.json',
        credentials: createCredentials(),
        country: 'US',
        language: 'en',
        languageId: '1000',
        locationIds: ['2840'],
        currencyCode: 'USD',
        clusterId: 'resume-examples',
        fetchImpl,
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/google-ads.json'), 'utf8'));

      expect(result).toMatchObject({
        metricCount: 1,
        candidates: 'candidates.json',
      });
      expect(artifact).toMatchObject({
        version: 2,
        provider: 'google-ads',
        market: { currencyCode: 'USD', locationIds: ['2840'] },
        source: {
          kind: 'candidate-file',
          candidateFile: 'candidates.json',
          clusterId: 'resume-examples',
          seedKeywords: ['data analyst resume example'],
        },
        metrics: [{ provider: 'google-ads', avgMonthlySearches: 1900 }],
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('writes normalized metrics from keyword seed files', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-google-ads-'));
    try {
      await mkdir(join(cwd, 'normalized'), { recursive: true });
      await writeFile(
        join(cwd, 'seed.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          purpose: 'Template category taxonomy research',
          seeds: ['resume templates', { term: 'ats friendly resume template' }],
        }),
      );
      const fetchImpl: typeof fetch = async (input, init) => {
        if (String(input).includes('oauth2.googleapis.com')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        const body = JSON.parse(String(init?.body));
        expect(body.keywordSeed.keywords).toEqual([
          'resume templates',
          'ats friendly resume template',
        ]);
        return new Response(
          JSON.stringify({
            results: [
              {
                text: 'ats friendly resume template',
                keywordIdeaMetrics: { avgMonthlySearches: '22200', competition: 'LOW' },
              },
            ],
          }),
          { status: 200 },
        );
      };

      const result = await fetchGoogleAdsKeywordMetricsFile({
        cwd,
        platformId: 'true-resume',
        seedFile: 'seed.json',
        output: 'normalized/google-ads.json',
        credentials: createCredentials(),
        country: 'US',
        language: 'en',
        languageId: '1000',
        locationIds: ['2840'],
        currencyCode: 'USD',
        clusterId: 'template-category-taxonomy',
        fetchImpl,
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/google-ads.json'), 'utf8'));

      expect(result).toMatchObject({
        metricCount: 1,
        seedFile: 'seed.json',
      });
      expect(artifact).toMatchObject({
        version: 2,
        source: {
          kind: 'seed-file',
          seedFile: 'seed.json',
          clusterId: 'template-category-taxonomy',
          seedKeywords: ['resume templates', 'ats friendly resume template'],
        },
        metrics: [{ provider: 'google-ads', avgMonthlySearches: 22200 }],
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('filters expanded keyword ideas before writing metrics', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-google-ads-'));
    try {
      await mkdir(join(cwd, 'normalized'), { recursive: true });
      const fetchImpl: typeof fetch = async (input) => {
        if (String(input).includes('oauth2.googleapis.com')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            results: [
              {
                text: 'teacher resume examples',
                keywordIdeaMetrics: { avgMonthlySearches: '3600', competition: 'MEDIUM' },
              },
              {
                text: 'cv sample for accountant',
                keywordIdeaMetrics: { avgMonthlySearches: '880', competition: 'LOW' },
              },
              {
                text: 'realtor',
                keywordIdeaMetrics: { avgMonthlySearches: '3350000', competition: 'LOW' },
              },
              {
                text: 'resume password manager',
                keywordIdeaMetrics: { avgMonthlySearches: '12000', competition: 'HIGH' },
              },
            ],
          }),
          { status: 200 },
        );
      };

      const result = await fetchGoogleAdsKeywordMetricsFile({
        cwd,
        platformId: 'true-resume',
        keywords: ['teacher resume examples'],
        output: 'normalized/google-ads.json',
        credentials: createCredentials(),
        country: 'US',
        language: 'en',
        languageId: '1000',
        locationIds: ['2840'],
        requireTermGroups: [
          ['resume', 'cv'],
          ['example', 'sample'],
        ],
        excludeTerms: ['password manager'],
        fetchImpl,
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/google-ads.json'), 'utf8'));

      expect(result).toMatchObject({
        metricCount: 2,
        droppedMetricCount: 2,
        requireTermGroups: [
          ['resume', 'cv'],
          ['example', 'sample'],
        ],
        excludeTerms: ['password manager'],
      });
      expect(artifact.metrics.map((metric: { term: string }) => metric.term)).toEqual([
        'teacher resume examples',
        'cv sample for accountant',
      ]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing metrics', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-google-ads-'));
    try {
      const fetchImpl: typeof fetch = async (input) => {
        if (String(input).includes('oauth2.googleapis.com')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      };

      await fetchGoogleAdsKeywordMetricsFile({
        cwd,
        platformId: 'true-resume',
        keywords: ['data analyst resume example'],
        output: 'normalized/google-ads.json',
        credentials: createCredentials(),
        country: 'US',
        language: 'en',
        languageId: '1000',
        locationIds: ['2840'],
        fetchImpl,
        dryRun: true,
      });

      await expect(stat(join(cwd, 'normalized/google-ads.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createCredentials() {
  return {
    developerToken: 'developer-token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    refreshToken: 'refresh-token',
    customerId: '1234567890',
    apiVersion: 'v24',
  };
}
