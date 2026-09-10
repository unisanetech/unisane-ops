import { gtmContainerLock } from '../container-guard.js';
import { createOpsMutationPlan, hashOpsValue } from '@unisane/ops-engine';
import type { OpsActionContext } from '@unisane/ops-engine/actions';
import type { GoogleTagManagerRemoteSnapshot } from '../contracts.js';
import { evaluateGoogleTagManagerPolicies } from '../policies.js';
import { planGoogleTagManagerChanges } from '../plan.js';
import {
  GTM_WORKSPACE_ACTION,
  gtmWorkspacePlanInputSchema,
  gtmWorkspaceReviewSchema,
  type GtmWorkspaceParameters,
  type GtmWorkspaceReview,
} from './contracts.js';

export function gtmWorkspacePath(parameters: GtmWorkspaceParameters) {
  return `accounts/${parameters.manifest.accountId}/containers/${parameters.manifest.containerId}/workspaces/${parameters.workspaceId}`;
}
export function gtmWorkspaceLock(parameters: GtmWorkspaceParameters) {
  return gtmContainerLock(parameters.manifest);
}
export function gtmSnapshotRevision(snapshot: GoogleTagManagerRemoteSnapshot) {
  return hashOpsValue({
    containerPath: snapshot.containerPath,
    workspacePath: snapshot.workspacePath,
    resources: [...snapshot.resources]
      .map((entry) => {
        const resource = { ...entry };
        delete resource.raw;
        return resource;
      })
      .sort((a, b) => `${a.kind}:${a.slug}`.localeCompare(`${b.kind}:${b.slug}`)),
  });
}
export function gtmWorkspacePlan(
  raw: unknown,
  context: OpsActionContext,
  planId = `plan.${context.requestId}`,
): GtmWorkspaceReview {
  const input = gtmWorkspacePlanInputSchema.parse(raw);
  const parameters = {
    connectionId: input.connectionId,
    workspaceId: input.workspaceId,
    manifest: input.manifest,
  };
  if (
    !input.manifest.environments[context.environmentId] ||
    !evaluateGoogleTagManagerPolicies({
      manifest: input.manifest,
      environment: context.environmentId,
    }).ok
  )
    throw new Error('[GTM_POLICY_BLOCKED] Manifest policy does not permit this workspace plan.');
  if (input.snapshot.workspacePath !== gtmWorkspacePath(parameters))
    throw new Error('[GTM_WORKSPACE_TARGET_MISMATCH] Select the exact workspace being reviewed.');
  if (Date.parse(input.expiresAt) <= Date.parse(input.generatedAt))
    throw new Error('[GTM_PLAN_EXPIRY_INVALID] Plan expiry must follow creation.');
  const snapshot = {
    ...input.snapshot,
    resources: input.snapshot.resources.map((resource) => ({
      ...resource,
      payload: resource.payload,
    })),
  };
  const changes = planGoogleTagManagerChanges({ manifest: input.manifest, remote: snapshot });
  const plan = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId,
    provider: 'google-gtm',
    projectId: context.projectId,
    environment: context.environmentId,
    targetIdentity: gtmWorkspacePath(parameters),
    commandVersion: `${GTM_WORKSPACE_ACTION}@1`,
    configHash: hashOpsValue(parameters),
    inventoryHash: gtmSnapshotRevision(snapshot),
    generatedAt: input.generatedAt,
    expiresAt: input.expiresAt,
    actions: changes.operations.map((operation, index) => ({
      id: `gtm.operation.${index}`,
      type:
        operation.type === 'create_resource'
          ? 'create'
          : operation.type === 'retain_unmanaged_resource'
            ? 'no-op'
            : 'update',
      risk: 'medium',
      resourceIdentity: `${gtmWorkspacePath(parameters)}/${operation.kind}/${operation.slug}`,
      inputHash: hashOpsValue(operation),
    })),
  });
  return gtmWorkspaceReviewSchema.parse({
    schemaVersion: 1,
    parameters,
    plan,
    snapshot: input.snapshot,
    changes,
  });
}
export function assertGtmWorkspaceReview(review: GtmWorkspaceReview, context: OpsActionContext) {
  const expected = gtmWorkspacePlan(
    {
      ...review.parameters,
      snapshot: review.snapshot,
      generatedAt: review.plan.generatedAt,
      expiresAt: review.plan.expiresAt,
    },
    context,
    review.plan.planId,
  );
  if (hashOpsValue(expected) !== hashOpsValue(review))
    throw new Error(
      '[GTM_REVIEW_CHANGED] Workspace review does not match its exact plan and target.',
    );
}
