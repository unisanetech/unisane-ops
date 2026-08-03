import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { GrowthCampaignPauseWorkflowResult } from '@unisane/growth';
import {
  campaignPauseApprovalHeader,
  campaignPauseApprovalHeaderValue,
  campaignPauseApprovalPath,
} from './campaign-pause-approval-contract.js';
import { handleCampaignPauseApprovalRequest } from './campaign-pause-approval-action.js';

const result: GrowthCampaignPauseWorkflowResult = {
  schemaVersion: 1,
  kind: 'growth.campaign-pause-workflow-result',
  runId: 'growth.campaign-pause.test-run',
  review: {
    schemaVersion: 1,
    kind: 'growth.campaign-pause-review',
    action: {
      id: 'growth.ads.campaign.pause',
      schemaVersion: 1,
      planId: 'plan.test',
      planHash: 'a'.repeat(64),
    },
    projectId: 'true-resume',
    environmentId: 'development',
    target: {
      provider: 'googleAds',
      providerLabel: 'Google Ads',
      providerAccountId: 'account-7',
      campaignId: 'campaign-42',
    },
    effect: {
      title: 'Pause campaign delivery',
      summary: 'Requests a pause.',
      risk: 'medium',
      reversibility: 'A separate action is required to enable it later.',
    },
    evidence: { plannedRevision: 'evidence-3', currentRevision: 'evidence-3', status: 'current' },
    approval: {
      status: 'valid',
      approvalId: 'approval.test',
      approvedBy: 'user.local-console',
      expiresAt: '2026-08-03T10:10:00.000Z',
    },
    execution: { status: 'not-started', receiptId: null, completedAt: null },
    verification: {
      status: 'not-started',
      checkedAt: null,
      notBefore: null,
      expiresAt: null,
      observedCampaignStatus: null,
    },
    status: 'ready-to-apply',
    headline: 'This campaign pause is approved and ready.',
    explanation: 'The approval matches the current plan and evidence.',
    nextStep: {
      id: 'apply-approved-pause',
      label: 'Apply the approved pause',
      reason: 'Use the guarded action while approval remains valid.',
      deepLink: '/advertising/all/campaigns',
    },
  },
};

type ResponseCapture = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

async function invoke(input: {
  approve: Parameters<typeof handleCampaignPauseApprovalRequest>[2];
  path?: string;
  method?: string;
  origin?: string;
  contentType?: string;
  actionHeader?: string;
  body?: unknown;
}): Promise<ResponseCapture & { handled: boolean }> {
  const request = Object.assign(
    Readable.from(
      input.body === undefined ? [] : [Buffer.from(JSON.stringify(input.body), 'utf8')],
    ),
    {
      url: input.path ?? campaignPauseApprovalPath,
      method: input.method ?? 'POST',
      headers: {
        host: '127.0.0.1:4174',
        ...(input.origin === undefined
          ? { origin: 'http://127.0.0.1:4174' }
          : { origin: input.origin }),
        ...(input.contentType === undefined
          ? { 'content-type': 'application/json' }
          : { 'content-type': input.contentType }),
        ...(input.actionHeader === undefined
          ? { [campaignPauseApprovalHeader]: campaignPauseApprovalHeaderValue }
          : { [campaignPauseApprovalHeader]: input.actionHeader }),
      },
    },
  ) as unknown as IncomingMessage;
  const capture: ResponseCapture = { statusCode: 0, headers: {}, body: '' };
  const response = {
    get statusCode() {
      return capture.statusCode;
    },
    set statusCode(value: number) {
      capture.statusCode = value;
    },
    setHeader(name: string, value: string | number) {
      capture.headers[name.toLowerCase()] = String(value);
      return this;
    },
    end(body?: string) {
      capture.body = body ?? '';
      return this;
    },
  } as unknown as ServerResponse;
  const handled = await handleCampaignPauseApprovalRequest(request, response, input.approve);
  return { ...capture, handled };
}

describe('campaign pause console approval action', () => {
  it('records only an exact same-origin approval request', async () => {
    const seen: unknown[] = [];
    const response = await invoke({
      approve: async (input) => {
        seen.push(input);
        return result;
      },
      body: { runId: result.runId, planHash: 'a'.repeat(64) },
    });

    expect(response.handled).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ ok: true, result: { runId: result.runId } });
    expect(seen).toEqual([{ runId: result.runId, planHash: 'a'.repeat(64) }]);
  });

  it('rejects cross-origin, malformed, and non-approval requests before the workflow', async () => {
    let calls = 0;
    const approve = async () => {
      calls += 1;
      return result;
    };
    const crossOrigin = await invoke({
      approve,
      origin: 'http://example.test',
      body: { runId: result.runId, planHash: 'a'.repeat(64) },
    });
    const malformed = await invoke({
      approve,
      body: { runId: result.runId, planHash: 'wrong' },
    });
    const unknown = await invoke({
      approve,
      path: '/api/actions/campaign-pause/apply',
      body: {},
    });

    expect(crossOrigin.statusCode).toBe(403);
    expect(malformed.statusCode).toBe(400);
    expect(unknown.handled).toBe(false);
    expect(calls).toBe(0);
  });

  it('returns a bounded conflict without exposing another action surface', async () => {
    const response = await invoke({
      approve: async () => {
        throw new Error(
          '[GROWTH_CAMPAIGN_PAUSE_APPROVAL_STALE] This pause plan is no longer current.',
        );
      },
      body: { runId: result.runId, planHash: 'a'.repeat(64) },
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      ok: false,
      error: {
        code: 'GROWTH_CAMPAIGN_PAUSE_APPROVAL_STALE',
        message: 'This pause plan is no longer current.',
      },
    });
  });
});
