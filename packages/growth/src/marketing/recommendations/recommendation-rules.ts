import type {
  MarketingRecommendation,
  MarketingRecommendationAlert,
  MarketingRecommendationArtifact,
  MarketingRecommendationExperiment,
  MarketingRecommendationSeverity,
} from '../schema/recommendation.js';
import type { MarketingReportMetrics } from '../schema/report.js';
import type { MarketingUnifiedReport } from '../reports/unified-report.js';

export type MarketingRecommendationContent = {
  alerts: MarketingRecommendationAlert[];
  recommendations: MarketingRecommendation[];
  experiments: MarketingRecommendationExperiment[];
  blockers: string[];
};

function metricCost(metrics: MarketingReportMetrics): number {
  return metrics.cost ?? 0;
}

function metricConversions(metrics: MarketingReportMetrics): number {
  return metrics.conversions ?? 0;
}

function cpa(metrics: MarketingReportMetrics): number | undefined {
  const conversions = metricConversions(metrics);
  if (conversions <= 0) return undefined;
  return metricCost(metrics) / conversions;
}

function reportWindowLabel(window: {
  startDate: string;
  endDate: string;
  timeZone?: string;
}): string {
  return `${window.startDate}..${window.endDate}${window.timeZone ? ` ${window.timeZone}` : ''}`;
}

function statusWindowLabel(status: MarketingUnifiedReport['providerFreshness'][number]): string {
  if (status.window) return reportWindowLabel(status.window);
  if (status.pulledAt) return `pulledAt:${status.pulledAt}`;
  return `status:${status.status}`;
}

function sectionWindowLabel(section: MarketingUnifiedReport['sections']['ads']): string {
  const windows = [...new Set(section.statuses.map(statusWindowLabel))];
  return windows.length > 0 ? windows.join(', ') : 'provider-window:missing';
}

function dateAfterDays(isoDateTime: string, days: number): string {
  const date = new Date(isoDateTime);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function trackingWindowLabel(report: MarketingUnifiedReport): string {
  return `audit:${report.generatedAt}`;
}

function rootCauseBlockers(report: MarketingUnifiedReport): string[] {
  const blockers = new Set<string>();
  if (report.sections.trackingGaps.some((gap) => gap.status === 'error')) {
    blockers.add('tracking_errors_block_scaling');
  }
  if (report.sections.conversionTruth.reconciliation.status === 'mismatch') {
    blockers.add('conversion_reconciliation_mismatch');
  }
  if (
    report.providerFreshness.some((status) =>
      ['missing', 'stale', 'partial', 'error'].includes(status.status),
    )
  ) {
    blockers.add('provider_data_not_fresh');
  }
  if (report.sections.strategyObjects.status !== 'available') {
    blockers.add('strategy_object_truth_unavailable');
  }
  return [...blockers].sort();
}

function addBrokenTracking(
  report: MarketingUnifiedReport,
  alerts: MarketingRecommendationAlert[],
  recommendations: MarketingRecommendation[],
): void {
  const trackingGaps = report.sections.trackingGaps.filter((gap) => gap.status !== 'pass');
  if (trackingGaps.length === 0) return;
  const severity: MarketingRecommendationSeverity = trackingGaps.some(
    (gap) => gap.status === 'error',
  )
    ? 'critical'
    : 'high';
  const alertId = 'alert-broken-tracking';
  alerts.push({
    id: alertId,
    type: 'broken_tracking',
    severity,
    owner: 'marketing/tracking',
    source: 'marketing-audit',
    window: trackingWindowLabel(report),
    message: `${trackingGaps.length} tracking or conversion audit checks need review before scaling.`,
    recommendedAction: 'Fix tracking gaps before spend increases or optimization decisions.',
    rootCauseKey: 'tracking-gaps',
  });
  recommendations.push({
    id: 'rec-fix-tracking-before-scaling',
    action: 'fix_tracking',
    severity,
    approvalTier: 'none',
    owner: 'marketing/tracking',
    source: 'marketing-audit',
    alertIds: [alertId],
    experimentIds: [],
    dataWindow: trackingWindowLabel(report),
    confidence: 'high',
    risk: severity === 'critical' ? 'critical' : 'high',
    metrics: {},
    title: 'Fix tracking before scaling paid acquisition',
    rationale:
      'Tracking-fix recommendations outrank scaling recommendations because provider metrics are not reliable until audit gaps are resolved.',
    nextStep:
      'Run `unisane-ops growth marketing audit`, fix failed checks, then regenerate recommendations.',
    requiresReceipt: true,
  });
}

function addFreshnessAlerts(
  report: MarketingUnifiedReport,
  alerts: MarketingRecommendationAlert[],
  recommendations: MarketingRecommendation[],
): void {
  for (const status of report.providerFreshness) {
    if (!['missing', 'stale', 'partial', 'error'].includes(status.status)) continue;
    const alertId = `alert-stale-report-${status.provider}${status.reportType ? `-${status.reportType}` : ''}`;
    alerts.push({
      id: alertId,
      type: 'stale_report',
      severity: status.status === 'error' ? 'high' : 'warn',
      owner: 'marketing/reporting',
      source: 'provider-pulls',
      provider: status.provider,
      window: statusWindowLabel(status),
      message: status.message,
      recommendedAction: 'Refresh provider report pulls before optimization decisions.',
      rootCauseKey: `provider-freshness:${status.provider}:${status.reportType ?? 'default'}`,
    });
    recommendations.push({
      id: `rec-refresh-${status.provider}${status.reportType ? `-${status.reportType}` : ''}`,
      action: 'refresh_provider_data',
      severity: status.status === 'error' ? 'high' : 'warn',
      approvalTier: 'none',
      owner: 'marketing/reporting',
      source: 'provider-pulls',
      alertIds: [alertId],
      experimentIds: [],
      dataWindow: statusWindowLabel(status),
      confidence: 'high',
      risk: status.status === 'error' ? 'high' : 'medium',
      metrics: status.metrics ?? {},
      title: `Refresh ${status.provider}${status.reportType ? `/${status.reportType}` : ''} report data`,
      rationale:
        'Fresh report data is required before spend, CPA, and conversion recommendations can be trusted.',
      nextStep:
        'Run `unisane-ops growth marketing pull` or `marketing pull-api` for the stale, missing, partial, or invalid provider.',
      requiresReceipt: true,
    });
  }
}

function addSpendAlerts(input: {
  report: MarketingUnifiedReport;
  alerts: MarketingRecommendationAlert[];
  recommendations: MarketingRecommendation[];
  experiments: MarketingRecommendationExperiment[];
  targetCpa: number;
  spendSpikeAmount: number;
}): void {
  const ads = input.report.sections.ads.metrics;
  const adsWindow = sectionWindowLabel(input.report.sections.ads);
  const adsCost = metricCost(ads);
  const adsConversions = metricConversions(ads);
  if (adsCost >= input.spendSpikeAmount) {
    input.alerts.push({
      id: 'alert-spend-spike-ads',
      type: 'spend_spike',
      severity: 'high',
      owner: 'marketing/ads',
      source: 'provider-pulls',
      window: adsWindow,
      message: `Ads spend ${adsCost} is at or above the configured spend spike threshold ${input.spendSpikeAmount}.`,
      recommendedAction:
        'Review spend concentration and confirm conversion truth before increasing budget.',
      rootCauseKey: 'ads-spend-threshold',
    });
  }
  if (adsCost > 0 && adsConversions === 0) {
    input.alerts.push({
      id: 'alert-zero-conversion-ads',
      type: 'zero_conversion',
      severity: 'critical',
      owner: 'marketing/ads',
      source: 'provider-pulls',
      window: adsWindow,
      message: 'Ads spend exists but provider conversions are zero.',
      recommendedAction:
        'Hold scaling and review landing page, conversion mapping, and campaign targeting.',
      rootCauseKey: 'ads-zero-conversion',
    });
    input.recommendations.push({
      id: 'rec-hold-scaling-zero-conversions',
      action: 'pause_or_reduce_spend',
      severity: 'critical',
      approvalTier: 'standard',
      owner: 'marketing/ads',
      source: 'provider-pulls',
      alertIds: ['alert-zero-conversion-ads'],
      experimentIds: [],
      dataWindow: adsWindow,
      confidence:
        input.report.sections.conversionTruth.reconciliation.status === 'ready' ? 'high' : 'medium',
      risk: 'critical',
      metrics: ads,
      title: 'Hold scaling while ads have zero conversions',
      rationale:
        'Budget increases and campaign enables are unsafe when paid traffic has spend but no conversion signal.',
      nextStep:
        'Create a reviewed ads apply plan for pause or budget reduction after conversion mapping is checked.',
      requiresReceipt: true,
    });
  }
  const adsCpa = cpa(ads);
  if (adsCpa !== undefined && adsCpa > input.targetCpa) {
    input.alerts.push({
      id: 'alert-cpa-spike-ads',
      type: 'cpa_spike',
      severity: adsCpa > input.targetCpa * 2 ? 'critical' : 'high',
      owner: 'marketing/ads',
      source: 'provider-pulls',
      window: adsWindow,
      message: `Ads CPA ${adsCpa.toFixed(2)} is above target CPA ${input.targetCpa}.`,
      recommendedAction: 'Reduce spend or run a focused experiment before scaling.',
      rootCauseKey: 'ads-cpa-above-target',
    });
    input.recommendations.push({
      id: 'rec-decrease-budget-high-cpa',
      action: 'decrease_budget',
      severity: adsCpa > input.targetCpa * 2 ? 'critical' : 'high',
      approvalTier: 'standard',
      owner: 'marketing/ads',
      source: 'provider-pulls',
      alertIds: ['alert-cpa-spike-ads'],
      experimentIds: [],
      dataWindow: adsWindow,
      confidence:
        input.report.sections.conversionTruth.reconciliation.status === 'ready' ? 'high' : 'medium',
      risk: adsCpa > input.targetCpa * 2 ? 'critical' : 'high',
      metrics: ads,
      title: 'Decrease budget while CPA is above target',
      rationale:
        'Budget reduction has lower approval friction than spend increases, but still needs a receipt-backed decision.',
      nextStep: 'Generate a reviewed ads apply dry run with a budget decrease operation.',
      requiresReceipt: true,
    });
  }
  addExperimentRecommendations(input);
}

function addExperimentRecommendations(input: {
  report: MarketingUnifiedReport;
  recommendations: MarketingRecommendation[];
  experiments: MarketingRecommendationExperiment[];
  targetCpa: number;
}): void {
  for (const objectJoin of input.report.sections.strategyObjects.objects) {
    const objectCpa = cpa(objectJoin.metrics.ads);
    const objectCost = metricCost(objectJoin.metrics.ads);
    const objectConversions = metricConversions(objectJoin.metrics.ads);
    const zeroConversionSpend = objectCost > 0 && objectConversions === 0;
    if (!zeroConversionSpend && (objectCpa === undefined || objectCpa <= input.targetCpa)) {
      continue;
    }
    const recommendationId = `rec-experiment-${objectJoin.object.id}`;
    const experimentId = `exp-${objectJoin.object.id}-cpa`;
    input.experiments.push({
      id: experimentId,
      sourceRecommendationId: recommendationId,
      owner: objectJoin.object.owner ?? 'marketing/experiments',
      channel: objectJoin.matches.providers.includes('googleAds')
        ? 'googleAds'
        : objectJoin.matches.providers.includes('metaAds')
          ? 'metaAds'
          : 'ads',
      strategyObjectId: objectJoin.object.id,
      campaignIds: objectJoin.object.campaignIds,
      adGroupIds: objectJoin.object.adGroupIds,
      adSetIds: objectJoin.object.adSetIds,
      adIds: objectJoin.object.adIds,
      creativeIds: objectJoin.dimensions.creativeIds,
      audienceIds: objectJoin.dimensions.audienceIds,
      audienceNames: objectJoin.dimensions.audienceNames,
      landingPageUrl: objectJoin.object.landingPageUrl,
      hypothesis: `A landing-page or offer test can reduce CPA for ${objectJoin.object.name ?? objectJoin.object.id}.`,
      primaryMetric: 'CPA',
      guardrailMetric: 'Unisane-confirmed conversions',
      baseline: {
        dataWindow: sectionWindowLabel(input.report.sections.ads),
        metric: objectCpa === undefined ? 'cost_with_zero_conversions' : 'CPA',
        value: objectCpa ?? objectCost,
      },
      windowDays: 14,
      startDate: input.report.generatedAt.slice(0, 10),
      endDate: dateAfterDays(input.report.generatedAt, 14),
      minimumSignalRule:
        'Do not decide before 14 days or enough Unisane-confirmed conversion signal is available.',
      result: 'pending',
      decision: 'pending',
      status: 'draft',
    });
    input.recommendations.push({
      id: recommendationId,
      action: 'run_experiment',
      severity: 'warn',
      approvalTier: 'standard',
      owner: objectJoin.object.owner ?? 'marketing/experiments',
      source: 'strategy-object-report',
      strategyObjectId: objectJoin.object.id,
      alertIds: [],
      experimentIds: [experimentId],
      dataWindow: sectionWindowLabel(input.report.sections.ads),
      confidence: 'medium',
      risk: 'medium',
      metrics: objectJoin.metrics.ads,
      title: `Run a CPA reduction experiment for ${objectJoin.object.name ?? objectJoin.object.id}`,
      rationale:
        'Experiment recommendations require a hypothesis, metric, window, and later decision receipt.',
      nextStep: 'Review the experiment draft before creating campaign or landing-page changes.',
      requiresReceipt: true,
    });
  }
}

export function buildMarketingRecommendationContent(input: {
  report: MarketingUnifiedReport;
  targetCpa: number;
  spendSpikeAmount: number;
}): MarketingRecommendationContent {
  const alerts: MarketingRecommendationAlert[] = [];
  const recommendations: MarketingRecommendation[] = [];
  const experiments: MarketingRecommendationExperiment[] = [];
  addBrokenTracking(input.report, alerts, recommendations);
  addFreshnessAlerts(input.report, alerts, recommendations);
  addSpendAlerts({
    report: input.report,
    alerts,
    recommendations,
    experiments,
    targetCpa: input.targetCpa,
    spendSpikeAmount: input.spendSpikeAmount,
  });
  return {
    alerts,
    recommendations,
    experiments,
    blockers: rootCauseBlockers(input.report),
  };
}

export function nextMarketingRecommendationWorkflowStep(
  artifact: MarketingRecommendationArtifact,
): string {
  if (artifact.alerts.some((alert) => alert.type === 'broken_tracking')) {
    return 'Fix tracking alerts first, then regenerate recommendations before spend changes.';
  }
  if (artifact.alerts.some((alert) => alert.type === 'stale_report')) {
    return 'Refresh stale or missing report data, then regenerate recommendations.';
  }
  if (artifact.recommendations.length === 0) {
    return 'No optimization recommendations were generated from the current thresholds.';
  }
  return 'Review recommendations, then write accepted/rejected decision receipts before changing campaigns.';
}
