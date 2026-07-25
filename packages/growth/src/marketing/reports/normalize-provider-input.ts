import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  marketingProviderReportArtifactInputSchema,
  marketingProviderReportArtifactSchema,
  marketingReportProviderSchema,
  type MarketingProviderReportArtifact,
  type MarketingProviderReportType,
  type MarketingReportProvider,
  type MarketingReportSource,
} from '../schema/report.js';
import { normalizeGa4Report } from '../providers/ga4/reports.js';
import { normalizeGoogleAdsReport } from '../providers/google-ads/reports.js';
import { normalizeMetaAdsReport } from '../providers/meta-ads/reports.js';
import { normalizeSearchConsoleReport } from '../providers/search-console/reports.js';

export type MarketingProviderReportInputFormat =
  | 'normalized'
  | 'google-ads'
  | 'meta-ads'
  | 'ga4'
  | 'search-console';

export type NormalizeMarketingProviderReportInputOptions = {
  config: MarketingConfig;
  provider: string;
  value: unknown;
  inputFormat?: MarketingProviderReportInputFormat;
  source?: MarketingReportSource;
  reportType?: MarketingProviderReportType;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
  now: Date;
};

function resolveInputFormat(
  provider: MarketingReportProvider,
  inputFormat?: MarketingProviderReportInputFormat,
): MarketingProviderReportInputFormat {
  if (inputFormat) return inputFormat;
  return 'normalized';
}

function assertProvider(
  expected: MarketingReportProvider,
  artifact: MarketingProviderReportArtifact,
): MarketingProviderReportArtifact {
  if (artifact.provider !== expected) {
    throw new Error(
      `[MARKETING_PROVIDER_REPORT_PROVIDER_MISMATCH] Expected ${expected} report, received ${artifact.provider}.`,
    );
  }
  return artifact;
}

export function normalizeMarketingProviderReportInput(
  options: NormalizeMarketingProviderReportInputOptions,
): MarketingProviderReportArtifact {
  const provider = marketingReportProviderSchema.parse(options.provider);
  const pulledAt = options.now.toISOString();
  const source = options.source ?? 'manual-export';
  const window = {
    startDate: options.startDate,
    endDate: options.endDate,
    timeZone: options.timeZone,
  };
  const providerOptions = {
    platformId: options.config.platformId,
    appId: options.config.appId,
    accountId: options.accountId,
    pulledAt,
    source,
    reportType: options.reportType,
    window,
  };

  const format = resolveInputFormat(provider, options.inputFormat);
  if (format === 'normalized') {
    const parsed = marketingProviderReportArtifactInputSchema.parse(options.value);
    return assertProvider(
      provider,
      marketingProviderReportArtifactSchema.parse({
        ...parsed,
        platformId: parsed.platformId ?? options.config.platformId,
        appId: parsed.appId ?? options.config.appId,
        source: options.source ?? parsed.source,
        reportType: options.reportType ?? parsed.reportType,
        accountId: options.accountId ?? parsed.accountId,
        pulledAt: parsed.pulledAt ?? pulledAt,
      }),
    );
  }

  const normalized =
    format === 'google-ads'
      ? normalizeGoogleAdsReport(options.value, providerOptions)
      : format === 'meta-ads'
        ? normalizeMetaAdsReport(options.value, providerOptions)
        : format === 'ga4'
          ? normalizeGa4Report(options.value, providerOptions)
          : normalizeSearchConsoleReport(options.value, providerOptions);

  return assertProvider(provider, marketingProviderReportArtifactSchema.parse(normalized));
}
