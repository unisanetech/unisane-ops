import type { Command } from 'commander';
import {
  seoPerformanceFetchGa4,
  seoPerformanceFetchSearchConsole,
  seoPerformanceImportGa4,
  seoPerformanceImportSearchConsole,
  seoPerformanceReport,
  type SeoPerformanceFetchGa4CliOptions,
  type SeoPerformanceFetchSearchConsoleCliOptions,
  type SeoPerformanceImportCliOptions,
  type SeoPerformanceReportCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoPerformanceCommands(seo: Command): void {
  const performance = seo
    .command('performance')
    .description('Organic and analytics feedback-loop commands');

  addSharedSeoOptions(
    performance
      .command('import-search-console')
      .description('Import Google Search Console performance CSV export'),
  )
    .requiredOption('--input <path>', 'Search Console CSV file')
    .requiredOption('--out <path>', 'Normalized SEO performance output path')
    .option('--property <property>', 'Search Console property label')
    .option('--date-range <range>', 'Source report date range label')
    .option('--dry-run', 'Preview performance import without writing')
    .action(async (options: SeoPerformanceImportCliOptions) => {
      await runSeoCommand(options, seoPerformanceImportSearchConsole);
    });

  addSharedSeoOptions(
    performance
      .command('fetch-ga4')
      .description('Fetch GA4 landing page performance through the Data API'),
  )
    .requiredOption('--start-date <date>', 'Start date in YYYY-MM-DD format')
    .requiredOption('--end-date <date>', 'End date in YYYY-MM-DD format')
    .requiredOption('--out <path>', 'Normalized SEO performance output path')
    .option('--dimensions <list>', 'Comma-separated GA4 dimensions', 'landingPagePlusQueryString')
    .option(
      '--metrics <list>',
      'Comma-separated GA4 metrics',
      'sessions,totalUsers,conversions,totalRevenue',
    )
    .option('--limit <count>', 'Maximum rows per GA4 API request')
    .option('--offset <offset>', 'Zero-based GA4 row offset')
    .option('--max-rows <count>', 'Maximum rows to fetch across pages')
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--environment <name>', 'Ops environment name')
    .option('--dry-run', 'Preview GA4 fetch without writing')
    .action(async (options: SeoPerformanceFetchGa4CliOptions) => {
      await runSeoCommand(options, seoPerformanceFetchGa4);
    });

  addSharedSeoOptions(
    performance
      .command('fetch-search-console')
      .description('Fetch Google Search Console performance through the API'),
  )
    .requiredOption('--start-date <date>', 'Start date in YYYY-MM-DD format')
    .requiredOption('--end-date <date>', 'End date in YYYY-MM-DD format')
    .requiredOption('--out <path>', 'Normalized SEO performance output path')
    .option('--dimensions <list>', 'Comma-separated Search Console dimensions', 'query,page')
    .option('--row-limit <count>', 'Maximum rows to fetch')
    .option('--start-row <offset>', 'Zero-based Search Console start row')
    .option('--max-rows <count>', 'Maximum rows to fetch across pages')
    .option('--search-type <type>', 'Search type: web, image, video, news, discover, googleNews')
    .option('--data-state <state>', 'Search Console data state, for example final or all')
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--environment <name>', 'Ops environment name')
    .option('--dry-run', 'Preview Search Console fetch without writing')
    .action(async (options: SeoPerformanceFetchSearchConsoleCliOptions) => {
      await runSeoCommand(options, seoPerformanceFetchSearchConsole);
    });

  addSharedSeoOptions(
    performance.command('import-ga4').description('Import GA4 landing page performance CSV export'),
  )
    .requiredOption('--input <path>', 'GA4 CSV file')
    .requiredOption('--out <path>', 'Normalized SEO performance output path')
    .option('--property <property>', 'GA4 property label')
    .option('--date-range <range>', 'Source report date range label')
    .option('--dry-run', 'Preview performance import without writing')
    .action(async (options: SeoPerformanceImportCliOptions) => {
      await runSeoCommand(options, seoPerformanceImportGa4);
    });

  addSharedSeoOptions(performance.command('report').description('Generate SEO feedback report'))
    .requiredOption('--out <path>', 'Markdown performance report output path')
    .option('--search-console <path>', 'Normalized Search Console performance JSON file')
    .option('--ga4 <path>', 'Normalized GA4 performance JSON file')
    .option('--opportunities <path>', 'Page opportunity JSON file')
    .option('--dry-run', 'Preview performance report without writing')
    .action(async (options: SeoPerformanceReportCliOptions) => {
      await runSeoCommand(options, seoPerformanceReport);
    });
}
