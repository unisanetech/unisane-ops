import type { Command } from 'commander';
import {
  seoKeywordsCluster,
  seoKeywordsExpand,
  seoKeywordsFetchGoogleAds,
  seoKeywordsImportMetrics,
  seoKeywordsInit,
  type SeoCliOptions,
  type SeoKeywordClusterCliOptions,
  type SeoKeywordExpandCliOptions,
  type SeoKeywordFetchGoogleAdsCliOptions,
  type SeoKeywordImportMetricsCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoKeywordCommands(seo: Command): void {
  const keywords = seo.command('keywords').description('Keyword research workflow commands');

  addSharedSeoOptions(
    keywords.command('init').description('Initialize a platform SEO research workspace'),
  )
    .option('--force', 'Overwrite existing research config/template files')
    .option('--dry-run', 'Preview files without writing')
    .action(async (options: SeoCliOptions) => {
      await runSeoCommand(options, seoKeywordsInit);
    });

  addSharedSeoOptions(
    keywords.command('expand').description('Expand seed keywords through a pattern pack'),
  )
    .requiredOption('--input <path>', 'Seed JSON file to expand')
    .requiredOption('--out <path>', 'Expanded keyword candidate output path')
    .option('--pattern <id>', 'Keyword pattern pack id')
    .option('--dry-run', 'Preview expansion without writing')
    .action(async (options: SeoKeywordExpandCliOptions) => {
      await runSeoCommand(options, seoKeywordsExpand);
    });

  addSharedSeoOptions(
    keywords.command('import-metrics').description('Import keyword metrics from a CSV file'),
  )
    .requiredOption('--input <path>', 'CSV file containing keyword metrics')
    .requiredOption('--out <path>', 'Normalized keyword metric output path')
    .option('--country <code>', 'Metric country code')
    .option('--language <code>', 'Metric language code')
    .option('--provider <id>', 'Metric provider id', 'csv-import')
    .option('--dry-run', 'Preview import without writing')
    .action(async (options: SeoKeywordImportMetricsCliOptions) => {
      await runSeoCommand(options, seoKeywordsImportMetrics);
    });

  addSharedSeoOptions(
    keywords
      .command('fetch-google-ads')
      .description('Fetch keyword idea metrics from Google Ads Keyword Planner'),
  )
    .requiredOption('--out <path>', 'Normalized keyword metric output path')
    .option('--candidates <path>', 'Expanded keyword candidate JSON file')
    .option('--seed-file <path>', 'Keyword seed JSON file with a seeds array')
    .option('--keywords <terms>', 'Comma-separated keyword seed list')
    .option('--page-url <url>', 'Optional page URL seed')
    .option('--country <code>', 'Metric country code')
    .option('--language <code>', 'Metric language code')
    .option('--language-id <id>', 'Google Ads language criterion id', '1000')
    .option('--location-ids <ids>', 'Comma-separated Google Ads geo target ids', '2840')
    .option('--currency-code <code>', 'Google Ads account currency code for bid micros display')
    .option('--cluster-id <id>', 'Planning cluster id for this fetch')
    .option('--campaign-intent <text>', 'Planning intent label for this fetch')
    .option(
      '--require-term-groups <groups>',
      'Semicolon-separated OR groups; every group must match, e.g. "resume|cv;example|sample"',
    )
    .option('--exclude-terms <terms>', 'Comma-separated terms; drop ideas containing any term')
    .option('--page-size <count>', 'Google Ads result page size', '1000')
    .option(
      '--auth-profile <name>',
      'Saved marketing/google auth profile; defaults to --platform when available',
    )
    .option(
      '--access-token-env <name>',
      'Environment variable containing a Google Ads access token',
    )
    .option('--dry-run', 'Preview Google Ads import without writing')
    .action(async (options: SeoKeywordFetchGoogleAdsCliOptions) => {
      await runSeoCommand(options, seoKeywordsFetchGoogleAds);
    });

  addSharedSeoOptions(
    keywords.command('cluster').description('Group keyword candidates into page opportunities'),
  )
    .requiredOption('--candidates <path>', 'Expanded keyword candidate JSON file')
    .requiredOption('--out <path>', 'Keyword cluster output path')
    .option('--metrics <path>', 'Normalized keyword metrics JSON file')
    .option('--page-type <type>', 'Override inferred cluster page type')
    .option('--dry-run', 'Preview clustering without writing')
    .action(async (options: SeoKeywordClusterCliOptions) => {
      await runSeoCommand(options, seoKeywordsCluster);
    });
}
