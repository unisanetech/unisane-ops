import { z } from 'zod';
import { keywordClusterPrioritySchema } from './cluster.js';

export const faqResearchSourceSchema = z.enum([
  'manual',
  'google-ads',
  'search-console',
  'competitor',
  'serp',
  'llm-curated',
]);

export const faqPageRoleSchema = z.enum([
  'homepage',
  'landing-page',
  'template-page',
  'example-page',
  'guide-page',
  'support-page',
]);

export const faqQuestionStatusSchema = z.enum(['planned', 'approved', 'rejected', 'needs-proof']);

export const faqMarketSignalSchema = z.object({
  country: z.string().min(2),
  language: z.string().min(2),
  avgMonthlySearches: z.number().int().nonnegative().optional(),
  competition: z.string().min(1).optional(),
  competitionIndex: z.number().min(0).max(100).optional(),
});

export const faqEvidenceSchema = z.object({
  source: faqResearchSourceSchema,
  label: z.string().min(1),
  url: z.string().url().optional(),
  note: z.string().min(1).optional(),
});

export const faqInternalLinkSchema = z.object({
  label: z.string().min(1),
  path: z.string().min(1),
});

export const faqQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answerIntent: z.string().min(1),
  pageRole: faqPageRoleSchema,
  routePath: z.string().min(1),
  clusterId: z.string().min(1).optional(),
  priority: keywordClusterPrioritySchema,
  status: faqQuestionStatusSchema,
  sourceTerms: z.array(z.string().min(1)).default([]),
  supportingKeywords: z.array(z.string().min(1)).default([]),
  avgMonthlySearches: z.number().int().nonnegative().optional(),
  markets: z.array(faqMarketSignalSchema).default([]),
  evidence: z.array(faqEvidenceSchema).default([]),
  recommendedAnswer: z.string().min(1),
  internalLinks: z.array(faqInternalLinkSchema).default([]),
});

export const faqResearchFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  pageId: z.string().min(1).optional(),
  routePath: z.string().min(1).optional(),
  market: z.string().min(1).optional(),
  source: faqResearchSourceSchema,
  capturedAt: z.string().min(1),
  questions: z.array(faqQuestionSchema),
});

export type FaqEvidence = z.infer<typeof faqEvidenceSchema>;
export type FaqInternalLink = z.infer<typeof faqInternalLinkSchema>;
export type FaqMarketSignal = z.infer<typeof faqMarketSignalSchema>;
export type FaqPageRole = z.infer<typeof faqPageRoleSchema>;
export type FaqQuestion = z.infer<typeof faqQuestionSchema>;
export type FaqQuestionStatus = z.infer<typeof faqQuestionStatusSchema>;
export type FaqResearchFile = z.infer<typeof faqResearchFileSchema>;
export type FaqResearchSource = z.infer<typeof faqResearchSourceSchema>;
