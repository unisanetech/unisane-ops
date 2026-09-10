import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const META_BROWSER_IDENTIFIER_PATTERN = /^fb\.\d+\./i;

function isRedactedReference(value: string): boolean {
  return (
    !EMAIL_PATTERN.test(value) &&
    !URL_PATTERN.test(value) &&
    !isFullIpAddress(value) &&
    !META_BROWSER_IDENTIFIER_PATTERN.test(value)
  );
}

function isFullIpAddress(value: string): boolean {
  const ipv4Parts = value.split('.');
  const isIpv4 =
    ipv4Parts.length === 4 &&
    ipv4Parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  const isIpv6 = value.includes(':') && !value.startsWith('sha256:') && /^[0-9a-f:]+$/i.test(value);
  return isIpv4 || isIpv6;
}

const boundedCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine(isRedactedReference, 'Expected a redacted code, not a customer or transport value.');

const boundedReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/)
  .refine(isRedactedReference, 'Expected an opaque reference, not a customer or transport value.');

export const marketingTrackingIdentityDigestSchema = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/, 'Expected a lowercase SHA-256 identity digest.');

const parameterNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9._-]*$/);

export const marketingTrackingObservationEmitterSchema = z.enum([
  'web-runtime',
  'gtm',
  'gtag',
  'meta-pixel',
  'meta-capi',
  'google-ads',
  'other',
]);

export const marketingTrackingObservationOutcomeSchema = z.enum([
  'attempted',
  'emitted',
  'suppressed',
  'accepted',
  'rejected',
  'retried',
  'dead',
  'unknown',
]);

export const marketingTrackingEvidenceStateSchema = z.enum([
  'absent',
  'present',
  'normalized',
  'hashed',
  'invalid',
  'not-applicable',
]);

export const marketingTrackingValidityStateSchema = z.enum([
  'absent',
  'present',
  'valid',
  'invalid',
  'not-applicable',
]);

export const marketingTrackingParameterTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'array',
  'object',
]);

export const marketingTrackingParameterEvidenceSchema = z
  .object({
    state: marketingTrackingEvidenceStateSchema,
    type: marketingTrackingParameterTypeSchema.optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    if (
      ['present', 'normalized', 'hashed'].includes(evidence.state) &&
      evidence.type === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${evidence.state} parameter evidence must declare its value type.`,
        path: ['type'],
      });
    }
  });

const parameterEvidenceRecordSchema = z
  .record(parameterNameSchema, marketingTrackingParameterEvidenceSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 64) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parameter evidence is limited to 64 fields.',
      });
    }
  });

export const marketingTrackingCustomerFieldEvidenceSchema = z
  .object({
    email: marketingTrackingEvidenceStateSchema.optional(),
    phone: marketingTrackingEvidenceStateSchema.optional(),
    firstName: marketingTrackingEvidenceStateSchema.optional(),
    lastName: marketingTrackingEvidenceStateSchema.optional(),
    city: marketingTrackingEvidenceStateSchema.optional(),
    region: marketingTrackingEvidenceStateSchema.optional(),
    postcode: marketingTrackingEvidenceStateSchema.optional(),
    country: marketingTrackingEvidenceStateSchema.optional(),
    externalId: marketingTrackingEvidenceStateSchema.optional(),
  })
  .strict();

export const marketingTrackingTransportFieldEvidenceSchema = z
  .object({
    fbp: marketingTrackingEvidenceStateSchema.optional(),
    fbc: marketingTrackingEvidenceStateSchema.optional(),
    clientIp: marketingTrackingEvidenceStateSchema.optional(),
    userAgent: marketingTrackingEvidenceStateSchema.optional(),
    sourceUrl: marketingTrackingEvidenceStateSchema.optional(),
  })
  .strict();

export const marketingTrackingCommerceEvidenceSchema = z
  .object({
    value: marketingTrackingValidityStateSchema,
    currency: marketingTrackingValidityStateSchema,
    catalog: marketingTrackingValidityStateSchema,
  })
  .strict();

export const marketingTrackingConsentEvidenceSchema = z
  .object({
    state: z.enum(['granted', 'denied', 'not-required', 'unknown']),
    categories: z
      .array(z.enum(['analytics', 'ads', 'personalization', 'functional']))
      .max(4)
      .default([]),
    suppressionReasonCode: boundedCodeSchema.optional(),
  })
  .strict();

export const marketingTrackingCaptureEvidenceSchema = z
  .object({
    source: z.enum([
      'browser-adapter',
      'server-adapter',
      'outbox-adapter',
      'consent-adapter',
      'file-import',
      'stream-import',
      'api-import',
      'migration',
    ]),
    schemaVersion: z.number().int().min(1).max(1000),
    provenance: z.enum(['adopter-reported', 'provider-reported', 'fixture', 'migrated']),
    receivedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const marketingTrackingProviderReferenceSchema = z
  .object({
    provider: boundedCodeSchema,
    resourceType: boundedCodeSchema,
    resourceId: boundedReferenceSchema,
  })
  .strict();

const diagnosticExtensionsSchema = z
  .record(boundedCodeSchema, boundedCodeSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 20) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provider diagnostic extensions are limited to 20 entries.',
      });
    }
  });

export const marketingTrackingDiagnosticEvidenceSchema = z
  .object({
    latencyMs: z.number().int().min(0).max(300_000).optional(),
    httpStatusClass: z
      .enum(['2xx', '3xx', '4xx', '5xx', 'network-error', 'not-applicable'])
      .optional(),
    providerCode: boundedCodeSchema.optional(),
    messageCode: boundedCodeSchema.optional(),
    traceReference: boundedReferenceSchema.optional(),
    extensions: diagnosticExtensionsSchema.optional(),
  })
  .strict();

export const marketingTrackingObservationSchema = z
  .object({
    projectId: boundedCodeSchema,
    observationId: marketingTrackingIdentityDigestSchema,
    logicalEventId: marketingTrackingIdentityDigestSchema,
    eventName: boundedCodeSchema,
    eventId: marketingTrackingIdentityDigestSchema.optional(),
    conversionId: boundedReferenceSchema.optional(),
    canonicalCorrelationId: marketingTrackingIdentityDigestSchema.optional(),
    transactionReference: marketingTrackingIdentityDigestSchema.optional(),
    channel: z.enum(['browser', 'server']),
    emitter: marketingTrackingObservationEmitterSchema,
    environment: boundedCodeSchema,
    occurredAt: z.string().datetime({ offset: true }),
    outcome: marketingTrackingObservationOutcomeSchema,
    attempt: z.number().int().min(1).max(10_000).default(1),
    consent: marketingTrackingConsentEvidenceSchema,
    parameterEvidence: parameterEvidenceRecordSchema.default({}),
    commerce: marketingTrackingCommerceEvidenceSchema,
    customerFields: marketingTrackingCustomerFieldEvidenceSchema.default({}),
    transportFields: marketingTrackingTransportFieldEvidenceSchema.default({}),
    capture: marketingTrackingCaptureEvidenceSchema,
    providerReference: marketingTrackingProviderReferenceSchema.optional(),
    diagnostics: marketingTrackingDiagnosticEvidenceSchema.optional(),
  })
  .strict()
  .superRefine((observation, context) => {
    if (['emitted', 'accepted', 'retried'].includes(observation.outcome) && !observation.eventId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${observation.outcome} observations must include an eventId.`,
        path: ['eventId'],
      });
    }
    if (observation.outcome === 'suppressed' && !observation.consent.suppressionReasonCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Suppressed observations must include a bounded suppression reason code.',
        path: ['consent', 'suppressionReasonCode'],
      });
    }
  });

export const marketingTrackingObservationWindowsSchema = z
  .object({
    correlationSeconds: z.number().int().min(1).max(86_400).default(1_800),
    deliveryFreshnessSeconds: z.number().int().min(1).max(86_400).default(300),
    evidenceFreshnessSeconds: z.number().int().min(60).max(2_592_000).default(86_400),
  })
  .strict();

export const marketingTrackingObservationArtifactSchema = z
  .object({
    kind: z.literal('unisane.growth.tracking-observations'),
    version: z.literal(2),
    projectId: boundedCodeSchema,
    environment: boundedCodeSchema,
    capturedAt: z.string().datetime({ offset: true }),
    windows: marketingTrackingObservationWindowsSchema.default({}),
    observations: z.array(marketingTrackingObservationSchema).max(10_000),
  })
  .strict()
  .superRefine((artifact, context) => {
    artifact.observations.forEach((observation, index) => {
      if (observation.projectId !== artifact.projectId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Observation projectId must match the artifact projectId.',
          path: ['observations', index, 'projectId'],
        });
      }
      if (observation.environment !== artifact.environment) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Observation environment must match the artifact environment.',
          path: ['observations', index, 'environment'],
        });
      }
    });
  });

export type MarketingTrackingEvidenceState = z.infer<typeof marketingTrackingEvidenceStateSchema>;
export type MarketingTrackingObservation = z.infer<typeof marketingTrackingObservationSchema>;
export type MarketingTrackingObservationArtifact = z.infer<
  typeof marketingTrackingObservationArtifactSchema
>;
