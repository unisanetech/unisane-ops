import path from 'node:path';
import { loadMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { MarketingReportMetrics, MarketingReportProvider } from '../schema/report.js';
import {
  auditMarketingTrackingSource,
  type MarketingTrackingAuditCheck,
} from '../tracking/audit-source.js';
import {
  readMarketingProviderReportStatus,
  type MarketingProviderReportStatus,
} from './provider-pulls.js';
import {
  readMarketingConfirmedConversionStatus,
  type MarketingConfirmedConversionStatus,
} from './confirmed-conversions.js';
import {
  buildMarketingStrategyObjectReport,
  type MarketingStrategyObjectReport,
} from './strategy-object-report.js';
import {
  deriveMarketingMetrics,
  mergeMarketingMetrics,
  type MarketingDerivedMetrics,
} from './metrics.js';

export type MarketingUnifiedReportOptions = {
  cwd?: string;
  maxAgeDays?: number;
  now?: Date;
  sourceRoots?: string[];
};

export type MarketingUnifiedMetricsSection = {
  providers: MarketingReportProvider[];
  metrics: MarketingReportMetrics;
  derived: MarketingDerivedMetrics;
  statuses: MarketingProviderReportStatus[];
};

export type MarketingUnifiedConversionTruth = {
  providerReported: {
    conversions?: number;
    conversionValue?: number;
    sources: MarketingReportProvider[];
  };
  unisaneConfirmed: {
    status: 'available' | 'missing';
    configuredServerConversionCount: number;
    auditedServerConversionCount: number;
    statusDetail: MarketingConfirmedConversionStatus;
    conversions?: number;
    conversionValue?: number;
    revenue?: number;
    margin?: number;
    message: string;
  };
  reconciliation: {
    status: 'ready' | 'missing_unisane_truth' | 'provider_missing' | 'mismatch';
    conversionDelta?: number;
    conversionValueDelta?: number;
    message: string;
  };
};

export type MarketingUnifiedReport = {
  ok: boolean;
  cwd: string;
  generatedAt: string;
  platformId: string;
  appId: string;
  freshnessMaxAgeDays: number;
  sections: {
    ads: MarketingUnifiedMetricsSection;
    analytics: MarketingUnifiedMetricsSection;
    seo: MarketingUnifiedMetricsSection;
    conversionTruth: MarketingUnifiedConversionTruth;
    strategyObjects: MarketingStrategyObjectReport;
    trackingGaps: MarketingTrackingAuditCheck[];
  };
  providerFreshness: MarketingProviderReportStatus[];
  confirmedConversionFreshness: MarketingConfirmedConversionStatus;
  strategyMapFreshness: MarketingStrategyObjectReport['freshness'];
  nextWorkflowStep: string;
};

function summarizeStatuses(statuses: MarketingProviderReportStatus[]): MarketingReportMetrics {
  return mergeMarketingMetrics(statuses.map((status) => status.metrics));
}

function sectionFor(
  statuses: MarketingProviderReportStatus[],
  providers: MarketingReportProvider[],
): MarketingUnifiedMetricsSection {
  const sectionStatuses = statuses.filter((status) => providers.includes(status.provider));
  const metrics = summarizeStatuses(sectionStatuses);
  return {
    providers,
    statuses: sectionStatuses,
    metrics,
    derived: deriveMarketingMetrics(metrics),
  };
}

function providerReportedConversionSources(
  statuses: MarketingProviderReportStatus[],
): MarketingReportProvider[] {
  return statuses
    .filter(
      (status) =>
        (status.metrics?.conversions ?? 0) > 0 || (status.metrics?.conversionValue ?? 0) > 0,
    )
    .map((status) => status.provider);
}

function resolveNextWorkflowStep(input: {
  trackingGaps: MarketingTrackingAuditCheck[];
  providerFreshness: MarketingProviderReportStatus[];
  conversionTruth: MarketingUnifiedConversionTruth;
  strategyObjects: MarketingStrategyObjectReport;
}): string {
  if (input.trackingGaps.some((gap) => gap.status === 'error')) {
    return 'Fix marketing tracking errors before optimization or ads planning.';
  }
  if (
    input.providerFreshness.some((status) =>
      ['missing', 'stale', 'partial', 'error'].includes(status.status),
    )
  ) {
    return 'Refresh missing, stale, partial, or invalid provider pulls before optimization analysis.';
  }
  if (input.trackingGaps.length > 0) {
    return 'Review marketing tracking warnings before making optimization recommendations.';
  }
  if (input.conversionTruth.reconciliation.status === 'missing_unisane_truth') {
    return 'Add a Unisane-confirmed conversion export/cache before treating provider conversions as business truth.';
  }
  if (input.conversionTruth.reconciliation.status === 'provider_missing') {
    return 'Pull provider conversion reports before reconciliation or optimization analysis.';
  }
  if (input.conversionTruth.reconciliation.status === 'mismatch') {
    return 'Investigate provider vs Unisane-confirmed conversion mismatch before optimization analysis.';
  }
  if (input.strategyObjects.status === 'missing') {
    return 'Add a marketing strategy map so reports can compare ads, SEO, analytics, and conversion truth by business object.';
  }
  if (input.strategyObjects.status === 'error') {
    return 'Fix the marketing strategy-map artifact before object-level optimization analysis.';
  }
  if (input.strategyObjects.gaps.length > 0) {
    return 'Review strategy-object gaps before generating optimization recommendations.';
  }
  return 'Provider reports and tracking checks are ready for recommendation analysis.';
}

function reconcileConversionTruth(input: {
  providerConversions?: number;
  providerConversionValue?: number;
  confirmedStatus: MarketingConfirmedConversionStatus;
}): MarketingUnifiedConversionTruth['reconciliation'] {
  if (!input.confirmedStatus.metrics) {
    return {
      status: 'missing_unisane_truth',
      message: 'No Unisane-confirmed conversion metrics are available for reconciliation.',
    };
  }
  if (input.providerConversions === undefined && input.providerConversionValue === undefined) {
    return {
      status: 'provider_missing',
      message: 'No provider-reported conversion metrics are available for reconciliation.',
    };
  }
  const conversionDelta =
    input.providerConversions === undefined
      ? undefined
      : input.providerConversions - (input.confirmedStatus.metrics.conversions ?? 0);
  const conversionValueDelta =
    input.providerConversionValue === undefined
      ? undefined
      : input.providerConversionValue - (input.confirmedStatus.metrics.conversionValue ?? 0);
  const mismatch =
    (conversionDelta !== undefined && Math.abs(conversionDelta) > 0) ||
    (conversionValueDelta !== undefined && Math.abs(conversionValueDelta) > 0.01);
  return {
    status: mismatch ? 'mismatch' : 'ready',
    conversionDelta,
    conversionValueDelta,
    message: mismatch
      ? 'Provider-reported conversions differ from Unisane-confirmed conversion truth.'
      : 'Provider-reported conversions match Unisane-confirmed conversion truth for available metrics.',
  };
}

export async function buildUnifiedMarketingReport(
  config: MarketingExecutionContext,
  options: MarketingUnifiedReportOptions = {},
): Promise<MarketingUnifiedReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const providerReport = readMarketingProviderReportStatus({
    cwd,
    maxAgeDays,
    now,
  });
  const confirmedConversionStatus = readMarketingConfirmedConversionStatus({
    cwd,
    maxAgeDays,
    now,
  });
  const strategyObjects = buildMarketingStrategyObjectReport({
    cwd,
    maxAgeDays,
    now,
  });
  const auditReport = await auditMarketingTrackingSource(config, {
    cwd,
    sourceRoots: options.sourceRoots,
  });
  const registries = await loadMarketingRegistries(config, { cwd });
  const serverConversions = registries.conversions.value.conversions.filter(
    (conversion) => conversion.confirmationSource === 'server',
  );
  const auditedServerConversions = auditReport.checks.filter(
    (check) => check.id.startsWith('conversions.') && check.id.endsWith('.usage'),
  );
  const trackingGaps = auditReport.checks.filter((check) => check.status !== 'pass');
  const ads = sectionFor(providerReport.providers, ['googleAds', 'metaAds']);
  const analytics = sectionFor(providerReport.providers, ['ga4']);
  const seo = sectionFor(providerReport.providers, ['searchConsole']);
  const conversionSources = providerReportedConversionSources(providerReport.providers);
  const reconciliation = reconcileConversionTruth({
    providerConversions: ads.metrics.conversions,
    providerConversionValue: ads.metrics.conversionValue,
    confirmedStatus: confirmedConversionStatus,
  });
  const conversionTruth: MarketingUnifiedConversionTruth = {
    providerReported: {
      conversions: ads.metrics.conversions,
      conversionValue: ads.metrics.conversionValue,
      sources: conversionSources,
    },
    unisaneConfirmed: {
      status: confirmedConversionStatus.metrics ? 'available' : 'missing',
      configuredServerConversionCount: serverConversions.length,
      auditedServerConversionCount: auditedServerConversions.length,
      statusDetail: confirmedConversionStatus,
      conversions: confirmedConversionStatus.metrics?.conversions,
      conversionValue: confirmedConversionStatus.metrics?.conversionValue,
      revenue: confirmedConversionStatus.metrics?.revenue,
      margin: confirmedConversionStatus.metrics?.margin,
      message: confirmedConversionStatus.metrics
        ? 'Unisane-confirmed conversion performance artifact is available for reconciliation.'
        : 'No Unisane-confirmed conversion performance artifact is configured yet; provider conversions stay attribution signals, not business truth.',
    },
    reconciliation,
  };

  return {
    ok: providerReport.ok && auditReport.ok && confirmedConversionStatus.status !== 'error',
    cwd,
    generatedAt: now.toISOString(),
    platformId: config.platformId,
    appId: config.appId,
    freshnessMaxAgeDays: maxAgeDays,
    sections: {
      ads,
      analytics,
      seo,
      conversionTruth,
      strategyObjects,
      trackingGaps,
    },
    providerFreshness: providerReport.providers,
    confirmedConversionFreshness: confirmedConversionStatus,
    strategyMapFreshness: strategyObjects.freshness,
    nextWorkflowStep: resolveNextWorkflowStep({
      trackingGaps,
      providerFreshness: providerReport.providers,
      conversionTruth,
      strategyObjects,
    }),
  };
}
