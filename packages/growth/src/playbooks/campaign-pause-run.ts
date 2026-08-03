import path from 'node:path';
import { z } from 'zod';
import {
  assertOpsMutationRunStore,
  hashOpsValue,
  opsApprovalRecordSchema,
  opsMutationPlanSchema,
  parseOpsMutationRun,
  type OpsApprovalRecord,
  type OpsMutationPlan,
  type OpsMutationRun,
  type OpsMutationRunStore,
} from '@unisane/ops-engine';
import {
  growthCampaignPauseApplyOutputSchema,
  growthCampaignPauseParametersSchema,
  growthCampaignPauseVerificationSchema,
  type GrowthCampaignPauseApplyOutput,
  type GrowthCampaignPauseParameters,
  type GrowthCampaignPauseVerification,
} from '../actions/campaign-pause.js';
import {
  createGrowthCampaignPauseReview,
  type GrowthCampaignPauseReview,
} from './campaign-pause-review.js';

const nonEmptySchema = z.string().trim().min(1);
const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const ACTION_ID = 'growth.ads.campaign.pause';
const ACTION_SCHEMA_VERSION = 1;

export const growthCampaignPauseRunStateSchema = z
  .object({
    parameters: growthCampaignPauseParametersSchema,
    currentEvidenceRevision: nonEmptySchema,
    plan: opsMutationPlanSchema,
    approval: opsApprovalRecordSchema.nullable(),
    applyOutput: growthCampaignPauseApplyOutputSchema.nullable(),
    verification: growthCampaignPauseVerificationSchema.nullable(),
  })
  .strict();
export type GrowthCampaignPauseRunState = z.infer<typeof growthCampaignPauseRunStateSchema>;
export type GrowthCampaignPauseRun = OpsMutationRun<GrowthCampaignPauseRunState>;

export type GrowthCampaignPauseRunContext = {
  projectId: string;
  environmentId: string;
};

export type GrowthCampaignPauseRunReviewEntry = {
  runId: string;
  review: GrowthCampaignPauseReview;
};

export type GrowthCampaignPauseRunCoordinator = {
  recordPlan(input: {
    context: GrowthCampaignPauseRunContext;
    parameters: GrowthCampaignPauseParameters;
    currentEvidenceRevision: string;
    plan: OpsMutationPlan;
  }): Promise<GrowthCampaignPauseRun>;
  recordApproval(input: {
    runId: string;
    approval: OpsApprovalRecord;
  }): Promise<GrowthCampaignPauseRun>;
  recordApply(input: {
    runId: string;
    currentEvidenceRevision: string;
    applyOutput: GrowthCampaignPauseApplyOutput;
  }): Promise<GrowthCampaignPauseRun>;
  recordVerification(input: {
    runId: string;
    verification: GrowthCampaignPauseVerification;
  }): Promise<GrowthCampaignPauseRun>;
  getReview(runId: string): Promise<GrowthCampaignPauseReview | null>;
  getRun(runId: string): Promise<GrowthCampaignPauseRun | null>;
  listReviews(
    input: GrowthCampaignPauseRunContext & { limit?: number },
  ): Promise<GrowthCampaignPauseReview[]>;
};

export function resolveGrowthCampaignPauseRunDirectory(input: {
  cwd: string;
  projectId: string;
  environmentId: string;
}): string {
  const projectId = stableIdSchema.parse(input.projectId);
  const environmentId = stableIdSchema.parse(input.environmentId);
  return path.join(
    path.resolve(input.cwd),
    '.unisane',
    'ops',
    projectId,
    environmentId,
    'state',
    'mutation-runs',
  );
}

export function resolveGrowthCampaignPauseExecutionStateDirectory(input: {
  cwd: string;
  projectId: string;
  environmentId: string;
}): string {
  const projectId = stableIdSchema.parse(input.projectId);
  const environmentId = stableIdSchema.parse(input.environmentId);
  return path.join(
    path.resolve(input.cwd),
    '.unisane',
    'ops',
    projectId,
    environmentId,
    'state',
    'execution',
  );
}

function runIdentity(input: {
  context: GrowthCampaignPauseRunContext;
  parameters: GrowthCampaignPauseParameters;
  planHash: string;
}): string {
  return `growth.campaign-pause.${hashOpsValue({
    projectId: input.context.projectId,
    environmentId: input.context.environmentId,
    provider: input.parameters.provider,
    providerAccountId: input.parameters.providerAccountId,
    campaignId: input.parameters.campaignId,
    planHash: input.planHash,
  }).slice(0, 32)}`;
}

function targetIdentity(parameters: GrowthCampaignPauseParameters): string {
  return `campaign.${hashOpsValue({
    provider: parameters.provider,
    providerAccountId: parameters.providerAccountId,
    campaignId: parameters.campaignId,
  }).slice(0, 32)}`;
}

function parseGrowthRun(input: unknown): GrowthCampaignPauseRun {
  const run = parseOpsMutationRun<unknown>(input);
  if (run.actionId !== ACTION_ID || run.actionSchemaVersion !== ACTION_SCHEMA_VERSION) {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_RUN_ACTION_MISMATCH] The run does not belong to the campaign pause action.',
    );
  }
  const actionState = growthCampaignPauseRunStateSchema.parse(run.actionState);
  if (
    run.projectId !== actionState.plan.projectId ||
    run.environmentId !== actionState.plan.environment ||
    run.targetId !== targetIdentity(actionState.parameters)
  ) {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_RUN_CONTEXT_MISMATCH] The run envelope does not match its campaign pause state.',
    );
  }
  return { ...run, actionState };
}

function reviewFor(run: GrowthCampaignPauseRun, now: string): GrowthCampaignPauseReview {
  return createGrowthCampaignPauseReview({
    ...run.actionState,
    now,
  });
}

async function storeNext(
  store: OpsMutationRunStore,
  current: GrowthCampaignPauseRun | null,
  next: GrowthCampaignPauseRun,
): Promise<GrowthCampaignPauseRun> {
  const result = await store.compareAndSet(next, current?.revision ?? null);
  if (result === 'conflict') {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_RUN_CONFLICT] The campaign pause run changed; reload it before recording another lifecycle result.',
    );
  }
  return next;
}

async function requiredRun(
  store: OpsMutationRunStore,
  runId: string,
): Promise<GrowthCampaignPauseRun> {
  const run = await store.get(runId);
  if (!run)
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.');
  return parseGrowthRun(run);
}

function nextRun(input: {
  current: GrowthCampaignPauseRun;
  phase: GrowthCampaignPauseRun['phase'];
  actionState: GrowthCampaignPauseRunState;
  updatedAt: string;
}): GrowthCampaignPauseRun {
  return parseGrowthRun({
    ...input.current,
    revision: input.current.revision + 1,
    phase: input.phase,
    actionState: input.actionState,
    updatedAt: input.updatedAt,
  });
}

export function createGrowthCampaignPauseRunCoordinator(input: {
  store: OpsMutationRunStore;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  now?: () => Date;
}): GrowthCampaignPauseRunCoordinator {
  assertOpsMutationRunStore(input);
  const now = input.now ?? (() => new Date());
  return {
    async recordPlan(request) {
      const parameters = growthCampaignPauseParametersSchema.parse(request.parameters);
      const plan = opsMutationPlanSchema.parse(request.plan);
      const currentEvidenceRevision = nonEmptySchema.parse(request.currentEvidenceRevision);
      const createdAt = now().toISOString();
      const run = parseGrowthRun({
        schemaVersion: 1,
        kind: 'ops.mutation-run',
        runId: runIdentity({ context: request.context, parameters, planHash: plan.planHash }),
        revision: 1,
        actionId: ACTION_ID,
        actionSchemaVersion: ACTION_SCHEMA_VERSION,
        projectId: request.context.projectId,
        environmentId: request.context.environmentId,
        targetId: targetIdentity(parameters),
        phase: 'planned',
        actionState: {
          parameters,
          currentEvidenceRevision,
          plan,
          approval: null,
          applyOutput: null,
          verification: null,
        },
        createdAt,
        updatedAt: createdAt,
      });
      reviewFor(run, createdAt);
      return storeNext(input.store, null, run);
    },
    async recordApproval(request) {
      const current = await requiredRun(input.store, request.runId);
      const currentReview = reviewFor(current, now().toISOString());
      if (
        current.phase !== 'planned' &&
        !(
          current.phase === 'approved' &&
          (currentReview.approval.status === 'expired' ||
            currentReview.approval.status === 'invalid')
        )
      ) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RUN_TRANSITION_INVALID] Approval can only follow a current unapproved plan or renew an expired approval.',
        );
      }
      const updatedAt = now().toISOString();
      const next = nextRun({
        current,
        phase: 'approved',
        actionState: {
          ...current.actionState,
          approval: opsApprovalRecordSchema.parse(request.approval),
        },
        updatedAt,
      });
      if (reviewFor(next, updatedAt).approval.status !== 'valid') {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RUN_APPROVAL_MISMATCH] The approval is not valid for this exact campaign pause plan.',
        );
      }
      return storeNext(input.store, current, next);
    },
    async recordApply(request) {
      const current = await requiredRun(input.store, request.runId);
      if (current.phase !== 'approved') {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RUN_TRANSITION_INVALID] Apply output can only follow an approved run.',
        );
      }
      const updatedAt = now().toISOString();
      const applyOutput = growthCampaignPauseApplyOutputSchema.parse(request.applyOutput);
      const next = nextRun({
        current,
        phase:
          applyOutput.disposition === 'applied'
            ? 'applied'
            : applyOutput.disposition === 'failed'
              ? 'attention'
              : 'verifying',
        actionState: {
          ...current.actionState,
          currentEvidenceRevision: nonEmptySchema.parse(request.currentEvidenceRevision),
          applyOutput,
        },
        updatedAt,
      });
      reviewFor(next, updatedAt);
      return storeNext(input.store, current, next);
    },
    async recordVerification(request) {
      const current = await requiredRun(input.store, request.runId);
      if (current.phase !== 'applied' && current.phase !== 'verifying') {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RUN_TRANSITION_INVALID] Verification can only follow an applied campaign pause.',
        );
      }
      const updatedAt = now().toISOString();
      const verification = growthCampaignPauseVerificationSchema.parse(request.verification);
      const phase =
        verification.status === 'verified'
          ? 'verified'
          : verification.status === 'needs-attention'
            ? 'attention'
            : 'verifying';
      const next = nextRun({
        current,
        phase,
        actionState: { ...current.actionState, verification },
        updatedAt,
      });
      reviewFor(next, updatedAt);
      return storeNext(input.store, current, next);
    },
    async getReview(runId) {
      const run = await input.store.get(runId);
      return run ? reviewFor(parseGrowthRun(run), now().toISOString()) : null;
    },
    async getRun(runId) {
      const run = await input.store.get(runId);
      return run ? parseGrowthRun(run) : null;
    },
    listReviews(request) {
      return listGrowthCampaignPauseRunReviews({
        store: input.store,
        ...request,
        now: now().toISOString(),
      });
    },
  };
}

export async function listGrowthCampaignPauseRunReviews(input: {
  store: OpsMutationRunStore;
  projectId: string;
  environmentId: string;
  limit?: number;
  now: string;
}): Promise<GrowthCampaignPauseReview[]> {
  return (await listGrowthCampaignPauseRunReviewEntries(input)).map((entry) => entry.review);
}

export async function listGrowthCampaignPauseRunReviewEntries(input: {
  store: OpsMutationRunStore;
  projectId: string;
  environmentId: string;
  limit?: number;
  now: string;
}): Promise<GrowthCampaignPauseRunReviewEntry[]> {
  const runs = await input.store.list({
    actionId: ACTION_ID,
    projectId: input.projectId,
    environmentId: input.environmentId,
    limit: input.limit ?? 50,
  });
  return runs.map((run) => {
    const parsed = parseGrowthRun(run);
    return { runId: parsed.runId, review: reviewFor(parsed, input.now) };
  });
}

export async function getGrowthCampaignPauseRunReview(input: {
  store: OpsMutationRunStore;
  runId: string;
  now: string;
}): Promise<GrowthCampaignPauseReview | null> {
  const run = await input.store.get(input.runId);
  return run ? reviewFor(parseGrowthRun(run), input.now) : null;
}
