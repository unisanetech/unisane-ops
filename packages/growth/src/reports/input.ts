import { z } from 'zod/v4';

// The portable input uses Zod 4 so MCP can advertise its generated JSON schema.
// Engine/host adapters delegate validation here while their existing contracts use Zod 3.
export const growthReportTypes = ['account', 'campaign', 'adSet', 'ad'] as const;
export const growthReportReadInputSchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    reportType: z.enum(growthReportTypes).default('campaign'),
    maxPages: z.number().int().min(1).max(10).default(2),
    pageSize: z.number().int().min(1).max(100).default(50),
    rowLimit: z.number().int().min(1).max(100).default(50),
    timeZone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Use a valid IANA timezone.')
      .optional(),
  })
  .strict()
  .refine((value) => value.startDate <= value.endDate, 'End date must follow start date.');
export type GrowthReportReadInput = z.input<typeof growthReportReadInputSchema>;

export const growthReportReadInputJsonSchema = z.toJSONSchema(growthReportReadInputSchema, {
  io: 'input',
});
