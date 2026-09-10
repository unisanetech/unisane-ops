import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';
import { requiredGrowthProviderServices } from '@unisane/growth/contracts';
import { opsLifecycleContributionResultSchema } from '@unisane/ops-engine/lifecycle';
import {
  resolveProviderBindingContributor,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { updateOpsConfigSource } from '../project/config-source.js';
import { commandResult } from './result.js';

const connectResultSchema = z
  .object({
    provider: z.string().min(1),
    connectionId: z.string().min(1),
    environmentId: z.string().min(1),
    recordPath: z.string().min(1),
    credentialState: z.enum(['active', 'expired', 'revoked', 'missing']),
    resources: z.array(
      z
        .object({
          service: z.string().min(1),
          resourceType: z.string().min(1),
          resourceId: z.string().min(1),
          displayName: z.string().min(1),
          state: z.enum(['selected', 'missing', 'ambiguous', 'inaccessible']),
          observedAt: z.string().min(1),
          parentResourceId: z.string().min(1).optional(),
        })
        .strict(),
    ),
  })
  .strict();

function option(argv: readonly string[], name: string): string | undefined {
  const indexes = argv
    .map((argument, index) => (argument === name ? index : -1))
    .filter((index) => index >= 0);
  if (indexes.length > 1) {
    throw new Error(`[OPS_CLI_ARGUMENT_DUPLICATE] ${name} may be passed only once.`);
  }
  const index = indexes[0];
  if (index === undefined) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`[OPS_CLI_ARGUMENT_VALUE_REQUIRED] ${name} requires a value.`);
  }
  return value;
}

async function confirmWrite(context: PackCommandContext, message: string): Promise<boolean> {
  if (context.json || !stdin.isTTY || !stdout.isTTY) return false;
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question(`${message} [y/N] `);
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    prompt.close();
  }
}

function selectEnvironment(
  environmentIds: readonly string[],
  requested: string | undefined,
): string {
  if (requested) {
    if (!environmentIds.includes(requested)) {
      throw new Error(`[UNISANE_OPS_ENVIRONMENT_UNKNOWN] Unknown environment '${requested}'.`);
    }
    return requested;
  }
  if (environmentIds.length === 1) return environmentIds[0];
  if (environmentIds.includes('development')) return 'development';
  throw new Error(
    `[UNISANE_OPS_ENVIRONMENT_REQUIRED] Select an environment from: ${environmentIds.join(', ')}`,
  );
}

export function selectDefaultConnectionId(
  currentConnectionId: string | undefined,
  connectedConnectionId: string,
  setDefault: boolean,
): string {
  return currentConnectionId && !setDefault ? currentConnectionId : connectedConnectionId;
}

export function selectsConnectedProviderAsDefault(
  currentConnectionId: string | undefined,
  connectedConnectionId: string,
  setDefault: boolean,
): boolean {
  return (
    selectDefaultConnectionId(currentConnectionId, connectedConnectionId, setDefault) ===
    connectedConnectionId
  );
}

export async function runConnect(context: PackCommandContext): Promise<PackCommandResult> {
  const [provider, ...providerArguments] = context.argv;
  if (!provider || provider.startsWith('--')) {
    throw new Error('[UNISANE_CONNECT_PROVIDER_REQUIRED] Select a provider to connect.');
  }
  const contributor = resolveProviderBindingContributor(context.manifests, provider);
  if (!contributor) {
    throw new Error(
      `[UNISANE_CONNECT_PROVIDER_UNKNOWN] No installed pack contributes '${provider}'.`,
    );
  }
  if (
    (provider !== 'google' && provider !== 'meta') ||
    contributor.packId !== `provider-${provider}`
  ) {
    throw new Error(
      `[UNISANE_CONNECT_PROVIDER_UNSUPPORTED] Provider '${provider}' has no ordinary connection lifecycle yet.`,
    );
  }

  const loaded = await loadUnisaneOpsConfig(context.cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'blocked',
      result: {
        provider,
        reason: 'growth-not-selected',
      },
      nextActions: [`Run \`unisane-ops add growth\` before connecting ${provider}.`],
    });
  }
  const environmentId = selectEnvironment(
    Object.keys(loaded.config.environments),
    option(providerArguments, '--environment'),
  );
  const connectionId = option(providerArguments, '--connection') ?? `${provider}-primary`;
  const setDefaultConnection = providerArguments.includes('--set-default');
  const recordPath = `.unisane/ops/connections/${connectionId}.json`;
  const confirmed =
    providerArguments.includes('--yes') ||
    (await confirmWrite(
      context,
      `Connect ${provider} for '${loaded.config.project.id}' (${environmentId})?`,
    ));
  if (!confirmed) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'attention',
      result: {
        provider,
        connectionId,
        environmentId,
        requiredServices:
          provider === 'meta'
            ? ['ads-insights', 'event-measurement']
            : requiredGrowthProviderServices(growth, 'google'),
        writeRequired: true,
      },
      nextActions: [
        `Re-run \`unisane-ops connect ${provider} --yes\` after reviewing the access request.`,
      ],
    });
  }
  if (!context.runtime) {
    throw new Error('[UNISANE_CONNECT_RUNTIME_MISSING] Connect requires the canonical runtime.');
  }

  const contribution = opsLifecycleContributionResultSchema.parse(
    await context.runtime.resolveBinding('ops.lifecycle.connect', {
      provider,
      packId: contributor.packId,
      scopeId: 'workspace',
      projectId: loaded.config.project.id,
      environmentId,
      recordPath,
      requiredServices:
        provider === 'meta'
          ? ['ads-insights', 'event-measurement']
          : requiredGrowthProviderServices(growth, 'google'),
      context: {
        cwd: loaded.projectRoot,
        argv: providerArguments.filter(
          (argument) => argument !== '--yes' && argument !== '--set-default',
        ),
        json: context.json ?? false,
      },
    }),
  );
  const connected = connectResultSchema.parse(contribution.result);
  loaded.config.connections[connected.connectionId] = {
    provider: connected.provider,
    recordPath: connected.recordPath,
  };
  const environment = growth.environments[environmentId] ?? {
    connections: {},
    resources: [],
  };
  const selectConnectedAsDefault = selectsConnectedProviderAsDefault(
    environment.connections[connected.provider],
    connected.connectionId,
    setDefaultConnection,
  );
  const retainedResources = selectConnectedAsDefault
    ? environment.resources.filter((resource) => resource.provider !== connected.provider)
    : environment.resources;
  growth.environments[environmentId] = {
    connections: {
      ...environment.connections,
      [connected.provider]: selectDefaultConnectionId(
        environment.connections[connected.provider],
        connected.connectionId,
        setDefaultConnection,
      ),
    },
    resources: [
      ...retainedResources,
      ...(selectConnectedAsDefault
        ? connected.resources
            .filter((resource) => resource.state === 'selected')
            .map((resource) => ({
              provider: connected.provider,
              connection: connected.connectionId,
              service: resource.service,
              resourceType: resource.resourceType,
              resourceId: resource.resourceId,
            }))
        : []),
    ],
  };
  updateOpsConfigSource({
    configPath: loaded.configPath,
    config: loaded.config,
  });

  return commandResult(context, {
    ...contribution,
    writeTargets: [...new Set([...contribution.writeTargets, 'project' as const])],
    result: {
      ...connected,
      configPath: loaded.configPath,
    },
    artifacts: [...contribution.artifacts, loaded.configPath],
  });
}
