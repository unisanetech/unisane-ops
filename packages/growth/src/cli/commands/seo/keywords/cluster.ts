import { log } from '../../../log.js';
import { clusterKeywordFile, keywordClusterPageTypeSchema } from '@unisane/growth/seo';
import { printClusterKeywordFileResult } from '../format-output.js';
import type { SeoKeywordClusterCliOptions } from '../options.js';

export async function seoKeywordsCluster(options: SeoKeywordClusterCliOptions): Promise<number> {
  try {
    if (!options.candidates) {
      throw new Error('Missing required --candidates path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await clusterKeywordFile({
      cwd: options.cwd,
      candidates: options.candidates,
      metrics: options.metrics,
      output: options.out,
      pageType: options.pageType ? keywordClusterPageTypeSchema.parse(options.pageType) : undefined,
      dryRun: options.dryRun,
    });
    printClusterKeywordFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO keyword clustering error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
