import { loadGrowthProjectContext, selectGrowthEnvironment } from '../cli/project-context.js';
import { executeGrowthProviderCommand } from '../cli/provider-runtime.js';
import { createCampaignPauseHostClient } from '../workflows/campaign-pause-command.js';
import type { GrowthCampaignPauseWorkflowResult } from '../workflows/campaign-pause-execution.js';

export type GrowthConsoleCampaignPauseApprovalController = {
  projectId: string;
  environmentId: string;
  approvedBy: string;
  approve(input: {
    runId: string;
    confirmPlanHash: string;
  }): Promise<GrowthCampaignPauseWorkflowResult>;
};

export async function createGrowthConsoleCampaignPauseApprovalController(input: {
  cwd: string;
  approvedBy: string;
  environmentId?: string;
  now?: () => Date;
}): Promise<GrowthConsoleCampaignPauseApprovalController | null> {
  const context = await loadGrowthProjectContext();
  const environmentId = selectGrowthEnvironment(context, input.environmentId);
  const environment = context.environments[environmentId];
  if (!environment) {
    throw new Error(`[GROWTH_ENVIRONMENT_UNKNOWN] '${environmentId}' is not configured.`);
  }
  if (context.growth.policy.mutation !== 'approval-required') {
    return null;
  }
  const workflow = createCampaignPauseHostClient({
    projectId: context.projectId,
    environmentId,
    principal: { kind: 'user', id: input.approvedBy },
    execute: (request) => executeGrowthProviderCommand('growth.campaign.pause', request),
  });
  return {
    projectId: context.projectId,
    environmentId,
    approvedBy: input.approvedBy,
    async approve(request) {
      return workflow.approve({ ...request, approvedBy: input.approvedBy });
    },
  };
}
