import { log } from '../../../log.js';
import { fetchCompetitorResearchFile } from '@unisane/growth/seo';
import { printFetchCompetitorResearchFileResult } from '../format-output.js';
import type { SeoCompetitorFetchCliOptions } from '../options.js';

export async function seoCompetitorsFetch(options: SeoCompetitorFetchCliOptions): Promise<number> {
  try {
    if (!options.platform) {
      throw new Error('Missing required --platform id.');
    }
    if (!options.input) {
      throw new Error('Missing required --input URL list path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await fetchCompetitorResearchFile({
      cwd: options.cwd,
      platformId: options.platform,
      input: options.input,
      output: options.out,
      market: options.market,
      timeoutMs: parsePositiveInteger(options.timeoutMs, 'timeout-ms'),
      userAgent: options.userAgent,
      maxPages: parsePositiveInteger(options.maxPages, 'max-pages'),
      dryRun: options.dryRun,
    });
    printFetchCompetitorResearchFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown competitor URL fetch error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}

function parsePositiveInteger(value: string | undefined, label: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid --${label}; expected a positive integer.`);
  }
  return parsed;
}
