import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FetchLike } from '../providers/api-pull-types.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import type { MarketingConfig } from '../schema/marketing-config.js';

export type MarketingGoogleDiscoveryStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingGoogleAdsDiscovery = {
  status: MarketingGoogleDiscoveryStatus;
  message: string;
  developerTokenEnv?: string;
  customerResourceNames: string[];
  customerIds: string[];
};

export type MarketingGa4DiscoveryProperty = {
  account: string;
  accountDisplayName?: string;
  property: string;
  propertyId: string;
  displayName?: string;
};

export type MarketingGa4Discovery = {
  status: MarketingGoogleDiscoveryStatus;
  message: string;
  properties: MarketingGa4DiscoveryProperty[];
};

export type MarketingSearchConsoleDiscoverySite = {
  siteUrl: string;
  permissionLevel?: string;
};

export type MarketingSearchConsoleDiscovery = {
  status: MarketingGoogleDiscoveryStatus;
  message: string;
  sites: MarketingSearchConsoleDiscoverySite[];
};

export type MarketingGoogleDiscoveryAction = {
  id: string;
  message: string;
};

export type MarketingGoogleDiscoveryReport = {
  kind: 'unisane.marketing.google-discovery';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  googleAds: MarketingGoogleAdsDiscovery;
  ga4: MarketingGa4Discovery;
  searchConsole: MarketingSearchConsoleDiscovery;
  nextActions: MarketingGoogleDiscoveryAction[];
};

export type MarketingGoogleDiscoveryOptions = {
  accessToken: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  apiVersion?: string;
  now?: Date;
};

export type MarketingGoogleDiscoveryWriteOptions = MarketingGoogleDiscoveryOptions & {
  cwd?: string;
  out?: string;
};

export type MarketingGoogleDiscoveryDriver = (
  config: MarketingConfig,
  options: MarketingGoogleDiscoveryOptions,
) => Promise<MarketingGoogleDiscoveryReport>;

export async function discoverMarketingGoogleAccounts(
  config: MarketingConfig,
  options: MarketingGoogleDiscoveryOptions & { driver?: MarketingGoogleDiscoveryDriver },
): Promise<MarketingGoogleDiscoveryReport> {
  if (!options.driver) {
    throw new Error(
      '[MARKETING_GOOGLE_DISCOVERY_DRIVER_REQUIRED] Google discovery requires an injected provider driver.',
    );
  }
  return options.driver(config, options);
}

export async function writeMarketingGoogleDiscovery(
  config: MarketingConfig,
  options: MarketingGoogleDiscoveryWriteOptions & { driver?: MarketingGoogleDiscoveryDriver },
): Promise<MarketingGoogleDiscoveryReport & { path: string }> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const out = path.resolve(
    cwd,
    options.out ?? path.join('.unisane', 'marketing', 'setup', 'google-discovery.json'),
  );
  ensurePathWithinCwd(cwd, out);
  const report = await discoverMarketingGoogleAccounts(config, options);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ...report, path: out };
}
