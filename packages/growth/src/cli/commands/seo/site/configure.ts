import { configureSeoResearchWorkspace, parseSeoTargetMarket } from '@unisane/growth/seo';
import { log } from '../../../log.js';
import { printConfigureSeoResearchWorkspaceResult } from '../format-output.js';
import type { SeoSiteConfigureCliOptions } from '../options.js';

export async function seoSiteConfigure(options: SeoSiteConfigureCliOptions): Promise<number> {
  try {
    if (!options.site) {
      throw new Error('Missing required --site URL.');
    }
    const result = await configureSeoResearchWorkspace({
      cwd: options.cwd,
      platformId: options.platform,
      siteUrl: options.site,
      markets: (options.market ?? []).map(parseSeoTargetMarket),
      ownershipConfirmed: options.confirmOwnership === true,
      searchConsoleProperty: options.searchConsoleProperty,
      ga4Property: options.ga4Property,
      crawl: {
        maxPages: parseInteger(options.maxPages, 'max-pages', 1),
        maxDepth: parseInteger(options.maxDepth, 'max-depth', 0),
        maxSitemaps: parseInteger(options.maxSitemaps, 'max-sitemaps', 0),
        maxDiscoveredUrls: parseInteger(options.maxDiscoveredUrls, 'max-discovered-urls', 1),
        maxResponseBytes: parseInteger(options.maxResponseBytes, 'max-response-bytes', 1),
        timeoutMs: parseInteger(options.timeoutMs, 'timeout-ms', 1),
        freshnessHours: parseInteger(options.freshnessHours, 'freshness-hours', 1),
        discoverSitemaps: options.sitemaps,
      },
      dryRun: options.dryRun,
    });
    printConfigureSeoResearchWorkspaceResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown site configuration error';
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
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`Invalid --${label}; expected an integer of at least ${minimum}.`);
  }
  return parsed;
}
