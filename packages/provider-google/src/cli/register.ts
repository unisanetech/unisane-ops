import type { Command } from 'commander';
import { log } from '@unisane/cli-core';
import {
  loadLocalEnvironment,
  resolveControlPlaneWorkingDirectory,
} from '@unisane/ops-engine/local';
import {
  googleApisApply,
  googleApisInventory,
  googleApisPlan,
  googleProductsInventory,
} from '../index.js';
import type { GoogleProviderCliOptions } from '../index.js';

function collectRepeated(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function addGoogleProviderSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option('--project <id>', 'Google Cloud project id')
    .option('--connection <id>', 'Canonical Google connection id')
    .option('--environment <name>', 'Ops environment name')
    .option('--api <service>', 'Required Google API service name; repeatable', collectRepeated)
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
}
