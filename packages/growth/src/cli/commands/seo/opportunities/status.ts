import { log } from '../../../log.js';
import { keywordClusterStatusSchema, updateOpportunityStatusFile } from '@unisane/growth/seo';
import { printUpdateOpportunityStatusFileResult } from '../format-output.js';
import type { SeoOpportunityStatusCliOptions } from '../options.js';

export async function seoOpportunitiesStatus(
  options: SeoOpportunityStatusCliOptions,
): Promise<number> {
  try {
    if (!options.opportunities) {
      throw new Error('Missing required --opportunities path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }
    if (!options.status) {
      throw new Error('Missing required --status value.');
    }

    const result = await updateOpportunityStatusFile({
      cwd: options.cwd,
      opportunities: options.opportunities,
      output: options.out,
      id: options.id,
      slug: options.slug,
      routePath: options.routePath,
      status: keywordClusterStatusSchema.parse(options.status),
      dryRun: options.dryRun,
    });
    printUpdateOpportunityStatusFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO opportunity status error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
