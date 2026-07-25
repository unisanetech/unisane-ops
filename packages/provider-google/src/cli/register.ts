import type { Command } from 'commander';
import { log } from '@unisane/cli-core';
import {
  loadLocalEnvironment,
  resolveControlPlaneWorkingDirectory,
} from '@unisane/ops-engine/local';
import {
  loginGoogleAuthCommand,
  logoutGoogleAuthCommand,
  statusGoogleAuthCommand,
  tokenGoogleAuthCommand,
  type GoogleAuthCliOptions,
} from '../index.js';
import {
  googleApisApply,
  googleApisInventory,
  googleApisPlan,
  googleDoctor,
  googleProductsInventory,
  googleSetupStatus,
} from '../index.js';
import type { GoogleProviderCliOptions } from '../index.js';

function addAuthSharedOptions(command: Command): Command {
  return command
    .option('--profile <name>', 'Saved Google auth profile name')
    .option('--auth-namespace <google|marketing>', 'Saved Google auth namespace')
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option('--auth-home <path>', 'Local Google auth profile directory')
    .option('--store <keychain|file>', 'Secret store backend')
    .option(
      '--allow-plaintext-store',
      'Allow plaintext file secrets for controlled CI/test environments',
    )
    .option('--json', 'Emit machine-readable JSON output');
}

function collectRepeated(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function addGoogleProviderSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option('--project <id>', 'Google Cloud project id')
    .option('--profile <name>', 'Saved Google auth profile name')
    .option('--auth-namespace <google|marketing>', 'Saved Google auth namespace')
    .option('--auth-home <path>', 'Local Google auth profile directory')
    .option('--store <keychain|file>', 'Secret store backend')
    .option(
      '--allow-plaintext-store',
      'Allow plaintext file secrets for controlled CI/test environments',
    )
    .option('--env <name>', 'Provider environment name', 'dev')
    .option('--app <id>', 'App/platform id for artifacts and status')
    .option('--config <path>', 'Optional app/provider config path')
    .option('--api <service>', 'Required Google API service name; repeatable', collectRepeated)
    .option('--developer-token-env <name>', 'Google Ads developer token env name')
    .option('--api-version <version>', 'Google product API version when applicable')
    .option('--json', 'Emit machine-readable JSON output');
}

async function runGoogleCommand<TOptions extends { cwd?: string; json?: boolean }>(
  options: TOptions,
  handler: (options: TOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) log.banner('Unisane');
  const resolvedOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadLocalEnvironment({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}

export function registerGoogleCommands(program: Command): void {
  const google = program.command('google').description('Shared Google API devtool commands');

  addGoogleProviderSharedOptions(
    google.command('doctor').description('Read-only Google provider setup readiness check'),
  ).action(async (options: GoogleProviderCliOptions) => {
    await runGoogleCommand(options, googleDoctor);
  });

  const setup = google.command('setup').description('Google provider setup status commands');

  addGoogleProviderSharedOptions(
    setup.command('status').description('Show Google project, auth, env, and next-action status'),
  ).action(async (options: GoogleProviderCliOptions) => {
    await runGoogleCommand(options, googleSetupStatus);
  });

  const apis = google
    .command('apis')
    .description('Google API inventory, planning, and guarded enablement');

  addGoogleProviderSharedOptions(
    apis.command('inventory').description('Read enabled Google APIs through Service Usage'),
  )
    .option('--output <path>', 'Artifact output path inside cwd')
    .action(async (options: GoogleProviderCliOptions) => {
      await runGoogleCommand(options, googleApisInventory);
    });

  addGoogleProviderSharedOptions(
    apis.command('plan').description('Generate a non-mutating plan for missing Google APIs'),
  )
    .option('--inventory <path>', 'Read an existing Google API inventory artifact')
    .option('--output <path>', 'Plan output path inside cwd')
    .action(async (options: GoogleProviderCliOptions) => {
      await runGoogleCommand(options, googleApisPlan);
    });

  addGoogleProviderSharedOptions(
    apis.command('apply').description('Apply a reviewed Google API enablement plan with receipt'),
  )
    .requiredOption('--plan <path>', 'Google API plan artifact path')
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option(
      '--production-confirm <value>',
      'Required for production apply: <env>:<project-id>:google-apis-apply',
    )
    .option('--yes', 'Confirm the reviewed plan should be applied')
    .action(async (options: GoogleProviderCliOptions) => {
      await runGoogleCommand(options, googleApisApply);
    });

  const products = google
    .command('products')
    .description('Google product discovery for GTM, GA4, Search Console, and Google Ads');

  addGoogleProviderSharedOptions(
    products.command('inventory').description('Read accessible Google product resources'),
  )
    .option('--output <path>', 'Artifact output path inside cwd')
    .action(async (options: GoogleProviderCliOptions) => {
      await runGoogleCommand(options, googleProductsInventory);
    });

  const auth = google.command('auth').description('Manage local Google OAuth profiles');

  addAuthSharedOptions(
    auth.command('login').description('Run local OAuth and save a refresh-token auth profile'),
  )
    .option('--client-id <id>', 'Google OAuth client id')
    .option('--client-secret-env <name>', 'Environment variable containing the OAuth client secret')
    .requiredOption('--scopes <scopes>', 'Comma or space separated OAuth scopes')
    .option('--port <port>', 'Loopback callback port, or 0 for a random available port')
    .option('--timeout-ms <ms>', 'OAuth callback wait timeout')
    .action(async (options: GoogleAuthCliOptions) => {
      await runGoogleCommand(options, loginGoogleAuthCommand);
    });

  addAuthSharedOptions(
    auth.command('status').description('Show saved Google auth profile status without secrets'),
  ).action(async (options: GoogleAuthCliOptions) => {
    await runGoogleCommand(options, statusGoogleAuthCommand);
  });

  addAuthSharedOptions(
    auth.command('token').description('Mint an access token from a saved profile'),
  )
    .option('--required-scope <scope>', 'Required OAuth scope to verify')
    .option('--print', 'Print the raw access token')
    .action(async (options: GoogleAuthCliOptions) => {
      await runGoogleCommand(options, tokenGoogleAuthCommand);
    });

  addAuthSharedOptions(
    auth.command('logout').description('Delete a saved Google auth profile'),
  ).action(async (options: GoogleAuthCliOptions) => {
    await runGoogleCommand(options, logoutGoogleAuthCommand);
  });
}
