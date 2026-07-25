import { z } from 'zod';
import {
  marketingAdsPlanActionTypeSchema,
  marketingAdsPlanProviderSchema,
  marketingAdsPlanRiskSchema,
  marketingAdsPlanStatusSchema,
} from './ads-plan.js';

export const marketingAdsApplyConfirmationSchema = z.object({
  type: z.enum(['account', 'production']),
  provider: marketingAdsPlanProviderSchema.optional(),
  expected: z.string().min(1),
  provided: z.boolean(),
  status: z.enum(['confirmed', 'missing']),
});

export const marketingAdsApplySafetySchema = z.enum([
  'verification',
  'low_risk_change',
  'spend_or_launch',
  'pause_or_archive',
  'blocked',
]);

export const marketingAdsApplyApprovalTierSchema = z.enum(['none', 'standard', 'strict']);

export const marketingAdsApplyMutationIntentSchema = z.enum([
  'verify',
  'launch_or_expand',
  'spend_increase',
  'spend_decrease',
  'pause_or_archive',
  'blocked',
]);

export const marketingAdsApplyOperationSchema = z.object({
  id: z.string().min(1),
  provider: marketingAdsPlanProviderSchema,
  strategyObjectId: z.string().min(1),
  actionType: marketingAdsPlanActionTypeSchema,
  risk: marketingAdsPlanRiskSchema,
  safety: marketingAdsApplySafetySchema,
  mutationIntent: marketingAdsApplyMutationIntentSchema,
  approvalTier: marketingAdsApplyApprovalTierSchema,
  applyOrder: z.number().int().positive(),
  requiresApproval: z.boolean(),
  blocksApply: z.boolean(),
  firstApplyEligible: z.boolean(),
  receiptRequired: z.literal(true),
  destructiveAllowed: z.literal(false),
  mode: z.literal('dry_run_only'),
  summary: z.string().min(1),
});

export const marketingAdsApplyPreviewSchema = z.object({
  kind: z.literal('unisane.marketing.ads-apply-preview'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  environment: z.string().min(1),
  planPath: z.string().min(1),
  planGeneratedAt: z.string().datetime(),
  planStatus: marketingAdsPlanStatusSchema,
  dryRun: z.literal(true),
  liveMutationAllowed: z.literal(false),
  status: z.enum(['ready', 'blocked']),
  blockers: z.array(z.string().min(1)).default([]),
  confirmations: z.array(marketingAdsApplyConfirmationSchema).default([]),
  operations: z.array(marketingAdsApplyOperationSchema).default([]),
  nextWorkflowStep: z.string().min(1),
});

export const marketingAdsApplyReceiptOperationSchema = z.object({
  operationId: z.string().min(1),
  provider: marketingAdsPlanProviderSchema,
  strategyObjectId: z.string().min(1),
  actionType: marketingAdsPlanActionTypeSchema,
  attemptedAt: z.string().datetime(),
  environment: z.string().min(1),
  safety: marketingAdsApplySafetySchema,
  mutationIntent: marketingAdsApplyMutationIntentSchema,
  approvalTier: marketingAdsApplyApprovalTierSchema,
  status: z.enum(['previewed', 'blocked']),
  message: z.string().min(1),
});

export const marketingAdsApplyReceiptProviderAccountSchema = z.object({
  provider: marketingAdsPlanProviderSchema,
  accountRef: z.string().min(1),
  confirmationExpected: z.string().min(1),
  confirmationStatus: z.enum(['confirmed', 'missing']),
});

export const marketingAdsApplyReceiptActorSchema = z.object({
  kind: z.literal('devtools-cli'),
  actorRef: z.literal('redacted'),
  secretValues: z.literal('redacted'),
});

export const marketingAdsApplyReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.ads-apply-receipt'),
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
  previewPath: z.string().min(1),
  previewStatus: z.enum(['ready', 'blocked']),
  actor: marketingAdsApplyReceiptActorSchema,
  providerAccounts: z.array(marketingAdsApplyReceiptProviderAccountSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  operationResults: z.array(marketingAdsApplyReceiptOperationSchema).default([]),
});

export const marketingAdsLiveExecutorModeSchema = z.enum(['disabled', 'api']);

export const marketingAdsLiveOperationReceiptSchema = z.object({
  operationId: z.string().min(1),
  provider: marketingAdsPlanProviderSchema,
  strategyObjectId: z.string().min(1),
  actionType: marketingAdsPlanActionTypeSchema,
  attemptedAt: z.string().datetime(),
  environment: z.string().min(1),
  safety: marketingAdsApplySafetySchema,
  mutationIntent: marketingAdsApplyMutationIntentSchema,
  approvalTier: marketingAdsApplyApprovalTierSchema,
  status: z.enum(['sent', 'blocked', 'failed']),
  liveMutationSent: z.boolean(),
  providerOperationId: z.string().min(1).optional(),
  message: z.string().min(1),
});

export const marketingAdsLiveExecutionReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.ads-live-execution-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  status: z.enum(['executed', 'blocked', 'failed']),
  dryRun: z.literal(false),
  liveMutationAllowed: z.literal(true),
  liveExecutorMode: marketingAdsLiveExecutorModeSchema,
  platformId: z.string().min(1),
  appId: z.string().min(1),
  environment: z.string().min(1),
  planPath: z.string().min(1),
  planHash: z.string().min(1),
  dryRunReceiptPath: z.string().min(1),
  approvalRef: z.string().min(1),
  actor: marketingAdsApplyReceiptActorSchema,
  confirmations: z.array(marketingAdsApplyConfirmationSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  operationResults: z.array(marketingAdsLiveOperationReceiptSchema).default([]),
  nextWorkflowStep: z.string().min(1),
});

export type MarketingAdsApplyConfirmation = z.infer<typeof marketingAdsApplyConfirmationSchema>;
export type MarketingAdsApplySafety = z.infer<typeof marketingAdsApplySafetySchema>;
export type MarketingAdsApplyApprovalTier = z.infer<typeof marketingAdsApplyApprovalTierSchema>;
export type MarketingAdsApplyMutationIntent = z.infer<typeof marketingAdsApplyMutationIntentSchema>;
export type MarketingAdsApplyOperation = z.infer<typeof marketingAdsApplyOperationSchema>;
export type MarketingAdsApplyPreview = z.infer<typeof marketingAdsApplyPreviewSchema>;
export type MarketingAdsApplyReceiptOperation = z.infer<
  typeof marketingAdsApplyReceiptOperationSchema
>;
export type MarketingAdsApplyReceiptProviderAccount = z.infer<
  typeof marketingAdsApplyReceiptProviderAccountSchema
>;
export type MarketingAdsApplyReceiptActor = z.infer<typeof marketingAdsApplyReceiptActorSchema>;
export type MarketingAdsApplyReceipt = z.infer<typeof marketingAdsApplyReceiptSchema>;
export type MarketingAdsLiveExecutorMode = z.infer<typeof marketingAdsLiveExecutorModeSchema>;
export type MarketingAdsLiveOperationReceipt = z.infer<
  typeof marketingAdsLiveOperationReceiptSchema
>;
export type MarketingAdsLiveExecutionReceipt = z.infer<
  typeof marketingAdsLiveExecutionReceiptSchema
>;
