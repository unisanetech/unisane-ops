import { z } from 'zod';
import { z as portable } from 'zod/v4';
import { growthReportBindingSchema, growthReportReadOutputSchema } from './contracts.js';
import { growthReportTypes } from './input.js';

export const growthReportHistoryInputSchema = portable
  .object({
    limit: portable.number().int().min(1).max(50).default(20),
    evidenceId: portable
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    reportType: portable.enum(growthReportTypes).optional(),
  })
  .strict();
export const growthReportHistoryInputJsonSchema = portable.toJSONSchema(
  growthReportHistoryInputSchema,
  { io: 'input' },
);
export type GrowthReportHistoryInput = portable.input<typeof growthReportHistoryInputSchema>;
export const growthReportEvidenceSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('growth.report-evidence'),
    evidenceId: z.string().regex(/^[a-f0-9]{64}$/),
    savedAt: z.string().datetime(),
    report: growthReportReadOutputSchema,
  })
  .strict();
export type GrowthReportEvidence = z.infer<typeof growthReportEvidenceSchema>;
export const growthReportHistoryResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.reports.history'),
    ...growthReportBindingSchema.shape,
    truncated: z.boolean(),
    entries: z
      .array(
        z
          .object({
            evidenceId: z.string().regex(/^[a-f0-9]{64}$/),
            savedAt: z.string().datetime(),
            capturedAt: z.string().datetime(),
            reportType: z.enum(growthReportTypes),
            startDate: z.string().date(),
            endDate: z.string().date(),
            partial: z.boolean(),
            rowsTruncated: z.boolean(),
            storedRowCount: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(50),
    selected: growthReportEvidenceSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.selected &&
      (['projectId', 'environmentId', 'connectionId', 'accountId'] as const).some(
        (key) => value.selected!.report[key] !== value[key],
      )
    )
      context.addIssue({
        code: 'custom',
        message: 'Selected report does not match history binding.',
      });
  });
export type GrowthReportHistoryResult = z.infer<typeof growthReportHistoryResultSchema>;
export type GrowthReportHistoryReader = (input: GrowthReportHistoryInput) => Promise<unknown>;
