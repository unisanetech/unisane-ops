import { z } from 'zod';
export const marketingGoogleAdsGoalOperationSchema = z
  .object({
    conversionId: z.string().min(1),
    sourceEventId: z.string().min(1),
    actionName: z.string().min(1),
    category: z.string().min(1),
    primaryForGoal: z.boolean(),
    lifecycle: z.string(),
    reportingGoal: z.string(),
    status: z.enum(['planned', 'validated', 'created', 'updated', 'skipped', 'error']),
    intent: z.literal('create_or_update_conversion_action'),
    resourceName: z.string().optional(),
    message: z.string(),
  })
  .strict();
export const marketingGoogleAdsGoalPlanSchema = z
  .object({
    kind: z.literal('unisane.marketing.google-ads-goals'),
    version: z.literal(1),
    generatedAt: z.string().datetime(),
    nonMutating: z.boolean(),
    validateOnly: z.boolean(),
    customerId: z.string().regex(/^\d+$/),
    loginCustomerId: z.string().regex(/^\d+$/).optional(),
    operations: z.array(marketingGoogleAdsGoalOperationSchema),
    nextWorkflowStep: z.string(),
  })
  .strict();
export type MarketingGoogleAdsGoalOperation = z.infer<typeof marketingGoogleAdsGoalOperationSchema>;
export type MarketingGoogleAdsGoalOperationStatus = MarketingGoogleAdsGoalOperation['status'];
export type MarketingGoogleAdsGoalPlan = z.infer<typeof marketingGoogleAdsGoalPlanSchema>;
export interface MarketingGoogleAdsGoalProvider {
  apply(
    plan: MarketingGoogleAdsGoalPlan,
    validateOnly: boolean,
  ): Promise<MarketingGoogleAdsGoalPlan>;
}
export type MarketingGoogleAdsGoalsOptions = {
  accountId?: string;
  managerCustomerId?: string;
  now?: Date;
  validateOnly?: boolean;
  live?: boolean;
  provider: MarketingGoogleAdsGoalProvider;
};
