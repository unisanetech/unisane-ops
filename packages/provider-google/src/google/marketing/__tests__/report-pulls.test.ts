import { describe, expect, it } from 'vitest';
import type { MarketingConfig, ProviderApiPullContext } from '@unisane/growth/contracts';
import { pullGa4Report, pullGoogleAdsReport, pullSearchConsoleReport } from '../index.js';

function marketingConfig(): MarketingConfig {
  return {
    version: 1,
    platformId: 'example',
    appId: 'example',
    defaultEnvironment: 'production',
    environments: {},
    paths: {
      gtmManifest: 'config/google-tag-manager.ts',
      webTrackingConfig: 'config/web-tracking.ts',
      webConversionsConfig: 'config/web-conversions.ts',
      eventRegistry: 'docs/marketing/events.json',
      conversionRegistry: 'docs/marketing/conversions.json',
      sourceRoots: ['src'],
      seoRoot: 'docs/seo',
      marketingRoot: 'docs/marketing',
      analyticsRoot: 'docs/analytics',
    },
    providers: {
      googleAds: {
        state: 'configured',
        accountIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
        developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
        accessTokenEnv: 'GOOGLE_ADS_ACCESS_TOKEN',
        googleSearchDefaults: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          locationCriterionIds: ['2840'],
          languageCriterionIds: ['1000'],
        },
      },
      metaAds: {
        state: 'disabled',
        googleSearchDefaults: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          locationCriterionIds: ['2840'],
          languageCriterionIds: ['1000'],
        },
      },
      ga4: {
        state: 'configured',
        accountIdEnv: 'GA4_PROPERTY_ID',
        accessTokenEnv: 'GA4_ACCESS_TOKEN',
        googleSearchDefaults: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          locationCriterionIds: ['2840'],
          languageCriterionIds: ['1000'],
        },
      },
      searchConsole: {
        state: 'configured',
        accountIdEnv: 'SEARCH_CONSOLE_SITE_URL',
        accessTokenEnv: 'SEARCH_CONSOLE_ACCESS_TOKEN',
        googleSearchDefaults: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          locationCriterionIds: ['2840'],
          languageCriterionIds: ['1000'],
        },
      },
    },
    attributionStore: {
      state: 'planned',
      freshnessWarningDays: 7,
    },
    requiredEnv: [],
  };
}

function context(
  fetcher: typeof fetch,
  options: Partial<ProviderApiPullContext['options']> = {},
): ProviderApiPullContext {
  return {
    config: marketingConfig(),
    options: {
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      ...options,
    },
    env: {
      GOOGLE_ADS_CUSTOMER_ID: '123-456-7890',
      GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
      GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      GA4_PROPERTY_ID: 'properties/123',
      GA4_ACCESS_TOKEN: 'access-token',
      SEARCH_CONSOLE_SITE_URL: 'https://example.com/',
      SEARCH_CONSOLE_ACCESS_TOKEN: 'access-token',
    },
    fetch: fetcher,
  };
}

describe('Google marketing report transports', () => {
  it('pulls Google Ads reports through the provider-owned transport', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await pullGoogleAdsReport(
      context(async (input, init) => {
        calls.push({ url: String(input), init });
        return new Response(JSON.stringify([{ results: [{ campaign: { id: '1' } }] }]), {
          status: 200,
        });
      }),
    );

    expect(calls[0]?.url).toContain('/v22/customers/1234567890/googleAds:searchStream');
    expect(calls[0]?.init?.headers).toEqual(
      expect.objectContaining({
        authorization: 'Bearer access-token',
        'developer-token': 'developer-token',
      }),
    );
    expect(result.inputFormat).toBe('google-ads');
    expect(result.value).toEqual(expect.objectContaining({ reportType: 'campaign' }));
  });

  it('paginates GA4 rows through the provider-owned transport', async () => {
    const offsets: string[] = [];
    const result = await pullGa4Report(
      context(
        async (_input, init) => {
          const body = JSON.parse(String(init?.body)) as { offset: string };
          offsets.push(body.offset);
          return new Response(
            JSON.stringify({
              rowCount: 2,
              rows: [{ dimensionValues: [{ value: `event-${offsets.length}` }] }],
            }),
            { status: 200 },
          );
        },
        { pageSize: 1 },
      ),
    );

    expect(offsets).toEqual(['0', '1']);
    expect(result.inputFormat).toBe('ga4');
    expect(result.value).toEqual(expect.objectContaining({ rows: expect.any(Array) }));
  });

  it('encodes Search Console sites and paginates rows', async () => {
    const calls: string[] = [];
    const result = await pullSearchConsoleReport(
      context(
        async (input) => {
          calls.push(String(input));
          return new Response(JSON.stringify({ rows: [{ keys: ['resume'] }] }), {
            status: 200,
          });
        },
        { pageSize: 10 },
      ),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('sites/https%3A%2F%2Fexample.com%2F/searchAnalytics/query');
    expect(result.inputFormat).toBe('search-console');
    expect(result.value).toEqual(expect.objectContaining({ partial: false }));
  });
});
