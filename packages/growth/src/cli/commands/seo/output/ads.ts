import { log } from '../../../log.js';
import type { PlanAdsFileResult } from '@unisane/growth/seo';

export function printPlanAdsFileResult(
  result: PlanAdsFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Ads plan previewed (${result.adGroupCount} ad groups)`
      : `Ads plan written (${result.adGroupCount} ad groups)`,
  );
  log.kv('Opportunities', result.opportunities);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Status filter', result.statusFilter);
  log.kv('Keywords', String(result.keywordCount));
  log.kv('Shared negatives', String(result.sharedNegativeKeywordCount));
}
