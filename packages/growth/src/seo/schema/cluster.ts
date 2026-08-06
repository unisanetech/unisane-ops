import { z } from 'zod';
import { keywordMetricProviderSchema } from './metric.js';

export const keywordClusterIntentSchema = z.enum([
  'informational',
  'commercial',
  'transactional',
  'navigational',
]);

export const keywordClusterPageTypeSchema = z.enum([
  'category',
  'role-page',
  'comparison',
  'guide',
  'landing',
  'ad-group',
]);

export const keywordClusterPrioritySchema = z.enum(['p0', 'p1', 'p2', 'later']);
export const keywordClusterFitSchema = z.enum(['strong', 'medium', 'weak']);
export const keywordClusterStatusSchema = z.enum(['candidate', 'approved', 'rejected', 'built']);

export const keywordClusterMetricEvidenceSchema = z.object({
  provider: keywordMetricProviderSchema,
  country: z.string().min(2),
  language: z.string().min(2),
  observedAt: z.string().min(1),
  matchedMetricCount: z.number().int().positive(),
  keywordCount: z.number().int().positive(),
  primaryCompetitionIndex: z.number().min(0).max(100).optional(),
  sourceRunId: z.string().min(1).optional(),
  sampleData: z.boolean(),
});

export const keywordClusterSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  platformId: z.string().min(1),
  intent: keywordClusterIntentSchema,
  pageType: keywordClusterPageTypeSchema,
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string().min(1)),
  duplicateRisk: z.array(z.string().min(1)).optional(),
  totalVolume: z.number().int().nonnegative().optional(),
  metricEvidence: keywordClusterMetricEvidenceSchema.optional(),
  priority: keywordClusterPrioritySchema,
  rationale: z.string().min(1),
  fit: keywordClusterFitSchema,
  status: keywordClusterStatusSchema,
});

export const keywordClusterFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  clusters: z.array(keywordClusterSchema),
});

export type KeywordCluster = z.infer<typeof keywordClusterSchema>;
export type KeywordClusterFile = z.infer<typeof keywordClusterFileSchema>;
export type KeywordClusterPageType = z.infer<typeof keywordClusterPageTypeSchema>;
