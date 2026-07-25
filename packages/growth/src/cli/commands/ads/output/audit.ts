import type { MarketingAdsAuditAction, MarketingAdsAuditResult } from '@unisane/growth/marketing';

function actionLine(action: MarketingAdsAuditAction): string {
  return `- [${action.severity}] ${action.title}: ${action.rationale}`;
}

export function renderAdsAuditMarkdown(result: MarketingAdsAuditResult): string {
  const { report } = result;
  const lines = [
    '# Ads Audit',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Score: ${report.score}`,
    `Output: ${result.path ?? (result.dryRun ? 'dry-run' : '-')}`,
    '',
    '## Sections',
    ...report.sections.map(
      (section) => `- ${section.label}: ${section.status} (${section.summary})`,
    ),
    '',
    '## Actions',
    ...report.actions.slice(0, 12).map(actionLine),
    '',
    '## Next',
    report.nextWorkflowStep,
    '',
  ];
  return lines.join('\n');
}

export function printAdsAuditResult(
  result: MarketingAdsAuditResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsAuditMarkdown(result));
}
