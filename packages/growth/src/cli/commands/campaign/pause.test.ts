import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
  InMemoryOpsMutationRunStore,
} from '@unisane/ops-engine/testing';
import { createGrowthCampaignPauseWorkflow } from '../../../workflows/campaign-pause-execution.js';
import { campaignPauseHostRequestSchema } from '../../../workflows/campaign-pause-command.js';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { createGrowthConfigIntent } from '../../../config.js';
import { runWithGrowthProviderRuntime } from '../../provider-runtime.js';
import {
  campaignPauseApply,
  campaignPauseApprove,
  campaignPausePlan,
  campaignPauseShow,
  campaignPauseVerify,
} from './pause.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function jsonOutput(log: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const value = log.mock.calls.at(-1)?.[0];
  if (typeof value !== 'string') throw new Error('Expected JSON command output.');
  return JSON.parse(value) as Record<string, unknown>;
}

describe('campaign pause CLI', () => {
  it('preserves one canonical run across plan, show, approve, apply, and verify', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'growth-campaign-pause-cli-'));
    temporaryDirectories.push(cwd);
    const operations: string[] = [];
    const providerInputs: Record<string, unknown>[] = [];
    const provider = {
      pauseCampaign: async (input: { providerAccountId: string; campaignId: string }) => {
        providerInputs.push(input);
        return { outcome: 'succeeded' as const, providerOperationId: 'operation-9' };
      },
      readCampaignStatus: async () => 'paused' as const,
    };
    const workflow = createGrowthCampaignPauseWorkflow({
      state: {
        artifacts: new InMemoryArtifactStore(),
        approvals: new InMemoryApprovalStore(),
        locks: new InMemoryLockStore(),
      },
      runStore: new InMemoryOpsMutationRunStore(),
      providerAdapters: { googleAds: provider, metaAds: provider },
      actor: 'developer',
      production: false,
      multiProcess: false,
      mutationPolicy: 'approval-required',
      lockOwner: 'fixture.host',
    });
    const runtime: PackCommandRuntime = {
      async resolveBinding(_binding, requestInput) {
        const request = requestInput as { operation: string; input: Record<string, unknown> };
        operations.push(request.operation);
        if (request.operation === 'growth.project.context') {
          return {
            projectRoot: cwd,
            configPath: path.join(cwd, 'unisane.config.ts'),
            projectId: 'campaign-test',
            environments: { development: { production: false } },
            growth: {
              ...createGrowthConfigIntent({
                adoptionMode: 'adopt-existing',
                capabilities: ['advertising'],
                environments: ['development'],
              }),
              policy: {
                mutation: 'approval-required',
                spend: 'disabled',
              },
            },
          };
        }
        if (request.operation === 'growth.campaign.pause') {
          const { command, projectId, environmentId, principal } =
            campaignPauseHostRequestSchema.parse(request.input);
          if (command.operation === 'plan')
            return workflow.plan({
              ...command,
              context: {
                requestId: 'test.plan',
                scopeId: `scope.${projectId}`,
                projectId,
                environmentId,
                principal,
                requestedAt: new Date().toISOString(),
              },
            });
          if (command.operation === 'show') return workflow.show(command.runId);
          if (command.operation === 'approve') return workflow.approve(command);
          if (command.operation === 'apply') return workflow.apply({ ...command, principal });
          if (command.operation === 'verify') return workflow.verify({ ...command, principal });
        }
        throw new Error(`Unexpected operation: ${request.operation}`);
      },
    };
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await runWithGrowthProviderRuntime(runtime, cwd, async () => {
      expect(
        await campaignPausePlan({
          cwd,
          environment: 'development',
          json: true,
          provider: 'googleAds',
          accountId: 'account-7',
          campaignId: 'campaign-42',
          evidenceRevision: 'evidence-3',
          verificationDelayMs: '0',
        }),
      ).toBe(0);
      const planned = jsonOutput(log);
      const runId = planned.runId as string;
      const plannedReview = planned.review as {
        status: string;
        headline: string;
        action: { planHash: string };
      };
      expect(plannedReview.status).toBe('approval-required');

      log.mockClear();
      expect(await campaignPauseShow({ cwd, environment: 'development', runId })).toBe(0);
      expect(log.mock.calls.at(-1)?.[0]).toContain(plannedReview.headline);

      log.mockClear();
      expect(
        await campaignPauseApprove({
          cwd,
          environment: 'development',
          json: true,
          runId,
          planHash: plannedReview.action.planHash,
          approvedBy: 'operator@example.test',
        }),
      ).toBe(0);
      expect((jsonOutput(log).review as { status: string }).status).toBe('ready-to-apply');

      log.mockClear();
      const applyExitCode = await campaignPauseApply({
        cwd,
        environment: 'development',
        json: true,
        runId,
        evidenceRevision: 'evidence-3',
        confirmTarget: 'googleAds:account-7:campaign-42',
      });
      expect(applyExitCode, JSON.stringify(jsonOutput(log))).toBe(0);
      expect((jsonOutput(log).review as { status: string }).status).toBe('outcome-unknown');

      log.mockClear();
      expect(
        await campaignPauseVerify({
          cwd,
          environment: 'development',
          json: true,
          runId,
        }),
      ).toBe(0);
      const verified = jsonOutput(log);
      expect(verified.runId).toBe(runId);
      expect(verified.review).toMatchObject({
        status: 'verified',
        execution: { status: 'succeeded' },
        verification: { status: 'verified' },
      });
    });

    expect(operations.filter((operation) => operation.includes('execute-live'))).toEqual([]);
    expect(operations).toContain('growth.campaign.pause');
    expect(operations).not.toContain('google.marketing.pause-campaign');
    expect(providerInputs[0]).toMatchObject({
      providerAccountId: 'account-7',
      campaignId: 'campaign-42',
    });
  });

  it('propagates host denial without constructing a local execution workflow', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'growth-campaign-pause-production-'));
    temporaryDirectories.push(cwd);
    const runtime: PackCommandRuntime = {
      async resolveBinding(_binding, requestInput) {
        const request = requestInput as { operation: string };
        if (request.operation === 'growth.campaign.pause')
          throw new Error('[CAMPAIGN_HOST_DENIED] Host rejected the request.');
        if (request.operation !== 'growth.project.context') throw new Error('Unexpected operation');
        return {
          projectRoot: cwd,
          configPath: path.join(cwd, 'unisane.config.ts'),
          projectId: 'campaign-production-test',
          environments: { production: { production: true } },
          growth: createGrowthConfigIntent({
            adoptionMode: 'adopt-existing',
            capabilities: ['advertising'],
            environments: ['production'],
          }),
        };
      },
    };
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await runWithGrowthProviderRuntime(runtime, cwd, async () => {
      expect(
        await campaignPausePlan({
          cwd,
          environment: 'production',
          json: true,
          provider: 'googleAds',
          accountId: 'account-7',
          campaignId: 'campaign-42',
          evidenceRevision: 'evidence-3',
        }),
      ).toBe(1);
    });

    expect(jsonOutput(log)).toMatchObject({
      ok: false,
      error: expect.stringContaining('CAMPAIGN_HOST_DENIED'),
    });
  });
});
