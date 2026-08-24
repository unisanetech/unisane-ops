import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  createGrowthConfigIntent,
  growthAdoptionModeSchema,
  growthCapabilitySchema,
  type GrowthAdoptionMode,
  type GrowthCapability,
} from '@unisane/growth/contracts';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { parseArguments, oneOption } from './arguments.js';
import { commandResult } from './result.js';
import {
  createInitialOpsConfig,
  detectOpsProject,
  initializeOpsConfigSource,
} from '../project/config-source.js';

async function confirmWrite(context: PackCommandContext, message: string): Promise<boolean> {
  if (context.json || !stdin.isTTY || !stdout.isTTY) return false;
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question(`${message} [y/N] `);
    return answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
  } finally {
    prompt.close();
  }
}

function adoptionMode(input: string | undefined, priorGrowthState: boolean): GrowthAdoptionMode {
  if (input) return growthAdoptionModeSchema.parse(input);
  return priorGrowthState ? 'adopt-existing' : 'new';
}

function capabilities(input: readonly string[]): GrowthCapability[] {
  const selected = input.length > 0 ? input : ['seo', 'analytics'];
  return selected.map((capability) => growthCapabilitySchema.parse(capability));
}

export async function runOpsInit(context: PackCommandContext): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: ['--yes', '--growth', '--production'],
    options: ['--project', '--environment', '--mode', '--capability', '--runtime'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] init: ${parsed.positionals.join(' ')}`);
  }

  const project = detectOpsProject(context.cwd);
  const environmentId = oneOption(parsed, '--environment') ?? 'development';
  const mode = adoptionMode(oneOption(parsed, '--mode'), project.priorGrowthState);
  const config = createInitialOpsConfig({
    projectId: oneOption(parsed, '--project') ?? project.projectId,
    environmentId,
    production: parsed.flags.has('--production'),
  });
  if (parsed.flags.has('--growth')) {
    config.capabilities.growth = createGrowthConfigIntent({
      adoptionMode: mode,
      capabilities: capabilities(parsed.options.get('--capability') ?? []),
      environments: [environmentId],
      runtimeIntegration: oneOption(parsed, '--runtime') as
        | 'none'
        | 'web-runtime'
        | 'tag-manager'
        | 'existing'
        | undefined,
    });
  }

  const confirmed =
    parsed.flags.has('--yes') ||
    (await confirmWrite(
      context,
      `Set up Unisane Ops for '${config.project.id}' in ${project.root}?`,
    ));
  if (!confirmed) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'attention',
      result: {
        project: config.project.id,
        framework: project.framework,
        proposedMode: mode,
        configPath: project.configPath,
        writeRequired: true,
      },
      nextActions: ['Re-run `unisane-ops init --yes` after reviewing the detected project.'],
    });
  }

  const written = initializeOpsConfigSource({ project, config });
  return commandResult(context, {
    actualEffect: 'write',
    writeTargets: ['project'],
    status: 'ok',
    result: {
      project: config.project.id,
      framework: project.framework,
      mode: written.mode,
      growthSelected: Boolean(config.capabilities.growth),
      configPath: written.configPath,
    },
    artifacts: [written.configPath],
    nextActions: config.capabilities.growth
      ? ['Run `unisane-ops connect google` to connect the first Growth provider.']
      : ['Run `unisane-ops add growth` to select Growth capabilities.'],
  });
}
