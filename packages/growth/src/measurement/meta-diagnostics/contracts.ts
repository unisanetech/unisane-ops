import { z } from 'zod/v4';
const id = z.string().trim().min(1).max(200);
export const metaDiagnosticBindingSchema = z
  .object({ projectId: id, environmentId: id, connectionId: id, datasetId: id })
  .strict();
export type MetaDiagnosticBinding = z.infer<typeof metaDiagnosticBindingSchema>;
const suggestion = z
  .object({
    owner: z.enum(['adopter', 'gtm', 'provider', 'investigation']),
    proposal: z.string().trim().min(1).max(1000),
  })
  .strict();
const issue = z
  .object({
    code: id,
    severity: z.enum(['info', 'warning', 'error']),
    state: z.enum(['active', 'previously-detected', 'ignored']),
    explanation: z.string().trim().min(1).max(1000),
    suggestion: suggestion.optional(),
  })
  .strict();
const event = z
  .object({
    name: id,
    activity: z.enum(['active', 'inactive', 'unknown']),
    total: z.number().int().nonnegative().optional(),
    lastReceivedAt: z.string().datetime().optional(),
    channels: z.array(z.enum(['browser', 'server', 'other'])).max(3),
    matchQuality: z.number().min(0).max(10).optional(),
    issues: z.array(issue).max(20),
  })
  .strict();
export const metaDiagnosticObservationSchema = z
  .object({
    schemaVersion: z.literal(1),
    provider: z.literal('meta'),
    ...metaDiagnosticBindingSchema.shape,
    capturedAt: z.string().datetime(),
    window: z.object({ startDate: z.string().date(), endDate: z.string().date() }).strict(),
    source: z
      .object({
        kind: z.literal('manual-import'),
        reference: z.string().trim().min(1).max(500),
        verifiedLive: z.literal(false),
      })
      .strict(),
    completeness: z.enum(['partial', 'complete-within-source']),
    events: z.array(event).max(50),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.window.startDate > value.window.endDate)
      context.addIssue({ code: 'custom', message: 'Invalid evidence window.' });
    if (new Set(value.events.map((item) => item.name)).size !== value.events.length)
      context.addIssue({ code: 'custom', message: 'Duplicate event names.' });
    for (const item of value.events) {
      if (new Set(item.issues.map((entry) => entry.code)).size !== item.issues.length)
        context.addIssue({ code: 'custom', message: 'Duplicate event issue codes.' });
      if (item.lastReceivedAt && Date.parse(item.lastReceivedAt) > Date.parse(value.capturedAt))
        context.addIssue({
          code: 'custom',
          message: 'Last receipt cannot follow evidence capture.',
        });
      if (new Set(item.channels).size !== item.channels.length)
        context.addIssue({ code: 'custom', message: 'Duplicate integration channels.' });
    }
  });
export type MetaDiagnosticObservation = z.infer<typeof metaDiagnosticObservationSchema>;
export const metaDiagnosticReviewInputSchema = z
  .object({
    eventName: id.optional(),
    limit: z.number().int().min(1).max(20).default(10),
    maxAgeHours: z.number().min(1).max(720).default(24),
  })
  .strict();
export type MetaDiagnosticReviewInput = z.input<typeof metaDiagnosticReviewInputSchema>;
export const metaDiagnosticImportResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.meta.diagnostics.import'),
    ...metaDiagnosticBindingSchema.shape,
    evidenceId: z.string().regex(/^[a-f0-9]{64}$/),
    importedAt: z.string().datetime(),
    eventCount: z.number().int().nonnegative(),
    verifiedLive: z.literal(false),
  })
  .strict();
export const metaDiagnosticEvidenceSchema = z
  .object({
    schemaVersion: z.literal(1),
    evidenceId: z.string().regex(/^[a-f0-9]{64}$/),
    importedAt: z.string().datetime(),
    observation: metaDiagnosticObservationSchema,
  })
  .strict();
export type MetaDiagnosticEvidence = z.infer<typeof metaDiagnosticEvidenceSchema>;
export const metaDiagnosticReviewResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.meta.diagnostics.review'),
    ...metaDiagnosticBindingSchema.shape,
    evidenceId: z.string().optional(),
    capturedAt: z.string().datetime().optional(),
    window: metaDiagnosticObservationSchema.shape.window.optional(),
    source: metaDiagnosticObservationSchema.shape.source.optional(),
    freshness: z.enum(['missing', 'current', 'stale', 'future']),
    completeness: z.enum(['unavailable', 'partial', 'complete-within-source']),
    verifiedLive: z.literal(false),
    matchedEventCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    events: z.array(event).max(20),
    handoffs: z
      .array(
        z
          .object({
            eventName: id,
            issueCode: id,
            owner: z.enum(['adopter', 'gtm', 'provider', 'investigation']),
            proposal: z.string().max(1200),
            basis: z.enum(['imported-suggestion', 'investigation-required']),
            verified: z.literal(false),
          })
          .strict(),
      )
      .max(400),
    message: z.string().max(1000),
  })
  .strict();
export type MetaDiagnosticReviewResult = z.infer<typeof metaDiagnosticReviewResultSchema>;
export type MetaDiagnosticImportResult = z.infer<typeof metaDiagnosticImportResultSchema>;
export type MetaDiagnosticImporter = (input: MetaDiagnosticObservation) => Promise<unknown>;
export type MetaDiagnosticReviewer = (input: MetaDiagnosticReviewInput) => Promise<unknown>;
export const metaDiagnosticImportJsonSchema = z.toJSONSchema(metaDiagnosticObservationSchema, {
  io: 'input',
});
export const metaDiagnosticReviewJsonSchema = z.toJSONSchema(metaDiagnosticReviewInputSchema, {
  io: 'input',
});
