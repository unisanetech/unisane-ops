import { Command } from 'commander';
import { expect, it, vi } from 'vitest';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { registerReportCommands } from './register.js';
import { runWithGrowthProviderRuntime } from '../../provider-runtime.js';
it('routes exact dates and target through the shared report action and validates its result', async () => {
  const calls: unknown[] = [];
  const runtime: PackCommandRuntime = {
    resolveBinding: async (_, request) => {
      calls.push(request);
      return (request as { operation: string }).operation === 'growth.project.context'
        ? {
            projectId: 'store',
            projectRoot: '/store',
            environments: { production: { production: true } },
            growth: { environments: { production: {} } },
          }
        : { invalid: true };
    },
  };
  const command = new Command();
  registerReportCommands(command);
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await expect(
      runWithGrowthProviderRuntime(runtime, '/store', () =>
        command.parseAsync(
          [
            'reports',
            'read',
            '--environment',
            'production',
            '--start-date',
            '2026-09-01',
            '--end-date',
            '2026-09-05',
            '--json',
          ],
          { from: 'user' },
        ),
      ),
    ).rejects.toThrow();
    expect(calls[1]).toMatchObject({
      operation: 'growth.reports.read',
      input: {
        projectId: 'store',
        environmentId: 'production',
        report: { startDate: '2026-09-01', endDate: '2026-09-05', rowLimit: 50 },
      },
    });
    expect(log).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

it('exposes local evidence collection and offline history commands', async () => {
  const calls: unknown[] = [];
  const runtime: PackCommandRuntime = {
    resolveBinding: async (_, request) => {
      calls.push(request);
      return (request as { operation: string }).operation === 'growth.project.context'
        ? {
            projectId: 'store',
            projectRoot: '/store',
            environments: { production: { production: true } },
            growth: { environments: { production: {} } },
          }
        : { invalid: true };
    },
  };
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    for (const args of [
      ['collect', '--start-date', '2026-09-01', '--end-date', '2026-09-05'],
      ['history', '--limit', '3'],
    ]) {
      const command = new Command();
      registerReportCommands(command);
      await expect(
        runWithGrowthProviderRuntime(runtime, '/store', () =>
          command.parseAsync(['reports', ...args, '--environment', 'production', '--json'], {
            from: 'user',
          }),
        ),
      ).rejects.toThrow();
    }
    expect(calls[1]).toMatchObject({
      operation: 'growth.reports.collect',
      input: { projectId: 'store', environmentId: 'production' },
    });
    expect(calls[3]).toMatchObject({
      operation: 'growth.reports.history',
      input: { query: { limit: 3 } },
    });
  } finally {
    log.mockRestore();
  }
});
