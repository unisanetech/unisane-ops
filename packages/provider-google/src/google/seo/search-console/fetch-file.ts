import path from 'node:path';
import { writeJson } from '../../../utils/fs.js';
import type { SeoPerformanceTargetMarket } from '@unisane/growth/contracts';
import type { FetchLike } from '../google-ads/transport.js';
import { querySearchConsolePerformance, type SearchConsoleDimension } from './query.js';

export type FetchSearchConsolePerformanceFileOptions = {
  cwd?: string;
  platformId: string;
  output: string;
  accessToken: string;
  siteUrl: string;
  configuredSiteUrl: string;
  targetMarkets: SeoPerformanceTargetMarket[];
  startDate: string;
  endDate: string;
  dimensions: SearchConsoleDimension[];
  rowLimit?: number;
  startRow?: number;
  maxRows?: number;
  searchType?: string;
  dataState?: string;
  fetchImpl?: FetchLike;
  freshnessHours?: number;
  observedAt?: string;
  dryRun?: boolean;
};

export type FetchSearchConsolePerformanceFileResult = {
  output: string;
  platformId: string;
  siteUrl: string;
  configuredSiteUrl: string;
  sampleData: false;
  freshUntil: string;
  startDate: string;
  endDate: string;
  dimensions: SearchConsoleDimension[];
  startRow?: number;
  maxRows?: number;
  recordCount: number;
  pageCount: number;
  queryCount: number;
  dryRun: boolean;
};

export async function fetchSearchConsolePerformanceFile(
  options: FetchSearchConsolePerformanceFileOptions,
): Promise<FetchSearchConsolePerformanceFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const outputPath = resolvePath(cwd, options.output);
  const performanceFile = await querySearchConsolePerformance({
    platformId: options.platformId,
    accessToken: options.accessToken,
    siteUrl: options.siteUrl,
    configuredSiteUrl: options.configuredSiteUrl,
    targetMarkets: options.targetMarkets,
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions,
    rowLimit: options.rowLimit,
    startRow: options.startRow,
    maxRows: options.maxRows,
    searchType: options.searchType,
    dataState: options.dataState,
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
    siteUrl: options.siteUrl,
    configuredSiteUrl: performanceFile.siteUrl,
    sampleData: false,
    freshUntil: performanceFile.evidence.freshUntil,
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions,
    startRow: options.startRow,
    maxRows: options.maxRows,
    recordCount: performanceFile.records.length,
    pageCount: new Set(performanceFile.records.map((record) => record.pagePath)).size,
    queryCount: new Set(performanceFile.records.flatMap((record) => record.query ?? [])).size,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
