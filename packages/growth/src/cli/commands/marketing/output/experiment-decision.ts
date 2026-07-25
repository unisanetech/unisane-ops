import type {
  MarketingExperimentDecisionReceipt,
  MarketingExperimentDecisionResult,
} from '@unisane/growth/marketing';

export function renderMarketingExperimentDecisionMarkdown(
  result: MarketingExperimentDecisionResult,
): string {
  const receipt: MarketingExperimentDecisionReceipt = result.receipt;
  return [
    '# Marketing Experiment Decision',
    '',
    `Generated: ${receipt.generatedAt}`,
    `Platform: ${receipt.platformId}`,
    `App: ${receipt.appId}`,
    `Experiment: ${receipt.experimentId}`,
    `Decision: ${receipt.decision}`,
    `Result: ${receipt.result}`,
    `Decided by: ${receipt.decidedBy}`,
    `Output: ${result.path}`,
    '',
    '## Policy',
    `- Preserves baseline: ${receipt.policy.preservesBaseline ? 'yes' : 'no'}`,
    `- Records completed decision: ${receipt.policy.recordsCompletedExperimentDecision ? 'yes' : 'no'}`,
    `- Separate recommendation/apply receipts required: ${receipt.policy.liveMutationRequiresRecommendationAndApplyReceipts ? 'yes' : 'no'}`,
    '',
    '## Next',
    receipt.nextWorkflowStep,
    '',
  ].join('\n');
}

export function printMarketingExperimentDecisionResult(
  result: MarketingExperimentDecisionResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderMarketingExperimentDecisionMarkdown(result));
}
