import { z } from 'zod';

const nonempty = z.string().trim().min(1).max(512);
const customer = z
  .object({
    hashedEmail: z.string().optional(),
    hashedPhone: z.string().optional(),
    hashedFirstName: z.string().optional(),
    hashedLastName: z.string().optional(),
    hashedCity: z.string().optional(),
    hashedRegion: z.string().optional(),
    hashedPostalCode: z.string().optional(),
    hashedCountry: z.string().optional(),
    hashedExternalId: z.string().optional(),
    clientIpAddress: z.string().optional(),
    clientUserAgent: z.string().optional(),
    fbp: z.string().optional(),
    fbc: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  })
  .strict();
const scalar = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);

export const webConversionDeliveryBindingSchema = z
  .object({
    projectId: nonempty,
    environment: nonempty,
    appId: nonempty,
    scopeId: nonempty,
    provider: nonempty,
    destinationId: nonempty,
  })
  .strict();

export const webConversionDeliverySchema = z
  .object({
    version: z.literal(1),
    binding: webConversionDeliveryBindingSchema,
    envelope: z
      .object({
        schema_version: z.literal(2),
        occurred_at: z.string().datetime({ offset: true }),
        event: nonempty,
        app_id: nonempty,
        scope_id: nonempty,
        event_id: nonempty,
        transaction_id: nonempty.optional(),
        user_id: nonempty.optional(),
        value: z.number().finite().nonnegative().optional(),
        currency: z
          .string()
          .regex(/^[A-Z]{3}$/)
          .optional(),
        items: z.array(z.record(z.unknown())).optional(),
        properties: z.record(z.union([scalar, z.array(scalar)])).optional(),
        customer: customer.optional(),
        analytics: z.object({
          clientId: z.string().regex(/^\d{1,20}\.\d{1,20}$/),
          sessionId: z.string().regex(/^\d{1,20}$/).optional(),
          capturedAt: z.string().datetime({ offset: true }),
        }).strict().optional(),
        consent: z
          .object({
            advertising: z.enum(['granted', 'denied', 'unknown']),
            analytics: z.enum(['granted', 'denied', 'unknown']).optional(),
            capturedAt: z.string().datetime({ offset: true }),
          })
          .strict(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.binding.appId !== value.envelope.app_id ||
      value.binding.scopeId !== value.envelope.scope_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conversion binding does not match the event scope.',
      });
    }
  });

export type WebConversionDeliveryBinding = z.infer<typeof webConversionDeliveryBindingSchema>;
export type WebConversionDelivery = z.infer<typeof webConversionDeliverySchema>;
export const WEB_CONVERSION_DELIVERY_EVENT = 'marketing.conversion.requested.v1';

export function createWebConversionDeliveryKey(delivery: WebConversionDelivery): string {
  const { binding: b, envelope: e } = delivery;
  return JSON.stringify([
    b.projectId,
    b.environment,
    b.appId,
    b.scopeId,
    b.provider,
    b.destinationId,
    e.event,
    e.event_id,
  ]);
}
