import { describe, expect, it } from 'vitest';
import { normalizeGoogleAdsReport } from './reports.js';

describe('Google Ads report normalization', () => {
  it('preserves campaign delivery, budget, bidding, and schedule configuration', () => {
    const result = normalizeGoogleAdsReport(
      {
        reportType: 'campaign',
        window: { startDate: '2026-07-01', endDate: '2026-07-30' },
        results: [
          {
            customer: { currencyCode: 'INR' },
            campaign: {
              id: 'campaign-one',
              name: 'Resume builder search',
              status: 'ENABLED',
              primaryStatus: 'LIMITED',
              primaryStatusReasons: ['BUDGET_CONSTRAINED'],
              servingStatus: 'SERVING',
              advertisingChannelType: 'SEARCH',
              biddingStrategyType: 'MAXIMIZE_CONVERSIONS',
              biddingStrategySystemStatus: 'LEARNING',
              startDate: '2026-06-01',
              endDate: '2026-12-31',
            },
            campaignBudget: {
              amountMicros: '1000000000',
              status: 'ENABLED',
              explicitlyShared: false,
            },
            metrics: {
              impressions: '50',
              clicks: '11',
              costMicros: '847420000',
              conversions: 0,
            },
          },
        ],
      },
      {
        platformId: 'true-resume',
        appId: 'web',
        accountId: '123',
        pulledAt: '2026-07-30T00:00:00.000Z',
        source: 'api',
        reportType: 'campaign',
      },
    );

    expect(result.records[0]).toMatchObject({
      campaignStatus: 'ENABLED',
      campaignPrimaryStatus: 'LIMITED',
      campaignPrimaryStatusReasons: ['BUDGET_CONSTRAINED'],
      campaignServingStatus: 'SERVING',
      campaignAdvertisingChannelType: 'SEARCH',
      campaignBiddingStrategyType: 'MAXIMIZE_CONVERSIONS',
      campaignBiddingStrategySystemStatus: 'LEARNING',
      campaignStartDate: '2026-06-01',
      campaignEndDate: '2026-12-31',
      campaignDailyBudget: 1_000,
      campaignBudgetStatus: 'ENABLED',
      campaignBudgetShared: false,
    });
  });
});
