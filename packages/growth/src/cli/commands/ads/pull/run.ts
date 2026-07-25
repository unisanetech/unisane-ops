import {
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  writeMarketingProviderApiReportPull,
  writeMarketingProviderReportPull,
  type MarketingConfig,
  type MarketingAdsPlanProvider,
} from '@unisane/growth/marketing';
import { pullGoogleAdsReport, pullMetaAdsReport } from '../../../provider-adapters.js';
import type { AdsCliOptions } from '../options.js';
import { printMarketingProviderPullResult } from '../../marketing/output/doctor.js';
import { resolveMarketingGoogleAccessToken } from '../../marketing/auth/google.js';
import { resolveMarketingMetaAccessToken } from '../../marketing/auth/meta.js';
import {
  resolveMarketingGoogleProfile,
  resolveMarketingMetaProfile,
} from '../../marketing/profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseAdsProvider(provider: AdsCliOptions['provider']): MarketingAdsPlanProvider {
  if (provider === 'googleAds' || provider === 'metaAds') return provider;
  throw new Error('[ADS_PULL_PROVIDER_INVALID] ads pull requires --provider googleAds or metaAds.');
}

function parsePositiveInteger(value: string | undefined, optionName: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[ADS_PULL_OPTION_INVALID] ${optionName} must be a positive integer.`);
  }
  return parsed;
}

async function resolveAdsPullApiEnv(
  config: MarketingConfig,
  provider: MarketingAdsPlanProvider,
  options: AdsCliOptions,
): Promise<Record<string, string | undefined>> {
  const env = { ...process.env };
  if (
    provider === 'googleAds' &&
    config.providers.googleAds.accessTokenEnv &&
    !env[config.providers.googleAds.accessTokenEnv]?.trim()
  ) {
    env[config.providers.googleAds.accessTokenEnv] = await resolveMarketingGoogleAccessToken({
      accessTokenEnv: config.providers.googleAds.accessTokenEnv,
      authProfile: resolveMarketingGoogleProfile(config, options),
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
  }
  if (
    provider === 'metaAds' &&
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

export async function adsPull(options: AdsCliOptions): Promise<number> {
  try {
    const provider = parseAdsProvider(options.provider);
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });

    if (options.api) {
      if (!options.startDate || !options.endDate) {
        throw new Error('[ADS_PULL_DATE_RANGE_REQUIRED] Pass --start-date and --end-date.');
      }
      const env = await resolveAdsPullApiEnv(loaded.config, provider, options);
      const result = await writeMarketingProviderApiReportPull(loaded.config, {
        cwd: options.cwd,
        provider,
        driver: provider === 'googleAds' ? pullGoogleAdsReport : pullMetaAdsReport,
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
    }

    if (!options.input) {
      throw new Error('[ADS_PULL_INPUT_REQUIRED] Pass --input <artifact.json> or --api.');
    }
    const result = writeMarketingProviderReportPull(loaded.config, {
      cwd: options.cwd,
      provider,
      inputPath: options.input,
      inputFormat: options.inputFormat,
      source: options.source,
      reportType: options.report,
      accountId: options.accountId,
      startDate: options.startDate,
      endDate: options.endDate,
      timeZone: options.timeZone,
    });
    if (options.json) printJson(result);
    else printMarketingProviderPullResult(result);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads pull error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
