import type { Command } from 'commander';
import { registerAdsCommands } from './commands/ads/register.js';
import { registerAnalyticsCommands } from './commands/analytics/register.js';
import { registerMarketingCommands } from './commands/marketing/register.js';
import { registerSeoCommands } from './commands/seo/register.js';
import { registerGoogleTagManagerCommands } from './commands/gtm/register.js';

function registerFamilies(parent: Command): void {
  registerSeoCommands(parent);
  registerMarketingCommands(parent);
  registerAdsCommands(parent);
  registerAnalyticsCommands(parent);
  registerGoogleTagManagerCommands(parent);
}

export function registerGrowthCommands(program: Command): void {
  const growth = program
    .command('growth')
    .description('Analytics, acquisition, SEO, conversion, and growth operations');
  registerFamilies(growth);
}

export function registerGrowthCompatibilityCommands(program: Command): void {
  registerFamilies(program);
}

export {
  registerAdsCommands,
  registerAnalyticsCommands,
  registerMarketingCommands,
  registerSeoCommands,
  registerGoogleTagManagerCommands,
};
export * from './commands/gtm/auth.js';
export * from './commands/gtm/commands.js';
export {
  deleteMarketingMetaAuthProfile,
  getMarketingMetaAuthStatus,
  logoutMarketingMetaAuthCommand,
  marketingMetaAuthEnvEntries,
  marketingMetaAuthStatusToControlPlaneProfile,
  resolveMarketingMetaAccessToken,
  saveMarketingMetaAuthProfile,
  saveMarketingMetaAuthCommand,
  statusMarketingMetaAuthCommand,
  tokenMarketingMetaAuthCommand,
} from './commands/marketing/auth/meta.js';
export type {
  MarketingMetaAuthCliOptions,
  MarketingMetaAuthRuntimeOptions,
} from './commands/marketing/auth/meta.js';
export {
  resolveMarketingGoogleProfile,
  resolveMarketingMetaProfile,
  withDefaultMarketingMetaAuthProfile,
} from './commands/marketing/profile-defaults.js';
