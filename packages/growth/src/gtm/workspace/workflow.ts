import { approveGtmPlan } from '../approval.js';
import { z } from 'zod';
import { type OpsActionContext } from '@unisane/ops-engine';
import { createGtmWorkspaceMutationAction, type GtmWorkspaceActionDependencies } from './action.js';
import {
  gtmWorkspaceParametersSchema,
  gtmWorkspaceReviewSchema,
  type GtmWorkspaceParameters,
} from './contracts.js';
import { assertGtmWorkspaceReview, gtmWorkspaceLock } from './planning.js';
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export function createGtmWorkspaceWorkflow(
  deps: GtmWorkspaceActionDependencies & {
    context: OpsActionContext;
    mutationPolicy: 'disabled' | 'plan-only' | 'approval-required';
  },
) {
  const action = createGtmWorkspaceMutationAction(deps);
  const now = deps.now ?? (() => new Date());
  async function review(planHash: string) {
    hashSchema.parse(planHash);
    const record = await deps.state.artifacts.get(`gtm.plan.${planHash}`);
    if (!record || record.kind !== 'plan')
      throw new Error('[GTM_PLAN_NOT_FOUND] Workspace plan was not found.');
    const value = gtmWorkspaceReviewSchema.parse(record.value);
    if (value.plan.planHash !== planHash)
      throw new Error(
        '[GTM_PLAN_REFERENCE_MISMATCH] Stored plan reference does not match its content.',
      );
    assertGtmWorkspaceReview(value, deps.context);
    return value;
  }
  return {
    review,
    async plan(raw: GtmWorkspaceParameters) {
      if (deps.mutationPolicy === 'disabled')
        throw new Error('[GTM_MUTATION_DISABLED] Growth policy disables workspace changes.');
      const parameters = gtmWorkspaceParametersSchema.parse(raw);
      const snapshot = await deps.read(parameters, deps.context);
      const generatedAt = now();
      const result = await action.plan(
        {
          ...parameters,
          snapshot: {
            ...snapshot,
            resources: snapshot.resources.map((resource) => ({ ...resource })),
          },
          generatedAt: generatedAt.toISOString(),
          expiresAt: new Date(generatedAt.getTime() + 600000).toISOString(),
        },
        deps.context,
      );
      await deps.state.artifacts.put({
        id: `gtm.plan.${result.plan.planHash}`,
        kind: 'plan',
        value: result,
        createdAt: generatedAt.toISOString(),
        expiresAt: result.plan.expiresAt,
      });
      return result;
    },
    async approve(planHash: string, confirmPlanHash: string) {
      const value = await review(planHash);
      return approveGtmPlan(value.plan, confirmPlanHash, deps);
    },
    async apply(planHash: string) {
      if (deps.mutationPolicy !== 'approval-required')
        throw new Error('[GTM_APPLY_DISABLED] Policy does not permit workspace writes.');
      const value = await review(planHash);
      const approval = await deps.state.approvals.get(`approval.gtm.${planHash}`);
      if (!approval)
        throw new Error(
          '[GTM_APPROVAL_REQUIRED] Review and approve this exact plan before applying.',
        );
      const lease = await deps.state.locks.acquire({
        lockId: gtmWorkspaceLock(value.parameters),
        owner: deps.lockOwner,
        ttlMs: 120000,
        now: now().toISOString(),
      });
      if (!lease)
        throw new Error('[GTM_WORKSPACE_LOCKED] Another operation holds the workspace lease.');
      try {
        return await action.apply({ review: value, approval, lease }, deps.context);
      } finally {
        await deps.state.locks.release(lease);
      }
    },
    recover: (runId: string) => action.verify({ runId }, deps.context),
  };
}
export type GtmWorkspaceWorkflow = ReturnType<typeof createGtmWorkspaceWorkflow>;
