import path from 'node:path';
import {
  growthConfigSchema,
  marketingExecutionContextSchema,
  type ExecuteGrowthHealthReviewOptions,
  type ExecuteGrowthMeasurementAuditOptions,
  type ExecuteGrowthSeoOpportunityOptions,
  type GrowthCampaignPauseWorkflow,
  type GrowthConfig,
  type MarketingExecutionContext,
} from '@unisane/growth';
import { opsPrincipalSchema, type OpsPrincipal } from '@unisane/ops-engine/actions';
import {
  opsWorkflowHandoffSchema as canonicalWorkflowHandoffSchema,
  type OpsWorkflowContractReference,
  type OpsWorkflowHandoff,
} from '@unisane/ops-engine/workflows';
import * as z from 'zod/v4';

const stableId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const contractReference = z.object({ id: stableId, version: z.number().int().positive() }).strict();
const workflowContext = z
  .object({
    scopeId: stableId,
    projectId: stableId,
    environmentId: stableId,
    targetId: stableId.optional(),
    principal: z
      .object({
        kind: z.enum(['user', 'service', 'agent']),
        id: stableId,
        displayName: z.string().trim().min(1).max(160).optional(),
      })
      .strict(),
  })
  .strict();
const nextStep = z
  .object({
    label: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(280),
    actionId: stableId.optional(),
    deepLink: z.string().startsWith('/').max(300).optional(),
  })
  .strict();
const workflowHandoff = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.workflow-handoff'),
    handoffId: stableId,
    runId: stableId,
    runRevision: z.number().int().positive(),
    contextBriefId: stableId,
    goal: contractReference,
    playbook: contractReference,
    context: workflowContext,
    currentStageId: stableId,
    nextStep,
    evidenceRevisions: z
      .array(z.object({ evidenceId: stableId, revision: z.number().int().positive() }).strict())
      .max(20),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
const projectTarget = z
  .object({
    projectId: stableId.describe('Exact project id shown by the active Unisane context.'),
    environmentId: stableId.describe('Exact environment id shown by the active Unisane context.'),
  })
  .strict();
const resumableProjectTarget = projectTarget
  .extend({
    resumeFrom: workflowHandoff
      .optional()
      .describe('A structured handoff returned by an earlier call to this same workflow.'),
  })
  .strict();
const date = z.iso.date();
const runId = stableId.describe('Exact campaign-pause run id returned by planning or review.');
const campaignProvider = z.enum(['googleAds', 'metaAds']);

export const growthHealthReviewToolInputSchema = resumableProjectTarget
  .extend({
    maxAgeDays: z.number().int().min(1).max(30).default(3),
    findingLimit: z.number().int().min(1).max(50).default(20),
  })
  .strict();

export const growthSeoOpportunityToolInputSchema = resumableProjectTarget
  .extend({
    market: z.string().trim().min(1).max(80).optional(),
    maxAgeDays: z.number().int().min(1).max(90).default(30),
    opportunityLimit: z.number().int().min(1).max(20).default(10),
  })
  .strict();

export const growthMeasurementAuditToolInputSchema = resumableProjectTarget
  .extend({
    startDate: date.optional(),
    endDate: date.optional(),
    maxAgeDays: z.number().int().min(1).max(30).default(3),
    comparisonLimit: z.number().int().min(1).max(20).default(10),
  })
  .strict()
  .refine((input) => !input.startDate || !input.endDate || input.startDate <= input.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export const growthCampaignPausePlanToolInputSchema = projectTarget
  .extend({
    provider: campaignProvider.describe('Exact advertising provider for the campaign.'),
    providerAccountId: z.string().trim().min(1).max(160),
    campaignId: z.string().trim().min(1).max(160),
    evidenceRevision: z.string().trim().min(1).max(240),
    verificationDelayMs: z.number().int().min(0).max(3_600_000).default(30_000),
    verificationTtlMs: z.number().int().min(1_000).max(86_400_000).default(300_000),
    planTtlMs: z.number().int().min(1_000).max(3_600_000).default(600_000),
  })
  .strict();

export const growthCampaignPauseReviewToolInputSchema = projectTarget.extend({ runId }).strict();

export const growthCampaignPauseApplyToolInputSchema = projectTarget
  .extend({
    runId,
    currentEvidenceRevision: z.string().trim().min(1).max(240),
    confirmTarget: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .describe('Exact provider:account:campaign confirmation returned by the plan review.'),
  })
  .strict();

export const growthCampaignPauseVerifyToolInputSchema = projectTarget.extend({ runId }).strict();

export type GrowthHealthReviewToolInput = z.infer<typeof growthHealthReviewToolInputSchema>;
export type GrowthSeoOpportunityToolInput = z.infer<typeof growthSeoOpportunityToolInputSchema>;
export type GrowthMeasurementAuditToolInput = z.infer<typeof growthMeasurementAuditToolInputSchema>;
export type GrowthCampaignPausePlanToolInput = z.infer<
  typeof growthCampaignPausePlanToolInputSchema
>;
export type GrowthCampaignPauseReviewToolInput = z.infer<
  typeof growthCampaignPauseReviewToolInputSchema
>;
export type GrowthCampaignPauseApplyToolInput = z.infer<
  typeof growthCampaignPauseApplyToolInputSchema
>;
export type GrowthCampaignPauseVerifyToolInput = z.infer<
  typeof growthCampaignPauseVerifyToolInputSchema
>;

export type LocalOpsMcpBinding = {
  projectRoot: string;
  projectId: string;
  environmentId: string;
  principal: OpsPrincipal;
  growthConfig: GrowthConfig;
  marketingConfig: MarketingExecutionContext;
  researchRoot?: string;
  maximumResultBytes?: number;
};

export type OpsMcpGrowthExecutors = {
  reviewHealth(options: ExecuteGrowthHealthReviewOptions): Promise<Record<string, unknown>>;
  researchSeo(options: ExecuteGrowthSeoOpportunityOptions): Promise<Record<string, unknown>>;
  auditMeasurement(options: ExecuteGrowthMeasurementAuditOptions): Promise<Record<string, unknown>>;
};

export type OpsMcpGrowthWorkflows = {
  campaignPause: GrowthCampaignPauseWorkflow;
};

export type ValidatedLocalOpsMcpBinding = LocalOpsMcpBinding & {
  projectRoot: string;
  maximumResultBytes: number;
};

export function validateLocalOpsMcpBinding(input: LocalOpsMcpBinding): ValidatedLocalOpsMcpBinding {
  const projectRoot = path.resolve(input.projectRoot);
  if (!path.isAbsolute(input.projectRoot)) {
    throw new Error('The local MCP project root must be absolute.');
  }
  stableId.parse(input.projectId);
  stableId.parse(input.environmentId);
  const principal = opsPrincipalSchema.parse(input.principal);
  const growthConfig = growthConfigSchema.parse(input.growthConfig);
  const marketingConfig = marketingExecutionContextSchema.parse(input.marketingConfig);
  if (!growthConfig.environments[input.environmentId]) {
    throw new Error('The bound Growth environment does not exist in Growth configuration.');
  }
  if (
    marketingConfig.platformId !== input.projectId ||
    marketingConfig.defaultEnvironment !== input.environmentId
  ) {
    throw new Error('The marketing execution context does not match the bound project target.');
  }
  const maximumResultBytes = input.maximumResultBytes ?? 262_144;
  if (
    !Number.isInteger(maximumResultBytes) ||
    maximumResultBytes < 4_096 ||
    maximumResultBytes > 1_048_576
  ) {
    throw new Error('maximumResultBytes must be an integer between 4096 and 1048576.');
  }
  return {
    ...input,
    projectRoot,
    principal,
    growthConfig,
    marketingConfig,
    maximumResultBytes,
  };
}

export function assertBoundTarget(
  binding: ValidatedLocalOpsMcpBinding,
  input: { projectId: string; environmentId: string },
): void {
  if (input.projectId !== binding.projectId || input.environmentId !== binding.environmentId) {
    throw new OpsMcpSafeError(
      'target_mismatch',
      'This tool call does not match the project and environment bound to this MCP server.',
    );
  }
}

export function prepareBoundWorkflowResume(input: {
  binding: ValidatedLocalOpsMcpBinding;
  handoff?: unknown;
  goal: OpsWorkflowContractReference;
  playbook: OpsWorkflowContractReference;
}): { handoff?: OpsWorkflowHandoff; requestId?: string } {
  if (!input.handoff) return {};
  const handoff = canonicalWorkflowHandoffSchema.parse(input.handoff);
  const expectedScopeId = `scope.${input.binding.projectId}`;
  if (
    handoff.context.scopeId !== expectedScopeId ||
    handoff.context.projectId !== input.binding.projectId ||
    handoff.context.environmentId !== input.binding.environmentId ||
    handoff.context.targetId !== undefined
  ) {
    throw new OpsMcpSafeError(
      'target_mismatch',
      'This handoff does not match the project and environment bound to this MCP server.',
    );
  }
  if (
    handoff.context.principal.kind !== input.binding.principal.kind ||
    handoff.context.principal.id !== input.binding.principal.id
  ) {
    throw new OpsMcpSafeError(
      'actor_mismatch',
      'This handoff belongs to a different actor and cannot be resumed by this MCP server.',
    );
  }
  if (
    handoff.goal.id !== input.goal.id ||
    handoff.goal.version !== input.goal.version ||
    handoff.playbook.id !== input.playbook.id ||
    handoff.playbook.version !== input.playbook.version
  ) {
    throw new OpsMcpSafeError(
      'workflow_mismatch',
      'This handoff belongs to a different Growth workflow.',
    );
  }
  const requestId = handoff.runId.startsWith('workflow.')
    ? handoff.runId.slice('workflow.'.length)
    : undefined;
  if (!requestId) {
    throw new OpsMcpSafeError('handoff_invalid', 'This workflow handoff has an invalid run id.');
  }
  return { handoff, requestId };
}

export class OpsMcpSafeError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
  ) {
    super(safeMessage);
    this.name = 'OpsMcpSafeError';
  }
}
