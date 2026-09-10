import {
  opsApprovalRecordSchema,
  type OpsMutationPlan,
  type OpsActionContext,
  type OpsExecutionState,
} from '@unisane/ops-engine';
export async function approveGtmPlan(
  plan: OpsMutationPlan,
  confirmPlanHash: string,
  deps: {
    context: OpsActionContext;
    state: OpsExecutionState;
    mutationPolicy: string;
    now?: () => Date;
  },
) {
  const now = deps.now ?? (() => new Date());
  const planHash = plan.planHash;
  if (deps.context.principal.kind !== 'user')
    throw new Error(
      '[GTM_HUMAN_APPROVAL_REQUIRED] An authenticated human interface must approve the exact plan.',
    );
  if (deps.mutationPolicy !== 'approval-required')
    throw new Error('[GTM_APPROVAL_DISABLED] Policy does not permit approval.');
  const value = { plan };
  if (confirmPlanHash !== value.plan.planHash)
    throw new Error('[GTM_APPROVAL_MISMATCH] Confirm the exact displayed plan hash.');
  if (Date.parse(value.plan.expiresAt) <= now().getTime())
    throw new Error('[GTM_PLAN_EXPIRED] Prepare a new workspace plan.');
  const approval = opsApprovalRecordSchema.parse({
    schemaVersion: 1,
    kind: 'ops.approval',
    approvalId: `approval.gtm.${planHash}`,
    planHash,
    actor: deps.context.principal.id,
    provider: 'google-gtm',
    projectId: deps.context.projectId,
    environment: deps.context.environmentId,
    targetIdentity: value.plan.targetIdentity,
    approvedAt: now().toISOString(),
    expiresAt: value.plan.expiresAt,
  });
  const existing = await deps.state.approvals.get(approval.approvalId);
  if (existing) {
    if (existing.planHash !== planHash || existing.actor !== approval.actor)
      throw new Error('[GTM_ALREADY_APPROVED] Another operator approved this plan.');
    return existing;
  }
  await deps.state.approvals.put(approval);
  return approval;
}
