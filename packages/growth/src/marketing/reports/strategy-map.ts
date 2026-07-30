import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingStrategyMapArtifactInputSchema,
  marketingStrategyMapArtifactSchema,
  type MarketingReportSource,
  type MarketingStrategyMapArtifact,
} from '../schema/report.js';
import {
  MARKETING_STRATEGY_MAP_CACHE_ROOT,
  strategyMapCacheDir,
  strategyMapLatestPath,
} from './paths.js';

export type MarketingStrategyMapPullOptions = {
  cwd?: string;
  inputPath: string;
  source?: MarketingReportSource;
  now?: Date;
};

export type MarketingStrategyMapPullResult = {
  ok: boolean;
  path: string;
  latestPath: string;
  objectCount: number;
  pulledAt: string;
};

export type MarketingStrategyMapStatus = {
  status: 'fresh' | 'stale' | 'missing' | 'error';
  path: string;
  exists: boolean;
  message: string;
  pulledAt?: string;
  ageDays?: number;
  objectCount?: number;
};

export type MarketingStrategyMapStatusOptions = {
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

function normalizeStrategyMapArtifact(
  config: MarketingExecutionContext,
  value: unknown,
  options: MarketingStrategyMapPullOptions,
): MarketingStrategyMapArtifact {
  const parsed = marketingStrategyMapArtifactInputSchema.parse(value);
  return marketingStrategyMapArtifactSchema.parse({
    ...parsed,
    platformId: parsed.platformId ?? config.platformId,
    appId: parsed.appId ?? config.appId,
    source: options.source ?? parsed.source,
    pulledAt: parsed.pulledAt ?? (options.now ?? new Date()).toISOString(),
  });
}

export function cacheMarketingStrategyMapArtifact(
  cwd: string,
  artifact: MarketingStrategyMapArtifact,
): MarketingStrategyMapPullResult {
  const outputDir = strategyMapCacheDir(cwd);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${safeTimestamp(artifact.pulledAt)}.json`);
  const latestPath = strategyMapLatestPath(cwd);
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(outputPath, serialized, 'utf8');
  writeFileSync(latestPath, serialized, 'utf8');
  return {
    ok: true,
    path: outputPath,
    latestPath,
    objectCount: artifact.objects.length,
    pulledAt: artifact.pulledAt,
  };
}

export function writeMarketingStrategyMapPull(
  config: MarketingExecutionContext,
  options: MarketingStrategyMapPullOptions,
): MarketingStrategyMapPullResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = normalizeStrategyMapArtifact(
    config,
    readJsonFile(path.resolve(cwd, options.inputPath)),
    options,
  );
  return cacheMarketingStrategyMapArtifact(cwd, artifact);
}

export function readMarketingStrategyMapStatus(
  options: MarketingStrategyMapStatusOptions = {},
): MarketingStrategyMapStatus {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const latestPath = strategyMapLatestPath(cwd);
  if (!existsSync(latestPath)) {
    return {
      status: 'missing',
      path: latestPath,
      exists: false,
      message: 'No latest marketing strategy-map artifact exists.',
    };
  }

  try {
    const artifact = marketingStrategyMapArtifactSchema.parse(readJsonFile(latestPath));
    const nowMs = (options.now ?? new Date()).getTime();
    const maxAgeDays = options.maxAgeDays ?? 14;
    const ageDays = Math.max(0, Math.round((nowMs - Date.parse(artifact.pulledAt)) / 86_400_000));
    const stale = ageDays > maxAgeDays;
    return {
      status: stale ? 'stale' : 'fresh',
      path: latestPath,
      exists: true,
      message: stale
        ? `Latest marketing strategy-map artifact is ${ageDays} days old.`
        : 'Latest marketing strategy-map artifact is fresh.',
      pulledAt: artifact.pulledAt,
      ageDays,
      objectCount: artifact.objects.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown strategy-map parse error';
    return {
      status: 'error',
      path: latestPath,
      exists: true,
      message,
    };
  }
}

export function readLatestMarketingStrategyMapArtifact(
  options: { cwd?: string } = {},
): MarketingStrategyMapArtifact | undefined {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const latestPath = strategyMapLatestPath(cwd);
  if (!existsSync(latestPath)) return undefined;
  return marketingStrategyMapArtifactSchema.parse(readJsonFile(latestPath));
}

export function strategyMapCacheRoot(cwd: string): string {
  return path.resolve(cwd, MARKETING_STRATEGY_MAP_CACHE_ROOT);
}
