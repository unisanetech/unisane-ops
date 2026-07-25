import type {
  MarketingRecommendationDecisionReceipt,
  MarketingRecommendationDecisionResult,
} from '@unisane/growth/marketing';

export function renderMarketingRecommendationDecisionMarkdown(
  result: MarketingRecommendationDecisionResult,
): string {
  const receipt: MarketingRecommendationDecisionReceipt = result.receipt;
  return [
    '# Marketing Recommendation Decision',
    '',
    `Generated: ${receipt.generatedAt}`,
    `Platform: ${receipt.platformId}`,
    `App: ${receipt.appId}`,
    `Decision: ${receipt.decision}`,
    `Recommendation: ${receipt.recommendationId}`,
    `Approval tier: ${receipt.recommendation.approvalTier}`,
    `Decided by: ${receipt.decidedBy ?? '-'}`,
    `Approval reference: ${receipt.approvalReference ?? '-'}`,
    `Output: ${result.path}`,
    `Live mutation allowed: ${receipt.liveMutationAllowed ? 'yes' : 'no'}`,
    '',
    '## Policy',
    `- Approver required: ${receipt.policy.approverRequired ? 'yes' : 'no'}`,
    `- Approval reference required: ${receipt.policy.approvalReferenceRequired ? 'yes' : 'no'}`,
    `- Separate apply receipt required: ${receipt.policy.liveMutationRequiresSeparatePlanApplyReceipt ? 'yes' : 'no'}`,
    '',
    '## Next',
    receipt.nextWorkflowStep,
    '',
  ].join('\n');
}

export function printMarketingRecommendationDecisionResult(
  result: MarketingRecommendationDecisionResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderMarketingRecommendationDecisionMarkdown(result));
}
