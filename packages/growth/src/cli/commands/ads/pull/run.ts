import {
  MARKETING_GOOGLE_ADS_SCOPE,
  writeMarketingProviderApiReportPull,
  writeMarketingProviderReportPull,
  type MarketingAdsPlanProvider,
} from '@unisane/growth/marketing';
import { pullGoogleAdsReport, pullMetaAdsReport } from '../../../provider-adapters.js';
import type { AdsCliOptions } from '../options.js';
import { printMarketingProviderPullResult } from '../../marketing/output/doctor.js';
import { resolveGrowthGoogleConnectionCredentials } from '../../../connections/google.js';
import { resolveGrowthMetaConnectionToken } from '../../../connections/meta.js';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  resolveGrowthResource,
} from '../../../project-context.js';

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

export async function adsPull(options: AdsCliOptions): Promise<number> {
  try {
    const provider = parseAdsProvider(options.provider);
    const loaded = await loadMarketingExecutionContext();

    if (options.api) {
      if (!options.startDate || !options.endDate) {
        throw new Error('[ADS_PULL_DATE_RANGE_REQUIRED] Pass --start-date and --end-date.');
      }
      const env = { ...process.env };
      const google =
        provider === 'googleAds'
          ? {
              resource: resolveGrowthResource({
                context: await loadGrowthProjectContext(),
                environment: options.environment,
                provider: 'google',
                service: 'ads',
                resourceType: 'customer',
              }),
              credentials: await resolveGrowthGoogleConnectionCredentials({
                service: 'ads',
                connection: options.connection,
                environment: options.environment,
                requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
              }),
            }
          : undefined;
      const meta =
        provider === 'metaAds'
          ? {
              resource: resolveGrowthResource({
                context: await loadGrowthProjectContext(),
                environment: options.environment,
                provider: 'meta',
                service: 'ads',
                resourceType: 'ad-account',
              }),
              accessToken: await resolveGrowthMetaConnectionToken({
                connection: options.connection,
                environment: options.environment,
              }),
            }
          : undefined;
      if (google && options.accountId && options.accountId !== google.resource.resourceId) {
        throw new Error(
          `[GROWTH_RESOURCE_OVERRIDE_REJECTED] '${options.accountId}' is not the selected Google Ads customer.`,
        );
      }
      const result = await writeMarketingProviderApiReportPull(loaded.config, {
        cwd: options.cwd,
        provider,
        driver: provider === 'googleAds' ? pullGoogleAdsReport : pullMetaAdsReport,
        env,
        accountId: google?.resource.resourceId ?? meta?.resource.resourceId ?? options.accountId,
        credentials: google
          ? google.credentials
          : meta
            ? {
                accountId: meta.resource.resourceId,
                accessToken: meta.accessToken,
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
