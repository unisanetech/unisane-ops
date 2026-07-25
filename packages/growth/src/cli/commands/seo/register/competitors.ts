import type { Command } from 'commander';
import {
  seoCompetitorsFetch,
  seoCompetitorsImport,
  seoCompetitorsReport,
  type SeoCompetitorFetchCliOptions,
  type SeoCompetitorImportCliOptions,
  type SeoCompetitorReportCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoCompetitorCommands(seo: Command): void {
  const competitors = seo
    .command('competitors')
    .description('SERP and competitor research commands');

  addSharedSeoOptions(
    competitors.command('import').description('Import structured SERP and competitor metadata'),
  )
    .requiredOption('--input <path>', 'CSV file containing competitor page metadata')
    .requiredOption('--out <path>', 'Competitor research JSON output path')
    .option('--market <market>', 'Market label for the competitor set')
    .option(
      '--source <source>',
      'Competitor source: manual, csv-import, serp-export, sitemap, local-html',
    )
    .option('--dry-run', 'Preview competitor import without writing')
    .action(async (options: SeoCompetitorImportCliOptions) => {
      await runSeoCommand(options, seoCompetitorsImport);
    });

  addSharedSeoOptions(
    competitors.command('fetch').description('Fetch URL metadata into competitor research'),
  )
    .requiredOption('--input <path>', 'Text or CSV file containing competitor URLs')
    .requiredOption('--out <path>', 'Competitor research JSON output path')
    .option('--market <market>', 'Market label for the competitor set')
    .option('--timeout-ms <milliseconds>', 'Per-page fetch timeout')
    .option('--user-agent <value>', 'User agent for metadata requests')
    .option('--max-pages <count>', 'Maximum URLs to fetch from the input')
    .option('--dry-run', 'Preview competitor URL fetch without writing')
    .action(async (options: SeoCompetitorFetchCliOptions) => {
      await runSeoCommand(options, seoCompetitorsFetch);
    });

  addSharedSeoOptions(
    competitors.command('report').description('Generate a competitor research report'),
  )
    .requiredOption('--competitors <path>', 'Competitor research JSON file')
    .requiredOption('--out <path>', 'Markdown report output path')
    .option('--dry-run', 'Preview competitor report without writing')
    .action(async (options: SeoCompetitorReportCliOptions) => {
      await runSeoCommand(options, seoCompetitorsReport);
    });
}
