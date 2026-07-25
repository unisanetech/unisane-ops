import { log } from '../../../log.js';
import { importTrendSignalFile } from '@unisane/growth/seo';
import { printImportTrendSignalFileResult } from '../format-output.js';
import type { SeoTrendImportCliOptions } from '../options.js';

export async function seoTrendsImport(options: SeoTrendImportCliOptions): Promise<number> {
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

    const result = await importTrendSignalFile({
      cwd: options.cwd,
      platformId: options.platform,
      input: options.input,
      output: options.out,
      provider: options.provider,
      country: options.country,
      language: options.language,
      dateRange: options.dateRange,
      dryRun: options.dryRun,
    });
    printImportTrendSignalFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown trend signal import error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
