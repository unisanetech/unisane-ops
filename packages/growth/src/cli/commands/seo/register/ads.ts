import type { Command } from 'commander';
import { seoAdsPlan, type SeoAdsPlanCliOptions } from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoAdsCommands(seo: Command): void {
  const ads = seo.command('ads').description('Paid acquisition planning bridge commands');

  addSharedSeoOptions(ads.command('plan').description('Plan ad groups from page opportunities'))
    .requiredOption('--opportunities <path>', 'Page opportunity JSON file')
    .requiredOption('--out <path>', 'Ads plan JSON output path')
    .option('--status <status>', 'Opportunity status filter', 'approved-or-built')
    .option('--max-keywords-per-ad-group <count>', 'Maximum source keywords per ad group', '12')
    .option('--dry-run', 'Preview ads plan without writing')
    .action(async (options: SeoAdsPlanCliOptions) => {
      await runSeoCommand(options, seoAdsPlan);
    });
}
