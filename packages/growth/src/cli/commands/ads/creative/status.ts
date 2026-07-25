import {
  buildMarketingAdsCreativeStatusReport,
  marketingAdsPlanProviderSchema,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsCreativeStatusReport } from '../output/creative-status.js';

function parseProvider(value: string | undefined): AdsCliOptions['provider'] {
  if (!value || value === 'all') return 'all';
  return marketingAdsPlanProviderSchema.parse(value);
}

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[ADS_CREATIVE_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function adsCreativeStatus(options: AdsCliOptions): Promise<number> {
  try {
    const report = buildMarketingAdsCreativeStatusReport({
      cwd: options.cwd,
      planPath: options.plan,
      provider: parseProvider(options.provider),
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
    });
    printAdsCreativeStatusReport(report, { json: options.json });
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads creative status error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
