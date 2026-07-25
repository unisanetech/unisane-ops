import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import { analyticsStatus, type AnalyticsCliOptions } from './index.js';

function addSharedOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--json', 'Emit machine-readable JSON output');
}

async function runAnalyticsCommand(
  options: AnalyticsCliOptions,
  handler: (options: AnalyticsCliOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) log.banner('Unisane');
  const resolvedOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}

export function registerAnalyticsCommands(program: Command): void {
  const analytics = program
    .command('analytics')
    .description(
      'Analytics freshness and reporting commands for GA4, Search Console, and confirmed conversion truth',
    );

  addSharedOptions(
    analytics.command('status').description('Show GA4, Search Console, and conversion freshness'),
  )
    .option('--max-age-days <days>', 'Freshness threshold for latest pulls')
    .action(async (options: AnalyticsCliOptions) => {
      await runAnalyticsCommand(options, analyticsStatus);
    });
}
