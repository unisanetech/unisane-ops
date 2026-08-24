import { serveLocalOpsMcpStdio } from '@unisane/ops-mcp/stdio';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { oneOption, parseArguments } from './arguments.js';
import { commandResult } from './result.js';
import { createLocalGrowthMcpRuntime } from '../mcp/local-growth-binding.js';
import { applyCodexMcpBinding, planCodexMcpBinding } from '../mcp/codex-binding.js';

type ServeLocalMcp = typeof serveLocalOpsMcpStdio;

export interface LocalMcpHandlerDependencies {
  serve: ServeLocalMcp;
}

const defaultDependencies: LocalMcpHandlerDependencies = {
  serve: serveLocalOpsMcpStdio,
};

function requiredOption(value: string | undefined, name: string): string {
  if (!value) throw new Error(`[OPS_CLI_ARGUMENT_REQUIRED] ${name} is required.`);
  return value;
}

function resultByteLimit(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error('[OPS_MCP_RESULT_LIMIT_INVALID] --maximum-result-bytes must be an integer.');
  }
  return parsed;
}

function installShutdown(handle: ReturnType<ServeLocalMcp>): void {
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    void handle.close().catch((error: unknown) => {
      process.stderr.write(
        `[UNISANE_OPS_MCP_SHUTDOWN_ERROR] ${error instanceof Error ? error.message : String(error)}\n`,
      );
    });
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  process.stdin.once('end', close);
}

export async function runMcpServe(
  context: PackCommandContext,
  dependencies: LocalMcpHandlerDependencies = defaultDependencies,
): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: [],
    options: ['--project', '--environment', '--actor', '--actor-name', '--maximum-result-bytes'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] Unknown argument '${parsed.positionals[0]}'.`);
  }
  const projectRoot = requiredOption(oneOption(parsed, '--project'), '--project');
  const environmentId = requiredOption(oneOption(parsed, '--environment'), '--environment');
  const actorId = requiredOption(oneOption(parsed, '--actor'), '--actor');
  const actorName = oneOption(parsed, '--actor-name');
  const maximumResultBytes = resultByteLimit(oneOption(parsed, '--maximum-result-bytes'));
  const runtime = await createLocalGrowthMcpRuntime({
    projectRoot,
    environmentId,
    principal: {
      kind: 'agent',
      id: actorId,
      ...(actorName ? { displayName: actorName } : {}),
    },
    ...(maximumResultBytes ? { maximumResultBytes } : {}),
  });
  const handle = dependencies.serve(runtime.binding, runtime.workflows, undefined, {
    onerror: (error: Error) => {
      process.stderr.write(`[UNISANE_OPS_MCP_TRANSPORT_ERROR] ${error.message}\n`);
    },
  });
  installShutdown(handle);
  const result = commandResult(context, {
    actualEffect: 'offline',
    status: 'ok',
    result: {
      transport: 'stdio',
      projectId: runtime.binding.projectId,
      environmentId: runtime.binding.environmentId,
      actorId: runtime.binding.principal.id,
    },
  });
  return {
    ...result,
    presentation: { stdout: '', stderr: '' },
  };
}

export async function runMcpConfigureCodex(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: ['--write', '--remove'],
    options: ['--project', '--environment', '--actor', '--actor-name'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] Unknown argument '${parsed.positionals[0]}'.`);
  }
  const projectRoot = requiredOption(oneOption(parsed, '--project'), '--project');
  const operation = parsed.flags.has('--remove') ? 'remove' : 'install';
  const plan = planCodexMcpBinding({
    projectRoot,
    operation,
    environmentId: oneOption(parsed, '--environment'),
    actorId: oneOption(parsed, '--actor'),
    actorName: oneOption(parsed, '--actor-name'),
  });
  const write = parsed.flags.has('--write');
  if (write) applyCodexMcpBinding(plan);
  return commandResult(context, {
    actualEffect: write && plan.changed ? 'write' : 'offline',
    writeTargets: write && plan.changed ? ['project'] : [],
    status: 'ok',
    result: {
      host: 'codex',
      operation,
      applied: write,
      changed: plan.changed,
      configPath: plan.configPath,
      serverName: plan.serverName,
      ...(plan.managedBlock ? { managedBlock: plan.managedBlock } : {}),
    },
    artifacts: write && plan.changed ? [plan.configPath] : [],
    nextActions:
      !write && plan.changed
        ? ['Review the managed block, then rerun the same command with --write.']
        : write
          ? [
              'Ensure Codex trusts this repository, restart Codex, then inspect the unisane_ops server with /mcp or codex mcp list.',
            ]
          : [],
  });
}
