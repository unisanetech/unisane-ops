import { z } from 'zod';
import { marketingLifecycleFamilySchema } from './event-registry.js';

export const marketingConversionGoalSchema = z.enum([
  'lead',
  'activation',
  'purchase',
  'retention',
  'refund',
  'support',
]);

export const marketingGoogleAdsConversionMappingSchema = z.object({
  conversionActionName: z.string().min(1),
  category: z.string().min(1),
  primary: z.boolean().default(true),
});

export const marketingMetaConversionMappingSchema = z.object({
  pixelEventName: z.string().min(1).optional(),
  capiEventName: z.string().min(1).optional(),
});

export const marketingConversionProviderMappingsSchema = z
  .object({
    ga4: z
      .object({
        eventName: z.string().min(1),
        keyEvent: z.boolean().default(true),
      })
      .optional(),
    googleAds: marketingGoogleAdsConversionMappingSchema.optional(),
    meta: marketingMetaConversionMappingSchema.optional(),
    internalAnalytics: z
      .object({
        eventName: z.string().min(1),
        goal: z.string().min(1),
      })
      .optional(),
  })
  .default({});

export const marketingConversionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  sourceEventId: z.string().min(1),
  lifecycle: marketingLifecycleFamilySchema,
  goal: marketingConversionGoalSchema,
  confirmationSource: z.enum(['browser', 'server', 'provider', 'manual']),
  eventIdRule: z.string().min(1),
  transactionIdRule: z.string().min(1).optional(),
  valueRule: z.string().min(1).optional(),
  currencyRule: z.string().min(1).optional(),
  dedupeRule: z.string().min(1),
  mappings: marketingConversionProviderMappingsSchema,
  reportingGoal: z.string().min(1),
});

export const marketingConversionRegistrySchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  conversions: z.array(marketingConversionSchema),
});

export type MarketingConversion = z.infer<typeof marketingConversionSchema>;
export type MarketingConversionGoal = z.infer<typeof marketingConversionGoalSchema>;
export type MarketingConversionRegistry = z.infer<typeof marketingConversionRegistrySchema>;
