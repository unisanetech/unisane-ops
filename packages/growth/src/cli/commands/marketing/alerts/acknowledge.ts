import { log } from '../../../log.js';
import { writeMarketingAlertAcknowledgementReceipt } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingAlertAcknowledgementResult } from '../output/alert-acknowledgement.js';

function requiredOption(value: string | undefined, flag: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`[MARKETING_ALERT_${flag}_REQUIRED] --${flag} is required.`);
  }
  return trimmed;
}

export async function marketingAlertAcknowledge(options: MarketingCliOptions): Promise<number> {
  try {
    const result = writeMarketingAlertAcknowledgementReceipt({
      cwd: options.cwd,
      inputPath: requiredOption(options.input, 'input'),
      alertId: requiredOption(options.alertId, 'alert-id'),
      acknowledgedBy: requiredOption(options.acknowledgedBy, 'acknowledged-by'),
      reason: options.reason,
      out: options.out,
    });
    printMarketingAlertAcknowledgementResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing alert acknowledgement error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
