import { log } from '../../../log.js';
import { generateSeoPerformanceReportFile } from '@unisane/growth/seo';
import { printGenerateSeoPerformanceReportFileResult } from '../format-output.js';
import type { SeoPerformanceReportCliOptions } from '../options.js';

export async function seoPerformanceReport(
  options: SeoPerformanceReportCliOptions,
): Promise<number> {
  try {
    if (!options.searchConsole && !options.ga4) {
      throw new Error('Pass --search-console or --ga4.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await generateSeoPerformanceReportFile({
      cwd: options.cwd,
      searchConsole: options.searchConsole,
      ga4: options.ga4,
      opportunities: options.opportunities,
      output: options.out,
      dryRun: options.dryRun,
    });
    printGenerateSeoPerformanceReportFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO performance report error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
