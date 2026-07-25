import path from 'node:path';
import {
  providerArtifactRelativePath,
  summarizeControlPlanePlanActions,
  type ControlPlanePlanAction,
} from '@unisane/ops-engine';
import type { GoogleControlPlaneFetch } from '../client.js';
import { buildGoogleApisInventory } from './inventory.js';
import {
  googleControlPlaneStamp,
  readGoogleJsonFile,
  writeGoogleProviderArtifact,
} from '../shared/runtime.js';
import type {
  GoogleProviderCliOptions,
  GoogleProviderInventoryArtifact,
  GoogleProviderPlanArtifact,
} from '../shared/types.js';

export function asGoogleApisInventory(value: unknown): GoogleProviderInventoryArtifact {
  const record = value as Partial<GoogleProviderInventoryArtifact>;
  if (record?.kind !== 'control-plane.inventory' || record.provider !== 'google') {
    throw new Error(
      '[GOOGLE_INVENTORY_INVALID] Expected a Google control-plane inventory artifact.',
    );
  }
  return record as GoogleProviderInventoryArtifact;
}

export function asGoogleApisPlan(value: unknown): GoogleProviderPlanArtifact {
  const record = value as Partial<GoogleProviderPlanArtifact>;
  if (record?.kind !== 'control-plane.plan' || record.provider !== 'google') {
    throw new Error('[GOOGLE_PLAN_INVALID] Expected a Google control-plane plan artifact.');
  }
  return record as GoogleProviderPlanArtifact;
}

export async function buildGoogleApisPlan(
  options: GoogleProviderCliOptions,
  deps?: { fetch?: GoogleControlPlaneFetch; env?: Record<string, string | undefined> },
): Promise<GoogleProviderPlanArtifact> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inventory = options.inventory
    ? asGoogleApisInventory(readGoogleJsonFile(options.inventory, cwd))
    : await buildGoogleApisInventory({ ...options, output: undefined }, deps);
  const enabled = new Set(
    inventory.resources
      .filter((resource) => resource.type === 'api' && resource.state === 'ENABLED')
      .map((resource) => resource.id),
  );
  const actions: ControlPlanePlanAction[] = inventory.requiredApis.map((api) => {
    if (enabled.has(api.serviceName)) {
      return {
        id: `google.api.${api.serviceName}`,
        type: 'no-op',
        risk: 'none',
        summary: `${api.title} is already enabled.`,
        current: 'ENABLED',
        desired: 'ENABLED',
        requiresApproval: false,
        blocksApply: false,
      };
    }
    return {
      id: `google.api.${api.serviceName}`,
      type: 'create',
      risk: 'low',
      summary: `Enable ${api.title} (${api.serviceName}).`,
      current: 'DISABLED_OR_UNKNOWN',
      desired: 'ENABLED',
      requiresApproval: true,
      blocksApply: false,
    };
  });
  const plan: GoogleProviderPlanArtifact = {
    schemaVersion: 1,
    kind: 'control-plane.plan',
    provider: 'google',
    appId: inventory.appId,
    environment: inventory.environment,
    generatedAt: new Date().toISOString(),
    inventoryPath: inventory.artifact?.relativePath ?? options.inventory ?? null,
    actions,
    summary: summarizeControlPlanePlanActions(actions),
    projectId: inventory.projectId,
    requiredApis: inventory.requiredApis,
  };
  if (!options.output) return plan;
  return writeGoogleProviderArtifact({
    cwd,
    outputPath: options.output,
    defaultRelativePath: providerArtifactRelativePath({
      provider: 'google',
      environment: inventory.environment,
      lane: 'plans',
      family: 'apis',
      filename: `google-apis-plan-${googleControlPlaneStamp()}.json`,
    }),
    value: plan,
  });
}
