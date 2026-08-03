import type { Command } from 'commander';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../utils/env.js';
import { measurementAudit, type MeasurementAuditCliOptions } from './audit.js';

export function registerMeasurementCommands(program: Command): void {
  const measurement = program
    .command('measurement')
    .description('Measurement trust and outcome reconciliation commands');
  measurement
    .command('audit')
    .description('Check canonical outcomes, tracking integrity, and provider attribution')
    .option('--cwd <path>', 'Platform app directory')
    .option('--start-date <date>', 'Audit period start date, YYYY-MM-DD')
    .option('--end-date <date>', 'Audit period end date, YYYY-MM-DD')
    .option('--max-age-days <days>', 'Freshness threshold for recorded evidence', '3')
    .option('--comparison-limit <count>', 'Maximum provider comparisons to return', '20')
    .option('--json', 'Emit the canonical machine-readable workflow result')
    .action(async (options: MeasurementAuditCliOptions) => {
      if (!options.json) log.banner('Unisane');
      const resolved = {
        ...options,
        cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
      };
      loadEnvLocal({ appDir: resolved.cwd });
      process.exitCode = await measurementAudit(resolved);
    });
}
