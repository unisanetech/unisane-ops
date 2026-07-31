import { z } from 'zod';

export const marketingReportProviderSchema = z.enum([
  'googleAds',
  'metaAds',
  'ga4',
  'searchConsole',
]);

export const marketingReportSourceSchema = z.enum(['api', 'manual-export', 'fixture']);

export const marketingStrategyObjectKindSchema = z.enum([
  'landingPage',
  'campaign',
  'keyword',
  'creative',
  'offer',
  'audience',
]);

export const marketingStrategyObjectStatusSchema = z.enum([
  'planned',
  'active',
  'paused',
  'archived',
]);

export const marketingProviderReportTypeSchema = z.enum([
  'account',
  'campaign',
  'adGroup',
  'keyword',
  'conversion',
  'adSet',
  'ad',
  'creative',
  'event',
  'landingPage',
  'channel',
  'sourceMedium',
  'ecommerce',
  'queryPage',
  'page',
  'query',
  'auctionInsight',
  'country',
  'device',
  'searchAppearance',
]);

export const marketingReportRecordLevelSchema = z.enum([
  'account',
  'campaign',
  'adGroup',
  'adSet',
  'ad',
  'creative',
  'keyword',
  'conversion',
  'event',
  'page',
  'query',
  'competitor',
  'channel',
  'sourceMedium',
  'ecommerce',
  'country',
  'device',
  'searchAppearance',
]);

export const marketingReportMetricsSchema = z
  .object({
    impressions: z.number().nonnegative().optional(),
    clicks: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    conversions: z.number().nonnegative().optional(),
    conversionValue: z.number().optional(),
    revenue: z.number().optional(),
    margin: z.number().optional(),
    sessions: z.number().nonnegative().optional(),
    users: z.number().nonnegative().optional(),
    keyEvents: z.number().nonnegative().optional(),
    purchases: z.number().nonnegative().optional(),
  })
  .default({});

export const marketingReportWindowSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1).optional(),
});

export const marketingProviderReportRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  level: marketingReportRecordLevelSchema,
  accountId: z.string().min(1).optional(),
  accountTimeZone: z.string().min(1).optional(),
  autoTaggingEnabled: z.boolean().optional(),
  trackingUrlTemplate: z.string().min(1).optional(),
  finalUrlSuffix: z.string().min(1).optional(),
  conversionTrackingStatus: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
  campaignName: z.string().min(1).optional(),
  campaignStatus: z.string().min(1).optional(),
  campaignPrimaryStatus: z.string().min(1).optional(),
  campaignPrimaryStatusReasons: z.array(z.string().min(1)).optional(),
  campaignServingStatus: z.string().min(1).optional(),
  campaignAdvertisingChannelType: z.string().min(1).optional(),
  campaignBiddingStrategyType: z.string().min(1).optional(),
  campaignBiddingStrategySystemStatus: z.string().min(1).optional(),
  campaignStartDate: z.string().min(1).optional(),
  campaignEndDate: z.string().min(1).optional(),
  campaignDailyBudget: z.number().nonnegative().optional(),
  campaignBudgetStatus: z.string().min(1).optional(),
  campaignBudgetShared: z.boolean().optional(),
  adGroupId: z.string().min(1).optional(),
  adGroupName: z.string().min(1).optional(),
  adSetId: z.string().min(1).optional(),
  adSetName: z.string().min(1).optional(),
  adId: z.string().min(1).optional(),
  adName: z.string().min(1).optional(),
  creativeId: z.string().min(1).optional(),
  creativeName: z.string().min(1).optional(),
  creativeStatus: z.string().min(1).optional(),
  creativeAssetType: z.string().min(1).optional(),
  creativeHeadline: z.string().min(1).optional(),
  creativeBody: z.string().min(1).optional(),
  creativeImageUrl: z.string().min(1).optional(),
  creativeThumbnailUrl: z.string().min(1).optional(),
  creativeVideoId: z.string().min(1).optional(),
  creativeDestinationUrl: z.string().min(1).optional(),
  creativeCallToActionType: z.string().min(1).optional(),
  creativeUrlTags: z.string().min(1).optional(),
  audienceId: z.string().min(1).optional(),
  audienceName: z.string().min(1).optional(),
  experimentId: z.string().min(1).optional(),
  experimentName: z.string().min(1).optional(),
  keyword: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  auctionInsightDomain: z.string().min(1).optional(),
  auctionInsightSearchImpressionShare: z.number().optional(),
  auctionInsightSearchOverlapRate: z.number().optional(),
  auctionInsightSearchPositionAboveRate: z.number().optional(),
  auctionInsightSearchOutrankingShare: z.number().optional(),
  auctionInsightSearchTopImpressionPercentage: z.number().optional(),
  auctionInsightSearchAbsoluteTopImpressionPercentage: z.number().optional(),
  pageUrl: z.string().min(1).optional(),
  utmSource: z.string().min(1).optional(),
  utmMedium: z.string().min(1).optional(),
  utmCampaign: z.string().min(1).optional(),
  utmContent: z.string().min(1).optional(),
  utmTerm: z.string().min(1).optional(),
  channel: z.string().min(1).optional(),
  sourceMedium: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  device: z.string().min(1).optional(),
  searchAppearance: z.string().min(1).optional(),
  itemName: z.string().min(1).optional(),
  conversionId: z.string().min(1).optional(),
  conversionName: z.string().min(1).optional(),
  currency: z.string().min(3).max(3).optional(),
  ctr: z.number().optional(),
  position: z.number().optional(),
  metrics: marketingReportMetricsSchema,
});

export const marketingProviderReportArtifactSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  provider: marketingReportProviderSchema,
  reportType: marketingProviderReportTypeSchema.optional(),
  source: marketingReportSourceSchema,
  accountId: z.string().min(1).optional(),
  pulledAt: z.string().datetime(),
  window: marketingReportWindowSchema,
  partial: z.boolean().default(false),
  records: z.array(marketingProviderReportRecordSchema).default([]),
});

export const marketingProviderReportArtifactInputSchema =
  marketingProviderReportArtifactSchema.extend({
    platformId: z.string().min(1).optional(),
    appId: z.string().min(1).optional(),
    source: marketingReportSourceSchema.default('manual-export'),
    pulledAt: z.string().datetime().optional(),
  });

export const marketingConfirmedConversionRecordSchema = z.object({
  id: z.string().min(1),
  conversionId: z.string().min(1),
  sourceEventId: z.string().min(1),
  eventId: z.string().min(1).optional(),
  transactionId: z.string().min(1).optional(),
  occurredAt: z.string().datetime().optional(),
  value: z.number().optional(),
  revenue: z.number().optional(),
  margin: z.number().optional(),
  currency: z.string().min(3).max(3).optional(),
  campaignId: z.string().min(1).optional(),
  campaignName: z.string().min(1).optional(),
  pageUrl: z.string().min(1).optional(),
});

export const marketingConfirmedConversionArtifactSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  source: marketingReportSourceSchema,
  pulledAt: z.string().datetime(),
  window: marketingReportWindowSchema,
  partial: z.boolean().default(false),
  records: z.array(marketingConfirmedConversionRecordSchema).default([]),
});

export const marketingConfirmedConversionArtifactInputSchema =
  marketingConfirmedConversionArtifactSchema.extend({
    platformId: z.string().min(1).optional(),
    appId: z.string().min(1).optional(),
    source: marketingReportSourceSchema.default('manual-export'),
    pulledAt: z.string().datetime().optional(),
    window: marketingReportWindowSchema.optional(),
  });

export const marketingStrategyObjectSchema = z.object({
  id: z.string().min(1),
  kind: marketingStrategyObjectKindSchema,
  name: z.string().min(1).optional(),
  owner: z.string().min(1).optional(),
  status: marketingStrategyObjectStatusSchema.default('active'),
  landingPageUrl: z.string().min(1).optional(),
  campaignIds: z.array(z.string().min(1)).default([]),
  campaignNames: z.array(z.string().min(1)).default([]),
  adGroupIds: z.array(z.string().min(1)).default([]),
  adSetIds: z.array(z.string().min(1)).default([]),
  adIds: z.array(z.string().min(1)).default([]),
  creativeIds: z.array(z.string().min(1)).default([]),
  audienceIds: z.array(z.string().min(1)).default([]),
  audienceNames: z.array(z.string().min(1)).default([]),
  experimentIds: z.array(z.string().min(1)).default([]),
  utmSources: z.array(z.string().min(1)).default([]),
  utmMediums: z.array(z.string().min(1)).default([]),
  utmCampaigns: z.array(z.string().min(1)).default([]),
  utmContents: z.array(z.string().min(1)).default([]),
  utmTerms: z.array(z.string().min(1)).default([]),
  keywords: z.array(z.string().min(1)).default([]),
  queries: z.array(z.string().min(1)).default([]),
  conversionIds: z.array(z.string().min(1)).default([]),
});

export const marketingStrategyMapArtifactSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  source: marketingReportSourceSchema,
  pulledAt: z.string().datetime(),
  objects: z.array(marketingStrategyObjectSchema).default([]),
});

export const marketingStrategyMapArtifactInputSchema = marketingStrategyMapArtifactSchema.extend({
  platformId: z.string().min(1).optional(),
  appId: z.string().min(1).optional(),
  source: marketingReportSourceSchema.default('manual-export'),
  pulledAt: z.string().datetime().optional(),
});

export type MarketingProviderReportArtifact = z.infer<typeof marketingProviderReportArtifactSchema>;
export type MarketingProviderReportArtifactInput = z.infer<
  typeof marketingProviderReportArtifactInputSchema
>;
export type MarketingReportMetrics = z.infer<typeof marketingReportMetricsSchema>;
export type MarketingProviderReportRecord = z.infer<typeof marketingProviderReportRecordSchema>;
export type MarketingProviderReportType = z.infer<typeof marketingProviderReportTypeSchema>;
export type MarketingReportProvider = z.infer<typeof marketingReportProviderSchema>;
export type MarketingReportSource = z.infer<typeof marketingReportSourceSchema>;
export type MarketingConfirmedConversionRecord = z.infer<
  typeof marketingConfirmedConversionRecordSchema
>;
export type MarketingConfirmedConversionArtifact = z.infer<
  typeof marketingConfirmedConversionArtifactSchema
>;
export type MarketingConfirmedConversionArtifactInput = z.infer<
  typeof marketingConfirmedConversionArtifactInputSchema
>;
export type MarketingStrategyObject = z.infer<typeof marketingStrategyObjectSchema>;
export type MarketingStrategyObjectKind = z.infer<typeof marketingStrategyObjectKindSchema>;
export type MarketingStrategyObjectStatus = z.infer<typeof marketingStrategyObjectStatusSchema>;
export type MarketingStrategyMapArtifact = z.infer<typeof marketingStrategyMapArtifactSchema>;
export type MarketingStrategyMapArtifactInput = z.infer<
  typeof marketingStrategyMapArtifactInputSchema
>;
