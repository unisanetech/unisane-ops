import { registerGtmSetupCommand } from './setup.js';
import { registerGtmWorkspaceCommands, registerGtmReleaseCommands } from './workspace.js';
import { loadGrowthProjectContext } from '../../project-context.js';
import {
  googleTagManagerDiagnosisAction,
  googleTagManagerDiagnosisInputSchema,
} from '../../../gtm/diagnosis.js';
import { loadCommandContext, readRemoteSnapshot, printJson, handleCommandError } from './shared.js';
import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  diffGoogleTagManagerCommand,
  pullGoogleTagManagerCommand,
  validateGoogleTagManagerCommand,
  type GoogleTagManagerCliOptions,
} from './index.js';

function addSharedOptions(command: Command): Command {
  return command
    .option('--app <id>', 'Expected app id declared by the GTM manifest')
    .option('--env <name>', 'Manifest environment to use')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--manifest <path>', 'Path to the GTM manifest')
    .option('--json', 'Emit machine-readable JSON output');
}

function addWorkspaceApiOptions(command: Command): Command {
  return command
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--workspace-id <id>', 'GTM workspace id to select')
    .option('--workspace-name <name>', 'GTM workspace name to select')
    .option('--rate-limit-ms <ms>', 'Minimum delay between GTM API requests');
}

function addReadOptions(command: Command): Command {
  return addWorkspaceApiOptions(command)
    .option('--snapshot <path>', 'Read an existing local snapshot instead of calling the GTM API')
    .option('--extended', 'Include extended read-only GTM resources in pull snapshots')
    .option(
      '--include-user-permissions',
      'Include account user permissions (requires tagmanager.manage.users)',
    );
}

async function runGtmCommand<TOptions extends { cwd?: string }>(
  options: TOptions,
  handler: (options: TOptions) => Promise<number>,
): Promise<void> {
  log.banner('Unisane');
  const resolvedOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}

export function registerGoogleTagManagerCommands(program: Command): void {
  const gtm = program.command('gtm').description('Google Tag Manager control-plane commands');
  registerGtmSetupCommand(gtm);
  registerGtmWorkspaceCommands(gtm);
  registerGtmReleaseCommands(gtm);
  addSharedOptions(
    gtm
      .command('diagnose')
      .description(
        'Diagnose desired state and optional local workspace evidence without provider access',
      ),
  )
    .option('--snapshot <path>', 'Existing local snapshot')
    .action(async (options: GoogleTagManagerCliOptions) => {
      try {
        const context = await loadCommandContext(options);
        const project = await loadGrowthProjectContext();
        const snapshot = options.snapshot
          ? await readRemoteSnapshot({ context, options })
          : undefined;
        const result = await googleTagManagerDiagnosisAction.execute(
          googleTagManagerDiagnosisInputSchema.parse({
            projectId: project.projectId,
            manifest: context.manifest,
            environment: context.environment,
            snapshot,
          }),
          {
            requestId: 'gtm-diagnosis',
            scopeId: context.manifest.appId,
            projectId: project.projectId,
            environmentId: context.environment,
            principal: { kind: 'user', id: 'local-cli' },
            requestedAt: new Date().toISOString(),
          },
        );
        if (options.json) printJson(result);
        else {
          log.info(
            `GTM ${result.containerPath}: ${result.operations.length} proposed operations; tracking unverified.`,
          );
          for (const issue of result.issues)
            log.info(`${issue.severity} ${issue.code}: ${issue.message}`);
        }
      } catch (error) {
        process.exitCode = handleCommandError(error, options);
      }
    });

  addSharedOptions(
    gtm.command('validate').description('Validate the local GTM manifest and policy gates'),
  ).action(async (options: GoogleTagManagerCliOptions) => {
    await runGtmCommand(options, validateGoogleTagManagerCommand);
  });

  addReadOptions(
    addSharedOptions(
      gtm.command('pull').description('Read remote GTM state and write a local snapshot'),
    ),
  )
    .option('--output <path>', 'Snapshot output path')
    .option('--dry-run', 'Preview the pull without writing the snapshot artifact')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, pullGoogleTagManagerCommand);
    });

  addReadOptions(
    addSharedOptions(
      gtm
        .command('diff')
        .description('Compare local desired GTM state with remote or snapshot state'),
    ),
  ).action(async (options: GoogleTagManagerCliOptions) => {
    await runGtmCommand(options, diffGoogleTagManagerCommand);
  });
}
