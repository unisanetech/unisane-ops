import { z } from 'zod';
import {
  rankedSeoOpportunitySchema,
  seoOpportunityCandidateSchema,
  type RankedSeoOpportunity,
  type SeoOpportunityCandidate,
  type SeoOpportunityEvidence,
} from './seo-opportunity-research.js';

export const seoResearchSourceSchema = z.enum([
  'site-page',
  'search-console',
  'keyword-demand',
  'market',
  'competitor-page',
  'serp',
]);

export const seoResearchRequestSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
    opportunityId: rankedSeoOpportunitySchema.shape.id,
    source: seoResearchSourceSchema,
    mode: z.enum(['collect', 'refresh', 'resolve-conflict']),
    priority: z.enum(['required', 'recommended']),
    costClass: z.enum(['local-read', 'public-fetch', 'provider-query']),
    target: z
      .object({
        routePath: z.string().startsWith('/').max(300).optional(),
        primaryKeyword: z.string().trim().min(1).max(160).optional(),
        market: z.string().trim().min(1).max(80).optional(),
      })
      .strict(),
    reason: z.string().trim().min(1).max(280),
    conversationStarter: z.string().trim().min(1).max(280),
    deepLink: z.string().startsWith('/'),
    automatic: z.literal(false),
  })
  .strict();

export const seoOpportunityResearchPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.enum(['not-applicable', 'complete', 'recommended', 'required']),
    totalRequestCount: z.number().int().nonnegative(),
    returnedRequestCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    requests: z.array(seoResearchRequestSchema).max(20),
    executionPolicy: z.literal('explicit-user-or-automation-authority-required'),
  })
  .strict();

export type SeoResearchSource = z.infer<typeof seoResearchSourceSchema>;
export type SeoResearchRequest = z.infer<typeof seoResearchRequestSchema>;
export type SeoOpportunityResearchPlan = z.infer<typeof seoOpportunityResearchPlanSchema>;

type RequestInput = Omit<
  SeoResearchRequest,
  'id' | 'automatic' | 'deepLink' | 'target' | 'conversationStarter'
>;

const SOURCE_ORDER: Record<SeoResearchSource, number> = {
  'site-page': 0,
  'search-console': 1,
  'keyword-demand': 2,
  market: 3,
  serp: 4,
  'competitor-page': 5,
};

const PRIORITY_ORDER: Record<SeoResearchRequest['priority'], number> = {
  required: 0,
  recommended: 1,
};

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'research'
  );
}

function sourceForEvidence(evidence: SeoOpportunityEvidence): SeoResearchSource {
  if (evidence.kind === 'keyword') return 'keyword-demand';
  if (evidence.kind === 'market') return 'market';
  if (evidence.kind === 'competitor') return 'competitor-page';
  if (evidence.kind === 'serp') return 'serp';
  return 'site-page';
}

function costClass(source: SeoResearchSource): SeoResearchRequest['costClass'] {
  if (source === 'site-page' || source === 'competitor-page') {
    return 'public-fetch';
  }
  if (source === 'search-console' || source === 'keyword-demand' || source === 'serp') {
    return 'provider-query';
  }
  return 'local-read';
}

function targetFor(opportunity: RankedSeoOpportunity): SeoResearchRequest['target'] {
  return {
    ...(opportunity.routePath ? { routePath: opportunity.routePath } : {}),
    ...(opportunity.primaryKeyword ? { primaryKeyword: opportunity.primaryKeyword } : {}),
    ...(opportunity.market ? { market: opportunity.market } : {}),
  };
}

function starter(input: {
  source: SeoResearchSource;
  mode: SeoResearchRequest['mode'];
  opportunity: RankedSeoOpportunity;
}): string {
  const subject = input.opportunity.primaryKeyword
    ? `“${input.opportunity.primaryKeyword}”`
    : input.opportunity.title;
  const verbs: Record<SeoResearchSource, string> = {
    'site-page': 'check the current site page evidence for',
    'search-console': 'refresh Search Console page evidence for',
    'keyword-demand': 'collect current keyword demand evidence for',
    market: 'confirm the target market for',
    'competitor-page': 'record relevant competitor page evidence for',
    serp: 'capture a current search-result snapshot for',
  };
  const prefix =
    input.mode === 'resolve-conflict' ? 'Resolve the conflicting evidence and' : 'Please';
  return `${prefix} ${verbs[input.source]} ${subject}. Keep the research bounded to this opportunity.`;
}

function createRequest(opportunity: RankedSeoOpportunity, input: RequestInput): SeoResearchRequest {
  return seoResearchRequestSchema.parse({
    ...input,
    id: stableId(`${opportunity.id}.${input.source}.${input.mode}.${input.priority}`),
    target: targetFor(opportunity),
    conversationStarter: starter({
      source: input.source,
      mode: input.mode,
      opportunity,
    }),
    deepLink: '/seo/research',
    automatic: false,
  });
}

function requestForEvidence(
  opportunity: RankedSeoOpportunity,
  evidence: SeoOpportunityEvidence,
): SeoResearchRequest[] {
  const source = sourceForEvidence(evidence);
  const requests: SeoResearchRequest[] = [];
  const add = (
    mode: SeoResearchRequest['mode'],
    priority: SeoResearchRequest['priority'],
    reason: string,
    requestSource = source,
  ) => {
    requests.push(
      createRequest(opportunity, {
        opportunityId: opportunity.id,
        source: requestSource,
        mode,
        priority,
        costClass: costClass(requestSource),
        reason,
      }),
    );
  };

  if (evidence.status === 'conflicting' || evidence.issues.includes('ambiguous-page')) {
    add(
      'resolve-conflict',
      'required',
      'Recorded evidence conflicts or identifies more than one target.',
    );
  }
  if (evidence.issues.includes('market-mismatch')) {
    add(
      'resolve-conflict',
      'required',
      'The recorded evidence does not match the opportunity market.',
    );
  }
  if (evidence.issues.includes('crawl-failed')) {
    add(
      'refresh',
      'required',
      'The current page could not be crawled, so its page facts are unknown.',
    );
  }
  if (evidence.sampleData) {
    add('collect', 'required', 'Sample evidence cannot support a live decision.');
  } else if (evidence.freshness === 'stale') {
    add('refresh', 'required', 'This supporting evidence is stale.');
  } else if (evidence.freshness === 'unknown') {
    add('collect', 'recommended', 'The freshness of this supporting evidence is unknown.');
  }
  if (evidence.issues.includes('search-performance-missing')) {
    add(
      'collect',
      'recommended',
      'No page-level Search Console evidence is recorded for the current page.',
      'search-console',
    );
  }
  return requests;
}

function missingEvidenceRequests(input: {
  opportunity: RankedSeoOpportunity;
  candidate: SeoOpportunityCandidate;
}): SeoResearchRequest[] {
  const { opportunity, candidate } = input;
  const kinds = new Set(candidate.evidence.map((evidence) => evidence.kind));
  const requests: SeoResearchRequest[] = [];
  const add = (
    source: SeoResearchSource,
    priority: SeoResearchRequest['priority'],
    reason: string,
  ) => {
    requests.push(
      createRequest(opportunity, {
        opportunityId: opportunity.id,
        source,
        mode: 'collect',
        priority,
        costClass: costClass(source),
        reason,
      }),
    );
  };

  if (opportunity.signals.estimatedMonthlySearches === undefined) {
    add('keyword-demand', 'required', 'Comparable keyword demand is not recorded.');
  }
  if (!opportunity.market)
    add('market', 'required', 'A country and language market is not recorded.');
  if (!kinds.has('page'))
    add('site-page', 'recommended', 'No current site-page evidence is attached.');
  if (!kinds.has('serp'))
    add('serp', 'recommended', 'No current search-result evidence is attached.');
  if (!kinds.has('competitor')) {
    add('competitor-page', 'recommended', 'No relevant competitor page evidence is attached.');
  }
  return requests;
}

export function planSeoOpportunityResearch(input: {
  candidates: readonly SeoOpportunityCandidate[];
  opportunities: readonly RankedSeoOpportunity[];
  limit?: number;
}): SeoOpportunityResearchPlan {
  const candidates = z.array(seoOpportunityCandidateSchema).max(500).parse(input.candidates);
  const opportunities = z.array(rankedSeoOpportunitySchema).max(20).parse(input.opportunities);
  const limit = z
    .number()
    .int()
    .min(1)
    .max(20)
    .parse(input.limit ?? 12);
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const deduplicated = new Map<string, SeoResearchRequest>();

  opportunities.forEach((opportunity) => {
    const candidate = candidateById.get(opportunity.id);
    if (!candidate) return;
    const requests = [
      ...candidate.evidence.flatMap((evidence) => requestForEvidence(opportunity, evidence)),
      ...missingEvidenceRequests({ opportunity, candidate }),
    ];
    requests.forEach((request) => {
      const key = `${request.opportunityId}:${request.source}:${request.mode}`;
      const current = deduplicated.get(key);
      if (!current || (current.priority === 'recommended' && request.priority === 'required')) {
        deduplicated.set(key, request);
      }
    });
  });

  const allRequests = [...deduplicated.values()].sort(
    (left, right) =>
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
      opportunities.findIndex((item) => item.id === left.opportunityId) -
        opportunities.findIndex((item) => item.id === right.opportunityId) ||
      SOURCE_ORDER[left.source] - SOURCE_ORDER[right.source] ||
      left.id.localeCompare(right.id),
  );
  const requests = allRequests.slice(0, limit);
  return seoOpportunityResearchPlanSchema.parse({
    schemaVersion: 1,
    status:
      opportunities.length === 0
        ? 'not-applicable'
        : allRequests.length === 0
          ? 'complete'
          : allRequests.some((request) => request.priority === 'required')
            ? 'required'
            : 'recommended',
    totalRequestCount: allRequests.length,
    returnedRequestCount: requests.length,
    truncated: requests.length < allRequests.length,
    requests,
    executionPolicy: 'explicit-user-or-automation-authority-required',
  });
}
