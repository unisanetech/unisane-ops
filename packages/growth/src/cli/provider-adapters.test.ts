import { describe, expect, it, vi } from 'vitest';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { createCliCampaignPauseProviderAdapters } from './provider-adapters.js';
import { runWithGrowthProviderRuntime } from './provider-runtime.js';

describe('campaign pause provider adapters', () => {
  it('routes Google and Meta through their exact campaign operations', async () => {
    const resolveBinding = vi.fn(async (_binding: string, request: unknown) => {
      const operation = (request as { operation: string }).operation;
      return operation.endsWith('read-campaign-status')
        ? 'paused'
        : { outcome: 'succeeded', providerOperationId: `operation.${operation}` };
    });
    const runtime: PackCommandRuntime = { resolveBinding };
    const adapters = createCliCampaignPauseProviderAdapters({
      environment: 'development',
      googleConnection: 'connection.google-primary',
      metaConnection: 'connection.meta-primary',
    });

    await runWithGrowthProviderRuntime(runtime, '/workspace', async () => {
      await adapters.googleAds.pauseCampaign({
        providerAccountId: 'google-account',
        campaignId: 'google-campaign',
        planHash: 'google-plan',
      });
      await adapters.googleAds.readCampaignStatus({
        providerAccountId: 'google-account',
        campaignId: 'google-campaign',
      });
      await adapters.metaAds.pauseCampaign({
        providerAccountId: 'meta-account',
        campaignId: 'meta-campaign',
        planHash: 'meta-plan',
      });
      await adapters.metaAds.readCampaignStatus({
        providerAccountId: 'meta-account',
        campaignId: 'meta-campaign',
      });
    });

    const requests = resolveBinding.mock.calls.map(
      ([, request]) => request as Record<string, unknown>,
    );
    expect(requests.map((request) => request.operation)).toEqual([
      'google.marketing.pause-campaign',
      'google.marketing.read-campaign-status',
      'meta.marketing.pause-campaign',
      'meta.marketing.read-campaign-status',
    ]);
    expect(requests[0]).toMatchObject({
      cwd: '/workspace',
      input: { connection: 'connection.google-primary' },
    });
    expect(requests[2]).toMatchObject({
      cwd: '/workspace',
      input: { connection: 'connection.meta-primary' },
    });
    expect(requests.map((request) => request.operation)).not.toContain(
      'google.marketing.execute-live',
    );
    expect(requests.map((request) => request.operation)).not.toContain(
      'meta.marketing.execute-live',
    );
  });
});
