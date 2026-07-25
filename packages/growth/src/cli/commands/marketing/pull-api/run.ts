import {
  loadMarketingConfig,
  writeMarketingProviderApiReportPull,
  type MarketingConfig,
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
import { resolveMarketingGoogleAccessToken } from '../auth/google.js';
import { resolveMarketingMetaAccessToken } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProviderPullResult } from '../output/doctor.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

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

async function fillGoogleAccessTokenEnv(args: {
  env: Record<string, string | undefined>;
  accessTokenEnv?: string;
  authProfile?: string;
  requiredScope: string;
}): Promise<void> {
  if (!args.accessTokenEnv) return;
  if (args.env[args.accessTokenEnv]?.trim()) return;
  args.env[args.accessTokenEnv] = await resolveMarketingGoogleAccessToken({
    accessTokenEnv: args.accessTokenEnv,
    authProfile: args.authProfile,
    requiredScope: args.requiredScope,
  });
}

async function resolveMarketingPullApiEnv(
  config: MarketingConfig,
  options: MarketingCliOptions,
): Promise<Record<string, string | undefined>> {
  const env = { ...process.env };
  if (options.provider === 'googleAds') {
    await fillGoogleAccessTokenEnv({
      env,
      accessTokenEnv: config.providers.googleAds.accessTokenEnv,
      authProfile: resolveMarketingGoogleProfile(config, options),
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
  }
  if (options.provider === 'ga4') {
    await fillGoogleAccessTokenEnv({
      env,
      accessTokenEnv: config.providers.ga4.accessTokenEnv,
      authProfile: resolveMarketingGoogleProfile(config, options),
      requiredScope: MARKETING_GOOGLE_ANALYTICS_SCOPE,
    });
  }
  if (options.provider === 'searchConsole') {
    await fillGoogleAccessTokenEnv({
      env,
      accessTokenEnv: config.providers.searchConsole.accessTokenEnv,
      authProfile: resolveMarketingGoogleProfile(config, options),
      requiredScope: MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
    });
  }
  if (
    options.provider === 'metaAds' &&
    config.providers.metaAds.accessTokenEnv &&
    !env[config.providers.metaAds.accessTokenEnv]?.trim()
  ) {
    env[config.providers.metaAds.accessTokenEnv] = await resolveMarketingMetaAccessToken({
      accessTokenEnv: config.providers.metaAds.accessTokenEnv,
      authProfile: resolveMarketingMetaProfile(config, options),
    });
  }
  return env;
}

export async function marketingPullApi(options: MarketingCliOptions): Promise<number> {
  try {
    if (!options.provider) {
      throw new Error('[MARKETING_PULL_PROVIDER_REQUIRED] Pass --provider <provider>.');
    }
    if (!options.startDate || !options.endDate) {
      throw new Error('[MARKETING_PULL_DATE_RANGE_REQUIRED] Pass --start-date and --end-date.');
    }
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const env = await resolveMarketingPullApiEnv(loaded.config, options);
    const result = await writeMarketingProviderApiReportPull(loaded.config, {
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
      accountId: options.accountId,
      startDate: options.startDate,
      endDate: options.endDate,
      timeZone: options.timeZone,
      apiVersion: options.apiVersion,
      reportType: options.report,
      maxPages: parsePositiveInteger(options.maxPages, '--max-pages'),
      pageSize: parsePositiveInteger(options.pageSize, '--page-size'),
    });
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
