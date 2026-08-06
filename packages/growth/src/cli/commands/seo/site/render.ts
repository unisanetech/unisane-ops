import { renderSiteFile } from '@unisane/growth/seo';
import { createPlaywrightSiteRenderer } from '../../../adapters/playwright-site-renderer.js';
import { log } from '../../../log.js';
import { printRenderSiteFileResult } from '../output/site.js';
import type { SeoSiteRenderCliOptions } from '../options.js';

export async function seoSiteRender(options: SeoSiteRenderCliOptions): Promise<number> {
  try {
    const result = await renderSiteFile({
      cwd: options.cwd,
      platformId: options.platform,
      crawl: options.crawl,
      output: options.out,
      renderer: createPlaywrightSiteRenderer({
        channel: options.browserChannel,
        executablePath: options.browserExecutable,
      }),
      urls: options.url,
      maxPages: parseInteger(options.maxPages, 'max-pages', 1),
      timeoutMs: parseInteger(options.timeoutMs, 'timeout-ms', 1),
      settleMs: parseInteger(options.settleMs, 'settle-ms', 0),
      minStaticWordCount: parseInteger(options.minStaticWordCount, 'min-static-word-count', 0),
      freshnessHours: parseInteger(options.freshnessHours, 'freshness-hours', 1),
      dryRun: options.dryRun,
    });
    printRenderSiteFileResult(result, { json: options.json });
    return result.failureCount > 0 && result.renderedPageCount === 0 ? 1 : 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown site render error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}

function parseInteger(
  value: string | undefined,
  label: string,
  minimum: number,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`Invalid --${label}; expected an integer of at least ${minimum}.`);
  }
  return parsed;
}
