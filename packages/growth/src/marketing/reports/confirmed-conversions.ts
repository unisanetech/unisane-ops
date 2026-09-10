import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingCanonicalOutcomeArtifactSchema,
  marketingConfirmedConversionV1ArtifactSchema,
  type MarketingCanonicalOutcomeArtifact,
  type MarketingCanonicalOutcomeRecord,
  type MarketingConfirmedConversionV1Artifact,
  type MarketingReportMetrics,
} from '../schema/report.js';
import {
  MARKETING_CONFIRMED_CONVERSION_CACHE_ROOT,
  confirmedConversionCacheDir,
  confirmedConversionLatestPath,
} from './paths.js';
import { summarizeConfirmedConversionMetrics } from './metrics.js';

export type MarketingConfirmedConversionPullOptions = {
  cwd?: string;
  inputPath: string;
};

export type MarketingConfirmedConversionMigrationOptions = {
  projectId: string;
  environmentId: string;
  sourceId: string;
  sourceSystem: string;
  window: MarketingCanonicalOutcomeArtifact['window'];
};

export type MarketingConfirmedConversionPullResult = {
  ok: boolean;
  disposition: 'ingested' | 'replayed';
  path: string;
  latestPath: string;
  recordCount: number;
  capturedAt: string;
  revision: number;
  digest: string;
  window: MarketingCanonicalOutcomeArtifact['window'];
};

export type MarketingConfirmedConversionStatus = {
  status:
    | 'fresh'
    | 'stale'
    | 'partial'
    | 'conflicting'
    | 'reversed'
    | 'empty'
    | 'missing'
    | 'error';
  path: string;
  exists: boolean;
  message: string;
  capturedAt?: string;
  pulledAt?: string;
  ageDays?: number;
  recordCount?: number;
  activeRecordCount?: number;
  revision?: number;
  sourceId?: string;
  digest?: string;
  window?: MarketingCanonicalOutcomeArtifact['window'];
  metrics?: MarketingReportMetrics;
};

export type MarketingConfirmedConversionStatusOptions = {
  cwd?: string;
  maxAgeDays?: number;
  now?: Date;
  projectId?: string;
  environmentId?: string;
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function serializedArtifact(artifact: MarketingCanonicalOutcomeArtifact): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function createMarketingCanonicalOutcomeReference(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(
      '[MARKETING_CANONICAL_OUTCOME_REFERENCE_REQUIRED] A private source reference is required before it can be redacted.',
    );
  }
  return sha256(normalized);
}

export function digestMarketingCanonicalOutcomeArtifact(
  artifact: MarketingCanonicalOutcomeArtifact,
): string {
  return sha256(JSON.stringify(marketingCanonicalOutcomeArtifactSchema.parse(artifact)));
}

function ledgerKey(artifact: MarketingCanonicalOutcomeArtifact): string {
  return sha256(
    JSON.stringify({
      projectId: artifact.projectId,
      environmentId: artifact.environmentId,
      sourceId: artifact.source.id,
      window: artifact.window,
    }),
  );
}

function artifactFileName(artifact: MarketingCanonicalOutcomeArtifact): string {
  return `${ledgerKey(artifact).slice('sha256:'.length)}-r${artifact.revision}.json`;
}

function readV2Artifact(filePath: string): MarketingCanonicalOutcomeArtifact {
  return marketingCanonicalOutcomeArtifactSchema.parse(readJsonFile(filePath));
}

function tryReadV2Artifact(filePath: string): MarketingCanonicalOutcomeArtifact | undefined {
  try {
    return readV2Artifact(filePath);
  } catch {
    return undefined;
  }
}

function ledgerArtifacts(
  cwd: string,
  artifact: MarketingCanonicalOutcomeArtifact,
): MarketingCanonicalOutcomeArtifact[] {
  const outputDir = confirmedConversionCacheDir(cwd);
  if (!existsSync(outputDir)) return [];
  const key = ledgerKey(artifact);
  return readdirSync(outputDir)
    .filter((entry) => entry.endsWith('.json') && entry !== 'latest.json')
    .map((entry) => tryReadV2Artifact(path.join(outputDir, entry)))
    .filter(
      (candidate): candidate is MarketingCanonicalOutcomeArtifact =>
        candidate !== undefined && ledgerKey(candidate) === key,
    )
    .sort((left, right) => left.revision - right.revision);
}

function recordKey(record: MarketingCanonicalOutcomeRecord): string {
  return `${record.outcomeReference}:${record.revision}`;
}

function assertAppendOnlyHistory(
  previous: MarketingCanonicalOutcomeArtifact,
  next: MarketingCanonicalOutcomeArtifact,
): void {
  const nextRecords = new Map(next.records.map((record) => [recordKey(record), record]));
  for (const previousRecord of previous.records) {
    const nextRecord = nextRecords.get(recordKey(previousRecord));
    if (!nextRecord || JSON.stringify(nextRecord) !== JSON.stringify(previousRecord)) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_HISTORY_REWRITE] A later artifact must preserve every prior outcome revision exactly.',
      );
    }
  }
}

function assertRecordedLedger(cwd: string, artifact: MarketingCanonicalOutcomeArtifact): void {
  const ledger = ledgerArtifacts(cwd, artifact);
  if (ledger.length !== artifact.revision) {
    throw new Error(
      '[MARKETING_CANONICAL_OUTCOME_LEDGER_INCOMPLETE] The immutable canonical outcome revision chain is incomplete.',
    );
  }
  ledger.forEach((candidate, index) => {
    if (candidate.revision !== index + 1) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_LEDGER_CONFLICT] The immutable canonical outcome revision chain is not consecutive.',
      );
    }
    const previous = ledger[index - 1];
    if (previous) {
      if (candidate.previousRevisionDigest !== digestMarketingCanonicalOutcomeArtifact(previous)) {
        throw new Error(
          '[MARKETING_CANONICAL_OUTCOME_LEDGER_CONFLICT] The immutable canonical outcome digest chain is invalid.',
        );
      }
      assertAppendOnlyHistory(previous, candidate);
    }
  });
  const recorded = ledger.at(-1);
  if (
    !recorded ||
    digestMarketingCanonicalOutcomeArtifact(recorded) !==
      digestMarketingCanonicalOutcomeArtifact(artifact)
  ) {
    throw new Error(
      '[MARKETING_CANONICAL_OUTCOME_LATEST_CONFLICT] The latest pointer does not match the immutable ledger.',
    );
  }
}

function assertArtifactScope(
  config: MarketingExecutionContext,
  artifact: MarketingCanonicalOutcomeArtifact,
): void {
  if (artifact.projectId !== config.platformId) {
    throw new Error(
      `[MARKETING_CANONICAL_OUTCOME_PROJECT_MISMATCH] Expected project ${config.platformId}, received ${artifact.projectId}.`,
    );
  }
  if (artifact.environmentId !== config.defaultEnvironment) {
    throw new Error(
      `[MARKETING_CANONICAL_OUTCOME_ENVIRONMENT_MISMATCH] Expected environment ${config.defaultEnvironment}, received ${artifact.environmentId}.`,
    );
  }
}

export function latestMarketingCanonicalOutcomeRecords(
  artifact: MarketingCanonicalOutcomeArtifact,
): MarketingCanonicalOutcomeRecord[] {
  const latest = new Map<string, MarketingCanonicalOutcomeRecord>();
  for (const record of artifact.records) {
    const current = latest.get(record.outcomeReference);
    if (!current || record.revision > current.revision) latest.set(record.outcomeReference, record);
  }
  return [...latest.values()].sort((left, right) =>
    left.outcomeReference.localeCompare(right.outcomeReference),
  );
}

function activeMarketingCanonicalOutcomeRecords(
  artifact: MarketingCanonicalOutcomeArtifact,
): MarketingCanonicalOutcomeRecord[] {
  return latestMarketingCanonicalOutcomeRecords(artifact).filter(
    (record) => record.status !== 'reversed',
  );
}

function hasCurrencyConflict(records: readonly MarketingCanonicalOutcomeRecord[]): boolean {
  const currenciesByOutcome = new Map<string, Set<string>>();
  for (const record of records) {
    if (!record.currency) continue;
    const currencies = currenciesByOutcome.get(record.outcomeId) ?? new Set<string>();
    currencies.add(record.currency);
    currenciesByOutcome.set(record.outcomeId, currencies);
  }
  return [...currenciesByOutcome.values()].some((currencies) => currencies.size > 1);
}

export function cacheMarketingConfirmedConversionArtifact(
  cwd: string,
  value: MarketingCanonicalOutcomeArtifact,
): MarketingConfirmedConversionPullResult {
  const artifact = marketingCanonicalOutcomeArtifactSchema.parse(value);
  const outputDir = confirmedConversionCacheDir(cwd);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, artifactFileName(artifact));
  const latestPath = confirmedConversionLatestPath(cwd);
  const digest = digestMarketingCanonicalOutcomeArtifact(artifact);
  const existingAtRevision = ledgerArtifacts(cwd, artifact).find(
    (candidate) => candidate.revision === artifact.revision,
  );
  if (existingAtRevision) {
    if (digestMarketingCanonicalOutcomeArtifact(existingAtRevision) !== digest) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_REVISION_COLLISION] This source and window already have different content at the requested revision.',
      );
    }
    const currentLatest = existsSync(latestPath) ? tryReadV2Artifact(latestPath) : undefined;
    if (!currentLatest || Date.parse(artifact.capturedAt) >= Date.parse(currentLatest.capturedAt)) {
      writeFileSync(latestPath, serializedArtifact(artifact), 'utf8');
    }
    return {
      ok: true,
      disposition: 'replayed',
      path: outputPath,
      latestPath,
      recordCount: artifact.records.length,
      capturedAt: artifact.capturedAt,
      revision: artifact.revision,
      digest,
      window: artifact.window,
    };
  }

  const ledger = ledgerArtifacts(cwd, artifact);
  const previous = ledger.at(-1);
  if (!previous && artifact.revision !== 1) {
    throw new Error(
      '[MARKETING_CANONICAL_OUTCOME_PREVIOUS_REVISION_MISSING] A new ledger must begin at artifact revision 1.',
    );
  }
  if (previous) {
    if (artifact.revision !== previous.revision + 1) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_REVISION_GAP] Artifact revisions must be ingested consecutively.',
      );
    }
    if (artifact.previousRevisionDigest !== digestMarketingCanonicalOutcomeArtifact(previous)) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_PREVIOUS_DIGEST_MISMATCH] The artifact does not extend the recorded revision.',
      );
    }
    assertAppendOnlyHistory(previous, artifact);
  }

  const serialized = serializedArtifact(artifact);
  writeFileSync(outputPath, serialized, { encoding: 'utf8', flag: 'wx' });
  const currentLatest = existsSync(latestPath) ? tryReadV2Artifact(latestPath) : undefined;
  if (!currentLatest || Date.parse(artifact.capturedAt) >= Date.parse(currentLatest.capturedAt)) {
    writeFileSync(latestPath, serialized, 'utf8');
  }
  return {
    ok: true,
    disposition: 'ingested',
    path: outputPath,
    latestPath,
    recordCount: artifact.records.length,
    capturedAt: artifact.capturedAt,
    revision: artifact.revision,
    digest,
    window: artifact.window,
  };
}

export function writeMarketingConfirmedConversionPull(
  config: MarketingExecutionContext,
  options: MarketingConfirmedConversionPullOptions,
): MarketingConfirmedConversionPullResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = marketingCanonicalOutcomeArtifactSchema.parse(
    readJsonFile(path.resolve(cwd, options.inputPath)),
  );
  assertArtifactScope(config, artifact);
  return cacheMarketingConfirmedConversionArtifact(cwd, artifact);
}

function legacyReferenceSeed(
  record: MarketingConfirmedConversionV1Artifact['records'][number],
): string {
  return record.transactionId ?? record.eventId ?? record.id;
}

export function migrateMarketingConfirmedConversionV1(
  value: unknown,
  options: MarketingConfirmedConversionMigrationOptions,
): MarketingCanonicalOutcomeArtifact {
  const legacy = marketingConfirmedConversionV1ArtifactSchema.parse(value);
  const records = legacy.records.map((record) => {
    if (!record.occurredAt) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_OCCURRED_AT_REQUIRED] Legacy records require occurredAt for explicit v2 migration.',
      );
    }
    const hasMoney =
      record.value !== undefined || record.revenue !== undefined || record.margin !== undefined;
    if (hasMoney && !record.currency) {
      throw new Error(
        '[MARKETING_CANONICAL_OUTCOME_CURRENCY_REQUIRED] Legacy monetary records require currency for explicit v2 migration.',
      );
    }
    const reference = createMarketingCanonicalOutcomeReference(
      `${options.projectId}:${options.environmentId}:${options.sourceId}:${legacyReferenceSeed(record)}`,
    );
    return {
      outcomeReference: reference,
      correlationReference: reference,
      outcomeId: record.conversionId,
      sourceEventId: record.sourceEventId,
      strategyObjectIds: [],
      revision: 1,
      status: 'confirmed' as const,
      finality: 'server-confirmed' as const,
      occurredAt: record.occurredAt,
      count: 1,
      ...(record.value !== undefined ? { value: record.value } : {}),
      ...(record.revenue !== undefined ? { revenue: record.revenue } : {}),
      ...(record.margin !== undefined ? { margin: record.margin } : {}),
      ...(record.currency ? { currency: record.currency.toUpperCase() } : {}),
    };
  });
  return marketingCanonicalOutcomeArtifactSchema.parse({
    kind: 'unisane.growth.canonical-outcomes',
    version: 2,
    projectId: options.projectId,
    environmentId: options.environmentId,
    source: {
      id: options.sourceId,
      system: options.sourceSystem,
      authority: 'business-system',
    },
    ingestion: { transport: legacy.source },
    revision: 1,
    capturedAt: legacy.pulledAt,
    window: options.window,
    partial: legacy.partial,
    records,
  });
}

export function readMarketingConfirmedConversionStatus(
  options: MarketingConfirmedConversionStatusOptions = {},
): MarketingConfirmedConversionStatus {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const latestPath = confirmedConversionLatestPath(cwd);
  if (!existsSync(latestPath)) {
    return {
      status: 'missing',
      path: latestPath,
      exists: false,
      message: 'No latest server-confirmed canonical outcome artifact exists.',
    };
  }

  try {
    const artifact = readV2Artifact(latestPath);
    if (options.projectId && artifact.projectId !== options.projectId) {
      throw new Error(
        `[MARKETING_CANONICAL_OUTCOME_PROJECT_MISMATCH] Expected project ${options.projectId}, received ${artifact.projectId}.`,
      );
    }
    if (options.environmentId && artifact.environmentId !== options.environmentId) {
      throw new Error(
        `[MARKETING_CANONICAL_OUTCOME_ENVIRONMENT_MISMATCH] Expected environment ${options.environmentId}, received ${artifact.environmentId}.`,
      );
    }
    const nowMs = (options.now ?? new Date()).getTime();
    const maxAgeDays = options.maxAgeDays ?? 3;
    const ageDays = Math.max(0, Math.round((nowMs - Date.parse(artifact.capturedAt)) / 86_400_000));
    assertRecordedLedger(cwd, artifact);
    const activeRecords = activeMarketingCanonicalOutcomeRecords(artifact);
    const latestRecords = latestMarketingCanonicalOutcomeRecords(artifact);
    const stale = ageDays > maxAgeDays;
    const futureCapture = Date.parse(artifact.capturedAt) > nowMs + 5 * 60_000;
    const conflicting = hasCurrencyConflict(activeRecords) || futureCapture;
    const status = artifact.partial
      ? 'partial'
      : conflicting
        ? 'conflicting'
        : latestRecords.length === 0
          ? 'empty'
          : activeRecords.length === 0
            ? 'reversed'
            : stale
              ? 'stale'
              : 'fresh';
    const message =
      status === 'partial'
        ? 'Latest canonical outcome artifact is partial.'
        : status === 'conflicting'
          ? futureCapture
            ? 'Latest canonical outcome artifact has a capture time in the future.'
            : 'Latest canonical outcomes contain conflicting currencies for the same outcome.'
          : status === 'empty'
            ? 'Latest canonical outcome artifact contains no outcomes.'
            : status === 'reversed'
              ? 'Every canonical outcome in the latest artifact has been reversed.'
              : status === 'stale'
                ? `Latest canonical outcome artifact is ${ageDays} days old.`
                : 'Latest server-confirmed canonical outcome artifact is fresh.';
    return {
      status,
      path: latestPath,
      exists: true,
      message,
      capturedAt: artifact.capturedAt,
      pulledAt: artifact.capturedAt,
      ageDays,
      recordCount: artifact.records.length,
      activeRecordCount: activeRecords.length,
      revision: artifact.revision,
      sourceId: artifact.source.id,
      digest: digestMarketingCanonicalOutcomeArtifact(artifact),
      window: artifact.window,
      metrics: summarizeConfirmedConversionMetrics(artifact),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown canonical outcome parse error';
    return {
      status: 'error',
      path: latestPath,
      exists: true,
      message,
    };
  }
}

export function confirmedConversionCacheRoot(cwd: string): string {
  return path.resolve(cwd, MARKETING_CONFIRMED_CONVERSION_CACHE_ROOT);
}

export function readLatestMarketingConfirmedConversionArtifact(
  options: { cwd?: string; projectId?: string; environmentId?: string } = {},
): MarketingCanonicalOutcomeArtifact | undefined {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const latestPath = confirmedConversionLatestPath(cwd);
  if (!existsSync(latestPath)) return undefined;
  const artifact = readV2Artifact(latestPath);
  assertRecordedLedger(cwd, artifact);
  if (options.projectId && artifact.projectId !== options.projectId) {
    throw new Error(
      `[MARKETING_CANONICAL_OUTCOME_PROJECT_MISMATCH] Expected project ${options.projectId}, received ${artifact.projectId}.`,
    );
  }
  if (options.environmentId && artifact.environmentId !== options.environmentId) {
    throw new Error(
      `[MARKETING_CANONICAL_OUTCOME_ENVIRONMENT_MISMATCH] Expected environment ${options.environmentId}, received ${artifact.environmentId}.`,
    );
  }
  return artifact;
}
