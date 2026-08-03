import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import { healthReview, type HealthReviewCliOptions } from './review.js';

export function registerHealthCommands(program: Command): void {
  const health = program.command('health').description('Growth evidence readiness commands');
  health
    .command('review')
    .description('Check whether current Growth evidence is trustworthy enough to guide work')
    .option('--cwd <path>', 'Platform app directory')
    .option('--environment <id>', 'Growth environment to review')
    .option('--max-age-days <days>', 'Freshness threshold for recorded evidence', '3')
    .option('--finding-limit <count>', 'Maximum readiness findings to return', '50')
    .option('--json', 'Emit the canonical machine-readable workflow result')
    .action(async (options: HealthReviewCliOptions) => {
      if (!options.json) log.banner('Unisane');
      const resolved = {
        ...options,
        cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
      };
      loadEnvLocal({ appDir: resolved.cwd });
      process.exitCode = await healthReview(resolved);
    });
}
