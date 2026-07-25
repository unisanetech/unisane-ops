import {
  loadMarketingConfig,
  writeMarketingAdsCompetitorMonitorReport,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsCompetitorsResult } from '../output/competitors.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[ADS_COMPETITORS_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function adsCompetitors(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = writeMarketingAdsCompetitorMonitorReport(loaded.config, {
      cwd: options.cwd,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      out: options.out,
      dryRun: options.dryRun,
    });
    printAdsCompetitorsResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads competitors error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
