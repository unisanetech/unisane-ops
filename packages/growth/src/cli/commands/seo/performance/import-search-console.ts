import { importPerformance } from './import-ga4.js';
import type { SeoPerformanceImportCliOptions } from '../options.js';

export async function seoPerformanceImportSearchConsole(
  options: SeoPerformanceImportCliOptions,
): Promise<number> {
  return importPerformance(options, 'google-search-console');
}
