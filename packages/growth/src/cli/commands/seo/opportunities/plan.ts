import { log } from '../../../log.js';
import { loadSeoResearchConfig, planPageOpportunityFile } from '@unisane/growth/seo';
import { printPlanPageOpportunityFileResult } from '../format-output.js';
import type { SeoOpportunityPlanCliOptions } from '../options.js';

export async function seoOpportunitiesPlan(options: SeoOpportunityPlanCliOptions): Promise<number> {
  try {
    if (!options.clusters) {
      throw new Error('Missing required --clusters path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const { config } = await loadSeoResearchConfig({
      cwd: options.cwd,
      platformId: options.platform,
    });
    const result = await planPageOpportunityFile({
      cwd: options.cwd,
      clusters: options.clusters,
      output: options.out,
      basePath: options.basePath ?? config.opportunities.basePath,
      ctaLabel: options.ctaLabel ?? config.opportunities.ctaLabel,
      ctaTarget: options.ctaTarget ?? config.opportunities.ctaTarget,
      dryRun: options.dryRun,
    });
    printPlanPageOpportunityFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown SEO opportunity planning error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
