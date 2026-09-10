import { z } from 'zod/v4';
const slug = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/)
  .max(60);
const dataPath = z
  .string()
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/)
  .max(160);
const eventName = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/)
  .max(40);
const consent = z.enum(['granted', 'denied']);
export const gtmTrackingSetupInputSchema = z
  .object({
    projectId: z.string().min(1),
    appId: z.string().min(1),
    environment: z.string().min(1),
    accountId: z.string().regex(/^\d+$/),
    containerId: z.string().regex(/^\d+$/),
    namespace: slug,
    workspacePrefix: z.string().min(1).max(100),
    consentDefaults: z
      .object({
        analytics_storage: consent,
        ad_storage: consent,
        ad_user_data: consent,
        ad_personalization: consent,
      })
      .strict(),
    ga4MeasurementId: z
      .string()
      .regex(/^G-[A-Z0-9]+$/)
      .optional(),
    metaPixelId: z.string().regex(/^\d+$/).optional(),
    events: z
      .array(
        z
          .object({
            slug,
            sourceEvent: eventName,
            eventIdPath: dataPath,
            ga4EventName: eventName.optional(),
            metaEventName: z
              .enum([
                'PageView',
                'ViewContent',
                'AddToCart',
                'InitiateCheckout',
                'AddPaymentInfo',
                'Purchase',
                'Lead',
                'CompleteRegistration',
                'Search',
                'AddToWishlist',
                'Subscribe',
                'StartTrial',
              ])
              .optional(),
            valuePath: dataPath.optional(),
            currencyPath: dataPath.optional(),
            transactionIdPath: dataPath.optional(),
            googleAds: z
              .object({
                conversionId: z.string().regex(/^\d+$/),
                conversionLabel: z
                  .string()
                  .regex(/^[a-zA-Z0-9_-]+$/)
                  .max(200),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .superRefine((input, context) => {
    const seen = new Set<string>();
    const sources = new Set<string>();
    input.events.forEach((event, index) => {
      const issue = (message: string) =>
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['events', index], message });
      if (seen.has(event.slug) || sources.has(event.sourceEvent))
        issue('Each event slug and data-layer source must be unique.');
      seen.add(event.slug);
      sources.add(event.sourceEvent);
      if (!event.ga4EventName && !event.metaEventName && !event.googleAds)
        issue('Select at least one explicit event destination.');
      if (event.ga4EventName && !input.ga4MeasurementId)
        issue('GA4 events require the selected measurement ID.');
      if (event.metaEventName && !input.metaPixelId)
        issue('Meta events require the selected pixel ID.');
      if (Boolean(event.valuePath) !== Boolean(event.currencyPath))
        issue('Value and currency must be supplied together.');
      if (
        (event.ga4EventName === 'purchase' || event.metaEventName === 'Purchase') &&
        (!event.valuePath || !event.currencyPath || !event.transactionIdPath)
      )
        issue('Purchase requires value, currency and transaction ID observations.');
      if (event.googleAds && !event.transactionIdPath)
        issue('Google Ads conversion deduplication requires a transaction ID path.');
    });
  });
export type GtmTrackingSetupInput = z.infer<typeof gtmTrackingSetupInputSchema>;
export const gtmTrackingSetupInputJsonSchema = z.toJSONSchema(gtmTrackingSetupInputSchema, {
  io: 'input',
});
