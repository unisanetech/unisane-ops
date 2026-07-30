import {
  createControlPlaneInventoryArtifact,
  providerArtifactRelativePath,
  resolveControlPlaneProviderContext,
} from '@unisane/ops-engine';
import {
  listGoogleEnabledServices,
  readGoogleProject,
  type GoogleControlPlaneFetch,
  type GoogleProjectResource,
  type GoogleServiceUsageResource,
} from '../client.js';
import { resolveGoogleProjectId, resolveGoogleRequiredApis } from '../shared/project.js';
import {
  googleControlPlaneStamp,
  googleProviderAccessToken,
  googleProviderFetchFromOptions,
  writeGoogleProviderArtifact,
} from '../shared/runtime.js';
import {
  GOOGLE_CONTROL_PLANE_SCOPE,
  type GoogleProviderCliOptions,
  type GoogleProviderInventoryArtifact,
  type GoogleProviderInventoryResource,
} from '../shared/types.js';

export async function buildGoogleApisInventory(
  options: GoogleProviderCliOptions,
  deps?: { fetch?: GoogleControlPlaneFetch; env?: Record<string, string | undefined> },
): Promise<GoogleProviderInventoryArtifact> {
  const projectId = resolveGoogleProjectId({ project: options.project, env: deps?.env });
  if (!projectId) {
    throw new Error('[GOOGLE_PROJECT_REQUIRED] Set GOOGLE_CLOUD_PROJECT or pass --project.');
  }
  const accessToken = await googleProviderAccessToken(
    options,
    'project-administration',
    GOOGLE_CONTROL_PLANE_SCOPE,
  );
  const providerFetch = googleProviderFetchFromOptions(options, deps?.fetch);
  const context = resolveControlPlaneProviderContext({
    cwd: options.cwd,
    provider: 'google',
    environment: options.environment,
    profile: options.connection,
  });
  const cwd = context.cwd;
  const desiredApis = resolveGoogleRequiredApis(options.api);
  const [project, services] = await Promise.all([
    readGoogleProject({ accessToken, projectId, fetch: providerFetch }).catch(
      (error): GoogleProjectResource => ({
        projectId,
        lifecycleState: 'UNKNOWN',
        name: error instanceof Error ? error.message : 'Unknown Google project lookup error.',
      }),
    ),
    listGoogleEnabledServices({ accessToken, projectId, fetch: providerFetch }),
  ]);
  const resources: GoogleProviderInventoryResource[] = [
    {
      type: 'project',
      id: project.projectId,
      title: project.name,
      state: project.lifecycleState ?? 'UNKNOWN',
    },
    ...services.map((service: GoogleServiceUsageResource) => ({
      type: 'api' as const,
      id: service.serviceName,
      title: service.title,
      state: service.state,
      reason: desiredApis.find((entry) => entry.serviceName === service.serviceName)?.reason,
    })),
  ];
  const inventory = {
    ...createControlPlaneInventoryArtifact({
      provider: 'google',
      appId: context.appId,
      environment: context.environment,
      generatedAt: context.generatedAt,
      configPath: context.configPath,
      profile: context.profile,
      resources,
      warnings:
        project.lifecycleState && project.lifecycleState !== 'ACTIVE'
          ? [`Google project lifecycle state is ${project.lifecycleState}.`]
          : [],
    }),
    projectId,
    requiredApis: desiredApis,
  };
  if (!options.output) return inventory;
  return writeGoogleProviderArtifact({
    cwd,
    outputPath: options.output,
    defaultRelativePath: providerArtifactRelativePath({
      provider: 'google',
      environment: context.environment,
      lane: 'inventory',
      family: 'apis',
      filename: `google-apis-inventory-${googleControlPlaneStamp()}.json`,
    }),
    value: inventory,
  });
}
