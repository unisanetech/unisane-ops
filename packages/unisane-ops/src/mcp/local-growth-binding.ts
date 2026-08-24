import path from 'node:path';
import {
  createGrowthCampaignPauseWorkflow,
  executeGrowthSeoOpportunityResearch,
  findSeoPublicationRecord,
  prepareSeoOpportunityArtifacts,
  resolveSeoResearchWorkspacePaths,
  verifySeoPublicationArtifacts,
  type GrowthCampaignPauseExecutionResult,
  type GrowthCampaignPauseProviderAdapters,
} from '@unisane/growth';
import { resolveGrowthCampaignPauseRunDirectory } from '@unisane/growth/playbooks';
import { deriveMarketingExecutionContext } from '@unisane/growth/marketing';
import type { LocalOpsMcpBinding, OpsMcpGrowthWorkflows } from '@unisane/ops-mcp';
import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
import type { OpsPrincipal } from '@unisane/ops-engine/actions';
import { loadUnisaneOpsConfig, type LoadedUnisaneOpsConfig } from '../config/loader.js';
import { executeGrowthProviderOperation } from '../runtime-adapters/growth.js';

export interface LocalGrowthMcpHostOptions {
  projectRoot: string;
  environmentId: string;
  principal: OpsPrincipal;
  maximumResultBytes?: number;
}

export interface LocalGrowthMcpHostDependencies {
  loadConfig(projectRoot: string): Promise<LoadedUnisaneOpsConfig>;
  executeProvider(cwd: string, operation: string, input: unknown): Promise<unknown>;
}

const defaultDependencies: LocalGrowthMcpHostDependencies = {
  loadConfig: loadUnisaneOpsConfig,
  executeProvider: executeGrowthProviderOperation,
};

export interface LocalGrowthMcpRuntime {
  binding: LocalOpsMcpBinding;
  workflows: OpsMcpGrowthWorkflows;
}

function executionStateRoot(input: {
  projectRoot: string;
  projectId: string;
  environmentId: string;
}): string {
  return path.join(
    input.projectRoot,
    '.unisane',
    'ops',
    input.projectId,
    input.environmentId,
    'state',
    'execution',
  );
}

function campaignExecutionResult(input: unknown): GrowthCampaignPauseExecutionResult {
  if (!input || typeof input !== 'object') {
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_PROVIDER_RESULT_INVALID] Invalid provider result.');
  }
  const value = input as { outcome?: unknown; providerOperationId?: unknown };
  if (
    value.outcome !== 'succeeded' &&
    value.outcome !== 'rejected' &&
    value.outcome !== 'outcome-unknown'
  ) {
    throw new Error('[GROWTH_CAMPAIGN_PAUSE_PROVIDER_RESULT_INVALID] Invalid provider outcome.');
  }
  return {
    outcome: value.outcome,
    ...(typeof value.providerOperationId === 'string'
      ? { providerOperationId: value.providerOperationId }
      : {}),
  };
}

function campaignStatus(input: unknown): 'paused' | 'active' | 'unknown' {
  if (input === 'paused' || input === 'active' || input === 'unknown') return input;
  throw new Error('[GROWTH_CAMPAIGN_PAUSE_PROVIDER_STATUS_INVALID] Invalid campaign status.');
}

function campaignPauseProviderAdapters(input: {
  projectRoot: string;
  environmentId: string;
  executeProvider: LocalGrowthMcpHostDependencies['executeProvider'];
}): GrowthCampaignPauseProviderAdapters {
  const adapter = (provider: 'google' | 'meta') => ({
    pauseCampaign: async (request: {
      providerAccountId: string;
      campaignId: string;
      planHash: string;
    }) =>
      campaignExecutionResult(
        await input.executeProvider(input.projectRoot, `${provider}.marketing.pause-campaign`, {
          environment: input.environmentId,
          ...request,
        }),
      ),
    readCampaignStatus: async (request: { providerAccountId: string; campaignId: string }) =>
      campaignStatus(
        await input.executeProvider(
          input.projectRoot,
          `${provider}.marketing.read-campaign-status`,
          { environment: input.environmentId, ...request },
        ),
      ),
  });
  return { googleAds: adapter('google'), metaAds: adapter('meta') };
}

export async function createLocalGrowthMcpRuntime(
  options: LocalGrowthMcpHostOptions,
  dependencies: LocalGrowthMcpHostDependencies = defaultDependencies,
): Promise<LocalGrowthMcpRuntime> {
  if (!path.isAbsolute(options.projectRoot)) {
    throw new Error('[OPS_MCP_PROJECT_ROOT_NOT_ABSOLUTE] --project must be an absolute path.');
  }
  const requestedRoot = path.resolve(options.projectRoot);
  const loaded = await dependencies.loadConfig(requestedRoot);
  if (path.resolve(loaded.projectRoot) !== requestedRoot) {
    throw new Error(
      '[OPS_MCP_PROJECT_ROOT_MISMATCH] --project must identify the directory that owns unisane.config.ts.',
    );
  }
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error('[OPS_MCP_GROWTH_NOT_CONFIGURED] Growth is not configured for this project.');
  }
  if (!growth.environments[options.environmentId]) {
    throw new Error(
      `[OPS_MCP_ENVIRONMENT_UNKNOWN] Growth environment '${options.environmentId}' is not configured.`,
    );
  }
  const marketingConfig = deriveMarketingExecutionContext({
    projectRoot: loaded.projectRoot,
    configPath: loaded.configPath,
    projectId: loaded.config.project.id,
    environments: loaded.config.environments,
    growth,
  });
  const binding: LocalOpsMcpBinding = {
    projectRoot: loaded.projectRoot,
    projectId: loaded.config.project.id,
    environmentId: options.environmentId,
    principal: options.principal,
    growthConfig: growth,
    marketingConfig: {
      ...marketingConfig,
      defaultEnvironment: options.environmentId,
    },
    ...(growth.manifests.research ? { researchRoot: growth.manifests.research } : {}),
    ...(options.maximumResultBytes ? { maximumResultBytes: options.maximumResultBytes } : {}),
  };
  const researchPaths = resolveSeoResearchWorkspacePaths(loaded.projectRoot, binding.researchRoot);
  const workflows: OpsMcpGrowthWorkflows = {
    seoOpportunity: {
      prepare: async (input) => {
        const review = await executeGrowthSeoOpportunityResearch({
          cwd: loaded.projectRoot,
          ...(binding.researchRoot ? { researchRoot: binding.researchRoot } : {}),
          projectId: binding.projectId,
          environmentId: binding.environmentId,
          principal: binding.principal,
          opportunityId: input.opportunityId,
          opportunityLimit: 1,
        });
        return prepareSeoOpportunityArtifacts({
          cwd: loaded.projectRoot,
          opportunitySource: path.join(researchPaths.opportunities, 'pages.json'),
          outputDir: researchPaths.prepared,
          opportunityId: input.opportunityId,
          review,
          audience: input.audience,
          notBeforeDaysAfterPublication: input.notBeforeDaysAfterPublication,
          expiresDaysAfterPublication: input.expiresDaysAfterPublication,
        });
      },
      verify: async (input) => {
        const found = await findSeoPublicationRecord({
          directory: researchPaths.publications,
          publicationId: input.publicationId,
        });
        if (!found) {
          throw new Error(
            `Publication ${input.publicationId} was not found in the canonical publication directory.`,
          );
        }
        const review = await executeGrowthSeoOpportunityResearch({
          cwd: loaded.projectRoot,
          ...(binding.researchRoot ? { researchRoot: binding.researchRoot } : {}),
          projectId: binding.projectId,
          environmentId: binding.environmentId,
          principal: binding.principal,
          opportunityId: found.publication.opportunity.id,
          ...(found.publication.opportunity.market
            ? { market: found.publication.opportunity.market }
            : {}),
          opportunityLimit: 1,
          maxAgeDays: input.maxAgeDays,
        });
        return verifySeoPublicationArtifacts({
          cwd: loaded.projectRoot,
          publicationPath: found.filePath,
          outputPath: path.join(researchPaths.verifications, `${input.publicationId}.latest.json`),
          publication: found.publication,
          review,
        });
      },
    },
    campaignPause: createGrowthCampaignPauseWorkflow({
      state: createLocalOpsExecutionState(
        executionStateRoot({
          projectRoot: loaded.projectRoot,
          projectId: binding.projectId,
          environmentId: options.environmentId,
        }),
      ),
      runStore: new LocalOpsMutationRunStore(
        resolveGrowthCampaignPauseRunDirectory({
          cwd: loaded.projectRoot,
          projectId: binding.projectId,
          environmentId: options.environmentId,
        }),
      ),
      providerAdapters: campaignPauseProviderAdapters({
        projectRoot: loaded.projectRoot,
        environmentId: options.environmentId,
        executeProvider: dependencies.executeProvider,
      }),
      actor: 'developer',
      mutationPolicy: growth.policy.mutation,
      production: loaded.config.environments[options.environmentId]?.production ?? false,
      multiProcess: false,
      lockOwner: `worker.mcp.${options.principal.id}`,
    }),
  };
  return { binding, workflows };
}
