import { z } from 'zod';

export const marketingResearchPrioritySchema = z.enum(['p0', 'p1', 'p2', 'later']);
export const marketingResearchStatusSchema = z.enum([
  'active',
  'decided',
  'planned',
  'built',
  'rejected',
  'archived',
]);
export const marketingResearchConfidenceSchema = z.enum(['low', 'medium', 'high']);
export const marketingResearchRecordKindSchema = z.enum([
  'competitor',
  'keyword',
  'page-plan',
  'landing-page',
  'positioning',
  'technical-seo',
  'ads',
  'conversion',
]);
export const marketingResearchSourceKindSchema = z.enum([
  'manual',
  'external-chat',
  'competitor-review',
  'provider-report',
  'search-console',
  'ga4',
  'google-ads',
]);

export const marketingResearchEvidenceSchema = z.object({
  label: z.string().min(1),
  kind: z.enum(['note', 'path', 'url', 'quote', 'report']),
  value: z.string().min(1),
});

export const marketingResearchRouteSchema = z.object({
  path: z.string().min(1),
  title: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  status: marketingResearchStatusSchema.optional(),
});

export const marketingResearchDecisionSchema = z.object({
  id: z.string().min(1),
  decision: z.string().min(1),
  rationale: z.string().min(1),
  status: marketingResearchStatusSchema.default('decided'),
  priority: marketingResearchPrioritySchema.optional(),
  routes: z.array(marketingResearchRouteSchema).default([]),
});

export const marketingResearchOpportunitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  routePath: z.string().min(1).optional(),
  pageType: z.string().min(1).optional(),
  audience: z.string().min(1).optional(),
  primaryKeyword: z.string().min(1).optional(),
  supportingKeywords: z.array(z.string().min(1)).default([]),
  priority: marketingResearchPrioritySchema,
  status: marketingResearchStatusSchema.default('planned'),
  rationale: z.string().min(1),
});

export const marketingResearchActionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  owner: z.string().min(1).optional(),
  status: z.enum(['todo', 'doing', 'done', 'blocked']).default('todo'),
  priority: marketingResearchPrioritySchema.default('p1'),
  summary: z.string().min(1),
});

export const marketingResearchRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: marketingResearchRecordKindSchema,
  priority: marketingResearchPrioritySchema,
  status: marketingResearchStatusSchema.default('active'),
  confidence: marketingResearchConfidenceSchema.default('medium'),
  capturedAt: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  routes: z.array(marketingResearchRouteSchema).default([]),
  keywords: z.array(z.string().min(1)).default([]),
  competitors: z.array(z.string().min(1)).default([]),
  findings: z.array(z.string().min(1)).default([]),
  decisions: z.array(marketingResearchDecisionSchema).default([]),
  opportunities: z.array(marketingResearchOpportunitySchema).default([]),
  rejectedIdeas: z.array(marketingResearchDecisionSchema).default([]),
  nextActions: z.array(marketingResearchActionSchema).default([]),
  evidence: z.array(marketingResearchEvidenceSchema).default([]),
});

export const marketingResearchMemoryFileSchema = z.object({
  version: z.literal(1),
  appId: z.string().min(1),
  title: z.string().min(1),
  source: z.object({
    kind: marketingResearchSourceKindSchema,
    label: z.string().min(1),
    capturedAt: z.string().min(1),
  }),
  records: z.array(marketingResearchRecordSchema).min(1),
});

export type MarketingResearchAction = z.infer<typeof marketingResearchActionSchema>;
export type MarketingResearchDecision = z.infer<typeof marketingResearchDecisionSchema>;
export type MarketingResearchEvidence = z.infer<typeof marketingResearchEvidenceSchema>;
export type MarketingResearchMemoryFile = z.infer<typeof marketingResearchMemoryFileSchema>;
export type MarketingResearchOpportunity = z.infer<typeof marketingResearchOpportunitySchema>;
export type MarketingResearchPriority = z.infer<typeof marketingResearchPrioritySchema>;
export type MarketingResearchRecord = z.infer<typeof marketingResearchRecordSchema>;
export type MarketingResearchStatus = z.infer<typeof marketingResearchStatusSchema>;
