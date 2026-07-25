import { log } from '../../../log.js';
import { expandKeywordSeedFile, loadSeoResearchConfig } from '@unisane/growth/seo';
import { printExpandKeywordSeedFileResult } from '../format-output.js';
import type { SeoKeywordExpandCliOptions } from '../options.js';

export async function seoKeywordsExpand(options: SeoKeywordExpandCliOptions): Promise<number> {
  try {
    if (!options.input) {
      throw new Error('Missing required --input path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const { config } = await loadSeoResearchConfig({
      cwd: options.cwd,
      platformId: options.platform,
    });
    const result = await expandKeywordSeedFile({
      cwd: options.cwd,
      input: options.input,
      output: options.out,
      patternPackId: options.pattern ?? config.keywordPatternPack,
      dryRun: options.dryRun,
    });
    printExpandKeywordSeedFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO keyword expansion error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
