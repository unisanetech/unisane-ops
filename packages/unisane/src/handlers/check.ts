import { buildGrowthConfigReadiness } from '@unisane/growth/contracts';
import {
  aggregateOpsReadiness,
  defineOpsReadinessFinding,
  opsReadinessFindingSchema,
  type OpsReadinessFinding,
} from '@unisane/ops-engine/readiness';
import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { oneOption, parseArguments } from './arguments.js';
import { commandResult } from './result.js';

function connectionEnvironments(
  findings: readonly OpsReadinessFinding[],
  connectionId: string,
): string[] {
  return [
    ...new Set(
      findings
        .filter((finding) => finding.connectionId === connectionId)
        .map((finding) => finding.environmentId)
        .filter((environment): environment is string => Boolean(environment)),
    ),
  ];
}

function connectionFailure(args: {
  projectId: string;
  connectionId: string;
  provider: string;
  environmentId?: string;
  state: 'missing' | 'failed';
  observedAt: string;
  summary: string;
}): OpsReadinessFinding {
  return defineOpsReadinessFinding({
    schemaVersion: 1,
    code: `${args.provider}.connection.record.${args.state}`,
    dimension: 'connection',
    state: args.state,
    severity: 'error',
    projectId: args.projectId,
    ...(args.environmentId ? { environmentId: args.environmentId } : {}),
    connectionId: args.connectionId,
    summary: args.summary,
    blocking: true,
    observedAt: args.observedAt,
    evidence: [
      {
        kind: 'connection-record',
        source: args.connectionId,
        observedAt: args.observedAt,
        freshness: 'unknown',
        summary: 'The provider connection record could not be verified.',
      },
    ],
    nextAction: {
      id: `${args.provider}.connection.reconnect`,
      label: `Reconnect ${args.provider}`,
      description: 'Create and verify the provider-owned connection record.',
      command: {
        path: ['connect', args.provider],
        args: [
          '--connection',
          args.connectionId,
          ...(args.environmentId ? ['--environment', args.environmentId] : []),
        ],
        json: false,
        maximumEffect: 'write',
      },
      requiresConfirmation: true,
      requiresApproval: false,
    },
  });
}

export async function runCheck(context: PackCommandContext): Promise<PackCommandResult> {
  const parsed = parseArguments(context.argv, {
    flags: [],
    options: ['--environment'],
  });
  if (parsed.positionals.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] check: ${parsed.positionals.join(' ')}`);
  }
  const requestedEnvironment = oneOption(parsed, '--environment');
  const loaded = await loadUnisaneOpsConfig(context.cwd);
  if (requestedEnvironment && !loaded.config.environments[requestedEnvironment]) {
    throw new Error(
      `[UNISANE_OPS_ENVIRONMENT_UNKNOWN] Unknown environment '${requestedEnvironment}'.`,
    );
  }
  const observedAt = new Date().toISOString();
  let findings: OpsReadinessFinding[] = [
    defineOpsReadinessFinding({
      schemaVersion: 1,
      code: 'ops.project.config.ready',
      dimension: 'project',
      state: 'ready',
      severity: 'info',
      projectId: loaded.config.project.id,
      ...(requestedEnvironment ? { environmentId: requestedEnvironment } : {}),
      summary: 'Canonical Unisane Ops project intent is valid.',
      blocking: false,
      observedAt,
      evidence: [
        {
          kind: 'project-config',
          source: loaded.configPath,
          observedAt,
          freshness: 'fresh',
          summary: 'The one root Ops configuration parsed successfully.',
        },
      ],
    }),
  ];

  const growth = loaded.config.capabilities.growth;
  if (growth) {
    findings.push(
      ...buildGrowthConfigReadiness({
        projectId: loaded.config.project.id,
        config: growth,
        observedAt,
      }),
    );
  } else {
    findings.push(
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: 'growth.project.not-selected',
        dimension: 'project',
        state: 'not-selected',
        severity: 'info',
        projectId: loaded.config.project.id,
        ...(requestedEnvironment ? { environmentId: requestedEnvironment } : {}),
        summary: 'Growth is not selected for this project.',
        blocking: false,
        observedAt,
        evidence: [
          {
            kind: 'project-config',
            source: loaded.configPath,
            observedAt,
            freshness: 'fresh',
            summary: 'No Growth capability intent is present.',
          },
        ],
      }),
    );
  }

  if (requestedEnvironment) {
    findings = findings.filter(
      (finding) => !finding.environmentId || finding.environmentId === requestedEnvironment,
    );
  }

  if (!context.runtime) {
    throw new Error('[UNISANE_CHECK_RUNTIME_MISSING] Check requires the canonical runtime.');
  }
  for (const [connectionId, connection] of Object.entries(loaded.config.connections)) {
    if (!('recordPath' in connection)) continue;
    const environments = connectionEnvironments(findings, connectionId);
    try {
      const contribution = await context.runtime.resolveBinding('ops.lifecycle.readiness', {
        provider: connection.provider,
        projectRoot: loaded.projectRoot,
        recordPath: connection.recordPath,
      });
      if (contribution === null) {
        findings.push(
          connectionFailure({
            projectId: loaded.config.project.id,
            connectionId,
            provider: connection.provider,
            environmentId: environments[0],
            state: 'missing',
            observedAt,
            summary: `The ${connection.provider} connection record is missing.`,
          }),
        );
      } else {
        findings.push(...opsReadinessFindingSchema.array().parse(contribution));
      }
    } catch (error) {
      findings.push(
        connectionFailure({
          projectId: loaded.config.project.id,
          connectionId,
          provider: connection.provider,
          environmentId: environments[0],
          state: 'failed',
          observedAt,
          summary:
            error instanceof Error
              ? error.message
              : `The ${connection.provider} connection could not be checked.`,
        }),
      );
    }
  }

  const aggregate = aggregateOpsReadiness(findings);
  return commandResult(context, {
    actualEffect: 'offline',
    status:
      aggregate.status === 'ready'
        ? 'ok'
        : aggregate.status === 'blocked'
          ? 'blocked'
          : 'attention',
    result: {
      projectId: loaded.config.project.id,
      environmentId: requestedEnvironment ?? null,
      aggregate,
      findings,
    },
    nextActions: findings
      .map((finding) => finding.nextAction)
      .filter((action) => action !== undefined)
      .map((action) =>
        action.command
          ? `Run \`unisane ${[...action.command.path, ...action.command.args].join(' ')}\`.`
          : `Update \`${action.file}\`.`,
      ),
  });
}
