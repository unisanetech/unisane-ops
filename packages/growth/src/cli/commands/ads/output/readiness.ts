import type {
  MarketingAdsReadinessCheck,
  MarketingAdsReadinessResult,
} from '@unisane/growth/marketing';

function statusLabel(status: MarketingAdsReadinessCheck['status']): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  return 'FAIL';
}

export function renderAdsReadinessMarkdown(result: MarketingAdsReadinessResult): string {
  const { plan } = result;
  const lines = [
    '# Ads Readiness',
    '',
    `Platform: ${plan.platformId}`,
    `App: ${plan.appId}`,
    `Score: ${plan.readinessScore}`,
    `Output: ${result.path ?? (result.dryRun ? 'dry-run' : '-')}`,
    '',
    '## Product Strategy',
    `- Primary campaign type: ${plan.productStrategy.primaryCampaignType}`,
    `- Ad groups: ${plan.productStrategy.recommendedAdGroups.join(', ')}`,
    `- Conversion sequence: ${plan.productStrategy.recommendedConversionSequence.join(' -> ')}`,
    '',
    '## Checks',
  ];

  for (const check of plan.checks) {
    lines.push(`- ${statusLabel(check.status)} ${check.id}: ${check.message}`);
    if (check.recommendation) lines.push(`  - Next: ${check.recommendation}`);
  }

  lines.push('', '## Actions');
  for (const action of plan.actions) {
    lines.push(
      `- ${action.priority.toUpperCase()} ${action.id}: ${action.title} (${action.blocksLaunch ? 'blocks launch' : 'non-blocking'})`,
    );
  }

  lines.push('', '## Next', plan.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsReadinessResult(
  result: MarketingAdsReadinessResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsReadinessMarkdown(result));
}
