import type {
  MarketingAdsCreativeStatusCheck,
  MarketingAdsCreativeStatusReport,
} from '@unisane/growth/marketing';

function statusIcon(status: MarketingAdsCreativeStatusCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  if (status === 'skip') return 'SKIP';
  return 'FAIL';
}

export function renderAdsCreativeStatusMarkdown(report: MarketingAdsCreativeStatusReport): string {
  const lines = [
    '# Ads Creative Status',
    '',
    `Platform: ${report.platformId ?? '-'}`,
    `App: ${report.appId ?? '-'}`,
    `Provider filter: ${report.providerFilter}`,
    `Plan: ${report.planPath ?? '-'}`,
    '',
    '## Planned Creatives',
  ];

  if (report.plannedAssets.length === 0) {
    lines.push('- none');
  } else {
    for (const asset of report.plannedAssets) {
      lines.push(
        `- ${asset.provider}/${asset.assetType}/${asset.id}: approval=${asset.approvalStatus} policy=${asset.policyStatus} destination=${asset.destinationUrl ?? '-'}`,
      );
    }
  }

  lines.push('', '## Provider Creative Inventory');
  for (const artifact of report.providerArtifacts) {
    lines.push(
      `- ${artifact.provider}/${artifact.reportType}: ${artifact.status} records=${artifact.recordCount} path=${artifact.path}`,
    );
  }

  lines.push('', '## Provider Creatives');
  if (report.providerAssets.length === 0) {
    lines.push('- none');
  } else {
    for (const asset of report.providerAssets) {
      lines.push(
        `- ${asset.provider}/${asset.assetType}/${asset.id}: policy=${asset.policyStatus} providerStatus=${asset.providerStatus ?? '-'} destination=${asset.destinationUrl ?? '-'}`,
      );
    }
  }

  lines.push('', '## Checks');
  for (const check of report.checks) {
    lines.push(`- ${statusIcon(check.status)} ${check.id}: ${check.message}`);
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsCreativeStatusReport(
  report: MarketingAdsCreativeStatusReport,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(renderAdsCreativeStatusMarkdown(report));
}
