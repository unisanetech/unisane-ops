import { hashOpsValue } from '@unisane/ops-engine';
import {
  assertGoogleTagManagerVersionIdentity,
  googleTagManagerVersionContentDigest,
} from '@unisane/growth/gtm';
import {
  googleTagManagerContainerPath,
  googleTagManagerContainerVersionPath,
  type GoogleTagManagerApiClient,
} from './api-client';
import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerCreateVersionOptions,
  GoogleTagManagerCreateVersionReceipt,
  GoogleTagManagerJsonObject,
  GoogleTagManagerPreviewReceipt,
  GoogleTagManagerPublishOptions,
  GoogleTagManagerPublishReceipt,
  GoogleTagManagerWorkspace,
  GoogleTagManagerWorkspaceVersionOptions,
} from '@unisane/growth/contracts';

function isRecord(value: unknown): value is GoogleTagManagerJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(
  value: GoogleTagManagerJsonObject | undefined,
  key: string,
): string | undefined {
  const field = value?.[key];
  return typeof field === 'string' && field.length > 0 ? field : undefined;
}

function booleanField(value: GoogleTagManagerJsonObject | undefined, key: string): boolean {
  const field = value?.[key];
  return typeof field === 'boolean' ? field : false;
}

function workspaceIdFromWorkspace(workspace: GoogleTagManagerWorkspace): string | undefined {
  if (workspace.workspaceId) return workspace.workspaceId;
  const match = workspace.path?.match(/\/workspaces\/([^/]+)$/);
  return match?.[1];
}

function workspacePathFromWorkspace(args: {
  workspace: GoogleTagManagerWorkspace;
  manifest: GoogleTagManagerContainerManifest;
}): string {
  if (args.workspace.path) {
    const prefix = `${googleTagManagerContainerPath(args.manifest.accountId, args.manifest.containerId)}/workspaces/`;
    if (
      !args.workspace.path.startsWith(prefix) ||
      !/^[a-zA-Z0-9_-]+$/.test(args.workspace.path.slice(prefix.length))
    )
      throw new Error(
        '[GTM_WORKSPACE_TARGET_MISMATCH] Provider workspace belongs to another container.',
      );
    return args.workspace.path;
  }
  const workspaceId = workspaceIdFromWorkspace(args.workspace);
  if (!workspaceId) {
    throw new Error(
      '[GTM_WORKSPACE_PATH_MISSING] GTM workspace did not include path or workspaceId.',
    );
  }
  return `${googleTagManagerContainerPath(args.manifest.accountId, args.manifest.containerId)}/workspaces/${workspaceId}`;
}

function arrayField(
  value: GoogleTagManagerJsonObject | undefined,
  key: string,
): readonly unknown[] {
  const field = value?.[key];
  return Array.isArray(field) ? field : [];
}

function hasMergeConflicts(value: GoogleTagManagerJsonObject | undefined): boolean {
  return arrayField(value, 'mergeConflict').length > 0;
}

function containerVersion(
  response: GoogleTagManagerJsonObject,
): GoogleTagManagerJsonObject | undefined {
  const value = response.containerVersion;
  return isRecord(value) ? value : undefined;
}

function versionPathFromVersion(args: {
  accountId: string;
  containerId: string;
  versionId: string;
  version?: GoogleTagManagerJsonObject;
}): string {
  return (
    stringField(args.version, 'path') ??
    googleTagManagerContainerVersionPath({
      accountId: args.accountId,
      containerId: args.containerId,
      versionId: args.versionId,
    })
  );
}

function versionIdFromVersion(version: GoogleTagManagerJsonObject | undefined): string | undefined {
  return stringField(version, 'containerVersionId') ?? stringField(version, 'versionId');
}

function assertNoCompilerError(args: {
  response: GoogleTagManagerJsonObject;
  stage: 'preview' | 'create-version' | 'publish';
}): void {
  if (!booleanField(args.response, 'compilerError')) return;
  throw new Error(`[GTM_COMPILER_ERROR] GTM ${args.stage} reported compiler errors.`);
}

function assertNoSyncConflict(args: {
  response: GoogleTagManagerJsonObject;
  stage: 'preview' | 'create-version';
}): void {
  const syncStatus = args.response.syncStatus;
  if (!isRecord(syncStatus)) return;
  if (syncStatus.syncError === true)
    throw new Error('[GTM_WORKSPACE_SYNC_ERROR] Workspace synchronization failed.');
  if (!hasMergeConflicts(syncStatus)) return;
  throw new Error(`[GTM_WORKSPACE_CONFLICT] GTM ${args.stage} reported workspace merge conflicts.`);
}

async function resolveWorkspace(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerWorkspaceVersionOptions;
}): Promise<GoogleTagManagerWorkspace> {
  const environment = args.options.manifest.environments[args.options.environment];
  if (!environment) {
    throw new Error(
      `[GTM_ENVIRONMENT_UNKNOWN] Environment '${args.options.environment}' is not declared in the GTM manifest.`,
    );
  }
  return args.client.resolveWorkspace({
    accountId: args.options.manifest.accountId,
    containerId: args.options.manifest.containerId,
    workspaceId: args.options.workspaceId,
    workspaceName: args.options.workspaceName,
    workspaceNamePrefix: environment.workspacePrefix,
  });
}

export async function previewGoogleTagManagerWorkspace(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerWorkspaceVersionOptions;
}): Promise<GoogleTagManagerPreviewReceipt> {
  const workspace = await resolveWorkspace(args);
  const workspacePath = workspacePathFromWorkspace({
    workspace,
    manifest: args.options.manifest,
  });
  const response = await args.client.quickPreviewWorkspace(workspacePath);
  assertNoSyncConflict({ response, stage: 'preview' });
  assertNoCompilerError({ response, stage: 'preview' });
  const version = containerVersion(response);
  if (!version)
    throw new Error('[GTM_VERSION_MISSING] Provider omitted compiled container version.');
  assertGoogleTagManagerVersionIdentity(
    version,
    args.options.manifest.accountId,
    args.options.manifest.containerId,
  );
  return {
    appId: args.options.manifest.appId,
    environment: args.options.environment,
    accountId: args.options.manifest.accountId,
    containerId: args.options.manifest.containerId,
    containerPath: googleTagManagerContainerPath(
      args.options.manifest.accountId,
      args.options.manifest.containerId,
    ),
    workspacePath,
    previewedAt: new Date().toISOString(),
    contentDigest: googleTagManagerVersionContentDigest(version),
    compilerError: booleanField(response, 'compilerError'),
    syncStatus: isRecord(response.syncStatus) ? response.syncStatus : undefined,
    containerVersion: version,
    raw: response,
  };
}

export async function createGoogleTagManagerContainerVersion(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerCreateVersionOptions;
}): Promise<GoogleTagManagerCreateVersionReceipt> {
  const workspace = await resolveWorkspace(args);
  const workspacePath = workspacePathFromWorkspace({
    workspace,
    manifest: args.options.manifest,
  });
  if (!args.options.expectedPreviewDigest)
    throw new Error('[GTM_PREVIEW_REQUIRED] Version creation requires reviewed preview content.');
  const preview = await previewGoogleTagManagerWorkspace({
    client: args.client,
    options: { ...args.options, workspaceId: workspaceIdFromWorkspace(workspace) },
  });
  if (preview.contentDigest !== args.options.expectedPreviewDigest)
    throw new Error(
      '[GTM_PREVIEW_DRIFT] Workspace content changed after preview. Review a new preview before versioning.',
    );
  await args.options.beforeWrite?.();
  const response = await args.client.createContainerVersion({
    workspacePath,
    name: args.options.name,
    notes: args.options.notes,
  });
  assertNoSyncConflict({ response, stage: 'create-version' });
  assertNoCompilerError({ response, stage: 'create-version' });
  const version = containerVersion(response);
  const versionId = versionIdFromVersion(version);
  if (!version || !versionId)
    throw new Error(
      '[GTM_VERSION_OUTCOME_UNCERTAIN] Version creation returned no identity. Inspect container versions before retrying.',
    );
  assertGoogleTagManagerVersionIdentity(
    version,
    args.options.manifest.accountId,
    args.options.manifest.containerId,
    versionId,
  );
  if (googleTagManagerVersionContentDigest(version) !== args.options.expectedPreviewDigest)
    throw new Error(
      '[GTM_VERSION_CONTENT_CHANGED] Created version differs from reviewed preview. Do not publish; inspect and review the created version.',
    );
  return {
    appId: args.options.manifest.appId,
    environment: args.options.environment,
    accountId: args.options.manifest.accountId,
    containerId: args.options.manifest.containerId,
    containerPath: googleTagManagerContainerPath(
      args.options.manifest.accountId,
      args.options.manifest.containerId,
    ),
    workspacePath,
    versionPath:
      versionId || stringField(version, 'path')
        ? versionPathFromVersion({
            accountId: args.options.manifest.accountId,
            containerId: args.options.manifest.containerId,
            versionId: versionId ?? '<unknown>',
            version,
          })
        : undefined,
    versionId,
    versionedAt: new Date().toISOString(),
    compilerError: booleanField(response, 'compilerError'),
    syncStatus: isRecord(response.syncStatus) ? response.syncStatus : undefined,
    containerVersion: version,
    newWorkspacePath: stringField(response, 'newWorkspacePath'),
    raw: response,
  };
}

export async function publishGoogleTagManagerContainerVersion(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerPublishOptions;
}): Promise<GoogleTagManagerPublishReceipt> {
  const accountId = args.options.manifest.accountId;
  const containerId = args.options.manifest.containerId;
  const previousLiveVersion = await args.client.getLiveVersion({ accountId, containerId });
  const targetVersion = await args.client.getContainerVersion({
    accountId,
    containerId,
    versionId: args.options.versionId,
  });
  assertGoogleTagManagerVersionIdentity(
    targetVersion,
    accountId,
    containerId,
    args.options.versionId,
  );
  if (args.options.fingerprint && targetVersion.fingerprint !== args.options.fingerprint)
    throw new Error('[GTM_VERSION_DRIFT] Version fingerprint changed after review.');
  if (typeof targetVersion.fingerprint !== 'string' || !targetVersion.fingerprint)
    throw new Error('[GTM_VERSION_FINGERPRINT_REQUIRED] Provider omitted version fingerprint.');
  if (
    args.options.expectedLiveRevision !== undefined &&
    (previousLiveVersion ? hashOpsValue(previousLiveVersion) : null) !==
      args.options.expectedLiveRevision
  )
    throw new Error('[GTM_LIVE_VERSION_DRIFT] Live version changed after review.');
  await args.options.beforeWrite?.();
  const response = await args.client.publishContainerVersion({
    accountId,
    containerId,
    versionId: args.options.versionId,
    fingerprint: args.options.fingerprint ?? targetVersion.fingerprint,
  });
  assertNoCompilerError({ response, stage: 'publish' });
  const version = containerVersion(response);
  if (!version)
    throw new Error(
      '[GTM_PUBLISH_OUTCOME_UNCERTAIN] Publish returned no version. Read the live version before retrying.',
    );
  assertGoogleTagManagerVersionIdentity(version, accountId, containerId, args.options.versionId);
  let observedLiveVersion: GoogleTagManagerJsonObject | null;
  try {
    observedLiveVersion = await args.client.getLiveVersion({ accountId, containerId });
  } catch {
    throw new Error(
      '[GTM_PUBLISH_OUTCOME_UNCERTAIN] Publish completed but live readback failed. Inspect live state before retrying.',
    );
  }
  if (!observedLiveVersion)
    throw new Error('[GTM_PUBLISH_NOT_VERIFIED] No live version was returned after publication.');
  assertGoogleTagManagerVersionIdentity(
    observedLiveVersion,
    accountId,
    containerId,
    args.options.versionId,
  );
  if (
    googleTagManagerVersionContentDigest(observedLiveVersion) !==
    googleTagManagerVersionContentDigest(targetVersion)
  )
    throw new Error(
      '[GTM_PUBLISH_CONTENT_MISMATCH] Live version content differs from the target read before publication. Inspect live state before any further write.',
    );
  return {
    appId: args.options.manifest.appId,
    environment: args.options.environment,
    accountId,
    containerId,
    containerPath: googleTagManagerContainerPath(accountId, containerId),
    versionPath: versionPathFromVersion({
      accountId,
      containerId,
      versionId: args.options.versionId,
      version: version ?? targetVersion,
    }),
    versionId: args.options.versionId,
    publishedAt: new Date().toISOString(),
    verification: 'verified',
    verifiedAt: new Date().toISOString(),
    observedLiveVersion,
    compilerError: booleanField(response, 'compilerError'),
    previousLiveVersion,
    targetVersion,
    containerVersion: version,
    raw: response,
  };
}
