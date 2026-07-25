import type { MarketingAdsDiffReport } from '@unisane/growth/marketing';

function statusLabel(status: string): string {
  if (status === 'pass' || status === 'matched') return 'PASS';
  if (status === 'error' || status === 'blocked') return 'FAIL';
  return 'WARN';
}

export function renderAdsDiffMarkdown(report: MarketingAdsDiffReport): string {
  const lines = [
    '# Ads Diff',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Plan: ${report.planPath}`,
    `Plan status: ${report.planStatus}`,
    `Provider filter: ${report.providerFilter}`,
    `Freshness max age: ${report.maxAgeDays}d`,
    '',
    '## Candidates',
  ];

  if (report.candidates.length === 0) {
    lines.push('- No candidates for provider filter.');
  } else {
    lines.push(
      ...report.candidates.map(
        (candidate) =>
          `- ${statusLabel(candidate.status)} ${candidate.provider}/${candidate.strategyObjectId}: ${candidate.status}`,
      ),
    );
  }

  lines.push('', '## Checks');
  for (const check of report.checks) {
    const target = check.provider ? ` ${check.provider}` : '';
    lines.push(`- ${statusLabel(check.status)}${target} ${check.id}: ${check.message}`);
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsDiffReport(
  report: MarketingAdsDiffReport,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(renderAdsDiffMarkdown(report));
}
