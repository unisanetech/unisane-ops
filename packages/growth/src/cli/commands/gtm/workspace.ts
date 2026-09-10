import type { Command } from 'commander';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';
export function registerGtmWorkspaceCommands(parent: Command) {
  const workspace = parent
    .command('workspace')
    .description('Shared exact-plan workspace execution and recovery');
  for (const operation of ['plan', 'review', 'approve', 'apply', 'recover'] as const) {
    const command = workspace
      .command(operation)
      .option('--environment <id>')
      .option('--json', 'Structured result');
    if (operation === 'plan')
      command.requiredOption('--connection <id>').requiredOption('--workspace-id <id>');
    else if (operation === 'recover') command.requiredOption('--run-id <id>');
    else command.requiredOption('--plan-hash <hash>');
    if (operation === 'approve')
      command
        .requiredOption('--confirm <hash>', 'Exact displayed plan hash')
        .option('--yes', 'Confirm human approval of this exact plan');
    command.action(async (options) => {
      if (operation === 'approve' && !options.yes)
        throw new Error(
          '[GTM_APPROVAL_CONFIRMATION_REQUIRED] Review the exact plan and pass --yes with its confirmation hash.',
        );
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const result = await executeGrowthProviderCommand('growth.gtm.workspace', {
        operation,
        projectId: context.projectId,
        environmentId,
        principal: { kind: 'user', id: 'user.local-cli' },
        ...(operation === 'plan'
          ? { connectionId: options.connection, workspaceId: options.workspaceId }
          : operation === 'recover'
            ? { runId: options.runId }
            : {
                planHash: options.planHash,
                ...(operation === 'approve' ? { confirmPlanHash: options.confirm } : {}),
              }),
      });
      console.log(JSON.stringify(result, null, 2));
    });
  }
}

export function registerGtmReleaseCommands(parent: Command) {
  const release = parent
    .command('release')
    .description('Preview, review, version, publish and recover exact GTM changes');
  for (const operation of [
    'preview',
    'plan-version',
    'plan-publish',
    'review',
    'approve',
    'apply',
    'recover',
  ] as const) {
    const command = release.command(operation).option('--environment <id>').option('--json');
    if (['preview', 'plan-version', 'plan-publish'].includes(operation))
      command.requiredOption('--connection <id>');
    if (operation === 'preview' || operation === 'plan-version')
      command.requiredOption('--workspace-id <id>');
    if (operation === 'plan-version') command.requiredOption('--name <name>');
    if (operation === 'plan-publish') command.requiredOption('--version-id <id>');
    if (['review', 'approve', 'apply'].includes(operation))
      command.requiredOption('--plan-hash <hash>');
    if (operation === 'approve') command.requiredOption('--confirm <hash>').option('--yes');
    if (operation === 'recover') command.requiredOption('--run-id <id>');
    command.action(async (options) => {
      if (operation === 'approve' && !options.yes)
        throw new Error(
          '[GTM_APPROVAL_CONFIRMATION_REQUIRED] Review the exact plan and confirm with --yes.',
        );
      const context = await loadGrowthProjectContext();
      const input = {
        operation,
        ...Object.fromEntries(
          Object.entries({
            connectionId: options.connection,
            workspaceId: options.workspaceId,
            name: options.name,
            versionId: options.versionId,
            planHash: options.planHash,
            confirmPlanHash: options.confirm,
            runId: options.runId,
          }).filter(([, value]) => value !== undefined),
        ),
      };
      console.log(
        JSON.stringify(
          await executeGrowthProviderCommand('growth.gtm.release', {
            ...input,
            projectId: context.projectId,
            environmentId: selectGrowthEnvironment(context, options.environment),
            principal: { kind: 'user', id: 'user.local-cli' },
          }),
          null,
          2,
        ),
      );
    });
  }
}
