import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportArtifact,
} from '../schema/report.js';
import { summarizeProviderArtifactMetrics } from '../reports/metrics.js';
import { MARKETING_PROVIDER_PULL_CACHE_ROOT } from '../reports/paths.js';
import {
  DEFAULT_MARKETING_HISTORY_RETENTION_POLICY,
  marketingHistoryCatalogSchema,
  marketingHistoryObservationSchema,
  type MarketingHistoryCatalog,
  type MarketingHistoryObservation,
  type MarketingHistoryRetentionPolicy,
} from './contracts.js';

export const MARKETING_HISTORY_CATALOG_PATH = path.join(
  '.unisane',
  'marketing',
  'history',
  'catalog.json',
);

export type RecordMarketingHistoryResult = {
  status: 'recorded' | 'existing';
  observation: MarketingHistoryObservation;
  catalogPath: string;
};

function emptyCatalog(
  now: string,
  retention: MarketingHistoryRetentionPolicy,
): MarketingHistoryCatalog {
  return marketingHistoryCatalogSchema.parse({
    kind: 'unisane.growth.marketing-history-catalog',
    version: 1,
    updatedAt: now,
    retention,
    observations: [],
  });
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function relativeArtifactPath(cwd: string, artifactPath: string): string {
  const relative = path.relative(path.resolve(cwd), path.resolve(artifactPath));
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(
      `[MARKETING_HISTORY_PATH_OUTSIDE_CWD] History artifacts must stay inside the working directory: ${artifactPath}`,
    );
  }
  return relative;
}

function observationSeriesKey(artifact: MarketingProviderReportArtifact): string {
  return [
    artifact.platformId,
    artifact.appId,
    artifact.provider,
    artifact.reportType ?? 'unspecified',
    artifact.accountId ?? 'default',
    artifact.window.startDate,
    artifact.window.endDate,
  ].join(':');
}

function observationFromArtifact(input: {
  cwd: string;
  artifact: MarketingProviderReportArtifact;
  artifactPath: string;
  serialized: string;
  previous?: MarketingHistoryObservation;
}): MarketingHistoryObservation {
  const artifactDigest = digest(input.serialized);
  const seriesKey = observationSeriesKey(input.artifact);
  const currencyCodes = Array.from(
    new Set(input.artifact.records.map((record) => record.currency).filter(Boolean)),
  ).sort();
  return marketingHistoryObservationSchema.parse({
    schemaVersion: 1,
    id: `history.${digest(`${seriesKey}:${artifactDigest}`).slice(0, 24)}`,
    seriesKey,
    ...(input.previous ? { supersedesObservationId: input.previous.id } : {}),
    platformId: input.artifact.platformId,
    appId: input.artifact.appId,
    provider: input.artifact.provider,
    ...(input.artifact.reportType ? { reportType: input.artifact.reportType } : {}),
    ...(input.artifact.accountId ? { accountId: input.artifact.accountId } : {}),
    source: input.artifact.source,
    sampleData: input.artifact.source === 'fixture',
    pulledAt: input.artifact.pulledAt,
    window: input.artifact.window,
    partial: input.artifact.partial,
    recordCount: input.artifact.records.length,
    metrics: summarizeProviderArtifactMetrics(input.artifact),
    currencyCodes,
    artifactPath: relativeArtifactPath(input.cwd, input.artifactPath),
    artifactDigest,
  });
}

function writeCatalog(cwd: string, catalog: MarketingHistoryCatalog): string {
  const catalogPath = path.resolve(cwd, MARKETING_HISTORY_CATALOG_PATH);
  mkdirSync(path.dirname(catalogPath), { recursive: true });
  const temporaryPath = `${catalogPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, catalogPath);
  return catalogPath;
}

export function readMarketingHistoryCatalog(
  cwd: string,
  options: { retention?: MarketingHistoryRetentionPolicy; now?: Date } = {},
): MarketingHistoryCatalog {
  const catalogPath = path.resolve(cwd, MARKETING_HISTORY_CATALOG_PATH);
  if (!existsSync(catalogPath)) {
    return emptyCatalog(
      (options.now ?? new Date()).toISOString(),
      options.retention ?? DEFAULT_MARKETING_HISTORY_RETENTION_POLICY,
    );
  }
  return marketingHistoryCatalogSchema.parse(JSON.parse(readFileSync(catalogPath, 'utf8')));
}

export function ensureMarketingHistoryCatalog(
  cwd: string,
  options: { retention?: MarketingHistoryRetentionPolicy; now?: Date } = {},
): MarketingHistoryCatalog {
  const catalogPath = path.resolve(cwd, MARKETING_HISTORY_CATALOG_PATH);
  if (existsSync(catalogPath)) return readMarketingHistoryCatalog(cwd, options);
  const cacheRoot = path.resolve(cwd, MARKETING_PROVIDER_PULL_CACHE_ROOT);
  if (artifactFiles(cacheRoot).length === 0) return readMarketingHistoryCatalog(cwd, options);
  return rebuildMarketingHistoryCatalog({
    cwd,
    ...(options.retention ? { retention: options.retention } : {}),
    ...(options.now ? { now: options.now } : {}),
  }).catalog;
}

function upsertObservation(input: {
  cwd: string;
  catalog: MarketingHistoryCatalog;
  artifact: MarketingProviderReportArtifact;
  artifactPath: string;
  serialized: string;
}): {
  catalog: MarketingHistoryCatalog;
  observation: MarketingHistoryObservation;
  existing: boolean;
} {
  const artifactDigest = digest(input.serialized);
  const existing = input.catalog.observations.find(
    (observation) => observation.artifactDigest === artifactDigest,
  );
  if (existing) return { catalog: input.catalog, observation: existing, existing: true };
  const seriesKey = observationSeriesKey(input.artifact);
  const previous = input.catalog.observations
    .filter((observation) => observation.seriesKey === seriesKey)
    .sort((left, right) => right.pulledAt.localeCompare(left.pulledAt))[0];
  const observation = observationFromArtifact({
    cwd: input.cwd,
    artifact: input.artifact,
    artifactPath: input.artifactPath,
    serialized: input.serialized,
    ...(previous ? { previous } : {}),
  });
  return {
    catalog: marketingHistoryCatalogSchema.parse({
      ...input.catalog,
      updatedAt: [input.catalog.updatedAt, input.artifact.pulledAt].sort().at(-1),
      observations: [...input.catalog.observations, observation],
    }),
    observation,
    existing: false,
  };
}

export function recordMarketingHistoryArtifact(input: {
  cwd: string;
  artifact: MarketingProviderReportArtifact;
  artifactPath: string;
  serialized?: string;
  retention?: MarketingHistoryRetentionPolicy;
}): RecordMarketingHistoryResult {
  const serialized = input.serialized ?? JSON.stringify(input.artifact);
  const catalogPreviouslyExisted = existsSync(
    path.resolve(input.cwd, MARKETING_HISTORY_CATALOG_PATH),
  );
  const catalog = ensureMarketingHistoryCatalog(input.cwd, {
    ...(input.retention ? { retention: input.retention } : {}),
  });
  const result = upsertObservation({ ...input, catalog, serialized });
  const catalogPath = result.existing
    ? path.resolve(input.cwd, MARKETING_HISTORY_CATALOG_PATH)
    : writeCatalog(input.cwd, result.catalog);
  return {
    status: result.existing && catalogPreviouslyExisted ? 'existing' : 'recorded',
    observation: result.observation,
    catalogPath,
  };
}

function artifactFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return artifactFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json'
      ? [entryPath]
      : [];
  });
}

export function rebuildMarketingHistoryCatalog(input: {
  cwd: string;
  retention?: MarketingHistoryRetentionPolicy;
  now?: Date;
}): { catalog: MarketingHistoryCatalog; catalogPath: string; importedCount: number } {
  const cwd = path.resolve(input.cwd);
  let catalog = emptyCatalog(
    (input.now ?? new Date()).toISOString(),
    input.retention ?? DEFAULT_MARKETING_HISTORY_RETENTION_POLICY,
  );
  let importedCount = 0;
  const files = artifactFiles(path.resolve(cwd, MARKETING_PROVIDER_PULL_CACHE_ROOT))
    .map((artifactPath) => {
      const serialized = readFileSync(artifactPath, 'utf8');
      const artifact = marketingProviderReportArtifactSchema.parse(JSON.parse(serialized));
      return { artifactPath, serialized, artifact };
    })
    .sort((left, right) => left.artifact.pulledAt.localeCompare(right.artifact.pulledAt));
  for (const file of files) {
    const result = upsertObservation({ cwd, catalog, ...file });
    catalog = result.catalog;
    if (!result.existing) importedCount += 1;
  }
  catalog = marketingHistoryCatalogSchema.parse({
    ...catalog,
    updatedAt: (input.now ?? new Date()).toISOString(),
  });
  return { catalog, catalogPath: writeCatalog(cwd, catalog), importedCount };
}
