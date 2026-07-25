import type { Command } from 'commander';
import { seoReportsGenerate, type SeoReportGenerateCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoReportCommands(seo: Command): void {
  const reports = seo.command('reports').description('SEO research report commands');

  addSharedSeoOptions(reports.command('generate').description('Generate an SEO research report'))
    .requiredOption('--opportunities <path>', 'Page opportunity JSON file')
    .requiredOption('--out <path>', 'Markdown report output path')
    .option('--internal-links <path>', 'Internal link plan JSON file')
    .option('--dry-run', 'Preview report generation without writing')
    .action(async (options: SeoReportGenerateCliOptions) => {
      await runSeoCommand(options, seoReportsGenerate);
    });
}
