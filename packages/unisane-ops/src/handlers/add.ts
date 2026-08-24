import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  createGrowthConfigIntent,
  growthAdoptionModeSchema,
  growthCapabilitySchema,
  growthConfigSchema,
  type GrowthCapability,
} from '@unisane/growth/contracts';
import { opsLifecycleContributionResultSchema } from '@unisane/ops-engine/lifecycle';
import {
  resolveAddItemContributor,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { updateOpsConfigSource } from '../project/config-source.js';
import { oneOption, parseArguments } from './arguments.js';
import { commandResult } from './result.js';

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

function selectedCapabilities(
  input: readonly string[],
  existing: readonly GrowthCapability[],
): GrowthCapability[] {
  const requested: GrowthCapability[] =
    input.length > 0
      ? input.map((capability) => growthCapabilitySchema.parse(capability))
      : existing.length > 0
        ? [...existing]
        : ['seo', 'analytics'];
  return [...new Set([...existing, ...requested])];
}

async function addGrowth(
  context: PackCommandContext,
  parsed: ReturnType<typeof parseArguments>,
): Promise<PackCommandResult> {
  const loaded = await loadUnisaneOpsConfig(context.cwd);
  const existing = loaded.config.capabilities.growth;
  const environmentIds =
    parsed.options.get('--environment') ?? Object.keys(loaded.config.environments);
  for (const environmentId of environmentIds) {
    if (!loaded.config.environments[environmentId]) {
      throw new Error(`[UNISANE_OPS_ENVIRONMENT_UNKNOWN] Unknown environment '${environmentId}'.`);
    }
  }
  const mode = oneOption(parsed, '--mode')
    ? growthAdoptionModeSchema.parse(oneOption(parsed, '--mode'))
    : (existing?.adoptionMode ?? 'new');
  const capabilities = selectedCapabilities(
    parsed.options.get('--capability') ?? [],
    existing?.capabilities ?? [],
  );
  const next = existing
    ? growthConfigSchema.parse({
        ...existing,
        adoptionMode: mode,
        capabilities,
        environments: {
          ...existing.environments,
          ...Object.fromEntries(
            environmentIds.map((environmentId) => [
              environmentId,
              existing.environments[environmentId] ?? {
                connections: {},
                resources: [],
              },
            ]),
          ),
        },
        ...(oneOption(parsed, '--runtime')
          ? {
              runtime: {
                ...existing.runtime,
                integration: oneOption(parsed, '--runtime'),
              },
            }
          : {}),
      })
    : createGrowthConfigIntent({
        adoptionMode: mode,
        capabilities,
        environments: environmentIds,
        runtimeIntegration: oneOption(parsed, '--runtime') as
          | 'none'
          | 'web-runtime'
          | 'tag-manager'
          | 'existing'
          | undefined,
      });

  const confirmed =
    parsed.flags.has('--yes') ||
    (await confirmWrite(
      context,
      `Write Growth intent for ${capabilities.join(', ')} to ${loaded.configPath}?`,
    ));
  if (!confirmed) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'attention',
      result: {
        itemType: 'growth',
        capabilities,
        environments: environmentIds,
        writeRequired: true,
      },
      nextActions: ['Re-run `unisane-ops add growth --yes` after reviewing the intent.'],
    });
  }

  loaded.config.capabilities.growth = next;
  updateOpsConfigSource({
    configPath: loaded.configPath,
    config: loaded.config,
  });
  return commandResult(context, {
    actualEffect: 'write',
    writeTargets: ['project'],
    status: 'ok',
    result: {
      itemType: 'growth',
      capabilities,
      environments: environmentIds,
      configPath: loaded.configPath,
    },
    artifacts: [loaded.configPath],
    nextActions: ['Run `unisane-ops connect google` to connect selected Growth capabilities.'],
  });
}

export async function runAdd(context: PackCommandContext): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: ['--yes'],
    options: ['--mode', '--capability', '--environment', '--runtime'],
  });
  const [itemType, ...itemArguments] = parsed.positionals;
  if (!itemType) {
    throw new Error('[UNISANE_ADD_ITEM_REQUIRED] Select an item type to add.');
  }
  const contributor = resolveAddItemContributor(context.manifests, itemType);
  if (!contributor) {
    throw new Error(`[UNISANE_ADD_ITEM_UNKNOWN] No installed pack contributes '${itemType}'.`);
  }
  if (itemType === 'growth' && contributor.packId === 'growth') {
    if (itemArguments.length > 0) {
      throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] add growth: ${itemArguments.join(' ')}`);
    }
    return addGrowth(context, parsed);
  }
  if (!context.runtime) {
    throw new Error('[UNISANE_ADD_RUNTIME_MISSING] Add dispatch requires the canonical runtime.');
  }
  const contribution = opsLifecycleContributionResultSchema.parse(
    await context.runtime.resolveBinding('ops.lifecycle.add', {
      packId: contributor.packId,
      itemType,
      context: {
        cwd: context.cwd,
        argv: [itemType, ...itemArguments],
        json: context.json ?? false,
      },
    }),
  );
  return commandResult(context, {
    ...contribution,
    result: contribution.result ?? null,
  });
}
