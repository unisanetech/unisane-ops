import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleAdvertising } from './advertising.js';

describe('Growth console Advertising projection', () => {
  it('keeps provider evidence separate while producing an honest combined view', () => {
    const result = buildMarketingConsoleAdvertising({
      googleAds: {
        campaigns: [
          {
            id: 'campaign-one',
            level: 'campaign',
            campaignName: 'Resume builder search',
            campaignStatus: 'ENABLED',
            campaignPrimaryStatus: 'ELIGIBLE',
            campaignServingStatus: 'SERVING',
            campaignDailyBudget: 1_000,
            campaignBiddingStrategyType: 'MAXIMIZE_CONVERSIONS',
            currency: 'INR',
            metrics: {
              impressions: 50,
              clicks: 11,
              cost: 847.42,
              conversions: 0,
              conversionValue: 0,
            },
          },
        ],
        conversions: [],
      },
      metaAds: {
        campaigns: [
          {
            id: 'meta-campaign',
            level: 'campaign',
            campaignName: 'Resume social prospecting',
            creativeStatus: 'ACTIVE',
            currency: 'INR',
            metrics: {
              impressions: 150,
              clicks: 20,
              cost: 1_200,
              conversions: 3,
              conversionValue: 3_000,
            },
          },
        ],
      },
      freshness: [
        {
          id: 'googleAds.campaign',
          provider: 'googleAds',
          reportType: 'campaign',
          status: 'warn',
          label: 'Google Ads campaigns',
          message: 'Campaign evidence needs an update.',
          ageDays: 45,
          recordCount: 1,
          path: '/reports/google.json',
          sourceKind: 'api',
        },
        {
          id: 'metaAds.campaign',
          provider: 'metaAds',
          reportType: 'campaign',
          status: 'ready',
          label: 'Meta Ads campaigns',
          message: 'Sample evidence is current.',
          ageDays: 0,
          recordCount: 1,
          path: '/reports/meta.json',
          sourceKind: 'fixture',
        },
      ],
      receipts: [],
    });

    expect(result.providers).toEqual([
      expect.objectContaining({
        scope: 'googleAds',
        sources: [
          expect.objectContaining({
            status: 'warn',
            freshnessLabel: '45 days old',
            available: true,
          }),
        ],
        campaigns: [
          expect.objectContaining({
            provider: 'googleAds',
            dailyBudget: 1_000,
            spend: 847.42,
            conversions: 0,
          }),
        ],
      }),
      expect.objectContaining({
        scope: 'metaAds',
        sources: [
          expect.objectContaining({
            sourceKind: 'fixture',
            freshnessLabel: 'Sample data',
            available: true,
          }),
        ],
        campaigns: [
          expect.objectContaining({
            provider: 'metaAds',
            spend: 1_200,
            conversions: 3,
          }),
        ],
      }),
    ]);
    expect(result.combined.campaigns).toHaveLength(2);
    expect(result.combined.detail).toMatch(/sample evidence/i);
  });

  it('keeps configured Google actions distinct from measured outcomes', () => {
    const result = buildMarketingConsoleAdvertising({
      googleAds: {
        campaigns: [],
        conversions: [
          {
            id: 'purchase',
            level: 'conversion',
            conversionName: 'Purchase',
            metrics: {},
          },
        ],
      },
      metaAds: { campaigns: [] },
      freshness: [],
      receipts: [],
    });

    expect(result.providers[0]?.conversions).toEqual([
      expect.objectContaining({
        name: 'Purchase',
        measurementLabel: 'Configured; this report does not include outcome counts',
      }),
    ]);
    expect(result.providers[0]?.conversions[0]).not.toHaveProperty('conversions');
  });
});
