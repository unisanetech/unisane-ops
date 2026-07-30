import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  applyGoogleTagManagerCommand,
  createVersionGoogleTagManagerCommand,
  diffGoogleTagManagerCommand,
  planGoogleTagManagerCommand,
  previewGoogleTagManagerCommand,
  publishGoogleTagManagerCommand,
  pullGoogleTagManagerCommand,
  rollbackGoogleTagManagerCommand,
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
    .option('--extended', 'Include extended read-only GTM resources in pull snapshots');
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

  addReadOptions(
    addSharedOptions(
      gtm.command('plan').description('Write a non-mutating GTM operation plan artifact'),
    ),
  )
    .option('--output <path>', 'Plan output path')
    .option('--dry-run', 'Preview the plan without writing the plan artifact')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, planGoogleTagManagerCommand);
    });

  addReadOptions(
    addSharedOptions(
      gtm.command('apply').description('Apply a GTM plan into a controlled workspace'),
    ),
  )
    .option('--output <path>', 'Apply receipt output path')
    .option('--dry-run', 'Compute the apply plan without mutating GTM')
    .option('--yes', 'Confirm live GTM workspace mutation')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, applyGoogleTagManagerCommand);
    });

  addWorkspaceApiOptions(
    addSharedOptions(
      gtm
        .command('preview')
        .description('Quick preview a GTM workspace and write a preview receipt'),
    ),
  )
    .option('--output <path>', 'Preview receipt output path')
    .option('--dry-run', 'Run preview without writing the preview receipt')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, previewGoogleTagManagerCommand);
    });

  addWorkspaceApiOptions(
    addSharedOptions(
      gtm.command('create-version').description('Create a GTM container version from a workspace'),
    ),
  )
    .option('--name <name>', 'Container version name')
    .option('--notes <notes>', 'Container version notes')
    .option('--preview-receipt <path>', 'Preview receipt from a successful gtm preview')
    .option('--output <path>', 'Version receipt output path')
    .option('--yes', 'Confirm GTM container version creation')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, createVersionGoogleTagManagerCommand);
    });

  addSharedOptions(gtm.command('publish').description('Publish a GTM container version'))
    .option('--version <id>', 'GTM container version id to publish')
    .option('--fingerprint <fingerprint>', 'Expected GTM container version fingerprint')
    .option('--version-receipt <path>', 'Version receipt from a successful gtm create-version')
    .option(
      '--production-confirm <value>',
      'Required production confirmation: <app>:production:<version>',
    )
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--rate-limit-ms <ms>', 'Minimum delay between GTM API requests')
    .option('--output <path>', 'Publish receipt output path')
    .option('--yes', 'Confirm GTM publish')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, publishGoogleTagManagerCommand);
    });

  addSharedOptions(
    gtm.command('rollback').description('Rollback by publishing a previous GTM container version'),
  )
    .option('--version <id>', 'GTM container version id to publish as rollback target')
    .option('--fingerprint <fingerprint>', 'Expected GTM container version fingerprint')
    .option(
      '--version-receipt <path>',
      'Version or reviewed known-good receipt for normal rollback',
    )
    .option(
      '--production-confirm <value>',
      'Required production confirmation: <app>:production:<version>',
    )
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--rate-limit-ms <ms>', 'Minimum delay between GTM API requests')
    .option('--output <path>', 'Rollback receipt output path')
    .option(
      '--emergency-reason <reason>',
      'Explicit emergency reason when rollback receipt is unavailable',
    )
    .option('--actor <id>', 'Operator identity for emergency rollback exception')
    .option('--reconciliation-task <ref>', 'Follow-up reconciliation task for emergency rollback')
    .option('--yes', 'Confirm GTM rollback publish')
    .action(async (options: GoogleTagManagerCliOptions) => {
      await runGtmCommand(options, rollbackGoogleTagManagerCommand);
    });
}
