import { log } from '../../../log.js';
import type { PlanInternalLinkFileResult } from '@unisane/growth/seo';

export function printPlanInternalLinkFileResult(
  result: PlanInternalLinkFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Internal links previewed (${result.edgeCount} edges)`
      : `Internal links written (${result.edgeCount} edges)`,
  );
  log.kv('Opportunities', result.opportunities);
  log.kv('Output', result.output);
  log.kv('Pages', String(result.pageCount));
  log.kv('Orphan risks', String(result.orphanCount));
}
