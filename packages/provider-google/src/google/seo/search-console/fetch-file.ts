import path from 'node:path';
import { writeJson } from '../../../utils/fs.js';
import type { FetchLike } from '../google-ads/oauth.js';
import type { GoogleSearchConsoleCredentials } from './config.js';
import { querySearchConsolePerformance, type SearchConsoleDimension } from './query.js';

export type FetchSearchConsolePerformanceFileOptions = {
  cwd?: string;
  platformId: string;
  output: string;
  credentials?: GoogleSearchConsoleCredentials;
  accessToken?: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: SearchConsoleDimension[];
  rowLimit?: number;
  startRow?: number;
  maxRows?: number;
  searchType?: string;
  dataState?: string;
  fetchImpl?: FetchLike;
  dryRun?: boolean;
};

export type FetchSearchConsolePerformanceFileResult = {
  output: string;
  platformId: string;
  siteUrl: string;
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
    credentials: options.credentials,
    accessToken: options.accessToken,
    siteUrl: options.siteUrl,
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions,
    rowLimit: options.rowLimit,
    startRow: options.startRow,
    maxRows: options.maxRows,
    searchType: options.searchType,
    dataState: options.dataState,
    fetchImpl: options.fetchImpl,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, performanceFile);
  }

  return {
    output: path.relative(cwd, outputPath),
    platformId: performanceFile.platformId,
    siteUrl: options.siteUrl,
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
