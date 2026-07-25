import { z } from 'zod';

export const marketingEventSourceSchema = z.enum(['browser', 'server', 'webhook', 'imported']);
export const marketingLifecycleFamilySchema = z.enum([
  'awareness',
  'intent',
  'lead',
  'activation',
  'purchase',
  'retention',
  'refund',
  'support',
]);
export const marketingPropertyTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'object',
  'array',
]);
export const marketingConsentCategorySchema = z.enum([
  'necessary',
  'analytics',
  'ads',
  'personalization',
]);

export const marketingEventPropertySchema = z.object({
  name: z.string().min(1),
  type: marketingPropertyTypeSchema,
  description: z.string().min(1).optional(),
  sensitive: z.boolean().default(false),
});

export const marketingConsentRequirementSchema = z.object({
  required: z.boolean().default(true),
  categories: z.array(marketingConsentCategorySchema).default(['analytics']),
});

export const marketingGa4EventMappingSchema = z.object({
  eventName: z.string().min(1),
  keyEvent: z.boolean().default(false),
});

export const marketingGtmEventMappingSchema = z.object({
  dataLayerEvent: z.string().min(1),
  triggerName: z.string().min(1).optional(),
});

export const marketingInternalAnalyticsMappingSchema = z.object({
  eventName: z.string().min(1),
  goal: z.string().min(1).optional(),
});

export const marketingEventProviderMappingsSchema = z
  .object({
    ga4: marketingGa4EventMappingSchema.optional(),
    gtm: marketingGtmEventMappingSchema.optional(),
    internalAnalytics: marketingInternalAnalyticsMappingSchema.optional(),
  })
  .default({});

export const marketingEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  source: marketingEventSourceSchema,
  lifecycle: marketingLifecycleFamilySchema,
  description: z.string().min(1).optional(),
  requiredProperties: z.array(marketingEventPropertySchema).default([]),
  optionalProperties: z.array(marketingEventPropertySchema).default([]),
  consent: marketingConsentRequirementSchema.default({}),
  attributionFields: z.array(z.string().min(1)).default([]),
  eventIdRule: z.string().min(1),
  transactionIdRule: z.string().min(1).optional(),
  valueRule: z.string().min(1).optional(),
  currencyRule: z.string().min(1).optional(),
  dedupeRule: z.string().min(1).optional(),
  mappings: marketingEventProviderMappingsSchema,
  reportingGoal: z.string().min(1).optional(),
});

export const marketingEventRegistrySchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  events: z.array(marketingEventSchema),
});

export type MarketingConsentCategory = z.infer<typeof marketingConsentCategorySchema>;
export type MarketingEvent = z.infer<typeof marketingEventSchema>;
export type MarketingEventRegistry = z.infer<typeof marketingEventRegistrySchema>;
export type MarketingEventSource = z.infer<typeof marketingEventSourceSchema>;
export type MarketingLifecycleFamily = z.infer<typeof marketingLifecycleFamilySchema>;
