import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cacheMarketingProviderReportArtifact } from './provider-cache.js';
import { readMarketingStatusProviderFreshness } from './status.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('marketing report-scoped freshness', () => {
  it('reads current report-family artifacts instead of a provider-level latest file', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-marketing-status-'));
    temporaryDirectories.push(cwd);
    cacheMarketingProviderReportArtifact(cwd, {
      version: 1,
      platformId: 'example',
      appId: 'example',
      provider: 'ga4',
      reportType: 'channel',
      source: 'api',
      pulledAt: '2026-07-30T00:00:00.000Z',
      window: { startDate: '2026-07-01', endDate: '2026-07-29' },
      partial: false,
      records: [
        {
          id: 'organic',
          level: 'channel',
          channel: 'Organic Search',
          metrics: { sessions: 12, users: 8 },
        },
      ],
    });

    const freshness = readMarketingStatusProviderFreshness({
      cwd,
      mode: 'analytics',
      now: new Date('2026-07-30T12:00:00.000Z'),
    });

    expect(
      freshness.find((status) => status.provider === 'ga4' && status.reportType === 'channel'),
    ).toEqual(
      expect.objectContaining({
        status: 'fresh',
        recordCount: 1,
        metrics: expect.objectContaining({ sessions: 12, users: 8 }),
      }),
    );
  });
});
