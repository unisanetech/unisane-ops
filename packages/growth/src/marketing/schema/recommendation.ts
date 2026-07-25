import { z } from 'zod';
import { marketingReportMetricsSchema, marketingReportProviderSchema } from './report.js';

export const marketingRecommendationSeveritySchema = z.enum(['info', 'warn', 'high', 'critical']);

export const marketingRecommendationActionSchema = z.enum([
  'fix_tracking',
  'refresh_provider_data',
  'investigate_conversion_mismatch',
  'pause_or_reduce_spend',
  'decrease_budget',
  'run_experiment',
  'hold_scaling',
]);

export const marketingRecommendationAlertTypeSchema = z.enum([
  'stale_report',
  'spend_spike',
  'cpa_spike',
  'zero_conversion',
  'broken_tracking',
]);

export const marketingRecommendationApprovalTierSchema = z.enum(['none', 'standard', 'strict']);

export const marketingRecommendationConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const marketingRecommendationRiskSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const marketingRecommendationAlertSchema = z.object({
  id: z.string().min(1),
  type: marketingRecommendationAlertTypeSchema,
  severity: marketingRecommendationSeveritySchema,
  owner: z.string().min(1),
  source: z.string().min(1),
  provider: marketingReportProviderSchema.optional(),
  strategyObjectId: z.string().min(1).optional(),
  window: z.string().min(1).optional(),
  message: z.string().min(1),
  recommendedAction: z.string().min(1),
  rootCauseKey: z.string().min(1),
});

export const marketingRecommendationExperimentSchema = z.object({
  id: z.string().min(1),
  sourceRecommendationId: z.string().min(1),
  owner: z.string().min(1),
  channel: z.string().min(1),
  strategyObjectId: z.string().min(1).optional(),
  campaignIds: z.array(z.string().min(1)).default([]),
  adGroupIds: z.array(z.string().min(1)).default([]),
  adSetIds: z.array(z.string().min(1)).default([]),
  adIds: z.array(z.string().min(1)).default([]),
  creativeIds: z.array(z.string().min(1)).default([]),
  audienceIds: z.array(z.string().min(1)).default([]),
  audienceNames: z.array(z.string().min(1)).default([]),
  landingPageUrl: z.string().min(1).optional(),
  hypothesis: z.string().min(1),
  primaryMetric: z.string().min(1),
  guardrailMetric: z.string().min(1).optional(),
  baseline: z.object({
    dataWindow: z.string().min(1),
    metric: z.string().min(1),
    value: z.number().optional(),
  }),
  windowDays: z.number().int().positive(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  minimumSignalRule: z.string().min(1),
  result: z.enum(['pending', 'won', 'lost', 'inconclusive']).default('pending'),
  decision: z.enum(['pending', 'ship', 'iterate', 'stop', 'rerun']).default('pending'),
  status: z.enum(['draft', 'ready_for_review', 'active', 'completed']).default('draft'),
});

export const marketingRecommendationSchema = z.object({
  id: z.string().min(1),
  action: marketingRecommendationActionSchema,
  severity: marketingRecommendationSeveritySchema,
  approvalTier: marketingRecommendationApprovalTierSchema,
  owner: z.string().min(1),
  source: z.string().min(1),
  strategyObjectId: z.string().min(1).optional(),
  alertIds: z.array(z.string().min(1)).default([]),
  experimentIds: z.array(z.string().min(1)).default([]),
  dataWindow: z.string().min(1),
  confidence: marketingRecommendationConfidenceSchema,
  risk: marketingRecommendationRiskSchema,
  metrics: marketingReportMetricsSchema,
  title: z.string().min(1),
  rationale: z.string().min(1),
  nextStep: z.string().min(1),
  requiresReceipt: z.literal(true),
});

export const marketingRecommendationArtifactSchema = z.object({
  kind: z.literal('unisane.marketing.recommendations'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  nonMutating: z.literal(true),
  sourceReportGeneratedAt: z.string().datetime(),
  thresholds: z.object({
    maxAgeDays: z.number().int().nonnegative(),
    targetCpa: z.number().positive(),
    spendSpikeAmount: z.number().positive(),
  }),
  alerts: z.array(marketingRecommendationAlertSchema).default([]),
  recommendations: z.array(marketingRecommendationSchema).default([]),
  experiments: z.array(marketingRecommendationExperimentSchema).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  decisionPolicy: z.object({
    acceptedRecommendationRequiresReceipt: z.literal(true),
    rejectedRecommendationAllowsReason: z.literal(true),
    spendIncreasingRecommendationRequiresStrictApproval: z.literal(true),
    trackingFixOutranksScaling: z.literal(true),
  }),
  nextWorkflowStep: z.string().min(1),
});

export const marketingRecommendationDecisionSchema = z.enum(['accepted', 'rejected']);

export const marketingExperimentDecisionSchema = z.enum([
  'ship',
  'iterate',
  'stop',
  'rerun',
  'inconclusive',
]);

export const marketingExperimentDecisionReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.experiment-decision-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  nonMutating: z.literal(true),
  recommendationArtifactPath: z.string().min(1),
  recommendationArtifactHash: z.string().min(1),
  recommendationArtifactGeneratedAt: z.string().datetime(),
  experimentId: z.string().min(1),
  decision: marketingExperimentDecisionSchema,
  decidedBy: z.string().min(1),
  result: z.enum(['won', 'lost', 'inconclusive']),
  followUpAction: z.string().min(1),
  reason: z.string().min(1),
  experiment: marketingRecommendationExperimentSchema,
  policy: z.object({
    recordsCompletedExperimentDecision: z.literal(true),
    liveMutationRequiresRecommendationAndApplyReceipts: z.literal(true),
    preservesBaseline: z.literal(true),
  }),
  nextWorkflowStep: z.string().min(1),
});

export const marketingRecommendationDecisionReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.recommendation-decision-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  nonMutating: z.literal(true),
  liveMutationAllowed: z.literal(false),
  recommendationArtifactPath: z.string().min(1),
  recommendationArtifactHash: z.string().min(1),
  recommendationArtifactGeneratedAt: z.string().datetime(),
  recommendationId: z.string().min(1),
  decision: marketingRecommendationDecisionSchema,
  decidedBy: z.string().min(1).optional(),
  approvalReference: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  recommendation: marketingRecommendationSchema,
  linkedAlertIds: z.array(z.string().min(1)).default([]),
  linkedExperimentIds: z.array(z.string().min(1)).default([]),
  policy: z.object({
    acceptedRecommendationRequiresReceipt: z.literal(true),
    rejectedRecommendationReasonRequired: z.boolean(),
    approverRequired: z.boolean(),
    approvalReferenceRequired: z.boolean(),
    liveMutationRequiresSeparatePlanApplyReceipt: z.literal(true),
  }),
  nextWorkflowStep: z.string().min(1),
});

export type MarketingRecommendationSeverity = z.infer<typeof marketingRecommendationSeveritySchema>;
export type MarketingRecommendationAction = z.infer<typeof marketingRecommendationActionSchema>;
export type MarketingRecommendationAlertType = z.infer<
  typeof marketingRecommendationAlertTypeSchema
>;
export type MarketingRecommendationApprovalTier = z.infer<
  typeof marketingRecommendationApprovalTierSchema
>;
export type MarketingRecommendationConfidence = z.infer<
  typeof marketingRecommendationConfidenceSchema
>;
export type MarketingRecommendationRisk = z.infer<typeof marketingRecommendationRiskSchema>;
export type MarketingRecommendationAlert = z.infer<typeof marketingRecommendationAlertSchema>;
export type MarketingRecommendationExperiment = z.infer<
  typeof marketingRecommendationExperimentSchema
>;
export type MarketingRecommendation = z.infer<typeof marketingRecommendationSchema>;
export type MarketingRecommendationArtifact = z.infer<typeof marketingRecommendationArtifactSchema>;
export type MarketingRecommendationDecision = z.infer<typeof marketingRecommendationDecisionSchema>;
export type MarketingRecommendationDecisionReceipt = z.infer<
  typeof marketingRecommendationDecisionReceiptSchema
>;
export type MarketingExperimentDecision = z.infer<typeof marketingExperimentDecisionSchema>;
export type MarketingExperimentDecisionReceipt = z.infer<
  typeof marketingExperimentDecisionReceiptSchema
>;
