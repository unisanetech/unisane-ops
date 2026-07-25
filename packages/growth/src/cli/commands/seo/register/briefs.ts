import type { Command } from 'commander';
import { seoBriefsGenerate, type SeoBriefGenerateCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoBriefCommands(seo: Command): void {
  const briefs = seo.command('briefs').description('SEO content brief commands');

  addSharedSeoOptions(
    briefs.command('generate').description('Generate content briefs from opportunities'),
  )
    .requiredOption('--opportunities <path>', 'Page opportunity JSON file')
    .requiredOption('--out-dir <path>', 'Directory for generated Markdown briefs')
    .option('--status <status>', 'Opportunity status filter', 'all')
    .option('--dry-run', 'Preview brief generation without writing')
    .action(async (options: SeoBriefGenerateCliOptions) => {
      await runSeoCommand(options, seoBriefsGenerate);
    });
}
