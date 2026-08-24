import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingProviderReportArtifactSchema,
  marketingReportProviderSchema,
  marketingProviderReportTypeSchema,
  type MarketingProviderReportArtifact,
  type MarketingProviderReportType,
  type MarketingReportMetrics,
  type MarketingReportProvider,
  type MarketingReportSource,
} from '../schema/report.js';
import {
  normalizeMarketingProviderReportInput,
  type MarketingProviderReportInputFormat,
} from './normalize-provider-input.js';
import { MARKETING_PROVIDER_PULL_CACHE_ROOT, providerLatestPullPath } from './paths.js';
import {
  cacheMarketingProviderReportArtifact,
  type MarketingProviderCacheWriteResult,
} from './provider-cache.js';
import { summarizeProviderArtifactMetrics } from './metrics.js';

export type MarketingProviderPullOptions = {
  cwd?: string;
  provider: string;
  inputPath: string;
  inputFormat?: MarketingProviderReportInputFormat;
  source?: MarketingReportSource;
  reportType?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
  now?: Date;
};

export type MarketingProviderPullResult = MarketingProviderCacheWriteResult;

export type MarketingProviderReportStatus = {
  provider: MarketingReportProvider;
  reportType?: MarketingProviderReportType;
  status: 'fresh' | 'stale' | 'partial' | 'missing' | 'error';
  path: string;
  exists: boolean;
  message: string;
  pulledAt?: string;
  ageDays?: number;
  recordCount?: number;
  window?: MarketingProviderReportArtifact['window'];
  metrics?: MarketingReportMetrics;
  source?: MarketingReportSource;
};

export type MarketingProviderReportStatusOptions = {
  cwd?: string;
  provider?: string;
  reportType?: string;
  maxAgeDays?: number;
  now?: Date;
};

export type MarketingProviderReportStatusReport = {
  ok: boolean;
  cwd: string;
  cacheRoot: string;
  maxAgeDays: number;
  providers: MarketingProviderReportStatus[];
  nextWorkflowStep: string;
};

const providerOrder: MarketingReportProvider[] = ['googleAds', 'metaAds', 'ga4', 'searchConsole'];

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function resolveProviders(provider?: string): MarketingReportProvider[] {
  if (!provider) return providerOrder;
  return [marketingReportProviderSchema.parse(provider)];
}

export function writeMarketingProviderReportPull(
  config: MarketingExecutionContext,
  options: MarketingProviderPullOptions,
): MarketingProviderPullResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const provider = marketingReportProviderSchema.parse(options.provider);
  const reportType = options.reportType
    ? marketingProviderReportTypeSchema.parse(options.reportType)
    : undefined;
  const now = options.now ?? new Date();
  const artifact = normalizeMarketingProviderReportInput({
    config,
    provider,
    value: readJsonFile(path.resolve(cwd, options.inputPath)),
    inputFormat: options.inputFormat,
    source: options.source,
    reportType,
    accountId: options.accountId,
    startDate: options.startDate,
    endDate: options.endDate,
    timeZone: options.timeZone,
    now,
  });
  return cacheMarketingProviderReportArtifact(cwd, artifact);
}

export function readMarketingProviderReportStatus(
  options: MarketingProviderReportStatusOptions = {},
): MarketingProviderReportStatusReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const maxAgeDays = options.maxAgeDays ?? 3;
  const nowMs = (options.now ?? new Date()).getTime();
  const reportType = options.reportType
    ? marketingProviderReportTypeSchema.parse(options.reportType)
    : undefined;
  const providers = resolveProviders(options.provider).map((provider) => {
    const latestPath = providerLatestPullPath(cwd, provider, reportType);
    if (!existsSync(latestPath)) {
      return {
        provider,
        reportType,
        status: 'missing',
        path: latestPath,
        exists: false,
        message: `${provider} has no latest provider pull artifact.`,
      } satisfies MarketingProviderReportStatus;
    }

    try {
      const artifact = marketingProviderReportArtifactSchema.parse(readJsonFile(latestPath));
      const ageDays = Math.max(0, Math.round((nowMs - Date.parse(artifact.pulledAt)) / 86_400_000));
      const stale = ageDays > maxAgeDays;
      return {
        provider,
        reportType: artifact.reportType,
        status: artifact.partial ? 'partial' : stale ? 'stale' : 'fresh',
        path: latestPath,
        exists: true,
        message: artifact.partial
          ? `${provider} latest pull is partial.`
          : stale
            ? `${provider} latest pull is ${ageDays} days old.`
            : `${provider} latest pull is fresh.`,
        pulledAt: artifact.pulledAt,
        ageDays,
        recordCount: artifact.records.length,
        window: artifact.window,
        metrics: summarizeProviderArtifactMetrics(artifact),
        source: artifact.source,
      } satisfies MarketingProviderReportStatus;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown provider report parse error';
      return {
        provider,
        reportType,
        status: 'error',
        path: latestPath,
        exists: true,
        message,
      } satisfies MarketingProviderReportStatus;
    }
  });
  const hasError = providers.some((provider) => provider.status === 'error');
  const hasMissingOrStale = providers.some((provider) =>
    ['missing', 'stale', 'partial'].includes(provider.status),
  );

  return {
    ok: !hasError,
    cwd,
    cacheRoot: path.resolve(cwd, MARKETING_PROVIDER_PULL_CACHE_ROOT),
    maxAgeDays,
    providers,
    nextWorkflowStep: hasError
      ? 'Fix invalid provider pull artifacts, then rerun `unisane-ops growth marketing report`.'
      : hasMissingOrStale
        ? 'Run `unisane-ops growth marketing pull --provider <provider> --input <artifact.json>` for missing, stale, or partial providers.'
        : 'Run unified report joins or optimization analysis from the fresh provider pulls.',
  };
}

export function readLatestMarketingProviderReportArtifacts(
  options: { cwd?: string; providers?: MarketingReportProvider[] } = {},
): MarketingProviderReportArtifact[] {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const providers = options.providers ?? providerOrder;
  const artifacts: MarketingProviderReportArtifact[] = [];
  for (const provider of providers) {
    const latestPath = providerLatestPullPath(cwd, provider);
    if (!existsSync(latestPath)) continue;
    artifacts.push(marketingProviderReportArtifactSchema.parse(readJsonFile(latestPath)));
  }
  return artifacts;
}
