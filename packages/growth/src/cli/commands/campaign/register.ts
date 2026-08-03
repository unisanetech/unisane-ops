import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import {
  campaignPauseApply,
  campaignPauseApprove,
  campaignPausePlan,
  campaignPauseShow,
  campaignPauseVerify,
  type CampaignPauseCliOptions,
} from './pause.js';

function shared(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--environment <id>', 'Growth environment')
    .option('--json', 'Emit the canonical machine-readable result');
}

async function execute(
  options: CampaignPauseCliOptions,
  handler: (value: CampaignPauseCliOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) log.banner('Unisane');
  const resolved = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolved.cwd });
  process.exitCode = await handler(resolved);
}

export function registerCampaignCommands(program: Command): void {
  const campaign = program.command('campaign').description('Controlled campaign operations');
  const pause = campaign.command('pause').description('Plan and operate one exact campaign pause');

  shared(pause.command('plan').description('Create a non-mutating exact campaign pause plan'))
    .requiredOption('--provider <provider>', 'Provider: googleAds or metaAds')
    .requiredOption('--account-id <id>', 'Exact provider account id')
    .requiredOption('--campaign-id <id>', 'Exact campaign id')
    .requiredOption('--evidence-revision <revision>', 'Current campaign evidence revision')
    .option('--verification-delay-ms <ms>', 'Delay before read-only verification', '30000')
    .option('--verification-ttl-ms <ms>', 'Verification window duration', '300000')
    .option('--plan-ttl-ms <ms>', 'Plan validity duration', '600000')
    .action((options: CampaignPauseCliOptions) => execute(options, campaignPausePlan));

  shared(pause.command('show').description('Show the current canonical run review'))
    .requiredOption('--run-id <id>', 'Campaign pause run id')
    .action((options: CampaignPauseCliOptions) => execute(options, campaignPauseShow));

  shared(pause.command('approve').description('Approve one exact plan hash'))
    .requiredOption('--run-id <id>', 'Campaign pause run id')
    .requiredOption('--plan-hash <hash>', 'Exact plan hash shown by plan or show')
    .requiredOption('--approved-by <actor>', 'Operator identity recorded with approval')
    .option('--approval-ttl-ms <ms>', 'Approval validity duration', '600000')
    .action((options: CampaignPauseCliOptions) => execute(options, campaignPauseApprove));

  shared(pause.command('apply').description('Apply an approved pause to one exact target'))
    .requiredOption('--run-id <id>', 'Campaign pause run id')
    .requiredOption('--evidence-revision <revision>', 'Current campaign evidence revision')
    .requiredOption(
      '--confirm-target <provider:account:campaign>',
      'Exact provider, account, and campaign confirmation',
    )
    .action((options: CampaignPauseCliOptions) => execute(options, campaignPauseApply));

  shared(pause.command('verify').description('Read provider state within the verification window'))
    .requiredOption('--run-id <id>', 'Campaign pause run id')
    .action((options: CampaignPauseCliOptions) => execute(options, campaignPauseVerify));
}
