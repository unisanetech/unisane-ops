import type { ProviderApiPullContext } from '@unisane/growth/contracts';
import { describe, expect, it } from 'vitest';
import { pullGoogleAdsReport } from './api-pull.js';

describe('Google Ads campaign pull', () => {
  it('requests campaign delivery, budget, and bidding configuration with performance', async () => {
    let query = '';
    const fetcher: typeof fetch = async (_input, init) => {
      query = String(JSON.parse(String(init?.body)).query);
      return new Response(JSON.stringify([{ results: [] }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    await pullGoogleAdsReport({
      config: {} as ProviderApiPullContext['config'],
      options: {
        accountId: '123-456-7890',
        startDate: '2026-07-01',
        endDate: '2026-07-30',
        reportType: 'campaign',
      },
      credentials: {
        accessToken: '<REDACTED>',
        developerToken: '<REDACTED>',
      },
      env: {},
      fetch: fetcher,
    });

    expect(query).toContain('campaign.status');
    expect(query).toContain('campaign.primary_status');
    expect(query).toContain('campaign.bidding_strategy_system_status');
    expect(query).toContain('campaign_budget.amount_micros');
    expect(query).toContain('metrics.cost_micros');
  });
});
