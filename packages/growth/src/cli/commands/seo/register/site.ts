import type { Command } from 'commander';
import {
  seoSiteCrawl,
  seoSiteConfigure,
  seoSiteRender,
  type SeoSiteCrawlCliOptions,
  type SeoSiteConfigureCliOptions,
  type SeoSiteRenderCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoSiteCommands(seo: Command): void {
  const site = seo.command('site').description('First-party site evidence commands');

  addSharedSeoOptions(
    site.command('configure').description('Save first-party site and target-market identity'),
  )
    .requiredOption('--site <url>', 'First-party HTTP or HTTPS site URL')
    .requiredOption(
      '--market <country/language>',
      'Target market, repeat for more than one (for example US/en)',
      collectValue,
      [],
    )
    .requiredOption('--confirm-ownership', 'Confirm ownership or authorization to crawl the site')
    .option(
      '--search-console-property <property>',
      'Expected Search Console URL-prefix or domain property',
    )
    .option('--ga4-property <property>', 'Expected GA4 numeric property id')
    .option('--max-pages <count>', 'Default maximum page requests')
    .option('--max-depth <count>', 'Default maximum internal-link depth')
    .option('--max-sitemaps <count>', 'Default maximum sitemap files')
    .option('--max-discovered-urls <count>', 'Default maximum retained discovery graph')
    .option('--max-response-bytes <count>', 'Default maximum response body size')
    .option('--timeout-ms <milliseconds>', 'Default per-request timeout')
    .option('--freshness-hours <hours>', 'Default evidence freshness window')
    .option('--no-sitemaps', 'Disable sitemap discovery by default')
    .option('--dry-run', 'Preview setup without writing the workspace config')
    .action(async (options: SeoSiteConfigureCliOptions) => {
      await runSeoCommand(options, seoSiteConfigure);
    });

  addSharedSeoOptions(
    site.command('crawl').description('Capture bounded local HTTP crawl evidence'),
  )
    .option('--site <url>', 'Override the configured first-party site URL')
    .option('--out <path>', 'Crawl snapshot output path (defaults to the SEO workspace)')
    .option('--previous <path>', 'Previous crawl snapshot used for conditional refresh')
    .option('--no-incremental', 'Do not reuse a previous crawl snapshot')
    .option('--no-sitemaps', 'Skip robots and default sitemap discovery')
    .option('--user-agent <value>', 'Crawler user agent')
    .option('--max-pages <count>', 'Maximum page requests')
    .option('--max-depth <count>', 'Maximum internal-link depth')
    .option('--max-sitemaps <count>', 'Maximum sitemap files')
    .option('--max-discovered-urls <count>', 'Maximum retained discovery graph')
    .option('--max-response-bytes <count>', 'Maximum response body size per request')
    .option('--timeout-ms <milliseconds>', 'Per-request timeout')
    .option('--freshness-hours <hours>', 'Evidence freshness window')
    .option('--dry-run', 'Capture and summarize without writing the snapshot')
    .action(async (options: SeoSiteCrawlCliOptions) => {
      await runSeoCommand(options, seoSiteCrawl);
    });

  addSharedSeoOptions(
    site
      .command('render')
      .description('Capture bounded browser-render evidence for recorded crawl pages'),
  )
    .option('--crawl <path>', 'Recorded crawl snapshot (defaults to the SEO workspace)')
    .option('--out <path>', 'Browser evidence output path (defaults to the SEO workspace)')
    .option(
      '--url <url>',
      'Render one recorded crawl URL, repeat for more than one',
      collectValue,
      [],
    )
    .option('--max-pages <count>', 'Maximum selected pages (default 10)')
    .option('--timeout-ms <milliseconds>', 'Per-page navigation timeout')
    .option('--settle-ms <milliseconds>', 'Bounded wait after DOMContentLoaded')
    .option('--min-static-word-count <count>', 'Select thinner static pages automatically')
    .option('--freshness-hours <hours>', 'Browser evidence freshness window')
    .option('--browser-channel <channel>', 'Installed Chromium channel (default chrome)')
    .option('--browser-executable <path>', 'Explicit local Chromium-family executable')
    .option('--dry-run', 'Render and summarize without writing the snapshot')
    .action(async (options: SeoSiteRenderCliOptions) => {
      await runSeoCommand(options, seoSiteRender);
    });
}

function collectValue(value: string, previous: string[]): string[] {
  return [...previous, value];
}
