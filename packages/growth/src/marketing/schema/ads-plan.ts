import { z } from 'zod';
import { marketingReportProviderSchema, marketingReportMetricsSchema } from './report.js';
import { marketingCreativeAssetSchema } from './ads-creative.js';

export const marketingAdsPlanProviderSchema = z.enum(['googleAds', 'metaAds']);

export const marketingAdsPlanStatusSchema = z.enum(['draft', 'reviewed', 'approved']);

export const marketingAdsPlanActionTypeSchema = z.enum([
  'validate_account_settings',
  'create_campaign',
  'create_ad_group',
  'create_ad_set',
  'create_ad_creative',
  'create_ad',
  'create_responsive_search_ad',
  'add_keywords',
  'add_negative_keywords',
  'configure_campaign_settings',
  'set_budget_guardrail',
  'set_bid_strategy',
  'decrease_budget',
  'pause_campaign',
  'archive_campaign',
  'prepare_creative',
  'validate_conversion_mapping',
  'validate_landing_page',
  'hold',
]);

export const marketingAdsPlanRiskSchema = z.enum(['low', 'medium', 'high']);

export const marketingAdsPlanKeywordSchema = z.object({
  text: z.string().min(1),
  matchType: z.enum(['exact', 'phrase', 'broad']).default('phrase'),
  source: z
    .enum(['strategy-map', 'seo-ads-plan', 'search-console', 'manual'])
    .default('strategy-map'),
});

export const marketingAdsPlanNegativeKeywordSchema = z.object({
  text: z.string().min(1),
  reason: z.string().min(1),
});

export const marketingAdsPlanUtmSchema = z.object({
  source: z.string().min(1),
  medium: z.string().min(1),
  campaign: z.string().min(1),
  content: z.string().min(1).optional(),
  term: z.string().min(1).optional(),
  finalUrl: z.string().min(1).optional(),
});

export const marketingAdsPlanBudgetGuardrailSchema = z.object({
  currency: z.string().min(3).max(3).default('USD'),
  dailyBudgetAmount: z.number().positive().optional(),
  budgetIncreaseRequiresApproval: z.literal(true),
  campaignEnableRequiresApproval: z.literal(true),
  status: z.enum(['needs_budget_review', 'reviewable']).default('needs_budget_review'),
  message: z.string().min(1),
});

export const marketingAdsPlanBidStrategySchema = z.object({
  type: z.enum(['manual_cpc', 'maximize_conversions', 'lowest_cost']),
  requiresApproval: z.literal(true),
  message: z.string().min(1),
});

export const marketingGoogleAdsSearchSettingsSchema = z.object({
  targetGoogleSearch: z.literal(true),
  targetSearchNetwork: z.boolean(),
  targetContentNetwork: z.boolean(),
  locationCriterionIds: z.array(z.string().min(1)).default([]),
  languageCriterionIds: z.array(z.string().min(1)).default([]),
  finalUrlSuffix: z.string().min(1).optional(),
  trackingUrlTemplate: z.string().min(1).optional(),
  accountPreferencesRequired: z.object({
    autoTaggingEnabled: z.literal(true),
    conversionTrackingReady: z.literal(true),
    currencyCodeReviewed: z.literal(true),
    timeZoneReviewed: z.literal(true),
  }),
});

export const marketingGoogleAdsSearchKeywordBuildoutSchema = z.object({
  text: z.string().min(1),
  matchType: z.enum(['EXACT', 'PHRASE', 'BROAD']),
});

export const marketingGoogleAdsResponsiveSearchAdBuildoutSchema = z.object({
  path1: z.string().min(1).max(15).optional(),
  path2: z.string().min(1).max(15).optional(),
  headlines: z.array(z.string().min(1).max(30)).min(3).max(15),
  descriptions: z.array(z.string().min(1).max(90)).min(2).max(4),
});

export const marketingGoogleAdsSearchAdGroupBuildoutSchema = z.object({
  name: z.string().min(1).max(255),
  landingPageUrl: z.string().min(1),
  intent: z.string().min(1).optional(),
  cpcBidMicros: z.number().int().positive().optional(),
  keywords: z.array(marketingGoogleAdsSearchKeywordBuildoutSchema).min(1),
  responsiveSearchAd: marketingGoogleAdsResponsiveSearchAdBuildoutSchema,
});

export const marketingGoogleAdsSitelinkBuildoutSchema = z.object({
  text: z.string().min(1).max(25),
  url: z.string().min(1),
  description1: z.string().min(1).max(35).optional(),
  description2: z.string().min(1).max(35).optional(),
});

export const marketingGoogleAdsStructuredSnippetBuildoutSchema = z.object({
  header: z.string().min(1),
  values: z.array(z.string().min(1).max(25)).min(3).max(10),
});

export const marketingGoogleAdsSearchBuildoutSchema = z.object({
  finalUrlOrigin: z.string().url().optional(),
  campaignNegativeKeywords: z.array(z.string().min(1)).default([]),
  adGroups: z.array(marketingGoogleAdsSearchAdGroupBuildoutSchema).default([]),
  assets: z
    .object({
      sitelinks: z.array(marketingGoogleAdsSitelinkBuildoutSchema).default([]),
      callouts: z.array(z.string().min(1).max(25)).default([]),
      structuredSnippets: z.array(marketingGoogleAdsStructuredSnippetBuildoutSchema).default([]),
    })
    .default({}),
});

export const marketingMetaAdsPlacementTargetingSchema = z.object({
  publisherPlatforms: z.array(z.enum(['facebook', 'instagram'])).default([]),
  facebookPositions: z.array(z.enum(['feed', 'story', 'facebook_reels'])).default([]),
  instagramPositions: z.array(z.enum(['stream', 'story', 'reels'])).default([]),
});

export const marketingMetaAdsCreativeBuildoutSchema = z.object({
  name: z.string().min(1).max(255),
  assetType: z.enum(['image', 'video']),
  providerAssetId: z.string().min(1),
  primaryText: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().min(1).optional(),
  callToActionType: z.string().min(1).default('LEARN_MORE'),
  urlTags: z.string().min(1).optional(),
});

export const marketingMetaAdsBuildoutSchema = z.object({
  finalUrlOrigin: z.string().url().optional(),
  destinationUrl: z.string().min(1),
  campaignName: z.string().min(1).max(255).optional(),
  adSetName: z.string().min(1).max(255),
  adName: z.string().min(1).max(255),
  objective: z.string().min(1).default('OUTCOME_SALES'),
  status: z.enum(['PAUSED']).default('PAUSED'),
  specialAdCategories: z.array(z.string()).default([]),
  optimizationGoal: z.string().min(1).default('OFFSITE_CONVERSIONS'),
  billingEvent: z.string().min(1).default('IMPRESSIONS'),
  bidStrategy: z.string().min(1).default('LOWEST_COST_WITHOUT_CAP'),
  promotedObjectCustomEventType: z.string().min(1).default('PURCHASE'),
  countryCodes: z.array(z.string().min(2).max(2)).min(1).default(['IN']),
  ageMin: z.number().int().min(13).max(65).optional(),
  ageMax: z.number().int().min(13).max(65).optional(),
  placementTargeting: marketingMetaAdsPlacementTargetingSchema.default({
    publisherPlatforms: ['facebook', 'instagram'],
    facebookPositions: ['feed'],
    instagramPositions: ['stream'],
  }),
  creative: marketingMetaAdsCreativeBuildoutSchema,
});

export const marketingAdsPlanActionSchema = z.object({
  type: marketingAdsPlanActionTypeSchema,
  provider: marketingAdsPlanProviderSchema,
  risk: marketingAdsPlanRiskSchema,
  summary: z.string().min(1),
  requiresApproval: z.boolean().default(true),
  blocksApply: z.boolean().default(false),
});

export const marketingAdsPlanCandidateSchema = z.object({
  id: z.string().min(1),
  provider: marketingAdsPlanProviderSchema,
  source: z.enum(['strategy-map', 'seo-ads-plan']).default('strategy-map'),
  sourceSeoAdGroupId: z.string().min(1).optional(),
  sourceOpportunityId: z.string().min(1).optional(),
  sourceOpportunitySlug: z.string().min(1).optional(),
  strategyObjectId: z.string().min(1),
  strategyObjectKind: z.string().min(1),
  name: z.string().min(1),
  landingPageUrl: z.string().min(1).optional(),
  conversionIds: z.array(z.string().min(1)).default([]),
  campaignIds: z.array(z.string().min(1)).default([]),
  campaignNames: z.array(z.string().min(1)).default([]),
  utm: marketingAdsPlanUtmSchema,
  budgetGuardrail: marketingAdsPlanBudgetGuardrailSchema,
  bidStrategy: marketingAdsPlanBidStrategySchema,
  googleSearchSettings: marketingGoogleAdsSearchSettingsSchema.optional(),
  googleSearchBuildout: marketingGoogleAdsSearchBuildoutSchema.optional(),
  metaAdsBuildout: marketingMetaAdsBuildoutSchema.optional(),
  keywords: z.array(marketingAdsPlanKeywordSchema).default([]),
  negativeKeywords: z.array(marketingAdsPlanNegativeKeywordSchema).default([]),
  currentMetrics: z.object({
    ads: marketingReportMetricsSchema,
    analytics: marketingReportMetricsSchema,
    seo: marketingReportMetricsSchema,
    confirmed: marketingReportMetricsSchema,
  }),
  actions: z.array(marketingAdsPlanActionSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  rationale: z.string().min(1),
});

export const marketingAdsPlanArtifactSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  status: marketingAdsPlanStatusSchema.default('draft'),
  providerFilter: z.union([marketingAdsPlanProviderSchema, z.literal('all')]).default('all'),
  nonMutating: z.literal(true),
  mutationPolicy: z.object({
    liveMutationAllowed: z.literal(false),
    applyRequiresReviewedPlan: z.literal(true),
    applyRequiresReceipt: z.literal(true),
    budgetIncreaseRequiresExplicitApproval: z.literal(true),
    campaignEnableRequiresExplicitApproval: z.literal(true),
    budgetDecreaseAllowsStandardApproval: z.literal(true),
    pauseOrArchiveAllowsStandardApproval: z.literal(true),
    destructiveDeletesAllowed: z.literal(false),
    emergencyExceptionRequiresDocumentedReason: z.literal(true),
  }),
  candidates: z.array(marketingAdsPlanCandidateSchema).default([]),
  creativeAssets: z.array(marketingCreativeAssetSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  nextWorkflowStep: z.string().min(1),
});

export type MarketingAdsPlanProvider = z.infer<typeof marketingAdsPlanProviderSchema>;
export type MarketingAdsPlanStatus = z.infer<typeof marketingAdsPlanStatusSchema>;
export type MarketingAdsPlanActionType = z.infer<typeof marketingAdsPlanActionTypeSchema>;
export type MarketingAdsPlanRisk = z.infer<typeof marketingAdsPlanRiskSchema>;
export type MarketingAdsPlanKeyword = z.infer<typeof marketingAdsPlanKeywordSchema>;
export type MarketingAdsPlanNegativeKeyword = z.infer<typeof marketingAdsPlanNegativeKeywordSchema>;
export type MarketingAdsPlanUtm = z.infer<typeof marketingAdsPlanUtmSchema>;
export type MarketingAdsPlanBudgetGuardrail = z.infer<typeof marketingAdsPlanBudgetGuardrailSchema>;
export type MarketingAdsPlanBidStrategy = z.infer<typeof marketingAdsPlanBidStrategySchema>;
export type MarketingGoogleAdsSearchSettings = z.infer<
  typeof marketingGoogleAdsSearchSettingsSchema
>;
export type MarketingGoogleAdsSearchBuildout = z.infer<
  typeof marketingGoogleAdsSearchBuildoutSchema
>;
export type MarketingMetaAdsBuildout = z.infer<typeof marketingMetaAdsBuildoutSchema>;
export type MarketingAdsPlanAction = z.infer<typeof marketingAdsPlanActionSchema>;
export type MarketingAdsPlanCandidate = z.infer<typeof marketingAdsPlanCandidateSchema>;
export type MarketingAdsPlanArtifact = z.infer<typeof marketingAdsPlanArtifactSchema>;
export type MarketingAdsReportProvider = z.infer<typeof marketingReportProviderSchema>;
