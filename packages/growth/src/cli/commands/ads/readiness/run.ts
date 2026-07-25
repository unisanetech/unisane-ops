import { log } from '../../../log.js';
import { loadMarketingConfig, writeMarketingAdsReadinessPlan } from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsReadinessResult } from '../output/readiness.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[ADS_READINESS_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function adsReadiness(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = await writeMarketingAdsReadinessPlan(loaded.config, {
      cwd: options.cwd,
      configPath: loaded.path,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      out: options.out,
      dryRun: options.dryRun,
    });
    printAdsReadinessResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads readiness error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
