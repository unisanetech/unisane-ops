import type {
  MarketingConfirmedConversionArtifact,
  MarketingConfirmedConversionRecord,
  MarketingProviderReportArtifact,
  MarketingProviderReportRecord,
  MarketingReportMetrics,
} from '../schema/report.js';

export type MarketingDerivedMetrics = {
  ctr?: number;
  cpc?: number;
  cpm?: number;
  cpa?: number;
  roas?: number;
};

export function addMarketingMetric(
  metrics: MarketingReportMetrics,
  key: keyof MarketingReportMetrics,
  value: number | undefined,
): void {
  if (typeof value !== 'number') return;
  metrics[key] = (metrics[key] ?? 0) + value;
}

export function addProviderRecordMetrics(
  metrics: MarketingReportMetrics,
  record: MarketingProviderReportRecord,
): void {
  addMarketingMetric(metrics, 'impressions', record.metrics.impressions);
  addMarketingMetric(metrics, 'clicks', record.metrics.clicks);
  addMarketingMetric(metrics, 'cost', record.metrics.cost);
  addMarketingMetric(metrics, 'conversions', record.metrics.conversions);
  addMarketingMetric(metrics, 'conversionValue', record.metrics.conversionValue);
  addMarketingMetric(metrics, 'revenue', record.metrics.revenue);
  addMarketingMetric(metrics, 'margin', record.metrics.margin);
  addMarketingMetric(metrics, 'sessions', record.metrics.sessions);
  addMarketingMetric(metrics, 'users', record.metrics.users);
  addMarketingMetric(metrics, 'keyEvents', record.metrics.keyEvents);
  addMarketingMetric(metrics, 'purchases', record.metrics.purchases);
}

export function addConfirmedConversionMetrics(
  metrics: MarketingReportMetrics,
  record: MarketingConfirmedConversionRecord,
): void {
  if (record.status === 'reversed') return;
  addMarketingMetric(metrics, 'conversions', record.count);
  addMarketingMetric(metrics, 'conversionValue', record.value);
  addMarketingMetric(metrics, 'revenue', record.revenue);
  addMarketingMetric(metrics, 'margin', record.margin);
}

export function summarizeProviderArtifactMetrics(
  artifact: MarketingProviderReportArtifact,
): MarketingReportMetrics {
  const totals: MarketingReportMetrics = {};
  for (const record of artifact.records) {
    addProviderRecordMetrics(totals, record);
  }
  return totals;
}

export function summarizeConfirmedConversionMetrics(
  artifact: MarketingConfirmedConversionArtifact,
): MarketingReportMetrics {
  const latest = new Map<string, MarketingConfirmedConversionRecord>();
  for (const record of artifact.records) {
    const current = latest.get(record.outcomeReference);
    if (!current || record.revision > current.revision) latest.set(record.outcomeReference, record);
  }
  const metrics: MarketingReportMetrics = { conversions: 0 };
  for (const record of latest.values()) {
    addConfirmedConversionMetrics(metrics, record);
  }
  return metrics;
}

export function mergeMarketingMetrics(
  inputs: Array<MarketingReportMetrics | undefined>,
): MarketingReportMetrics {
  const metrics: MarketingReportMetrics = {};
  for (const input of inputs) {
    if (!input) continue;
    addMarketingMetric(metrics, 'impressions', input.impressions);
    addMarketingMetric(metrics, 'clicks', input.clicks);
    addMarketingMetric(metrics, 'cost', input.cost);
    addMarketingMetric(metrics, 'conversions', input.conversions);
    addMarketingMetric(metrics, 'conversionValue', input.conversionValue);
    addMarketingMetric(metrics, 'revenue', input.revenue);
    addMarketingMetric(metrics, 'margin', input.margin);
    addMarketingMetric(metrics, 'sessions', input.sessions);
    addMarketingMetric(metrics, 'users', input.users);
    addMarketingMetric(metrics, 'keyEvents', input.keyEvents);
    addMarketingMetric(metrics, 'purchases', input.purchases);
  }
  return metrics;
}

export function deriveMarketingMetrics(metrics: MarketingReportMetrics): MarketingDerivedMetrics {
  const revenueOrValue = metrics.revenue ?? metrics.conversionValue;
  return {
    ctr:
      metrics.clicks !== undefined && metrics.impressions
        ? (metrics.clicks / metrics.impressions) * 100
        : undefined,
    cpc: metrics.cost !== undefined && metrics.clicks ? metrics.cost / metrics.clicks : undefined,
    cpm:
      metrics.cost !== undefined && metrics.impressions
        ? (metrics.cost / metrics.impressions) * 1000
        : undefined,
    cpa:
      metrics.cost !== undefined && metrics.conversions
        ? metrics.cost / metrics.conversions
        : undefined,
    roas: revenueOrValue !== undefined && metrics.cost ? revenueOrValue / metrics.cost : undefined,
  };
}
