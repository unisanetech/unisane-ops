import path from 'node:path';
import {
  createControlPlaneInventoryArtifact,
  providerArtifactRelativePath,
  resolveControlPlaneProviderContext,
} from '@unisane/ops-engine';
import { loadMarketingConfig } from '@unisane/growth/marketing';
import type { FetchLike } from '@unisane/growth/marketing';
import { resolveMarketingMetaAccessToken } from '../../../meta/auth.js';
import {
  collectMetaSocialInventory,
  discoverMarketingMetaAccounts,
} from '../../../meta/marketing/index.js';
import { resolveMarketingMetaProfile } from '../../profile.js';
import {
  metaAuthRuntimeFromOptions,
  metaControlPlaneStamp,
  parseMetaPositiveInt,
  writeMetaProviderArtifact,
} from '../shared/runtime.js';
import type {
  MetaProviderCliOptions,
  MetaProviderInventoryArtifact,
  MetaProviderInventoryResource,
} from '../shared/types.js';

export async function buildMetaAdsInventory(
  options: MetaProviderCliOptions,
  deps?: { fetch?: FetchLike; env?: Record<string, string | undefined>; includePixels?: boolean },
): Promise<MetaProviderInventoryArtifact> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const loaded = await loadMarketingConfig({ cwd, configPath: options.config });
  const appId = options.app?.trim() || loaded.config.appId;
  const environment = options.env ?? loaded.config.defaultEnvironment;
  const profile = options.profile ?? resolveMarketingMetaProfile(loaded.config, {});
  const accessToken = await resolveMarketingMetaAccessToken({
    accessTokenEnv: options.accessTokenEnv,
    authProfile: profile,
    runtime: metaAuthRuntimeFromOptions(options),
  });
  const accountId =
    options.accountId ??
    (loaded.config.providers.metaAds.accountIdEnv
      ? (deps?.env ?? process.env)[loaded.config.providers.metaAds.accountIdEnv]
      : undefined);
  const fetcher = deps?.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v25.0';
  const maxPages = parseMetaPositiveInt(options.maxPages, 10);
  const pageSize = parseMetaPositiveInt(options.pageSize, 100);
  const report = await discoverMarketingMetaAccounts(loaded.config, {
    accessToken,
    accountId,
    fetch: fetcher,
    apiVersion,
    maxPages,
    pageSize,
  });
  const socialInventory = await collectMetaSocialInventory({
    accessToken,
    fetch: fetcher,
    apiVersion,
    maxPages,
    pageSize,
  });
  const context = resolveControlPlaneProviderContext({
    cwd,
    appId,
    provider: 'meta',
    environment,
    configPath: loaded.path,
    profile,
  });
  const resources: MetaProviderInventoryResource[] = [
    ...report.adAccounts.accounts.map((account) => ({
      type: 'adAccount' as const,
      id: account.accountId,
      title: account.displayName,
      state: account.accountStatus ?? 'accessible',
      metadata: {
        ...(account.currency ? { currency: account.currency } : {}),
        ...(account.timezoneName ? { timezoneName: account.timezoneName } : {}),
        ...(account.businessId ? { businessId: account.businessId } : {}),
        ...(account.businessName ? { businessName: account.businessName } : {}),
      },
    })),
    ...((deps?.includePixels ?? true)
      ? report.pixels.pixels.map((pixel) => ({
          type: 'pixel' as const,
          id: pixel.id,
          title: pixel.name,
          parentId: pixel.accountId,
          state: 'accessible',
        }))
      : []),
    ...socialInventory.resources,
  ];
  const inventory = {
    ...createControlPlaneInventoryArtifact({
      provider: 'meta',
      appId: context.appId,
      environment: context.environment,
      generatedAt: context.generatedAt,
      configPath: context.configPath,
      profile: context.profile,
      resources,
      warnings: [
        ...(report.ok ? [] : [report.adAccounts.message, report.pixels.message]),
        ...socialInventory.warnings,
      ],
    }),
    source: 'meta-discovery' as const,
  };
  if (!options.output) return inventory;
  return writeMetaProviderArtifact({
    cwd,
    outputPath: options.output,
    defaultRelativePath: providerArtifactRelativePath({
      provider: 'meta',
      environment,
      lane: 'inventory',
      family: deps?.includePixels === false ? 'ads' : 'ads-and-pixels',
      filename: `meta-inventory-${metaControlPlaneStamp()}.json`,
    }),
    value: inventory,
  });
}
