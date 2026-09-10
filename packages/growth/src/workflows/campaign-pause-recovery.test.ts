import { expect, it, vi } from 'vitest';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
  InMemoryOpsMutationRunStore,
} from '@unisane/ops-engine/testing';
import { createGrowthCampaignPauseWorkflow } from './campaign-pause-execution.js';

it('persists attempts before dispatch and recovers a lost receipt without replay or invented success', async () => {
  let time = new Date('2026-09-06T00:00:00Z');
  const state = {
    artifacts: new InMemoryArtifactStore(),
    approvals: new InMemoryApprovalStore(),
    locks: new InMemoryLockStore(),
  };
  const runStore = new InMemoryOpsMutationRunStore();
  let runId = '';
  const pause = vi.fn(async () => {
    const stored = await runStore.get<{ attempt?: unknown }>(runId);
    expect(stored?.actionState.attempt).toBeTruthy();
    return { outcome: 'succeeded' as const };
  });
  const read = vi.fn(async () => 'paused' as const);
  const options = {
    state,
    runStore,
    providerAdapters: {
      metaAds: { pauseCampaign: pause, readCampaignStatus: read },
      googleAds: { pauseCampaign: pause, readCampaignStatus: read },
    },
    actor: 'developer' as const,
    production: false,
    multiProcess: false,
    mutationPolicy: 'approval-required' as const,
    lockOwner: 'test.worker',
    now: () => time,
  };
  let workflow = createGrowthCampaignPauseWorkflow(options);
  const parameters = {
    provider: 'metaAds' as const,
    providerAccountId: 'act_123',
    campaignId: '456',
    evidenceRevision: 'revision',
    verificationDelayMs: 0,
    verificationTtlMs: 60_000,
  };
  const context = {
    requestId: 'test.plan',
    scopeId: 'scope.shop',
    projectId: 'shop',
    environmentId: 'test',
    principal: { kind: 'user' as const, id: 'operator' },
    requestedAt: time.toISOString(),
  };
  const planned = await workflow.plan({ context, parameters, currentEvidenceRevision: 'revision' });
  runId = planned.runId;
  await workflow.approve({
    runId,
    approvedBy: 'operator',
    confirmPlanHash: planned.review.action.planHash,
  });
  vi.spyOn(state.artifacts, 'recordReceipt').mockRejectedValueOnce(new Error('disk unavailable'));
  const apply = {
    runId,
    currentEvidenceRevision: 'revision',
    confirmTarget: 'metaAds:act_123:456',
    principal: context.principal,
  };
  await expect(workflow.apply(apply)).rejects.toThrow('disk unavailable');
  workflow = createGrowthCampaignPauseWorkflow(options);
  expect((await workflow.show(runId))?.review.execution.status).toBe('outcome-unknown');
  await expect(workflow.apply(apply)).rejects.toThrow('ATTEMPT_EXISTS');
  time = new Date('2026-09-06T00:00:01Z');
  const competing = await workflow.plan({
    context,
    parameters,
    currentEvidenceRevision: 'revision',
  });
  await workflow.approve({
    runId: competing.runId,
    approvedBy: 'operator',
    confirmPlanHash: competing.review.action.planHash,
  });
  await expect(workflow.apply({ ...apply, runId: competing.runId })).rejects.toThrow(
    'RECOVERY_REQUIRED',
  );
  expect(pause).toHaveBeenCalledOnce();

  await workflow.verify({ runId, principal: context.principal });
  expect(read).not.toHaveBeenCalled();
  time = new Date('2026-09-06T00:03:00Z');
  const verified = await workflow.verify({ runId, principal: context.principal });
  expect(verified.review.execution.status).toBe('outcome-unknown');
  expect(verified.review.verification.status).toBe('verified');
  expect(pause).toHaveBeenCalledOnce();
});

it('rejects an attempt on an old approved record that lacks the execution marker', async () => {
  const state = {
    artifacts: new InMemoryArtifactStore(),
    approvals: new InMemoryApprovalStore(),
    locks: new InMemoryLockStore(),
  };
  const runStore = new InMemoryOpsMutationRunStore();
  const pause = vi.fn(async () => ({ outcome: 'succeeded' as const }));
  const adapter = { pauseCampaign: pause, readCampaignStatus: async () => 'paused' as const };
  const time = new Date('2026-09-06T00:00:00Z');
  const workflow = createGrowthCampaignPauseWorkflow({
    state,
    runStore,
    providerAdapters: { metaAds: adapter, googleAds: adapter },
    actor: 'developer',
    production: false,
    multiProcess: false,
    mutationPolicy: 'approval-required',
    lockOwner: 'test',
    now: () => time,
  });
  const context = {
    requestId: 'test',
    scopeId: 'scope.shop',
    projectId: 'shop',
    environmentId: 'test',
    principal: { kind: 'user' as const, id: 'operator' },
    requestedAt: time.toISOString(),
  };
  const p = await workflow.plan({
    context,
    parameters: {
      provider: 'metaAds',
      providerAccountId: 'act_123',
      campaignId: '456',
      evidenceRevision: 'v1',
      verificationDelayMs: 0,
      verificationTtlMs: 60000,
    },
    currentEvidenceRevision: 'v1',
  });
  await workflow.approve({
    runId: p.runId,
    approvedBy: 'operator',
    confirmPlanHash: p.review.action.planHash,
  });
  const run = await runStore.get<Record<string, unknown>>(p.runId);
  delete run!.actionState.executionRevision;
  await runStore.compareAndSet({ ...run!, revision: run!.revision + 1 }, run!.revision);
  await expect(
    workflow.apply({
      runId: p.runId,
      currentEvidenceRevision: 'v1',
      confirmTarget: 'metaAds:act_123:456',
      principal: context.principal,
    }),
  ).rejects.toThrow('REPLAN_REQUIRED');
  expect(pause).not.toHaveBeenCalled();
});
