import { log } from '../../../log.js';
import {
  writeMarketingExperimentDecisionReceipt,
  type MarketingExperimentDecision,
} from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingExperimentDecisionResult } from '../output/experiment-decision.js';

function requiredOption(value: string | undefined, flag: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`[MARKETING_EXPERIMENT_${flag}_REQUIRED] --${flag} is required.`);
  }
  return trimmed;
}

function parseDecision(value: string | undefined): MarketingExperimentDecision {
  if (
    value === 'ship' ||
    value === 'iterate' ||
    value === 'stop' ||
    value === 'rerun' ||
    value === 'inconclusive'
  ) {
    return value;
  }
  throw new Error(
    '[MARKETING_EXPERIMENT_DECISION_INVALID] --decision must be ship, iterate, stop, rerun, or inconclusive.',
  );
}

function parseResult(value: string | undefined): 'won' | 'lost' | 'inconclusive' {
  if (value === 'won' || value === 'lost' || value === 'inconclusive') {
    return value;
  }
  throw new Error(
    '[MARKETING_EXPERIMENT_RESULT_INVALID] --result must be won, lost, or inconclusive.',
  );
}

export async function marketingExperimentDecide(options: MarketingCliOptions): Promise<number> {
  try {
    const result = writeMarketingExperimentDecisionReceipt({
      cwd: options.cwd,
      inputPath: requiredOption(options.input, 'input'),
      experimentId: requiredOption(options.experimentId, 'experiment-id'),
      decision: parseDecision(options.decision),
      decidedBy: requiredOption(options.decidedBy, 'decided-by'),
      result: parseResult(options.result),
      followUpAction: requiredOption(options.followUpAction, 'follow-up-action'),
      reason: requiredOption(options.reason, 'reason'),
      out: options.out,
    });
    printMarketingExperimentDecisionResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing experiment decision error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
