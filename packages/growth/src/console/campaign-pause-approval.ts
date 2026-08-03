import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../cli/project-context.js';
import {
  createGrowthCampaignPauseRunCoordinator,
  resolveGrowthCampaignPauseExecutionStateDirectory,
  resolveGrowthCampaignPauseRunDirectory,
} from '../playbooks/campaign-pause-run.js';
import { approveGrowthCampaignPause } from '../workflows/campaign-pause-approval.js';
import {
  growthCampaignPauseWorkflowResultSchema,
  type GrowthCampaignPauseWorkflowResult,
} from '../workflows/campaign-pause-execution.js';

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
  if (environment.production || context.growth.policy.mutation !== 'approval-required') {
    return null;
  }
  const state = createLocalOpsExecutionState(
    resolveGrowthCampaignPauseExecutionStateDirectory({
      cwd: input.cwd,
      projectId: context.projectId,
      environmentId,
    }),
  );
  const coordinator = createGrowthCampaignPauseRunCoordinator({
    store: new LocalOpsMutationRunStore(
      resolveGrowthCampaignPauseRunDirectory({
        cwd: input.cwd,
        projectId: context.projectId,
        environmentId,
      }),
    ),
    actor: 'developer',
    production: environment.production,
    multiProcess: false,
    now: input.now,
  });
  return {
    projectId: context.projectId,
    environmentId,
    approvedBy: input.approvedBy,
    async approve(request) {
      const review = await approveGrowthCampaignPause({
        state,
        coordinator,
        mutationPolicy: context.growth.policy.mutation,
        runId: request.runId,
        approvedBy: input.approvedBy,
        confirmPlanHash: request.confirmPlanHash,
        now: input.now,
      });
      return growthCampaignPauseWorkflowResultSchema.parse({
        schemaVersion: 1,
        kind: 'growth.campaign-pause-workflow-result',
        runId: request.runId,
        review,
      });
    },
  };
}
