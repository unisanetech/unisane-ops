import { describe, expect, it } from 'vitest';
import {
  hashOpsValue,
  type OpsActionContext,
  type OpsApprovalRecord,
  type OpsExecutionState,
  type OpsMutationPlan,
} from '@unisane/ops-engine';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
} from '@unisane/ops-engine/testing';
import {
  createGrowthCampaignPauseAction,
  type GrowthCampaignPauseApplyOutput,
  type GrowthCampaignPauseVerification,
} from '../actions/campaign-pause.js';
import { createGrowthCampaignPauseReview } from './campaign-pause-review.js';

const context: OpsActionContext = {
  requestId: 'request.review',
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

async function plan(): Promise<OpsMutationPlan> {
  return createGrowthCampaignPauseAction({
    state: state(),
    lockOwner: 'worker.growth',
    actor: 'developer',
    production: false,
    multiProcess: false,
    pauseCampaign: async () => ({ outcome: 'succeeded' }),
    readCampaignStatus: async () => 'paused',
    createPlanId: () => 'plan.campaign-pause',
  }).plan(
    {
      ...parameters,
      generatedAt: '2026-08-03T10:00:00.000Z',
      expiresAt: '2026-08-03T10:10:00.000Z',
    },
    context,
  );
}

function approvalFor(value: OpsMutationPlan, expiresAt = '2026-08-03T10:09:00.000Z'):
  OpsApprovalRecord {
  return {
    schemaVersion: 1,
    kind: 'ops.approval',
    approvalId: 'approval.campaign-pause',
    planHash: value.planHash,
    actor: 'operator@example.test',
    provider: value.provider,
    projectId: value.projectId,
    environment: value.environment,
    targetIdentity: value.targetIdentity,
    approvedAt: '2026-08-03T10:00:30.000Z',
    expiresAt,
  };
}

function applyOutputFor(
  value: OpsMutationPlan,
  disposition: GrowthCampaignPauseApplyOutput['disposition'] = 'applied',
): GrowthCampaignPauseApplyOutput {
  return {
    schemaVersion: 1,
    actionId: 'growth.ads.campaign.pause',
    actionSchemaVersion: 1,
    disposition,
    receipt: {
      schemaVersion: 1,
      kind: 'ops.mutation-receipt',
      receiptId: 'receipt.campaign-pause',
      planId: value.planId,
      planHash: value.planHash,
      provider: value.provider,
      projectId: value.projectId,
      environment: value.environment,
      targetIdentity: value.targetIdentity,
      actor: 'agent.codex',
      approvalId: 'approval.campaign-pause',
      lockId: 'googleAds:account:account-7:campaign:campaign-42',
      lockFencingValue: 1,
      startedAt: '2026-08-03T10:01:00.000Z',
      completedAt: '2026-08-03T10:01:00.000Z',
      status:
        disposition === 'applied' ? 'succeeded' : disposition === 'failed' ? 'failed' : 'partial',
      results: [
        {
          actionId: 'growth.ads.campaign.pause',
          status: disposition === 'applied' ? 'succeeded' : 'failed',
          outputHash: hashOpsValue({ disposition }),
        },
      ],
    },
    verificationWindow: {
      notBefore: '2026-08-03T10:01:30.000Z',
      expiresAt: '2026-08-03T10:06:30.000Z',
    },
  };
}

function verificationFor(
  applied: GrowthCampaignPauseApplyOutput,
  status: GrowthCampaignPauseVerification['status'],
): GrowthCampaignPauseVerification {
  return {
    schemaVersion: 1,
    kind: 'growth.campaign-pause-verification',
    actionId: 'growth.ads.campaign.pause',
    actionSchemaVersion: 1,
    receiptId: applied.receipt.receiptId,
    planHash: applied.receipt.planHash,
    provider: 'googleAds',
    providerAccountId: 'account-7',
    campaignId: 'campaign-42',
    checkedAt: '2026-08-03T10:02:00.000Z',
    status,
    observedCampaignStatus:
      status === 'verified' ? 'paused' : status === 'needs-attention' ? 'active' : null,
    safeMessage: 'Safe verification result.',
  };
}

describe('campaign pause review projection', () => {
  it('explains missing, expired, and valid approval without authorizing the mutation', async () => {
    const pausePlan = await plan();
    const base = {
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
      plan: pausePlan,
      now: '2026-08-03T10:01:00.000Z',
    };

    expect(createGrowthCampaignPauseReview(base)).toMatchObject({
      status: 'approval-required',
      approval: { status: 'required' },
      nextStep: { id: 'request-approval' },
      target: { providerLabel: 'Google Ads', providerAccountId: 'account-7' },
    });
    expect(
      createGrowthCampaignPauseReview({
        ...base,
        approval: approvalFor(pausePlan, '2026-08-03T10:00:59.000Z'),
      }),
    ).toMatchObject({
      status: 'approval-required',
      approval: { status: 'expired' },
      nextStep: { id: 'request-approval' },
    });
    expect(
      createGrowthCampaignPauseReview({ ...base, approval: approvalFor(pausePlan) }),
    ).toMatchObject({
      status: 'ready-to-apply',
      approval: { status: 'valid', approvedBy: 'operator@example.test' },
      nextStep: { id: 'apply-approved-pause' },
    });
  });

  it('invalidates an unapplied plan when evidence changes', async () => {
    const pausePlan = await plan();
    expect(
      createGrowthCampaignPauseReview({
        parameters,
        currentEvidenceRevision: 'evidence-revision-4',
        plan: pausePlan,
        approval: approvalFor(pausePlan),
        now: '2026-08-03T10:01:00.000Z',
      }),
    ).toMatchObject({
      status: 'plan-stale',
      evidence: { status: 'stale' },
      nextStep: { id: 'create-new-plan' },
    });
  });

  it('projects pending, unknown, verified, and attention outcomes with one safe next step', async () => {
    const pausePlan = await plan();
    const applied = applyOutputFor(pausePlan);
    const base = {
      parameters,
      currentEvidenceRevision: parameters.evidenceRevision,
      plan: pausePlan,
      approval: approvalFor(pausePlan),
      applyOutput: applied,
    };

    expect(
      createGrowthCampaignPauseReview({ ...base, now: '2026-08-03T10:01:10.000Z' }),
    ).toMatchObject({
      status: 'verification-pending',
      nextStep: { id: 'wait-to-check' },
    });
    expect(
      createGrowthCampaignPauseReview({ ...base, now: '2026-08-03T10:02:00.000Z' }),
    ).toMatchObject({
      status: 'outcome-unknown',
      nextStep: { id: 'check-again' },
    });
    expect(
      createGrowthCampaignPauseReview({
        ...base,
        verification: verificationFor(applied, 'verified'),
        now: '2026-08-03T10:02:00.000Z',
      }),
    ).toMatchObject({ status: 'verified', nextStep: { id: 'none' } });
    expect(
      createGrowthCampaignPauseReview({
        ...base,
        verification: verificationFor(applied, 'needs-attention'),
        now: '2026-08-03T10:02:00.000Z',
      }),
    ).toMatchObject({
      status: 'needs-attention',
      nextStep: { id: 'inspect-provider' },
    });
  });

  it('rejects receipts and verification results from a different target', async () => {
    const pausePlan = await plan();
    const applied = applyOutputFor(pausePlan);
    expect(() =>
      createGrowthCampaignPauseReview({
        parameters,
        currentEvidenceRevision: parameters.evidenceRevision,
        plan: pausePlan,
        approval: approvalFor(pausePlan),
        applyOutput: {
          ...applied,
          receipt: { ...applied.receipt, targetIdentity: 'account:account-7:campaign:other' },
        },
        now: '2026-08-03T10:02:00.000Z',
      }),
    ).toThrow('GROWTH_CAMPAIGN_PAUSE_REVIEW_RECEIPT_MISMATCH');
    expect(() =>
      createGrowthCampaignPauseReview({
        parameters,
        currentEvidenceRevision: parameters.evidenceRevision,
        plan: pausePlan,
        approval: approvalFor(pausePlan),
        applyOutput: applied,
        verification: { ...verificationFor(applied, 'verified'), campaignId: 'other' },
        now: '2026-08-03T10:02:00.000Z',
      }),
    ).toThrow('GROWTH_CAMPAIGN_PAUSE_REVIEW_VERIFICATION_MISMATCH');
  });
});
