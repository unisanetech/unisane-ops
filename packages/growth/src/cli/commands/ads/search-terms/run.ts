import { log } from '../../../log.js';
import { writeMarketingAdsSearchTermsReport } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsSearchTermsResult } from '../output/search-terms.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[ADS_SEARCH_TERMS_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function adsSearchTerms(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const result = writeMarketingAdsSearchTermsReport(loaded.config, {
      cwd: options.cwd,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      out: options.out,
      dryRun: options.dryRun,
    });
    printAdsSearchTermsResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads search terms error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
