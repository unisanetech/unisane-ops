import { z } from 'zod';
import { type OpsActionContext } from '@unisane/ops-engine/actions';
import { opsReadinessFindingSchema, type OpsReadinessFinding } from '@unisane/ops-engine/readiness';
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
import { deriveEvidenceRevision } from './evidence-revision.js';

export const growthHealthReviewGoal = defineGrowthGoal({
  id: 'growth.health',
  version: 1,
  title: 'Understand Growth health',
  description: 'Check whether current Growth evidence is trustworthy enough to guide work.',
  outcome: 'Know what is usable, what needs attention, and the safest useful next step.',
  conversationStarters: [
    'Is my Growth data reliable enough to make a decision?',
    'What should I fix before working on acquisition?',
    'Check my Growth setup and tell me what matters first.',
  ],
});

export const growthHealthReviewPlaybook = defineGrowthPlaybook({
  id: 'growth.health-review',
  version: 1,
  goal: { id: growthHealthReviewGoal.id, version: growthHealthReviewGoal.version },
  title: 'Growth health review',
  description:
    'Establish project, connection, freshness, and measurement trust before recommending work.',
  stages: [
    {
      id: 'understand-goal',
      title: 'Understand the goal',
      guidance: 'Confirm the project and environment that the user wants to review.',
      actionReferences: [],
    },
    {
      id: 'inspect-evidence',
      title: 'Check available evidence',
      guidance: 'Inspect current Growth readiness without changing provider or project state.',
      actionReferences: [{ id: 'growth.health.review', schemaVersion: 2 }],
    },
    {
      id: 'explain-priority',
      title: 'Explain what matters',
      guidance: 'Present the outcome, reason, and one useful next step in plain language.',
      actionReferences: [],
    },
    {
      id: 'verify-result',
      title: 'Check again',
      guidance: 'Re-run the same review after evidence or configuration changes.',
      actionReferences: [{ id: 'growth.health.review', schemaVersion: 2 }],
    },
  ],
});

export const growthHealthReviewSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.string(),
    environmentId: z.string(),
    observedAt: z.string().datetime({ offset: true }),
    status: z.enum(['ready', 'attention', 'blocked']),
    blockingCount: z.number().int().nonnegative(),
    attentionCount: z.number().int().nonnegative(),
    totalFindingCount: z.number().int().nonnegative(),
    returnedFindingCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    findings: z.array(opsReadinessFindingSchema).max(100),
  })
  .strict();
export type GrowthHealthReviewSnapshot = z.infer<typeof growthHealthReviewSnapshotSchema>;

export const growthHealthReviewPresentationSchema = opsWorkflowPresentationSchema;
export type GrowthHealthReviewPresentation = z.infer<typeof growthHealthReviewPresentationSchema>;

export const growthHealthReviewWorkflowProjectionSchema = z
  .object({
    run: opsWorkflowRunSchema,
    contextBrief: opsWorkflowContextBriefSchema,
    handoff: opsWorkflowHandoffSchema,
    presentation: growthHealthReviewPresentationSchema,
  })
  .strict();
export type GrowthHealthReviewWorkflowProjection = z.infer<
  typeof growthHealthReviewWorkflowProjectionSchema
>;

function findingDeepLink(finding: OpsReadinessFinding | undefined): string {
  if (!finding) return '/overview';
  if (finding.dimension === 'connection' || finding.dimension === 'resource') {
    return '/connections';
  }
  if (
    finding.dimension === 'instrumentation' ||
    finding.dimension === 'data' ||
    finding.dimension === 'business-truth'
  ) {
    return '/analytics';
  }
  return '/overview';
}

export function projectGrowthHealthReviewPresentation(
  input: GrowthHealthReviewSnapshot,
): GrowthHealthReviewPresentation {
  const snapshot = growthHealthReviewSnapshotSchema.parse(input);
  const primaryFinding =
    snapshot.findings.find((finding) => finding.blocking) ??
    snapshot.findings.find((finding) => finding.state !== 'ready');
  if (snapshot.status === 'ready') {
    return growthHealthReviewPresentationSchema.parse({
      headline: 'Growth evidence is ready to use.',
      whyItMatters: 'Current project and data checks did not find a blocker.',
      nextStep: {
        label: 'Review the highest-impact priority',
        reason: 'The available evidence is usable for this environment.',
        deepLink: '/overview',
      },
      supportingReason: 'No required Growth check needs attention right now.',
    });
  }
  const blocked = snapshot.status === 'blocked';
  const nextActionLabel =
    primaryFinding?.nextAction?.label ??
    (blocked ? 'Resolve the blocking setup issue' : 'Review the affected evidence');
  return growthHealthReviewPresentationSchema.parse({
    headline: blocked
      ? 'Growth guidance is blocked for now.'
      : 'Some Growth evidence needs attention.',
    whyItMatters: blocked
      ? `${snapshot.blockingCount} required check${snapshot.blockingCount === 1 ? '' : 's'} must be resolved before recommendations can be trusted.`
      : `${snapshot.attentionCount} check${snapshot.attentionCount === 1 ? '' : 's'} may affect how current results should be interpreted.`,
    nextStep: {
      label: nextActionLabel,
      reason: primaryFinding?.summary ?? 'Review the latest Growth evidence before continuing.',
      deepLink: findingDeepLink(primaryFinding),
    },
    supportingReason:
      primaryFinding?.summary ?? 'The current review found evidence that should be checked.',
  });
}

function evidenceKind(finding: OpsReadinessFinding) {
  if (finding.state === 'conflicted') return 'conflicting' as const;
  if (
    finding.state === 'missing' ||
    finding.state === 'not-connected' ||
    finding.state === 'not-selected' ||
    finding.state === 'no-signal'
  ) {
    return 'missing' as const;
  }
  return 'observed' as const;
}

export function createGrowthHealthReviewWorkflowProjection(input: {
  runId: string;
  briefId: string;
  handoffId: string;
  context: OpsActionContext;
  snapshot: GrowthHealthReviewSnapshot;
}): GrowthHealthReviewWorkflowProjection {
  const snapshot = growthHealthReviewSnapshotSchema.parse(input.snapshot);
  const presentation = projectGrowthHealthReviewPresentation(snapshot);
  const run = defineOpsWorkflowRun({
    schemaVersion: 1,
    kind: 'ops.workflow-run',
    runId: input.runId,
    revision: 1,
    goal: { id: growthHealthReviewGoal.id, version: growthHealthReviewGoal.version },
    playbook: {
      id: growthHealthReviewPlaybook.id,
      version: growthHealthReviewPlaybook.version,
    },
    context: {
      scopeId: input.context.scopeId,
      projectId: input.context.projectId,
      environmentId: input.context.environmentId,
      ...(input.context.targetId ? { targetId: input.context.targetId } : {}),
      principal: input.context.principal,
    },
    status: snapshot.status === 'blocked' ? 'blocked' : 'ready',
    currentStageId: snapshot.status === 'blocked' ? 'inspect-evidence' : 'explain-priority',
    evidence: snapshot.findings.slice(0, 50).map((finding, index) => ({
      evidenceId: `${finding.code}.${index + 1}`,
      revision: deriveEvidenceRevision([
        finding.code,
        finding.state,
        finding.summary,
        finding.evidence[0]?.source,
        finding.evidence[0]?.freshness,
      ]),
      kind: evidenceKind(finding),
      source: finding.evidence[0]?.source ?? 'Growth readiness',
      observedAt: finding.observedAt,
      freshness: finding.evidence[0]?.freshness ?? 'unknown',
      summary: finding.summary,
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
  return growthHealthReviewWorkflowProjectionSchema.parse({
    run,
    contextBrief,
    handoff,
    presentation,
  });
}
