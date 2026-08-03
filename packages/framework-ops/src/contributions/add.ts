import {
  runFrameworkCommand,
  type FrameworkCommandExecution,
} from '@unisane/devtools/framework-integration';
import {
  defineOpsLifecycleContributionResult,
  type OpsLifecycleContributionContext,
  type OpsLifecycleContributionResult,
} from '@unisane/ops-engine/lifecycle';

function parseOutput(execution: FrameworkCommandExecution): unknown {
  const output = execution.stdout.trim();
  if (!output) return null;
  try {
    return JSON.parse(output) as unknown;
  } catch {
    return output;
  }
}

export function addFrameworkItem(
  context: OpsLifecycleContributionContext,
): OpsLifecycleContributionResult {
  const execution = runFrameworkCommand({
    root: 'add',
    argv: context.json ? [...context.argv, '--json'] : context.argv,
    cwd: context.cwd,
    json: context.json,
    mode: 'captured',
  });
  return defineOpsLifecycleContributionResult({
    schemaVersion: 1,
    status: execution.exitCode === 0 ? 'ok' : 'failed',
    actualEffect: 'write',
    writeTargets: ['project'],
    result: {
      exitCode: execution.exitCode,
      output: parseOutput(execution),
    },
    diagnostics: execution.stderr.trim() ? [execution.stderr.trim()] : [],
    artifacts: [],
    nextActions: [],
  });
}
