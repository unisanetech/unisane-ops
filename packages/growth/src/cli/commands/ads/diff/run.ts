import {
  buildMarketingAdsDiffReport,
  marketingAdsPlanProviderSchema,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsDiffReport } from '../output/diff.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('[ADS_DIFF_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.');
  }
  return parsed;
}

export async function adsDiff(options: AdsCliOptions): Promise<number> {
  try {
    if (!options.plan) {
      throw new Error('[ADS_DIFF_PLAN_REQUIRED] Pass --plan <ads-plan.json>.');
    }
    const provider =
      !options.provider || options.provider === 'all'
        ? 'all'
        : marketingAdsPlanProviderSchema.parse(options.provider);
    const report = buildMarketingAdsDiffReport({
      cwd: options.cwd,
      planPath: options.plan,
      provider,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
    });
    printAdsDiffReport(report, { json: options.json });
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads diff error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
