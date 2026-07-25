import type {
  MarketingAdsLiveApplyResult,
  MarketingAdsApplyPreview,
  MarketingAdsApplyResult,
} from '@unisane/growth/marketing';

export function renderAdsApplyMarkdown(result: MarketingAdsApplyResult): string {
  const preview: MarketingAdsApplyPreview = result.preview;
  const lines = [
    '# Ads Apply Dry Run',
    '',
    `Generated: ${preview.generatedAt}`,
    `Platform: ${preview.platformId}`,
    `App: ${preview.appId}`,
    `Environment: ${preview.environment}`,
    `Plan: ${preview.planPath}`,
    `Plan status: ${preview.planStatus}`,
    `Output: ${result.path ?? '-'}`,
    `Receipt: ${result.receiptPath ?? '-'}`,
    '',
    '## Safety',
    `- Dry run: ${preview.dryRun ? 'yes' : 'no'}`,
    `- Live mutation allowed: ${preview.liveMutationAllowed ? 'yes' : 'no'}`,
    '',
    '## Confirmations',
  ];

  if (preview.confirmations.length === 0) {
    lines.push('- None required.');
  } else {
    lines.push(
      ...preview.confirmations.map((confirmation) => {
        const provider = confirmation.provider ? `/${confirmation.provider}` : '';
        return `- ${confirmation.type}${provider}: ${confirmation.status} expected=${confirmation.expected}`;
      }),
    );
  }

  lines.push('', '## Blockers');
  if (preview.blockers.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(...preview.blockers.map((blocker) => `- ${blocker}`));
  }

  lines.push('', '## Operations');
  if (preview.operations.length === 0) {
    lines.push('- No operations.');
  } else {
    lines.push(
      ...preview.operations.map(
        (operation) =>
          `- #${operation.applyOrder} ${operation.provider}/${operation.strategyObjectId} ${operation.actionType} intent=${operation.mutationIntent} safety=${operation.safety} approval=${operation.approvalTier} first-apply=${operation.firstApplyEligible ? 'yes' : 'no'}`,
      ),
    );
  }

  lines.push('', '## Next', preview.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsApplyResult(
  result: MarketingAdsApplyResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsApplyMarkdown(result));
}

export function renderAdsLiveApplyMarkdown(result: MarketingAdsLiveApplyResult): string {
  const receipt = result.receipt;
  const lines = [
    '# Ads Live Apply',
    '',
    `Generated: ${receipt.generatedAt}`,
    `Platform: ${receipt.platformId}`,
    `App: ${receipt.appId}`,
    `Environment: ${receipt.environment}`,
    `Status: ${receipt.status}`,
    `Executor: ${receipt.liveExecutorMode}`,
    `Output: ${result.path ?? '-'}`,
    '',
    '## Blockers',
  ];
  if (receipt.blockers.length === 0) lines.push('- None.');
  else lines.push(...receipt.blockers.map((blocker) => `- ${blocker}`));

  lines.push('', '## Operations');
  if (receipt.operationResults.length === 0) {
    lines.push('- No live-executable operations.');
  } else {
    lines.push(
      ...receipt.operationResults.map(
        (operation) =>
          `- ${operation.provider}/${operation.strategyObjectId} ${operation.actionType}: ${operation.status}; sent=${operation.liveMutationSent ? 'yes' : 'no'}; ${operation.message}`,
      ),
    );
  }
  lines.push('', '## Next', receipt.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsLiveApplyResult(
  result: MarketingAdsLiveApplyResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsLiveApplyMarkdown(result));
}
