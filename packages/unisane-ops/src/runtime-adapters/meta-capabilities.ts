import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { opsPrincipalSchema } from '@unisane/ops-engine/actions';
import {
  createGrowthCapabilityReviewAction,
  growthCapabilityReviewInputSchema,
} from '@unisane/growth/actions';
import { growthCapabilitySnapshotSchema } from '@unisane/growth/contracts';
import { loadUnisaneOpsConfig } from '../config/loader.js';

export const metaOperationSupport = {
  'growth.campaign.pause': {
    state: 'bound',
    reason:
      'Shared campaign workflow owns approval, durable attempts and verification. Console provides review/approval; CLI/MCP apply and verify. Automated/production writes require SQLite; raw mutation routes remain blocked.',
    assessment: 'ads-insights',
    surfaces: ['cli', 'mcp', 'console'],
  },
  'meta.connection.discover': {
    state: 'bound',
    reason: 'Read-only discovery is bound to the host credential callback.',
    assessment: 'connection',
    surfaces: [],
  },
  'meta.marketing.pull-report': {
    state: 'bound',
    reason: 'Report collection is bound to the host credential callback.',
    assessment: 'ads-insights',
    surfaces: ['cli', 'mcp', 'console'],
  },
  'meta.marketing.execute-live': {
    state: 'blocked',
    reason:
      '[META_MUTATION_CREDENTIAL_CALLBACK_REQUIRED] Meta mutation remains unavailable until its separately approved host credential callback is composed.',
    assessment: 'unmapped',
    surfaces: [],
  },
  'meta.marketing.upload-asset': {
    state: 'blocked',
    reason:
      '[META_MUTATION_CREDENTIAL_CALLBACK_REQUIRED] Meta mutation remains unavailable until its separately approved host credential callback is composed.',
    assessment: 'unmapped',
    surfaces: [],
  },
  'meta.marketing.pause-campaign': {
    state: 'blocked',
    reason:
      '[META_CAMPAIGN_CREDENTIAL_CALLBACK_REQUIRED] Meta campaign control remains unavailable until its separately authorized worker callback is composed.',
    assessment: 'unmapped',
    surfaces: [],
  },
  'meta.marketing.read-campaign-status': {
    state: 'blocked',
    reason:
      '[META_CAMPAIGN_CREDENTIAL_CALLBACK_REQUIRED] Meta campaign control remains unavailable until its separately authorized worker callback is composed.',
    assessment: 'unmapped',
    surfaces: [],
  },
} as const;

export function findMetaOperationSupport(operation: string) {
  return Object.entries(metaOperationSupport).find(([id]) => id === operation)?.[1];
}

const requestSchema = growthCapabilityReviewInputSchema
  .extend({
    projectId: z.string().min(1),
    environmentId: z.string().min(1),
    principal: opsPrincipalSchema,
  })
  .strict();

export async function reviewLocalMetaCapabilities(
  cwd: string,
  input: unknown,
  options: {
    credentialResolverAvailable: boolean;
    now?: () => Date;
  },
) {
  const request = requestSchema.parse(input);
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  const environment = growth?.environments[request.environmentId];
  if (loaded.config.project.id !== request.projectId || !environment) {
    throw new Error(
      '[GROWTH_CAPABILITIES_TARGET_MISMATCH] Select the project and environment owned by this configuration.',
    );
  }
  const provider = await import('@unisane/provider-meta');
  const connectionId = environment.connections.meta;
  const reference = connectionId ? loaded.config.connections[connectionId] : undefined;
  const record =
    reference?.provider === 'meta' && 'recordPath' in reference
      ? provider.readMetaConnectionRecord({
          projectRoot: loaded.projectRoot,
          recordPath: reference.recordPath,
        })
      : undefined;
  if (
    record &&
    (record.projectId !== request.projectId ||
      record.environmentId !== request.environmentId ||
      record.connectionId !== connectionId)
  ) {
    throw new Error(
      '[META_CONNECTION_CONTEXT_MISMATCH] Meta connection evidence does not match the selected project and environment.',
    );
  }
  const now = (options.now ?? (() => new Date()))();
  const snapshot = growthCapabilitySnapshotSchema.parse({
    projectId: request.projectId,
    environmentId: request.environmentId,
    connectionId,
    connection: record ? provider.projectMetaConnectionStatus(record) : undefined,
    configuredResources: environment.resources
      .filter(
        (item) =>
          item.provider === 'meta' &&
          item.connection === connectionId &&
          (item.service === 'ads-insights' || item.service === 'event-measurement'),
      )
      .map((item) => ({
        service: item.service,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        displayName: item.resourceId,
        state: 'selected',
        observedAt: now.toISOString(),
      })),
    capabilities: provider.metaCapabilityInventory().capabilities.map((item) => {
      const support =
        item.hostOperations.length === 1
          ? findMetaOperationSupport(item.hostOperations[0]!)
          : undefined;
      const missingResolver = support?.state === 'bound' && !options.credentialResolverAvailable;
      return {
        id: item.id,
        title: item.title,
        implementation: item.implementation,
        verification: item.verification,
        effect: item.effect,
        hostState: missingResolver ? 'blocked' : (support?.state ?? 'not-exposed'),
        hostReason: missingResolver
          ? 'The host has no Meta credential callback.'
          : (support?.reason ??
            'No executable operation is exposed for this capability through this host binding.'),
        assessment: support?.assessment ?? 'unmapped',
        executionSurfaces: support ? [...support.surfaces] : [],
        nextStep: item.nextStep,
      };
    }),
  });
  const action = createGrowthCapabilityReviewAction({
    loadSnapshot: () => snapshot,
    now: () => now,
  });
  return action.execute(
    { maxAgeHours: request.maxAgeHours },
    {
      requestId: `capabilities.${randomUUID()}`,
      scopeId: `scope.${request.projectId}`,
      projectId: request.projectId,
      environmentId: request.environmentId,
      principal: request.principal,
      requestedAt: now.toISOString(),
    },
  );
}
