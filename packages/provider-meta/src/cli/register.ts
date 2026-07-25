import type { Command } from 'commander';
import { log } from '@unisane/cli-core';
import { loadLocalEnvironment } from '@unisane/ops-engine/local';
import {
  logoutMarketingMetaAuthCommand,
  saveMarketingMetaAuthCommand,
  statusMarketingMetaAuthCommand,
  tokenMarketingMetaAuthCommand,
  type MarketingMetaAuthCliOptions,
} from './auth-commands.js';
import { withDefaultMarketingMetaAuthProfile } from './profile.js';
import {
  metaAdsInventory,
  metaDoctor,
  metaPixelsInventory,
  metaSetupStatus,
} from './control-plane/commands.js';
import type { MetaProviderCliOptions } from './control-plane/model.js';

function addAuthSharedOptions(command: Command): Command {
  return command
    .option('--profile <name>', 'Saved Meta token profile name')
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option('--config <path>', 'Path to marketing config for default profile inference')
    .option('--auth-home <path>', 'Local Meta token profile directory')
    .option('--store <keychain|file>', 'Secret store backend')
    .option(
      '--allow-plaintext-store',
      'Allow plaintext file secrets for controlled CI/test environments',
    )
    .option('--json', 'Emit machine-readable JSON output');
}

function addMetaProviderSharedOptions(command: Command): Command {
  return addAuthSharedOptions(command)
    .option('--env <name>', 'Provider environment name')
    .option('--app <id>', 'App/platform id for artifacts and status')
    .option('--account-id <id>', 'Meta ad account id')
    .option('--access-token-env <name>', 'Fallback env var containing a Meta access token')
    .option('--api-version <version>', 'Meta Graph API version')
    .option('--max-pages <count>', 'Maximum API pages to read')
    .option('--page-size <count>', 'Graph API page size');
}

async function runMetaCommand<TOptions extends { cwd?: string; json?: boolean }>(
  options: TOptions,
  handler: (options: TOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) log.banner('Unisane');
  loadLocalEnvironment({ appDir: options.cwd });
  const code = await handler(options);
  process.exitCode = code;
}

export function registerMetaCommands(program: Command): void {
  const meta = program.command('meta').description('Meta provider control-plane commands');

  addMetaProviderSharedOptions(
    meta.command('doctor').description('Read-only Meta provider setup readiness check'),
  ).action(async (options: MetaProviderCliOptions) => {
    await runMetaCommand(options, metaDoctor);
  });

  const setup = meta.command('setup').description('Meta provider setup status commands');
  addMetaProviderSharedOptions(
    setup.command('status').description('Show Meta auth, env, and next-action status'),
  ).action(async (options: MetaProviderCliOptions) => {
    await runMetaCommand(options, metaSetupStatus);
  });

  const auth = meta.command('auth').description('Manage local Meta token profiles');
  addAuthSharedOptions(auth.command('save').description('Save a Meta access token from an env var'))
    .option('--access-token-env <name>', 'Environment variable containing the Meta access token')
    .option('--scopes <scopes>', 'Comma or space separated token scopes for local documentation')
    .option('--expires-at <iso>', 'Optional token expiry timestamp for local readiness checks')
    .action(async (options: MarketingMetaAuthCliOptions) => {
      await runMetaCommand(options, async (resolved) =>
        saveMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth.command('status').description('Show saved Meta token profile status without secrets'),
  ).action(async (options: MarketingMetaAuthCliOptions) => {
    await runMetaCommand(options, async (resolved) =>
      statusMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
    );
  });

  addAuthSharedOptions(
    auth.command('token').description('Resolve a Meta access token from env or profile'),
  )
    .option('--print', 'Print the raw access token')
    .action(async (options: MarketingMetaAuthCliOptions) => {
      await runMetaCommand(options, async (resolved) =>
        tokenMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth.command('logout').description('Delete a saved Meta token profile'),
  ).action(async (options: MarketingMetaAuthCliOptions) => {
    await runMetaCommand(options, async (resolved) =>
      logoutMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
    );
  });

  const ads = meta.command('ads').description('Meta ad-account inventory commands');
  addMetaProviderSharedOptions(
    ads.command('inventory').description('Read accessible Meta ad accounts and pixels'),
  )
    .option('--output <path>', 'Artifact output path inside cwd')
    .action(async (options: MetaProviderCliOptions) => {
      await runMetaCommand(options, metaAdsInventory);
    });

  const pixels = meta.command('pixels').description('Meta pixel inventory commands');
  addMetaProviderSharedOptions(
    pixels.command('inventory').description('Read accessible Meta pixels through ad accounts'),
  )
    .option('--output <path>', 'Artifact output path inside cwd')
    .action(async (options: MetaProviderCliOptions) => {
      await runMetaCommand(options, metaPixelsInventory);
    });
}
