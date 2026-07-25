import path from 'node:path';
import type { MarketingProviderReportType, MarketingReportProvider } from '../schema/report.js';

export const MARKETING_PROVIDER_PULL_CACHE_ROOT = path.join(
  '.unisane',
  'marketing',
  'cache',
  'provider-pulls',
);

export const MARKETING_CONFIRMED_CONVERSION_CACHE_ROOT = path.join(
  '.unisane',
  'marketing',
  'cache',
  'confirmed-conversions',
);

export const MARKETING_STRATEGY_MAP_CACHE_ROOT = path.join(
  '.unisane',
  'marketing',
  'cache',
  'strategy-map',
);

export function ensurePathWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[MARKETING_PATH_OUTSIDE_CWD] Marketing output path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

export function providerPullCacheDir(
  cwd: string,
  provider: MarketingReportProvider,
  reportType?: MarketingProviderReportType,
): string {
  const resolved = path.resolve(
    cwd,
    MARKETING_PROVIDER_PULL_CACHE_ROOT,
    provider,
    reportType ?? '',
  );
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export function providerLatestPullPath(
  cwd: string,
  provider: MarketingReportProvider,
  reportType?: MarketingProviderReportType,
): string {
  return path.join(providerPullCacheDir(cwd, provider, reportType), 'latest.json');
}

export function confirmedConversionCacheDir(cwd: string): string {
  const resolved = path.resolve(cwd, MARKETING_CONFIRMED_CONVERSION_CACHE_ROOT);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export function confirmedConversionLatestPath(cwd: string): string {
  return path.join(confirmedConversionCacheDir(cwd), 'latest.json');
}

export function strategyMapCacheDir(cwd: string): string {
  const resolved = path.resolve(cwd, MARKETING_STRATEGY_MAP_CACHE_ROOT);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export function strategyMapLatestPath(cwd: string): string {
  return path.join(strategyMapCacheDir(cwd), 'latest.json');
}
