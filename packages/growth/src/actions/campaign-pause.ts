import { z } from 'zod';
import {
  assertOpsMutationPreflight,
  createOpsMutationPlan,
  hashOpsValue,
  opsApprovalRecordSchema,
  opsLockLeaseSchema,
  opsMutationPlanSchema,
  opsMutationReceiptSchema,
  type OpsExecutionState,
  type OpsMutationPlan,
  type OpsMutationReceipt,
} from '@unisane/ops-engine';
import {
  defineOpsMutationAction,
  OpsActionExecutionError,
  type OpsActionContext,
} from '@unisane/ops-engine/actions';

const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });
const providerSchema = z.enum(['googleAds', 'metaAds']);

export const growthCampaignPauseParametersSchema = z
  .object({
    provider: providerSchema,
    providerAccountId: nonEmptySchema,
    campaignId: nonEmptySchema,
    evidenceRevision: nonEmptySchema,
    verificationDelayMs: z.number().int().min(0).max(3_600_000).default(30_000),
    verificationTtlMs: z.number().int().min(1_000).max(86_400_000).default(300_000),
  })
  .strict();
export type GrowthCampaignPauseParameters = z.infer<typeof growthCampaignPauseParametersSchema>;

export const growthCampaignPausePlanInputSchema = growthCampaignPauseParametersSchema
  .extend({
    generatedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();
export type GrowthCampaignPausePlanInput = z.infer<typeof growthCampaignPausePlanInputSchema>;

export const growthCampaignPauseApplyInputSchema = growthCampaignPauseParametersSchema
  .extend({
    currentEvidenceRevision: nonEmptySchema,
    plan: opsMutationPlanSchema,
    approval: opsApprovalRecordSchema,
    lease: opsLockLeaseSchema,
    priorReceipts: z.array(opsMutationReceiptSchema).default([]),
  })
  .strict();
export type GrowthCampaignPauseApplyInput = z.infer<typeof growthCampaignPauseApplyInputSchema>;

export const growthCampaignPauseVerificationWindowSchema = z
  .object({
    notBefore: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();

export const growthCampaignPauseApplyOutputSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.literal('growth.ads.campaign.pause'),
    actionSchemaVersion: z.literal(1),
    disposition: z.enum(['applied', 'failed', 'outcome-unknown']),
    receipt: opsMutationReceiptSchema,
    verificationWindow: growthCampaignPauseVerificationWindowSchema,
  })
  .strict();
export type GrowthCampaignPauseApplyOutput = z.infer<typeof growthCampaignPauseApplyOutputSchema>;

export const growthCampaignPauseVerifyInputSchema = z
  .object({
    provider: providerSchema,
    providerAccountId: nonEmptySchema,
    campaignId: nonEmptySchema,
    receipt: opsMutationReceiptSchema,
    verificationWindow: growthCampaignPauseVerificationWindowSchema,
  })
  .strict();
export type GrowthCampaignPauseVerifyInput = z.infer<typeof growthCampaignPauseVerifyInputSchema>;

export const growthCampaignPauseVerificationSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('growth.campaign-pause-verification'),
    actionId: z.literal('growth.ads.campaign.pause'),
    actionSchemaVersion: z.literal(1),
    receiptId: nonEmptySchema,
    planHash: nonEmptySchema,
    provider: providerSchema,
    providerAccountId: nonEmptySchema,
    campaignId: nonEmptySchema,
    checkedAt: isoTimestampSchema,
    status: z.enum(['pending', 'verified', 'needs-attention', 'outcome-unknown']),
    observedCampaignStatus: z.enum(['paused', 'active', 'unknown']).nullable(),
    safeMessage: nonEmptySchema,
  })
  .strict();
export type GrowthCampaignPauseVerification = z.infer<typeof growthCampaignPauseVerificationSchema>;

export interface GrowthCampaignPauseExecutionResult {
  outcome: 'succeeded' | 'rejected' | 'outcome-unknown';
  providerOperationId?: string;
}

export interface GrowthCampaignPauseProviderAdapter {
  pauseCampaign(input: {
    providerAccountId: string;
    campaignId: string;
    planHash: string;
  }): Promise<GrowthCampaignPauseExecutionResult>;
  readCampaignStatus(input: {
    providerAccountId: string;
    campaignId: string;
  }): Promise<'paused' | 'active' | 'unknown'>;
}

export type GrowthCampaignPauseProviderAdapters = Record<
  'googleAds' | 'metaAds',
  GrowthCampaignPauseProviderAdapter
>;

export function createGrowthCampaignPauseProviderBridge(
  adapters: GrowthCampaignPauseProviderAdapters,
): Pick<GrowthCampaignPauseDependencies, 'pauseCampaign' | 'readCampaignStatus'> {
  return {
    pauseCampaign(input) {
      return adapters[input.provider].pauseCampaign(input);
    },
    readCampaignStatus(input) {
      return adapters[input.provider].readCampaignStatus(input);
    },
  };
}

export interface GrowthCampaignPauseDependencies {
  state: OpsExecutionState;
  lockOwner: string;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  pauseCampaign(input: {
    provider: 'googleAds' | 'metaAds';
    providerAccountId: string;
    campaignId: string;
    planHash: string;
  }): Promise<GrowthCampaignPauseExecutionResult>;
  readCampaignStatus(input: {
    provider: 'googleAds' | 'metaAds';
    providerAccountId: string;
    campaignId: string;
  }): Promise<'paused' | 'active' | 'unknown'>;
  now?: () => Date;
  createPlanId?: () => string;
  createReceiptId?: () => string;
}

const ACTION_ID = 'growth.ads.campaign.pause';
const ACTION_SCHEMA_VERSION = 1;
const COMMAND_VERSION = `${ACTION_ID}@${ACTION_SCHEMA_VERSION}`;

function parseParameters(input: GrowthCampaignPauseParameters): GrowthCampaignPauseParameters {
  return growthCampaignPauseParametersSchema.parse({
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    campaignId: input.campaignId,
    evidenceRevision: input.evidenceRevision,
    verificationDelayMs: input.verificationDelayMs,
    verificationTtlMs: input.verificationTtlMs,
  });
}

export function growthCampaignPauseTargetIdentity(
  parameters: GrowthCampaignPauseParameters,
): string {
  return `account:${parameters.providerAccountId}:campaign:${parameters.campaignId}`;
}

export function growthCampaignPauseLockIdentity(parameters: GrowthCampaignPauseParameters): string {
  return `${parameters.provider}:${growthCampaignPauseTargetIdentity(parameters)}`;
}

export function growthCampaignPauseConfirmation(parameters: GrowthCampaignPauseParameters): string {
  return `${parameters.provider}:${parameters.providerAccountId}:${parameters.campaignId}`;
}

function actionInput(parameters: GrowthCampaignPauseParameters): object {
  return {
    actionId: ACTION_ID,
    actionSchemaVersion: ACTION_SCHEMA_VERSION,
    provider: parameters.provider,
    providerAccountId: parameters.providerAccountId,
    campaignId: parameters.campaignId,
    evidenceRevision: parameters.evidenceRevision,
    verificationDelayMs: parameters.verificationDelayMs,
    verificationTtlMs: parameters.verificationTtlMs,
  };
}

function assertContext(context: OpsActionContext, plan: OpsMutationPlan, campaignId: string): void {
  if (plan.projectId !== context.projectId || plan.environment !== context.environmentId) {
    throw new OpsActionExecutionError(
      'growth.ads.campaign-pause.context-mismatch',
      'The approved campaign pause does not belong to this project and environment.',
    );
  }
  if (context.targetId !== undefined && context.targetId !== campaignId) {
    throw new OpsActionExecutionError(
      'growth.ads.campaign-pause.target-mismatch',
      'The requested campaign does not match the action target.',
    );
  }
}

export function assertGrowthCampaignPausePlanBindings(
  plan: OpsMutationPlan,
  parameters: GrowthCampaignPauseParameters,
): void {
  const action = plan.actions[0];
  if (
    plan.commandVersion !== COMMAND_VERSION ||
    plan.provider !== parameters.provider ||
    plan.targetIdentity !== growthCampaignPauseTargetIdentity(parameters) ||
    plan.inventoryHash !== hashOpsValue({ evidenceRevision: parameters.evidenceRevision }) ||
    plan.actions.length !== 1 ||
    action?.id !== ACTION_ID ||
    action.type !== 'update' ||
    action.resourceIdentity !== growthCampaignPauseTargetIdentity(parameters) ||
    action.inputHash !== hashOpsValue(actionInput(parameters))
  ) {
    throw new OpsActionExecutionError(
      'growth.ads.campaign-pause.plan-binding-mismatch',
      'The campaign pause parameters do not match the exact approved plan.',
    );
  }
}

function verificationWindow(
  completedAt: string,
  parameters: GrowthCampaignPauseParameters,
): z.infer<typeof growthCampaignPauseVerificationWindowSchema> {
  const completedAtMs = Date.parse(completedAt);
  return {
    notBefore: new Date(completedAtMs + parameters.verificationDelayMs).toISOString(),
    expiresAt: new Date(
      completedAtMs + parameters.verificationDelayMs + parameters.verificationTtlMs,
    ).toISOString(),
  };
}

export function createGrowthCampaignPauseAction(dependencies: GrowthCampaignPauseDependencies) {
  const now = dependencies.now ?? (() => new Date());
  return defineOpsMutationAction({
    id: ACTION_ID,
    schemaVersion: ACTION_SCHEMA_VERSION,
    maximumEffect: 'write-network',
    approvalMode: 'exact-plan',
    receiptMode: 'immutable',
    verificationMode: 'delayed-read',
    planInputSchema: growthCampaignPausePlanInputSchema,
    planOutputSchema: opsMutationPlanSchema,
    applyInputSchema: growthCampaignPauseApplyInputSchema,
    applyOutputSchema: growthCampaignPauseApplyOutputSchema,
    verifyInputSchema: growthCampaignPauseVerifyInputSchema,
    verifyOutputSchema: growthCampaignPauseVerificationSchema,
    plan(input, context) {
      const parameters = parseParameters(input);
      if (context.targetId !== undefined && context.targetId !== parameters.campaignId) {
        throw new OpsActionExecutionError(
          'growth.ads.campaign-pause.target-mismatch',
          'The requested campaign does not match the action target.',
        );
      }
      if (Date.parse(input.expiresAt) <= Date.parse(input.generatedAt)) {
        throw new OpsActionExecutionError(
          'growth.ads.campaign-pause.expiry-invalid',
          'The campaign pause plan must expire after it is generated.',
        );
      }
      return createOpsMutationPlan({
        schemaVersion: 1,
        kind: 'ops.mutation-plan',
        planId: dependencies.createPlanId?.() ?? `plan.${context.requestId}`,
        provider: parameters.provider,
        projectId: context.projectId,
        environment: context.environmentId,
        targetIdentity: growthCampaignPauseTargetIdentity(parameters),
        commandVersion: COMMAND_VERSION,
        configHash: hashOpsValue({
          actionId: ACTION_ID,
          actionSchemaVersion: ACTION_SCHEMA_VERSION,
          approvalMode: 'exact-plan',
          receiptMode: 'immutable',
          verificationMode: 'delayed-read',
        }),
        inventoryHash: hashOpsValue({ evidenceRevision: parameters.evidenceRevision }),
        generatedAt: input.generatedAt,
        expiresAt: input.expiresAt,
        actions: [
          {
            id: ACTION_ID,
            type: 'update',
            risk: 'medium',
            resourceIdentity: growthCampaignPauseTargetIdentity(parameters),
            inputHash: hashOpsValue(actionInput(parameters)),
          },
        ],
      });
    },
    async apply(input, context) {
      const parameters = parseParameters(input);
      assertContext(context, input.plan, parameters.campaignId);
      assertGrowthCampaignPausePlanBindings(input.plan, parameters);
      if (input.currentEvidenceRevision !== parameters.evidenceRevision) {
        throw new OpsActionExecutionError(
          'growth.ads.campaign-pause.evidence-stale',
          'Campaign evidence changed after planning; create and approve a new pause plan.',
        );
      }
      await assertOpsMutationPreflight({
        plan: input.plan,
        approval: input.approval,
        lease: input.lease,
        expectation: {
          provider: parameters.provider,
          projectId: context.projectId,
          environment: context.environmentId,
          targetIdentity: growthCampaignPauseTargetIdentity(parameters),
          lockId: growthCampaignPauseLockIdentity(parameters),
        },
        actor: dependencies.actor,
        production: dependencies.production,
        multiProcess: dependencies.multiProcess,
        lockOwner: dependencies.lockOwner,
        state: dependencies.state,
        priorReceipts: input.priorReceipts,
        now: now(),
      });

      const startedAt = now().toISOString();
      let execution: GrowthCampaignPauseExecutionResult;
      try {
        execution = await dependencies.pauseCampaign({
          provider: parameters.provider,
          providerAccountId: parameters.providerAccountId,
          campaignId: parameters.campaignId,
          planHash: input.plan.planHash,
        });
      } catch {
        execution = { outcome: 'outcome-unknown' };
      }
      const completedAt = now().toISOString();
      const disposition =
        execution.outcome === 'succeeded'
          ? 'applied'
          : execution.outcome === 'rejected'
            ? 'failed'
            : 'outcome-unknown';
      const receipt: OpsMutationReceipt = opsMutationReceiptSchema.parse({
        schemaVersion: 1,
        kind: 'ops.mutation-receipt',
        receiptId:
          dependencies.createReceiptId?.() ?? `receipt.${input.plan.planHash.slice(0, 24)}`,
        planId: input.plan.planId,
        planHash: input.plan.planHash,
        provider: parameters.provider,
        projectId: context.projectId,
        environment: context.environmentId,
        targetIdentity: growthCampaignPauseTargetIdentity(parameters),
        actor: context.principal.id,
        approvalId: input.approval.approvalId,
        lockId: input.lease.lockId,
        lockFencingValue: input.lease.fencingValue,
        startedAt,
        completedAt,
        status:
          execution.outcome === 'succeeded'
            ? 'succeeded'
            : execution.outcome === 'rejected'
              ? 'failed'
              : 'partial',
        results: [
          {
            actionId: ACTION_ID,
            status: execution.outcome === 'succeeded' ? 'succeeded' : 'failed',
            outputHash: hashOpsValue({
              outcome: execution.outcome,
              providerOperationId: execution.providerOperationId ?? null,
            }),
          },
        ],
      });
      await dependencies.state.artifacts.recordReceipt(receipt);
      return growthCampaignPauseApplyOutputSchema.parse({
        schemaVersion: 1,
        actionId: ACTION_ID,
        actionSchemaVersion: ACTION_SCHEMA_VERSION,
        disposition,
        receipt,
        verificationWindow: verificationWindow(completedAt, parameters),
      });
    },
    async verify(input, context) {
      const checkedAt = now().toISOString();
      const expectedTarget = growthCampaignPauseTargetIdentity({
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        campaignId: input.campaignId,
        evidenceRevision: 'verification-only',
        verificationDelayMs: 0,
        verificationTtlMs: 1_000,
      });
      if (
        input.receipt.projectId !== context.projectId ||
        input.receipt.environment !== context.environmentId ||
        input.receipt.provider !== input.provider ||
        input.receipt.targetIdentity !== expectedTarget
      ) {
        throw new OpsActionExecutionError(
          'growth.ads.campaign-pause.verification-mismatch',
          'The verification request does not match the campaign pause receipt.',
        );
      }
      if (Date.parse(checkedAt) < Date.parse(input.verificationWindow.notBefore)) {
        return growthCampaignPauseVerificationSchema.parse({
          schemaVersion: 1,
          kind: 'growth.campaign-pause-verification',
          actionId: ACTION_ID,
          actionSchemaVersion: ACTION_SCHEMA_VERSION,
          receiptId: input.receipt.receiptId,
          planHash: input.receipt.planHash,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          campaignId: input.campaignId,
          checkedAt,
          status: 'pending',
          observedCampaignStatus: null,
          safeMessage: 'Wait until the verification window opens before checking campaign state.',
        });
      }
      let observedCampaignStatus: 'paused' | 'active' | 'unknown';
      try {
        observedCampaignStatus = await dependencies.readCampaignStatus({
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          campaignId: input.campaignId,
        });
      } catch {
        observedCampaignStatus = 'unknown';
      }
      const expired = Date.parse(checkedAt) > Date.parse(input.verificationWindow.expiresAt);
      const status =
        observedCampaignStatus === 'paused'
          ? 'verified'
          : observedCampaignStatus === 'active'
            ? 'needs-attention'
            : expired
              ? 'needs-attention'
              : 'outcome-unknown';
      const safeMessage =
        status === 'verified'
          ? 'The provider reports that the campaign is paused.'
          : status === 'needs-attention'
            ? expired
              ? 'The verification window ended without confirming a paused campaign.'
              : 'The provider still reports an active campaign; review it before retrying.'
            : 'The provider outcome is not yet known; retry verification within the window.';
      return growthCampaignPauseVerificationSchema.parse({
        schemaVersion: 1,
        kind: 'growth.campaign-pause-verification',
        actionId: ACTION_ID,
        actionSchemaVersion: ACTION_SCHEMA_VERSION,
        receiptId: input.receipt.receiptId,
        planHash: input.receipt.planHash,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        campaignId: input.campaignId,
        checkedAt,
        status,
        observedCampaignStatus,
        safeMessage,
      });
    },
  });
}
