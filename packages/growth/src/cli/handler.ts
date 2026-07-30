import { Command, CommanderError } from 'commander';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { runWithGrowthProviderRuntime } from './provider-runtime.js';
import { registerGrowthCommands } from './register.js';

interface CapturedExecution {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function parseOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

async function captureOutput(run: () => Promise<void>): Promise<CapturedExecution> {
  const stdoutWrite = process.stdout.write.bind(process.stdout);
  const stderrWrite = process.stderr.write.bind(process.stderr);
  const previousExitCode = process.exitCode;
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  process.exitCode = undefined;
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  try {
    await run();
    exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      exitCode = error.exitCode;
    } else {
      exitCode = 1;
      stderr += `${error instanceof Error ? error.message : String(error)}\n`;
    }
  } finally {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    process.exitCode = previousExitCode;
  }
  return { exitCode, stdout, stderr };
}

export async function runGrowthCommand(context: PackCommandContext): Promise<PackCommandResult> {
  const selection = context.selection;
  if (!selection) {
    throw new Error(
      '[GROWTH_COMMAND_SELECTION_MISSING] Growth commands require exact pack selection context.',
    );
  }
  const args = [...selection.command.path, ...context.argv];
  if (context.json) args.push('--json');

  const execution = await captureOutput(async () => {
    const program = new Command();
    program.name('unisane').exitOverride();
    program.configureOutput({
      writeOut: (value) => process.stdout.write(value),
      writeErr: (value) => process.stderr.write(value),
    });
    registerGrowthCommands(program);
    if (!context.runtime) {
      throw new Error(
        '[GROWTH_COMMAND_RUNTIME_MISSING] Growth commands require the canonical pack runtime.',
      );
    }
    await runWithGrowthProviderRuntime(context.runtime, context.cwd, () =>
      program.parseAsync(['node', 'unisane', ...args]),
    );
  });

  return {
    schemaVersion: 1,
    command: selection.command.id,
    pack: selection.packId,
    maximumEffect: selection.command.maximumEffect,
    actualEffect: selection.command.maximumEffect,
    writeTargets: selection.command.writeTargets,
    riskGuards: selection.command.riskGuards,
    status: execution.exitCode === 0 ? 'ok' : 'failed',
    result: {
      exitCode: execution.exitCode,
      output: parseOutput(execution.stdout),
    },
    diagnostics:
      context.json && execution.stderr.trim().length > 0 ? [execution.stderr.trim()] : [],
    artifacts: [],
    nextActions: [],
    ...(context.json
      ? {}
      : {
          presentation: {
            stdout: execution.stdout,
            stderr: execution.stderr,
          },
        }),
  };
}
