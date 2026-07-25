import { log } from '../../../log.js';
import {
  loadMarketingConfig,
  writeMarketingNegativeKeywordReport,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsNegativeKeywordResult } from '../output/negatives.js';

export async function adsNegatives(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = writeMarketingNegativeKeywordReport(loaded.config, {
      cwd: options.cwd,
      out: options.out,
      dryRun: options.dryRun,
    });
    printAdsNegativeKeywordResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads negatives error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
