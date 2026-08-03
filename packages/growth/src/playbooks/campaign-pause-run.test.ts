import { describe, expect, it } from 'vitest';
import type { OpsActionContext, OpsExecutionState, OpsMutationPlan } from '@unisane/ops-engine';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
  InMemoryOpsMutationRunStore,
} from '@unisane/ops-engine/testing';
import { createGrowthCampaignPauseAction } from '../actions/campaign-pause.js';
import { createGrowthCampaignPauseRunCoordinator } from './campaign-pause-run.js';

const context: OpsActionContext = {
  requestId: 'request.campaign-pause-run',
  scopeId: 'scope.true-resume',
  projectId: 'true-resume',
  environmentId: 'production',
  targetId: 'campaign-42',
  principal: { kind: 'agent', id: 'agent.codex' },
  requestedAt: '2026-08-03T10:00:00.000Z',
};

const parameters = {
  provider: 'googleAds' as const,
  providerAccountId: 'account-7',
  campaignId: 'campaign-42',
  evidenceRevision: 'evidence-revision-3',
  verificationDelayMs: 30_000,
  verificationTtlMs: 300_000,
};

function state(): OpsExecutionState {
  return {
    artifacts: new InMemoryArtifactStore(),
    approvals: new InMemoryApprovalStore(),
    locks: new InMemoryLockStore(),
  };
}

function approvalFor(plan: OpsMutationPlan) {
  return {
    schemaVersion: 1 as const,
    kind: 'ops.approval' as const,
    approvalId: 'approval.campaign-pause',
    planHash: plan.planHash,
    actor: 'operator@example.test',
    provider: plan.provider,
    projectId: plan.projectId,
    environment: plan.environment,
    targetIdentity: plan.targetIdentity,
    approvedAt: '2026-08-03T10:00:30.000Z',
    expiresAt: '2026-08-03T10:09:00.000Z',
  };
}

describe('growth campaign pause run coordinator', () => {
  it('records and loads one bounded canonical plan-to-verified lifecycle', async () => {
    let currentTime = new Date('2026-08-03T10:01:00.000Z');
    const executionState = state();
    const runStore = new InMemoryOpsMutationRunStore();
    const action = createGrowthCampaignPauseAction({
      state: executionState,
      lockOwner: 'worker.growth',
      actor: 'developer',
      production: false,
      multiProcess: false,
      pauseCampaign: async () => ({ outcome: 'succeeded', providerOperationId: 'operation-9' }),
      readCampaignStatus: async () => 'paused',
      now: () => currentTime,
      createPlanId: () => 'plan.campaign-pause',
      createReceiptId: () => 'receipt.campaign-pause',
    });
    const coordinator = createGrowthCampaignPauseRunCoordinator({
      store: runStore,
      actor: 'developer',
      production: false,
      multiProcess: false,
      now: () => currentTime,
    });
    const plan = await action.plan(
      {
        ...parameters,
        generatedAt: '2026-08-03T10:00:00.000Z',
        expiresAt: '2026-08-03T10:10:00.000Z',
      },
      context,
    );
    const planned = await coordinator.recordPlan({
      context,
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
      plan,
    });
    const approval = approvalFor(plan);
    await executionState.approvals.put(approval);
    const approved = await coordinator.recordApproval({ runId: planned.runId, approval });
    const lease = await executionState.locks.acquire({
      lockId: 'googleAds:account:account-7:campaign:campaign-42',
      owner: 'worker.growth',
      ttlMs: 120_000,
      now: currentTime.toISOString(),
    });
    if (!lease) throw new Error('Expected a lock lease.');
    const applyOutput = await action.apply(
      {
        ...parameters,
        currentEvidenceRevision: parameters.evidenceRevision,
        plan,
        approval,
        lease,
        priorReceipts: [],
      },
      context,
    );
    const applied = await coordinator.recordApply({
      runId: approved.runId,
      currentEvidenceRevision: parameters.evidenceRevision,
      applyOutput,
    });
    currentTime = new Date('2026-08-03T10:02:00.000Z');
    const verification = await action.verify(
      {
        provider: parameters.provider,
        providerAccountId: parameters.providerAccountId,
        campaignId: parameters.campaignId,
        receipt: applyOutput.receipt,
        verificationWindow: applyOutput.verificationWindow,
      },
      context,
    );
    const verified = await coordinator.recordVerification({
      runId: applied.runId,
      verification,
    });

    expect(verified).toMatchObject({ revision: 4, phase: 'verified' });
    await expect(coordinator.listReviews({ ...context, limit: 1 })).resolves.toMatchObject([
      {
        status: 'verified',
        target: { campaignId: 'campaign-42' },
        nextStep: { id: 'none' },
      },
    ]);
  });

  it('fails closed for invalid transitions and unsafe payload shape', async () => {
    const coordinator = createGrowthCampaignPauseRunCoordinator({
      store: new InMemoryOpsMutationRunStore(),
      actor: 'developer',
      production: false,
      multiProcess: false,
      now: () => new Date('2026-08-03T10:01:00.000Z'),
    });
    const action = createGrowthCampaignPauseAction({
      state: state(),
      lockOwner: 'worker.growth',
      actor: 'developer',
      production: false,
      multiProcess: false,
      pauseCampaign: async () => ({ outcome: 'succeeded' }),
      readCampaignStatus: async () => 'paused',
      createPlanId: () => 'plan.campaign-pause',
    });
    const plan = await action.plan(
      {
        ...parameters,
        generatedAt: '2026-08-03T10:00:00.000Z',
        expiresAt: '2026-08-03T10:10:00.000Z',
      },
      context,
    );
    await expect(
      coordinator.recordPlan({
        context,
        parameters: { ...parameters, secret: 'must-not-persist' } as typeof parameters,
        currentEvidenceRevision: parameters.evidenceRevision,
        plan,
      }),
    ).rejects.toThrow();
    const run = await coordinator.recordPlan({
      context,
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
      plan,
    });
    await expect(
      coordinator.recordVerification({
        runId: run.runId,
        verification: {} as never,
      }),
    ).rejects.toThrow('GROWTH_CAMPAIGN_PAUSE_RUN_TRANSITION_INVALID');
  });
});
