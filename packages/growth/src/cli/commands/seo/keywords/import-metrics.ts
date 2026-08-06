import { log } from '../../../log.js';
import {
  importCsvKeywordMetrics,
  keywordMetricProviderSchema,
  loadSeoResearchConfig,
} from '@unisane/growth/seo';
import { printImportCsvKeywordMetricsResult } from '../format-output.js';
import type { SeoKeywordImportMetricsCliOptions } from '../options.js';

export async function seoKeywordsImportMetrics(
  options: SeoKeywordImportMetricsCliOptions,
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

    const { config } = await loadSeoResearchConfig({
      cwd: options.cwd,
      platformId: options.platform,
    });
    const primaryMarket = config.markets[0];
    if (!primaryMarket) {
      throw new Error('SEO research config must contain at least one target market.');
    }
    const result = await importCsvKeywordMetrics({
      cwd: options.cwd,
      platformId: options.platform,
      input: options.input,
      output: options.out,
      country: options.country ?? primaryMarket.country,
      language: options.language ?? primaryMarket.language,
      provider: keywordMetricProviderSchema.parse(options.provider ?? 'csv-import'),
      dryRun: options.dryRun,
    });
    printImportCsvKeywordMetricsResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO metrics import error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
