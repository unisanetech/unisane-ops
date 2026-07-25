import { z } from 'zod';
import {
  marketingRecommendationAlertSchema,
  marketingRecommendationSeveritySchema,
} from './recommendation.js';

export const marketingAlertAcknowledgementReceiptSchema = z.object({
  kind: z.literal('unisane.marketing.alert-acknowledgement-receipt'),
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  nonMutating: z.literal(true),
  recommendationArtifactPath: z.string().min(1),
  recommendationArtifactHash: z.string().min(1),
  recommendationArtifactGeneratedAt: z.string().datetime(),
  alertId: z.string().min(1),
  status: z.literal('acknowledged'),
  acknowledgedBy: z.string().min(1),
  reason: z.string().min(1).optional(),
  severity: marketingRecommendationSeveritySchema,
  rootCauseKey: z.string().min(1),
  alert: marketingRecommendationAlertSchema,
  policy: z.object({
    deletesEvidence: z.literal(false),
    highSeverityReasonRequired: z.boolean(),
    recurringAlertsGroupedByRootCause: z.literal(true),
  }),
  nextWorkflowStep: z.string().min(1),
});

export type MarketingAlertAcknowledgementReceipt = z.infer<
  typeof marketingAlertAcknowledgementReceiptSchema
>;
