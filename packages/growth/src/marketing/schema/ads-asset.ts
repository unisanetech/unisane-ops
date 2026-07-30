import { z } from 'zod';
import { marketingCreativeProviderSchema } from './ads-creative.js';

export const marketingAdsAssetTypeSchema = z.enum([
  'image',
  'video',
  'logo',
  'html5',
  'text',
  'landing_page_variant',
]);

export const marketingAdsAssetLifecycleStatusSchema = z.enum([
  'draft',
  'reviewed',
  'approved',
  'uploaded',
  'attached',
  'archived',
  'rejected',
]);

export const marketingAdsAssetSourceFileSchema = z.object({
  localPath: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().nonnegative(),
  extension: z.string().min(1),
  mimeType: z.string().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
});

export const marketingAdsAssetProviderRefSchema = z.object({
  provider: marketingCreativeProviderSchema,
  accountId: z.string().min(1).optional(),
  providerAssetId: z.string().min(1).optional(),
  uploadedAt: z.string().datetime().optional(),
  receiptPath: z.string().min(1).optional(),
});

export const marketingAdsAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  assetType: marketingAdsAssetTypeSchema,
  lifecycleStatus: marketingAdsAssetLifecycleStatusSchema.default('draft'),
  owner: z.string().min(1),
  allowedProviders: z.array(marketingCreativeProviderSchema).min(1),
  allowedPlacements: z.array(z.string().min(1)).default([]),
  strategyObjectIds: z.array(z.string().min(1)).default([]),
  campaignIds: z.array(z.string().min(1)).default([]),
  creativeIds: z.array(z.string().min(1)).default([]),
  landingPageUrls: z.array(z.string().min(1)).default([]),
  license: z.string().min(1).optional(),
  sourceNotes: z.string().min(1).optional(),
  approvalRef: z.string().min(1).optional(),
  policyNotes: z.string().min(1).optional(),
  sourceFile: marketingAdsAssetSourceFileSchema.optional(),
  providerRefs: z.array(marketingAdsAssetProviderRefSchema).default([]),
});

export const marketingAdsAssetRegistrySchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  updatedAt: z.string().datetime(),
  assets: z.array(marketingAdsAssetSchema).default([]),
});

export const marketingAdsAssetUploadPlanOperationSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  provider: marketingCreativeProviderSchema,
  assetType: marketingAdsAssetTypeSchema,
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceLocalPath: z.string().min(1),
  requiresApproval: z.boolean().default(true),
  mutation: z.literal('upload_asset'),
});

export const marketingAdsAssetUploadPlanSchema = z.object({
  kind: z.literal('unisane.marketing.ads.asset-upload-plan'),
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  nonMutating: z.literal(true),
  provider: z.union([marketingCreativeProviderSchema, z.literal('all')]),
  registryPath: z.string().min(1),
  operations: z.array(marketingAdsAssetUploadPlanOperationSchema).default([]),
  checks: z.array(
    z.object({
      id: z.string().min(1),
      status: z.enum(['pass', 'warn', 'error']),
      message: z.string().min(1),
      assetId: z.string().min(1).optional(),
    }),
  ),
});

export const marketingMetaAdsPlacementSchema = z.enum([
  'facebook_feed',
  'instagram_feed',
  'facebook_stories',
  'instagram_stories',
  'facebook_reels',
  'instagram_reels',
]);

export const marketingMetaAdsPlacementTargetingSchema = z.object({
  publisherPlatforms: z.array(z.enum(['facebook', 'instagram'])).default([]),
  facebookPositions: z.array(z.enum(['feed', 'story', 'facebook_reels'])).default([]),
  instagramPositions: z.array(z.enum(['stream', 'story', 'reels'])).default([]),
});

export const marketingAdsAssetCreativePlanOperationSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  provider: marketingCreativeProviderSchema,
  assetType: marketingAdsAssetTypeSchema,
  providerAssetId: z.string().min(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  providerRefPath: z.string().min(1),
  destinationUrl: z.string().min(1).optional(),
  placements: z.array(marketingMetaAdsPlacementSchema).default([]),
  placementTargeting: marketingMetaAdsPlacementTargetingSchema.optional(),
  mutation: z.enum([
    'create_google_asset_creative',
    'create_meta_image_creative',
    'create_meta_video_creative',
  ]),
  requiresApproval: z.boolean().default(true),
});

export const marketingAdsAssetCreativePlanSchema = z.object({
  kind: z.literal('unisane.marketing.ads.asset-creative-plan'),
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  nonMutating: z.literal(true),
  provider: z.union([marketingCreativeProviderSchema, z.literal('all')]),
  registryPath: z.string().min(1),
  operations: z.array(marketingAdsAssetCreativePlanOperationSchema).default([]),
  checks: z.array(
    z.object({
      id: z.string().min(1),
      status: z.enum(['pass', 'warn', 'error']),
      message: z.string().min(1),
      assetId: z.string().min(1).optional(),
    }),
  ),
  nextWorkflowStep: z.string().min(1),
});

export const marketingAdsAssetUploadConfirmationSchema = z.object({
  type: z.enum(['account', 'production']),
  provider: marketingCreativeProviderSchema.optional(),
  expected: z.string().min(1),
  provided: z.boolean(),
  status: z.enum(['confirmed', 'missing']),
});

export const marketingAdsAssetUploadReceiptOperationSchema = z.object({
  operationId: z.string().min(1),
  assetId: z.string().min(1),
  provider: marketingCreativeProviderSchema,
  assetType: marketingAdsAssetTypeSchema,
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  attemptedAt: z.string().datetime(),
  status: z.enum(['previewed', 'blocked']),
  message: z.string().min(1),
});

export const marketingAdsAssetUploadReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.ads.asset-upload-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  status: z.enum(['previewed', 'blocked']),
  dryRun: z.literal(true),
  liveMutationAllowed: z.literal(false),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  environment: z.string().min(1),
  planPath: z.string().min(1),
  planHash: z.string().min(1),
  actor: z.object({
    kind: z.literal('devtools-cli'),
    actorRef: z.literal('redacted'),
    secretValues: z.literal('redacted'),
  }),
  confirmations: z.array(marketingAdsAssetUploadConfirmationSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  operationResults: z.array(marketingAdsAssetUploadReceiptOperationSchema).default([]),
});

export const marketingAdsAssetLiveUploadOperationReceiptSchema = z.object({
  operationId: z.string().min(1),
  assetId: z.string().min(1),
  provider: marketingCreativeProviderSchema,
  assetType: marketingAdsAssetTypeSchema,
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  attemptedAt: z.string().datetime(),
  status: z.enum(['sent', 'blocked', 'failed']),
  liveMutationSent: z.boolean(),
  providerAssetId: z.string().min(1).optional(),
  providerRefPath: z.string().min(1).optional(),
  message: z.string().min(1),
});

export const marketingAdsAssetLiveUploadReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.ads.asset-live-upload-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  status: z.enum(['executed', 'blocked', 'failed']),
  dryRun: z.literal(false),
  liveMutationAllowed: z.literal(true),
  liveExecutorMode: z.enum(['disabled', 'api']),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  environment: z.string().min(1),
  planPath: z.string().min(1),
  planHash: z.string().min(1),
  dryRunReceiptPath: z.string().min(1),
  approvalRef: z.string().min(1),
  actor: z.object({
    kind: z.literal('devtools-cli'),
    actorRef: z.literal('redacted'),
    secretValues: z.literal('redacted'),
  }),
  confirmations: z.array(marketingAdsAssetUploadConfirmationSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  operationResults: z.array(marketingAdsAssetLiveUploadOperationReceiptSchema).default([]),
  nextWorkflowStep: z.string().min(1),
});

export type MarketingAdsAssetType = z.infer<typeof marketingAdsAssetTypeSchema>;
export type MarketingAdsAssetLifecycleStatus = z.infer<
  typeof marketingAdsAssetLifecycleStatusSchema
>;
export type MarketingAdsAssetSourceFile = z.infer<typeof marketingAdsAssetSourceFileSchema>;
export type MarketingAdsAssetProviderRef = z.infer<typeof marketingAdsAssetProviderRefSchema>;
export type MarketingAdsAsset = z.infer<typeof marketingAdsAssetSchema>;
export type MarketingAdsAssetRegistry = z.infer<typeof marketingAdsAssetRegistrySchema>;
export type MarketingAdsAssetUploadPlan = z.infer<typeof marketingAdsAssetUploadPlanSchema>;
export type MarketingMetaAdsPlacement = z.infer<typeof marketingMetaAdsPlacementSchema>;
export type MarketingMetaAdsPlacementTargeting = z.infer<
  typeof marketingMetaAdsPlacementTargetingSchema
>;
export type MarketingAdsAssetCreativePlan = z.infer<typeof marketingAdsAssetCreativePlanSchema>;
export type MarketingAdsAssetUploadConfirmation = z.infer<
  typeof marketingAdsAssetUploadConfirmationSchema
>;
export type MarketingAdsAssetUploadReceipt = z.infer<typeof marketingAdsAssetUploadReceiptSchema>;
export type MarketingAdsAssetLiveUploadReceipt = z.infer<
  typeof marketingAdsAssetLiveUploadReceiptSchema
>;
