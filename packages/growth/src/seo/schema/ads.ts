import { z } from 'zod';

export const adsKeywordMatchTypeSchema = z.enum(['exact', 'phrase']);
export const adsPlanStatusFilterSchema = z.enum(['approved', 'built', 'approved-or-built', 'all']);

export const adsKeywordCandidateSchema = z.object({
  keyword: z.string().min(1),
  matchType: adsKeywordMatchTypeSchema,
  landingPage: z.string().min(1),
  sourceOpportunityId: z.string().min(1),
  sourceOpportunitySlug: z.string().min(1),
  volume: z.number().int().nonnegative().optional(),
  rationale: z.string().min(1),
});

export const adsNegativeKeywordCandidateSchema = z.object({
  keyword: z.string().min(1),
  reason: z.string().min(1),
});

export const adsAdGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  landingPage: z.string().min(1),
  opportunityId: z.string().min(1),
  opportunitySlug: z.string().min(1),
  primaryKeyword: z.string().min(1),
  keywords: z.array(adsKeywordCandidateSchema),
  negativeKeywords: z.array(adsNegativeKeywordCandidateSchema),
  rationale: z.string().min(1),
});

export const adsPlanFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  statusFilter: adsPlanStatusFilterSchema,
  adGroups: z.array(adsAdGroupSchema),
  sharedNegativeKeywords: z.array(adsNegativeKeywordCandidateSchema),
});

export type AdsAdGroup = z.infer<typeof adsAdGroupSchema>;
export type AdsKeywordCandidate = z.infer<typeof adsKeywordCandidateSchema>;
export type AdsKeywordMatchType = z.infer<typeof adsKeywordMatchTypeSchema>;
export type AdsNegativeKeywordCandidate = z.infer<typeof adsNegativeKeywordCandidateSchema>;
export type AdsPlanFile = z.infer<typeof adsPlanFileSchema>;
export type AdsPlanStatusFilter = z.infer<typeof adsPlanStatusFilterSchema>;
