import path from 'node:path';
import {
  createCampaignPauseHostClient,
  executeGrowthSeoOpportunityResearch,
  findSeoPublicationRecord,
  prepareSeoOpportunityArtifacts,
  resolveSeoResearchWorkspacePaths,
  verifySeoPublicationArtifacts,
} from '@unisane/growth';
import { deriveMarketingExecutionContext } from '@unisane/growth/marketing';
import type { LocalOpsMcpBinding, OpsMcpGrowthWorkflows } from '@unisane/ops-mcp';
import type { OpsPrincipal } from '@unisane/ops-engine/actions';
import { loadUnisaneOpsConfig, type LoadedUnisaneOpsConfig } from '../config/loader.js';
import {
  executeGrowthProviderOperation,
  createLocalGrowthProviderOperationDependencies,
} from '../runtime-adapters/growth.js';

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
  executeProvider: async (cwd, operation, input) =>
    executeGrowthProviderOperation(
      cwd,
      operation,
      input,
      await createLocalGrowthProviderOperationDependencies(),
    ),
};

export interface LocalGrowthMcpRuntime {
  binding: LocalOpsMcpBinding;
  workflows: OpsMcpGrowthWorkflows;
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
    gtmRelease: (input) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.gtm.release', {
        ...input,
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
      }),
    gtmWorkspace: (input) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.gtm.workspace', {
        ...input,
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
      }),
    importMetaDiagnostics: (observation) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.meta.diagnostics.import', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
        observation,
      }),
    reviewMetaDiagnostics: (query) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.meta.diagnostics.review', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
        query,
      }),
    collectReport: (report) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.reports.collect', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
        report,
      }),
    reportHistory: (query) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.reports.history', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
        query,
      }),
    readReport: (report) =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.reports.read', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
        report,
      }),
    reviewCapabilities: () =>
      dependencies.executeProvider(loaded.projectRoot, 'growth.capabilities.review', {
        projectId: loaded.config.project.id,
        environmentId: options.environmentId,
        principal: options.principal,
      }),
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
    campaignPause: createCampaignPauseHostClient({
      projectId: binding.projectId,
      environmentId: options.environmentId,
      principal: options.principal,
      execute: (request) =>
        dependencies.executeProvider(loaded.projectRoot, 'growth.campaign.pause', request),
    }),
  };
  return { binding, workflows };
}
