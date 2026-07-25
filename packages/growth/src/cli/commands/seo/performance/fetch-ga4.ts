import { log } from '../../../log.js';
import { fetchGa4PerformanceFile } from '../../../provider-adapters.js';
import { printFetchGa4PerformanceFileResult } from '../format-output.js';
import { resolveSeoGoogleAccessToken } from '../google-suite-auth.js';
import type { SeoPerformanceFetchGa4CliOptions } from '../options.js';

const defaultDimensions = ['landingPagePlusQueryString'];
const defaultMetrics = ['sessions', 'totalUsers', 'conversions', 'totalRevenue'];
const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export async function seoPerformanceFetchGa4(
  options: SeoPerformanceFetchGa4CliOptions,
): Promise<number> {
  try {
    if (!options.platform) {
      throw new Error('Missing required --platform id.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }
    if (!options.propertyId) {
      throw new Error('Missing required --property-id.');
    }
    if (!options.startDate || !options.endDate) {
      throw new Error('Missing required --start-date and --end-date.');
    }

    const accessToken = await resolveOptionalAccessToken(options);
    const result = await fetchGa4PerformanceFile({
      cwd: options.cwd,
      platformId: options.platform,
      output: options.out,
      env: process.env,
      accessToken,
      propertyId: options.propertyId,
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: parseCsvList(options.dimensions, defaultDimensions),
      metrics: parseCsvList(options.metrics, defaultMetrics),
      limit: parsePositiveInteger(options.limit, 'limit'),
      offset: parseNonNegativeInteger(options.offset, 'offset'),
      maxRows: parsePositiveInteger(options.maxRows, 'max-rows'),
      dryRun: options.dryRun,
    });
    printFetchGa4PerformanceFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown GA4 performance fetch error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}

async function resolveOptionalAccessToken(
  options: SeoPerformanceFetchGa4CliOptions,
): Promise<string | undefined> {
  const accessTokenEnv = options.accessTokenEnv ?? 'GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN';
  if (process.env[accessTokenEnv]?.trim() || options.authProfile || options.platform) {
    return resolveSeoGoogleAccessToken({
      accessTokenEnv,
      authProfile: options.authProfile,
      platform: options.platform,
      requiredScope: GA4_READONLY_SCOPE,
    });
  }
  return undefined;
}

function parseCsvList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : fallback;
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
