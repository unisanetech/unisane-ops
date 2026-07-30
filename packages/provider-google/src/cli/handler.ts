import { Command } from 'commander';
import {
  runCapturedPackCommand,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { registerGoogleCommands } from './register.js';
import { runWithGoogleProviderCommandContext } from './runtime.js';

export function runProviderGoogleCommand(context: PackCommandContext): Promise<PackCommandResult> {
  return runCapturedPackCommand(context, async () => {
    const program = new Command();
    program.name('unisane').exitOverride();
    program.configureOutput({
      writeOut: (value) => process.stdout.write(value),
      writeErr: (value) => process.stderr.write(value),
    });
    registerGoogleCommands(program);
    const args = ['google', ...context.argv];
    if (context.json) args.push('--json');
    if (!context.runtime) {
      throw new Error(
        '[GOOGLE_PROVIDER_RUNTIME_MISSING] Provider commands require the canonical host runtime.',
      );
    }
    await runWithGoogleProviderCommandContext({ cwd: context.cwd, runtime: context.runtime }, () =>
      program.parseAsync(['node', 'unisane', ...args]),
    );
  });
}
