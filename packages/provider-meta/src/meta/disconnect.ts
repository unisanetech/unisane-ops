import { disconnectMetaConnectionRecord } from './connection-lifecycle.js';
import { readMetaConnectionRecord } from './connection-store.js';
import {
  createMacOsMetaKeychainCredentialStore,
  type MetaLocalCredentialStore,
} from './local-credential-store.js';
import {
  defineMetaLifecycleContributionResult,
  type MetaLifecycleContributionContext,
  type MetaLifecycleContributionResult,
} from './connect.js';

export async function disconnectMeta(
  request: {
    context: MetaLifecycleContributionContext;
    scopeId: string;
    projectId: string;
    environmentId: string;
    connectionId: string;
    recordPath: string;
  },
  dependencies: { credentialStore?: MetaLocalCredentialStore } = {},
): Promise<MetaLifecycleContributionResult> {
  const connection = readMetaConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
  });
  if (!connection) {
    return defineMetaLifecycleContributionResult({
      schemaVersion: 1,
      status: 'ok',
      actualEffect: 'offline',
      writeTargets: [],
      result: {
        provider: 'meta',
        connectionId: request.connectionId,
        disconnected: false,
        recordMissing: true,
        historicalDataRetained: true,
        providerResourcesChanged: false,
      },
      diagnostics: [],
      artifacts: [],
      nextActions: ['The local Meta connection record was already absent.'],
    });
  }
  if (
    connection.scopeId !== request.scopeId ||
    connection.projectId !== request.projectId ||
    connection.environmentId !== request.environmentId ||
    connection.connectionId !== request.connectionId
  ) {
    throw new Error(
      '[META_DISCONNECT_CONTEXT_MISMATCH] The selected Meta connection does not belong to this scope, project, and environment.',
    );
  }
  const store = dependencies.credentialStore ?? createMacOsMetaKeychainCredentialStore();
  const credentialRemoved = store.remove({
    reference: {
      credentialId: connection.credential.secretReference,
      version: connection.credential.version,
    },
    context: {
      scopeId: connection.scopeId,
      projectId: connection.projectId,
      environmentId: connection.environmentId,
      connectionId: connection.connectionId,
      provider: 'meta',
      secretKind: 'meta-graph-access',
    },
  });
  const result = disconnectMetaConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
    scopeId: request.scopeId,
    projectId: request.projectId,
    environmentId: request.environmentId,
    connectionId: request.connectionId,
  });
  return defineMetaLifecycleContributionResult({
    schemaVersion: 1,
    status: 'ok',
    actualEffect: 'write',
    writeTargets: ['project', 'secret-store'],
    result: {
      provider: 'meta',
      connectionId: connection.connectionId,
      disconnected: result.disconnected,
      credentialRemoved,
      historicalDataRetained: true,
      providerResourcesChanged: false,
    },
    diagnostics: [],
    artifacts: [],
    nextActions: [
      'Historical Ops measurement evidence remains available. Provider-side Pixels, datasets, Pages, accounts, and campaigns were not changed.',
    ],
  });
}
