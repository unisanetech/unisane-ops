import type { Command } from 'commander';
import { seoPagesInventory, type SeoPagesInventoryCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoPageCommands(seo: Command): void {
  const pages = seo.command('pages').description('Unified first-party page evidence commands');

  addSharedSeoOptions(
    pages.command('inventory').description('Reconcile crawl, search, and Analytics page evidence'),
  )
    .option('--crawl <path>', 'Site crawl snapshot (defaults to the SEO workspace)')
    .option(
      '--render <path>',
      'Browser-render evidence (defaults to the SEO workspace when present)',
    )
    .option('--search-console <path>', 'Search Console performance evidence')
    .option('--ga4 <path>', 'GA4 performance evidence')
    .option('--out <path>', 'Page evidence output path (defaults to the SEO workspace)')
    .option('--dry-run', 'Build and summarize without writing the artifact')
    .action(async (options: SeoPagesInventoryCliOptions) => {
      await runSeoCommand(options, seoPagesInventory);
    });
}
