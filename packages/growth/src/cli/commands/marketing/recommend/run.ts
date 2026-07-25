import { log } from '../../../log.js';
import { loadMarketingConfig, writeMarketingRecommendations } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingRecommendationResult } from '../output/recommend.js';

function parsePositiveNumber(value: string | undefined, name: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[MARKETING_RECOMMEND_${name}_INVALID] --${name} must be a positive number.`);
  }
  return parsed;
}

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[MARKETING_RECOMMEND_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function marketingRecommend(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = await writeMarketingRecommendations(loaded.config, {
      cwd: options.cwd,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      targetCpa: parsePositiveNumber(options.targetCpa, 'target-cpa'),
      spendSpikeAmount: parsePositiveNumber(options.spendSpikeAmount, 'spend-spike-amount'),
      sourceRoots: options.sourceRoot,
      out: options.out,
      dryRun: options.dryRun,
    });
    printMarketingRecommendationResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown marketing recommend error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
