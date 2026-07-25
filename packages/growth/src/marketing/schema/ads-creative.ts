import { z } from 'zod';

export const marketingCreativeProviderSchema = z.enum(['googleAds', 'metaAds']);

export const marketingCreativeAssetTypeSchema = z.enum([
  'text_ad',
  'image',
  'video',
  'carousel',
  'landing_page_variant',
  'unknown',
]);

export const marketingCreativeApprovalStatusSchema = z.enum([
  'draft',
  'reviewed',
  'approved',
  'rejected',
]);

export const marketingCreativePolicyStatusSchema = z.enum([
  'unknown',
  'needs_review',
  'eligible',
  'limited',
  'disapproved',
]);

export const marketingCreativeAssetSourceSchema = z.enum(['planned', 'provider-pull', 'manual']);

export const marketingCreativeAssetSchema = z.object({
  id: z.string().min(1),
  provider: marketingCreativeProviderSchema,
  source: marketingCreativeAssetSourceSchema,
  assetType: marketingCreativeAssetTypeSchema,
  approvalStatus: marketingCreativeApprovalStatusSchema,
  policyStatus: marketingCreativePolicyStatusSchema,
  owner: z.string().min(1),
  strategyObjectId: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
  adGroupId: z.string().min(1).optional(),
  adSetId: z.string().min(1).optional(),
  creativeId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  thumbnailUrl: z.string().min(1).optional(),
  videoId: z.string().min(1).optional(),
  destinationUrl: z.string().min(1).optional(),
  callToActionType: z.string().min(1).optional(),
  urlTags: z.string().min(1).optional(),
  providerStatus: z.string().min(1).optional(),
});

export const marketingCreativeAssetFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  assets: z.array(marketingCreativeAssetSchema).default([]),
});

export type MarketingCreativeAssetType = z.infer<typeof marketingCreativeAssetTypeSchema>;
export type MarketingCreativeProvider = z.infer<typeof marketingCreativeProviderSchema>;
export type MarketingCreativeApprovalStatus = z.infer<typeof marketingCreativeApprovalStatusSchema>;
export type MarketingCreativePolicyStatus = z.infer<typeof marketingCreativePolicyStatusSchema>;
export type MarketingCreativeAssetSource = z.infer<typeof marketingCreativeAssetSourceSchema>;
export type MarketingCreativeAsset = z.infer<typeof marketingCreativeAssetSchema>;
export type MarketingCreativeAssetFile = z.infer<typeof marketingCreativeAssetFileSchema>;
