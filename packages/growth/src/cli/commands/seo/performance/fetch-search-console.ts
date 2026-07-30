import { log } from '../../../log.js';
import {
  fetchSearchConsolePerformanceFile,
  type SearchConsoleDimension,
} from '../../../provider-adapters.js';
import { printFetchSearchConsolePerformanceFileResult } from '../format-output.js';
import { resolveSeoGoogleConnectionToken } from '../google-connection.js';
import type { SeoPerformanceFetchSearchConsoleCliOptions } from '../options.js';
import { loadGrowthProjectContext, resolveGrowthResource } from '../../../project-context.js';

const allowedDimensions = new Set<SearchConsoleDimension>([
  'query',
  'page',
  'country',
  'device',
  'date',
  'searchAppearance',
]);
const SEARCH_CONSOLE_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export async function seoPerformanceFetchSearchConsole(
  options: SeoPerformanceFetchSearchConsoleCliOptions,
): Promise<number> {
  try {
    if (!options.platform) {
      throw new Error('Missing required --platform id.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }
    if (!options.startDate || !options.endDate) {
      throw new Error('Missing required --start-date and --end-date.');
    }

    const accessToken = await resolveSeoGoogleConnectionToken({
      service: 'search-console',
      connection: options.connection,
      environment: options.environment,
      requiredScope: SEARCH_CONSOLE_READONLY_SCOPE,
    });
    const site = resolveGrowthResource({
      context: await loadGrowthProjectContext(),
      environment: options.environment,
      provider: 'google',
      service: 'search-console',
      resourceType: 'site',
    });
    const result = await fetchSearchConsolePerformanceFile({
      cwd: options.cwd,
      platformId: options.platform,
      output: options.out,
      env: process.env,
      accessToken,
      siteUrl: site.resourceId,
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: parseDimensions(options.dimensions ?? 'query,page'),
      rowLimit: parsePositiveInteger(options.rowLimit, 'row-limit'),
      startRow: parseNonNegativeInteger(options.startRow, 'start-row'),
      maxRows: parsePositiveInteger(options.maxRows, 'max-rows'),
      searchType: options.searchType ?? 'web',
      dataState: options.dataState,
      dryRun: options.dryRun,
    });
    printFetchSearchConsolePerformanceFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown Search Console performance fetch error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}

function parseDimensions(value: string): SearchConsoleDimension[] {
  const dimensions = value
    .split(',')
    .map((dimension) => dimension.trim())
    .filter((dimension) => dimension.length > 0);
  if (dimensions.length === 0) {
    throw new Error('At least one --dimensions value is required.');
  }
  const invalid = dimensions.filter(
    (dimension): dimension is string => !allowedDimensions.has(dimension as SearchConsoleDimension),
  );
  if (invalid.length > 0) {
    throw new Error(`Invalid Search Console dimensions: ${invalid.join(', ')}.`);
  }
  return dimensions as SearchConsoleDimension[];
}

function parsePositiveInteger(value: string | undefined, label: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid --${label}; expected a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeInteger(value: string | undefined, label: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid --${label}; expected a non-negative integer.`);
  }
  return parsed;
}
