import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { registerCapabilityCommands } from './register.js';
import { runWithGrowthProviderRuntime } from '../../provider-runtime.js';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';

describe('capability CLI', () => {
  it('routes exact project/environment to the shared action and rejects malformed output', async () => {
    const calls: unknown[] = [];
    const runtime: PackCommandRuntime = {
      resolveBinding: async (_, request) => {
        calls.push(request);
        if ((request as { operation: string }).operation === 'growth.project.context')
          return {
            projectId: 'store',
            projectRoot: '/store',
            environments: { production: { production: true } },
            growth: { environments: { production: {} } },
          };
        return { invalid: true };
      },
    };
    const command = new Command();
    registerCapabilityCommands(command);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await expect(
        runWithGrowthProviderRuntime(runtime, '/store', () =>
          command.parseAsync(['capabilities', 'review', '--environment', 'production', '--json'], {
            from: 'user',
          }),
        ),
      ).rejects.toThrow();
      expect(calls[1]).toMatchObject({
        operation: 'growth.capabilities.review',
        input: { projectId: 'store', environmentId: 'production' },
      });
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});

it('preserves JSON results and rejects a result for another project', async () => {
  const output = {
    schemaVersion: 1,
    actionId: 'growth.capabilities.review',
    projectId: 'store',
    environmentId: 'production',
    provider: 'meta',
    observedAt: '2026-09-06T00:00:00Z',
    liveVerified: false,
    capabilities: [
      {
        id: 'meta.ads.reporting',
        title: 'Ads reports',
        implementation: 'implemented',
        verification: 'fixture-proven',
        effect: 'read-network',
        hostState: 'blocked',
        hostReason: 'Connect Meta.',
        assessment: 'ads-insights',
        executionSurfaces: ['cli'],
        nextStep: 'Connect Meta.',
        status: 'blocked',
        accountState: 'connection-missing',
        reasons: ['Connect Meta.'],
      },
    ],
    presentation: { headline: 'Connect Meta.', whyItMatters: 'Offline evidence only.' },
  };
  const runtime: PackCommandRuntime = {
    resolveBinding: async (_, request) =>
      (request as { operation: string }).operation === 'growth.project.context'
        ? {
            projectId: 'store',
            projectRoot: '/store',
            environments: { production: { production: true } },
            growth: { environments: { production: {} } },
          }
        : output,
  };
  const run = () => {
    const command = new Command();
    registerCapabilityCommands(command);
    return runWithGrowthProviderRuntime(runtime, '/store', () =>
      command.parseAsync(['capabilities', 'review', '--environment', 'production', '--json'], {
        from: 'user',
      }),
    );
  };
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await run();
    expect(JSON.parse(log.mock.calls[0]![0])).toEqual(output);
    log.mockClear();
    output.projectId = 'other';
    await expect(run()).rejects.toThrow('TARGET_MISMATCH');
    expect(log).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
