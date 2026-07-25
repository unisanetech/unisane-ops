import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  adsApply,
  adsAssets,
  adsAudit,
  adsCompetitors,
  adsCreativeStatus,
  adsDiff,
  adsDoctor,
  adsGoalsGoogle,
  adsNegatives,
  adsOptimize,
  adsPlan,
  adsPull,
  adsReadiness,
  adsReport,
  adsSearchTerms,
  adsSetupGoogle,
  adsSetupGoogleTestClient,
  adsTrackingAudit,
  adsValidate,
  type AdsCliOptions,
} from './index.js';

function addSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--config <path>', 'Path to marketing config')
    .option('--json', 'Emit machine-readable JSON output');
}

async function runAdsCommand(
  options: AdsCliOptions,
  handler: (options: AdsCliOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) log.banner('Unisane');
  const resolvedOptions: AdsCliOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}

export function registerAdsCommands(program: Command): void {
  const ads = program
    .command('ads')
    .description('Paid acquisition planning, reporting, and guarded apply commands');

  addSharedOptions(ads.command('doctor').description('Inspect paid acquisition readiness'))
    .option('--report <type>', 'Provider report family to inspect')
    .option('--max-age-days <days>', 'Freshness threshold for latest ads provider pulls')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsDoctor);
    });

  addSharedOptions(
    ads.command('validate').description('Validate paid acquisition config and mappings'),
  )
    .option('--report <type>', 'Provider report family to inspect')
    .option('--max-age-days <days>', 'Freshness threshold for latest ads provider pulls')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsValidate);
    });

  addSharedOptions(
    ads.command('report').description('Inspect Google Ads and Meta Ads report freshness'),
  )
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--report <type>', 'Provider report family to inspect')
    .option('--max-age-days <days>', 'Freshness threshold for latest ads provider pulls')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsReport);
    });

  addSharedOptions(
    ads
      .command('readiness')
      .description('Build a product-specific Google Ads readiness and optimization plan'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for readiness inputs')
    .option('--out <path>', 'Readiness output path')
    .option('--dry-run', 'Preview readiness plan without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsReadiness);
    });

  addSharedOptions(
    ads.command('audit').description('Build the unified read-only ads operating-loop audit'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for cached ads evidence')
    .option('--plan <path>', 'Ads plan JSON path for creative status checks')
    .option('--source-root <path...>', 'Source roots for tracking audit')
    .option('--out <path>', 'Audit output path')
    .option('--dry-run', 'Preview audit without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsAudit);
    });

  addSharedOptions(
    ads
      .command('search-terms')
      .description(
        'Classify Google Ads search terms into negatives, keywords, pages, and insights',
      ),
  )
    .option('--max-age-days <days>', 'Freshness threshold for cached query report')
    .option('--out <path>', 'Search-term intelligence output path')
    .option('--dry-run', 'Preview search-term classifications without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsSearchTerms);
    });

  addSharedOptions(
    ads
      .command('negatives')
      .description('Validate negative keyword registry and search-term negative coverage'),
  )
    .option('--out <path>', 'Negative keyword report output path')
    .option('--dry-run', 'Preview negative keyword report without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsNegatives);
    });

  addSharedOptions(
    ads
      .command('competitors')
      .description('Monitor Auction Insights competitors and pressure signals'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for cached auction insight report')
    .option('--out <path>', 'Competitor monitor output path')
    .option('--dry-run', 'Preview competitor monitor without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsCompetitors);
    });

  const goals = ads.command('goals').description('Paid conversion goal setup helpers');
  addSharedOptions(
    goals
      .command('google')
      .description('Plan, validate, or create Google Ads conversion actions from the registry'),
  )
    .option('--auth-profile <name>', 'Saved marketing Google auth profile; defaults to the app id')
    .option('--account-id <id>', 'Google Ads customer id; defaults to config env')
    .option('--manager-customer-id <id>', 'Optional Google Ads manager/login customer id')
    .option('--api-version <version>', 'Google Ads API version override')
    .option('--out <path>', 'Goal plan or validation output path')
    .option('--dry-run', 'Send Google Ads validate-only conversion action mutations')
    .option('--yes', 'Create or update Google Ads conversion actions')
    .option('--account-confirm <value>', 'Required exact account confirmation for live setup')
    .option('--live-executor <mode>', 'Live executor mode: disabled or api', 'disabled')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsGoalsGoogle);
    });

  const setup = ads.command('setup').description('Paid provider account and API setup helpers');
  addSharedOptions(
    setup.command('google').description('Verify Google Ads API customer and token readiness'),
  )
    .option('--auth-profile <name>', 'Saved marketing Google auth profile; defaults to the app id')
    .option('--account-id <id>', 'Google Ads customer id to verify; defaults to config env')
    .option(
      '--manager-customer-id <id>',
      'Optional Google Ads manager/login customer id for hierarchy access',
    )
    .option('--api-version <version>', 'Google Ads API version override')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsSetupGoogle);
    });
  addSharedOptions(
    setup
      .command('google-test-client')
      .description('Create a Google Ads API test client under a manager account'),
  )
    .requiredOption('--manager-customer-id <id>', 'Google Ads manager customer id')
    .option('--auth-profile <name>', 'Saved marketing Google auth profile; defaults to the app id')
    .option('--name <name>', 'Google Ads client descriptive name')
    .option('--currency <code>', 'Client currency code', 'USD')
    .option('--time-zone <zone>', 'Client time zone', 'Asia/Kolkata')
    .option('--api-version <version>', 'Google Ads API version override')
    .option('--dry-run', 'Validate the create request without creating a client')
    .option('--yes', 'Create the client customer')
    .option('--update-env', 'Set the configured Google Ads customer env in .env.local')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsSetupGoogleTestClient);
    });

  const creative = ads
    .command('creative')
    .description('Paid creative review and provider inventory checks');
  addSharedOptions(
    creative.command('status').description('Inspect planned and provider creative readiness'),
  )
    .option('--plan <path>', 'Ads plan JSON path with reviewable creative assets')
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--max-age-days <days>', 'Freshness threshold for provider creative pulls')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsCreativeStatus);
    });

  addSharedOptions(
    ads.command('pull').description('Cache a read-only Google Ads or Meta Ads report'),
  )
    .requiredOption('--provider <provider>', 'Provider: googleAds or metaAds')
    .option('--input <path>', 'Provider report JSON export or normalized artifact')
    .option(
      '--input-format <format>',
      'Input format: normalized, google-ads, meta-ads, ga4, or search-console',
    )
    .option('--api', 'Pull through provider API instead of a local input artifact')
    .option('--source <source>', 'Report source: api, manual-export, or fixture')
    .option('--report <type>', 'Provider report family for isolated cache paths')
    .option('--account-id <id>', 'Provider account identifier for this pull')
    .option('--auth-profile <name>', 'Saved marketing Google auth profile; defaults to the app id')
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta auth profile; defaults to the app id',
    )
    .option('--start-date <date>', 'Report window start date, YYYY-MM-DD')
    .option('--end-date <date>', 'Report window end date, YYYY-MM-DD')
    .option('--time-zone <zone>', 'Report window time zone')
    .option('--api-version <version>', 'Provider API version override')
    .option('--max-pages <count>', 'Maximum API pages to pull')
    .option('--page-size <count>', 'Provider page size or row limit where supported')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsPull);
    });

  const assets = ads.command('assets').description('Paid media asset registry and upload planning');
  addSharedOptions(
    assets.command('import').description('Import a local media asset into the private asset store'),
  )
    .requiredOption('--file <path>', 'Local source asset path')
    .requiredOption('--asset-id <id>', 'Stable asset id')
    .requiredOption(
      '--type <type>',
      'Asset type: image, video, logo, html5, text, or landing_page_variant',
    )
    .requiredOption('--provider <provider>', 'Allowed provider, or comma-separated providers')
    .requiredOption('--owner <owner>', 'Owning team or strategy object')
    .option('--name <name>', 'Human-readable asset name')
    .option('--placement <value>', 'Comma-separated allowed placements')
    .option('--strategy-object-id <id>', 'Comma-separated strategy object ids')
    .option('--license <value>', 'License/source rights note')
    .option('--source-notes <value>', 'Non-secret source notes')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'import' }),
      );
    });
  addSharedOptions(
    assets.command('validate').description('Validate asset registry and private source files'),
  ).action(async (options: AdsCliOptions) => {
    await runAdsCommand(options, (runOptions) =>
      adsAssets({ ...runOptions, assetMode: 'validate' }),
    );
  });
  addSharedOptions(
    assets.command('approve').description('Mark an asset approved for upload planning'),
  )
    .requiredOption('--asset-id <id>', 'Stable asset id')
    .requiredOption('--approval-ref <ref>', 'Approval ticket or review reference')
    .option('--policy-notes <value>', 'Non-secret policy/review notes')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'approve' }),
      );
    });
  addSharedOptions(assets.command('archive').description('Archive an asset from upload planning'))
    .requiredOption('--asset-id <id>', 'Stable asset id')
    .option('--policy-notes <value>', 'Non-secret archive notes')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'archive' }),
      );
    });
  addSharedOptions(
    assets.command('report').description('Report asset registry status and next step'),
  ).action(async (options: AdsCliOptions) => {
    await runAdsCommand(options, (runOptions) => adsAssets({ ...runOptions, assetMode: 'report' }));
  });
  addSharedOptions(
    assets.command('upload-plan').description('Build a non-mutating provider asset upload plan'),
  )
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--asset-id <id>', 'Comma-separated asset ids to include')
    .option('--out <path>', 'Upload plan output path')
    .option('--dry-run', 'Preview upload plan without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'upload-plan' }),
      );
    });
  addSharedOptions(
    assets
      .command('creative-plan')
      .description('Build a non-mutating creative plan from uploaded provider asset refs'),
  )
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--asset-id <id>', 'Comma-separated asset ids to include')
    .option(
      '--placement <value>',
      'Comma-separated Meta placements: facebook_feed, instagram_feed, facebook_stories, instagram_stories, facebook_reels, instagram_reels',
    )
    .option('--out <path>', 'Creative plan output path')
    .option('--dry-run', 'Preview creative plan without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'creative-plan' }),
      );
    });
  addSharedOptions(
    assets.command('upload').description('Create an asset upload receipt or guarded live upload'),
  )
    .requiredOption('--plan <path>', 'Asset upload plan JSON path')
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--out <path>', 'Upload receipt output path')
    .option('--dry-run', 'Preview upload receipt without writing')
    .option('--yes', 'Allow guarded live upload when --receipt and confirmations are supplied')
    .option('--receipt <path>', 'Ready dry-run upload receipt path for live upload')
    .option('--approval-ref <ref>', 'Approval ticket/review reference for live upload')
    .option('--account-confirm <value>', 'Comma-separated provider account confirmation strings')
    .option('--production-confirm <value>', 'Required production confirmation string')
    .option(
      '--operation-confirm <value>',
      'Comma-separated exact live upload operation confirmation strings',
    )
    .option('--live-executor <mode>', 'Live executor mode: disabled or api', 'disabled')
    .option('--auth-profile <name>', 'Saved marketing Google token profile for live Google upload')
    .option('--meta-auth-profile <name>', 'Saved marketing Meta token profile for live Meta upload')
    .option('--api-version <version>', 'Provider API version override for live upload')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'upload' }),
      );
    });
  addSharedOptions(
    assets
      .command('link-google-campaign')
      .description('Link uploaded Google Ads image assets to a campaign'),
  )
    .requiredOption('--campaign-resource <resource>', 'Google Ads campaign resource name')
    .requiredOption('--asset-id <id>', 'Comma-separated uploaded asset ids to link')
    .option('--field-type <type>', 'Google Ads campaign asset field type', 'MARKETING_IMAGE')
    .option('--yes', 'Send the guarded Google Ads campaign asset link mutation')
    .option('--auth-profile <name>', 'Saved marketing Google token profile for Google Ads mutation')
    .option('--api-version <version>', 'Google Ads API version override')
    .option('--out <path>', 'Campaign asset link receipt output path')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, (runOptions) =>
        adsAssets({ ...runOptions, assetMode: 'link-google-campaign' }),
      );
    });

  addSharedOptions(
    ads.command('diff').description('Compare an ads plan against cached provider pulls'),
  )
    .requiredOption('--plan <path>', 'Ads plan JSON path')
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--max-age-days <days>', 'Freshness threshold for provider pulls')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsDiff);
    });

  addSharedOptions(
    ads.command('optimize').description('Generate read-only paid acquisition recommendations'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for optimization inputs')
    .option('--target-cpa <amount>', 'Target CPA threshold for CPA alerts')
    .option('--spend-spike-amount <amount>', 'Spend amount threshold for spend spike alerts')
    .option('--source-root <path...>', 'Override source roots for tracking audit')
    .option('--out <path>', 'Recommendation artifact output path')
    .option('--dry-run', 'Preview optimization recommendations without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsOptimize);
    });

  const tracking = ads.command('tracking').description('Paid acquisition tracking checks');
  addSharedOptions(
    tracking.command('audit').description('Audit paid tracking and conversion usage'),
  )
    .option('--source-root <path...>', 'Override source roots for tracking audit')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsTrackingAudit);
    });

  addSharedOptions(ads.command('plan').description('Build a read-only draft ads plan'))
    .option('--provider <provider>', 'Provider: googleAds, metaAds, or all', 'all')
    .option('--out <path>', 'Ads plan JSON output path')
    .option('--daily-budget <amount>', 'Reviewed proposed daily budget for the draft plan')
    .option('--currency <code>', 'Budget currency code', 'USD')
    .option('--seo-ads-plan <path>', 'Import SEO ads-plan output as Google Ads draft candidates')
    .option('--dry-run', 'Preview ads plan without writing')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsPlan);
    });

  addSharedOptions(ads.command('apply').description('Build a guarded ads apply dry-run preview'))
    .requiredOption('--plan <path>', 'Reviewed ads plan JSON path')
    .option('--out <path>', 'Apply dry-run preview JSON output path')
    .option('--dry-run', 'Required: preview guarded apply without provider mutation')
    .option('--yes', 'Allow guarded live apply when --receipt and confirmations are supplied')
    .option('--account-confirm <value>', 'Comma-separated provider account confirmation strings')
    .option('--production-confirm <value>', 'Required production confirmation string')
    .option('--receipt <path>', 'Ready dry-run apply receipt path for live apply')
    .option('--approval-ref <ref>', 'Approval ticket/review reference for live apply')
    .option(
      '--operation-confirm <value>',
      'Comma-separated exact live operation confirmation strings',
    )
    .option('--live-executor <mode>', 'Live executor mode: disabled or api', 'disabled')
    .option(
      '--auth-profile <name>',
      'Saved marketing Google auth profile for live Google Ads mutation',
    )
    .option(
      '--meta-auth-profile <name>',
      'Saved marketing Meta token profile for live Meta Ads mutation',
    )
    .option('--api-version <version>', 'Provider API version override for live executor')
    .action(async (options: AdsCliOptions) => {
      await runAdsCommand(options, adsApply);
    });
}
