import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { marketingExecutionContextSchema } from '../schema/execution-context.js';
import { buildMarketingScheduledReportingPlan } from './scheduled-reporting.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('scheduled reporting provider selection', () => {
  it('does not create jobs for a provider without a selected connection', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-schedule-'));
    temporaryDirectories.push(cwd);
    const config = marketingExecutionContextSchema.parse({
      version: 1,
      platformId: 'example',
      appId: 'example',
      defaultEnvironment: 'production',
      environments: { production: { production: true } },
      paths: {},
      providers: {
        googleAds: { state: 'connected' },
        metaAds: { state: 'selected' },
        ga4: { state: 'connected' },
        searchConsole: { state: 'connected' },
      },
      attributionStore: {},
      requiredEnv: [],
    });

    const plan = buildMarketingScheduledReportingPlan(config, {
      cwd,
      now: new Date('2026-07-30T00:00:00.000Z'),
      googleAuth: {
        connectionId: 'google-primary',
        connected: true,
        credentialAvailable: true,
        scopes: [],
      },
    });

    expect(plan.jobs.some((job) => job.provider === 'metaAds')).toBe(false);
    expect(plan.jobs.some((job) => job.provider === 'googleAds')).toBe(true);
  });
});
