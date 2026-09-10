import { describe, expect, it, vi } from 'vitest';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import type { ProviderApiPullContext } from '@unisane/growth/contracts';
import { pullMetaAdsReport } from './provider-adapters.js';
import { runWithGrowthProviderRuntime } from './provider-runtime.js';

describe('provider report adapters', () => {
  it('strips credentials and unrelated runtime state from Meta report commands', async () => {
    const resolveBinding = vi.fn<NonNullable<PackCommandRuntime['resolveBinding']>>(async () => ({
      accountId: 'act_123',
      inputFormat: 'meta-ads',
      value: { data: [] },
    }));
    const runtime: PackCommandRuntime = { resolveBinding };

    await runWithGrowthProviderRuntime(runtime, '/workspace', async () =>
      pullMetaAdsReport({
        config: {} as ProviderApiPullContext['config'],
        options: {
          accountId: 'act_123',
          environment: 'production',
          connection: 'meta-primary',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          maxPages: 3,
        },
        credentials: { accessToken: 'must-never-cross-host-boundary' },
        env: { META_ACCESS_TOKEN: 'must-also-stay-local' },
        fetch,
      }),
    );

    const request = resolveBinding.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(request).toMatchObject({
      operation: 'meta.marketing.pull-report',
      cwd: '/workspace',
      input: {
        accountId: 'act_123',
        environment: 'production',
        connection: 'meta-primary',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        maxPages: 3,
      },
    });
    expect(JSON.stringify(request)).not.toMatch(
      /must-never-cross-host-boundary|must-also-stay-local|credentials|META_ACCESS_TOKEN/,
    );
  });

});
