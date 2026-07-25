import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import type { FetchLike } from '../providers/api-pull-types.js';
import { ensurePathWithinCwd } from '../reports/paths.js';

export type MarketingMetaDiscoveryStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingMetaDiscoveryAccount = {
  id: string;
  accountId: string;
  displayName?: string;
  accountStatus?: string;
  currency?: string;
  timezoneName?: string;
  businessId?: string;
  businessName?: string;
};

export type MarketingMetaDiscoveryPixel = {
  id: string;
  name?: string;
  accountId?: string;
};

export type MarketingMetaAdAccountDiscovery = {
  status: MarketingMetaDiscoveryStatus;
  message: string;
  accountIdEnv?: string;
  accounts: MarketingMetaDiscoveryAccount[];
};

export type MarketingMetaPixelDiscovery = {
  status: MarketingMetaDiscoveryStatus;
  message: string;
  pixelIdEnv?: string;
  pixels: MarketingMetaDiscoveryPixel[];
};

export type MarketingMetaDiscoveryAction = {
  id: string;
  message: string;
};

export type MarketingMetaDiscoveryReport = {
  kind: 'unisane.marketing.meta-discovery';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  adAccounts: MarketingMetaAdAccountDiscovery;
  pixels: MarketingMetaPixelDiscovery;
  nextActions: MarketingMetaDiscoveryAction[];
};

export type MarketingMetaDiscoveryOptions = {
  accessToken: string;
  accountId?: string;
  fetch?: FetchLike;
  apiVersion?: string;
  maxPages?: number;
  pageSize?: number;
  now?: Date;
};

export type MarketingMetaDiscoveryWriteOptions = MarketingMetaDiscoveryOptions & {
  cwd?: string;
  out?: string;
};

export type MarketingMetaDiscoveryDriver = (
  config: MarketingConfig,
  options: MarketingMetaDiscoveryOptions,
) => Promise<MarketingMetaDiscoveryReport>;

export async function discoverMarketingMetaAccounts(
  config: MarketingConfig,
  options: MarketingMetaDiscoveryOptions & { driver?: MarketingMetaDiscoveryDriver },
): Promise<MarketingMetaDiscoveryReport> {
  if (!options.driver) {
    throw new Error(
      '[MARKETING_META_DISCOVERY_DRIVER_REQUIRED] Meta discovery requires an injected provider driver.',
    );
  }
  return options.driver(config, options);
}

export async function writeMarketingMetaDiscovery(
  config: MarketingConfig,
  options: MarketingMetaDiscoveryWriteOptions & { driver?: MarketingMetaDiscoveryDriver },
): Promise<MarketingMetaDiscoveryReport & { path: string }> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const out = path.resolve(
    cwd,
    options.out ?? path.join('.unisane', 'marketing', 'setup', 'meta-discovery.json'),
  );
  ensurePathWithinCwd(cwd, out);
  const report = await discoverMarketingMetaAccounts(config, options);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ...report, path: out };
}
