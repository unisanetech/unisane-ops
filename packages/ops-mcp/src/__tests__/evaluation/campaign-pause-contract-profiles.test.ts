import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import {
  createGrowthCampaignPauseWorkflow,
  type GrowthConfig,
  type MarketingExecutionContext,
} from '@unisane/growth';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
  InMemoryOpsMutationRunStore,
} from '@unisane/ops-engine/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  LocalOpsMcpBinding,
  OpsMcpGrowthExecutors,
  OpsMcpGrowthWorkflows,
} from '../../contracts.js';
import { OPS_MCP_AGENT_CONTRACT_PROFILES } from '../../evaluation/index.js';
import { createLocalOpsMcpServer } from '../../server.js';

const projectId = 'acme';
const environmentId = 'development';
const principal = { kind: 'agent', id: 'codex.local', displayName: 'Codex' } as const;

const growthConfig: GrowthConfig = {
  schemaVersion: 1,
  adoptionMode: 'adopt-existing',
  capabilities: ['advertising'],
  environments: { development: { connections: {}, resources: [] } },
  manifests: {},
  runtime: { integration: 'existing' },
  policy: { mutation: 'approval-required', spend: 'approval-required' },
};

const provider: MarketingExecutionContext['providers']['googleAds'] = {
  state: 'selected',
  googleSearchDefaults: {
    targetGoogleSearch: true,
    targetSearchNetwork: false,
    targetContentNetwork: false,
    locationCriterionIds: ['2840'],
    languageCriterionIds: ['1000'],
  },
};

const marketingConfig: MarketingExecutionContext = {
  version: 1,
  platformId: projectId,
  appId: 'web',
  defaultEnvironment: environmentId,
  environments: {},
  paths: {
    gtmManifest: 'ops/growth/tag-manager.ts',
    webTrackingConfig: 'config/web-tracking.ts',
    webConversionsConfig: 'config/web-conversions.ts',
    trackingObservations: 'ops/growth/tracking-observations.json',
    eventRegistry: 'docs/marketing/events.json',
    conversionRegistry: 'docs/marketing/conversions.json',
    sourceRoots: ['src'],
    seoRoot: 'docs/seo',
    marketingRoot: 'docs/marketing',
    analyticsRoot: 'docs/analytics',
  },
  providers: { googleAds: provider, metaAds: provider, ga4: provider, searchConsole: provider },
  attributionStore: { state: 'selected', freshnessWarningDays: 7 },
  requiredEnv: [],
};

const binding: LocalOpsMcpBinding = {
  projectRoot: '/workspace/acme',
  projectId,
  environmentId,
  principal,
  growthConfig,
  marketingConfig,
};

const readExecutors: OpsMcpGrowthExecutors = {
  reviewHealth: async () => ({}),
  researchSeo: async () => ({}),
  auditMeasurement: async () => ({}),
};

const closeCallbacks: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closeCallbacks.length) await closeCallbacks.pop()?.();
});

async function harness() {
  let now = new Date('2026-08-03T12:00:00.000Z');
  const artifacts = new InMemoryArtifactStore();
  const pauseCampaign = vi.fn(async () => ({
    outcome: 'succeeded' as const,
    providerOperationId: 'provider-operation-1',
  }));
  const readCampaignStatus = vi.fn(async () => 'paused' as const);
  const campaignPause = createGrowthCampaignPauseWorkflow({
    state: {
      artifacts,
      approvals: new InMemoryApprovalStore(),
      locks: new InMemoryLockStore(),
    },
    runStore: new InMemoryOpsMutationRunStore(),
    providerAdapters: {
      googleAds: { pauseCampaign, readCampaignStatus },
      metaAds: { pauseCampaign, readCampaignStatus },
    },
    actor: 'developer',
    mutationPolicy: 'approval-required',
    production: false,
    multiProcess: false,
    lockOwner: 'worker.mcp.contract-profile',
    now: () => now,
    createPlanId: () => 'plan.mcp.contract-profile',
    createReceiptId: () => 'receipt.mcp.contract-profile',
    createApprovalId: () => 'approval.mcp.contract-profile',
  });
  const seoArtifactUnavailable = async () => {
    throw new Error('SEO artifact workflows are outside the campaign-pause evaluation.');
  };
  const workflows: OpsMcpGrowthWorkflows = {
    seoOpportunity: {
      prepare: seoArtifactUnavailable,
      verify: seoArtifactUnavailable,
    },
    campaignPause,
  };
  const server = createLocalOpsMcpServer(binding, workflows, readExecutors);
  const client = new Client({ name: 'ops-mcp-campaign-evaluation', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  closeCallbacks.push(async () => {
    await client.close();
    await server.close();
  });
  return {
    client,
    campaignPause,
    artifacts,
    pauseCampaign,
    readCampaignStatus,
    advanceVerificationWindow() {
      now = new Date('2026-08-03T12:00:02.000Z');
    },
  };
}

describe('campaign-pause MCP contract profiles', () => {
  it.each(OPS_MCP_AGENT_CONTRACT_PROFILES)(
    '$label preserves separate human approval and exact agent execution identity',
    async () => {
      const runtime = await harness();
      const planned = await runtime.client.callTool({
        name: 'plan_campaign_pause',
        arguments: {
          projectId,
          environmentId,
          provider: 'googleAds',
          providerAccountId: '1234567890',
          campaignId: '42',
          evidenceRevision: 'evidence-1',
          verificationDelayMs: 1_000,
        },
      });
      expect(planned.isError, JSON.stringify(planned)).not.toBe(true);
      const plannedResult = planned.structuredContent as {
        runId: string;
        review: { action: { planHash: string }; status: string };
      };
      expect(plannedResult.review.status).toBe('approval-required');

      const unapproved = await runtime.client.callTool({
        name: 'apply_approved_campaign_pause',
        arguments: {
          projectId,
          environmentId,
          runId: plannedResult.runId,
          currentEvidenceRevision: 'evidence-1',
          confirmTarget: 'googleAds:1234567890:42',
        },
      });
      expect(unapproved.isError).toBe(true);
      expect(unapproved.content).toEqual([
        expect.objectContaining({ text: expect.stringContaining('approval_required') }),
      ]);
      expect(runtime.pauseCampaign).not.toHaveBeenCalled();

      await runtime.campaignPause.approve({
        runId: plannedResult.runId,
        approvedBy: 'user.local-operator',
        confirmPlanHash: plannedResult.review.action.planHash,
      });
      const applied = await runtime.client.callTool({
        name: 'apply_approved_campaign_pause',
        arguments: {
          projectId,
          environmentId,
          runId: plannedResult.runId,
          currentEvidenceRevision: 'evidence-1',
          confirmTarget: 'googleAds:1234567890:42',
        },
      });
      expect(applied.isError, JSON.stringify(applied)).not.toBe(true);
      expect(runtime.pauseCampaign).toHaveBeenCalledTimes(1);
      expect([...runtime.artifacts.receipts.values()][0]).toMatchObject({
        actor: principal.id,
        approvalId: 'approval.mcp.contract-profile',
      });

      const repeated = await runtime.client.callTool({
        name: 'apply_approved_campaign_pause',
        arguments: {
          projectId,
          environmentId,
          runId: plannedResult.runId,
          currentEvidenceRevision: 'evidence-1',
          confirmTarget: 'googleAds:1234567890:42',
        },
      });
      expect(repeated.isError).not.toBe(true);
      expect(runtime.pauseCampaign).toHaveBeenCalledTimes(1);

      runtime.advanceVerificationWindow();
      const verified = await runtime.client.callTool({
        name: 'verify_campaign_pause',
        arguments: { projectId, environmentId, runId: plannedResult.runId },
      });
      expect(verified.isError, JSON.stringify(verified)).not.toBe(true);
      expect(verified.structuredContent).toMatchObject({
        review: { status: 'verified', verification: { status: 'verified' } },
      });
      expect(runtime.readCampaignStatus).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects target changes, agent-supplied approval fields, and unknown runs', async () => {
    const runtime = await harness();
    const wrongTarget = await runtime.client.callTool({
      name: 'plan_campaign_pause',
      arguments: {
        projectId: 'another-project',
        environmentId,
        provider: 'googleAds',
        providerAccountId: '1234567890',
        campaignId: '42',
        evidenceRevision: 'evidence-1',
      },
    });
    expect(wrongTarget.isError).toBe(true);

    const injectedApproval = await runtime.client.callTool({
      name: 'apply_approved_campaign_pause',
      arguments: {
        projectId,
        environmentId,
        runId: 'growth.campaign-pause.unknown',
        currentEvidenceRevision: 'evidence-1',
        confirmTarget: 'googleAds:1234567890:42',
        approvedBy: 'agent.self-approved',
        approvalToken: '<SECRET>',
      },
    });
    expect(injectedApproval.isError).toBe(true);
    expect(runtime.pauseCampaign).not.toHaveBeenCalled();

    const unknownRun = await runtime.client.callTool({
      name: 'review_campaign_pause',
      arguments: { projectId, environmentId, runId: 'growth.campaign-pause.unknown' },
    });
    expect(unknownRun.isError).toBe(true);
    expect(unknownRun.content).toEqual([
      expect.objectContaining({ text: expect.stringContaining('run_not_found') }),
    ]);
  });
});
