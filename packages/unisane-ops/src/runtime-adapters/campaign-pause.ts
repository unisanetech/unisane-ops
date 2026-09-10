import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashOpsValue, type OpsLockLease } from '@unisane/ops-engine';
import {
  campaignPauseHostRequestSchema,
  createGrowthCampaignPauseWorkflow,
  type GrowthCampaignPauseProviderAdapters,
} from '@unisane/growth';
import { listGrowthCampaignPauseRunReviewEntries } from '@unisane/growth/playbooks';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { openScopedExecutionStore } from './execution-store.js';
import { resolveMetaConnectionRecord, resolveSelectedMetaAdsAccount } from './meta-context.js';
import type { GrowthProviderOperationDependencies } from './growth.js';

export async function executeCampaignPauseWorkflow(
  cwd: string,
  raw: unknown,
  dependencies: GrowthProviderOperationDependencies & {
    google(
      operation: 'pause' | 'read',
      input: {
        environment: string;
        providerAccountId: string;
        campaignId: string;
        planHash?: string;
      },
      beforeWrite?: () => Promise<void>,
    ): Promise<unknown>;
  },
) {
  const request = campaignPauseHostRequestSchema.parse(raw);
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (
    !growth ||
    loaded.config.project.id !== request.projectId ||
    !growth.environments[request.environmentId]
  )
    throw new Error(
      '[CAMPAIGN_CONTEXT_MISMATCH] Campaign workflow must use this project and a selected environment.',
    );
  if (request.command.operation === 'approve' && request.principal.kind !== 'user')
    throw new Error('[CAMPAIGN_HUMAN_APPROVAL_REQUIRED] An agent cannot grant campaign approval.');
  const now = dependencies.now ?? (() => new Date());
  const backend = loaded.config.execution?.ads?.backend ?? 'local';
  if (request.command.operation === 'list') {
    const statePath = path.join(
      loaded.projectRoot,
      '.unisane',
      'ops',
      request.projectId,
      request.environmentId,
      'state',
    );
    const present = await lstat(statePath).then(
      () => true,
      (error) => {
        if (error.code === 'ENOENT') return false;
        throw error;
      },
    );
    if (!present) return [];
  }

  const store = await openScopedExecutionStore(loaded.projectRoot, backend, {
    segments: ['.unisane', 'ops', request.projectId, request.environmentId, 'state'],
    prefix: 'CAMPAIGN',
    legacyRunDirectory: 'mutation-runs',
  });
  const context = {
    requestId: `campaign.${randomUUID()}`,
    scopeId: `scope.${request.projectId}`,
    projectId: request.projectId,
    environmentId: request.environmentId,
    principal: request.principal,
    requestedAt: now().toISOString(),
  };
  let activeLease: OpsLockLease | undefined;
  const assertLease = async () => {
    if (!activeLease)
      throw new Error('[CAMPAIGN_LEASE_REQUIRED] Shared execution lease is required.');
    await store.state.locks.assertCurrent(activeLease, now().toISOString());
  };
  const assertGoogleTarget = (accountId: string) => {
    const selected = growth.environments[request.environmentId]!;
    const resources = selected.resources.filter(
      (resource) =>
        resource.provider === 'google' &&
        resource.connection === selected.connections.google &&
        resource.service === 'ads' &&
        resource.resourceType === 'customer',
    );
    if (
      resources.length !== 1 ||
      resources[0]!.resourceId.replaceAll('-', '') !== accountId.replaceAll('-', '')
    )
      throw new Error(
        '[CAMPAIGN_GOOGLE_TARGET_MISMATCH] Campaign account must match the selected Google customer.',
      );
  };
  const adapters: GrowthCampaignPauseProviderAdapters = {
    metaAds: {
      pauseCampaign: async (input) => {
        const result = await meta('pause', input);
        if (typeof result === 'string')
          throw new Error('[CAMPAIGN_RESULT_INVALID] Missing mutation result.');
        return result;
      },
      readCampaignStatus: async (input) => {
        const result = await meta('read', input);
        if (typeof result !== 'string')
          throw new Error('[CAMPAIGN_RESULT_INVALID] Missing status.');
        return result;
      },
    },
    googleAds: {
      pauseCampaign: async (input) => {
        assertGoogleTarget(input.providerAccountId);
        await assertLease();
        const result = await dependencies.google(
          'pause',
          {
            ...input,
            environment: request.environmentId,
          },
          assertLease,
        );
        const value = result as { outcome?: unknown; providerOperationId?: string };
        if (!['succeeded', 'rejected', 'outcome-unknown'].includes(String(value?.outcome)))
          throw new Error('[CAMPAIGN_RESULT_INVALID] Missing Google outcome.');
        return {
          outcome: value.outcome as 'succeeded' | 'rejected' | 'outcome-unknown',
          providerOperationId: value.providerOperationId,
        };
      },
      readCampaignStatus: async (input) => {
        assertGoogleTarget(input.providerAccountId);
        const value = await dependencies.google('read', {
          ...input,
          environment: request.environmentId,
        });
        if (value !== 'paused' && value !== 'active' && value !== 'unknown')
          throw new Error('[CAMPAIGN_RESULT_INVALID] Missing Google status.');
        return value;
      },
    },
  };
  async function meta(
    operation: 'read' | 'pause',
    input: { providerAccountId: string; campaignId: string },
  ) {
    const { connection, environment, provider } = await resolveMetaConnectionRecord(cwd, {
      environment: request.environmentId,
    });
    const accountId = resolveSelectedMetaAdsAccount({
      connection,
      environment,
      requestedAccountId: input.providerAccountId,
    });
    if (!dependencies.metaCredentialResolver)
      throw new Error(
        '[META_CREDENTIAL_RESOLVER_UNAVAILABLE] Host credential callback is unavailable.',
      );
    return provider.controlMetaCampaignWithHostCredential({
      connection,
      resolver: dependencies.metaCredentialResolver,
      accountId,
      campaignId: input.campaignId,
      operation,
      fetch: dependencies.fetch ?? fetch,
      beforeWrite: assertLease,
    });
  }
  try {
    const command = request.command;
    // Read/review/approval do not require a durable mutation worker.
    const mutating = command.operation === 'apply';
    const workflow = createGrowthCampaignPauseWorkflow({
      ...store,
      providerAdapters: adapters,
      actor: mutating && request.principal.kind !== 'user' ? 'automation' : 'developer',
      production:
        mutating && Boolean(loaded.config.environments[request.environmentId]?.production),
      multiProcess: mutating && backend === 'sqlite',
      mutationPolicy: growth.policy.mutation,
      lockOwner: `campaign.${randomUUID()}`,
      now,
      beforeProviderMutation: (lease) => {
        activeLease = lease;
      },
    });
    if (command.operation === 'list')
      return await listGrowthCampaignPauseRunReviewEntries({
        store: store.runStore,
        projectId: request.projectId,
        environmentId: request.environmentId,
        limit: 50,
        now: now().toISOString(),
      });
    if (command.operation === 'plan') {
      const p = command.parameters;
      const status = await adapters[p.provider].readCampaignStatus(p);
      if (status === 'unknown')
        throw new Error(
          '[CAMPAIGN_EVIDENCE_UNAVAILABLE] Readable campaign state is required before planning.',
        );
      const revision = hashOpsValue({
        provider: p.provider,
        accountId: p.providerAccountId,
        campaignId: p.campaignId,
        status,
      });
      return await workflow.plan({
        context,
        parameters: { ...p, evidenceRevision: revision },
        currentEvidenceRevision: revision,
        planTtlMs: command.planTtlMs,
      });
    }
    const stored = await store.runStore.get(command.runId);
    if (
      !stored ||
      stored.projectId !== request.projectId ||
      stored.environmentId !== request.environmentId ||
      stored.actionId !== 'growth.ads.campaign.pause'
    )
      throw new Error(
        '[CAMPAIGN_RUN_CONTEXT_MISMATCH] Run not found in the selected project/environment.',
      );
    if (command.operation === 'show') return await workflow.show(command.runId);
    if (command.operation === 'approve') return await workflow.approve(command);
    if (command.operation === 'verify')
      return await workflow.verify({ runId: command.runId, principal: request.principal });
    const review = await workflow.show(command.runId);
    if (!review) throw new Error('[CAMPAIGN_RUN_MISSING] Campaign run is unavailable.');
    const p = review.review.target;
    if (p.provider === 'metaAds') {
      const bound = await resolveMetaConnectionRecord(cwd, { environment: request.environmentId });
      bound.provider.assertMetaCampaignMutationGrant(bound.connection);
    }
    const status = await adapters[p.provider].readCampaignStatus(p);
    if (status === 'unknown')
      throw new Error(
        '[CAMPAIGN_EVIDENCE_UNAVAILABLE] Readable campaign state is required before apply.',
      );
    return await workflow.apply({
      ...command,
      principal: request.principal,
      currentEvidenceRevision: hashOpsValue({
        provider: p.provider,
        accountId: p.providerAccountId,
        campaignId: p.campaignId,
        status,
      }),
    });
  } finally {
    store.close();
  }
}
