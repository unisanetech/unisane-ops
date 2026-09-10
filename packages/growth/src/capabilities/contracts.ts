import { z } from 'zod';
import {
  marketingMetaConnectionStatusSchema,
  marketingMetaConnectionResourceSchema,
  marketingMetaConnectionReadinessStateSchema,
} from '../marketing/connections/meta.js';

const id = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const text = z.string().trim().min(1).max(500);
export const growthCapabilityFactSchema = z
  .object({
    id,
    title: text,
    implementation: z.enum(['implemented', 'partial', 'not-implemented']),
    verification: z.enum(['fixture-proven', 'not-verified']),
    effect: z.enum(['offline', 'read-network', 'write-network']),
    hostState: z.enum(['bound', 'blocked', 'not-exposed']),
    hostReason: text,
    assessment: z.enum(['connection', 'ads-insights', 'event-measurement', 'unmapped']),
    executionSurfaces: z.array(z.enum(['cli', 'mcp', 'console'])).max(3),
    nextStep: text,
  })
  .strict();

export const growthCapabilitySnapshotSchema = z
  .object({
    projectId: id,
    environmentId: id,
    connectionId: z.string().min(1).max(300).optional(),
    connection: marketingMetaConnectionStatusSchema.optional(),
    configuredResources: z.array(marketingMetaConnectionResourceSchema).max(100),
    capabilities: z.array(growthCapabilityFactSchema).min(1).max(50),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.capabilities.map((item) => item.id)).size !== value.capabilities.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capabilities'],
        message: 'Duplicate capability IDs.',
      });
    }
  });
export type GrowthCapabilitySnapshot = z.infer<typeof growthCapabilitySnapshotSchema>;

export const growthCapabilityReviewInputSchema = z
  .object({
    maxAgeHours: z.number().int().min(1).max(720).default(24),
  })
  .strict();
export const growthCapabilityAccountStateSchema = z.union([
  marketingMetaConnectionReadinessStateSchema,
  z.enum([
    'not-evaluated',
    'connection-missing',
    'connection-mismatch',
    'evidence-stale',
    'resource-mismatch',
    'recorded-ready',
  ]),
]);
export type GrowthCapabilityAccountState = z.infer<typeof growthCapabilityAccountStateSchema>;

export const growthCapabilityReviewOutputSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.capabilities.review'),
    projectId: id,
    environmentId: id,
    provider: z.literal('meta'),
    observedAt: z.string().datetime({ offset: true }),
    connectionId: z.string().min(1).max(300).optional(),
    liveVerified: z.literal(false),
    capabilities: z
      .array(
        growthCapabilityFactSchema
          .extend({
            status: z.enum(['ready-to-read', 'blocked', 'not-implemented']),
            accountState: growthCapabilityAccountStateSchema,
            reasons: z.array(text).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    presentation: z.object({ headline: text, whyItMatters: text }).strict(),
  })
  .strict();
export type GrowthCapabilityReview = z.infer<typeof growthCapabilityReviewOutputSchema>;
export type GrowthCapabilityReviewer = (target: {
  projectId: string;
  environmentId: string;
}) => Promise<unknown>;
