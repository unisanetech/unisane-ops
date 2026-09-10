import { z } from 'zod';

const marketingEventSourceV1Schema = z.enum(['browser', 'server', 'webhook', 'imported']);
export const marketingEventDeliveryChannelSchema = z.enum(['browser', 'server']);
export const marketingEventDeliveryExpectationSchema = z.enum([
  'browser-only',
  'server-only',
  'browser-and-server',
]);
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

export const marketingEventEmitterExpectationsSchema = z
  .object({
    browser: z.array(z.string().min(1)).min(1).optional(),
    server: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict()
  .default({});

const marketingEventFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
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
};

const marketingEventRegistryV1Schema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  events: z.array(
    z.object({
      ...marketingEventFields,
      source: marketingEventSourceV1Schema,
    }),
  ),
});

export const marketingEventSchema = z
  .object({
    ...marketingEventFields,
    deliveryExpectation: marketingEventDeliveryExpectationSchema,
    expectedEmitters: marketingEventEmitterExpectationsSchema,
    logicalEventIdRule: z.string().min(1),
    canonicalCorrelationRule: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((event, context) => {
    const expectsBrowser = event.deliveryExpectation !== 'server-only';
    const expectsServer = event.deliveryExpectation !== 'browser-only';
    if (!expectsBrowser && event.expectedEmitters.browser) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A server-only event cannot declare browser emitters.',
        path: ['expectedEmitters', 'browser'],
      });
    }
    if (!expectsServer && event.expectedEmitters.server) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A browser-only event cannot declare server emitters.',
        path: ['expectedEmitters', 'server'],
      });
    }
    if (event.deliveryExpectation === 'browser-and-server' && !event.dedupeRule) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A browser-and-server event must declare a dedupe rule.',
        path: ['dedupeRule'],
      });
    }
  });

export const marketingEventRegistrySchema = z
  .object({
    version: z.literal(2),
    platformId: z.string().min(1),
    events: z.array(marketingEventSchema),
  })
  .strict();

export function migrateMarketingEventRegistryV1(input: unknown): MarketingEventRegistry {
  const legacy = marketingEventRegistryV1Schema.parse(input);
  return marketingEventRegistrySchema.parse({
    version: 2,
    platformId: legacy.platformId,
    events: legacy.events.map(({ source, ...event }) => ({
      ...event,
      deliveryExpectation: source === 'browser' ? 'browser-only' : 'server-only',
      expectedEmitters: {},
      logicalEventIdRule: event.transactionIdRule ?? event.eventIdRule,
      ...(event.transactionIdRule ? { canonicalCorrelationRule: event.transactionIdRule } : {}),
    })),
  });
}

export type MarketingConsentCategory = z.infer<typeof marketingConsentCategorySchema>;
export type MarketingEvent = z.infer<typeof marketingEventSchema>;
export type MarketingEventDeliveryChannel = z.infer<typeof marketingEventDeliveryChannelSchema>;
export type MarketingEventDeliveryExpectation = z.infer<
  typeof marketingEventDeliveryExpectationSchema
>;
export type MarketingEventRegistry = z.infer<typeof marketingEventRegistrySchema>;
export type MarketingLifecycleFamily = z.infer<typeof marketingLifecycleFamilySchema>;
