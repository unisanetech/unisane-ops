import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  marketingCanonicalOutcomeArtifactSchema,
  marketingConfirmedConversionArtifactSchema,
  type MarketingCanonicalOutcomeArtifact,
  type MarketingCanonicalOutcomeRecord,
} from '../schema/report.js';
import { marketingExecutionContextSchema } from '../schema/execution-context.js';
import {
  cacheMarketingConfirmedConversionArtifact,
  createMarketingCanonicalOutcomeReference,
  digestMarketingCanonicalOutcomeArtifact,
  migrateMarketingConfirmedConversionV1,
  readLatestMarketingConfirmedConversionArtifact,
  readMarketingConfirmedConversionStatus,
  writeMarketingConfirmedConversionPull,
} from './confirmed-conversions.js';

const temporaryDirectories: string[] = [];
const window = {
  start: '2026-08-01T00:00:00.000Z',
  end: '2026-08-31T23:59:59.999Z',
  timeZone: 'Asia/Dhaka',
};

function temporaryDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'unisane-canonical-outcomes-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function reference(seed: string): string {
  return createMarketingCanonicalOutcomeReference(seed);
}

function confirmedRecord(seed = 'order-1'): MarketingCanonicalOutcomeRecord {
  return {
    outcomeReference: reference(`outcome:${seed}`),
    correlationReference: reference(`correlation:${seed}`),
    outcomeId: 'purchase',
    sourceEventId: 'purchase-confirmed',
    strategyObjectIds: [],
    revision: 1,
    status: 'confirmed',
    finality: 'server-confirmed',
    occurredAt: '2026-08-15T08:30:00.000Z',
    count: 1,
    value: 1250,
    revenue: 1250,
    currency: 'BDT',
  };
}

function artifact(
  overrides: Partial<MarketingCanonicalOutcomeArtifact> = {},
): MarketingCanonicalOutcomeArtifact {
  return marketingCanonicalOutcomeArtifactSchema.parse({
    kind: 'unisane.growth.canonical-outcomes',
    version: 2,
    projectId: 'ecom',
    environmentId: 'production',
    source: { id: 'orders', system: 'Order service', authority: 'business-system' },
    ingestion: { transport: 'api' },
    revision: 1,
    capturedAt: '2026-09-01T00:00:00.000Z',
    window,
    partial: false,
    records: [confirmedRecord()],
    ...overrides,
  });
}

describe('canonical outcome v2 lifecycle', () => {
  it('rejects legacy snapshots and non-uppercase or unredacted v2 fields during ordinary loading', () => {
    expect(() =>
      marketingConfirmedConversionArtifactSchema.parse({
        version: 1,
        platformId: 'ecom',
        appId: 'web',
        source: 'api',
        pulledAt: '2026-09-01T00:00:00.000Z',
        window: { startDate: '2026-08-01', endDate: '2026-08-31' },
        partial: false,
        records: [],
      }),
    ).toThrow();

    expect(() =>
      marketingCanonicalOutcomeArtifactSchema.parse({
        ...artifact(),
        records: [
          {
            ...confirmedRecord(),
            correlationReference: 'customer@example.com',
            currency: 'bdt',
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      marketingCanonicalOutcomeArtifactSchema.parse({
        ...artifact(),
        source: { id: 'meta-ads', system: 'Meta Ads', authority: 'provider' },
      }),
    ).toThrow();
  });

  it('migrates v1 only through the explicit adapter and redacts private references', () => {
    const privateOrderReference = 'order-private-123';
    const migrated = migrateMarketingConfirmedConversionV1(
      {
        version: 1,
        platformId: 'legacy-platform',
        appId: 'web',
        source: 'manual-export',
        pulledAt: '2026-09-01T00:00:00.000Z',
        window: { startDate: '2026-08-01', endDate: '2026-08-31' },
        partial: false,
        records: [
          {
            id: 'legacy-1',
            conversionId: 'purchase',
            sourceEventId: 'purchase-confirmed',
            transactionId: privateOrderReference,
            occurredAt: '2026-08-15T08:30:00.000Z',
            value: 1250,
            currency: 'bdt',
          },
        ],
      },
      {
        projectId: 'ecom',
        environmentId: 'production',
        sourceId: 'orders',
        sourceSystem: 'Order service',
        window,
      },
    );

    expect(migrated).toMatchObject({ version: 2, projectId: 'ecom', environmentId: 'production' });
    expect(migrated.records[0]).toMatchObject({
      finality: 'server-confirmed',
      status: 'confirmed',
      currency: 'BDT',
    });
    expect(JSON.stringify(migrated)).not.toContain(privateOrderReference);
    expect(migrated.records[0]?.correlationReference).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('is replay-safe and rejects a different payload at the same artifact revision', () => {
    const cwd = temporaryDirectory();
    const first = artifact();

    expect(cacheMarketingConfirmedConversionArtifact(cwd, first).disposition).toBe('ingested');
    expect(cacheMarketingConfirmedConversionArtifact(cwd, first).disposition).toBe('replayed');
    expect(() =>
      cacheMarketingConfirmedConversionArtifact(
        cwd,
        artifact({ records: [{ ...confirmedRecord(), value: 1300, revenue: 1300 }] }),
      ),
    ).toThrow(/REVISION_COLLISION/);
  });

  it('preserves history across corrections and terminal reversals', () => {
    const cwd = temporaryDirectory();
    const first = artifact();
    cacheMarketingConfirmedConversionArtifact(cwd, first);
    const corrected: MarketingCanonicalOutcomeRecord = {
      ...confirmedRecord(),
      revision: 2,
      supersedesRevision: 1,
      status: 'corrected',
      value: 1400,
      revenue: 1400,
    };
    const second = artifact({
      revision: 2,
      previousRevisionDigest: digestMarketingCanonicalOutcomeArtifact(first),
      capturedAt: '2026-09-01T01:00:00.000Z',
      records: [confirmedRecord(), corrected],
    });
    cacheMarketingConfirmedConversionArtifact(cwd, second);
    const reversed: MarketingCanonicalOutcomeRecord = {
      ...corrected,
      revision: 3,
      supersedesRevision: 2,
      status: 'reversed',
      count: 0,
      value: undefined,
      revenue: undefined,
      currency: undefined,
    };
    const third = artifact({
      revision: 3,
      previousRevisionDigest: digestMarketingCanonicalOutcomeArtifact(second),
      capturedAt: '2026-09-01T02:00:00.000Z',
      records: [confirmedRecord(), corrected, reversed],
    });
    cacheMarketingConfirmedConversionArtifact(cwd, third);

    expect(readLatestMarketingConfirmedConversionArtifact({ cwd })).toEqual(third);
    expect(
      readMarketingConfirmedConversionStatus({
        cwd,
        projectId: 'ecom',
        environmentId: 'production',
        now: new Date('2026-09-01T03:00:00.000Z'),
      }),
    ).toMatchObject({
      status: 'reversed',
      recordCount: 3,
      activeRecordCount: 0,
      metrics: { conversions: 0 },
    });
  });

  it('exposes stale, partial, conflicting, and empty outcome states', () => {
    const staleCwd = temporaryDirectory();
    cacheMarketingConfirmedConversionArtifact(staleCwd, artifact());
    expect(
      readMarketingConfirmedConversionStatus({
        cwd: staleCwd,
        now: new Date('2026-09-10T00:00:00.000Z'),
        maxAgeDays: 3,
      }),
    ).toMatchObject({ status: 'stale' });

    const partialCwd = temporaryDirectory();
    cacheMarketingConfirmedConversionArtifact(partialCwd, artifact({ partial: true }));
    expect(
      readMarketingConfirmedConversionStatus({
        cwd: partialCwd,
        now: new Date('2026-09-01T01:00:00.000Z'),
      }),
    ).toMatchObject({
      status: 'partial',
    });

    const conflictingCwd = temporaryDirectory();
    cacheMarketingConfirmedConversionArtifact(
      conflictingCwd,
      artifact({
        records: [
          confirmedRecord(),
          { ...confirmedRecord('order-2'), value: 10, revenue: 10, currency: 'USD' },
        ],
      }),
    );
    expect(
      readMarketingConfirmedConversionStatus({
        cwd: conflictingCwd,
        now: new Date('2026-09-01T01:00:00.000Z'),
      }),
    ).toMatchObject({
      status: 'conflicting',
    });

    const emptyCwd = temporaryDirectory();
    cacheMarketingConfirmedConversionArtifact(emptyCwd, artifact({ records: [] }));
    expect(
      readMarketingConfirmedConversionStatus({
        cwd: emptyCwd,
        now: new Date('2026-09-01T01:00:00.000Z'),
      }),
    ).toMatchObject({
      status: 'empty',
    });
  });

  it('rejects history rewrites, revision gaps, and wrong project reads', () => {
    const cwd = temporaryDirectory();
    const first = artifact();
    cacheMarketingConfirmedConversionArtifact(cwd, first);
    const correction: MarketingCanonicalOutcomeRecord = {
      ...confirmedRecord(),
      revision: 2,
      supersedesRevision: 1,
      status: 'corrected',
    };

    expect(() =>
      cacheMarketingConfirmedConversionArtifact(
        cwd,
        artifact({
          revision: 2,
          previousRevisionDigest: digestMarketingCanonicalOutcomeArtifact(first),
          records: [{ ...confirmedRecord(), value: 999, revenue: 999 }, correction],
        }),
      ),
    ).toThrow(/HISTORY_REWRITE/);
    expect(() =>
      cacheMarketingConfirmedConversionArtifact(
        cwd,
        artifact({
          revision: 3,
          previousRevisionDigest: digestMarketingCanonicalOutcomeArtifact(first),
          records: [confirmedRecord(), correction],
        }),
      ),
    ).toThrow(/REVISION_GAP/);
    expect(
      readMarketingConfirmedConversionStatus({ cwd, projectId: 'another-project' }),
    ).toMatchObject({ status: 'error', exists: true });
  });

  it('validates project and environment at the local ingestion boundary', () => {
    const cwd = temporaryDirectory();
    const inputPath = path.join(cwd, 'canonical-outcomes.json');
    writeFileSync(inputPath, JSON.stringify(artifact({ projectId: 'another-project' })), 'utf8');
    const config = marketingExecutionContextSchema.parse({
      version: 1,
      platformId: 'ecom',
      appId: 'web',
      defaultEnvironment: 'production',
      environments: { production: { production: true } },
      paths: {},
      providers: {},
      attributionStore: {},
      requiredEnv: [],
    });

    expect(() => writeMarketingConfirmedConversionPull(config, { cwd, inputPath })).toThrow(
      /PROJECT_MISMATCH/,
    );
  });
});
