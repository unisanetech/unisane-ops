import path from 'node:path';
import { writeJson } from '../../../utils/fs.js';
import type { SeoPerformanceTargetMarket } from '@unisane/growth/contracts';
import type { FetchLike } from '../google-ads/transport.js';
import { runGa4PerformanceReport } from './run-report.js';

export type FetchGa4PerformanceFileOptions = {
  cwd?: string;
  platformId: string;
  output: string;
  accessToken: string;
  propertyId: string;
  configuredSiteUrl: string;
  targetMarkets: SeoPerformanceTargetMarket[];
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  offset?: number;
  maxRows?: number;
  fetchImpl?: FetchLike;
  freshnessHours?: number;
  observedAt?: string;
  dryRun?: boolean;
};

export type FetchGa4PerformanceFileResult = {
  output: string;
  platformId: string;
  propertyId: string;
  configuredSiteUrl: string;
  sampleData: false;
  freshUntil: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  recordCount: number;
  pageCount: number;
  dryRun: boolean;
};

export async function fetchGa4PerformanceFile(
  options: FetchGa4PerformanceFileOptions,
): Promise<FetchGa4PerformanceFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const outputPath = resolvePath(cwd, options.output);
  const performanceFile = await runGa4PerformanceReport({
    platformId: options.platformId,
    accessToken: options.accessToken,
    propertyId: options.propertyId,
    configuredSiteUrl: options.configuredSiteUrl,
    targetMarkets: options.targetMarkets,
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions,
    metrics: options.metrics,
    limit: options.limit,
    offset: options.offset,
    maxRows: options.maxRows,
    fetchImpl: options.fetchImpl,
    freshnessHours: options.freshnessHours,
    observedAt: options.observedAt,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, performanceFile);
  }

  return {
    output: path.relative(cwd, outputPath),
    platformId: performanceFile.platformId,
    propertyId: options.propertyId,
    configuredSiteUrl: performanceFile.siteUrl,
    sampleData: false,
    freshUntil: performanceFile.evidence.freshUntil,
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions,
    metrics: options.metrics,
    recordCount: performanceFile.records.length,
    pageCount: new Set(performanceFile.records.map((record) => record.pagePath)).size,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
