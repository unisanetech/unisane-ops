import type { MarketingStatusReport } from '@unisane/growth/marketing';

function statusLine(status: {
  status: string;
  message: string;
  ageDays?: number;
  recordCount?: number;
  objectCount?: number;
}): string {
  const details = [
    status.message,
    status.ageDays === undefined ? undefined : `${status.ageDays}d old`,
    status.recordCount === undefined ? undefined : `${status.recordCount} records`,
    status.objectCount === undefined ? undefined : `${status.objectCount} objects`,
  ]
    .filter(Boolean)
    .join(' | ');
  return `${status.status}${details ? ` - ${details}` : ''}`;
}

export function renderMarketingStatusMarkdown(report: MarketingStatusReport): string {
  const lines = [
    `# ${report.mode === 'analytics' ? 'Analytics' : 'Marketing'} Status`,
    '',
    `CWD: ${report.cwd}`,
    `Freshness max age: ${report.maxAgeDays}d`,
    '',
    '## Provider Freshness',
  ];

  for (const provider of report.providerFreshness) {
    const label = provider.reportType
      ? `${provider.provider}/${provider.reportType}`
      : provider.provider;
    lines.push(`- ${label}: ${statusLine(provider)}`);
  }

  lines.push(
    '',
    '## Confirmed Conversion Truth',
    `- ${statusLine(report.confirmedConversions)}`,
    '',
    '## Strategy Map',
    `- ${statusLine(report.strategyMap)}`,
    '',
    '## Next',
    report.nextWorkflowStep,
    '',
  );

  return lines.join('\n');
}

export function printMarketingStatus(report: MarketingStatusReport): void {
  console.log(renderMarketingStatusMarkdown(report));
}
