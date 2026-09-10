import { hashOpsValue } from '@unisane/ops-engine';
import type { GoogleTagManagerProvider } from '../provider.js';
import { getGoogleTagManagerDesiredResources } from '../normalize.js';
import { planGoogleTagManagerChanges } from '../plan.js';
import { gtmSnapshotRevision, gtmWorkspacePath } from './planning.js';
import type { GtmWorkspaceActionDependencies } from './action.js';
export function createGtmWorkspaceProviderBridge(
  provider: GoogleTagManagerProvider,
): Pick<GtmWorkspaceActionDependencies, 'read' | 'apply'> {
  return {
    read: (parameters, context) =>
      provider.readSnapshot({
        manifest: parameters.manifest,
        environment: context.environmentId,
        workspaceId: parameters.workspaceId,
        desiredResources: getGoogleTagManagerDesiredResources(parameters.manifest),
      }),
    apply: (review, context, beforeWrite) =>
      provider.applyPlan({
        manifest: review.parameters.manifest,
        environment: context.environmentId,
        workspaceId: review.parameters.workspaceId,
        desiredResources: getGoogleTagManagerDesiredResources(review.parameters.manifest),
        syncBeforeApply: false,
        beforeWrite,
        plan(remote) {
          if (
            remote.workspacePath !== gtmWorkspacePath(review.parameters) ||
            gtmSnapshotRevision(remote) !== review.plan.inventoryHash
          )
            throw new Error('[GTM_REVIEW_DRIFT] Workspace changed before resource writes.');
          const current = planGoogleTagManagerChanges({
            manifest: review.parameters.manifest,
            remote,
          });
          if (hashOpsValue(current) !== hashOpsValue(review.changes))
            throw new Error(
              '[GTM_REVIEW_DRIFT] Proposed operations changed before resource writes.',
            );
          return {
            ...review.changes,
            operations: review.changes.operations.map((operation) => ({ ...operation })),
          };
        },
      }),
  };
}
