import {
  writeMarketingProviderApiReportPull,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
} from '@unisane/growth/marketing';
import {
  pullGa4Report,
  pullGoogleAdsReport,
  pullSearchConsoleReport,
  pullMetaAdsReport,
} from '../../../provider-adapters.js';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProviderPullResult } from '../output/doctor.js';
import { resolveGrowthGoogleConnectionCredentials } from '../../../connections/google.js';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  resolveGrowthResource,
} from '../../../project-context.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parsePositiveInteger(value: string | undefined, optionName: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `[MARKETING_PULL_API_OPTION_INVALID] ${optionName} must be a positive integer.`,
    );
  }
  return parsed;
}

async function googlePullContext(options: MarketingCliOptions): Promise<{
  accountId: string;
  accessToken: string;
  developerToken?: string;
}> {
  const service =
    options.provider === 'googleAds'
      ? 'ads'
      : options.provider === 'ga4'
        ? 'analytics'
        : 'search-console';
  const resourceType =
    service === 'ads' ? 'customer' : service === 'analytics' ? 'property' : 'site';
  const context = await loadGrowthProjectContext();
  const resource = resolveGrowthResource({
    context,
    environment: options.environment,
    provider: 'google',
    service,
    resourceType,
  });
  if (options.accountId && options.accountId !== resource.resourceId) {
    throw new Error(
      `[GROWTH_RESOURCE_OVERRIDE_REJECTED] '${options.accountId}' is not the selected ${service} resource.`,
    );
  }
  const requiredScope =
    service === 'ads'
      ? MARKETING_GOOGLE_ADS_SCOPE
      : service === 'analytics'
        ? MARKETING_GOOGLE_ANALYTICS_SCOPE
        : MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE;
  const credentials = await resolveGrowthGoogleConnectionCredentials({
    service,
    connection: options.connection,
    environment: options.environment,
    requiredScope,
  });
  return {
    accountId: resource.resourceId,
    ...credentials,
  };
}

export async function pullMarketingProviderApiReport(options: MarketingCliOptions) {
  if (!options.provider) {
    throw new Error('[MARKETING_PULL_PROVIDER_REQUIRED] Pass --provider <provider>.');
  }
  if (!options.startDate || !options.endDate) {
    throw new Error('[MARKETING_PULL_DATE_RANGE_REQUIRED] Pass --start-date and --end-date.');
  }
  const loaded = await loadMarketingExecutionContext();
  const env = { ...process.env };
  const google =
    options.provider === 'googleAds' ||
    options.provider === 'ga4' ||
    options.provider === 'searchConsole'
      ? await googlePullContext(options)
      : undefined;
  const meta =
    options.provider === 'metaAds'
      ? resolveGrowthResource({
          context: await loadGrowthProjectContext(),
          environment: options.environment,
          provider: 'meta',
          service: 'ads-insights',
          resourceType: 'ad-account',
        })
      : undefined;
  if (meta && options.accountId && options.accountId !== meta.resourceId) {
    throw new Error(
      `[GROWTH_RESOURCE_OVERRIDE_REJECTED] '${options.accountId}' is not the selected Meta Ads account.`,
    );
  }
  return writeMarketingProviderApiReportPull(loaded.config, {
    cwd: options.cwd,
    provider: options.provider,
    driver:
      options.provider === 'googleAds'
        ? pullGoogleAdsReport
        : options.provider === 'ga4'
          ? pullGa4Report
          : options.provider === 'searchConsole'
            ? pullSearchConsoleReport
            : options.provider === 'metaAds'
              ? pullMetaAdsReport
              : undefined,
    env,
    accountId: google?.accountId ?? meta?.resourceId ?? options.accountId,
    connection: options.connection,
    environment: options.environment,
    credentials: google
      ? {
          accessToken: google.accessToken,
          ...(google.developerToken ? { developerToken: google.developerToken } : {}),
        }
      : undefined,
    startDate: options.startDate,
    endDate: options.endDate,
    timeZone: options.timeZone,
    apiVersion: options.apiVersion,
    reportType: options.report,
    maxPages: parsePositiveInteger(options.maxPages, '--max-pages'),
    pageSize: parsePositiveInteger(options.pageSize, '--page-size'),
  });
}

export async function marketingPullApi(options: MarketingCliOptions): Promise<number> {
  try {
    const result = await pullMarketingProviderApiReport(options);
    if (options.json) printJson(result);
    else printMarketingProviderPullResult(result);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing pull-api error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
