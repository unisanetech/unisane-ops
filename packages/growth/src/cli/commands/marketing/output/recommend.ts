import type {
  MarketingRecommendation,
  MarketingRecommendationAlert,
  MarketingRecommendationArtifact,
  MarketingRecommendationResult,
} from '@unisane/growth/marketing';

function alertLine(alert: MarketingRecommendationAlert): string {
  return [
    `${alert.severity.toUpperCase()} ${alert.type}`,
    alert.provider ? `provider=${alert.provider}` : undefined,
    alert.strategyObjectId ? `object=${alert.strategyObjectId}` : undefined,
    `owner=${alert.owner}`,
    alert.message,
  ]
    .filter(Boolean)
    .join(' ');
}

function recommendationLine(recommendation: MarketingRecommendation): string {
  return [
    `${recommendation.severity.toUpperCase()} ${recommendation.action}`,
    `approval=${recommendation.approvalTier}`,
    `confidence=${recommendation.confidence}`,
    `risk=${recommendation.risk}`,
    `window=${recommendation.dataWindow}`,
    recommendation.strategyObjectId ? `object=${recommendation.strategyObjectId}` : undefined,
    recommendation.title,
  ]
    .filter(Boolean)
    .join(' ');
}

export function renderMarketingRecommendationMarkdown(
  result: MarketingRecommendationResult,
): string {
  const artifact: MarketingRecommendationArtifact = result.artifact;
  const lines = [
    '# Marketing Recommendations',
    '',
    `Generated: ${artifact.generatedAt}`,
    `Platform: ${artifact.platformId}`,
    `App: ${artifact.appId}`,
    `Dry run: ${result.dryRun ? 'yes' : 'no'}`,
    `Output: ${result.path ?? '-'}`,
    `Target CPA: ${artifact.thresholds.targetCpa}`,
    `Spend spike amount: ${artifact.thresholds.spendSpikeAmount}`,
    '',
    '## Blockers',
  ];

  if (artifact.blockers.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(...artifact.blockers.map((blocker) => `- ${blocker}`));
  }

  lines.push('', '## Alerts');
  if (artifact.alerts.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(...artifact.alerts.map((alert) => `- ${alertLine(alert)}`));
  }

  lines.push('', '## Recommendations');
  if (artifact.recommendations.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(...artifact.recommendations.map((rec) => `- ${recommendationLine(rec)}`));
  }

  lines.push('', '## Experiments');
  if (artifact.experiments.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(
      ...artifact.experiments.map(
        (experiment) =>
          `- ${experiment.id} status=${experiment.status} result=${experiment.result} decision=${experiment.decision} metric=${experiment.primaryMetric} window=${experiment.windowDays}d ${experiment.hypothesis}`,
      ),
    );
  }

  lines.push('', '## Next', artifact.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printMarketingRecommendationResult(
  result: MarketingRecommendationResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderMarketingRecommendationMarkdown(result));
}
