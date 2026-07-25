import type {
  MarketingAdsAssetCheck,
  MarketingAdsAssetImportResult,
  MarketingAdsAssetCreativePlanResult,
  MarketingAdsAssetReport,
  MarketingAdsAssetUploadResult,
  MarketingAdsAssetUploadPlanResult,
} from '@unisane/growth/marketing';

function statusIcon(status: MarketingAdsAssetCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  return 'FAIL';
}

export function printAdsAssetImportResult(
  result: MarketingAdsAssetImportResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    [
      '# Ads Asset Imported',
      '',
      `Asset: ${result.asset.id}`,
      `Registry: ${result.registryPath}`,
      `Source: ${result.sourcePath}`,
      '',
    ].join('\n'),
  );
}

export function renderAdsAssetReportMarkdown(report: MarketingAdsAssetReport): string {
  const lines = [
    '# Ads Assets',
    '',
    `Platform: ${report.registry.platformId}`,
    `App: ${report.registry.appId}`,
    `Registry: ${report.registryPath}`,
    '',
    '## Assets',
  ];
  if (report.registry.assets.length === 0) {
    lines.push('- none');
  } else {
    for (const asset of report.registry.assets) {
      lines.push(
        `- ${asset.id}: type=${asset.assetType} status=${asset.lifecycleStatus} providers=${asset.allowedProviders.join(',')} source=${asset.sourceFile?.localPath ?? '-'}`,
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

export function printAdsAssetReport(
  report: MarketingAdsAssetReport,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(renderAdsAssetReportMarkdown(report));
}

export function printAdsAssetUploadPlanResult(
  result: MarketingAdsAssetUploadPlanResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    [
      '# Ads Asset Upload Plan',
      '',
      `Status: ${result.ok ? 'ok' : 'needs review'}`,
      `Dry run: ${result.dryRun ? 'yes' : 'no'}`,
      `Path: ${result.path ?? '-'}`,
      `Operations: ${result.plan.operations.length}`,
      '',
    ].join('\n'),
  );
}

export function printAdsAssetCreativePlanResult(
  result: MarketingAdsAssetCreativePlanResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    [
      '# Ads Asset Creative Plan',
      '',
      `Status: ${result.ok ? 'ok' : 'needs review'}`,
      `Dry run: ${result.dryRun ? 'yes' : 'no'}`,
      `Path: ${result.path ?? '-'}`,
      `Operations: ${result.plan.operations.length}`,
      '',
    ].join('\n'),
  );
}

export function printAdsAssetUploadResult(
  result: MarketingAdsAssetUploadResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    [
      '# Ads Asset Upload',
      '',
      `Status: ${result.ok ? 'ok' : 'blocked/failed'}`,
      `Dry run: ${result.dryRun ? 'yes' : 'no'}`,
      `Path: ${result.path ?? '-'}`,
      `Operations: ${result.receipt.operationResults.length}`,
      '',
    ].join('\n'),
  );
}
