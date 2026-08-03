import { z } from 'zod';
import { opsPrincipalSchema } from './actions.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const conciseTextSchema = nonEmptySchema.max(280);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const opsWorkflowContextSchema = z
  .object({
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    targetId: stableIdSchema.optional(),
    principal: opsPrincipalSchema,
  })
  .strict();
export type OpsWorkflowContext = z.infer<typeof opsWorkflowContextSchema>;

export const opsWorkflowContractReferenceSchema = z
  .object({
    id: stableIdSchema,
    version: z.number().int().positive(),
  })
  .strict();
export type OpsWorkflowContractReference = z.infer<typeof opsWorkflowContractReferenceSchema>;

export const opsWorkflowEvidenceReferenceSchema = z
  .object({
    evidenceId: stableIdSchema,
    revision: z.number().int().positive(),
    kind: z.enum([
      'observed',
      'estimated',
      'provider-attributed',
      'sample',
      'missing',
      'conflicting',
    ]),
    source: nonEmptySchema.max(160),
    observedAt: isoTimestampSchema.optional(),
    freshness: z.enum(['fresh', 'warming', 'stale', 'unknown']),
    summary: conciseTextSchema,
    status: z.enum(['current', 'invalidated']),
    invalidatedAt: isoTimestampSchema.optional(),
    invalidationReason: conciseTextSchema.optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    const hasInvalidation =
      evidence.invalidatedAt !== undefined || evidence.invalidationReason !== undefined;
    if (evidence.status === 'invalidated' && !hasInvalidation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalidated workflow evidence must explain when or why it was invalidated.',
      });
    }
    if (evidence.status === 'current' && hasInvalidation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current workflow evidence cannot carry invalidation metadata.',
      });
    }
  });
export type OpsWorkflowEvidenceReference = z.infer<typeof opsWorkflowEvidenceReferenceSchema>;

export const opsWorkflowNextStepSchema = z
  .object({
    label: nonEmptySchema.max(120),
    reason: conciseTextSchema,
    actionId: stableIdSchema.optional(),
    deepLink: z.string().startsWith('/').max(300).optional(),
  })
  .strict();
export type OpsWorkflowNextStep = z.infer<typeof opsWorkflowNextStepSchema>;

export const opsWorkflowRunSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.workflow-run'),
    runId: stableIdSchema,
    revision: z.number().int().positive(),
    goal: opsWorkflowContractReferenceSchema,
    playbook: opsWorkflowContractReferenceSchema,
    context: opsWorkflowContextSchema,
    status: z.enum(['active', 'blocked', 'ready', 'completed']),
    currentStageId: stableIdSchema,
    evidence: z.array(opsWorkflowEvidenceReferenceSchema).max(50),
    startedAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .strict();
export type OpsWorkflowRun = z.infer<typeof opsWorkflowRunSchema>;

export const opsWorkflowPresentationSchema = z
  .object({
    headline: nonEmptySchema.max(140),
    whyItMatters: conciseTextSchema,
    nextStep: opsWorkflowNextStepSchema,
    supportingReason: conciseTextSchema,
  })
  .strict();
export type OpsWorkflowPresentation = z.infer<typeof opsWorkflowPresentationSchema>;

export const opsWorkflowContextBriefSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.workflow-context-brief'),
    briefId: stableIdSchema,
    runId: stableIdSchema,
    runRevision: z.number().int().positive(),
    generatedAt: isoTimestampSchema,
    context: opsWorkflowContextSchema,
    goal: opsWorkflowContractReferenceSchema,
    playbook: opsWorkflowContractReferenceSchema,
    currentStageId: stableIdSchema,
    presentation: opsWorkflowPresentationSchema,
    evidence: z.array(opsWorkflowEvidenceReferenceSchema).max(20),
    invalidatedEvidenceIds: z.array(stableIdSchema).max(20),
  })
  .strict();
export type OpsWorkflowContextBrief = z.infer<typeof opsWorkflowContextBriefSchema>;

export const opsWorkflowHandoffSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.workflow-handoff'),
    handoffId: stableIdSchema,
    runId: stableIdSchema,
    runRevision: z.number().int().positive(),
    contextBriefId: stableIdSchema,
    goal: opsWorkflowContractReferenceSchema,
    playbook: opsWorkflowContractReferenceSchema,
    context: opsWorkflowContextSchema,
    currentStageId: stableIdSchema,
    nextStep: opsWorkflowNextStepSchema,
    evidenceRevisions: z
      .array(
        z
          .object({
            evidenceId: stableIdSchema,
            revision: z.number().int().positive(),
          })
          .strict(),
      )
      .max(20),
    createdAt: isoTimestampSchema,
  })
  .strict();
export type OpsWorkflowHandoff = z.infer<typeof opsWorkflowHandoffSchema>;

export const opsWorkflowResumeResultSchema = z
  .object({
    status: z.enum(['resumable', 'run-changed', 'evidence-changed']),
    runId: stableIdSchema,
    currentStageId: stableIdSchema,
    nextStep: opsWorkflowNextStepSchema.optional(),
    changedEvidenceIds: z.array(stableIdSchema).max(20),
  })
  .strict();
export type OpsWorkflowResumeResult = z.infer<typeof opsWorkflowResumeResultSchema>;

export function defineOpsWorkflowRun(input: OpsWorkflowRun): OpsWorkflowRun {
  return opsWorkflowRunSchema.parse(input);
}

export function buildOpsWorkflowContextBrief(input: {
  briefId: string;
  run: OpsWorkflowRun;
  presentation: OpsWorkflowPresentation;
  generatedAt: string;
  evidenceLimit?: number;
}): OpsWorkflowContextBrief {
  const run = opsWorkflowRunSchema.parse(input.run);
  const evidenceLimit = z
    .number()
    .int()
    .min(1)
    .max(20)
    .parse(input.evidenceLimit ?? 12);
  const currentEvidence = run.evidence
    .filter((evidence) => evidence.status === 'current')
    .slice(0, evidenceLimit);
  return opsWorkflowContextBriefSchema.parse({
    schemaVersion: 1,
    kind: 'ops.workflow-context-brief',
    briefId: input.briefId,
    runId: run.runId,
    runRevision: run.revision,
    generatedAt: input.generatedAt,
    context: run.context,
    goal: run.goal,
    playbook: run.playbook,
    currentStageId: run.currentStageId,
    presentation: input.presentation,
    evidence: currentEvidence,
    invalidatedEvidenceIds: run.evidence
      .filter((evidence) => evidence.status === 'invalidated')
      .slice(0, 20)
      .map((evidence) => evidence.evidenceId),
  });
}

export function createOpsWorkflowHandoff(input: {
  handoffId: string;
  run: OpsWorkflowRun;
  contextBrief: OpsWorkflowContextBrief;
  createdAt: string;
}): OpsWorkflowHandoff {
  const run = opsWorkflowRunSchema.parse(input.run);
  const contextBrief = opsWorkflowContextBriefSchema.parse(input.contextBrief);
  if (contextBrief.runId !== run.runId || contextBrief.runRevision !== run.revision) {
    throw new Error(
      '[OPS_WORKFLOW_BRIEF_STALE] The context brief does not match the workflow run.',
    );
  }
  return opsWorkflowHandoffSchema.parse({
    schemaVersion: 1,
    kind: 'ops.workflow-handoff',
    handoffId: input.handoffId,
    runId: run.runId,
    runRevision: run.revision,
    contextBriefId: contextBrief.briefId,
    goal: run.goal,
    playbook: run.playbook,
    context: run.context,
    currentStageId: run.currentStageId,
    nextStep: contextBrief.presentation.nextStep,
    evidenceRevisions: contextBrief.evidence.map((evidence) => ({
      evidenceId: evidence.evidenceId,
      revision: evidence.revision,
    })),
    createdAt: input.createdAt,
  });
}

export function invalidateOpsWorkflowEvidence(input: {
  run: OpsWorkflowRun;
  evidenceId: string;
  expectedRevision: number;
  invalidatedAt: string;
  reason: string;
}): OpsWorkflowRun {
  const run = opsWorkflowRunSchema.parse(input.run);
  let found = false;
  const evidence = run.evidence.map((item) => {
    if (item.evidenceId !== input.evidenceId) return item;
    found = true;
    if (item.revision !== input.expectedRevision || item.status !== 'current') {
      throw new Error(
        '[OPS_WORKFLOW_EVIDENCE_REVISION] Workflow evidence changed before invalidation.',
      );
    }
    return opsWorkflowEvidenceReferenceSchema.parse({
      ...item,
      revision: item.revision + 1,
      status: 'invalidated',
      invalidatedAt: input.invalidatedAt,
      invalidationReason: input.reason,
    });
  });
  if (!found) {
    throw new Error('[OPS_WORKFLOW_EVIDENCE_MISSING] Workflow evidence was not found.');
  }
  return opsWorkflowRunSchema.parse({
    ...run,
    revision: run.revision + 1,
    status: 'blocked',
    evidence,
    updatedAt: input.invalidatedAt,
  });
}

export function resumeOpsWorkflowHandoff(input: {
  handoff: OpsWorkflowHandoff;
  run: OpsWorkflowRun;
}): OpsWorkflowResumeResult {
  const handoff = opsWorkflowHandoffSchema.parse(input.handoff);
  const run = opsWorkflowRunSchema.parse(input.run);
  if (
    handoff.runId !== run.runId ||
    handoff.goal.id !== run.goal.id ||
    handoff.goal.version !== run.goal.version ||
    handoff.playbook.id !== run.playbook.id ||
    handoff.playbook.version !== run.playbook.version ||
    handoff.context.scopeId !== run.context.scopeId ||
    handoff.context.projectId !== run.context.projectId ||
    handoff.context.environmentId !== run.context.environmentId ||
    handoff.context.targetId !== run.context.targetId ||
    handoff.context.principal.kind !== run.context.principal.kind ||
    handoff.context.principal.id !== run.context.principal.id
  ) {
    return {
      status: 'run-changed',
      runId: run.runId,
      currentStageId: run.currentStageId,
      changedEvidenceIds: [],
    };
  }
  const currentEvidence = new Map(run.evidence.map((evidence) => [evidence.evidenceId, evidence]));
  const changedEvidenceIds = handoff.evidenceRevisions
    .filter((reference) => {
      const current = currentEvidence.get(reference.evidenceId);
      return !current || current.revision !== reference.revision || current.status !== 'current';
    })
    .map((reference) => reference.evidenceId);
  if (changedEvidenceIds.length > 0) {
    return {
      status: 'evidence-changed',
      runId: run.runId,
      currentStageId: run.currentStageId,
      changedEvidenceIds,
    };
  }
  if (handoff.runRevision !== run.revision || handoff.currentStageId !== run.currentStageId) {
    return {
      status: 'run-changed',
      runId: run.runId,
      currentStageId: run.currentStageId,
      changedEvidenceIds: [],
    };
  }
  return {
    status: 'resumable',
    runId: run.runId,
    currentStageId: run.currentStageId,
    nextStep: handoff.nextStep,
    changedEvidenceIds: [],
  };
}
