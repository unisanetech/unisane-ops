import type { GrowthConfig, GrowthResourceReference } from '../config.js';
import { deriveMarketingExecutionContext } from '../marketing/workspace/load-execution-context.js';
import { executeGrowthProviderCommand } from './provider-runtime.js';

export interface GrowthProjectContext {
  projectRoot: string;
  configPath: string;
  projectId: string;
  environments: Record<string, { production: boolean }>;
  growth: GrowthConfig;
}

export type GrowthConnectionGrantState = 'granted' | 'missing' | 'partial' | 'revoked';

export type GrowthConnectionResourceState = 'selected' | 'missing' | 'ambiguous' | 'inaccessible';

export interface GrowthProviderConnectionContext {
  provider: string;
  available: boolean;
  connection?: {
    id: string;
    displayName: string;
    identity?: string;
    credentialState: 'active' | 'expired' | 'revoked' | 'missing';
    grants: Array<{
      service: string;
      scopes: string[];
      state: GrowthConnectionGrantState;
      observedAt: string;
      expiresAt?: string;
    }>;
    resources: Array<{
      service: string;
      resourceType: string;
      resourceId: string;
      displayName: string;
      state: GrowthConnectionResourceState;
      observedAt: string;
    }>;
    updatedAt?: string;
    lastVerifiedAt?: string;
  };
}

export interface GrowthConnectionsContext {
  environmentId: string;
  providers: GrowthProviderConnectionContext[];
}

export function loadGrowthProjectContext(): Promise<GrowthProjectContext> {
  return executeGrowthProviderCommand('growth.project.context', {});
}

export function loadGrowthConnectionsContext(
  environment?: string,
): Promise<GrowthConnectionsContext> {
  return executeGrowthProviderCommand('growth.connections.context', {
    ...(environment ? { environment } : {}),
  });
}

export async function loadMarketingExecutionContext(): Promise<{
  config: ReturnType<typeof deriveMarketingExecutionContext>;
  path: string;
}> {
  const context = await loadGrowthProjectContext();
  return {
    config: deriveMarketingExecutionContext(context),
    path: context.configPath,
  };
}

export function selectGrowthEnvironment(context: GrowthProjectContext, requested?: string): string {
  if (requested) {
    if (!context.growth.environments[requested]) {
      throw new Error(
        `[GROWTH_ENVIRONMENT_UNKNOWN] Growth environment '${requested}' is not configured.`,
      );
    }
    return requested;
  }
  const ids = Object.keys(context.growth.environments);
  if (ids.length === 1) return ids[0]!;
  if (ids.includes('development')) return 'development';
  throw new Error(`[GROWTH_ENVIRONMENT_REQUIRED] Select one Growth environment: ${ids.join(', ')}`);
}

export function resolveGrowthResource(input: {
  context: GrowthProjectContext;
  environment?: string;
  provider: string;
  service: string;
  resourceType?: string;
}): GrowthResourceReference {
  const environmentId = selectGrowthEnvironment(input.context, input.environment);
  const matches = input.context.growth.environments[environmentId]!.resources.filter(
    (resource) =>
      resource.provider === input.provider &&
      resource.service === input.service &&
      (!input.resourceType || resource.resourceType === input.resourceType),
  );
  if (matches.length === 0) {
    throw new Error(
      `[GROWTH_RESOURCE_MISSING] No ${input.provider} ${input.service} resource is selected for '${environmentId}'. Run \`unisane-ops connect ${input.provider}\`.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `[GROWTH_RESOURCE_AMBIGUOUS] More than one ${input.provider} ${input.service} resource is selected for '${environmentId}'.`,
    );
  }
  return matches[0]!;
}
