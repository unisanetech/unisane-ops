import { z } from 'zod';
import { growthReportTypes } from './input.js';
const id = z.string().trim().min(1).max(300);
export const growthReportTypeSchema = z.enum(growthReportTypes);
export { growthReportReadInputSchema, growthReportReadInputJsonSchema } from './input.js';
import type { GrowthReportReadInput } from './input.js';
export type { GrowthReportReadInput } from './input.js';
export const growthReportBindingSchema = z
  .object({
    projectId: id,
    environmentId: id,
    connectionId: id,
    accountId: z.string().regex(/^act_\d+$/),
  })
  .strict();
export type GrowthReportBinding = z.infer<typeof growthReportBindingSchema>;
export const growthReportRowSchema = z
  .object({
    id,
    name: id.optional(),
    accountId: z.string().regex(/^act_\d+$/),
    accountName: id.optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    impressions: z.number().int().nonnegative().optional(),
    clicks: z.number().int().nonnegative().optional(),
    spend: z.number().nonnegative().optional(),
    actions: z
      .array(
        z
          .object({
            type: id,
            count: z.number().nonnegative().optional(),
            value: z.number().finite().optional(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export const growthReportSnapshotSchema = z
  .object({
    binding: growthReportBindingSchema,
    reportType: growthReportTypeSchema,
    startDate: z.string().date(),
    endDate: z.string().date(),
    capturedAt: z.string().datetime(),
    partial: z.boolean(),
    rows: z.array(growthReportRowSchema).max(1000),
  })
  .strict();
export type GrowthReportSnapshot = z.infer<typeof growthReportSnapshotSchema>;
export const growthReportReadOutputSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.reports.read'),
    ...growthReportBindingSchema.shape,
    reportType: growthReportTypeSchema,
    startDate: z.string().date(),
    endDate: z.string().date(),
    capturedAt: z.string().datetime(),
    timeZone: z.string().optional(),
    timeZoneBasis: z.enum(['requested-not-verified', 'unavailable']),
    attributionBasis: z.literal('provider-default-not-verified'),
    persisted: z.literal(false),
    partial: z.boolean(),
    observedRowCount: z.number().int().nonnegative(),
    rowsTruncated: z.boolean(),
    rows: z.array(growthReportRowSchema).max(100),
    presentation: z
      .object({ headline: z.string().max(500), whyItMatters: z.string().max(1000) })
      .strict(),
  })
  .strict();
export type GrowthReportReadResult = z.infer<typeof growthReportReadOutputSchema>;
export type GrowthReportReader = (input: GrowthReportReadInput) => Promise<unknown>;
