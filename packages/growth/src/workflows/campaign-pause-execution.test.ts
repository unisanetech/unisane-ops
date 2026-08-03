import { describe, expect, it } from 'vitest';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
  InMemoryOpsMutationRunStore,
} from '@unisane/ops-engine/testing';
import { createGrowthCampaignPauseWorkflow } from './campaign-pause-execution.js';

const parameters = {
  provider: 'googleAds' as const,
  providerAccountId: '1234567890',
  campaignId: '42',
  evidenceRevision: 'evidence-3',
  verificationDelayMs: 1_000,
  verificationTtlMs: 60_000,
};

describe('campaign pause workflow', () => {
  it('composes the exact local plan-to-verified lifecycle', async () => {
    let currentTime = new Date('2026-08-03T10:00:00.000Z');
    const workflow = createGrowthCampaignPauseWorkflow({
      state: {
        artifacts: new InMemoryArtifactStore(),
        approvals: new InMemoryApprovalStore(),
        locks: new InMemoryLockStore(),
      },
      runStore: new InMemoryOpsMutationRunStore(),
      providerAdapters: {
        googleAds: {
          pauseCampaign: async () => ({ outcome: 'succeeded', providerOperationId: 'op-7' }),
          readCampaignStatus: async () => 'paused',
        },
        metaAds: {
          pauseCampaign: async () => ({ outcome: 'rejected' }),
          readCampaignStatus: async () => 'unknown',
        },
      },
      actor: 'developer',
      mutationPolicy: 'approval-required',
      production: false,
      multiProcess: false,
      lockOwner: 'worker.local-cli',
      now: () => currentTime,
      createPlanId: () => 'plan.campaign-pause-workflow',
      createReceiptId: () => 'receipt.campaign-pause-workflow',
      createApprovalId: () => 'approval.campaign-pause-workflow',
    });
    const planned = await workflow.plan({
      context: {
        requestId: 'request.plan',
        scopeId: 'scope.true-resume',
        projectId: 'true-resume',
        environmentId: 'development',
        targetId: parameters.campaignId,
        principal: { kind: 'user', id: 'user.operator' },
        requestedAt: currentTime.toISOString(),
      },
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
    });
    expect(planned.review.status).toBe('approval-required');

    const approved = await workflow.approve({
      runId: planned.runId,
      approvedBy: 'operator@example.test',
      confirmPlanHash: planned.review.action.planHash,
      approvalTtlMs: 1_000,
    });
    expect(approved.review.status).toBe('ready-to-apply');

    const duplicate = await workflow.approve({
      runId: planned.runId,
      approvedBy: 'operator@example.test',
      confirmPlanHash: planned.review.action.planHash,
    });
    expect(duplicate.review.approval.approvalId).toBe(approved.review.approval.approvalId);
    await expect(
      workflow.approve({
        runId: planned.runId,
        approvedBy: 'another-operator@example.test',
        confirmPlanHash: planned.review.action.planHash,
      }),
    ).rejects.toThrow('ALREADY_APPROVED');

    currentTime = new Date('2026-08-03T10:00:02.000Z');
    expect((await workflow.show(planned.runId))?.review.approval.status).toBe('expired');
    const renewed = await workflow.approve({
      runId: planned.runId,
      approvedBy: 'operator@example.test',
      confirmPlanHash: planned.review.action.planHash,
    });
    expect(renewed.review.status).toBe('ready-to-apply');

    const applied = await workflow.apply({
      runId: planned.runId,
      currentEvidenceRevision: parameters.evidenceRevision,
      confirmTarget: 'googleAds:1234567890:42',
      principal: { kind: 'agent', id: 'agent.test' },
    });
    expect(applied.review.status).toBe('verification-pending');

    currentTime = new Date('2026-08-03T10:00:04.000Z');
    const verified = await workflow.verify({
      runId: planned.runId,
      principal: { kind: 'agent', id: 'agent.test' },
    });
    expect(verified.review).toMatchObject({
      status: 'verified',
      execution: { status: 'succeeded' },
      verification: { status: 'verified' },
      nextStep: { id: 'none' },
    });
  });

  it('enforces the configured Growth mutation policy before creating a plan', async () => {
    const pauseCampaign = async () => ({ outcome: 'succeeded' as const });
    const workflow = createGrowthCampaignPauseWorkflow({
      state: {
        artifacts: new InMemoryArtifactStore(),
        approvals: new InMemoryApprovalStore(),
        locks: new InMemoryLockStore(),
      },
      runStore: new InMemoryOpsMutationRunStore(),
      providerAdapters: {
        googleAds: { pauseCampaign, readCampaignStatus: async () => 'paused' },
        metaAds: { pauseCampaign, readCampaignStatus: async () => 'paused' },
      },
      actor: 'developer',
      mutationPolicy: 'disabled',
      production: false,
      multiProcess: false,
      lockOwner: 'worker.policy-test',
    });
    await expect(
      workflow.plan({
        context: {
          requestId: 'request.policy-test',
          scopeId: 'scope.true-resume',
          projectId: 'true-resume',
          environmentId: 'development',
          targetId: parameters.campaignId,
          principal: { kind: 'user', id: 'user.operator' },
          requestedAt: '2026-08-03T10:00:00.000Z',
        },
        parameters,
        currentEvidenceRevision: parameters.evidenceRevision,
      }),
    ).rejects.toThrow('MUTATION_DISABLED');
  });

  it('requires exact plan and target confirmation', async () => {
    let currentTime = new Date('2026-08-03T10:00:00.000Z');
    const workflow = createGrowthCampaignPauseWorkflow({
      state: {
        artifacts: new InMemoryArtifactStore(),
        approvals: new InMemoryApprovalStore(),
        locks: new InMemoryLockStore(),
      },
      runStore: new InMemoryOpsMutationRunStore(),
      providerAdapters: {
        googleAds: {
          pauseCampaign: async () => ({ outcome: 'succeeded' }),
          readCampaignStatus: async () => 'paused',
        },
        metaAds: {
          pauseCampaign: async () => ({ outcome: 'succeeded' }),
          readCampaignStatus: async () => 'paused',
        },
      },
      actor: 'developer',
      mutationPolicy: 'approval-required',
      production: false,
      multiProcess: false,
      lockOwner: 'worker.local-cli',
      now: () => currentTime,
      createPlanId: () => 'plan.confirmation',
    });
    const planned = await workflow.plan({
      context: {
        requestId: 'request.plan',
        scopeId: 'scope.true-resume',
        projectId: 'true-resume',
        environmentId: 'development',
        targetId: parameters.campaignId,
        principal: { kind: 'user', id: 'user.operator' },
        requestedAt: '2026-08-03T10:00:00.000Z',
      },
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
      planTtlMs: 1_000,
    });
    await expect(
      workflow.approve({
        runId: planned.runId,
        approvedBy: 'operator',
        confirmPlanHash: 'wrong',
      }),
    ).rejects.toThrow('APPROVAL_CONFIRMATION_MISMATCH');

    currentTime = new Date('2026-08-03T10:00:02.000Z');
    await expect(
      workflow.approve({
        runId: planned.runId,
        approvedBy: 'operator',
        confirmPlanHash: planned.review.action.planHash,
      }),
    ).rejects.toThrow('APPROVAL_STALE');
  });
});
