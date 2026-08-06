import { writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MarketingProviderReportArtifact } from '../schema/report.js';
import { recordMarketingHistoryArtifact } from './catalog.js';
import { readMarketingHistoryReportWindow } from './report-window.js';

function dailyArtifact(date: string, clicks: number, impressions: number) {
  return {
    version: 1,
    platformId: 'example',
    appId: 'app',
    provider: 'searchConsole',
    reportType: 'queryPage',
    source: 'api',
    pulledAt: `${date}T12:00:00.000Z`,
    window: { startDate: date, endDate: date, timeZone: 'UTC' },
    partial: false,
    records: [
      {
        id: `resume:${date}`,
        level: 'query',
        query: 'resume builder',
        pageUrl: '/resume-builder',
        position: date.endsWith('01') ? 10 : 20,
        metrics: { clicks, impressions },
      },
    ],
  } satisfies MarketingProviderReportArtifact;
}

async function record(cwd: string, artifact: MarketingProviderReportArtifact) {
  const artifactPath = path.join(cwd, `${artifact.window.startDate}.json`);
  writeFileSync(artifactPath, JSON.stringify(artifact));
  recordMarketingHistoryArtifact({ cwd, artifact, artifactPath });
}

describe('marketing history report windows', () => {
  it('composes non-overlapping daily evidence and recomputes rate metrics', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-history-window-'));
    await record(cwd, dailyArtifact('2026-07-01', 2, 20));
    await record(cwd, dailyArtifact('2026-07-02', 3, 30));

    const result = readMarketingHistoryReportWindow({
      cwd,
      provider: 'searchConsole',
      reportType: 'queryPage',
      window: { startDate: '2026-07-01', endDate: '2026-07-02' },
    });

    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(result.artifact.window).toMatchObject({
      startDate: '2026-07-01',
      endDate: '2026-07-02',
    });
    expect(result.artifact.records).toHaveLength(1);
    expect(result.artifact.records[0]).toMatchObject({
      query: 'resume builder',
      metrics: { clicks: 5, impressions: 50 },
      ctr: 0.1,
      position: 16,
    });
    expect(result).toMatchObject({ coverageDays: 2, expectedDays: 2 });
  });

  it('prefers complete daily evidence over an overlapping aggregate snapshot', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-history-window-'));
    await record(cwd, {
      ...dailyArtifact('2026-07-01', 50, 500),
      pulledAt: '2026-07-03T08:00:00.000Z',
      window: { startDate: '2026-07-01', endDate: '2026-07-02', timeZone: 'UTC' },
    });
    await record(cwd, dailyArtifact('2026-07-01', 2, 20));
    await record(cwd, dailyArtifact('2026-07-02', 3, 30));

    const result = readMarketingHistoryReportWindow({
      cwd,
      provider: 'searchConsole',
      reportType: 'queryPage',
      window: { startDate: '2026-07-01', endDate: '2026-07-02' },
    });

    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(result.artifact.records[0]?.metrics).toMatchObject({ clicks: 5, impressions: 50 });
    expect(result.artifactPaths).toHaveLength(2);
  });

  it('returns useful partial evidence without relabelling it as a complete period', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-history-window-'));
    await record(cwd, dailyArtifact('2026-07-01', 2, 20));

    const result = readMarketingHistoryReportWindow({
      cwd,
      provider: 'searchConsole',
      reportType: 'queryPage',
      window: { startDate: '2026-07-01', endDate: '2026-07-02' },
    });

    expect(result).toMatchObject({
      status: 'partial',
      coverageDays: 1,
      expectedDays: 2,
      reason: 'Data is available for 1 of 2 days in this range.',
    });
    if (result.status !== 'partial') return;
    expect(result.artifact.records[0]?.metrics).toMatchObject({ clicks: 2, impressions: 20 });
  });

  it.each([
    {
      label: 'accounts',
      mutate: (artifact: MarketingProviderReportArtifact) => ({
        ...artifact,
        accountId: artifact.window.startDate.endsWith('01') ? 'account-a' : 'account-b',
      }),
      reason: 'Reports in this range refer to different accounts.',
    },
    {
      label: 'time zones',
      mutate: (artifact: MarketingProviderReportArtifact) => ({
        ...artifact,
        window: {
          ...artifact.window,
          timeZone: artifact.window.startDate.endsWith('01') ? 'UTC' : 'Asia/Kolkata',
        },
      }),
      reason: 'Reports in this range use different time zones.',
    },
    {
      label: 'currencies',
      mutate: (artifact: MarketingProviderReportArtifact) => ({
        ...artifact,
        records: artifact.records.map((item) => ({
          ...item,
          currency: artifact.window.startDate.endsWith('01') ? 'USD' : 'INR',
        })),
      }),
      reason: 'Reports in this range use different currencies.',
    },
  ])('rejects aggregation across mixed $label', async ({ mutate, reason }) => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-history-window-'));
    await record(cwd, mutate(dailyArtifact('2026-07-01', 2, 20)));
    await record(cwd, mutate(dailyArtifact('2026-07-02', 3, 30)));

    expect(
      readMarketingHistoryReportWindow({
        cwd,
        provider: 'searchConsole',
        reportType: 'queryPage',
        window: { startDate: '2026-07-01', endDate: '2026-07-02' },
      }),
    ).toEqual({ status: 'unavailable', reason });
  });
});
