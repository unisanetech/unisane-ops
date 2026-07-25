import { Command } from 'commander';
import {
  runCapturedPackCommand,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import { registerAwsCommands } from './register.js';

export function runProviderAwsCommand(context: PackCommandContext): Promise<PackCommandResult> {
  return runCapturedPackCommand(context, async () => {
    const program = new Command();
    program.name('unisane').exitOverride();
    program.configureOutput({
      writeOut: (value) => process.stdout.write(value),
      writeErr: (value) => process.stderr.write(value),
    });
    registerAwsCommands(program);
    const args = ['aws', ...context.argv];
    if (context.json) args.push('--json');
    await program.parseAsync(['node', 'unisane', ...args]);
  });
}
