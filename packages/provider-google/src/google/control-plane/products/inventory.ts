import {
  createControlPlaneInventoryArtifact,
  providerArtifactRelativePath,
  resolveControlPlaneProviderContext,
} from '@unisane/ops-engine';
import {
  listGoogleAdsAccessibleCustomers,
  listGoogleAnalyticsProperties,
  listGoogleSearchConsoleSites,
  listGoogleTagManagerAccounts,
  listGoogleTagManagerContainers,
  type GoogleControlPlaneFetch,
} from '../client.js';
import {
  googleControlPlaneStamp,
  googleProviderAccessToken,
  googleProviderFetchFromOptions,
  writeGoogleProviderArtifact,
} from '../shared/runtime.js';
import {
  GOOGLE_PRODUCT_DISCOVERY_SCOPES,
  GOOGLE_TAG_MANAGER_READONLY_SCOPE,
  type GoogleProviderCliOptions,
  type GoogleProviderInventoryResource,
  type GoogleProviderProductsInventoryArtifact,
} from '../shared/types.js';

async function collectProductResources(args: {
  product: string;
  run: () => Promise<GoogleProviderInventoryResource[]>;
}): Promise<{ resources: GoogleProviderInventoryResource[]; warnings: string[] }> {
  try {
    return { resources: await args.run(), warnings: [] };
  } catch (error) {
    return {
      resources: [],
      warnings: [
        `${args.product} discovery failed: ${
          error instanceof Error ? error.message : 'Unknown provider error.'
        }`,
      ],
    };
  }
}

export async function buildGoogleProductsInventory(
  options: GoogleProviderCliOptions,
  deps?: { fetch?: GoogleControlPlaneFetch; env?: Record<string, string | undefined> },
): Promise<GoogleProviderProductsInventoryArtifact> {
  const context = resolveControlPlaneProviderContext({
    cwd: options.cwd,
    appId: options.app,
    provider: 'google',
    environment: options.env,
    configPath: options.config,
    profile: options.profile,
  });
  const cwd = context.cwd;
  const env = deps?.env ?? process.env;
  const developerTokenEnv = options.developerTokenEnv ?? 'GOOGLE_ADS_DEVELOPER_TOKEN';
  const developerToken = env[developerTokenEnv]?.trim();
  const accessToken = await googleProviderAccessToken(options, GOOGLE_TAG_MANAGER_READONLY_SCOPE);
  const providerFetch = googleProviderFetchFromOptions(options, deps?.fetch);
  const [gtm, ga4, searchConsole, googleAds] = await Promise.all([
    collectProductResources({
      product: 'GTM',
      run: async () => {
        const accounts = await listGoogleTagManagerAccounts({
          accessToken,
          fetch: providerFetch,
        });
        const containers = (
          await Promise.all(
            accounts.slice(0, 20).map((account) =>
              listGoogleTagManagerContainers({
                accessToken,
                accountId: account.accountId,
                fetch: providerFetch,
              }),
            ),
          )
        ).flat();
        return [
          ...accounts.map(
            (account): GoogleProviderInventoryResource => ({
              type: 'gtmAccount',
              id: account.accountId,
              title: account.name,
              state: 'accessible',
              metadata: account.path ? { path: account.path } : undefined,
            }),
          ),
          ...containers.map(
            (container): GoogleProviderInventoryResource => ({
              type: 'gtmContainer',
              id: container.containerId,
              parentId: container.accountId,
              title: container.name,
              state: 'accessible',
              metadata: {
                ...(container.publicId ? { publicId: container.publicId } : {}),
                ...(container.path ? { path: container.path } : {}),
              },
            }),
          ),
        ];
      },
    }),
    collectProductResources({
      product: 'GA4',
      run: async () =>
        (
          await listGoogleAnalyticsProperties({
            accessToken,
            fetch: providerFetch,
          })
        ).map(
          (property): GoogleProviderInventoryResource => ({
            type: 'ga4Property',
            id: property.propertyId,
            parentId: property.account,
            title: property.displayName,
            state: 'accessible',
            metadata: {
              property: property.property,
              ...(property.accountDisplayName
                ? { accountDisplayName: property.accountDisplayName }
                : {}),
            },
          }),
        ),
    }),
    collectProductResources({
      product: 'Search Console',
      run: async () =>
        (
          await listGoogleSearchConsoleSites({
            accessToken,
            fetch: providerFetch,
          })
        ).map(
          (site): GoogleProviderInventoryResource => ({
            type: 'searchConsoleSite',
            id: site.siteUrl,
            title: site.siteUrl,
            state: site.permissionLevel ?? 'accessible',
          }),
        ),
    }),
    collectProductResources({
      product: 'Google Ads',
      run: async () => {
        if (!developerToken) {
          return [
            {
              type: 'googleAdsDeveloperToken',
              id: developerTokenEnv,
              state: 'missing',
              reason:
                'Google Ads customer discovery needs a developer token; approval remains provider-side.',
            },
          ];
        }
        return (
          await listGoogleAdsAccessibleCustomers({
            accessToken,
            developerToken,
            apiVersion: options.apiVersion,
            fetch: providerFetch,
          })
        ).map(
          (customer): GoogleProviderInventoryResource => ({
            type: 'googleAdsCustomer',
            id: customer.customerId,
            title: customer.resourceName,
            state: 'accessible',
          }),
        );
      },
    }),
  ]);
  const inventory = {
    ...createControlPlaneInventoryArtifact({
      provider: 'google',
      appId: context.appId,
      environment: context.environment,
      generatedAt: context.generatedAt,
      configPath: context.configPath,
      profile: context.profile,
      resources: [
        ...gtm.resources,
        ...ga4.resources,
        ...searchConsole.resources,
        ...googleAds.resources,
      ],
      warnings: [
        ...gtm.warnings,
        ...ga4.warnings,
        ...searchConsole.warnings,
        ...googleAds.warnings,
      ],
    }),
    requiredScopes: GOOGLE_PRODUCT_DISCOVERY_SCOPES,
    developerTokenEnv,
  };
  if (!options.output) return inventory;
  return writeGoogleProviderArtifact({
    cwd,
    outputPath: options.output,
    defaultRelativePath: providerArtifactRelativePath({
      provider: 'google',
      environment: context.environment,
      lane: 'inventory',
      family: 'products',
      filename: `google-products-inventory-${googleControlPlaneStamp()}.json`,
    }),
    value: inventory,
  });
}
