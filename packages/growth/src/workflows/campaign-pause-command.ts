import { z } from 'zod';
import { opsPrincipalSchema, type OpsPrincipal } from '@unisane/ops-engine';
import { growthCampaignPauseParametersSchema } from '../actions/campaign-pause.js';
import {
  growthCampaignPauseWorkflowResultSchema,
  type GrowthCampaignPauseWorkflow,
} from './campaign-pause-execution.js';
const id = z.string().trim().min(1);
const run = { runId: id };
export const campaignPauseCommandSchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('plan'),
      parameters: growthCampaignPauseParametersSchema,
      currentEvidenceRevision: id,
      planTtlMs: z.number().optional(),
    })
    .strict(),
  z.object({ operation: z.literal('show'), ...run }).strict(),
  z.object({ operation: z.literal('list') }).strict(),
  z
    .object({
      operation: z.literal('approve'),
      ...run,
      approvedBy: id,
      confirmPlanHash: id,
      approvalTtlMs: z.number().optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('apply'),
      ...run,
      currentEvidenceRevision: id,
      confirmTarget: id,
      lockTtlMs: z.number().optional(),
    })
    .strict(),
  z.object({ operation: z.literal('verify'), ...run }).strict(),
]);
export const campaignPauseHostRequestSchema = z
  .object({
    projectId: id,
    environmentId: id,
    principal: opsPrincipalSchema,
    command: campaignPauseCommandSchema,
  })
  .strict();
export function createCampaignPauseHostClient(input: {
  projectId: string;
  environmentId: string;
  principal: OpsPrincipal;
  execute(request: z.infer<typeof campaignPauseHostRequestSchema>): Promise<unknown>;
}): GrowthCampaignPauseWorkflow {
  const call = async (command: z.infer<typeof campaignPauseCommandSchema>) =>
    growthCampaignPauseWorkflowResultSchema.nullable().parse(
      await input.execute({
        projectId: input.projectId,
        environmentId: input.environmentId,
        principal: input.principal,
        command,
      }),
    );
  const required = async (command: z.infer<typeof campaignPauseCommandSchema>) => {
    const result = await call(command);
    if (!result) throw new Error('[CAMPAIGN_RUN_MISSING] Host returned no campaign run.');
    return result;
  };
  return {
    plan: (request) =>
      required({
        operation: 'plan',
        parameters: request.parameters,
        currentEvidenceRevision: request.currentEvidenceRevision,
        planTtlMs: request.planTtlMs,
      }),
    show: (runId) => call({ operation: 'show', runId }),
    approve: (request) => required({ operation: 'approve', ...request }),
    apply: (request) =>
      required({
        operation: 'apply',
        runId: request.runId,
        currentEvidenceRevision: request.currentEvidenceRevision,
        confirmTarget: request.confirmTarget,
        lockTtlMs: request.lockTtlMs,
      }),
    verify: ({ runId }) => required({ operation: 'verify', runId }),
  };
}
