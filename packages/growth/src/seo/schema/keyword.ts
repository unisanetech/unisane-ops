import { z } from 'zod';

export const keywordIntentSchema = z.enum(['seo', 'ads', 'both']);

export const keywordCandidateSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  normalizedTerm: z.string().min(1),
  platformId: z.string().min(1),
  sourceSeedId: z.string().min(1),
  sourceTerm: z.string().min(1),
  pattern: z.string().min(1),
  patternPack: z.string().min(1),
  intent: keywordIntentSchema.optional(),
  topic: z.string().optional(),
  role: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
});

export const keywordCandidateFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  patternPack: z.string().min(1),
  candidates: z.array(keywordCandidateSchema),
});

export const keywordSeedFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  purpose: z.string().optional(),
  marketHypothesis: z.string().optional(),
  seeds: z.array(z.union([z.string().min(1), z.object({ term: z.string().min(1) })])),
});

export type KeywordCandidate = z.infer<typeof keywordCandidateSchema>;
export type KeywordCandidateFile = z.infer<typeof keywordCandidateFileSchema>;
export type KeywordSeedFile = z.infer<typeof keywordSeedFileSchema>;
