import {
  isFrameworkCommandRoot,
  runFrameworkCommand as runDevtoolsFrameworkCommand,
  type FrameworkCommandExecution,
  type FrameworkCommandRequest,
} from '@unisane/devtools/framework-integration';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';

export type FrameworkCommandBridge = (
  request: FrameworkCommandRequest,
) => FrameworkCommandExecution | Promise<FrameworkCommandExecution>;

const INTERACTIVE_COMMAND_ROOTS = new Set(['dev', 'start', 'watch']);

function parseOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

export async function executeFrameworkCommand(
  context: PackCommandContext,
  bridge: FrameworkCommandBridge,
): Promise<PackCommandResult> {
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
  const interactive = INTERACTIVE_COMMAND_ROOTS.has(root);
  if (interactive && context.json) {
    throw new Error(
      `[FRAMEWORK_OPS_INTERACTIVE_JSON_UNSUPPORTED] Framework command '${root}' owns an interactive terminal and does not support --json.`,
    );
  }
  const execution = await bridge({
    root,
    argv: context.json ? [...context.argv, '--json'] : context.argv,
    cwd: context.cwd,
    json: context.json ?? false,
    mode: interactive ? 'interactive' : 'captured',
  });
  const gracefullyStopped = interactive && [130, 143].includes(execution.exitCode);
  const result: PackCommandResult = {
    schemaVersion: 1,
    command: selection.command.id,
    pack: selection.packId,
    maximumEffect: selection.command.maximumEffect,
    actualEffect: selection.command.maximumEffect,
    writeTargets: selection.command.writeTargets,
    riskGuards: selection.command.riskGuards,
    status: execution.exitCode === 0 || gracefullyStopped ? 'ok' : 'failed',
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
            stdout: interactive ? '' : execution.stdout,
            stderr: interactive ? '' : execution.stderr,
          },
        }),
  };
  return result;
}

export function runFrameworkCommand(context: PackCommandContext): Promise<PackCommandResult> {
  return executeFrameworkCommand(context, runDevtoolsFrameworkCommand);
}
