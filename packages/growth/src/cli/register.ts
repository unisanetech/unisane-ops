import type { Command } from 'commander';
import { registerAdsCommands } from './commands/ads/register.js';
import { registerMarketingCommands } from './commands/marketing/register.js';
import { registerMeasurementCommands } from './commands/measurement/register.js';
import { registerSeoCommands } from './commands/seo/register.js';
import { registerGoogleTagManagerCommands } from './commands/gtm/register.js';
import { registerHealthCommands } from './commands/health/register.js';
import { registerCampaignCommands } from './commands/campaign/register.js';

function registerFamilies(parent: Command): void {
  registerSeoCommands(parent);
  registerMarketingCommands(parent);
  registerAdsCommands(parent);
  registerGoogleTagManagerCommands(parent);
  registerMeasurementCommands(parent);
  registerHealthCommands(parent);
  registerCampaignCommands(parent);
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
  registerMeasurementCommands,
  registerHealthCommands,
  registerCampaignCommands,
};
export * from './commands/gtm/commands.js';
