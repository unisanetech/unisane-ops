import type { Command } from 'commander';
import { seoInternalLinksPlan, type SeoInternalLinksPlanCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoInternalLinkCommands(seo: Command): void {
  const internalLinks = seo
    .command('internal-links')
    .description('SEO internal linking planner commands');

  addSharedSeoOptions(
    internalLinks.command('plan').description('Plan internal links across page opportunities'),
  )
    .requiredOption('--opportunities <path>', 'Page opportunity JSON file')
    .requiredOption('--out <path>', 'Internal link plan output path')
    .option('--hub-label <text>', 'Label for links back to the hub page')
    .option('--max-related <count>', 'Maximum related links per detail page', '3')
    .option('--include-conversion-links', 'Include CTA target links in the link graph')
    .option('--dry-run', 'Preview internal link plan without writing')
    .action(async (options: SeoInternalLinksPlanCliOptions) => {
      await runSeoCommand(options, seoInternalLinksPlan);
    });
}
