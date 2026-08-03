import { z } from 'zod';
import {
  opsApprovalRecordSchema,
  opsMutationPlanSchema,
  type OpsApprovalRecord,
} from '@unisane/ops-engine';
import {
  assertGrowthCampaignPausePlanBindings,
  growthCampaignPauseApplyOutputSchema,
  growthCampaignPauseParametersSchema,
  growthCampaignPauseVerificationSchema,
  type GrowthCampaignPauseApplyOutput,
  type GrowthCampaignPauseParameters,
  type GrowthCampaignPauseVerification,
} from '../actions/campaign-pause.js';

const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const growthCampaignPauseReviewInputSchema = z
  .object({
    parameters: growthCampaignPauseParametersSchema,
    currentEvidenceRevision: nonEmptySchema,
    plan: opsMutationPlanSchema,
    approval: opsApprovalRecordSchema.nullable().default(null),
    applyOutput: growthCampaignPauseApplyOutputSchema.nullable().default(null),
    verification: growthCampaignPauseVerificationSchema.nullable().default(null),
    now: isoTimestampSchema,
  })
  .strict();
export type GrowthCampaignPauseReviewInput = z.input<typeof growthCampaignPauseReviewInputSchema>;

const nextStepSchema = z
  .object({
    id: z.enum([
      'create-new-plan',
      'request-approval',
      'apply-approved-pause',
      'wait-to-check',
      'check-again',
      'inspect-provider',
      'none',
    ]),
    label: nonEmptySchema.max(100),
    reason: nonEmptySchema.max(280),
    deepLink: nonEmptySchema.max(200),
  })
  .strict();

export const growthCampaignPauseReviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('growth.campaign-pause-review'),
    action: z
      .object({
        id: z.literal('growth.ads.campaign.pause'),
        schemaVersion: z.literal(1),
        planId: nonEmptySchema,
        planHash: nonEmptySchema,
      })
      .strict(),
    projectId: nonEmptySchema,
    environmentId: nonEmptySchema,
    target: z
      .object({
        provider: z.enum(['googleAds', 'metaAds']),
        providerLabel: z.enum(['Google Ads', 'Meta Ads']),
        providerAccountId: nonEmptySchema,
        campaignId: nonEmptySchema,
      })
      .strict(),
    effect: z
      .object({
        title: z.literal('Pause campaign delivery'),
        summary: nonEmptySchema.max(280),
        risk: z.literal('medium'),
        reversibility: nonEmptySchema.max(280),
      })
      .strict(),
    evidence: z
      .object({
        plannedRevision: nonEmptySchema,
        currentRevision: nonEmptySchema,
        status: z.enum(['current', 'stale']),
      })
      .strict(),
    approval: z
      .object({
        status: z.enum(['required', 'valid', 'expired', 'invalid']),
        approvalId: nonEmptySchema.nullable(),
        approvedBy: nonEmptySchema.nullable(),
        expiresAt: isoTimestampSchema.nullable(),
      })
      .strict(),
    execution: z
      .object({
        status: z.enum(['not-started', 'succeeded', 'failed', 'outcome-unknown']),
        receiptId: nonEmptySchema.nullable(),
        completedAt: isoTimestampSchema.nullable(),
      })
      .strict(),
    verification: z
      .object({
        status: z.enum([
          'not-started',
          'pending',
          'verified',
          'needs-attention',
          'outcome-unknown',
        ]),
        checkedAt: isoTimestampSchema.nullable(),
        notBefore: isoTimestampSchema.nullable(),
        expiresAt: isoTimestampSchema.nullable(),
        observedCampaignStatus: z.enum(['paused', 'active', 'unknown']).nullable(),
      })
      .strict(),
    status: z.enum([
      'plan-stale',
      'approval-required',
      'ready-to-apply',
      'verification-pending',
      'verified',
      'needs-attention',
      'outcome-unknown',
    ]),
    headline: nonEmptySchema.max(120),
    explanation: nonEmptySchema.max(280),
    nextStep: nextStepSchema,
  })
  .strict();
export type GrowthCampaignPauseReview = z.infer<typeof growthCampaignPauseReviewSchema>;

const advertisingDeepLink = '/advertising/all/campaigns';

function approvalMatches(
  approval: OpsApprovalRecord,
  plan: z.infer<typeof opsMutationPlanSchema>,
): boolean {
  return (
    approval.planHash === plan.planHash &&
    approval.provider === plan.provider &&
    approval.projectId === plan.projectId &&
    approval.environment === plan.environment &&
    approval.targetIdentity === plan.targetIdentity
  );
}

function assertApplyOutputMatches(
  applyOutput: GrowthCampaignPauseApplyOutput,
  plan: z.infer<typeof opsMutationPlanSchema>,
): void {
  const receipt = applyOutput.receipt;
  if (
    receipt.planId !== plan.planId ||
    receipt.planHash !== plan.planHash ||
    receipt.provider !== plan.provider ||
    receipt.projectId !== plan.projectId ||
    receipt.environment !== plan.environment ||
    receipt.targetIdentity !== plan.targetIdentity
  ) {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_REVIEW_RECEIPT_MISMATCH] The receipt does not belong to this campaign pause plan.',
    );
  }
}

function assertVerificationMatches(
  verification: GrowthCampaignPauseVerification,
  applyOutput: GrowthCampaignPauseApplyOutput,
  parameters: GrowthCampaignPauseParameters,
): void {
  if (
    verification.receiptId !== applyOutput.receipt.receiptId ||
    verification.planHash !== applyOutput.receipt.planHash ||
    verification.provider !== parameters.provider ||
    verification.providerAccountId !== parameters.providerAccountId ||
    verification.campaignId !== parameters.campaignId
  ) {
    throw new Error(
      '[GROWTH_CAMPAIGN_PAUSE_REVIEW_VERIFICATION_MISMATCH] The verification result does not belong to this campaign pause receipt.',
    );
  }
}

function executionStatus(
  applyOutput: GrowthCampaignPauseApplyOutput | null,
): GrowthCampaignPauseReview['execution']['status'] {
  if (!applyOutput) return 'not-started';
  if (applyOutput.disposition === 'applied') return 'succeeded';
  return applyOutput.disposition;
}

function resultState(input: {
  planExpired: boolean;
  evidenceStale: boolean;
  approvalStatus: GrowthCampaignPauseReview['approval']['status'];
  applyOutput: GrowthCampaignPauseApplyOutput | null;
  verification: GrowthCampaignPauseVerification | null;
  nowMs: number;
}): Pick<GrowthCampaignPauseReview, 'status' | 'headline' | 'explanation' | 'nextStep'> {
  if (!input.applyOutput && (input.planExpired || input.evidenceStale)) {
    return {
      status: 'plan-stale',
      headline: 'Review the latest campaign evidence first.',
      explanation: input.evidenceStale
        ? 'Campaign evidence changed after this pause was planned, so the existing approval cannot be reused.'
        : 'This pause plan expired before it was applied.',
      nextStep: {
        id: 'create-new-plan',
        label: 'Create a new pause plan',
        reason: 'A new plan binds the decision to current evidence and a new approval window.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  if (!input.applyOutput && input.approvalStatus !== 'valid') {
    return {
      status: 'approval-required',
      headline: 'Approval is required before pausing this campaign.',
      explanation:
        input.approvalStatus === 'expired'
          ? 'The exact-plan approval expired and cannot authorize this change.'
          : input.approvalStatus === 'invalid'
            ? 'The available approval belongs to a different plan or target.'
            : 'No valid approval has been recorded for this exact pause plan.',
      nextStep: {
        id: 'request-approval',
        label: 'Review and approve this pause',
        reason:
          'Confirm the exact provider account, campaign, effect, and evidence before applying it.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  if (!input.applyOutput) {
    return {
      status: 'ready-to-apply',
      headline: 'This campaign pause is approved and ready.',
      explanation:
        'The approval matches the current plan and evidence. Applying it will contact the provider.',
      nextStep: {
        id: 'apply-approved-pause',
        label: 'Apply the approved pause',
        reason: 'Use the guarded action while the plan and approval remain valid.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  if (input.verification?.status === 'verified') {
    return {
      status: 'verified',
      headline: 'The campaign pause is verified.',
      explanation: 'The provider reports that this campaign is paused.',
      nextStep: {
        id: 'none',
        label: 'No action needed',
        reason: 'The requested provider state has been confirmed.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  if (
    input.verification?.status === 'needs-attention' ||
    input.applyOutput.disposition === 'failed'
  ) {
    return {
      status: 'needs-attention',
      headline: 'The campaign pause needs attention.',
      explanation:
        input.applyOutput.disposition === 'failed'
          ? 'The provider rejected the pause request. No successful pause was recorded.'
          : 'Verification did not confirm that the provider paused this campaign.',
      nextStep: {
        id: 'inspect-provider',
        label: 'Inspect the campaign in the provider',
        reason:
          'Confirm its current state and resolve the provider issue before creating another plan.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  const beforeWindow = input.nowMs < Date.parse(input.applyOutput.verificationWindow.notBefore);
  if (input.verification?.status === 'pending' || (!input.verification && beforeWindow)) {
    return {
      status: 'verification-pending',
      headline: 'The pause request was sent. Wait before checking.',
      explanation: 'Providers can take time to report the new campaign state.',
      nextStep: {
        id: 'wait-to-check',
        label: 'Check when the verification window opens',
        reason: `Verification can begin at ${input.applyOutput.verificationWindow.notBefore}.`,
        deepLink: advertisingDeepLink,
      },
    };
  }
  const verificationExpired =
    input.nowMs > Date.parse(input.applyOutput.verificationWindow.expiresAt);
  if (verificationExpired) {
    return {
      status: 'needs-attention',
      headline: 'The campaign state could not be confirmed in time.',
      explanation:
        'The verification window ended without trustworthy confirmation from the provider.',
      nextStep: {
        id: 'inspect-provider',
        label: 'Inspect the campaign in the provider',
        reason: 'Confirm the actual campaign state before deciding whether another action is safe.',
        deepLink: advertisingDeepLink,
      },
    };
  }
  return {
    status: 'outcome-unknown',
    headline: 'The provider outcome is not confirmed yet.',
    explanation:
      'A receipt exists, but the current campaign state still needs a separate provider check.',
    nextStep: {
      id: 'check-again',
      label: 'Check the campaign state again',
      reason:
        'Verification is read-only and can still confirm the outcome within the current window.',
      deepLink: advertisingDeepLink,
    },
  };
}

export function createGrowthCampaignPauseReview(
  input: GrowthCampaignPauseReviewInput,
): GrowthCampaignPauseReview {
  const parsed = growthCampaignPauseReviewInputSchema.parse(input);
  assertGrowthCampaignPausePlanBindings(parsed.plan, parsed.parameters);
  if (parsed.applyOutput) assertApplyOutputMatches(parsed.applyOutput, parsed.plan);
  if (parsed.verification) {
    if (!parsed.applyOutput) {
      throw new Error(
        '[GROWTH_CAMPAIGN_PAUSE_REVIEW_RECEIPT_REQUIRED] Verification requires its campaign pause receipt.',
      );
    }
    assertVerificationMatches(parsed.verification, parsed.applyOutput, parsed.parameters);
  }

  const nowMs = Date.parse(parsed.now);
  const evidenceStale = parsed.currentEvidenceRevision !== parsed.parameters.evidenceRevision;
  const planExpired = nowMs >= Date.parse(parsed.plan.expiresAt);
  const approvalMatchesPlan = parsed.approval
    ? approvalMatches(parsed.approval, parsed.plan)
    : false;
  const approvalStatus: GrowthCampaignPauseReview['approval']['status'] = !parsed.approval
    ? 'required'
    : !approvalMatchesPlan
      ? 'invalid'
      : nowMs >= Date.parse(parsed.approval.expiresAt)
        ? 'expired'
        : 'valid';
  const result = resultState({
    planExpired,
    evidenceStale,
    approvalStatus,
    applyOutput: parsed.applyOutput,
    verification: parsed.verification,
    nowMs,
  });

  return growthCampaignPauseReviewSchema.parse({
    schemaVersion: 1,
    kind: 'growth.campaign-pause-review',
    action: {
      id: 'growth.ads.campaign.pause',
      schemaVersion: 1,
      planId: parsed.plan.planId,
      planHash: parsed.plan.planHash,
    },
    projectId: parsed.plan.projectId,
    environmentId: parsed.plan.environment,
    target: {
      provider: parsed.parameters.provider,
      providerLabel: parsed.parameters.provider === 'googleAds' ? 'Google Ads' : 'Meta Ads',
      providerAccountId: parsed.parameters.providerAccountId,
      campaignId: parsed.parameters.campaignId,
    },
    effect: {
      title: 'Pause campaign delivery',
      summary:
        'Requests the provider to pause delivery for this campaign. Spend should stop after the provider applies the change; verification confirms the reported state.',
      risk: 'medium',
      reversibility:
        'The campaign can be enabled later through a separately reviewed action; this pause does not promise an automatic rollback.',
    },
    evidence: {
      plannedRevision: parsed.parameters.evidenceRevision,
      currentRevision: parsed.currentEvidenceRevision,
      status: evidenceStale ? 'stale' : 'current',
    },
    approval: {
      status: approvalStatus,
      approvalId: approvalMatchesPlan ? (parsed.approval?.approvalId ?? null) : null,
      approvedBy: approvalMatchesPlan ? (parsed.approval?.actor ?? null) : null,
      expiresAt: approvalMatchesPlan ? (parsed.approval?.expiresAt ?? null) : null,
    },
    execution: {
      status: executionStatus(parsed.applyOutput),
      receiptId: parsed.applyOutput?.receipt.receiptId ?? null,
      completedAt: parsed.applyOutput?.receipt.completedAt ?? null,
    },
    verification: {
      status: parsed.verification?.status ?? 'not-started',
      checkedAt: parsed.verification?.checkedAt ?? null,
      notBefore: parsed.applyOutput?.verificationWindow.notBefore ?? null,
      expiresAt: parsed.applyOutput?.verificationWindow.expiresAt ?? null,
      observedCampaignStatus: parsed.verification?.observedCampaignStatus ?? null,
    },
    ...result,
  });
}
