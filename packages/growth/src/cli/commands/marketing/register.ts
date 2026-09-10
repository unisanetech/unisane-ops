import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  marketingAlertAcknowledge,
  marketingAudit,
  marketingConversionPull,
  marketingEvidenceDiscardFixtures,
  marketingExperimentDecide,
  marketingHistoryBackfill,
  marketingPull,
  marketingPullApi,
  marketingRecommend,
  marketingRecommendDecision,
  marketingResearchStatus,
  marketingReport,
  marketingScheduleReporting,
  marketingStrategyPull,
  marketingValidate,
  type MarketingCliOptions,
} from './index.js';

function addSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--source-root <path...>', 'Override source roots for tracking audit')
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
  addSharedOptions(
    marketing.command('validate').description('Validate the platform marketing config'),
  ).action(async (options: MarketingCliOptions) => {
    await runMarketingCommand(options, marketingValidate);
  });

  addSharedOptions(
    marketing.command('audit').description('Audit marketing tracking and conversion source usage'),
  )
    .option(
      '--observations <path>',
      'Read-only browser/server event observation artifact (defaults to project Growth path)',
    )
    .action(async (options: MarketingCliOptions) => {
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
      .description('Ingest a strict server-confirmed canonical outcome v2 artifact'),
  )
    .requiredOption('--input <path>', 'Canonical outcome v2 JSON artifact')
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
    .option('--connection <id>', 'Canonical provider connection id')
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

  const evidence = marketing.command('evidence').description('Local provider evidence commands');
  addSharedOptions(
    evidence
      .command('discard-fixtures')
      .description('Preview or remove fixture-origin provider artifacts and rebuild history'),
  )
    .requiredOption('--provider <provider>', 'Provider: googleAds, metaAds, ga4, or searchConsole')
    .option('--yes', 'Apply the fixture-only cleanup after reviewing the preview')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingEvidenceDiscardFixtures);
    });

  const history = marketing.command('history').description('Local historical evidence commands');
  addSharedOptions(
    history
      .command('backfill')
      .description('Record bounded daily provider history through exact one-day report pulls'),
  )
    .requiredOption('--provider <provider>', 'Provider: googleAds, metaAds, ga4, or searchConsole')
    .requiredOption('--report <type>', 'Provider report family to record')
    .requiredOption('--start-date <date>', 'Backfill start date, YYYY-MM-DD')
    .requiredOption('--end-date <date>', 'Backfill end date, YYYY-MM-DD')
    .option('--after-date <date>', 'Resume after this completed date, YYYY-MM-DD')
    .option('--max-days <count>', 'Maximum daily windows in this batch', '90')
    .option(
      '--dry-run',
      'Preview daily windows without contacting the provider or writing evidence',
    )
    .option('--account-id <id>', 'Provider account/property/site identifier')
    .option('--time-zone <zone>', 'Report window time zone')
    .option('--api-version <version>', 'Provider API version override')
    .option('--connection <id>', 'Canonical provider connection id')
    .option('--max-pages <count>', 'Maximum API pages for each daily pull')
    .option('--page-size <count>', 'Provider page size or row limit where supported')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingHistoryBackfill);
    });

  const schedule = marketing
    .command('schedule')
    .description('Scheduled reporting automation planning');
  addSharedOptions(
    schedule
      .command('reporting')
      .description('Write evidence-gated scheduled provider reporting commands'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for proof evidence')
    .option('--window-days <days>', 'Rolling reporting window size for scheduled pulls', '3')
    .option('--cadence <cadence>', 'Reporting cadence: daily or weekly', 'daily')
    .option('--connection <id>', 'Canonical provider connection id')
    .option('--out <path>', 'Scheduled reporting plan output path')
    .action(async (options: MarketingCliOptions) => {
      await runMarketingCommand(options, marketingScheduleReporting);
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
