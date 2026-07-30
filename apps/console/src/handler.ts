import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  resolveGrowthConsoleAuthContext,
  runWithGrowthConsoleRuntime,
} from '@unisane/growth/console';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { serveMarketingConsoleApp } from './serve.js';

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[OPS_CONSOLE_OPTION_INVALID] ${name} must be a positive integer.`);
  }
  return parsed;
}

export async function runGrowthConsole(context: PackCommandContext): Promise<PackCommandResult> {
  const selection = context.selection;
  if (!selection || !context.runtime) {
    throw new Error(
      '[OPS_CONSOLE_RUNTIME_MISSING] The console requires exact pack selection and the canonical runtime.',
    );
  }
  const { values } = parseArgs({
    args: [...context.argv],
    strict: true,
    options: {
      cwd: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      out: { type: 'string' },
      'max-age-days': { type: 'string' },
    },
  });
  const cwd = path.resolve(context.cwd, values.cwd ?? '.');
  const result = await runWithGrowthConsoleRuntime(context.runtime, cwd, async () => {
    const auth = await resolveGrowthConsoleAuthContext();
    return serveMarketingConsoleApp({
      cwd,
      host: values.host,
      port: parsePositiveInteger(values.port, 4174, '--port'),
      outputDirectory: values.out,
      maxAgeDays: parsePositiveInteger(values['max-age-days'], 3, '--max-age-days'),
      googleAuth: auth.googleAuth,
      metaAuth: auth.metaAuth,
    });
  });

  return {
    schemaVersion: 1,
    command: selection.command.id,
    pack: selection.packId,
    maximumEffect: selection.command.maximumEffect,
    actualEffect: 'write',
    writeTargets: ['project'],
    riskGuards: [],
    status: 'ok',
    result: {
      url: result.url,
      outputDirectory: result.outputDirectory,
      readiness: result.readiness,
    },
    diagnostics: [],
    artifacts: [result.entryHtmlPath, result.statePath, ...result.assetPaths],
    nextActions: ['Press Ctrl+C to stop the local console.'],
    presentation: {
      stdout: [
        '# Unisane Growth Console',
        '',
        `URL: ${result.url}`,
        `Project: ${result.state.platformId}`,
        `Readiness: ${result.readiness.label}`,
        '',
        'Press Ctrl+C to stop.',
        '',
      ].join('\n'),
      stderr: '',
    },
  };
}
