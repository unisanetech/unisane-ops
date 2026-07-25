import { z } from 'zod';

export const seoPerformanceSourceSchema = z.enum(['google-search-console', 'ga4']);

export const seoPerformanceRecordSchema = z.object({
  id: z.string().min(1),
  platformId: z.string().min(1),
  source: seoPerformanceSourceSchema,
  pagePath: z.string().min(1),
  query: z.string().min(1).optional(),
  clicks: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  ctr: z.number().min(0).max(1).optional(),
  position: z.number().positive().optional(),
  sessions: z.number().int().nonnegative().optional(),
  users: z.number().int().nonnegative().optional(),
  conversions: z.number().nonnegative().optional(),
  revenue: z.number().nonnegative().optional(),
  sourceFile: z.string().min(1).optional(),
  sourceRow: z.number().int().positive().optional(),
  fetchedAt: z.string().min(1),
});

export const seoPerformanceFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  source: seoPerformanceSourceSchema,
  property: z.string().min(1).optional(),
  dateRange: z.string().min(1).optional(),
  records: z.array(seoPerformanceRecordSchema),
});

export type SeoPerformanceFile = z.infer<typeof seoPerformanceFileSchema>;
export type SeoPerformanceRecord = z.infer<typeof seoPerformanceRecordSchema>;
export type SeoPerformanceSource = z.infer<typeof seoPerformanceSourceSchema>;
