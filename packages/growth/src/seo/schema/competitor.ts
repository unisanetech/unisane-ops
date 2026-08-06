import { z } from 'zod';

export const competitorPageSourceSchema = z.enum([
  'manual',
  'csv-import',
  'serp-export',
  'sitemap',
  'local-html',
  'url-fetch',
]);

export const competitorContentPatternSchema = z.object({
  label: z.string().min(1),
  notes: z.string().min(1).optional(),
});

export const competitorKeywordSignalSourceSchema = z.enum([
  'title',
  'metaDescription',
  'h1',
  'heading',
  'body',
  'manual',
]);

export const competitorKeywordSignalSchema = z.object({
  term: z.string().min(1),
  count: z.number().int().positive(),
  sources: z.array(competitorKeywordSignalSourceSchema).min(1),
});

export const competitorOnPageSignalsSchema = z.object({
  titleLength: z.number().int().nonnegative().optional(),
  metaDescriptionLength: z.number().int().nonnegative().optional(),
  h1Count: z.number().int().nonnegative(),
  h2Count: z.number().int().nonnegative(),
  h3Count: z.number().int().nonnegative(),
  wordCount: z.number().int().nonnegative(),
  internalLinkCount: z.number().int().nonnegative(),
  externalLinkCount: z.number().int().nonnegative(),
  canonicalPresent: z.boolean(),
  schemaTypes: z.array(z.string().min(1)),
  ctaPatterns: z.array(z.string().min(1)),
});

export const competitorResearchEvidenceSchema = z.object({
  observedAt: z.string().min(1),
  sampleData: z.boolean(),
  limitations: z.array(z.string().min(1)).default([]),
  failures: z
    .array(
      z.object({
        url: z.string().url(),
        reason: z.string().min(1),
      }),
    )
    .default([]),
});

export const competitorPageSchema = z.object({
  id: z.string().min(1),
  platformId: z.string().min(1),
  source: competitorPageSourceSchema,
  sourceFile: z.string().min(1).optional(),
  keyword: z.string().min(1).optional(),
  position: z.number().int().positive().optional(),
  url: z.string().url(),
  domain: z.string().min(1),
  title: z.string().min(1).optional(),
  h1: z.string().min(1).optional(),
  metaDescription: z.string().min(1).optional(),
  canonicalUrl: z.string().url().optional(),
  pageType: z.string().min(1).optional(),
  categoryPath: z.array(z.string().min(1)),
  headings: z.array(z.string().min(1)).optional(),
  contentPatterns: z.array(competitorContentPatternSchema),
  keywordSignals: z.array(competitorKeywordSignalSchema).optional(),
  onPageSignals: competitorOnPageSignalsSchema.optional(),
  notes: z.string().min(1).optional(),
});

export const competitorResearchFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  market: z.string().min(1).optional(),
  source: competitorPageSourceSchema,
  evidence: competitorResearchEvidenceSchema.optional(),
  pages: z.array(competitorPageSchema),
});

export type CompetitorContentPattern = z.infer<typeof competitorContentPatternSchema>;
export type CompetitorKeywordSignal = z.infer<typeof competitorKeywordSignalSchema>;
export type CompetitorKeywordSignalSource = z.infer<typeof competitorKeywordSignalSourceSchema>;
export type CompetitorOnPageSignals = z.infer<typeof competitorOnPageSignalsSchema>;
export type CompetitorPage = z.infer<typeof competitorPageSchema>;
export type CompetitorPageSource = z.infer<typeof competitorPageSourceSchema>;
export type CompetitorResearchFile = z.infer<typeof competitorResearchFileSchema>;
