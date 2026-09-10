import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
import type { GoogleTagManagerRemoteSnapshot, GoogleTagManagerApplyReceipt } from '../contracts.js';
import { getGoogleTagManagerDesiredResources } from '../normalize.js';
import { createGtmWorkspaceWorkflow } from './workflow.js';
import type { GtmWorkspaceActionDependencies } from './action.js';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'gtm-workspace-'));
  roots.push(root);
  let clock = new Date('2026-09-06T00:00:00Z');
  const parameters = {
    connectionId: 'google',
    workspaceId: '3',
    manifest: {
      appId: 'web',
      accountId: '1',
      containerId: '2',
      namespace: 'web',
      environments: { test: { workspacePrefix: 'test' } },
      variables: [
        {
          slug: 'event_id',
          type: 'data_layer' as const,
          parameters: [{ key: 'name', value: 'event_id' }],
        },
      ],
    },
  };
  let remote: GoogleTagManagerRemoteSnapshot = {
    containerPath: 'accounts/1/containers/2',
    workspacePath: 'accounts/1/containers/2/workspaces/3',
    resources: [],
  };
  const state = createLocalOpsExecutionState(root);
  const runStore = new LocalOpsMutationRunStore(path.join(root, 'runs'));
  const read = vi.fn(async () => remote);
  const apply = vi.fn<GtmWorkspaceActionDependencies['apply']>(
    async (review, context, beforeWrite) => {
      await beforeWrite();
      remote = {
        ...remote,
        resources: getGoogleTagManagerDesiredResources(parameters.manifest).map(
          (resource, index) => ({
            kind: resource.kind,
            slug: resource.slug,
            remoteId: String(index + 1),
            payload: resource.payload,
            managed: true,
          }),
        ),
      };
      return {
        appId: 'web',
        environment: context.environmentId,
        accountId: '1',
        containerId: '2',
        containerPath: remote.containerPath,
        workspacePath: remote.workspacePath!,
        appliedAt: clock.toISOString(),
        operationCount: review.changes.operations.length,
        appliedOperations: review.changes.operations
          .filter((operation) => operation.type !== 'retain_unmanaged_resource')
          .map((operation, index) => ({
            type: operation.type,
            kind: operation.kind,
            slug: operation.slug,
            remoteId: String(index + 1),
          })),
        skippedOperations: [],
        plan: review.changes,
      } satisfies GoogleTagManagerApplyReceipt;
    },
  );
  const deps = {
    state,
    runStore,
    read,
    apply,
    actor: 'developer' as const,
    production: false,
    multiProcess: false,
    lockOwner: 'host.test',
    now: () => clock,
    mutationPolicy: 'approval-required' as const,
    context: {
      requestId: 'request.test',
      scopeId: 'scope.project',
      projectId: 'project',
      environmentId: 'test',
      principal: { kind: 'user' as const, id: 'user.test' },
      requestedAt: clock.toISOString(),
    },
  };
  return {
    root,
    parameters,
    deps,
    read,
    apply,
    workflow: createGtmWorkspaceWorkflow(deps),
    advance: (ms: number) => {
      clock = new Date(clock.getTime() + ms);
    },
    drift: () => {
      remote = {
        ...remote,
        resources: [
          { kind: 'folder', slug: 'foreign', remoteId: '99', payload: {}, managed: false },
        ],
      };
    },
  };
}
it('requires recorded approval, applies once and verifies separately after delay', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('APPROVAL_REQUIRED');
  expect(f.apply).not.toHaveBeenCalled();
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  const result = await f.workflow.apply(review.plan.planHash);
  expect(result.disposition).toBe('applied');
  expect((await f.workflow.recover(result.runId)).status).toBe('unavailable');
  f.advance(31000);
  expect((await f.workflow.recover(result.runId)).status).toBe('verified');
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow();
  expect(f.apply).toHaveBeenCalledTimes(1);
});
it('rejects changed provider evidence before recording or invoking a write', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.drift();
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('REVIEW_DRIFT');
  expect(f.apply).not.toHaveBeenCalled();
  expect(await f.deps.runStore.get(`gtm.${review.plan.planHash}`)).toBeNull();
});
it('persists uncertainty across restart, blocks new plans from writing until recovery and preserves partial receipts', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.apply.mockRejectedValueOnce(new Error('secret provider token'));
  const result = await f.workflow.apply(review.plan.planHash);
  expect(result.disposition).toBe('outcome-unknown');
  expect(JSON.stringify(result)).not.toContain('secret');
  const restarted = createGtmWorkspaceWorkflow({
    ...f.deps,
    state: createLocalOpsExecutionState(f.root),
    runStore: new LocalOpsMutationRunStore(path.join(f.root, 'runs')),
  });
  f.advance(1000);
  const next = await restarted.plan(f.parameters);
  await restarted.approve(next.plan.planHash, next.plan.planHash);
  await expect(restarted.apply(next.plan.planHash)).rejects.toThrow('UNRECONCILED');
  f.advance(151000);
  const recovery = await restarted.recover(result.runId);
  expect(recovery.status).toBe('not-matched');
  expect(recovery.remainingOperations.length).toBeGreaterThan(0);
  expect(
    (await f.deps.runStore.get<{ receipt: { status: string } }>(result.runId))?.actionState.receipt
      .status,
  ).toBe('partial');
  expect(f.apply).toHaveBeenCalledTimes(1);
});
it('a receipt-store failure leaves the pre-write marker recoverable without replay', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  vi.spyOn(f.deps.state.artifacts, 'recordReceipt').mockRejectedValueOnce(new Error('disk full'));
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('disk full');
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('ATTEMPT_EXISTS');
  f.advance(151000);
  expect((await f.workflow.recover(`gtm.${review.plan.planHash}`)).status).toBe('verified');
  expect(f.apply).toHaveBeenCalledTimes(1);
});
it('denies agent approval, foreign-project recovery and local production writes', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  const agent = createGtmWorkspaceWorkflow({
    ...f.deps,
    context: { ...f.deps.context, principal: { kind: 'agent', id: 'agent.test' } },
  });
  await expect(agent.approve(review.plan.planHash, review.plan.planHash)).rejects.toThrow(
    'HUMAN_APPROVAL_REQUIRED',
  );
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  await expect(
    createGtmWorkspaceWorkflow({ ...f.deps, production: true }).apply(review.plan.planHash),
  ).rejects.toThrow('DURABILITY_REQUIRED');
  expect(f.apply).not.toHaveBeenCalled();
  const result = await f.workflow.apply(review.plan.planHash);
  await expect(
    createGtmWorkspaceWorkflow({
      ...f.deps,
      context: { ...f.deps.context, projectId: 'other' },
    }).recover(result.runId),
  ).rejects.toThrow('TARGET_MISMATCH');
});
