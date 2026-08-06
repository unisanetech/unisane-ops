import { log } from '../../../log.js';
import { fetchGa4PerformanceFile } from '../../../provider-adapters.js';
import { printFetchGa4PerformanceFileResult } from '../format-output.js';
import { resolveSeoGoogleConnectionToken } from '../google-connection.js';
import type { SeoPerformanceFetchGa4CliOptions } from '../options.js';
import { loadGrowthProjectContext, resolveGrowthResource } from '../../../project-context.js';
import { resolveSeoPerformanceContext } from '@unisane/growth/seo';

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
    if (!options.startDate || !options.endDate) {
      throw new Error('Missing required --start-date and --end-date.');
    }

    const accessToken = await resolveSeoGoogleConnectionToken({
      service: 'analytics',
      connection: options.connection,
      environment: options.environment,
      requiredScope: GA4_READONLY_SCOPE,
    });
    const property = resolveGrowthResource({
      context: await loadGrowthProjectContext(),
      environment: options.environment,
      provider: 'google',
      service: 'analytics',
      resourceType: 'property',
    });
    const performanceContext = await resolveSeoPerformanceContext({
      cwd: options.cwd,
      platformId: options.platform,
      source: 'ga4',
      property: property.resourceId,
    });
    const result = await fetchGa4PerformanceFile({
      cwd: performanceContext.cwd,
      platformId: performanceContext.platformId,
      output: options.out ?? performanceContext.defaultOutput,
      env: process.env,
      accessToken,
      propertyId: property.resourceId,
      configuredSiteUrl: performanceContext.siteUrl,
      targetMarkets: performanceContext.targetMarkets,
      freshnessHours: performanceContext.freshnessHours,
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
