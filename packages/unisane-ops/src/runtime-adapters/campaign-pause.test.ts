import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import {
  createMetaConnectionRecord,
  writeMetaConnectionRecord,
  type MetaHostCredentialResolver,
} from '@unisane/provider-meta';
import { growthCampaignPauseWorkflowResultSchema } from '@unisane/growth';
import { executeGrowthProviderOperation } from './growth.js';
function writeFixture(
  projectRoot: string,
  backend: 'local' | 'sqlite' = 'sqlite',
  manage = true,
): void {
  const recordPath = '.unisane/ops/connections/meta-primary.json';
  writeFileSync(
    path.join(projectRoot, 'unisane.config.ts'),
    `export default {
  schemaVersion: 1,
  project: { id: 'commerce-site' },
  environments: { production: { production: true } },
  ops: {
  execution: { ads: { backend: '${backend}' } },
  connections: {
    'meta-primary': { provider: 'meta', recordPath: '${recordPath}' }
  },
  targets: {},
  capabilities: {
    growth: {
      schemaVersion: 1,
      adoptionMode: 'adopt-existing',
      capabilities: ['advertising'],
      environments: {
        production: {
          connections: { meta: 'meta-primary' },
          resources: [{
            provider: 'meta',
            connection: 'meta-primary',
            service: 'ads-insights',
            resourceType: 'ad-account',
            resourceId: 'act_123'
          }]
        }
      },
      manifests: {},
      runtime: { integration: 'existing' },
      policy: { mutation: 'approval-required', spend: 'approval-required' }
    }
  }
}};\n`,
  );
  writeMetaConnectionRecord({
    projectRoot,
    recordPath,
    connection: createMetaConnectionRecord({
      displayName: 'Primary Meta measurement',
      observation: {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        identity: {
          kind: 'system-user',
          subject: 'system-user-123',
          displayName: 'Measurement system user',
        },
        credential: {
          secretReference: 'meta-primary-graph',
          secretKind: 'meta-graph-access',
          version: 4,
          state: 'active',
          observedAt: '2026-09-02T00:00:00.000Z',
        },
        grants: [
          {
            service: 'ads-insights',
            scopes: manage ? ['ads_read', 'ads_management'] : ['ads_read'],
            state: 'granted',
            observedAt: '2026-09-02T00:00:00.000Z',
          },
        ],
        resources: [
          {
            service: 'ads-insights',
            resourceType: 'ad-account',
            resourceId: 'act_123',
            displayName: 'Primary ad account',
            state: 'selected',
            observedAt: '2026-09-02T00:00:00.000Z',
          },
        ],
        observedAt: '2026-09-02T00:00:00.000Z',
      },
    }),
  });
}

it('executes an approved Meta pause through SQLite, across reopened host calls, with isolated credentials', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'campaign-host-'));
  writeFixture(cwd);
  let status = 'ACTIVE';
  let time = new Date('2026-09-06T00:00:00Z');
  const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
    if (init?.method === 'POST') {
      status = 'PAUSED';
      return new Response('{"success":true}');
    }
    return new Response(JSON.stringify({ id: '456', account_id: '123', status }));
  });
  const resolver: MetaHostCredentialResolver = {
    withCredential: async (input) => {
      expect(input.context).toMatchObject({
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
      });
      return input.use(new TextEncoder().encode('fixture-secret'));
    },
  };
  const deps = { metaCredentialResolver: resolver, fetch: fetcher, now: () => time };
  const outer = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'operator' },
  };
  const call = async (command: unknown, principal = outer.principal) =>
    growthCampaignPauseWorkflowResultSchema.parse(
      await executeGrowthProviderOperation(
        cwd,
        'growth.campaign.pause',
        { ...outer, principal, command },
        deps,
      ),
    );
  try {
    const plan = await call({
      operation: 'plan',
      parameters: {
        provider: 'metaAds',
        providerAccountId: 'act_123',
        campaignId: '456',
        evidenceRevision: 'caller-value',
        verificationDelayMs: 0,
        verificationTtlMs: 60000,
      },
      currentEvidenceRevision: 'caller-value',
    });
    expect(plan.review.evidence.plannedRevision).not.toBe('caller-value');
    const approve = {
      operation: 'approve',
      runId: plan.runId,
      approvedBy: 'operator',
      confirmPlanHash: plan.review.action.planHash,
    };
    await expect(call(approve, { kind: 'agent', id: 'agent' })).rejects.toThrow(
      'HUMAN_APPROVAL_REQUIRED',
    );
    await call(approve);
    const apply = {
      operation: 'apply',
      runId: plan.runId,
      currentEvidenceRevision: 'untrusted',
      confirmTarget: 'metaAds:act_123:456',
    };
    const applied = await call(apply, { kind: 'agent', id: 'agent' });
    expect(applied.review.execution.status).toBe('succeeded');
    time = new Date('2026-09-06T00:00:01Z');
    const verified = await call(
      { operation: 'verify', runId: plan.runId },
      { kind: 'agent', id: 'agent' },
    );
    expect(verified.review.verification.status).toBe('verified');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(JSON.stringify(verified)).not.toContain('fixture-secret');
    await expect(
      executeGrowthProviderOperation(
        cwd,
        'meta.marketing.pause-campaign',
        { providerAccountId: 'act_123', campaignId: '456' },
        deps,
      ),
    ).rejects.toThrow('CALLBACK_REQUIRED');
    await expect(
      executeGrowthProviderOperation(cwd, 'google.marketing.pause-campaign', {}, deps),
    ).rejects.toThrow('SHARED_WORKFLOW_REQUIRED');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it('blocks local production/agent execution and refuses to bypass the recorded local history', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'campaign-local-'));
  writeFixture(cwd, 'local');
  const fetcher = vi.fn<typeof fetch>(
    async () => new Response('{"id":"456","account_id":"123","status":"ACTIVE"}'),
  );
  const resolver: MetaHostCredentialResolver = {
    withCredential: (input) => input.use(new TextEncoder().encode('fixture-secret')),
  };
  const deps = { metaCredentialResolver: resolver, fetch: fetcher };
  const outer = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'operator' },
  };
  const call = (command: unknown, principal = outer.principal) =>
    executeGrowthProviderOperation(
      cwd,
      'growth.campaign.pause',
      { ...outer, principal, command },
      deps,
    );
  try {
    expect(await call({ operation: 'list' })).toEqual([]);
    const plan = growthCampaignPauseWorkflowResultSchema.parse(
      await call({
        operation: 'plan',
        parameters: {
          provider: 'metaAds',
          providerAccountId: 'act_123',
          campaignId: '456',
          evidenceRevision: 'ignored',
          verificationDelayMs: 0,
          verificationTtlMs: 60000,
        },
        currentEvidenceRevision: 'ignored',
      }),
    );
    await call({
      operation: 'approve',
      runId: plan.runId,
      approvedBy: 'operator',
      confirmPlanHash: plan.review.action.planHash,
    });
    const apply = {
      operation: 'apply',
      runId: plan.runId,
      currentEvidenceRevision: 'ignored',
      confirmTarget: 'metaAds:act_123:456',
    };
    await expect(call(apply, { kind: 'agent', id: 'agent' })).rejects.toThrow(
      'DURABILITY_REQUIRED',
    );
    await expect(call(apply)).rejects.toThrow('DURABILITY_REQUIRED');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    writeFixture(cwd, 'sqlite');
    await expect(call(apply)).rejects.toThrow('MIGRATION_REQUIRED');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it('refuses a foreign campaign response and missing mutation permission before sending a write', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'campaign-identity-'));
  writeFixture(cwd, 'sqlite', false);
  let foreign = true;
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(
        JSON.stringify({ id: '456', account_id: foreign ? '999' : '123', status: 'ACTIVE' }),
      ),
  );
  const resolver: MetaHostCredentialResolver = {
    withCredential: (input) => input.use(new TextEncoder().encode('fixture-secret')),
  };
  const call = (command: unknown) =>
    executeGrowthProviderOperation(
      cwd,
      'growth.campaign.pause',
      {
        projectId: 'commerce-site',
        environmentId: 'production',
        principal: { kind: 'user', id: 'operator' },
        command,
      },
      { metaCredentialResolver: resolver, fetch: fetcher },
    );
  try {
    const command = {
      operation: 'plan',
      parameters: {
        provider: 'metaAds',
        providerAccountId: 'act_123',
        campaignId: '456',
        evidenceRevision: 'ignored',
        verificationDelayMs: 0,
        verificationTtlMs: 60000,
      },
      currentEvidenceRevision: 'ignored',
    };
    await expect(call(command)).rejects.toThrow('EVIDENCE_UNAVAILABLE');
    foreign = false;
    const plan = growthCampaignPauseWorkflowResultSchema.parse(await call(command));
    await call({
      operation: 'approve',
      runId: plan.runId,
      approvedBy: 'operator',
      confirmPlanHash: plan.review.action.planHash,
    });
    await expect(
      call({
        operation: 'apply',
        runId: plan.runId,
        currentEvidenceRevision: 'ignored',
        confirmTarget: 'metaAds:act_123:456',
      }),
    ).rejects.toThrow('MANAGE_GRANT_REQUIRED');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    const shown = growthCampaignPauseWorkflowResultSchema.parse(
      await call({ operation: 'show', runId: plan.runId }),
    );
    expect(shown.review.execution.status).toBe('not-started');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
