import { z } from 'zod';
import { type OpsActionContext } from '@unisane/ops-engine/actions';
import {
  buildOpsWorkflowContextBrief,
  createOpsWorkflowHandoff,
  defineOpsWorkflowRun,
  opsWorkflowContextBriefSchema,
  opsWorkflowHandoffSchema,
  opsWorkflowPresentationSchema,
  opsWorkflowRunSchema,
} from '@unisane/ops-engine/workflows';
import { defineGrowthGoal, defineGrowthPlaybook } from './contracts.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const conciseTextSchema = z.string().trim().min(1).max(280);

export const growthSeoOpportunityGoal = defineGrowthGoal({
  id: 'growth.opportunity-discovery',
  version: 1,
  title: 'Choose the next Growth opportunity',
  description: 'Compare recorded evidence to find where focused work is most defensible.',
  outcome: 'Know which opportunity deserves review next, why, and what remains uncertain.',
  conversationStarters: [
    'Where should we focus our SEO work next?',
    'Which search opportunity has the strongest recorded evidence?',
    'Compare our SEO research and show me the safest next opportunity to review.',
  ],
});

export const growthSeoOpportunityPlaybook = defineGrowthPlaybook({
  id: 'growth.seo-opportunity-research',
  version: 1,
  goal: { id: growthSeoOpportunityGoal.id, version: growthSeoOpportunityGoal.version },
  title: 'SEO opportunity research',
  description:
    'Rank recorded SEO opportunities without turning estimated demand or inferred gaps into facts.',
  stages: [
    {
      id: 'understand-goal',
      title: 'Understand the goal',
      guidance: 'Confirm the project, environment, market, and decision the user needs to make.',
      actionReferences: [],
    },
    {
      id: 'inspect-evidence',
      title: 'Check recorded research',
      guidance: 'Load current keyword, market, competitor, search-result, and page evidence.',
      actionReferences: [{ id: 'growth.seo.opportunities.review', schemaVersion: 1 }],
    },
    {
      id: 'compare-opportunities',
      title: 'Compare opportunities',
      guidance: 'Rank only supported signals and keep uncertainty and limitations visible.',
      actionReferences: [],
    },
    {
      id: 'choose-next-step',
      title: 'Choose the next step',
      guidance: 'Review one leading opportunity in context before planning or changing a page.',
      actionReferences: [],
    },
    {
      id: 'verify-result',
      title: 'Check again',
      guidance: 'Re-run the comparison after research, page, or market evidence changes.',
      actionReferences: [{ id: 'growth.seo.opportunities.review', schemaVersion: 1 }],
    },
  ],
});

export const seoOpportunityEvidenceSchema = z
  .object({
    evidenceId: stableIdSchema,
    revision: z.number().int().positive(),
    kind: z.enum(['keyword', 'market', 'competitor', 'serp', 'page']),
    source: z.string().trim().min(1).max(160),
    observedAt: z.string().datetime({ offset: true }),
    freshness: z.enum(['fresh', 'stale', 'unknown']),
    summary: conciseTextSchema,
    status: z.enum(['current', 'conflicting']).default('current'),
  })
  .strict();
export type SeoOpportunityEvidence = z.infer<typeof seoOpportunityEvidenceSchema>;

export const seoOpportunityCandidateSchema = z
  .object({
    id: stableIdSchema,
    title: z.string().trim().min(1).max(140),
    routePath: z.string().startsWith('/').max(300).optional(),
    primaryKeyword: z.string().trim().min(1).max(160).optional(),
    market: z.string().trim().min(1).max(80).optional(),
    intent: z.string().trim().min(1).max(80).optional(),
    rationale: conciseTextSchema,
    signals: z
      .object({
        estimatedMonthlySearches: z.number().int().nonnegative().optional(),
        competitionIndex: z.number().min(0).max(100).optional(),
        currentPosition: z.number().positive().optional(),
        marketFit: z.enum(['strong', 'medium', 'weak']).optional(),
      })
      .strict(),
    evidence: z.array(seoOpportunityEvidenceSchema).min(1).max(5),
  })
  .strict();
export type SeoOpportunityCandidate = z.infer<typeof seoOpportunityCandidateSchema>;

export const rankedSeoOpportunitySchema = z
  .object({
    rank: z.number().int().positive(),
    id: stableIdSchema,
    title: z.string().trim().min(1).max(140),
    routePath: z.string().startsWith('/').max(300).optional(),
    primaryKeyword: z.string().trim().min(1).max(160).optional(),
    market: z.string().trim().min(1).max(80).optional(),
    intent: z.string().trim().min(1).max(80).optional(),
    score: z.number().int().nonnegative().max(100),
    confidence: z.enum(['low', 'medium', 'high']),
    signals: seoOpportunityCandidateSchema.shape.signals,
    rationale: conciseTextSchema,
    limitations: z.array(conciseTextSchema).max(8),
    provenance: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
    evidenceIds: z.array(stableIdSchema).min(1).max(5),
  })
  .strict();
export type RankedSeoOpportunity = z.infer<typeof rankedSeoOpportunitySchema>;

export const growthSeoOpportunitySnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    observedAt: z.string().datetime({ offset: true }),
    status: z.enum(['ready', 'attention', 'blocked']),
    totalCandidateCount: z.number().int().nonnegative(),
    returnedOpportunityCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    opportunities: z.array(rankedSeoOpportunitySchema).max(20),
    evidence: z.array(seoOpportunityEvidenceSchema).max(50),
  })
  .strict();
export type GrowthSeoOpportunitySnapshot = z.infer<typeof growthSeoOpportunitySnapshotSchema>;

export const growthSeoOpportunityWorkflowProjectionSchema = z
  .object({
    run: opsWorkflowRunSchema,
    contextBrief: opsWorkflowContextBriefSchema,
    handoff: opsWorkflowHandoffSchema,
    presentation: opsWorkflowPresentationSchema,
  })
  .strict();
export type GrowthSeoOpportunityWorkflowProjection = z.infer<
  typeof growthSeoOpportunityWorkflowProjectionSchema
>;

function confidenceFor(candidate: SeoOpportunityCandidate): RankedSeoOpportunity['confidence'] {
  if (candidate.evidence.some((item) => item.status === 'conflicting')) return 'low';
  const kinds = new Set(candidate.evidence.map((item) => item.kind)).size;
  const current = candidate.evidence.filter((item) => item.freshness === 'fresh').length;
  if (kinds >= 3 && current === candidate.evidence.length) return 'high';
  if (kinds >= 2 && current > 0) return 'medium';
  return 'low';
}

function limitationsFor(candidate: SeoOpportunityCandidate): string[] {
  const limitations: string[] = [];
  if (candidate.signals.estimatedMonthlySearches === undefined) {
    limitations.push('Estimated search demand is not available.');
  }
  if (candidate.signals.competitionIndex === undefined) {
    limitations.push('Comparable competition evidence is not available.');
  }
  if (!candidate.market)
    limitations.push('A specific country and language market is not recorded.');
  if (candidate.evidence.some((item) => item.freshness === 'stale')) {
    limitations.push('Some supporting research is stale.');
  }
  if (candidate.evidence.some((item) => item.freshness === 'unknown')) {
    limitations.push('Some supporting research has unknown freshness.');
  }
  if (candidate.evidence.some((item) => item.status === 'conflicting')) {
    limitations.push('Recorded sources disagree and need review.');
  }
  if (new Set(candidate.evidence.map((item) => item.kind)).size < 2) {
    limitations.push('Only one evidence type supports this opportunity.');
  }
  return limitations;
}

function scoreCandidate(candidate: SeoOpportunityCandidate): number {
  const kinds = new Set(candidate.evidence.map((item) => item.kind)).size;
  const evidenceScore = Math.min(20, kinds * 4);
  const fitScore =
    candidate.signals.marketFit === 'strong'
      ? 25
      : candidate.signals.marketFit === 'medium'
        ? 15
        : candidate.signals.marketFit === 'weak'
          ? 5
          : 0;
  const demandScore =
    candidate.signals.estimatedMonthlySearches === undefined
      ? 0
      : Math.min(25, Math.log10(candidate.signals.estimatedMonthlySearches + 1) * 5);
  const competitionScore =
    candidate.signals.competitionIndex === undefined
      ? 0
      : ((100 - candidate.signals.competitionIndex) / 100) * 15;
  const position = candidate.signals.currentPosition;
  const visibilityScore =
    position === undefined ? 0 : position > 20 ? 15 : position > 10 ? 10 : position > 3 ? 4 : 0;
  const conflictPenalty = candidate.evidence.some((item) => item.status === 'conflicting') ? 15 : 0;
  const stalePenalty = candidate.evidence.every((item) => item.freshness !== 'fresh') ? 10 : 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        evidenceScore +
          fitScore +
          demandScore +
          competitionScore +
          visibilityScore -
          conflictPenalty -
          stalePenalty,
      ),
    ),
  );
}

export function rankSeoOpportunityCandidates(input: {
  candidates: readonly SeoOpportunityCandidate[];
  limit: number;
  market?: string;
}): RankedSeoOpportunity[] {
  const candidates = z.array(seoOpportunityCandidateSchema).max(500).parse(input.candidates);
  const limit = z.number().int().min(1).max(20).parse(input.limit);
  const market = input.market?.trim().toLowerCase();
  return candidates
    .filter((candidate) => !market || candidate.market?.toLowerCase() === market)
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate),
      confidence: confidenceFor(candidate),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        { high: 0, medium: 1, low: 2 }[left.confidence] -
          { high: 0, medium: 1, low: 2 }[right.confidence] ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .slice(0, limit)
    .map(({ candidate, score, confidence }, index) =>
      rankedSeoOpportunitySchema.parse({
        rank: index + 1,
        id: candidate.id,
        title: candidate.title,
        ...(candidate.routePath ? { routePath: candidate.routePath } : {}),
        ...(candidate.primaryKeyword ? { primaryKeyword: candidate.primaryKeyword } : {}),
        ...(candidate.market ? { market: candidate.market } : {}),
        ...(candidate.intent ? { intent: candidate.intent } : {}),
        score,
        confidence,
        signals: candidate.signals,
        rationale: candidate.rationale,
        limitations: limitationsFor(candidate),
        provenance: [...new Set(candidate.evidence.map((item) => item.source))],
        evidenceIds: candidate.evidence.map((item) => item.evidenceId),
      }),
    );
}

export function projectGrowthSeoOpportunityPresentation(input: GrowthSeoOpportunitySnapshot) {
  const snapshot = growthSeoOpportunitySnapshotSchema.parse(input);
  const leading = snapshot.opportunities[0];
  if (!leading) {
    return opsWorkflowPresentationSchema.parse({
      headline: 'SEO opportunity guidance needs recorded research.',
      whyItMatters: 'No supported opportunity is available for the selected project and market.',
      nextStep: {
        label: 'Review SEO research evidence',
        reason: 'Record or refresh keyword, market, competitor, search-result, or page evidence.',
        deepLink: '/seo/research',
      },
      supportingReason: 'The workflow does not infer demand or opportunity without evidence.',
    });
  }
  if (snapshot.status === 'attention') {
    return opsWorkflowPresentationSchema.parse({
      headline: 'SEO opportunities need cautious review.',
      whyItMatters: 'The leading options have stale, conflicting, or limited supporting evidence.',
      nextStep: {
        label: `Review ${leading.title}`,
        reason: leading.limitations[0] ?? leading.rationale,
        deepLink: '/seo/research',
      },
      supportingReason: `${leading.confidence} confidence from ${leading.provenance.length} recorded source${leading.provenance.length === 1 ? '' : 's'}.`,
    });
  }
  return opsWorkflowPresentationSchema.parse({
    headline: `${snapshot.returnedOpportunityCount} SEO opportunit${snapshot.returnedOpportunityCount === 1 ? 'y is' : 'ies are'} supported by recorded evidence.`,
    whyItMatters: 'The ranking compares only available signals and preserves uncertainty.',
    nextStep: {
      label: `Review ${leading.title}`,
      reason: leading.rationale,
      deepLink: '/seo/research',
    },
    supportingReason: `${leading.confidence} confidence from ${leading.provenance.length} recorded source${leading.provenance.length === 1 ? '' : 's'}.`,
  });
}

function workflowEvidenceKind(evidence: SeoOpportunityEvidence) {
  if (evidence.status === 'conflicting') return 'conflicting' as const;
  if (evidence.kind === 'keyword' || evidence.kind === 'market') return 'estimated' as const;
  return 'observed' as const;
}

export function createGrowthSeoOpportunityWorkflowProjection(input: {
  runId: string;
  briefId: string;
  handoffId: string;
  context: OpsActionContext;
  snapshot: GrowthSeoOpportunitySnapshot;
}): GrowthSeoOpportunityWorkflowProjection {
  const snapshot = growthSeoOpportunitySnapshotSchema.parse(input.snapshot);
  const presentation = projectGrowthSeoOpportunityPresentation(snapshot);
  const run = defineOpsWorkflowRun({
    schemaVersion: 1,
    kind: 'ops.workflow-run',
    runId: input.runId,
    revision: 1,
    goal: { id: growthSeoOpportunityGoal.id, version: growthSeoOpportunityGoal.version },
    playbook: {
      id: growthSeoOpportunityPlaybook.id,
      version: growthSeoOpportunityPlaybook.version,
    },
    context: {
      scopeId: input.context.scopeId,
      projectId: input.context.projectId,
      environmentId: input.context.environmentId,
      ...(input.context.targetId ? { targetId: input.context.targetId } : {}),
      principal: input.context.principal,
    },
    status: snapshot.status === 'blocked' ? 'blocked' : 'ready',
    currentStageId: snapshot.status === 'blocked' ? 'inspect-evidence' : 'choose-next-step',
    evidence: snapshot.evidence.map((evidence) => ({
      evidenceId: evidence.evidenceId,
      revision: evidence.revision,
      kind: workflowEvidenceKind(evidence),
      source: evidence.source,
      observedAt: evidence.observedAt,
      freshness:
        evidence.freshness === 'fresh'
          ? 'fresh'
          : evidence.freshness === 'stale'
            ? 'stale'
            : 'unknown',
      summary: evidence.summary,
      status: 'current',
    })),
    startedAt: input.context.requestedAt,
    updatedAt: snapshot.observedAt,
  });
  const contextBrief = buildOpsWorkflowContextBrief({
    briefId: input.briefId,
    run,
    presentation,
    generatedAt: snapshot.observedAt,
  });
  const handoff = createOpsWorkflowHandoff({
    handoffId: input.handoffId,
    run,
    contextBrief,
    createdAt: snapshot.observedAt,
  });
  return growthSeoOpportunityWorkflowProjectionSchema.parse({
    run,
    contextBrief,
    handoff,
    presentation,
  });
}
