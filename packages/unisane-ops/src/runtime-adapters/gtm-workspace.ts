import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { hashOpsValue, opsPrincipalSchema, OpsActionExecutionError } from '@unisane/ops-engine';
import { openGtmExecutionStore } from './gtm-execution-store.js';
import {
  gtmWorkspaceCommandSchema,
  gtmReleaseCommandSchema,
  createGtmReleaseWorkflow,
  createGtmReleaseProviderBridge,
  createGtmWorkspaceWorkflow,
  createGtmWorkspaceProviderBridge,
  loadGoogleTagManagerManifestFile,
} from '@unisane/growth/gtm';
import {
  readGoogleConnectionRecord,
  resolveGoogleConnectionCredentials,
} from '@unisane/provider-google';
import { createGoogleTagManagerProvider } from '@unisane/provider-google/gtm';
import { loadUnisaneOpsConfig } from '../config/loader.js';
async function executeOperation(cwd: string, raw: unknown, release = false) {
  const outer = z
    .object({ projectId: z.string(), environmentId: z.string(), principal: opsPrincipalSchema })
    .passthrough()
    .parse(raw);
  const { projectId, environmentId, principal, ...parameters } = outer;
  const input = {
    ...(release ? gtmReleaseCommandSchema : gtmWorkspaceCommandSchema).parse(parameters),
    projectId,
    environmentId,
    principal,
  };
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (
    loaded.config.project.id !== input.projectId ||
    !growth ||
    !growth.environments[input.environmentId]
  )
    throw new Error('[GTM_PROJECT_TARGET_MISMATCH] Select the configured project and environment.');
  const current = ['plan', 'apply', 'preview', 'plan-version', 'plan-publish'].includes(
    input.operation,
  )
    ? await loadGoogleTagManagerManifestFile(loaded.projectRoot, growth.runtime.manifest ?? '')
    : undefined;
  const storage = await openGtmExecutionStore(
    loaded.projectRoot,
    loaded.config.execution?.gtm?.backend ?? 'local',
  );
  const { state, runStore } = storage;
  try {
    const providerFor = async (
      connectionId: string,
      containerId: string,
      requiredScope: string,
    ) => {
      const reference = loaded.config.connections[connectionId];
      if (!reference || reference.provider !== 'google' || !('recordPath' in reference))
        throw new Error('[GTM_CONNECTION_REQUIRED] Select a canonical Google connection.');
      const record = readGoogleConnectionRecord({
        projectRoot: loaded.projectRoot,
        recordPath: reference.recordPath,
      });
      if (
        !record ||
        record.projectId !== input.projectId ||
        record.environmentId !== input.environmentId ||
        record.connectionId !== connectionId
      )
        throw new Error(
          '[GTM_CONNECTION_TARGET_MISMATCH] Google connection belongs to another target.',
        );
      const selected = record.resources.filter(
        (resource) =>
          resource.service === 'tag-manager' &&
          resource.resourceType === 'container' &&
          resource.state === 'selected',
      );
      const configured = growth.environments[input.environmentId]!.resources.filter(
        (resource) =>
          resource.provider === 'google' &&
          resource.connection === connectionId &&
          resource.service === 'tag-manager' &&
          resource.resourceType === 'container',
      );
      if (
        selected.length !== 1 ||
        selected[0]!.resourceId !== containerId ||
        configured.length !== 1 ||
        configured[0]!.resourceId !== containerId
      )
        throw new Error(
          '[GTM_CONTAINER_SELECTION_MISMATCH] Select this exact container in the environment and connection.',
        );
      return createGoogleTagManagerProvider({
        accessToken: async () => {
          const credentials = await resolveGoogleConnectionCredentials({
            connection: record,
            service: 'tag-manager',
            requiredScope,
          });
          return credentials.accessToken;
        },
      });
    };
    const common = {
      state,
      runStore,
      lockOwner: `gtm.${randomUUID()}`,
      actor: input.principal.kind === 'user' ? 'developer' : 'automation',
      production: loaded.config.environments[input.environmentId]?.production ?? true,
      multiProcess: loaded.config.execution?.gtm?.backend === 'sqlite',
      mutationPolicy: growth.policy.mutation,
      context: {
        requestId: `gtm.${randomUUID()}`,
        scopeId: `scope.${input.projectId}`,
        projectId: input.projectId,
        environmentId: input.environmentId,
        principal: input.principal,
        requestedAt: new Date().toISOString(),
      },
    } as const;
    if (release) {
      const command = gtmReleaseCommandSchema.parse(parameters);
      const bridgeFor = async (
        p: { connectionId: string; manifest: { containerId: string } },
        scope: string,
      ) =>
        createGtmReleaseProviderBridge(
          await providerFor(p.connectionId, p.manifest.containerId, scope),
          input.environmentId,
        );
      const workflow = createGtmReleaseWorkflow({
        ...common,
        inspect: async (p) =>
          (
            await bridgeFor(
              p,
              p.kind === 'version' ? 'tagmanager.edit.containerversions' : 'tagmanager.readonly',
            )
          ).inspect(p),
        execute: async (review, beforeWrite) => {
          if (hashOpsValue(current?.manifest) !== hashOpsValue(review.parameters.manifest))
            throw new Error('[GTM_MANIFEST_DRIFT] Canonical manifest changed.');
          return (
            await bridgeFor(
              review.parameters,
              review.parameters.kind === 'version'
                ? 'tagmanager.edit.containerversions'
                : 'tagmanager.publish',
            )
          ).execute(review, beforeWrite);
        },
        observe: async (review, versionId) =>
          (await bridgeFor(review.parameters, 'tagmanager.readonly')).observe(review, versionId),
      });
      switch (command.operation) {
        case 'preview':
          return {
            projectId: input.projectId,
            environmentId: input.environmentId,
            trackingVerified: false,
            evidence: await (
              await bridgeFor(
                { connectionId: command.connectionId, manifest: current!.manifest },
                'tagmanager.edit.containerversions',
              )
            ).inspect({
              kind: 'version',
              connectionId: command.connectionId,
              workspaceId: command.workspaceId,
              name: 'preview',
              manifest: current!.manifest,
            }),
          };
        case 'plan-version':
          return await workflow.plan({
            kind: 'version',
            connectionId: command.connectionId,
            workspaceId: command.workspaceId,
            name: command.name,
            manifest: current!.manifest,
          });
        case 'plan-publish':
          return await workflow.plan({
            kind: 'publish',
            connectionId: command.connectionId,
            versionId: command.versionId,
            manifest: current!.manifest,
          });
        case 'review':
          return await workflow.review(command.planHash);
        case 'approve':
          return await workflow.approve(command.planHash, command.confirmPlanHash);
        case 'apply':
          return await workflow.apply(command.planHash);
        case 'recover':
          return await workflow.recover(command.runId);
      }
    }
    const workspaceInput = gtmWorkspaceCommandSchema.parse(parameters);
    const bridgeFor = async (connectionId: string, containerId: string, scope: string) =>
      createGtmWorkspaceProviderBridge(await providerFor(connectionId, containerId, scope));
    const workflow = createGtmWorkspaceWorkflow({
      ...common,
      read: async (parameters, context) =>
        (
          await bridgeFor(
            parameters.connectionId,
            parameters.manifest.containerId,
            'tagmanager.readonly',
          )
        ).read(parameters, context),
      apply: async (review, context, beforeWrite) => {
        if (hashOpsValue(current?.manifest) !== hashOpsValue(review.parameters.manifest))
          throw new Error('[GTM_MANIFEST_DRIFT] Canonical desired state changed after review.');
        return (
          await bridgeFor(
            review.parameters.connectionId,
            review.parameters.manifest.containerId,
            'tagmanager.edit.containers',
          )
        ).apply(review, context, beforeWrite);
      },
    });
    switch (workspaceInput.operation) {
      case 'plan':
        return await workflow.plan({
          connectionId: workspaceInput.connectionId,
          workspaceId: workspaceInput.workspaceId,
          manifest: current!.manifest,
        });
      case 'review':
        return await workflow.review(workspaceInput.planHash);
      case 'approve':
        return await workflow.approve(workspaceInput.planHash, workspaceInput.confirmPlanHash);
      case 'apply':
        return await workflow.apply(workspaceInput.planHash);
      case 'recover':
        return await workflow.recover(workspaceInput.runId);
    }
  } finally {
    storage.close();
  }
}

export async function executeGtmWorkspaceOperation(cwd: string, raw: unknown, release = false) {
  try {
    return await executeOperation(cwd, raw, release);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const code = message.match(/^\[([A-Z0-9_]+)\]/)?.[1];
    const reasons: Record<string, string> = {
      OPS_STATE_DURABILITY_REQUIRED:
        'Production and agent workspace writes require durable host state; this local host does not provide it.',
      OPS_RUN_STORE_DURABILITY_REQUIRED:
        'Production and agent workspace writes require durable host run storage; this local host does not provide it.',
      GTM_STATE_MIGRATION_REQUIRED:
        'Existing local execution records require reviewed migration before switching to SQLite. Preserve the records and keep the current backend.',
      GTM_STATE_BACKEND_MISMATCH:
        'SQLite execution state exists. Keep SQLite configured so recorded attempts cannot be bypassed.',
      GTM_SQLITE_RUNTIME_REQUIRED: 'SQLite execution requires Node.js 22.13 or newer.',
      GTM_APPROVAL_REQUIRED:
        'Review and approve the exact workspace plan through a human interface before applying.',
      GTM_WORKSPACE_UNRECONCILED:
        'Recover the earlier workspace attempt before applying another plan.',
      GTM_ATTEMPT_EXISTS:
        'This plan already has a started attempt. Recover its outcome; do not replay it.',
      OPS_RECEIPT_REPLAY:
        'This plan already has an execution receipt. Recover the recorded outcome.',
      GTM_REVIEW_DRIFT: 'Workspace evidence changed after review. Prepare and approve a new plan.',
      GTM_CONTAINER_SELECTION_MISMATCH:
        'Select the exact container in both the Google connection and Growth environment.',
      GTM_MANIFEST_DRIFT: 'Canonical GTM desired state changed after review. Prepare a new plan.',
      GTM_WORKSPACE_LOCKED:
        'Another operation holds the workspace lease. Inspect its progress before continuing.',
      GTM_HUMAN_APPROVAL_REQUIRED: 'Only a human interface may approve an exact workspace plan.',
    };
    throw new OpsActionExecutionError(
      'growth.gtm.workspace.failed',
      reasons[code ?? ''] ??
        'Workspace operation failed. Check the project, environment, selected container, manifest, plan and host state.',
    );
  }
}
