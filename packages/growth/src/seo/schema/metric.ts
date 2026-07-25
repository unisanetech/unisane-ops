import { z } from 'zod';

export const keywordMetricProviderSchema = z.enum(['google-ads', 'manual-import', 'csv-import']);

export const keywordCompetitionSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'UNSPECIFIED']);

export const keywordMetricSchema = z.object({
  term: z.string().min(1),
  normalizedTerm: z.string().min(1),
  country: z.string().min(2),
  language: z.string().min(2),
  provider: keywordMetricProviderSchema,
  avgMonthlySearches: z.number().int().nonnegative().optional(),
  competition: keywordCompetitionSchema.optional(),
  competitionIndex: z.number().min(0).max(100).optional(),
  lowTopOfPageBidMicros: z.number().int().nonnegative().optional(),
  highTopOfPageBidMicros: z.number().int().nonnegative().optional(),
  sourceFile: z.string().optional(),
  sourceRow: z.number().int().positive().optional(),
  fetchedAt: z.string().min(1),
});

export const keywordMetricMarketSchema = z.object({
  country: z.string().min(2),
  language: z.string().min(2),
  locationIds: z.array(z.string().min(1)).default([]),
  languageId: z.string().min(1).optional(),
  currencyCode: z.string().min(3).max(3).optional(),
});

export const keywordMetricSourceSchema = z.object({
  kind: z.enum(['keyword-seed', 'seed-file', 'candidate-file', 'page-url', 'keyword-and-url-seed']),
  candidateFile: z.string().min(1).optional(),
  seedFile: z.string().min(1).optional(),
  pageUrl: z.string().min(1).optional(),
  seedKeywords: z.array(z.string().min(1)).default([]),
  clusterId: z.string().min(1).optional(),
  campaignIntent: z.string().min(1).optional(),
});

export const keywordMetricFileSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  platformId: z.string().min(1),
  country: z.string().min(2),
  language: z.string().min(2),
  provider: keywordMetricProviderSchema,
  runId: z.string().min(1).optional(),
  fetchedAt: z.string().min(1).optional(),
  market: keywordMetricMarketSchema.optional(),
  source: keywordMetricSourceSchema.optional(),
  metrics: z.array(keywordMetricSchema),
});

export type KeywordMetric = z.infer<typeof keywordMetricSchema>;
export type KeywordMetricFile = z.infer<typeof keywordMetricFileSchema>;
export type KeywordMetricProvider = z.infer<typeof keywordMetricProviderSchema>;
