import { buildMarketingStatusReport, type MarketingStatusMode } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingStatus } from '../output/status.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[MARKETING_STATUS_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function marketingStatus(
  options: MarketingCliOptions,
  mode: MarketingStatusMode = 'marketing',
): Promise<number> {
  try {
    const report = buildMarketingStatusReport({
      cwd: options.cwd,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      mode,
    });
    if (options.json) printJson(report);
    else printMarketingStatus(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing status error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
