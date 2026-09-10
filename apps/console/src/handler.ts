import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  createGrowthConsoleCampaignPauseApprovalController,
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
      environment: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      out: { type: 'string' },
      'max-age-days': { type: 'string' },
      operator: { type: 'string' },
    },
  });
  const cwd = path.resolve(context.cwd, values.cwd ?? '.');
  const result = await runWithGrowthConsoleRuntime(context.runtime, cwd, async () => {
    const auth = await resolveGrowthConsoleAuthContext(values.environment);
    const approvalController = await createGrowthConsoleCampaignPauseApprovalController({
      cwd,
      environmentId: auth.environmentId,
      approvedBy: values.operator?.trim() || 'user.local-console',
    });
    return serveMarketingConsoleApp({
      cwd,
      environmentId: auth.environmentId,
      host: values.host,
      port: parsePositiveInteger(values.port, 4174, '--port'),
      outputDirectory: values.out,
      maxAgeDays: parsePositiveInteger(values['max-age-days'], 3, '--max-age-days'),
      googleAuth: auth.googleAuth,
      metaAuth: auth.metaAuth,
      reviewCapabilities: (target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.capabilities.review',
          input: {
            ...target,
            principal: { kind: 'user', id: 'user.local-console' },
          },
        }),
      collectReport: (report, target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.reports.collect',
          input: { ...target, principal: { kind: 'user', id: 'user.local-console' }, report },
        }),
      readReportHistory: (query, target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.reports.history',
          input: { ...target, principal: { kind: 'user', id: 'user.local-console' }, query },
        }),
      gtmRelease: (input, target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.gtm.release',
          input: { ...input, ...target, principal: { kind: 'user', id: 'user.local-console' } },
        }),
      gtmWorkspace: (input, target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.gtm.workspace',
          input: { ...input, ...target, principal: { kind: 'user', id: 'user.local-console' } },
        }),
      metaDiagnostics: {
        import: (observation, target) =>
          context.runtime!.resolveBinding('growth.provider.command', {
            cwd,
            operation: 'growth.meta.diagnostics.import',
            input: {
              ...target,
              principal: { kind: 'user', id: 'user.local-console' },
              observation,
            },
          }),
        review: (query, target) =>
          context.runtime!.resolveBinding('growth.provider.command', {
            cwd,
            operation: 'growth.meta.diagnostics.review',
            input: { ...target, principal: { kind: 'user', id: 'user.local-console' }, query },
          }),
      },
      readReport: (report, target) =>
        context.runtime!.resolveBinding('growth.provider.command', {
          cwd,
          operation: 'growth.reports.read',
          input: { ...target, principal: { kind: 'user', id: 'user.local-console' }, report },
        }),
      campaignPauseApprovalAvailable: Boolean(approvalController),
      approveCampaignPause: approvalController
        ? ({ runId, planHash }) => approvalController.approve({ runId, confirmPlanHash: planHash })
        : undefined,
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
