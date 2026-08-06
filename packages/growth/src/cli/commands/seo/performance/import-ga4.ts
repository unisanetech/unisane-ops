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
    if (!options.property || !options.startDate || !options.endDate || !options.dataKind) {
      throw new Error('Missing required property, date range, or data-kind evidence context.');
    }
    if (options.dataKind !== 'live' && options.dataKind !== 'sample') {
      throw new Error('Invalid --data-kind; expected live or sample.');
    }

    const result = await importSeoPerformanceFile({
      cwd: options.cwd,
      platformId: options.platform,
      source,
      input: options.input,
      output: options.out,
      property: options.property,
      startDate: options.startDate,
      endDate: options.endDate,
      sampleData: options.dataKind === 'sample',
      freshnessHours: parsePositiveInteger(options.freshnessHours),
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

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Invalid --freshness-hours; expected a positive integer.');
  }
  return parsed;
}
