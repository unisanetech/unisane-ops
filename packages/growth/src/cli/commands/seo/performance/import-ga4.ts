import { log } from '../../../log.js';
import { importSeoPerformanceFile } from '@unisane/growth/seo';
import { printImportSeoPerformanceFileResult } from '../format-output.js';
import type { SeoPerformanceImportCliOptions } from '../options.js';

export async function seoPerformanceImportGa4(
  options: SeoPerformanceImportCliOptions,
): Promise<number> {
  return importPerformance(options, 'ga4');
}

export async function importPerformance(
  options: SeoPerformanceImportCliOptions,
  source: 'google-search-console' | 'ga4',
): Promise<number> {
  try {
    if (!options.platform) {
      throw new Error('Missing required --platform id.');
    }
    if (!options.input) {
      throw new Error('Missing required --input CSV path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await importSeoPerformanceFile({
      cwd: options.cwd,
      platformId: options.platform,
      source,
      input: options.input,
      output: options.out,
      property: options.property,
      dateRange: options.dateRange,
      dryRun: options.dryRun,
    });
    printImportSeoPerformanceFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO performance import error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
