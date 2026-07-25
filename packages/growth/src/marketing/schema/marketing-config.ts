import { z } from 'zod';

export const marketingProviderStateSchema = z.enum(['disabled', 'planned', 'configured']);

export const marketingEnvRefSchema = z.object({
  env: z.string().min(1),
  required: z.boolean().default(false),
});

export const marketingEnvironmentSchema = z.object({
  production: z.boolean().default(false),
  publicBaseUrl: z.string().url().optional(),
  gtmContainerId: z.string().min(1).optional(),
  ga4PropertyId: z.string().min(1).optional(),
  googleAdsCustomerIdEnv: z.string().min(1).optional(),
  metaAdAccountIdEnv: z.string().min(1).optional(),
});

export const marketingProviderSchema = z.object({
  state: marketingProviderStateSchema.default('planned'),
  accountIdEnv: z.string().min(1).optional(),
  loginCustomerIdEnv: z.string().min(1).optional(),
  developerTokenEnv: z.string().min(1).optional(),
  googleSearchDefaults: z
    .object({
      targetGoogleSearch: z.boolean().default(true),
      targetSearchNetwork: z.boolean().default(false),
      targetContentNetwork: z.boolean().default(false),
      locationCriterionIds: z.array(z.string().min(1)).default(['2840']),
      languageCriterionIds: z.array(z.string().min(1)).default(['1000']),
      finalUrlSuffix: z.string().min(1).optional(),
      trackingUrlTemplate: z.string().min(1).optional(),
    })
    .default({}),
  pixelIdEnv: z.string().min(1).optional(),
  datasetIdEnv: z.string().min(1).optional(),
  pageIdEnv: z.string().min(1).optional(),
  instagramActorIdEnv: z.string().min(1).optional(),
  accessTokenEnv: z.string().min(1).optional(),
});

export const marketingAttributionStoreSchema = z
  .object({
    state: marketingProviderStateSchema.default('planned'),
    collectionName: z.string().min(1).optional(),
    ttlDays: z.number().int().positive().optional(),
    freshnessWarningDays: z.number().int().positive().default(7),
    setupCommand: z.string().min(1).optional(),
  })
  .default({});

export const marketingPathsSchema = z
  .object({
    gtmManifest: z.string().min(1).default('config/google-tag-manager.ts'),
    webTrackingConfig: z.string().min(1).default('config/web-tracking.ts'),
    webConversionsConfig: z.string().min(1).default('config/web-conversions.ts'),
    eventRegistry: z.string().min(1).default('docs/marketing/events.json'),
    conversionRegistry: z.string().min(1).default('docs/marketing/conversions.json'),
    sourceRoots: z.array(z.string().min(1)).default(['src']),
    seoRoot: z.string().min(1).default('docs/seo'),
    marketingRoot: z.string().min(1).default('docs/marketing'),
    analyticsRoot: z.string().min(1).default('docs/analytics'),
  })
  .default({});

export const marketingConfigSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  defaultEnvironment: z.string().min(1).default('production'),
  environments: z.record(marketingEnvironmentSchema).default({}),
  paths: marketingPathsSchema,
  providers: z
    .object({
      googleAds: marketingProviderSchema.default({}),
      metaAds: marketingProviderSchema.default({}),
      ga4: marketingProviderSchema.default({}),
      searchConsole: marketingProviderSchema.default({}),
    })
    .default({}),
  attributionStore: marketingAttributionStoreSchema,
  requiredEnv: z.array(marketingEnvRefSchema).default([]),
});

export type MarketingConfig = z.infer<typeof marketingConfigSchema>;
export type MarketingProviderState = z.infer<typeof marketingProviderStateSchema>;

export function defineMarketingConfig(config: MarketingConfig): MarketingConfig {
  return marketingConfigSchema.parse(config);
}
