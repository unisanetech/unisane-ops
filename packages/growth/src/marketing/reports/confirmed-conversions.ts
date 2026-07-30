import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingConfirmedConversionArtifactInputSchema,
  marketingConfirmedConversionArtifactSchema,
  type MarketingConfirmedConversionArtifact,
  type MarketingReportMetrics,
  type MarketingReportSource,
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
  source?: MarketingReportSource;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
  now?: Date;
};

export type MarketingConfirmedConversionPullResult = {
  ok: boolean;
  path: string;
  latestPath: string;
  recordCount: number;
  pulledAt: string;
  window: MarketingConfirmedConversionArtifact['window'];
};

export type MarketingConfirmedConversionStatus = {
  status: 'fresh' | 'stale' | 'partial' | 'missing' | 'error';
  path: string;
  exists: boolean;
  message: string;
  pulledAt?: string;
  ageDays?: number;
  recordCount?: number;
  window?: MarketingConfirmedConversionArtifact['window'];
  metrics?: MarketingReportMetrics;
};

export type MarketingConfirmedConversionStatusOptions = {
  cwd?: string;
  maxAgeDays?: number;
  now?: Date;
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function safeTimestamp(iso: string): string {
  return iso.replaceAll(':', '-').replaceAll('.', '-');
}

function normalizeConfirmedConversionArtifact(
  config: MarketingExecutionContext,
  value: unknown,
  options: MarketingConfirmedConversionPullOptions,
): MarketingConfirmedConversionArtifact {
  const parsed = marketingConfirmedConversionArtifactInputSchema.parse(value);
  const startDate = options.startDate ?? parsed.window?.startDate;
  const endDate = options.endDate ?? parsed.window?.endDate;
  if (!startDate || !endDate) {
    throw new Error(
      '[MARKETING_CONFIRMED_CONVERSIONS_WINDOW_REQUIRED] Confirmed conversion input must include window.startDate/window.endDate or pass --start-date and --end-date.',
    );
  }
  return marketingConfirmedConversionArtifactSchema.parse({
    ...parsed,
    platformId: parsed.platformId ?? config.platformId,
    appId: parsed.appId ?? config.appId,
    source: options.source ?? parsed.source,
    pulledAt: parsed.pulledAt ?? (options.now ?? new Date()).toISOString(),
    window: {
      startDate,
      endDate,
      timeZone: options.timeZone ?? parsed.window?.timeZone,
    },
  });
}

export function cacheMarketingConfirmedConversionArtifact(
  cwd: string,
  artifact: MarketingConfirmedConversionArtifact,
): MarketingConfirmedConversionPullResult {
  const outputDir = confirmedConversionCacheDir(cwd);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${safeTimestamp(artifact.pulledAt)}.json`);
  const latestPath = confirmedConversionLatestPath(cwd);
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(outputPath, serialized, 'utf8');
  writeFileSync(latestPath, serialized, 'utf8');
  return {
    ok: true,
    path: outputPath,
    latestPath,
    recordCount: artifact.records.length,
    pulledAt: artifact.pulledAt,
    window: artifact.window,
  };
}

export function writeMarketingConfirmedConversionPull(
  config: MarketingExecutionContext,
  options: MarketingConfirmedConversionPullOptions,
): MarketingConfirmedConversionPullResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = normalizeConfirmedConversionArtifact(
    config,
    readJsonFile(path.resolve(cwd, options.inputPath)),
    options,
  );
  return cacheMarketingConfirmedConversionArtifact(cwd, artifact);
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
      message: 'No latest Unisane-confirmed conversion artifact exists.',
    };
  }

  try {
    const artifact = marketingConfirmedConversionArtifactSchema.parse(readJsonFile(latestPath));
    const nowMs = (options.now ?? new Date()).getTime();
    const maxAgeDays = options.maxAgeDays ?? 3;
    const ageDays = Math.max(0, Math.round((nowMs - Date.parse(artifact.pulledAt)) / 86_400_000));
    const stale = ageDays > maxAgeDays;
    return {
      status: artifact.partial ? 'partial' : stale ? 'stale' : 'fresh',
      path: latestPath,
      exists: true,
      message: artifact.partial
        ? 'Latest Unisane-confirmed conversion artifact is partial.'
        : stale
          ? `Latest Unisane-confirmed conversion artifact is ${ageDays} days old.`
          : 'Latest Unisane-confirmed conversion artifact is fresh.',
      pulledAt: artifact.pulledAt,
      ageDays,
      recordCount: artifact.records.length,
      window: artifact.window,
      metrics: summarizeConfirmedConversionMetrics(artifact),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown confirmed conversion parse error';
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
  options: { cwd?: string } = {},
): MarketingConfirmedConversionArtifact | undefined {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const latestPath = confirmedConversionLatestPath(cwd);
  if (!existsSync(latestPath)) return undefined;
  return marketingConfirmedConversionArtifactSchema.parse(readJsonFile(latestPath));
}
