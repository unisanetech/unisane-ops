import type {
  GoogleTagManagerProvider,
  GoogleTagManagerReadRequest,
} from '@unisane/growth/contracts';
import {
  createGoogleTagManagerApiClient,
  type GoogleTagManagerApiClientOptions,
} from './api-client.js';
import { applyGoogleTagManagerPlan } from './apply.js';
import { readGoogleTagManagerRemoteSnapshot } from './remote-snapshot.js';
import {
  createGoogleTagManagerContainerVersion,
  previewGoogleTagManagerWorkspace,
  publishGoogleTagManagerContainerVersion,
  rollbackGoogleTagManagerContainerVersion,
} from './versioning.js';

export function createGoogleTagManagerProvider(
  options: GoogleTagManagerApiClientOptions,
): GoogleTagManagerProvider {
  const client = createGoogleTagManagerApiClient(options);
  return {
    readSnapshot: (request: GoogleTagManagerReadRequest) =>
      readGoogleTagManagerRemoteSnapshot({ client, options: request }),
    applyPlan: (request) => applyGoogleTagManagerPlan({ client, options: request }),
    preview: (request) => previewGoogleTagManagerWorkspace({ client, options: request }),
    createVersion: (request) =>
      createGoogleTagManagerContainerVersion({ client, options: request }),
    publish: (request) => publishGoogleTagManagerContainerVersion({ client, options: request }),
    rollback: (request) => rollbackGoogleTagManagerContainerVersion({ client, options: request }),
  };
}
