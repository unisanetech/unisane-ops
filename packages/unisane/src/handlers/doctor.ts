import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { oneOption, parseArguments } from './arguments.js';
import { commandResult } from './result.js';

export interface DoctorContributionResult {
  id: string;
  owner: string;
  status: 'ok' | 'failed';
  actualEffect: PackCommandResult['actualEffect'];
  report: unknown;
  diagnostics: string[];
  presentation?: {
    stdout: string;
    stderr: string;
  };
}

export type DoctorContributor = (
  context: PackCommandContext,
) => DoctorContributionResult | Promise<DoctorContributionResult>;

function doctorHelp(): string {
  return `Unisane doctor

Run aggregate diagnostics selected for this project.

Usage:
  unisane doctor [--cwd <path>] [--json]
`;
}

export async function runDoctor(
  context: PackCommandContext,
  contributors: readonly DoctorContributor[] = [],
): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: ['--help'],
    options: ['--cwd'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] doctor: ${parsed.positionals.join(' ')}`);
  }
  const cwd = oneOption(parsed, '--cwd') ?? context.cwd;
  if (parsed.flags.has('--help')) {
    return commandResult(context, {
      actualEffect: 'offline',
      status: 'ok',
      result: { help: doctorHelp() },
      ...(context.json ? {} : { presentation: { stdout: doctorHelp(), stderr: '' } }),
    });
  }

  const selectedContext: PackCommandContext = { ...context, argv: [], cwd };
  const results = await Promise.all(
    contributors.map((contributor) => contributor(selectedContext)),
  );
  const components = [
    ...results,
    ...(results.some((result) => result.id === 'framework')
      ? []
      : [
          {
            id: 'framework',
            owner: '@unisane/devtools',
            status: 'not-selected' as const,
            actualEffect: 'offline' as const,
            report: null,
            diagnostics: [],
          },
        ]),
  ];
  const failed = results.some((result) => result.status === 'failed');
  const diagnostics = results.flatMap((result) => result.diagnostics);
  const stdout = results.map((result) => result.presentation?.stdout ?? '').join('');
  const stderr = results.map((result) => result.presentation?.stderr ?? '').join('');
  const actualEffect = results.some((result) => result.actualEffect === 'read-network')
    ? 'read-network'
    : 'offline';

  return commandResult(context, {
    actualEffect,
    status: failed ? 'failed' : 'ok',
    result: {
      cwd,
      components: components.map((component) => {
        if ('presentation' in component) {
          const serializable = { ...component };
          delete serializable.presentation;
          return serializable;
        }
        return component;
      }),
    },
    diagnostics,
    ...(context.json ? {} : { presentation: { stdout, stderr } }),
  });
}
