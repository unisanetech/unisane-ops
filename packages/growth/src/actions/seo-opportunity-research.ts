import { z } from 'zod';
import { defineOpsReadAction, type OpsActionContext } from '@unisane/ops-engine/actions';
import {
  createGrowthSeoOpportunityWorkflowProjection,
  growthSeoOpportunitySnapshotSchema,
  growthSeoOpportunityWorkflowProjectionSchema,
  rankSeoOpportunityCandidates,
  seoOpportunityCandidateSchema,
  seoOpportunityEvidenceSchema,
  type SeoOpportunityCandidate,
} from '../playbooks/seo-opportunity-research.js';

export const growthSeoOpportunityResearchInputSchema = z
  .object({
    market: z.string().trim().min(1).max(80).optional(),
    opportunityLimit: z.number().int().min(1).max(10).default(10),
  })
  .strict();
export type GrowthSeoOpportunityResearchInput = z.infer<
  typeof growthSeoOpportunityResearchInputSchema
>;

export const growthSeoOpportunityResearchOutputSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.string(),
    environmentId: z.string(),
    observedAt: z.string().datetime({ offset: true }),
    status: z.enum(['ready', 'attention', 'blocked']),
    totalCandidateCount: z.number().int().nonnegative(),
    returnedOpportunityCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    opportunities: growthSeoOpportunitySnapshotSchema.shape.opportunities,
    evidence: z.array(seoOpportunityEvidenceSchema).max(50),
    workflow: growthSeoOpportunityWorkflowProjectionSchema,
  })
  .strict();
export type GrowthSeoOpportunityResearchOutput = z.infer<
  typeof growthSeoOpportunityResearchOutputSchema
>;

export interface GrowthSeoOpportunityResearchDependencies {
  loadCandidates(
    context: OpsActionContext,
  ): readonly SeoOpportunityCandidate[] | Promise<readonly SeoOpportunityCandidate[]>;
  now?: () => Date;
}

function uniqueEvidence(candidates: readonly SeoOpportunityCandidate[]) {
  const evidence = new Map<string, z.infer<typeof seoOpportunityEvidenceSchema>>();
  for (const candidate of candidates) {
    for (const item of candidate.evidence) {
      const current = evidence.get(item.evidenceId);
      if (!current || item.revision > current.revision) evidence.set(item.evidenceId, item);
    }
  }
  return [...evidence.values()].slice(0, 50);
}

function snapshotStatus(input: {
  opportunities: ReturnType<typeof rankSeoOpportunityCandidates>;
  candidates: readonly SeoOpportunityCandidate[];
}) {
  if (input.opportunities.length === 0) return 'blocked' as const;
  if (
    input.opportunities[0]?.confidence === 'low' ||
    input.candidates.some((candidate) =>
      candidate.evidence.some(
        (evidence) => evidence.freshness !== 'fresh' || evidence.status === 'conflicting',
      ),
    )
  ) {
    return 'attention' as const;
  }
  return 'ready' as const;
}

export function createGrowthSeoOpportunityResearchAction(
  dependencies: GrowthSeoOpportunityResearchDependencies,
) {
  return defineOpsReadAction({
    id: 'growth.seo.opportunities.review',
    schemaVersion: 1,
    maximumEffect: 'offline',
    inputSchema: growthSeoOpportunityResearchInputSchema,
    outputSchema: growthSeoOpportunityResearchOutputSchema,
    async execute(input, context) {
      const allCandidates = z
        .array(seoOpportunityCandidateSchema)
        .max(500)
        .parse(await dependencies.loadCandidates(context));
      const normalizedMarket = input.market?.toLowerCase();
      const candidates = allCandidates.filter(
        (candidate) => !normalizedMarket || candidate.market?.toLowerCase() === normalizedMarket,
      );
      const opportunities = rankSeoOpportunityCandidates({
        candidates,
        limit: input.opportunityLimit,
      });
      const returnedIds = new Set(opportunities.map((opportunity) => opportunity.id));
      const returnedCandidates = candidates.filter((candidate) => returnedIds.has(candidate.id));
      const observedAt = (dependencies.now ?? (() => new Date()))().toISOString();
      const snapshot = growthSeoOpportunitySnapshotSchema.parse({
        schemaVersion: 1,
        projectId: context.projectId,
        environmentId: context.environmentId,
        observedAt,
        status: snapshotStatus({ opportunities, candidates: returnedCandidates }),
        totalCandidateCount: candidates.length,
        returnedOpportunityCount: opportunities.length,
        truncated: opportunities.length < candidates.length,
        opportunities,
        evidence: uniqueEvidence(returnedCandidates),
      });
      return growthSeoOpportunityResearchOutputSchema.parse({
        ...snapshot,
        workflow: createGrowthSeoOpportunityWorkflowProjection({
          runId: `workflow.${context.requestId}`,
          briefId: `brief.${context.requestId}`,
          handoffId: `handoff.${context.requestId}`,
          context,
          snapshot,
        }),
      });
    },
  });
}
