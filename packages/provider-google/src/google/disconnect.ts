import {
  defineOpsLifecycleContributionResult,
  type OpsLifecycleContributionContext,
  type OpsLifecycleContributionResult,
} from '@unisane/ops-engine/lifecycle';
import { removeGoogleConnectionKeychainSecret } from './connection-keychain.js';
import { readGoogleConnectionRecord, removeGoogleConnectionRecord } from './connection-store.js';

export async function disconnectGoogle(request: {
  context: OpsLifecycleContributionContext;
  projectId: string;
  environmentId: string;
  connectionId: string;
  recordPath: string;
}): Promise<OpsLifecycleContributionResult> {
  const connection = readGoogleConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
  });
  if (!connection) {
    return defineOpsLifecycleContributionResult({
      schemaVersion: 1,
      status: 'ok',
      actualEffect: 'offline',
      writeTargets: [],
      result: {
        provider: 'google',
        connectionId: request.connectionId,
        disconnected: false,
        recordMissing: true,
      },
      diagnostics: [],
      artifacts: [],
      nextActions: ['The local Google connection record was already absent.'],
    });
  }
  if (
    connection.connectionId !== request.connectionId ||
    connection.projectId !== request.projectId ||
    connection.environmentId !== request.environmentId
  ) {
    throw new Error(
      '[GOOGLE_DISCONNECT_CONTEXT_MISMATCH] The selected Google connection does not belong to this project and environment.',
    );
  }
  if (connection.oauth) {
    for (const field of ['refresh-token', 'client-secret', 'ads-developer-token'] as const) {
      removeGoogleConnectionKeychainSecret({
        connectionId: connection.connectionId,
        field,
      });
    }
  }
  const disconnected = removeGoogleConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
  });
  return defineOpsLifecycleContributionResult({
    schemaVersion: 1,
    status: 'ok',
    actualEffect: 'write',
    writeTargets: connection.oauth ? ['project', 'secret-store'] : ['project'],
    result: {
      provider: 'google',
      connectionId: connection.connectionId,
      disconnected,
      historicalDataRetained: true,
      providerResourcesChanged: false,
    },
    diagnostics: [],
    artifacts: [],
    nextActions: [
      'Existing local reporting history remains available. Provider-side tags, properties, and campaigns were not changed.',
    ],
  });
}
