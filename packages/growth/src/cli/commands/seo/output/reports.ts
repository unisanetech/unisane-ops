import { log } from '../../../log.js';
import type { GenerateSeoReportFileResult } from '@unisane/growth/seo';

export function printGenerateSeoReportFileResult(
  result: GenerateSeoReportFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `SEO report previewed (${result.opportunityCount} opportunities)`
      : `SEO report written (${result.opportunityCount} opportunities)`,
  );
  log.kv('Opportunities', result.opportunities);
  if (result.internalLinks) {
    log.kv('Internal links', result.internalLinks);
  }
  log.kv('Output', result.output);
}
