import { z } from 'zod';
import {
  opsPrincipalSchema,
  type OpsActionContext,
  type OpsExecutionState,
  type OpsMutationRunStore,
  type OpsPrincipal,
} from '@unisane/ops-engine';
import {
  createGrowthCampaignPauseAction,
  growthCampaignPauseConfirmation,
  growthCampaignPauseLockIdentity,
  growthCampaignPauseParametersSchema,
  type GrowthCampaignPauseParameters,
  type GrowthCampaignPauseProviderAdapters,
} from '../actions/campaign-pause.js';
import {
  createGrowthCampaignPauseRunCoordinator,
  type GrowthCampaignPauseRunCoordinator,
} from '../playbooks/campaign-pause-run.js';
import {
  growthCampaignPauseReviewSchema,
  type GrowthCampaignPauseReview,
} from '../playbooks/campaign-pause-review.js';
import { approveGrowthCampaignPause } from './campaign-pause-approval.js';

const nonEmptySchema = z.string().trim().min(1);
const durationSchema = z.number().int().min(1_000).max(3_600_000);

export const growthCampaignPauseWorkflowResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('growth.campaign-pause-workflow-result'),
    runId: nonEmptySchema,
    review: growthCampaignPauseReviewSchema,
  })
  .strict();
export type GrowthCampaignPauseWorkflowResult = z.infer<
  typeof growthCampaignPauseWorkflowResultSchema
>;

export interface GrowthCampaignPauseWorkflow {
  plan(input: {
    context: OpsActionContext;
    parameters: GrowthCampaignPauseParameters;
    currentEvidenceRevision: string;
    planTtlMs?: number;
  }): Promise<GrowthCampaignPauseWorkflowResult>;
  show(runId: string): Promise<GrowthCampaignPauseWorkflowResult | null>;
  approve(input: {
    runId: string;
    approvedBy: string;
    confirmPlanHash: string;
    approvalTtlMs?: number;
  }): Promise<GrowthCampaignPauseWorkflowResult>;
  apply(input: {
    runId: string;
    currentEvidenceRevision: string;
    confirmTarget: string;
    principal: OpsPrincipal;
    lockTtlMs?: number;
  }): Promise<GrowthCampaignPauseWorkflowResult>;
  verify(input: {
    runId: string;
    principal: OpsPrincipal;
  }): Promise<GrowthCampaignPauseWorkflowResult>;
}

function workflowResult(
  runId: string,
  review: GrowthCampaignPauseReview,
): GrowthCampaignPauseWorkflowResult {
  return growthCampaignPauseWorkflowResultSchema.parse({
    schemaVersion: 1,
    kind: 'growth.campaign-pause-workflow-result',
    runId,
    review,
  });
}

function requireReview(
  coordinator: GrowthCampaignPauseRunCoordinator,
  runId: string,
): Promise<GrowthCampaignPauseReview> {
  return coordinator.getReview(runId).then((review) => {
    if (!review) {
      throw new Error(
        '[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.',
      );
    }
    return review;
  });
}

export function createGrowthCampaignPauseWorkflow(input: {
  state: OpsExecutionState;
  runStore: OpsMutationRunStore;
  providerAdapters: GrowthCampaignPauseProviderAdapters;
  actor: 'developer' | 'automation';
  mutationPolicy: 'disabled' | 'plan-only' | 'approval-required';
  production: boolean;
  multiProcess: boolean;
  lockOwner: string;
  now?: () => Date;
  createPlanId?: () => string;
  createReceiptId?: () => string;
  createApprovalId?: (planHash: string) => string;
}): GrowthCampaignPauseWorkflow {
  const now = input.now ?? (() => new Date());
  const coordinator = createGrowthCampaignPauseRunCoordinator({
    store: input.runStore,
    actor: input.actor,
    production: input.production,
    multiProcess: input.multiProcess,
    now,
  });
  const action = createGrowthCampaignPauseAction({
    state: input.state,
    lockOwner: input.lockOwner,
    actor: input.actor,
    production: input.production,
    multiProcess: input.multiProcess,
    pauseCampaign: ({ provider, ...request }) =>
      input.providerAdapters[provider].pauseCampaign(request),
    readCampaignStatus: ({ provider, ...request }) =>
      input.providerAdapters[provider].readCampaignStatus(request),
    now,
    createPlanId: input.createPlanId,
    createReceiptId: input.createReceiptId,
  });
  return {
    async plan(request) {
      if (input.mutationPolicy === 'disabled') {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_MUTATION_DISABLED] Campaign changes are disabled by Growth policy.',
        );
      }
      const parameters = growthCampaignPauseParametersSchema.parse(request.parameters);
      const generatedAt = now();
      const planTtlMs = durationSchema.parse(request.planTtlMs ?? 600_000);
      const plan = await action.plan(
        {
          ...parameters,
          generatedAt: generatedAt.toISOString(),
          expiresAt: new Date(generatedAt.getTime() + planTtlMs).toISOString(),
        },
        request.context,
      );
      const run = await coordinator.recordPlan({
        context: request.context,
        parameters,
        currentEvidenceRevision: nonEmptySchema.parse(request.currentEvidenceRevision),
        plan,
      });
      return workflowResult(run.runId, await requireReview(coordinator, run.runId));
    },
    async show(runId) {
      const review = await coordinator.getReview(nonEmptySchema.parse(runId));
      return review ? workflowResult(runId, review) : null;
    },
    async approve(request) {
      const review = await approveGrowthCampaignPause({
        state: input.state,
        coordinator,
        mutationPolicy: input.mutationPolicy,
        runId: request.runId,
        approvedBy: request.approvedBy,
        confirmPlanHash: request.confirmPlanHash,
        approvalTtlMs: request.approvalTtlMs,
        now,
        createApprovalId: input.createApprovalId,
      });
      return workflowResult(request.runId, review);
    },
    async apply(request) {
      if (input.mutationPolicy !== 'approval-required') {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_APPLY_DISABLED] Growth policy does not allow campaign changes.',
        );
      }
      const run = await coordinator.getRun(nonEmptySchema.parse(request.runId));
      if (!run) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.',
        );
      }
      const parameters = run.actionState.parameters;
      if (request.confirmTarget !== growthCampaignPauseConfirmation(parameters)) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_TARGET_CONFIRMATION_MISMATCH] Confirm the exact provider, account, and campaign before apply.',
        );
      }
      if (!run.actionState.approval) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_REQUIRED] Approve the exact plan before apply.',
        );
      }
      if (run.actionState.applyOutput) {
        return workflowResult(run.runId, await requireReview(coordinator, run.runId));
      }
      const principal = opsPrincipalSchema.parse(request.principal);
      const lease = await input.state.locks.acquire({
        lockId: growthCampaignPauseLockIdentity(parameters),
        owner: input.lockOwner,
        ttlMs: durationSchema.parse(request.lockTtlMs ?? 120_000),
        now: now().toISOString(),
      });
      if (!lease) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_LOCK_UNAVAILABLE] Another campaign operation is active.',
        );
      }
      try {
        const applyOutput = await action.apply(
          {
            ...parameters,
            currentEvidenceRevision: nonEmptySchema.parse(request.currentEvidenceRevision),
            plan: run.actionState.plan,
            approval: run.actionState.approval,
            lease,
            priorReceipts: [],
          },
          {
            requestId: `request.${run.runId}.apply`,
            scopeId: `scope.${run.projectId}`,
            projectId: run.projectId,
            environmentId: run.environmentId,
            targetId: parameters.campaignId,
            principal,
            requestedAt: now().toISOString(),
          },
        );
        await coordinator.recordApply({
          runId: run.runId,
          currentEvidenceRevision: request.currentEvidenceRevision,
          applyOutput,
        });
      } finally {
        await input.state.locks.release(lease);
      }
      return workflowResult(run.runId, await requireReview(coordinator, run.runId));
    },
    async verify(request) {
      const run = await coordinator.getRun(nonEmptySchema.parse(request.runId));
      if (!run?.actionState.applyOutput) {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_RECEIPT_REQUIRED] Apply output is required before verification.',
        );
      }
      const principal = opsPrincipalSchema.parse(request.principal);
      const parameters = run.actionState.parameters;
      const verification = await action.verify(
        {
          provider: parameters.provider,
          providerAccountId: parameters.providerAccountId,
          campaignId: parameters.campaignId,
          receipt: run.actionState.applyOutput.receipt,
          verificationWindow: run.actionState.applyOutput.verificationWindow,
        },
        {
          requestId: `request.${run.runId}.verify`,
          scopeId: `scope.${run.projectId}`,
          projectId: run.projectId,
          environmentId: run.environmentId,
          targetId: parameters.campaignId,
          principal,
          requestedAt: now().toISOString(),
        },
      );
      await coordinator.recordVerification({ runId: run.runId, verification });
      return workflowResult(run.runId, await requireReview(coordinator, run.runId));
    },
  };
}
