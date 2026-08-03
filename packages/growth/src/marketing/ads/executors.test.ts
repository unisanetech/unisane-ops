import { describe, expect, it, vi } from 'vitest';
import { executeMarketingAdsLiveOperation } from './executors.js';

describe('legacy marketing ads live executor', () => {
  it('cannot execute a campaign pause outside the controlled action lifecycle', async () => {
    const providerExecutor = vi.fn();
    const result = await executeMarketingAdsLiveOperation({
      config: { defaultEnvironment: 'production' },
      plan: { candidates: [] },
      operation: {
        id: 'operation.pause-campaign',
        provider: 'googleAds',
        strategyObjectId: 'campaign-42',
        actionType: 'pause_campaign',
        safety: 'pause_or_archive',
        mutationIntent: 'pause_or_archive',
        approvalTier: 'standard',
      },
      mode: 'enabled',
      providerExecutors: { googleAds: providerExecutor },
      env: { UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled' },
      fetch: vi.fn(),
      now: new Date('2026-08-03T10:00:00.000Z'),
    } as never);

    expect(result).toMatchObject({
      status: 'blocked',
      liveMutationSent: false,
      message: 'pause_campaign is not supported by the live executor.',
    });
    expect(providerExecutor).not.toHaveBeenCalled();
  });
});
