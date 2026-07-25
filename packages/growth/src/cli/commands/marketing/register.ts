import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  marketingConsoleBuild,
  marketingConsoleServe,
  type MarketingConsoleCliOptions,
} from '../marketing-console/index.js';
import {
  marketingAlertAcknowledge,
  marketingAudit,
  marketingConversionPull,
  marketingDoctor,
  marketingExperimentDecide,
  loginMarketingGoogleAuthCommand,
  logoutMarketingGoogleAuthCommand,
  logoutMarketingMetaAuthCommand,
  marketingPull,
  marketingPullApi,
  marketingProofSetup,
  marketingProofStatus,
  marketingRecommend,
  marketingRecommendDecision,
  marketingResearchStatus,
  marketingReport,
  marketingScheduleReporting,
  marketingSetupDiscoverGoogle,
  marketingSetupDiscoverMeta,
  marketingSetupGuide,
  marketingSetupPrelive,
  marketingSetupStatus,
  marketingStrategyPull,
  marketingStatus,
  marketingValidate,
  saveMarketingMetaAuthCommand,
  statusMarketingGoogleAuthCommand,
  statusMarketingMetaAuthCommand,
  tokenMarketingGoogleAuthCommand,
  tokenMarketingMetaAuthCommand,
  type MarketingGoogleAuthCliOptions,
  type MarketingMetaAuthCliOptions,
  type MarketingCliOptions,
} from './index.js';
import {
  withDefaultMarketingGoogleAuthProfile,
  withDefaultMarketingMetaAuthProfile,
} from './profile-defaults.js';

function addSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--config <path>', 'Path to marketing config')
    .option('--source-root <path...>', 'Override source roots for tracking audit')
    .option('--json', 'Emit machine-readable JSON output');
}

function addAuthSharedOptions(
  command: Command,
  options: { profileDescription?: string; authHomeDescription?: string } = {},
): Command {
  return command
    .option(
      '--profile <name>',
      options.profileDescription ?? 'Saved marketing Google auth profile name',
    )
    .option('--cwd <path>', 'Directory to load .env.local/.env from')
    .option(
      '--auth-home <path>',
      options.authHomeDescription ?? 'Local marketing auth profile directory',
    )
    .option('--store <keychain|file>', 'Secret store backend')
    .option(
      '--allow-plaintext-store',
      'Allow plaintext file secrets for controlled CI/test environments',
    )
    .option('--json', 'Emit machine-readable JSON output');
}

async function runMarketingCommand<
  TOptions extends { cwd?: string; json?: boolean; unified?: boolean },
>(options: TOptions, handler: (options: TOptions) => Promise<number>): Promise<void> {
  if (!options.json && !options.unified) log.banner('Unisane');
  const resolvedOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}

export function registerMarketingCommands(program: Command): void {
  const marketing = program
    .command('marketing')
    .description('Marketing control-plane health, sync, and reporting commands');
  const auth = marketing
    .command('auth')
    .description('Manage local Marketing Google OAuth profiles');
  const consoleCommand = marketing
    .command('console')
    .description('Local analytical Marketing Console dashboard');

  addSharedOptions(
    consoleCommand.command('build').description('Build the local Marketing Console dashboard'),
  )
    .option('--out <path>', 'Dashboard output directory')
    .option('--dry-run', 'Build console state without writing dashboard files')
    .option('--max-age-days <days>', 'Freshness threshold for dashboard status')
    .option('--limits <path>', 'Local provider limits/scopes proof record')
    .action(async (options: MarketingConsoleCliOptions) => {
      await runMarketingCommand(options, marketingConsoleBuild);
    });

  addSharedOptions(
    consoleCommand
      .command('serve')
      .description('Build and serve the local Marketing Console dashboard'),
  )
    .option('--out <path>', 'Dashboard output directory')
    .option('--host <host>', 'Local dashboard host')
    .option('--port <port>', 'Local dashboard port')
    .option('--max-age-days <days>', 'Freshness threshold for dashboard status')
    .option('--limits <path>', 'Local provider limits/scopes proof record')
    .action(async (options: MarketingConsoleCliOptions) => {
      await runMarketingCommand(options, marketingConsoleServe);
    });

  addAuthSharedOptions(
    auth.command('login').description('Run local OAuth and save a Marketing Google auth profile'),
  )
    .option('--client-id <id>', 'Google OAuth client id; defaults to GOOGLE_OAUTH_CLIENT_ID')
    .option('--client-secret-env <name>', 'Environment variable containing the OAuth client secret')
    .option('--scopes <scopes>', 'Comma or space separated OAuth scopes')
    .option('--port <port>', 'Loopback callback port, or 0 for a random available port')
    .option('--timeout-ms <ms>', 'OAuth callback wait timeout')
    .action(async (options: MarketingGoogleAuthCliOptions) => {
      await runMarketingCommand(options, async (resolved) =>
        loginMarketingGoogleAuthCommand(await withDefaultMarketingGoogleAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth
      .command('status')
      .description('Show saved Marketing Google auth profile status without secrets'),
  ).action(async (options: MarketingGoogleAuthCliOptions) => {
    await runMarketingCommand(options, async (resolved) =>
      statusMarketingGoogleAuthCommand(await withDefaultMarketingGoogleAuthProfile(resolved)),
    );
  });

  addAuthSharedOptions(
    auth.command('token').description('Mint an access token from a saved Marketing Google profile'),
  )
    .option('--required-scope <scope>', 'Required OAuth scope to verify')
    .option('--print', 'Print the raw access token')
    .action(async (options: MarketingGoogleAuthCliOptions) => {
      await runMarketingCommand(options, async (resolved) =>
        tokenMarketingGoogleAuthCommand(await withDefaultMarketingGoogleAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    auth.command('logout').description('Delete a saved Marketing Google auth profile'),
  ).action(async (options: MarketingGoogleAuthCliOptions) => {
    await runMarketingCommand(options, async (resolved) =>
      logoutMarketingGoogleAuthCommand(await withDefaultMarketingGoogleAuthProfile(resolved)),
    );
  });

  const metaAuth = auth.command('meta').description('Manage local Marketing Meta token profiles');
  addAuthSharedOptions(
    metaAuth.command('save').description('Save a Marketing Meta access token from an env var'),
    {
      profileDescription: 'Saved marketing Meta token profile name',
      authHomeDescription: 'Local marketing Meta token profile directory',
    },
  )
    .option('--access-token-env <name>', 'Environment variable containing the Meta access token')
    .option('--scopes <scopes>', 'Comma or space separated token scopes for local documentation')
    .option('--expires-at <iso>', 'Optional token expiry timestamp for local readiness checks')
    .action(async (options: MarketingMetaAuthCliOptions) => {
      await runMarketingCommand(options, async (resolved) =>
        saveMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    metaAuth
      .command('status')
      .description('Show saved Marketing Meta token profile status without secrets'),
    {
      profileDescription: 'Saved marketing Meta token profile name',
      authHomeDescription: 'Local marketing Meta token profile directory',
    },
  ).action(async (options: MarketingMetaAuthCliOptions) => {
    await runMarketingCommand(options, async (resolved) =>
      statusMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
    );
  });

  addAuthSharedOptions(
    metaAuth
      .command('token')
      .description('Resolve a Marketing Meta access token from env or profile'),
    {
      profileDescription: 'Saved marketing Meta token profile name',
      authHomeDescription: 'Local marketing Meta token profile directory',
    },
  )
    .option('--print', 'Print the raw access token')
    .action(async (options: MarketingMetaAuthCliOptions) => {
      await runMarketingCommand(options, async (resolved) =>
        tokenMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
      );
    });

  addAuthSharedOptions(
    metaAuth.command('logout').description('Delete a saved Marketing Meta token profile'),
    {
      profileDescription: 'Saved marketing Meta token profile name',
      authHomeDescription: 'Local marketing Meta token profile directory',
    },
  ).action(async (options: MarketingMetaAuthCliOptions) => {
    await runMarketingCommand(options, async (resolved) =>
      logoutMarketingMetaAuthCommand(await withDefaultMarketingMetaAuthProfile(resolved)),
    );
  });

  addSharedOptions(
    marketing.command('doctor').description('Inspect marketing control-plane readiness'),
  )
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile; defaults to the app id when a marketing config is present',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id when a marketing config is present',
    )
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingDoctor);
    });

  const setup = marketing.command('setup').description('Simplified marketing setup guidance');
  addSharedOptions(setup.command('guide').description('Show the next few setup actions'))
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile; defaults to the app id when a marketing config is present',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id when a marketing config is present',
    )
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingSetupGuide);
    });
  for (const command of [
    setup.command('status').description('Show lifecycle setup status and the next safest step'),
    setup.command('wizard').description('Alias for setup status with staged next-step guidance'),
  ]) {
    addSharedOptions(command)
      .option(
        '--auth-profile <name>',
        'Saved marketing Google auth profile; defaults to the app id when a marketing config is present',
      )
      .option(
        '--meta-auth-profile <name>',
        'Saved marketing Meta token profile; defaults to the app id when a marketing config is present',
      )
      .action(async (options: MarketingCliOptions) => {
        await runMarketingCommand(options, marketingSetupStatus);
      });
  }
  addSharedOptions(
    setup
      .command('prelive')
      .description('Run one local pre-live readiness check before real-account use'),
  )
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile; defaults to the app id when a marketing config is present',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id when a marketing config is present',
    )
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingSetupPrelive);
    });
  addSharedOptions(
    setup
      .command('discover-google')
      .description('Discover accessible Google Ads, GA4, and Search Console accounts'),
  )
    .option('--auth-profile <name>', 'Saved marketing Google auth profile; defaults to the app id')
    .option('--api-version <version>', 'Google Ads API version override')
    .option('--out <path>', 'Write discovery artifact JSON')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingSetupDiscoverGoogle);
    });
  addSharedOptions(
    setup.command('discover-meta').description('Discover accessible Meta ad accounts and pixels'),
  )
    .option('--api-version <version>', 'Meta Graph API version override')
    .option('--account-id <id>', 'Meta ad account id to use for pixel discovery')
    .option('--max-pages <count>', 'Maximum Graph API pages to read')
    .option('--page-size <count>', 'Graph API page size')
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id',
    )
    .option('--out <path>', 'Write discovery artifact JSON')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingSetupDiscoverMeta);
    });

  addSharedOptions(
    marketing.command('validate').description('Validate the platform marketing config'),
  ).action(async (options: MarketingCliOptions) => {
    await runMarketingCommand(options, marketingValidate);
  });

  addSharedOptions(
    marketing.command('audit').description('Audit marketing tracking and conversion source usage'),
  ).action(async (options: MarketingCliOptions) => {
    await runMarketingCommand(options, marketingAudit);
  });

  addSharedOptions(
    marketing.command('pull').description('Cache a read-only normalized provider report artifact'),
  )
    .requiredOption('--provider <provider>', 'Provider: googleAds, metaAds, ga4, or searchConsole')
    .requiredOption('--input <path>', 'Provider report JSON export or normalized artifact')
    .option(
      '--input-format <format>',
      'Input format: normalized, google-ads, meta-ads, ga4, or search-console',
    )
    .option('--source <source>', 'Report source: api, manual-export, or fixture')
    .option('--report <type>', 'Provider report family for isolated cache paths')
    .option('--account-id <id>', 'Provider account/property/site identifier for this pull')
    .option('--start-date <date>', 'Report window start date, YYYY-MM-DD')
    .option('--end-date <date>', 'Report window end date, YYYY-MM-DD')
    .option('--time-zone <zone>', 'Report window time zone')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingPull);
    });

  addSharedOptions(
    marketing
      .command('conversion-pull')
      .description('Cache a read-only Unisane-confirmed conversion artifact'),
  )
    .requiredOption('--input <path>', 'Unisane-confirmed conversion JSON artifact')
    .option('--source <source>', 'Report source: api, manual-export, or fixture')
    .option('--start-date <date>', 'Report window start date, YYYY-MM-DD')
    .option('--end-date <date>', 'Report window end date, YYYY-MM-DD')
    .option('--time-zone <zone>', 'Report window time zone')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingConversionPull);
    });

  addSharedOptions(
    marketing
      .command('strategy-pull')
      .description('Cache a read-only strategy object map for unified marketing joins'),
  )
    .requiredOption('--input <path>', 'Marketing strategy-map JSON artifact')
    .option('--source <source>', 'Report source: api, manual-export, or fixture')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingStrategyPull);
    });

  addSharedOptions(
    marketing
      .command('pull-api')
      .description('Pull a read-only provider report through provider APIs'),
  )
    .requiredOption('--provider <provider>', 'Provider: googleAds, metaAds, ga4, or searchConsole')
    .requiredOption('--start-date <date>', 'Report window start date, YYYY-MM-DD')
    .requiredOption('--end-date <date>', 'Report window end date, YYYY-MM-DD')
    .option('--account-id <id>', 'Provider account/property/site identifier for this pull')
    .option('--time-zone <zone>', 'Report window time zone')
    .option('--api-version <version>', 'Provider API version override')
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile for provider API access; defaults to the app id',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id when no Meta access token env is set',
    )
    .option('--report <type>', 'Provider report family to pull')
    .option('--max-pages <count>', 'Maximum API pages/windows to pull for paginated providers')
    .option('--page-size <count>', 'Provider page size or row limit where supported')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingPullApi);
    });

  addSharedOptions(marketing.command('report').description('Inspect provider report freshness'))
    .option('--provider <provider>', 'Limit report status to one provider')
    .option('--report <type>', 'Limit report status to one provider report family')
    .option('--max-age-days <days>', 'Freshness threshold for latest provider pulls')
    .option(
      '--unified',
      'Emit the unified marketing report with tracking gaps and provider metrics',
    )
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingReport);
    });

  addSharedOptions(
    marketing
      .command('status')
      .description('Show provider, analytics, conversion, and strategy freshness'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for latest pulls')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingStatus);
    });

  const schedule = marketing
    .command('schedule')
    .description('Scheduled reporting automation planning');
  addSharedOptions(
    schedule
      .command('reporting')
      .description('Write proof-gated scheduled provider reporting commands'),
  )
    .option('--limits <path>', 'Local provider limits/scopes proof record')
    .option('--max-age-days <days>', 'Freshness threshold for proof evidence')
    .option('--window-days <days>', 'Rolling reporting window size for scheduled pulls', '3')
    .option('--cadence <cadence>', 'Reporting cadence: daily or weekly', 'daily')
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile for scheduled pulls; defaults to the app id',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile for scheduled pulls; defaults to the app id',
    )
    .option('--out <path>', 'Scheduled reporting plan output path')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingScheduleReporting);
    });

  const proof = marketing.command('proof').description('Real-account proof readiness commands');
  addSharedOptions(
    proof.command('setup').description('Create a read-only real-account proof setup file'),
  )
    .option('--out <path>', 'Provider limits/scopes proof record output path')
    .option('--force', 'Overwrite an existing proof setup file')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingProofSetup);
    });

  addSharedOptions(
    proof.command('status').description('Show read-only real-account proof readiness'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for proof evidence')
    .option('--limits <path>', 'Local provider limits/scopes proof record')
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile; defaults to the app id when a marketing config is present',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile; defaults to the app id when a marketing config is present',
    )
    .option('--out <path>', 'Write proof status artifact JSON')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingProofStatus);
    });

  const recommend = addSharedOptions(
    marketing
      .command('recommend')
      .description('Generate read-only marketing alerts and recommendations'),
  );
  recommend
    .option('--max-age-days <days>', 'Freshness threshold for recommendations')
    .option('--target-cpa <amount>', 'Target CPA threshold for CPA alerts')
    .option('--spend-spike-amount <amount>', 'Spend amount threshold for spend spike alerts')
    .option('--out <path>', 'Recommendation artifact output path')
    .option('--dry-run', 'Preview recommendations without writing')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingRecommend);
    });

  addSharedOptions(
    recommend
      .command('decision')
      .description('Write an accepted/rejected recommendation decision receipt'),
  )
    .requiredOption('--input <path>', 'Recommendation artifact path')
    .requiredOption('--recommendation-id <id>', 'Recommendation id from the artifact')
    .requiredOption('--decision <decision>', 'Decision: accepted or rejected')
    .option('--decided-by <name>', 'Approver or operator who made the decision')
    .option(
      '--approval-ref <ref>',
      'Approval ticket, review, or change reference for strict decisions',
    )
    .option('--reason <text>', 'Decision rationale; required for rejected recommendations')
    .option('--out <path>', 'Decision receipt output path')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingRecommendDecision);
    });

  const alerts = marketing.command('alerts').description('Marketing alert history commands');
  addSharedOptions(
    alerts.command('acknowledge').description('Write a non-mutating alert acknowledgement receipt'),
  )
    .requiredOption('--input <path>', 'Recommendation artifact path containing the alert')
    .requiredOption('--alert-id <id>', 'Alert id from the recommendation artifact')
    .requiredOption('--acknowledged-by <name>', 'Operator who acknowledged the alert')
    .option('--reason <text>', 'Acknowledgement reason; required for high and critical alerts')
    .option('--out <path>', 'Acknowledgement receipt output path')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingAlertAcknowledge);
    });

  const experiments = marketing
    .command('experiments')
    .description('Marketing experiment history commands');
  addSharedOptions(
    experiments.command('decide').description('Write a non-mutating experiment decision receipt'),
  )
    .requiredOption('--input <path>', 'Recommendation artifact path containing the experiment')
    .requiredOption('--experiment-id <id>', 'Experiment id from the recommendation artifact')
    .requiredOption(
      '--decision <decision>',
      'Decision: ship, iterate, stop, rerun, or inconclusive',
    )
    .requiredOption('--result <result>', 'Result: won, lost, or inconclusive')
    .requiredOption('--decided-by <name>', 'Operator who decided the experiment')
    .requiredOption('--follow-up-action <text>', 'Follow-up action after the experiment decision')
    .requiredOption('--reason <text>', 'Decision rationale')
    .option('--out <path>', 'Experiment decision receipt output path')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingExperimentDecide);
    });

  const research = marketing
    .command('research')
    .description('Marketing research memory and planning context commands');
  addSharedOptions(
    research.command('status').description('Inspect structured research memory records'),
  )
    .option('--research-root <path>', 'Override research memory root directory')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingResearchStatus);
    });
}
