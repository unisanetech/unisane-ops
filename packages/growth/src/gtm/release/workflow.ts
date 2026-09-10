import { defineOpsMutationAction } from '@unisane/ops-engine/actions';
import { assertGtmContainerReconciled, recordGtmContainerAttempt } from '../container-guard.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  hashOpsValue,
  assertOpsMutationPreflight,
  assertOpsMutationRunStore,
  opsMutationReceiptSchema,
  type OpsActionContext,
  type OpsExecutionState,
  type OpsMutationRunStore,
  type OpsMutationRun,
} from '@unisane/ops-engine';
import { approveGtmPlan } from '../approval.js';
import {
  gtmReleaseParametersSchema,
  gtmReleaseReviewSchema,
  gtmReleaseAttemptSchema,
  gtmReleaseResultSchema,
  gtmReleaseRecoverySchema,
  type GtmReleaseParameters,
  type GtmReleaseReview,
  type GtmReleaseEvidence,
  type GtmReleaseAttempt,
} from './contracts.js';
import {
  GTM_RELEASE_ACTION,
  gtmContainerIdentity,
  createGtmReleasePlan,
  assertGtmReleaseReview,
} from './planning.js';
export interface GtmReleaseDependencies {
  state: OpsExecutionState;
  runStore: OpsMutationRunStore;
  context: OpsActionContext;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  lockOwner: string;
  mutationPolicy: 'disabled' | 'plan-only' | 'approval-required';
  now?: () => Date;
  inspect(parameters: GtmReleaseParameters): Promise<GtmReleaseEvidence>;
  execute(
    review: GtmReleaseReview,
    beforeWrite: () => Promise<void>,
  ): Promise<{ versionId: string }>;
  observe(
    review: GtmReleaseReview,
    versionId: string | null,
  ): Promise<{ status: 'verified' | 'not-matched' | 'unavailable'; versionId: string | null }>;
}
export function createGtmReleaseWorkflow(deps: GtmReleaseDependencies) {
  const now = deps.now ?? (() => new Date());
  const hash = z.string().regex(/^[a-f0-9]{64}$/);
  async function review(planHash: string) {
    hash.parse(planHash);
    const stored = await deps.state.artifacts.get(`gtm.release.plan.${planHash}`);
    if (!stored || stored.kind !== 'plan')
      throw new Error('[GTM_PLAN_NOT_FOUND] Release plan not found.');
    const result = gtmReleaseReviewSchema.parse(stored.value);
    assertGtmReleaseReview(result, deps.context);
    if (result.plan.planHash !== planHash)
      throw new Error('[GTM_REVIEW_CHANGED] Plan identity changed.');
    return result;
  }
  const workflow = {
    review,
    async plan(raw: GtmReleaseParameters) {
      if (deps.mutationPolicy === 'disabled')
        throw new Error('[GTM_MUTATION_DISABLED] Growth changes are disabled.');
      let parameters = gtmReleaseParametersSchema.parse(raw);
      // The unique name is part of the reviewed effects and supports uncertain creation recovery.
      if (parameters.kind === 'version')
        parameters = { ...parameters, name: `${parameters.name} [ops:${randomUUID()}]` };
      const evidence = await deps.inspect(parameters);
      const result = createGtmReleasePlan(
        parameters,
        evidence,
        deps.context,
        now().toISOString(),
        new Date(now().getTime() + 600000).toISOString(),
      );
      await deps.state.artifacts.put({
        id: `gtm.release.plan.${result.plan.planHash}`,
        kind: 'plan',
        value: result,
        createdAt: result.plan.generatedAt,
        expiresAt: result.plan.expiresAt,
      });
      return result;
    },
    async approve(planHash: string, confirmPlanHash: string) {
      return approveGtmPlan((await review(planHash)).plan, confirmPlanHash, deps);
    },
    async apply(planHash: string) {
      if (deps.mutationPolicy !== 'approval-required')
        throw new Error('[GTM_APPLY_DISABLED] Policy does not permit release writes.');
      const value = await review(planHash);
      assertOpsMutationRunStore({ store: deps.runStore, ...deps });
      if (!deps.runStore.atomic)
        throw new Error('[GTM_ATOMIC_RUN_STORE_REQUIRED] Atomic attempt storage is required.');
      const approval = await deps.state.approvals.get(`approval.gtm.${planHash}`);
      if (!approval)
        throw new Error('[GTM_APPROVAL_REQUIRED] Approve the exact release plan first.');
      const container = gtmContainerIdentity(value.parameters);
      const lockId = `google-gtm:${container}`;
      const lease = await deps.state.locks.acquire({
        lockId,
        owner: deps.lockOwner,
        ttlMs: 120000,
        now: now().toISOString(),
      });
      if (!lease)
        throw new Error('[GTM_WORKSPACE_LOCKED] Another operation holds the container lease.');
      try {
        await assertOpsMutationPreflight({
          plan: value.plan,
          approval,
          lease,
          expectation: {
            provider: 'google-gtm',
            projectId: deps.context.projectId,
            environment: deps.context.environmentId,
            targetIdentity: value.plan.targetIdentity,
            lockId,
          },
          actor: deps.actor,
          production: deps.production,
          multiProcess: deps.multiProcess,
          lockOwner: deps.lockOwner,
          state: deps.state,
          now: now(),
        });
        const runId = `gtmrelease.${planHash}`;
        if (await deps.runStore.get(runId))
          throw new Error('[GTM_ATTEMPT_EXISTS] Recover this attempt; never replay it.');
        const pointerId = `gtm.release.container.${hashOpsValue(container)}`;
        const prior = await deps.state.artifacts.get<{ runId: string }>(pointerId);
        if (prior) {
          const previous = await deps.runStore.get(prior.value.runId);
          const state = previous && gtmReleaseAttemptSchema.parse(previous.actionState);
          if (!state || !state.verification || state.verification.status === 'unavailable')
            throw new Error(
              '[GTM_WORKSPACE_UNRECONCILED] Recover the previous container release first.',
            );
        }
        await assertGtmContainerReconciled(deps.state, deps.runStore, value.parameters.manifest);
        if (hashOpsValue(await deps.inspect(value.parameters)) !== value.plan.inventoryHash)
          throw new Error('[GTM_REVIEW_DRIFT] Compiled or live version evidence changed.');
        const startedAt = now().toISOString();
        const run: OpsMutationRun<GtmReleaseAttempt> = {
          schemaVersion: 1,
          kind: 'ops.mutation-run',
          runId,
          revision: 1,
          actionId: GTM_RELEASE_ACTION,
          actionSchemaVersion: 1,
          projectId: deps.context.projectId,
          environmentId: deps.context.environmentId,
          targetId: `container.${hashOpsValue(container)}`,
          phase: 'attention',
          createdAt: startedAt,
          updatedAt: startedAt,
          actionState: {
            review: value,
            notBefore: new Date(Date.parse(lease.expiresAt) + 30000).toISOString(),
            versionId: null,
          },
        };
        if ((await deps.runStore.compareAndSet(run, null)) !== 'stored')
          throw new Error('[GTM_ATTEMPT_EXISTS] Another execution recorded this attempt.');
        await deps.state.artifacts.put({
          id: pointerId,
          kind: 'state',
          value: { runId },
          createdAt: startedAt,
          expiresAt: null,
        });
        await recordGtmContainerAttempt(deps.state, value.parameters.manifest, runId, startedAt);
        let versionId: string | null = null;
        try {
          await deps.state.locks.assertCurrent(lease, now().toISOString());
          const output = await deps.execute(value, () =>
            deps.state.locks.assertCurrent(lease, now().toISOString()),
          );
          versionId = z.string().regex(/^\d+$/).parse(output.versionId);
          if (value.parameters.kind === 'publish' && versionId !== value.parameters.versionId)
            throw new Error('Wrong version');
        } catch {
          versionId = null;
        }
        const completedAt = now().toISOString();
        const disposition = versionId ? 'applied' : 'outcome-unknown';
        const receipt = opsMutationReceiptSchema.parse({
          schemaVersion: 1,
          kind: 'ops.mutation-receipt',
          receiptId: `receipt.${planHash}`,
          planId: value.plan.planId,
          planHash,
          provider: 'google-gtm',
          projectId: deps.context.projectId,
          environment: deps.context.environmentId,
          targetIdentity: value.plan.targetIdentity,
          actor: deps.context.principal.id,
          approvalId: approval.approvalId,
          lockId,
          lockFencingValue: lease.fencingValue,
          startedAt,
          completedAt,
          status: versionId ? 'succeeded' : 'partial',
          results: value.plan.actions.map((action) => ({
            actionId: action.id,
            status: versionId ? 'succeeded' : 'failed',
            outputHash: versionId ? hashOpsValue({ versionId }) : null,
          })),
        });
        await deps.state.artifacts.recordReceipt(receipt);
        if (
          (await deps.runStore.compareAndSet(
            {
              ...run,
              revision: 2,
              updatedAt: completedAt,
              phase: versionId ? 'applied' : 'attention',
              actionState: {
                ...run.actionState,
                versionId,
                receipt,
                notBefore: versionId
                  ? new Date(now().getTime() + 30000).toISOString()
                  : run.actionState.notBefore,
              },
            },
            1,
          )) !== 'stored'
        )
          throw new Error(
            '[GTM_ATTEMPT_RECORD_CONFLICT] Recover the persisted attempt before further writes.',
          );
        return gtmReleaseResultSchema.parse({ runId, disposition, versionId, receipt });
      } finally {
        await deps.state.locks.release(lease);
      }
    },
    async recover(runId: string) {
      z.string()
        .regex(/^gtmrelease\.[a-f0-9]{64}$/)
        .parse(runId);
      const run = await deps.runStore.get<GtmReleaseAttempt>(runId);
      if (
        !run ||
        run.actionId !== GTM_RELEASE_ACTION ||
        run.projectId !== deps.context.projectId ||
        run.environmentId !== deps.context.environmentId
      )
        throw new Error('[GTM_ATTEMPT_TARGET_MISMATCH] Attempt belongs to another target.');
      const attempt = gtmReleaseAttemptSchema.parse(run.actionState);
      assertGtmReleaseReview(attempt.review, deps.context);
      if (runId !== `gtmrelease.${attempt.review.plan.planHash}`)
        throw new Error('[GTM_ATTEMPT_CORRUPT] Attempt identity changed.');
      let observed: {
        status: 'verified' | 'not-matched' | 'unavailable';
        versionId: string | null;
      } = { status: 'unavailable', versionId: null };
      const pending = now().getTime() < Date.parse(attempt.notBefore);
      if (!pending) {
        try {
          observed = await deps.observe(attempt.review, attempt.versionId);
        } catch {
          /* Unknown evidence does not authorize a retry. */
        }
      }
      const result = gtmReleaseRecoverySchema.parse({
        runId,
        projectId: deps.context.projectId,
        environmentId: deps.context.environmentId,
        checkedAt: now().toISOString(),
        ...observed,
        trackingVerified: false,
        message: pending
          ? `Verification can begin at ${attempt.notBefore}. Do not replay writes.`
          : observed.status === 'verified'
            ? 'Exact version state verified. Event delivery remains unverified.'
            : observed.status === 'not-matched'
              ? 'Current state does not match. Prepare a new reviewed plan; do not replay this attempt.'
              : 'Evidence is missing or ambiguous. Inspect provider state before further writes.',
      });
      if (
        (await deps.runStore.compareAndSet(
          {
            ...run,
            revision: run.revision + 1,
            updatedAt: result.checkedAt,
            phase: result.status === 'verified' ? 'verified' : 'attention',
            actionState: { ...attempt, verification: result },
          },
          run.revision,
        )) !== 'stored'
      )
        throw new Error('[GTM_RECOVERY_CONFLICT] Attempt changed; inspect again.');
      return result;
    },
  };
  const assertContext = (context: OpsActionContext) => {
    if (
      context.projectId !== deps.context.projectId ||
      context.environmentId !== deps.context.environmentId ||
      hashOpsValue(context.principal) !== hashOpsValue(deps.context.principal)
    )
      throw new Error('[GTM_ACTION_BINDING_MISMATCH] Action context differs from its bound host.');
  };
  const action = defineOpsMutationAction({
    id: GTM_RELEASE_ACTION,
    schemaVersion: 1,
    maximumEffect: 'write-network',
    approvalMode: 'exact-plan',
    receiptMode: 'immutable',
    verificationMode: 'delayed-read',
    planInputSchema: gtmReleaseParametersSchema,
    planOutputSchema: gtmReleaseReviewSchema,
    applyInputSchema: z.object({ planHash: hash }).strict(),
    applyOutputSchema: gtmReleaseResultSchema,
    verifyInputSchema: z.object({ runId: z.string().regex(/^gtmrelease\.[a-f0-9]{64}$/) }).strict(),
    verifyOutputSchema: gtmReleaseRecoverySchema,
    plan: (input, context) => {
      assertContext(context);
      return workflow.plan(input);
    },
    apply: (input, context) => {
      assertContext(context);
      return workflow.apply(input.planHash);
    },
    verify: (input, context) => {
      assertContext(context);
      return workflow.recover(input.runId);
    },
  });
  return {
    ...workflow,
    action,
    plan: (input: GtmReleaseParameters) => action.plan(input, deps.context),
    apply: (planHash: string) => action.apply({ planHash }, deps.context),
    recover: (runId: string) => action.verify({ runId }, deps.context),
  };
}
