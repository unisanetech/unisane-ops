import type { Command } from 'commander';
import { registerAdsCommands } from './commands/ads/register.js';
import { registerMarketingCommands } from './commands/marketing/register.js';
import { registerSeoCommands } from './commands/seo/register.js';
import { registerGoogleTagManagerCommands } from './commands/gtm/register.js';

function registerFamilies(parent: Command): void {
  registerSeoCommands(parent);
  registerMarketingCommands(parent);
  registerAdsCommands(parent);
  registerGoogleTagManagerCommands(parent);
}

export function registerGrowthCommands(program: Command): void {
  const growth = program
    .command('growth')
    .description('Analytics, acquisition, SEO, conversion, and growth operations');
  registerFamilies(growth);
}

export {
  registerAdsCommands,
  registerMarketingCommands,
  registerSeoCommands,
  registerGoogleTagManagerCommands,
};
export * from './commands/gtm/commands.js';
