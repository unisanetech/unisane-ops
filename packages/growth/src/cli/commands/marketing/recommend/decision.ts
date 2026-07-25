import { log } from '../../../log.js';
import {
  writeMarketingRecommendationDecisionReceipt,
  type MarketingRecommendationDecision,
} from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingRecommendationDecisionResult } from '../output/recommend-decision.js';

function parseDecision(value: string | undefined): MarketingRecommendationDecision {
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }
  throw new Error(
    '[MARKETING_RECOMMENDATION_DECISION_INVALID] --decision must be accepted or rejected.',
  );
}

function requiredOption(value: string | undefined, flag: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`[MARKETING_RECOMMENDATION_${flag}_REQUIRED] --${flag} is required.`);
  }
  return trimmed;
}

export async function marketingRecommendDecision(options: MarketingCliOptions): Promise<number> {
  try {
    const result = writeMarketingRecommendationDecisionReceipt({
      cwd: options.cwd,
      inputPath: requiredOption(options.input, 'input'),
      recommendationId: requiredOption(options.recommendationId, 'recommendation-id'),
      decision: parseDecision(options.decision),
      decidedBy: options.decidedBy,
      approvalReference: options.approvalRef,
      reason: options.reason,
      out: options.out,
    });
    printMarketingRecommendationDecisionResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing recommendation decision error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
