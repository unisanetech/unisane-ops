import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  applyGoogleTagManagerCommand,
  createVersionGoogleTagManagerCommand,
  diffGoogleTagManagerCommand,
  loginGoogleTagManagerAuthCommand,
  logoutGoogleTagManagerAuthCommand,
  planGoogleTagManagerCommand,
  previewGoogleTagManagerCommand,
  publishGoogleTagManagerCommand,
  pullGoogleTagManagerCommand,
  rollbackGoogleTagManagerCommand,
  statusGoogleTagManagerAuthCommand,
  tokenGoogleTagManagerAuthCommand,
  validateGoogleTagManagerCommand,
  type GoogleTagManagerAuthCliOptions,
  type GoogleTagManagerCliOptions,
} from './index.js';
import { loadGoogleTagManagerManifest } from './manifest-loader.js';

const GTM_AUTH_PROFILE_ENV = 'UNISANE_GTM_AUTH_PROFILE';

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
    .option('--access-token-env <name>', 'Environment variable containing a GTM OAuth access token')
    .option(
      '--auth-profile <name>',
      'Saved GTM auth profile; defaults to the manifest app id when available',
    )
    .option('--workspace-id <id>', 'GTM workspace id to select')
    .option('--workspace-name <name>', 'GTM workspace name to select')
    .option('--rate-limit-ms <ms>', 'Minimum delay between GTM API requests');
}

function addAuthSharedOptions(command: Command): Command {
  return command
    .option('--profile <name>', 'Saved GTM auth profile name')
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option('--auth-home <path>', 'Local GTM auth profile directory')
    .option('--store <keychain|file>', 'Secret store backend')
    .option(
      '--allow-plaintext-store',
      'Allow plaintext file secrets for controlled CI/test environments',
    )
    .option('--json', 'Emit machine-readable JSON output');
}

function addReadOptions(command: Command): Command {
  return addWorkspaceApiOptions(command)
    .option('--snapshot <path>', 'Read an existing local snapshot instead of calling the GTM API')
    .option('--extended', 'Include extended read-only GTM resources in pull snapshots');
}

async function withDefaultGtmAuthProfile<
  TOptions extends { profile?: string; cwd?: string; manifest?: string; app?: string },
>(options: TOptions): Promise<TOptions> {
  if (options.profile || process.env[GTM_AUTH_PROFILE_ENV]) return options;
  try {
    const loaded = await loadGoogleTagManagerManifest({
      cwd: options.cwd,
      manifestPath: options.manifest,
      app: options.app,
    });
    return { ...options, profile: loaded.manifest.appId };
  } catch {
    return options;
  }
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
  const auth = gtm.command('auth').description('Manage local Google Tag Manager OAuth profiles');

  addAuthSharedOptions(
    auth.command('login').description('Run local OAuth and save a refresh-token auth profile'),
  )
    .option('--client-id <id>', 'Google OAuth client id; defaults to GOOGLE_OAUTH_CLIENT_ID')
    .option('--client-secret-env <name>', 'Environment variable containing the OAuth client secret')
    .option('--scopes <scopes>', 'Comma or space separated OAuth scopes')
    .option('--port <port>', 'Loopback callback port, or 0 for a random available port')
    .option('--timeout-ms <ms>', 'OAuth callback wait timeout')
    .action(async (options: GoogleTagManagerAuthCliOptions) => {
      await runGtmCommand(options, async (resolved) =>
        loginGoogleTagManagerAuthCommand(await withDefaultGtmAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth
      .command('status')
      .description('Show saved GTM auth profile status without printing secrets'),
  ).action(async (options: GoogleTagManagerAuthCliOptions) => {
    await runGtmCommand(options, async (resolved) =>
      statusGoogleTagManagerAuthCommand(await withDefaultGtmAuthProfile(resolved)),
    );
  });

  addAuthSharedOptions(
    auth.command('token').description('Mint an access token from a saved GTM auth profile'),
  )
    .option('--required-scope <scope>', 'Required OAuth scope to verify')
    .option('--print', 'Print the raw access token')
    .action(async (options: GoogleTagManagerAuthCliOptions) => {
      await runGtmCommand(options, async (resolved) =>
        tokenGoogleTagManagerAuthCommand(await withDefaultGtmAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth.command('logout').description('Delete a saved GTM auth profile and its stored secrets'),
  ).action(async (options: GoogleTagManagerAuthCliOptions) => {
    await runGtmCommand(options, async (resolved) =>
      logoutGoogleTagManagerAuthCommand(await withDefaultGtmAuthProfile(resolved)),
    );
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
    .option('--access-token-env <name>', 'Environment variable containing a GTM OAuth access token')
    .option(
      '--auth-profile <name>',
      'Saved GTM auth profile; defaults to the manifest app id when available',
    )
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
    .option('--access-token-env <name>', 'Environment variable containing a GTM OAuth access token')
    .option(
      '--auth-profile <name>',
      'Saved GTM auth profile; defaults to the manifest app id when available',
    )
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
