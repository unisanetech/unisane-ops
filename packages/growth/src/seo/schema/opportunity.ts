import { z } from 'zod';
import {
  keywordClusterFitSchema,
  keywordClusterIntentSchema,
  keywordClusterPageTypeSchema,
  keywordClusterPrioritySchema,
  keywordClusterStatusSchema,
} from './cluster.js';

export const pageOpportunitySectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  purpose: z.string().min(1),
  required: z.boolean(),
});

export const pageOpportunityLinkSchema = z.object({
  label: z.string().min(1),
  path: z.string().min(1),
});

export const pageOpportunityCtaSchema = z.object({
  label: z.string().min(1),
  target: z.string().min(1),
});

export const pageOpportunitySchema = z.object({
  id: z.string().min(1),
  platformId: z.string().min(1),
  clusterId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  status: keywordClusterStatusSchema,
  priority: keywordClusterPrioritySchema,
  fit: keywordClusterFitSchema,
  intent: keywordClusterIntentSchema,
  pageType: keywordClusterPageTypeSchema,
  slug: z.string().min(1),
  routePath: z.string().min(1),
  title: z.string().min(1),
  h1: z.string().min(1),
  metaDescription: z.string().min(1),
  primaryKeyword: z.string().min(1),
  supportingKeywords: z.array(z.string().min(1)),
  totalVolume: z.number().int().nonnegative().optional(),
  sections: z.array(pageOpportunitySectionSchema),
  internalLinks: z.array(pageOpportunityLinkSchema),
  cta: pageOpportunityCtaSchema,
  rationale: z.string().min(1),
});

export const pageOpportunityFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  basePath: z.string().min(1),
  opportunities: z.array(pageOpportunitySchema),
});

export type PageOpportunity = z.infer<typeof pageOpportunitySchema>;
export type PageOpportunityFile = z.infer<typeof pageOpportunityFileSchema>;
