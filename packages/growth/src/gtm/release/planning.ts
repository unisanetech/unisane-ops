import { createOpsMutationPlan, hashOpsValue, type OpsActionContext } from '@unisane/ops-engine';
import {
  evaluateGoogleTagManagerPolicies,
  assertGoogleTagManagerPublishPolicy,
} from '../policies.js';
import {
  gtmReleaseReviewSchema,
  type GtmReleaseParameters,
  type GtmReleaseEvidence,
  type GtmReleaseReview,
} from './contracts.js';
export const GTM_RELEASE_ACTION = 'growth.gtm.release';
export function gtmContainerIdentity(parameters: GtmReleaseParameters) {
  return `accounts/${parameters.manifest.accountId}/containers/${parameters.manifest.containerId}`;
}
export function createGtmReleasePlan(
  parameters: GtmReleaseParameters,
  evidence: GtmReleaseEvidence,
  context: OpsActionContext,
  generatedAt: string,
  expiresAt: string,
  planId = `plan.${context.requestId}`,
) {
  if (
    !parameters.manifest.environments[context.environmentId] ||
    !evaluateGoogleTagManagerPolicies({
      manifest: parameters.manifest,
      environment: context.environmentId,
    }).ok
  )
    throw new Error('[GTM_POLICY_BLOCKED] Manifest policy does not permit this release.');
  if (
    parameters.kind === 'publish' &&
    (!evidence.fingerprint || evidence.versionId !== parameters.versionId)
  )
    throw new Error('[GTM_VERSION_IDENTITY_REQUIRED] Exact version evidence is required.');
  if (parameters.kind === 'publish')
    assertGoogleTagManagerPublishPolicy(parameters.manifest, context.environmentId);
  const container = gtmContainerIdentity(parameters);
  const targetIdentity =
    parameters.kind === 'version'
      ? `${container}/workspaces/${parameters.workspaceId}`
      : `${container}/versions/${parameters.versionId}`;
  const effects =
    parameters.kind === 'version'
      ? [
          `Create version named ${parameters.name} from ${targetIdentity}.`,
          'Google removes the source workspace and updates the base version.',
          'Does not publish or prove tracking delivery.',
        ]
      : [
          `Publish ${targetIdentity} with fingerprint ${evidence.fingerprint}.`,
          'Changes the live container; destination event delivery remains unverified.',
        ];
  const plan = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId,
    provider: 'google-gtm',
    projectId: context.projectId,
    environment: context.environmentId,
    targetIdentity,
    commandVersion: `${GTM_RELEASE_ACTION}@1`,
    configHash: hashOpsValue(parameters),
    inventoryHash: hashOpsValue(evidence),
    generatedAt,
    expiresAt,
    actions: [
      {
        id: 'gtm.release',
        type: parameters.kind === 'version' ? 'create' : 'update',
        risk: 'high',
        resourceIdentity: targetIdentity,
        inputHash: hashOpsValue({ parameters, evidence, effects }),
      },
    ],
  });
  return gtmReleaseReviewSchema.parse({
    schemaVersion: 1,
    parameters,
    evidence,
    plan,
    effects,
    trackingVerified: false,
  });
}
export function assertGtmReleaseReview(review: GtmReleaseReview, context: OpsActionContext) {
  const expected = createGtmReleasePlan(
    review.parameters,
    review.evidence,
    context,
    review.plan.generatedAt,
    review.plan.expiresAt,
    review.plan.planId,
  );
  if (hashOpsValue(expected) !== hashOpsValue(review))
    throw new Error('[GTM_REVIEW_CHANGED] Exact release plan or context changed.');
}
