import {
  isFrameworkCommandRoot,
  runFrameworkCommand as runDevtoolsFrameworkCommand,
  type FrameworkCommandExecution,
  type FrameworkCommandRequest,
} from '@unisane/devtools/framework-integration';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';

export type FrameworkCommandBridge = (
  request: FrameworkCommandRequest,
) => FrameworkCommandExecution;

function parseOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

export function executeFrameworkCommand(
  context: PackCommandContext,
  bridge: FrameworkCommandBridge,
): PackCommandResult {
  const selection = context.selection;
  if (!selection) {
    throw new Error(
      '[FRAMEWORK_OPS_SELECTION_MISSING] Framework commands require exact pack selection context.',
    );
  }
  const root = selection.command.path[0];
  if (!root || !isFrameworkCommandRoot(root)) {
    throw new Error(
      `[FRAMEWORK_OPS_COMMAND_UNSUPPORTED] Unsupported Framework command root '${root ?? ''}'.`,
    );
  }
  const execution = bridge({
    root,
    argv: context.json ? [...context.argv, '--json'] : context.argv,
    cwd: context.cwd,
    json: context.json ?? false,
  });
  const result: PackCommandResult = {
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
  return result;
}

export function runFrameworkCommand(context: PackCommandContext): PackCommandResult {
  return executeFrameworkCommand(context, runDevtoolsFrameworkCommand);
}
