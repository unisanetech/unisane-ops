import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MarketingProviderReportArtifact } from '../schema/report.js';
import {
  MARKETING_HISTORY_CATALOG_PATH,
  readMarketingHistoryCatalog,
  rebuildMarketingHistoryCatalog,
  recordMarketingHistoryArtifact,
} from './catalog.js';
import { compareLatestMarketingHistoryPeriods, queryMarketingHistoryCatalog } from './query.js';

function artifact(input: {
  pulledAt: string;
  startDate: string;
  endDate: string;
  cost: number;
  clicks?: number;
  partial?: boolean;
}): MarketingProviderReportArtifact {
  return {
    version: 1,
    platformId: 'example',
    appId: 'app',
    provider: 'googleAds',
    reportType: 'campaign',
    source: 'api',
    accountId: 'ads-1',
    pulledAt: input.pulledAt,
    window: { startDate: input.startDate, endDate: input.endDate },
    partial: input.partial ?? false,
    records: [
      {
        id: 'campaign-1',
        level: 'campaign',
        currency: 'USD',
        metrics: { cost: input.cost, clicks: input.clicks ?? 0 },
      },
    ],
  };
}

describe('marketing history', () => {
  it('records idempotent observations and supersedes corrected windows', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-growth-history-'));
    const first = artifact({
      pulledAt: '2026-07-08T00:00:00.000Z',
      startDate: '2026-07-01',
      endDate: '2026-07-07',
      cost: 100,
    });
    const firstPath = path.join(cwd, 'first.json');
    writeFileSync(firstPath, JSON.stringify(first));
    const recorded = recordMarketingHistoryArtifact({
      cwd,
      artifact: first,
      artifactPath: firstPath,
    });
    const repeated = recordMarketingHistoryArtifact({
      cwd,
      artifact: first,
      artifactPath: firstPath,
    });
    expect(recorded.status).toBe('recorded');
    expect(repeated.status).toBe('existing');

    const corrected = artifact({
      pulledAt: '2026-07-09T00:00:00.000Z',
      startDate: '2026-07-01',
      endDate: '2026-07-07',
      cost: 105,
    });
    const correctedPath = path.join(cwd, 'corrected.json');
    writeFileSync(correctedPath, JSON.stringify(corrected));
    recordMarketingHistoryArtifact({ cwd, artifact: corrected, artifactPath: correctedPath });

    const catalog = readMarketingHistoryCatalog(cwd);
    expect(catalog.observations).toHaveLength(2);
    expect(catalog.observations[1]?.supersedesObservationId).toBe(catalog.observations[0]?.id);
    expect(
      JSON.parse(await readFile(path.join(cwd, MARKETING_HISTORY_CATALOG_PATH), 'utf8')),
    ).toMatchObject({
      kind: 'unisane.growth.marketing-history-catalog',
      version: 1,
    });
  });

  it('returns only evidence-supported equal-window comparisons', () => {
    const observations = [
      artifact({
        pulledAt: '2026-07-08T00:00:00.000Z',
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        cost: 100,
      }),
      artifact({
        pulledAt: '2026-07-15T00:00:00.000Z',
        startDate: '2026-07-08',
        endDate: '2026-07-14',
        cost: 125,
      }),
    ];
    const catalog = {
      kind: 'unisane.growth.marketing-history-catalog' as const,
      version: 1 as const,
      updatedAt: '2026-07-15T00:00:00.000Z',
      retention: {
        rawArtifactDays: 90,
        normalizedDailyMonths: 24,
        monthlyRollupMonths: 60,
        researchSnapshotMonths: 13,
        preserveMilestones: true,
        preserveReceipts: true,
      },
      observations: observations.map((value, index) => ({
        schemaVersion: 1 as const,
        id: `history-${index}`,
        seriesKey: `series-${index}`,
        platformId: value.platformId,
        appId: value.appId,
        provider: value.provider,
        reportType: value.reportType,
        accountId: value.accountId,
        source: value.source,
        sampleData: false,
        pulledAt: value.pulledAt,
        window: value.window,
        partial: false,
        recordCount: 1,
        metrics: value.records[0]!.metrics,
        currencyCodes: ['USD'],
        artifactPath: `${index}.json`,
        artifactDigest: String(index).padStart(64, '0'),
      })),
    };
    const result = queryMarketingHistoryCatalog(catalog, {
      provider: 'googleAds',
      reportType: 'campaign',
      accountId: 'ads-1',
      metric: 'cost',
    });
    const comparison = compareLatestMarketingHistoryPeriods(result);
    expect(result.coverage).toMatchObject({ status: 'complete', coveredDayCount: 14 });
    expect(comparison).toMatchObject({
      status: 'available',
      absoluteChange: 25,
      percentageChange: 25,
    });
  });

  it('uses daily points instead of an overlapping aggregate for a bounded query', () => {
    const values = [
      artifact({
        pulledAt: '2026-07-03T00:00:00.000Z',
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        cost: 999,
      }),
      artifact({
        pulledAt: '2026-07-01T12:00:00.000Z',
        startDate: '2026-07-01',
        endDate: '2026-07-01',
        cost: 10,
      }),
      artifact({
        pulledAt: '2026-07-02T12:00:00.000Z',
        startDate: '2026-07-02',
        endDate: '2026-07-02',
        cost: 20,
      }),
    ];
    const catalog = {
      kind: 'unisane.growth.marketing-history-catalog' as const,
      version: 1 as const,
      updatedAt: '2026-07-03T00:00:00.000Z',
      retention: {
        rawArtifactDays: 90,
        normalizedDailyMonths: 24,
        monthlyRollupMonths: 60,
        researchSnapshotMonths: 13,
        preserveMilestones: true,
        preserveReceipts: true,
      },
      observations: values.map((value, index) => ({
        schemaVersion: 1 as const,
        id: `bounded-history-${index}`,
        seriesKey: `bounded-series-${index}`,
        platformId: value.platformId,
        appId: value.appId,
        provider: value.provider,
        reportType: value.reportType,
        accountId: value.accountId,
        source: value.source,
        sampleData: false,
        pulledAt: value.pulledAt,
        window: value.window,
        partial: false,
        recordCount: 1,
        metrics: value.records[0]!.metrics,
        currencyCodes: ['USD'],
        artifactPath: `bounded-${index}.json`,
        artifactDigest: String(index + 10).padStart(64, '0'),
      })),
    };

    const result = queryMarketingHistoryCatalog(catalog, {
      provider: 'googleAds',
      reportType: 'campaign',
      metric: 'cost',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
    });

    expect(result.points.map((point) => point.value)).toEqual([10, 20]);
    expect(result.coverage).toMatchObject({
      status: 'complete',
      coveredDayCount: 2,
      overlappingWindowCount: 0,
    });
  });

  it('rejects cost comparisons when a period mixes currencies', () => {
    const observations = [
      artifact({
        pulledAt: '2026-07-08T00:00:00.000Z',
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        cost: 100,
      }),
      artifact({
        pulledAt: '2026-07-15T00:00:00.000Z',
        startDate: '2026-07-08',
        endDate: '2026-07-14',
        cost: 125,
      }),
    ];
    const catalog = {
      kind: 'unisane.growth.marketing-history-catalog' as const,
      version: 1 as const,
      updatedAt: '2026-07-15T00:00:00.000Z',
      retention: {
        rawArtifactDays: 90,
        normalizedDailyMonths: 24,
        monthlyRollupMonths: 60,
        researchSnapshotMonths: 13,
        preserveMilestones: true,
        preserveReceipts: true,
      },
      observations: observations.map((value, index) => ({
        schemaVersion: 1 as const,
        id: `history-${index}`,
        seriesKey: `series-${index}`,
        platformId: value.platformId,
        appId: value.appId,
        provider: value.provider,
        reportType: value.reportType,
        accountId: value.accountId,
        source: value.source,
        sampleData: false,
        pulledAt: value.pulledAt,
        window: value.window,
        partial: false,
        recordCount: 1,
        metrics: value.records[0]!.metrics,
        currencyCodes: index === 0 ? ['USD'] : ['EUR', 'USD'],
        artifactPath: `${index}.json`,
        artifactDigest: String(index).padStart(64, '0'),
      })),
    };
    const result = queryMarketingHistoryCatalog(catalog, {
      provider: 'googleAds',
      reportType: 'campaign',
      accountId: 'ads-1',
      metric: 'cost',
    });

    expect(result.comparable).toBe(false);
    expect(compareLatestMarketingHistoryPeriods(result)).toMatchObject({
      status: 'unavailable',
      reason: 'One or more cost periods do not contain exactly one comparable currency.',
    });
  });

  it('rebuilds the catalog from timestamped raw artifacts and skips latest aliases', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-growth-history-rebuild-'));
    const cache = path.join(cwd, '.unisane/marketing/cache/provider-pulls/googleAds/campaign');
    mkdirSync(cache, { recursive: true });
    const value = artifact({
      pulledAt: '2026-07-08T00:00:00.000Z',
      startDate: '2026-07-01',
      endDate: '2026-07-07',
      cost: 100,
    });
    writeFileSync(path.join(cache, '2026-07-08T00-00-00-000Z.json'), JSON.stringify(value));
    writeFileSync(path.join(cache, 'latest.json'), JSON.stringify(value));
    const rebuilt = rebuildMarketingHistoryCatalog({
      cwd,
      now: new Date('2026-07-09T00:00:00.000Z'),
    });
    expect(rebuilt.importedCount).toBe(1);
    expect(rebuilt.catalog.observations).toHaveLength(1);
  });
});
