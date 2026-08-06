import type { GenerateSeoPageEvidenceFileResult } from '@unisane/growth/seo';
import { log } from '../../../log.js';

export function printGenerateSeoPageEvidenceFileResult(
  result: GenerateSeoPageEvidenceFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  log.success(
    result.dryRun
      ? `Page evidence previewed (${result.pageCount} pages)`
      : `Page evidence written (${result.pageCount} pages)`,
  );
  log.kv('Site', result.siteUrl);
  log.kv('Crawl', result.crawl);
  log.kv('Search Console', result.searchConsole ?? 'Not recorded');
  log.kv('GA4', result.ga4 ?? 'Not recorded');
  log.kv('Performance-only pages', String(result.performanceOnlyPageCount));
  log.kv('Data', result.sampleData ? 'Includes sample evidence' : 'Live evidence only');
  log.kv('Stale sources', result.staleSources.join(', ') || 'None');
  log.kv('Output', result.output);
}
