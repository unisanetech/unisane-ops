import type {
  ConfigureSeoResearchWorkspaceResult,
  CrawlSiteFileResult,
  RenderSiteFileResult,
} from '@unisane/growth/seo';
import { log } from '../../../log.js';

export function printCrawlSiteFileResult(
  result: CrawlSiteFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Site crawl previewed (${result.pageCount} pages)`
      : `Site crawl evidence written (${result.pageCount} pages)`,
  );
  log.kv('Site', result.siteUrl);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Changed or new', String(result.changedPageCount));
  log.kv('Reused', String(result.reusedPageCount));
  log.kv('Failures', String(result.failureCount));
  log.kv('Discovered', String(result.discoveredUrlCount));
  log.kv('Bounded', result.truncated ? 'Limit reached' : 'Complete within configured limits');
}

export function printRenderSiteFileResult(
  result: RenderSiteFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  log.success(
    result.dryRun
      ? `Browser evidence previewed (${result.renderedPageCount} pages)`
      : `Browser evidence written (${result.renderedPageCount} pages)`,
  );
  log.kv('Site', result.siteUrl);
  log.kv('Output', result.output);
  log.kv('Selected', String(result.selectedPageCount));
  log.kv('Rendered', String(result.renderedPageCount));
  log.kv('Failures', String(result.failureCount));
  log.kv('Bounded', result.truncated ? 'Page limit reached' : 'Complete within configured limits');
}

export function printConfigureSeoResearchWorkspaceResult(
  result: ConfigureSeoResearchWorkspaceResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  log.success(result.dryRun ? 'SEO site setup previewed' : 'SEO site setup saved');
  log.kv('Site', result.siteUrl);
  log.kv(
    'Markets',
    result.markets.map((market) => `${market.country}/${market.language}`).join(', '),
  );
  log.kv('Platform', result.platformId);
  log.kv('Config', result.configPath);
  log.kv('Ownership', 'Confirmed by the local operator');
}
