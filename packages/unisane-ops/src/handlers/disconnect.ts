import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { opsLifecycleContributionResultSchema } from '@unisane/ops-engine/lifecycle';
import {
  resolveProviderBindingContributor,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { updateOpsConfigSource } from '../project/config-source.js';
import { commandResult } from './result.js';

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

async function confirmDisconnect(context: PackCommandContext, message: string): Promise<boolean> {
  if (context.json || !stdin.isTTY || !stdout.isTTY) return false;
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question(`${message} [y/N] `);
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    prompt.close();
  }
}

export async function runDisconnect(context: PackCommandContext): Promise<PackCommandResult> {
  const [provider, ...providerArguments] = context.argv;
  if (!provider || provider.startsWith('--')) {
    throw new Error('[UNISANE_DISCONNECT_PROVIDER_REQUIRED] Select a provider to disconnect.');
  }
  const contributor = resolveProviderBindingContributor(context.manifests, provider);
  if (!contributor) {
    throw new Error(
      `[UNISANE_DISCONNECT_PROVIDER_UNKNOWN] No installed pack contributes '${provider}'.`,
    );
  }
  if (
    (provider !== 'google' && provider !== 'meta') ||
    contributor.packId !== `provider-${provider}`
  ) {
    throw new Error(
      `[UNISANE_DISCONNECT_PROVIDER_UNSUPPORTED] Provider '${provider}' has no ordinary disconnect lifecycle yet.`,
    );
  }
  const loaded = await loadUnisaneOpsConfig(context.cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane-ops add growth` before managing a Growth connection.',
    );
  }
  const environmentId = selectEnvironment(
    Object.keys(growth.environments),
    option(providerArguments, '--environment'),
  );
  const environment = growth.environments[environmentId];
  const connectionId =
    option(providerArguments, '--connection') ?? environment.connections[provider];
  if (!connectionId) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'ok',
      result: {
        provider,
        environmentId,
        disconnected: false,
        reason: 'not-connected',
      },
      nextActions: [`${provider} is not connected in this environment.`],
    });
  }
  if (environment.connections[provider] !== connectionId) {
    throw new Error(
      `[UNISANE_DISCONNECT_CONNECTION_MISMATCH] '${connectionId}' is not the selected ${provider} connection for '${environmentId}'.`,
    );
  }
  const reference = loaded.config.connections[connectionId];
  if (!reference || reference.provider !== provider || !('recordPath' in reference)) {
    throw new Error(
      `[UNISANE_DISCONNECT_CONNECTION_UNKNOWN] '${connectionId}' is not a canonical ${provider} connection.`,
    );
  }
  const confirmed =
    providerArguments.includes('--yes') ||
    (await confirmDisconnect(
      context,
      `Disconnect ${provider} from '${loaded.config.project.id}' (${environmentId})? Historical data remains; provider-side resources are unchanged.`,
    ));
  if (!confirmed) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'attention',
      result: {
        provider,
        connectionId,
        environmentId,
        writeRequired: true,
        historicalDataRetained: true,
        providerResourcesChanged: false,
      },
      nextActions: [
        `Re-run \`unisane-ops disconnect ${provider} --environment ${environmentId} --connection ${connectionId} --yes\` after reviewing the consequences.`,
      ],
    });
  }
  if (!context.runtime) {
    throw new Error(
      '[UNISANE_DISCONNECT_RUNTIME_MISSING] Disconnect requires the canonical runtime.',
    );
  }
  const contribution = opsLifecycleContributionResultSchema.parse(
    await context.runtime.resolveBinding('ops.lifecycle.disconnect', {
      provider,
      packId: contributor.packId,
      scopeId: 'workspace',
      projectId: loaded.config.project.id,
      environmentId,
      connectionId,
      recordPath: reference.recordPath,
      context: {
        cwd: loaded.projectRoot,
        argv: providerArguments.filter((argument) => argument !== '--yes'),
        json: context.json ?? false,
      },
    }),
  );
  const retainedResources = environment.resources.filter(
    (resource) => resource.provider !== provider || resource.connection !== connectionId,
  );
  const retainedConnections = { ...environment.connections };
  delete retainedConnections[provider];
  growth.environments[environmentId] = {
    connections: retainedConnections,
    resources: retainedResources,
  };
  delete loaded.config.connections[connectionId];
  updateOpsConfigSource({
    configPath: loaded.configPath,
    config: loaded.config,
  });
  return commandResult(context, {
    ...contribution,
    writeTargets: [...new Set([...contribution.writeTargets, 'project' as const])],
    result: {
      ...(typeof contribution.result === 'object' && contribution.result !== null
        ? contribution.result
        : {}),
      configPath: loaded.configPath,
    },
    artifacts: [...contribution.artifacts, loaded.configPath],
  });
}
