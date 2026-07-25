import type { Command } from 'commander';
import { log } from '../../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../../utils/control-plane-working-directory.js';
import { loadEnvLocal } from '../../../utils/env.js';

export type SharedSeoCliOptions = {
  cwd?: string;
  json?: boolean;
};

export function addSharedSeoOptions(command: Command): Command {
  return command
    .option('--cwd <path>', 'Platform app directory')
    .option('--platform <id>', 'Platform id for research artifacts')
    .option('--json', 'Emit machine-readable JSON output');
}

export async function runSeoCommand<TOptions extends SharedSeoCliOptions>(
  options: TOptions,
  handler: (options: TOptions) => Promise<number>,
): Promise<void> {
  if (!options.json) {
    log.banner('Unisane');
  }
  const resolvedOptions = {
    ...options,
    cwd: options.cwd ? resolveControlPlaneWorkingDirectory(options.cwd) : options.cwd,
  };
  loadEnvLocal({ appDir: resolvedOptions.cwd });
  const code = await handler(resolvedOptions);
  process.exitCode = code;
}
