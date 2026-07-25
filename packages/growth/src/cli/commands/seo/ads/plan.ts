import { log } from '../../../log.js';
import { adsPlanStatusFilterSchema, planAdsFile } from '@unisane/growth/seo';
import { printPlanAdsFileResult } from '../format-output.js';
import type { SeoAdsPlanCliOptions } from '../options.js';

export async function seoAdsPlan(options: SeoAdsPlanCliOptions): Promise<number> {
  try {
    if (!options.opportunities) {
      throw new Error('Missing required --opportunities path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await planAdsFile({
      cwd: options.cwd,
      opportunities: options.opportunities,
      output: options.out,
      status: adsPlanStatusFilterSchema.parse(options.status ?? 'approved-or-built'),
      maxKeywordsPerAdGroup: parsePositiveInteger(options.maxKeywordsPerAdGroup),
      dryRun: options.dryRun,
    });
    printPlanAdsFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads plan error';
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
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
