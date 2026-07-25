import type {
  MarketingAdsSearchTermClassification,
  MarketingAdsSearchTermsResult,
} from '@unisane/growth/marketing';

function actionSummary(classification: MarketingAdsSearchTermClassification): string {
  return classification.actions.join(', ');
}

export function renderAdsSearchTermsMarkdown(result: MarketingAdsSearchTermsResult): string {
  const { report } = result;
  const lines = [
    '# Ads Search Terms',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Source: ${report.sourcePath}`,
    `Output: ${result.path ?? (result.dryRun ? 'dry-run' : '-')}`,
    '',
    '## Summary',
    `- Total queries: ${report.summary.totalQueries}`,
    `- Negative candidates: ${report.summary.negativeCandidates}`,
    `- Keyword promotions: ${report.summary.keywordPromotions}`,
    `- Landing-page opportunities: ${report.summary.landingPageOpportunities}`,
    `- SEO opportunities: ${report.summary.seoOpportunities}`,
    `- Product insights: ${report.summary.productInsights}`,
    '',
    '## Top Classifications',
  ];

  for (const classification of report.classifications.slice(0, 20)) {
    lines.push(
      `- ${classification.query}: ${actionSummary(classification)} (${classification.reason})`,
    );
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsSearchTermsResult(
  result: MarketingAdsSearchTermsResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsSearchTermsMarkdown(result));
}
