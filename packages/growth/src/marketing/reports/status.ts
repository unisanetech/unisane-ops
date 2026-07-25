import path from 'node:path';
import {
  readMarketingConfirmedConversionStatus,
  type MarketingConfirmedConversionStatus,
} from './confirmed-conversions.js';
import {
  readMarketingProviderReportStatus,
  type MarketingProviderReportStatus,
} from './provider-pulls.js';
import { readMarketingStrategyMapStatus, type MarketingStrategyMapStatus } from './strategy-map.js';
import type { MarketingProviderReportType, MarketingReportProvider } from '../schema/report.js';

export type MarketingStatusMode = 'marketing' | 'analytics';

export type MarketingStatusReport = {
  ok: boolean;
  mode: MarketingStatusMode;
  cwd: string;
  maxAgeDays: number;
  providerFreshness: MarketingProviderReportStatus[];
  confirmedConversions: MarketingConfirmedConversionStatus;
  strategyMap: MarketingStrategyMapStatus;
  nextWorkflowStep: string;
};

export type MarketingStatusOptions = {
  cwd?: string;
  maxAgeDays?: number;
  now?: Date;
  mode?: MarketingStatusMode;
};

const analyticsProviders: MarketingReportProvider[] = ['ga4', 'searchConsole'];
const statusReportFamilies: Array<{
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
}> = [
  { provider: 'googleAds', reportType: 'campaign' },
  { provider: 'googleAds', reportType: 'keyword' },
  { provider: 'googleAds', reportType: 'conversion' },
  { provider: 'metaAds', reportType: 'campaign' },
  { provider: 'metaAds', reportType: 'adSet' },
  { provider: 'metaAds', reportType: 'ad' },
  { provider: 'metaAds', reportType: 'creative' },
  { provider: 'ga4', reportType: 'landingPage' },
  { provider: 'ga4', reportType: 'channel' },
  { provider: 'ga4', reportType: 'sourceMedium' },
  { provider: 'searchConsole', reportType: 'queryPage' },
  { provider: 'searchConsole', reportType: 'page' },
  { provider: 'searchConsole', reportType: 'query' },
];

export function buildMarketingStatusReport(
  options: MarketingStatusOptions = {},
): MarketingStatusReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const maxAgeDays = options.maxAgeDays ?? 3;
  const mode = options.mode ?? 'marketing';
  const providerFreshness = statusReportFamilies
    .filter((family) =>
      mode === 'analytics' ? analyticsProviders.includes(family.provider) : true,
    )
    .map(
      (family) =>
        readMarketingProviderReportStatus({
          cwd,
          provider: family.provider,
          reportType: family.reportType,
          maxAgeDays,
          now: options.now,
        }).providers[0],
    )
    .filter((provider): provider is MarketingProviderReportStatus => provider !== undefined);
  const confirmedConversions = readMarketingConfirmedConversionStatus({
    cwd,
    maxAgeDays,
    now: options.now,
  });
  const strategyMap = readMarketingStrategyMapStatus({
    cwd,
    maxAgeDays,
    now: options.now,
  });
  const reportWithoutNext = {
    ok: false,
    mode,
    cwd,
    maxAgeDays,
    providerFreshness,
    confirmedConversions,
    strategyMap,
  } satisfies Omit<MarketingStatusReport, 'nextWorkflowStep'>;
  const nextWorkflowStep = selectNextWorkflowStep(reportWithoutNext);
  return {
    ...reportWithoutNext,
    ok: isHealthy(reportWithoutNext),
    nextWorkflowStep,
  };
}

function isHealthy(report: Omit<MarketingStatusReport, 'nextWorkflowStep'>): boolean {
  return (
    report.providerFreshness.every((provider) => provider.status === 'fresh') &&
    report.confirmedConversions.status === 'fresh' &&
    (report.mode === 'analytics' || report.strategyMap.status === 'fresh')
  );
}

function selectNextWorkflowStep(report: Omit<MarketingStatusReport, 'nextWorkflowStep'>): string {
  const invalidProvider = report.providerFreshness.find((provider) => provider.status === 'error');
  if (invalidProvider) {
    return `Fix invalid ${invalidProvider.provider} provider artifact, then rerun status.`;
  }
  const staleProvider = report.providerFreshness.find((provider) =>
    ['missing', 'stale', 'partial'].includes(provider.status),
  );
  if (staleProvider) {
    const command = report.mode === 'analytics' ? 'analytics status' : 'marketing status';
    const reportFamily = staleProvider.reportType
      ? `${staleProvider.provider}/${staleProvider.reportType}`
      : staleProvider.provider;
    return `Refresh ${reportFamily} pulls, then rerun \`unisane growth ${command}\`.`;
  }
  if (report.confirmedConversions.status === 'error') {
    return 'Fix invalid Unisane-confirmed conversion artifact, then rerun status.';
  }
  if (['missing', 'stale', 'partial'].includes(report.confirmedConversions.status)) {
    return 'Refresh Unisane-confirmed conversion truth with `unisane growth marketing conversion-pull`.';
  }
  if (report.mode === 'marketing') {
    if (report.strategyMap.status === 'error') {
      return 'Fix invalid marketing strategy-map artifact, then rerun status.';
    }
    if (['missing', 'stale'].includes(report.strategyMap.status)) {
      return 'Refresh the strategy map with `unisane growth marketing strategy-pull`.';
    }
    return 'Run `unisane growth marketing report --unified` or regenerate recommendations.';
  }
  return 'Run `unisane growth marketing report --unified` to reconcile analytics, ads, and confirmed conversion truth.';
}
