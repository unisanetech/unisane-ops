import { z } from 'zod';

export const trendsProviderSchema = z.enum(['google-trends', 'manual-import', 'csv-import']);

export const trendRelatedQueryTypeSchema = z.enum(['top', 'rising']);

export const trendSignalSchema = z.object({
  id: z.string().min(1),
  platformId: z.string().min(1),
  provider: trendsProviderSchema,
  term: z.string().min(1),
  normalizedTerm: z.string().min(1),
  country: z.string().min(2).optional(),
  region: z.string().min(1).optional(),
  language: z.string().min(2).optional(),
  date: z.string().min(1).optional(),
  dateRange: z.string().min(1).optional(),
  relativeInterest: z.number().min(0).max(100).optional(),
  relatedQuery: z.string().min(1).optional(),
  relatedQueryType: trendRelatedQueryTypeSchema.optional(),
  breakout: z.boolean().optional(),
  sourceFile: z.string().min(1).optional(),
  sourceRow: z.number().int().positive().optional(),
  fetchedAt: z.string().min(1),
});

export const trendSignalFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  provider: trendsProviderSchema,
  country: z.string().min(2).optional(),
  language: z.string().min(2).optional(),
  dateRange: z.string().min(1).optional(),
  source: z.object({
    kind: z.enum(['csv-import', 'manual-import', 'api-fetch']),
    input: z.string().min(1).optional(),
  }),
  signals: z.array(trendSignalSchema),
});

export type TrendRelatedQueryType = z.infer<typeof trendRelatedQueryTypeSchema>;
export type TrendSignal = z.infer<typeof trendSignalSchema>;
export type TrendSignalFile = z.infer<typeof trendSignalFileSchema>;
export type TrendsProvider = z.infer<typeof trendsProviderSchema>;
