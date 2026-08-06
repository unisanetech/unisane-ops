import {
  executeMarketingHistoryBackfill,
  marketingProviderReportTypeSchema,
  marketingReportProviderSchema,
  planMarketingHistoryBackfill,
} from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { pullMarketingProviderApiReport } from '../pull-api/run.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function positiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('[MARKETING_HISTORY_BACKFILL_MAX_DAYS_INVALID] --max-days must be positive.');
  }
  return parsed;
}

export async function marketingHistoryBackfill(options: MarketingCliOptions): Promise<number> {
  try {
    if (!options.provider || !options.report || !options.startDate || !options.endDate) {
      throw new Error(
        '[MARKETING_HISTORY_BACKFILL_OPTIONS_REQUIRED] Pass --provider, --report, --start-date, and --end-date.',
      );
    }
    const target = {
      provider: marketingReportProviderSchema.parse(options.provider),
      reportType: marketingProviderReportTypeSchema.parse(options.report),
      ...(options.accountId ? { accountId: options.accountId } : {}),
    };
    const plan = planMarketingHistoryBackfill({
      target,
      startDate: options.startDate,
      endDate: options.endDate,
      ...(options.afterDate ? { afterDate: options.afterDate } : {}),
      ...(options.maxDays ? { maxDays: positiveInteger(options.maxDays) } : {}),
    });
    if (options.dryRun) {
      if (options.json) printJson(plan);
      else {
        console.log(
          `Would record ${plan.windows.length} daily periods from ${plan.windows[0]?.startDate ?? options.startDate} to ${plan.windows.at(-1)?.endDate ?? options.endDate}.`,
        );
        if (!plan.complete && plan.nextAfterDate) {
          console.log(`Continue the next batch after ${plan.nextAfterDate}.`);
        }
      }
      return 0;
    }
    const result = await executeMarketingHistoryBackfill({
      plan,
      pullDay: async (_target, window) =>
        pullMarketingProviderApiReport({
          ...options,
          startDate: window.startDate,
          endDate: window.endDate,
        }),
    });
    if (options.json) printJson(result);
    else {
      console.log(
        result.status === 'complete'
          ? `Recorded ${result.completedDates.length} daily history periods.`
          : result.status === 'continuation-required'
            ? `Recorded this batch of ${result.completedDates.length} daily history periods.`
            : `Recorded ${result.completedDates.length} daily history periods before the backfill stopped.`,
      );
      if (result.failure) console.error(`${result.failure.date}: ${result.failure.message}`);
      if (result.resumeAfterDate) {
        console.log(`Resume with --after-date ${result.resumeAfterDate}.`);
      }
    }
    return result.status === 'failed' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown history backfill error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
