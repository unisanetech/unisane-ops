import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import {
  loadRetiredGrowthConfigInput,
  migrateRetiredGrowthConfig,
} from '../project/growth-config-migration.js';
import { updateOpsConfigSource } from '../project/config-source.js';
import { oneOption, parseArguments } from './arguments.js';
import { commandResult } from './result.js';

export async function runMigrateGrowthConfig(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: ['--yes'],
    options: ['--input'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(
      `[OPS_CLI_ARGUMENT_UNKNOWN] migrate growth-config: ${parsed.positionals.join(' ')}`,
    );
  }
  const inputPath = oneOption(parsed, '--input');
  if (!inputPath) {
    throw new Error(
      '[GROWTH_CONFIG_MIGRATION_INPUT_REQUIRED] Pass the retired config module with --input <path>.',
    );
  }
  if (!parsed.flags.has('--yes')) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'attention',
      result: {
        migration: 'growth-config-v1',
        inputPath,
        writeRequired: true,
      },
      nextActions: [
        'Re-run with `--yes` after reviewing the one-shot migration input and generated intent.',
      ],
    });
  }
  const loaded = await loadUnisaneOpsConfig(context.cwd);
  const input = await loadRetiredGrowthConfigInput({
    projectRoot: loaded.projectRoot,
    inputPath,
  });
  const growth = migrateRetiredGrowthConfig(input.value);
  for (const environmentId of Object.keys(growth.environments)) {
    loaded.config.environments[environmentId] ??= {
      production: environmentId === 'production',
    };
  }
  loaded.config.capabilities.growth = growth;
  updateOpsConfigSource({
    configPath: loaded.configPath,
    config: loaded.config,
  });
  return commandResult(context, {
    actualEffect: 'write',
    writeTargets: ['project'],
    status: 'attention',
    result: {
      migration: 'growth-config-v1',
      sourcePath: input.path,
      configPath: loaded.configPath,
      growth,
      requiresConnection: true,
    },
    artifacts: [loaded.configPath],
    diagnostics: [
      '[GROWTH_CONFIG_MIGRATION_RECONNECT_REQUIRED] Secret and provider resource references are intentionally not copied.',
    ],
    nextActions: [
      'Delete the retired input after review, then run `unisane-ops connect google` and `unisane-ops check`.',
    ],
  });
}
