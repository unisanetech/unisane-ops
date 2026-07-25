import type {
  MarketingDerivedMetrics,
  MarketingReportMetrics,
  MarketingUnifiedReport,
} from '@unisane/growth/marketing';

function formatNumber(value: number | undefined): string {
  return value === undefined ? '-' : String(Math.round(value * 100) / 100);
}

function metricsLine(metrics: MarketingReportMetrics): string {
  return [
    `spend=${formatNumber(metrics.cost)}`,
    `impressions=${formatNumber(metrics.impressions)}`,
    `clicks=${formatNumber(metrics.clicks)}`,
    `conversions=${formatNumber(metrics.conversions)}`,
    `value=${formatNumber(metrics.conversionValue)}`,
    `sessions=${formatNumber(metrics.sessions)}`,
    `revenue=${formatNumber(metrics.revenue)}`,
    `margin=${formatNumber(metrics.margin)}`,
  ].join(' ');
}

function derivedLine(metrics: MarketingDerivedMetrics): string {
  return [
    `ctr=${formatNumber(metrics.ctr)}%`,
    `cpc=${formatNumber(metrics.cpc)}`,
    `cpm=${formatNumber(metrics.cpm)}`,
    `cpa=${formatNumber(metrics.cpa)}`,
    `roas=${formatNumber(metrics.roas)}`,
  ].join(' ');
}

export function renderUnifiedMarketingReportMarkdown(report: MarketingUnifiedReport): string {
  const lines = [
    '# Unified Marketing Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Freshness max age: ${report.freshnessMaxAgeDays}d`,
    '',
    '## Tracking Gaps',
  ];

  if (report.sections.trackingGaps.length === 0) {
    lines.push('- No tracking gaps found.');
  } else {
    for (const gap of report.sections.trackingGaps) {
      lines.push(`- ${gap.status.toUpperCase()} ${gap.id}: ${gap.message}`);
    }
  }

  lines.push(
    '',
    '## Provider Freshness',
    ...report.providerFreshness.map(
      (provider) =>
        `- ${provider.provider}${provider.reportType ? `/${provider.reportType}` : ''}: ${provider.status} (${provider.message})`,
    ),
    '',
    '## Performance',
    `- Ads: ${metricsLine(report.sections.ads.metrics)} ${derivedLine(report.sections.ads.derived)}`,
    `- Analytics: ${metricsLine(report.sections.analytics.metrics)} ${derivedLine(report.sections.analytics.derived)}`,
    `- SEO: ${metricsLine(report.sections.seo.metrics)} ${derivedLine(report.sections.seo.derived)}`,
    '',
    '## Conversion Truth',
    `- Provider reported conversions: ${formatNumber(report.sections.conversionTruth.providerReported.conversions)}`,
    `- Provider reported conversion value: ${formatNumber(report.sections.conversionTruth.providerReported.conversionValue)}`,
    `- Unisane-confirmed status: ${report.sections.conversionTruth.unisaneConfirmed.status}`,
    `- Unisane-confirmed conversions: ${formatNumber(report.sections.conversionTruth.unisaneConfirmed.conversions)}`,
    `- Unisane-confirmed conversion value: ${formatNumber(report.sections.conversionTruth.unisaneConfirmed.conversionValue)}`,
    `- Unisane-confirmed revenue: ${formatNumber(report.sections.conversionTruth.unisaneConfirmed.revenue)}`,
    `- Unisane-confirmed margin: ${formatNumber(report.sections.conversionTruth.unisaneConfirmed.margin)}`,
    `- Reconciliation status: ${report.sections.conversionTruth.reconciliation.status}`,
    `- Reconciliation conversion delta: ${formatNumber(report.sections.conversionTruth.reconciliation.conversionDelta)}`,
    `- Unisane-confirmed message: ${report.sections.conversionTruth.unisaneConfirmed.message}`,
    '',
    '## Strategy Objects',
    `- Strategy-map status: ${report.sections.strategyObjects.freshness.status}`,
    `- Objects: ${report.sections.strategyObjects.objectCount}`,
    `- Gaps: ${report.sections.strategyObjects.gaps.length === 0 ? 'none' : report.sections.strategyObjects.gaps.join(', ')}`,
  );

  for (const objectJoin of report.sections.strategyObjects.objects.slice(0, 5)) {
    lines.push(
      `- ${objectJoin.object.id}: ads(${metricsLine(objectJoin.metrics.ads)}) confirmed(${metricsLine(objectJoin.metrics.confirmed)}) reconciliation=${objectJoin.reconciliation.status}`,
    );
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');

  return lines.join('\n');
}

export function printUnifiedMarketingReport(report: MarketingUnifiedReport): void {
  console.log(renderUnifiedMarketingReportMarkdown(report));
}
