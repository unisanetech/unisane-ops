import type {
  MarketingAdsCompetitorMonitorResult,
  MarketingAdsCompetitorSignal,
} from '@unisane/growth/marketing';

function actionSummary(signal: MarketingAdsCompetitorSignal): string {
  return signal.actions.join(', ');
}

function formatMetric(value: number | undefined): string {
  return typeof value === 'number' ? value.toFixed(2) : '-';
}

export function renderAdsCompetitorsMarkdown(result: MarketingAdsCompetitorMonitorResult): string {
  const { report } = result;
  const lines = [
    '# Ads Competitor Monitor',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Registry: ${report.registryPath}`,
    `Auction Insights: ${report.auctionInsightsPath}`,
    `Output: ${result.path ?? (result.dryRun ? 'dry-run' : '-')}`,
    '',
    '## Summary',
    `- Known competitors: ${report.summary.knownCompetitors}`,
    `- Auction insight rows: ${report.summary.auctionInsightRows}`,
    `- Domains seen: ${report.summary.domains}`,
    `- Unknown domains seen: ${report.summary.unknownDomainsSeen}`,
    `- High-pressure domains: ${report.summary.highPressureDomains}`,
    `- Medium-pressure domains: ${report.summary.mediumPressureDomains}`,
    '',
    '## Top Signals',
  ];

  for (const signal of report.signals.slice(0, 20)) {
    lines.push(
      `- ${signal.domain}: ${signal.pressure} pressure, impression share ${formatMetric(signal.metrics.impressionShare)}, overlap ${formatMetric(signal.metrics.overlapRate)} (${actionSummary(signal)})`,
    );
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsCompetitorsResult(
  result: MarketingAdsCompetitorMonitorResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsCompetitorsMarkdown(result));
}
