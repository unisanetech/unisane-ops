import type {
  MarketingProofCheck,
  MarketingRealAccountProofStatusReport,
} from '@unisane/growth/marketing';

function statusIcon(status: MarketingProofCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  if (status === 'skip') return 'SKIP';
  if (status === 'pending') return 'PENDING';
  return 'FAIL';
}

export function renderMarketingProofStatusMarkdown(
  report: MarketingRealAccountProofStatusReport,
): string {
  const lines = [
    '# Marketing Real-Account Proof Status',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Default environment: ${report.defaultEnvironment}`,
    `Config: ${report.configPath ?? '-'}`,
    `Freshness max age: ${report.maxAgeDays}d`,
    `Limits/scopes record: ${report.limitsPath ?? '-'}`,
    `Ready for scheduled pulls: ${report.readyForScheduledPulls ? 'yes' : 'no'}`,
    '',
    '## Providers And Evidence',
  ];

  for (const provider of report.providers) {
    lines.push(
      `- ${provider.provider}: state=${provider.state ?? '-'} evidence=${provider.evidenceStatus} path=${provider.evidencePath ?? '-'}`,
    );
    for (const envRef of provider.requiredEnvRefs) {
      lines.push(`  - required env ${envRef.name}: ${envRef.set ? 'set' : 'missing'}`);
    }
    for (const envRef of provider.optionalEnvRefs) {
      lines.push(`  - optional env ${envRef.name}: ${envRef.set ? 'set' : 'missing'}`);
    }
    for (const family of provider.reportFamilies) {
      lines.push(
        `  - ${family.reportType}: ${family.status} records=${family.recordCount ?? 0} path=${family.path ?? '-'}`,
      );
    }
    if (provider.limitRecord) {
      lines.push(
        `  - limits: scopes=${provider.limitRecord.scopes.length} rateLimits=${provider.limitRecord.rateLimits.length} failureModes=${provider.limitRecord.failureModes.length}`,
      );
    }
  }

  lines.push('', '## Proof Commands');
  for (const provider of report.providers) {
    for (const command of provider.proofCommands) {
      lines.push(`- ${command.id}: ${command.command}`);
    }
  }

  lines.push('', '## Checks');
  for (const check of report.checks) {
    const command = check.command ? ` command=${check.command}` : '';
    lines.push(`- ${statusIcon(check.status)} ${check.id}: ${check.message}${command}`);
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printMarketingProofStatus(
  report: MarketingRealAccountProofStatusReport,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(renderMarketingProofStatusMarkdown(report));
}
