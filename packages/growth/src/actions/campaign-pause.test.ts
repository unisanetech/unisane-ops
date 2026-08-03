import { describe, expect, it, vi } from 'vitest';
import type {
  OpsActionContext,
  OpsApprovalRecord,
  OpsExecutionState,
  OpsMutationPlan,
} from '@unisane/ops-engine';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
} from '@unisane/ops-engine/testing';
import {
  createGrowthCampaignPauseAction,
  createGrowthCampaignPauseProviderBridge,
} from './campaign-pause.js';

const context: OpsActionContext = {
  requestId: 'request.campaign-pause',
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

function executionState(): OpsExecutionState {
  return {
    artifacts: new InMemoryArtifactStore(),
    approvals: new InMemoryApprovalStore(),
    locks: new InMemoryLockStore(),
  };
}

function approvalFor(plan: OpsMutationPlan): OpsApprovalRecord {
  return {
    schemaVersion: 1,
    kind: 'ops.approval',
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

async function prepare(options?: {
  pauseOutcome?: 'succeeded' | 'rejected' | 'outcome-unknown';
  status?: 'paused' | 'active' | 'unknown';
}) {
  let currentTime = new Date('2026-08-03T10:01:00.000Z');
  let observedStatus = options?.status ?? ('paused' as const);
  const state = executionState();
  const action = createGrowthCampaignPauseAction({
    state,
    lockOwner: 'worker.growth',
    actor: 'developer',
    production: false,
    multiProcess: false,
    pauseCampaign: async () => ({
      outcome: options?.pauseOutcome ?? 'succeeded',
      providerOperationId: 'provider-operation-9',
    }),
    readCampaignStatus: async () => observedStatus,
    now: () => currentTime,
    createPlanId: () => 'plan.campaign-pause',
    createReceiptId: () => 'receipt.campaign-pause',
  });
  const plan = await action.plan(
    {
      ...parameters,
      generatedAt: '2026-08-03T10:00:00.000Z',
      expiresAt: '2026-08-03T10:10:00.000Z',
    },
    context,
  );
  const approval = approvalFor(plan);
  await state.approvals.put(approval);
  const lease = await state.locks.acquire({
    lockId: 'googleAds:account:account-7:campaign:campaign-42',
    owner: 'worker.growth',
    ttlMs: 120_000,
    now: currentTime.toISOString(),
  });
  if (!lease) throw new Error('Expected a lock lease.');
  return {
    action,
    state,
    plan,
    approval,
    lease,
    setTime(value: string) {
      currentTime = new Date(value);
    },
    setObservedStatus(value: 'paused' | 'active' | 'unknown') {
      observedStatus = value;
    },
  };
}

function applyInput(
  prepared: Awaited<ReturnType<typeof prepare>>,
  overrides: Record<string, unknown> = {},
) {
  return {
    ...parameters,
    currentEvidenceRevision: parameters.evidenceRevision,
    plan: prepared.plan,
    approval: prepared.approval,
    lease: prepared.lease,
    priorReceipts: [],
    ...overrides,
  };
}

describe('growth campaign pause action', () => {
  it('binds one exact campaign and records an immutable receipt before delayed verification', async () => {
    const prepared = await prepare();

    expect(prepared.plan).toMatchObject({
      provider: 'googleAds',
      projectId: 'true-resume',
      environment: 'production',
      targetIdentity: 'account:account-7:campaign:campaign-42',
      commandVersion: 'growth.ads.campaign.pause@1',
      actions: [
        {
          id: 'growth.ads.campaign.pause',
          type: 'update',
          resourceIdentity: 'account:account-7:campaign:campaign-42',
        },
      ],
    });

    const applied = await prepared.action.apply(applyInput(prepared), context);
    expect(applied).toMatchObject({
      disposition: 'applied',
      receipt: {
        receiptId: 'receipt.campaign-pause',
        status: 'succeeded',
        actor: 'agent.codex',
        approvalId: 'approval.campaign-pause',
      },
      verificationWindow: {
        notBefore: '2026-08-03T10:01:30.000Z',
        expiresAt: '2026-08-03T10:06:30.000Z',
      },
    });
    expect(await prepared.state.artifacts.hasReceiptForPlan(prepared.plan.planHash)).toBe(true);

    const verificationInput = {
      provider: parameters.provider,
      providerAccountId: parameters.providerAccountId,
      campaignId: parameters.campaignId,
      receipt: applied.receipt,
      verificationWindow: applied.verificationWindow,
    };
    expect(await prepared.action.verify(verificationInput, context)).toMatchObject({
      status: 'pending',
      observedCampaignStatus: null,
    });
    prepared.setTime('2026-08-03T10:02:00.000Z');
    expect(await prepared.action.verify(verificationInput, context)).toMatchObject({
      status: 'verified',
      observedCampaignStatus: 'paused',
    });
    await expect(prepared.action.apply(applyInput(prepared), context)).rejects.toThrow(
      'OPS_RECEIPT_REPLAY',
    );
  });

  it('fails closed when evidence, approval, target, or expiry no longer matches', async () => {
    const staleEvidence = await prepare();
    await expect(
      staleEvidence.action.apply(
        applyInput(staleEvidence, { currentEvidenceRevision: 'evidence-revision-4' }),
        context,
      ),
    ).rejects.toMatchObject({ code: 'growth.ads.campaign-pause.evidence-stale' });

    const changedTarget = await prepare();
    await expect(
      changedTarget.action.apply(applyInput(changedTarget, { campaignId: 'campaign-99' }), context),
    ).rejects.toMatchObject({ code: 'growth.ads.campaign-pause.target-mismatch' });

    const missingApproval = await prepare();
    await expect(
      missingApproval.action.apply(applyInput(missingApproval, { approval: undefined }), context),
    ).rejects.toThrow('OPS_APPROVAL_SCHEMA_INVALID');

    const wrongApproval = await prepare();
    await expect(
      wrongApproval.action.apply(
        applyInput(wrongApproval, {
          approval: { ...wrongApproval.approval, planHash: '0'.repeat(64) },
        }),
        context,
      ),
    ).rejects.toThrow('OPS_APPROVAL_MISMATCH');

    const expiredApproval = await prepare();
    await expect(
      expiredApproval.action.apply(
        applyInput(expiredApproval, {
          approval: {
            ...expiredApproval.approval,
            expiresAt: '2026-08-03T10:00:59.000Z',
          },
        }),
        context,
      ),
    ).rejects.toThrow('OPS_APPROVAL_EXPIRED');

    const expired = await prepare();
    expired.setTime('2026-08-03T10:11:00.000Z');
    await expect(expired.action.apply(applyInput(expired), context)).rejects.toThrow(
      'OPS_PLAN_STALE',
    );
  });

  it('preserves an unknown provider outcome and routes verification to recovery', async () => {
    const prepared = await prepare({ pauseOutcome: 'outcome-unknown', status: 'unknown' });
    const applied = await prepared.action.apply(applyInput(prepared), context);
    expect(applied).toMatchObject({
      disposition: 'outcome-unknown',
      receipt: { status: 'partial', results: [{ status: 'failed' }] },
    });

    prepared.setTime('2026-08-03T10:02:00.000Z');
    const verificationInput = {
      provider: parameters.provider,
      providerAccountId: parameters.providerAccountId,
      campaignId: parameters.campaignId,
      receipt: applied.receipt,
      verificationWindow: applied.verificationWindow,
    };
    expect(await prepared.action.verify(verificationInput, context)).toMatchObject({
      status: 'outcome-unknown',
      observedCampaignStatus: 'unknown',
    });

    prepared.setObservedStatus('active');
    expect(await prepared.action.verify(verificationInput, context)).toMatchObject({
      status: 'needs-attention',
      observedCampaignStatus: 'active',
    });
  });

  it('routes only to the selected provider and records a definite provider rejection', async () => {
    const googlePause = vi.fn().mockResolvedValue({ outcome: 'rejected' as const });
    const metaPause = vi.fn();
    const bridge = createGrowthCampaignPauseProviderBridge({
      googleAds: {
        pauseCampaign: googlePause,
        readCampaignStatus: async () => 'active',
      },
      metaAds: {
        pauseCampaign: metaPause,
        readCampaignStatus: async () => 'unknown',
      },
    });
    const prepared = await prepare({ pauseOutcome: 'rejected', status: 'active' });
    const action = createGrowthCampaignPauseAction({
      state: prepared.state,
      lockOwner: 'worker.growth',
      actor: 'developer',
      production: false,
      multiProcess: false,
      ...bridge,
      now: () => new Date('2026-08-03T10:01:00.000Z'),
      createReceiptId: () => 'receipt.provider-rejected',
    });

    const applied = await action.apply(applyInput(prepared), context);
    expect(applied).toMatchObject({
      disposition: 'failed',
      receipt: { status: 'failed', results: [{ status: 'failed' }] },
    });
    expect(googlePause).toHaveBeenCalledWith(
      expect.objectContaining({
        providerAccountId: 'account-7',
        campaignId: 'campaign-42',
        planHash: prepared.plan.planHash,
      }),
    );
    expect(metaPause).not.toHaveBeenCalled();
  });
});
