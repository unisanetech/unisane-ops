import { z } from 'zod';
import {
  opsApprovalRecordSchema,
  type OpsApprovalRecord,
  type OpsExecutionState,
} from '@unisane/ops-engine';
import type { GrowthCampaignPauseRunCoordinator } from '../playbooks/campaign-pause-run.js';
import type { GrowthCampaignPauseReview } from '../playbooks/campaign-pause-review.js';

const nonEmptySchema = z.string().trim().min(1);
const durationSchema = z.number().int().min(1_000).max(3_600_000);

export type ApproveGrowthCampaignPauseInput = {
  state: Pick<OpsExecutionState, 'approvals'>;
  coordinator: GrowthCampaignPauseRunCoordinator;
  mutationPolicy: 'disabled' | 'plan-only' | 'approval-required';
  runId: string;
  approvedBy: string;
  confirmPlanHash: string;
  approvalTtlMs?: number;
  now?: () => Date;
  createApprovalId?: (planHash: string) => string;
};

function approvalMatchesActor(
  approval: OpsApprovalRecord,
  approvedBy: string,
  planHash: string,
): boolean {
  return approval.actor === approvedBy && approval.planHash === planHash;
}

export async function approveGrowthCampaignPause(
  input: ApproveGrowthCampaignPauseInput,
): Promise<GrowthCampaignPauseReview> {
  if (input.mutationPolicy !== 'approval-required') {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_POLICY_REQUIRED] Growth policy does not admit approved campaign changes.',
    );
  }
  const runId = nonEmptySchema.parse(input.runId);
  const approvedBy = nonEmptySchema.parse(input.approvedBy);
  const confirmPlanHash = nonEmptySchema.parse(input.confirmPlanHash);
  const run = await input.coordinator.getRun(runId);
  if (!run) {
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.');
  }
  if (confirmPlanHash !== run.actionState.plan.planHash) {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_CONFIRMATION_MISMATCH] Confirm the exact plan hash before approval.',
    );
  }
  const currentReview = await input.coordinator.getReview(runId);
  if (!currentReview) {
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.');
  }
  if (currentReview.approval.status === 'valid' && run.actionState.approval) {
    if (approvalMatchesActor(run.actionState.approval, approvedBy, confirmPlanHash)) {
      return currentReview;
    }
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_ALREADY_APPROVED] Another operator already approved this exact plan.',
    );
  }
  if (currentReview.status === 'plan-stale') {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_STALE] This pause plan is no longer current. Create a new plan before approval.',
    );
  }
  if (currentReview.execution.status !== 'not-started') {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_TOO_LATE] Approval cannot change after a provider request.',
    );
  }

  const now = input.now ?? (() => new Date());
  const approvedAt = now();
  const approvalTtlMs = durationSchema.parse(input.approvalTtlMs ?? 600_000);
  const approval: OpsApprovalRecord = opsApprovalRecordSchema.parse({
    schemaVersion: 1,
    kind: 'ops.approval',
    approvalId:
      input.createApprovalId?.(run.actionState.plan.planHash) ??
      `approval.${run.actionState.plan.planHash.slice(0, 24)}`,
    planHash: run.actionState.plan.planHash,
    actor: approvedBy,
    provider: run.actionState.plan.provider,
    projectId: run.actionState.plan.projectId,
    environment: run.actionState.plan.environment,
    targetIdentity: run.actionState.plan.targetIdentity,
    approvedAt: approvedAt.toISOString(),
    expiresAt: new Date(approvedAt.getTime() + approvalTtlMs).toISOString(),
  });
  await input.state.approvals.put(approval);
  await input.coordinator.recordApproval({ runId, approval });
  const review = await input.coordinator.getReview(runId);
  if (!review) {
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.');
  }
  return review;
}
