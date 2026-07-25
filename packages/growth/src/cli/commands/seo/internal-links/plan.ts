import { log } from '../../../log.js';
import { loadSeoResearchConfig, planInternalLinkFile } from '@unisane/growth/seo';
import { printPlanInternalLinkFileResult } from '../format-output.js';
import type { SeoInternalLinksPlanCliOptions } from '../options.js';

export async function seoInternalLinksPlan(
  options: SeoInternalLinksPlanCliOptions,
): Promise<number> {
  try {
    if (!options.opportunities) {
      throw new Error('Missing required --opportunities path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const maxRelated = options.maxRelated === undefined ? undefined : Number(options.maxRelated);
    if (maxRelated !== undefined && (!Number.isInteger(maxRelated) || maxRelated < 0)) {
      throw new Error('--max-related must be a non-negative integer.');
    }

    const { config } = await loadSeoResearchConfig({
      cwd: options.cwd,
      platformId: options.platform,
    });
    const result = await planInternalLinkFile({
      cwd: options.cwd,
      opportunities: options.opportunities,
      output: options.out,
      hubLabel: options.hubLabel ?? config.internalLinks.hubLabel,
      maxRelated: maxRelated ?? config.internalLinks.maxRelated,
      includeConversionLinks:
        options.includeConversionLinks ?? config.internalLinks.includeConversionLinks,
      dryRun: options.dryRun,
    });
    printPlanInternalLinkFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO internal linking error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
