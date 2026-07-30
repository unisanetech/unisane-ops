import { log } from '../../../log.js';
import { marketingAdsPlanProviderSchema, writeMarketingAdsPlan } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsPlanResult } from '../output/plan.js';

function parseProvider(value: string | undefined): AdsCliOptions['provider'] {
  if (!value || value === 'all') return 'all';
  return marketingAdsPlanProviderSchema.parse(value);
}

function parseDailyBudget(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('[ADS_PLAN_DAILY_BUDGET_INVALID] --daily-budget must be a positive number.');
  }
  return parsed;
}

export async function adsPlan(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const result = writeMarketingAdsPlan(loaded.config, {
      cwd: options.cwd,
      provider: parseProvider(options.provider),
      out: options.out,
      dryRun: options.dryRun,
      dailyBudgetAmount: parseDailyBudget(options.dailyBudget),
      currency: options.currency,
      seoAdsPlanPath: options.seoAdsPlan,
    });
    printAdsPlanResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads plan error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
