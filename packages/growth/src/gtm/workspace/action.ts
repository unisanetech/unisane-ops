import { assertGtmContainerReconciled, recordGtmContainerAttempt } from '../container-guard.js';
import { z } from 'zod';
import {
  hashOpsValue,
  assertOpsMutationPreflight,
  assertOpsMutationRunStore,
  opsMutationReceiptSchema,
  type OpsExecutionState,
  type OpsMutationRunStore,
  type OpsMutationRun,
} from '@unisane/ops-engine';
import { defineOpsMutationAction, type OpsActionContext } from '@unisane/ops-engine/actions';
import type { GoogleTagManagerRemoteSnapshot, GoogleTagManagerApplyReceipt } from '../contracts.js';
import { planGoogleTagManagerChanges } from '../plan.js';
import {
  GTM_WORKSPACE_ACTION,
  gtmWorkspacePlanInputSchema,
  gtmWorkspaceReviewSchema,
  gtmWorkspaceApplyInputSchema,
  gtmWorkspaceApplyResultSchema,
  gtmWorkspaceRecoveryInputSchema,
  gtmWorkspaceRecoveryResultSchema,
  gtmWorkspaceAttemptSchema,
  type GtmWorkspaceParameters,
  type GtmWorkspaceReview,
  type GtmWorkspaceAttempt,
} from './contracts.js';
import {
  gtmWorkspacePlan,
  assertGtmWorkspaceReview,
  gtmWorkspaceLock,
  gtmWorkspacePath,
  gtmSnapshotRevision,
} from './planning.js';
export interface GtmWorkspaceActionDependencies {
  state: OpsExecutionState;
  runStore: OpsMutationRunStore;
  lockOwner: string;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  read(
    parameters: GtmWorkspaceParameters,
    context: OpsActionContext,
  ): Promise<GoogleTagManagerRemoteSnapshot>;
  apply(
    review: GtmWorkspaceReview,
    context: OpsActionContext,
    beforeWrite: () => Promise<void>,
  ): Promise<GoogleTagManagerApplyReceipt>;
  now?: () => Date;
}
export function createGtmWorkspaceMutationAction(deps: GtmWorkspaceActionDependencies) {
  const now = deps.now ?? (() => new Date());
  return defineOpsMutationAction({
    id: GTM_WORKSPACE_ACTION,
    schemaVersion: 1,
    maximumEffect: 'write-network',
    approvalMode: 'exact-plan',
    receiptMode: 'immutable',
    verificationMode: 'delayed-read',
    planInputSchema: gtmWorkspacePlanInputSchema,
    planOutputSchema: gtmWorkspaceReviewSchema,
    applyInputSchema: gtmWorkspaceApplyInputSchema,
    applyOutputSchema: gtmWorkspaceApplyResultSchema,
    verifyInputSchema: gtmWorkspaceRecoveryInputSchema,
    verifyOutputSchema: gtmWorkspaceRecoveryResultSchema,
    plan: (input, context) => gtmWorkspacePlan(input, context),
    async apply(raw, context) {
      const input = gtmWorkspaceApplyInputSchema.parse(raw);
      const { review } = input;
      assertGtmWorkspaceReview(review, context);
      assertOpsMutationRunStore({
        store: deps.runStore,
        actor: deps.actor,
        production: deps.production,
        multiProcess: deps.multiProcess,
      });
      if (!deps.runStore.atomic)
        throw new Error(
          '[GTM_ATOMIC_RUN_STORE_REQUIRED] Workspace writes require atomic attempt storage.',
        );
      await assertOpsMutationPreflight({
        plan: review.plan,
        approval: input.approval,
        lease: input.lease,
        expectation: {
          provider: 'google-gtm',
          projectId: context.projectId,
          environment: context.environmentId,
          targetIdentity: gtmWorkspacePath(review.parameters),
          lockId: gtmWorkspaceLock(review.parameters),
        },
        actor: deps.actor,
        production: deps.production,
        multiProcess: deps.multiProcess,
        lockOwner: deps.lockOwner,
        state: deps.state,
        now: now(),
      });
      const runId = `gtm.${review.plan.planHash}`;
      if (await deps.runStore.get(runId))
        throw new Error(
          '[GTM_ATTEMPT_EXISTS] Inspect and recover the recorded attempt; it cannot be replayed.',
        );
      const pointerId = `gtm.workspace.${hashOpsValue(gtmWorkspacePath(review.parameters))}`;
      const pointer = await deps.state.artifacts.get(pointerId);
      if (pointer) {
        const priorId = gtmWorkspaceRecoveryInputSchema.parse(pointer.value).runId;
        const prior = await deps.runStore.get<GtmWorkspaceAttempt>(priorId);
        if (!prior)
          throw new Error(
            '[GTM_ATTEMPT_REFERENCE_MISSING] Workspace attempt reference is invalid.',
          );
        const priorAttempt = gtmWorkspaceAttemptSchema.parse(prior.actionState);
        if (!priorAttempt.verification || priorAttempt.verification.status === 'unavailable')
          throw new Error(
            '[GTM_WORKSPACE_UNRECONCILED] Recover the earlier workspace attempt before applying another plan.',
          );
      }
      await assertGtmContainerReconciled(deps.state, deps.runStore, review.parameters.manifest);
      const current = await deps.read(review.parameters, context);
      if (
        current.workspacePath !== gtmWorkspacePath(review.parameters) ||
        gtmSnapshotRevision(current) !== review.plan.inventoryHash
      )
        throw new Error('[GTM_REVIEW_DRIFT] Workspace inventory changed; prepare a new plan.');
      const startedAt = now().toISOString();
      const run: OpsMutationRun<GtmWorkspaceAttempt> = {
        schemaVersion: 1,
        kind: 'ops.mutation-run',
        runId,
        revision: 1,
        actionId: GTM_WORKSPACE_ACTION,
        actionSchemaVersion: 1,
        projectId: context.projectId,
        environmentId: context.environmentId,
        targetId: `workspace.${hashOpsValue(gtmWorkspacePath(review.parameters))}`,
        phase: 'attention',
        actionState: {
          review,
          status: 'started',
          notBefore: new Date(Date.parse(input.lease.expiresAt) + 30000).toISOString(),
        },
        createdAt: startedAt,
        updatedAt: startedAt,
      };
      if ((await deps.runStore.compareAndSet(run, null)) !== 'stored')
        throw new Error(
          '[GTM_ATTEMPT_CONFLICT] Another caller recorded this attempt. Read its status before continuing.',
        );
      await deps.state.artifacts.put({
        id: pointerId,
        kind: 'state',
        value: { runId },
        createdAt: startedAt,
        expiresAt: null,
      });
      await recordGtmContainerAttempt(deps.state, review.parameters.manifest, runId, startedAt);
      let disposition: 'applied' | 'outcome-unknown' = 'outcome-unknown';
      let output: GoogleTagManagerApplyReceipt | undefined;
      try {
        await deps.state.locks.assertCurrent(input.lease, now().toISOString());
        output = await deps.apply(review, context, () =>
          deps.state.locks.assertCurrent(input.lease, now().toISOString()),
        );
        if (
          output.workspacePath !== review.plan.targetIdentity ||
          output.accountId !== review.parameters.manifest.accountId ||
          output.containerId !== review.parameters.manifest.containerId ||
          output.appId !== review.parameters.manifest.appId ||
          output.environment !== context.environmentId ||
          hashOpsValue(output.plan) !== hashOpsValue(review.changes)
        )
          throw new Error('Provider receipt mismatch');
        const expectedWrites = review.changes.operations.filter(
          (operation) => operation.type !== 'retain_unmanaged_resource',
        );
        if (
          output.appliedOperations.length !== expectedWrites.length ||
          expectedWrites.some((operation, index) => {
            const actual = output!.appliedOperations[index];
            return (
              !actual ||
              actual.type !== operation.type ||
              actual.kind !== operation.kind ||
              actual.slug !== operation.slug ||
              !actual.remoteId
            );
          })
        )
          throw new Error('Provider operation receipt incomplete');
        disposition = 'applied';
      } catch {
        output = undefined;
      }
      const completedAt = now().toISOString();
      const receipt = opsMutationReceiptSchema.parse({
        schemaVersion: 1,
        kind: 'ops.mutation-receipt',
        receiptId: `receipt.${review.plan.planHash}`,
        planId: review.plan.planId,
        planHash: review.plan.planHash,
        provider: 'google-gtm',
        projectId: context.projectId,
        environment: context.environmentId,
        targetIdentity: review.plan.targetIdentity,
        actor: context.principal.id,
        approvalId: input.approval.approvalId,
        lockId: input.lease.lockId,
        lockFencingValue: input.lease.fencingValue,
        startedAt,
        completedAt,
        status: disposition === 'applied' ? 'succeeded' : 'partial',
        results: review.plan.actions.map((action) => ({
          actionId: action.id,
          status: disposition === 'applied' ? 'succeeded' : 'failed',
          outputHash: output ? hashOpsValue(output) : null,
        })),
      });
      await deps.state.artifacts.recordReceipt(receipt);
      if (
        (await deps.runStore.compareAndSet(
          {
            ...run,
            revision: 2,
            updatedAt: completedAt,
            phase: disposition === 'applied' ? 'applied' : 'attention',
            actionState: {
              review,
              status: disposition === 'applied' ? 'completed' : 'uncertain',
              notBefore:
                disposition === 'applied'
                  ? new Date(now().getTime() + 30000).toISOString()
                  : run.actionState.notBefore,
              receipt,
            },
          },
          1,
        )) !== 'stored'
      )
        throw new Error(
          '[GTM_ATTEMPT_RECORD_CONFLICT] Receipt was recorded; recover the attempt before any further write.',
        );
      return { runId, disposition, receipt };
    },
    async verify(raw, context) {
      const { runId } = gtmWorkspaceRecoveryInputSchema.parse(raw);
      const run = await deps.runStore.get<GtmWorkspaceAttempt>(runId);
      if (
        !run ||
        run.actionId !== GTM_WORKSPACE_ACTION ||
        run.projectId !== context.projectId ||
        run.environmentId !== context.environmentId
      )
        throw new Error(
          '[GTM_ATTEMPT_TARGET_MISMATCH] Attempt is not in this project/environment.',
        );
      const attempt = gtmWorkspaceAttemptSchema.parse(run.actionState);
      assertGtmWorkspaceReview(attempt.review, context);
      if (runId !== `gtm.${attempt.review.plan.planHash}`)
        throw new Error('[GTM_ATTEMPT_CORRUPT] Attempt identifier does not match its plan.');
      z.string().datetime().parse(attempt.notBefore);
      const checkedAt = now().toISOString();
      const pending = now().getTime() < Date.parse(attempt.notBefore);
      let status: 'verified' | 'not-matched' | 'unavailable' = 'unavailable';
      let remainingOperations: GtmWorkspaceReview['changes']['operations'] = [];
      try {
        if (pending) throw new Error('Verification delay pending');
        const current = await deps.read(attempt.review.parameters, context);
        if (current.workspacePath !== gtmWorkspacePath(attempt.review.parameters))
          throw new Error('Wrong workspace');
        remainingOperations = planGoogleTagManagerChanges({
          manifest: attempt.review.parameters.manifest,
          remote: current,
        }).operations.filter((operation) => operation.type !== 'retain_unmanaged_resource');
        status = remainingOperations.length === 0 ? 'verified' : 'not-matched';
      } catch {
        /* Unknown evidence is not successful verification. */
      }
      const result = gtmWorkspaceRecoveryResultSchema.parse({
        runId,
        projectId: context.projectId,
        environmentId: context.environmentId,
        workspacePath: gtmWorkspacePath(attempt.review.parameters),
        checkedAt,
        status,
        remainingOperations,
        trackingVerified: false,
        message:
          status === 'verified'
            ? 'Workspace matches desired state; publication and event delivery remain unverified.'
            : status === 'not-matched'
              ? 'Workspace differs from desired state. Review a new plan for remaining changes; this attempt cannot be replayed.'
              : pending
                ? `Verification can begin at ${attempt.notBefore}. Do not retry writes while the attempt settles.`
                : 'Workspace could not be inspected. Do not retry writes until the outcome is reconciled.',
      });
      const stored = await deps.runStore.compareAndSet(
        {
          ...run,
          revision: run.revision + 1,
          updatedAt: checkedAt,
          phase: status === 'verified' ? 'verified' : 'attention',
          actionState: { ...attempt, verification: result },
        },
        run.revision,
      );
      if (stored !== 'stored')
        throw new Error(
          '[GTM_RECOVERY_CONFLICT] Attempt changed while being inspected; read it again.',
        );
      return result;
    },
  });
}
