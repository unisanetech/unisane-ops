import type {
  MarketingAdsApplyApprovalTier,
  MarketingAdsApplyMutationIntent,
  MarketingAdsApplyOperation,
  MarketingAdsApplySafety,
} from '../schema/ads-apply.js';
import type {
  MarketingAdsPlanAction,
  MarketingAdsPlanArtifact,
  MarketingAdsPlanProvider,
  MarketingAdsPlanRisk,
} from '../schema/ads-plan.js';

type MarketingAdsApplyOperationWithoutOrder = Omit<MarketingAdsApplyOperation, 'applyOrder'>;

function safetyFor(action: MarketingAdsPlanAction): MarketingAdsApplySafety {
  if (action.blocksApply) return 'blocked';
  if (action.type === 'validate_landing_page') return 'verification';
  if (action.type === 'pause_campaign' || action.type === 'archive_campaign') {
    return 'pause_or_archive';
  }
  if (action.type === 'decrease_budget') return 'low_risk_change';
  if (action.type === 'validate_conversion_mapping') return 'low_risk_change';
  return 'spend_or_launch';
}

function mutationIntentFor(action: MarketingAdsPlanAction): MarketingAdsApplyMutationIntent {
  if (action.blocksApply) return 'blocked';
  if (action.type === 'validate_landing_page') return 'verify';
  if (action.type === 'validate_conversion_mapping') return 'verify';
  if (action.type === 'decrease_budget') return 'spend_decrease';
  if (action.type === 'pause_campaign' || action.type === 'archive_campaign') {
    return 'pause_or_archive';
  }
  if (action.type === 'set_budget_guardrail') return 'spend_increase';
  return 'launch_or_expand';
}

function approvalTierFor(input: {
  safety: MarketingAdsApplySafety;
  mutationIntent: MarketingAdsApplyMutationIntent;
  requiresApproval: boolean;
}): MarketingAdsApplyApprovalTier {
  if (input.mutationIntent === 'spend_decrease') return 'standard';
  if (input.mutationIntent === 'pause_or_archive') return 'standard';
  if (input.safety === 'spend_or_launch') return 'strict';
  if (input.requiresApproval) return 'standard';
  return 'none';
}

function orderBucket(operation: MarketingAdsApplyOperationWithoutOrder): number {
  if (operation.safety === 'verification') return 1;
  if (operation.safety === 'low_risk_change') return 2;
  if (operation.safety === 'pause_or_archive') return 3;
  if (operation.safety === 'blocked') return 5;
  return 4;
}

function riskBucket(risk: MarketingAdsPlanRisk): number {
  if (risk === 'low') return 1;
  if (risk === 'medium') return 2;
  return 3;
}

function compareOperations(
  left: MarketingAdsApplyOperationWithoutOrder,
  right: MarketingAdsApplyOperationWithoutOrder,
): number {
  return (
    orderBucket(left) - orderBucket(right) ||
    riskBucket(left.risk) - riskBucket(right.risk) ||
    left.provider.localeCompare(right.provider) ||
    left.strategyObjectId.localeCompare(right.strategyObjectId) ||
    left.actionType.localeCompare(right.actionType)
  );
}

export function buildMarketingAdsApplyOperations(
  plan: MarketingAdsPlanArtifact,
): MarketingAdsApplyOperation[] {
  const operations: MarketingAdsApplyOperationWithoutOrder[] = plan.candidates.flatMap(
    (candidate) =>
      candidate.actions.map((action) => {
        const safety = safetyFor(action);
        const mutationIntent = mutationIntentFor(action);
        const approvalTier = approvalTierFor({
          safety,
          mutationIntent,
          requiresApproval: action.requiresApproval,
        });
        return {
          id: `${candidate.provider}:${candidate.strategyObjectId}:${action.type}`,
          provider: candidate.provider,
          strategyObjectId: candidate.strategyObjectId,
          actionType: action.type,
          risk: action.risk,
          safety,
          mutationIntent,
          approvalTier,
          requiresApproval: action.requiresApproval,
          blocksApply: action.blocksApply,
          firstApplyEligible:
            safety === 'verification' && !action.requiresApproval && !action.blocksApply,
          receiptRequired: true,
          destructiveAllowed: false,
          mode: 'dry_run_only' as const,
          summary: action.summary,
        } satisfies MarketingAdsApplyOperationWithoutOrder;
      }),
  );
  return operations
    .sort(compareOperations)
    .map((operation, index) => ({ ...operation, applyOrder: index + 1 }));
}

export function uniqueMarketingAdsPlanProviders(
  plan: MarketingAdsPlanArtifact,
): MarketingAdsPlanProvider[] {
  return [...new Set(plan.candidates.map((candidate) => candidate.provider))].sort();
}
