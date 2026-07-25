import type {
  MarketingNegativeKeywordCheck,
  MarketingNegativeKeywordResult,
} from '@unisane/growth/marketing';

function statusLabel(status: MarketingNegativeKeywordCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  return 'FAIL';
}

export function renderAdsNegativeKeywordMarkdown(result: MarketingNegativeKeywordResult): string {
  const { report } = result;
  const lines = [
    '# Ads Negative Keywords',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Registry: ${report.registryPath}`,
    `Output: ${result.path ?? (result.dryRun ? 'dry-run' : '-')}`,
    '',
    '## Summary',
    `- Entries: ${report.summary.entries}`,
    `- Account-level: ${report.summary.accountLevel}`,
    `- Campaign-level: ${report.summary.campaignLevel}`,
    `- Ad-group-level: ${report.summary.adGroupLevel}`,
    `- Search-term negative candidates: ${report.summary.searchTermNegativeCandidates}`,
    `- Uncovered candidates: ${report.summary.uncoveredSearchTermNegatives}`,
    '',
    '## Checks',
  ];

  for (const check of report.checks) {
    lines.push(`- ${statusLabel(check.status)} ${check.id}: ${check.message}`);
  }

  if (report.coverage.length > 0) {
    lines.push('', '## Search-Term Coverage');
    for (const coverage of report.coverage) {
      lines.push(
        `- ${coverage.covered ? 'covered' : 'uncovered'} ${coverage.query}${coverage.matchedEntryId ? ` -> ${coverage.matchedEntryId}` : ''}`,
      );
    }
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsNegativeKeywordResult(
  result: MarketingNegativeKeywordResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsNegativeKeywordMarkdown(result));
}
