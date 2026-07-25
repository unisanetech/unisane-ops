import type { Command } from 'commander';
import { seoTrendsImport, type SeoTrendImportCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoTrendCommands(seo: Command): void {
  const trends = seo
    .command('trends')
    .description('Google Trends and seasonality evidence commands');

  addSharedSeoOptions(trends.command('import').description('Import Google Trends CSV evidence'))
    .requiredOption('--input <path>', 'Google Trends CSV file')
    .requiredOption('--out <path>', 'Normalized trend signal output path')
    .option('--provider <provider>', 'Trend signal provider', 'google-trends')
    .option('--country <code>', 'Market country code')
    .option('--language <code>', 'Market language code')
    .option('--date-range <range>', 'Source report date range label')
    .option('--dry-run', 'Preview trend import without writing')
    .action(async (options: SeoTrendImportCliOptions) => {
      await runSeoCommand(options, seoTrendsImport);
    });
}
