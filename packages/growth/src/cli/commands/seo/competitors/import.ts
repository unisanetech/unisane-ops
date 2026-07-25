import { log } from '../../../log.js';
import { competitorPageSourceSchema, importCompetitorResearchFile } from '@unisane/growth/seo';
import { printImportCompetitorResearchFileResult } from '../format-output.js';
import type { SeoCompetitorImportCliOptions } from '../options.js';

export async function seoCompetitorsImport(
  options: SeoCompetitorImportCliOptions,
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

    const result = await importCompetitorResearchFile({
      cwd: options.cwd,
      platformId: options.platform,
      input: options.input,
      output: options.out,
      market: options.market,
      source: competitorPageSourceSchema.parse(options.source ?? 'csv-import'),
      dryRun: options.dryRun,
    });
    printImportCompetitorResearchFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown competitor research import error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
