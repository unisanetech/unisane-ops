import { Command } from 'commander';
import {
  runCapturedPackCommand,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { registerGoogleCommands } from './register.js';

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
    await program.parseAsync(['node', 'unisane', ...args]);
  });
}
