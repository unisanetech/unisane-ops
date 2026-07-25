import type { MarketingAdsStatusCheck, MarketingAdsStatusReport } from '@unisane/growth/marketing';
import { printMarketingProviderReportStatus } from '../../marketing/output/doctor.js';

function statusIcon(status: MarketingAdsStatusCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  if (status === 'skip') return 'SKIP';
  return 'FAIL';
}

export function renderAdsStatusMarkdown(report: MarketingAdsStatusReport): string {
  const lines = [
    '# Ads Doctor',
    '',
    `Platform: ${report.platformId}`,
    `App: ${report.appId}`,
    `Default environment: ${report.defaultEnvironment}`,
    `Config: ${report.configPath ?? '-'}`,
    '',
    '## Providers',
  ];

  for (const provider of report.providers) {
    lines.push(
      `- ${provider.provider}: state=${provider.state} accountEnv=${provider.accountIdEnv ?? '-'} accountSet=${provider.accountIdSet ? 'yes' : 'no'} loginCustomerEnv=${provider.loginCustomerIdEnv ?? '-'} loginCustomerSet=${provider.loginCustomerIdSet ? 'yes' : 'no'} pageEnv=${provider.pageIdEnv ?? '-'} pageSet=${provider.pageIdSet ? 'yes' : 'no'} instagramActorEnv=${provider.instagramActorIdEnv ?? '-'} instagramActorSet=${provider.instagramActorIdSet ? 'yes' : 'no'}`,
    );
    for (const environment of provider.environmentAccountRefs) {
      lines.push(
        `  - ${environment.environment}: production=${environment.production ? 'yes' : 'no'} accountEnv=${environment.accountIdEnv ?? '-'} set=${environment.accountIdSet ? 'yes' : 'no'}`,
      );
    }
  }

  lines.push('', '## Conversion Mappings');
  for (const mapping of report.conversionMappings) {
    lines.push(
      `- ${mapping.provider}: mapped=${mapping.mappedConversions} missing=${mapping.missingConversions.length}`,
    );
  }

  lines.push('', '## Latest Artifacts');
  lines.push(`- Ads plan: ${report.latestPlan?.path ?? '-'}`);
  lines.push(`- Ads apply receipt: ${report.latestReceipt?.path ?? '-'}`);

  lines.push('', '## Creative Inventory');
  for (const creative of report.creativeInventory) {
    lines.push(
      `- ${creative.provider}/${creative.reportType ?? 'latest'}: ${creative.status} records=${creative.recordCount ?? 0}`,
    );
  }

  lines.push('', '## Checks');
  for (const check of report.checks) {
    lines.push(`- ${statusIcon(check.status)} ${check.id}: ${check.message}`);
  }

  lines.push('', '## Next', report.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsStatusReport(
  report: MarketingAdsStatusReport,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(renderAdsStatusMarkdown(report));
}

export { printMarketingProviderReportStatus as printAdsProviderReportStatus };
