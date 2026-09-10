import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { loadFirstPartyPackGraph } from '../host.js';
import { describe, expect, it, vi } from 'vitest';
import {
  createMetaConnectionRecord,
  metaCapabilityInventory,
  writeMetaConnectionRecord,
  type MetaHostCredentialResolver,
  type MetaLocalCredentialSource,
} from '@unisane/provider-meta';
import {
  createLocalGrowthProviderOperationDependencies,
  executeGrowthProviderOperation,
  resolveGrowthProviderBinding,
} from './growth.js';

function writeMetaReportFixture(projectRoot: string): void {
  const recordPath = '.unisane/ops/connections/meta-primary.json';
  writeFileSync(
    path.join(projectRoot, 'unisane.config.ts'),
    `export default {
  schemaVersion: 1,
  project: { id: 'commerce-site' },
  environments: { production: { production: true } },
  ops: {
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
            scopes: ['ads_read'],
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

describe('Growth Meta connection context adapter', () => {
  it('loads Provider Meta as the canonical Meta provider-binding contributor', () => {
    const meta = loadFirstPartyPackGraph().find((manifest) => manifest.packId === 'provider-meta');
    expect(meta).toMatchObject({
      packageName: '@unisane/provider-meta',
      providerBindings: ['meta'],
      commands: [],
    });
  });

  it('reports Meta capability limits offline without requiring a connection or credential', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('Unexpected network access'));
    const withCredential = vi.fn().mockRejectedValue(new Error('Unexpected credential access'));
    const result = await executeGrowthProviderOperation(
      '/nonexistent-meta-inventory-project',
      'meta.connection.capabilities',
      {},
      {
        fetch: fetcher,
        metaCredentialResolver: { withCredential },
      },
    );
    expect(result).toEqual(metaCapabilityInventory());
    expect(fetcher).not.toHaveBeenCalled();
    expect(withCredential).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      provider: 'meta',
      schemaVersion: 2,
      accountReadiness: 'not-evaluated',
      capabilities: expect.arrayContaining([
        expect.objectContaining({
          id: 'meta.connection.lifecycle',
          implementation: 'implemented',
          verification: 'fixture-proven',
        }),
        expect.objectContaining({
          id: 'meta.events.test-events',
          implementation: 'not-implemented',
          verification: 'not-verified',
        }),
        expect.objectContaining({
          id: 'meta.ads.campaign.pause',
          requirements: expect.arrayContaining(['host-credential-binding', 'human-approval']),
        }),
      ]),
    });
    expect(JSON.stringify(result)).not.toMatch(/secretReference|credentialId|access.?token/i);
  });
  it('projects a canonical Meta record without exposing its secret binding', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'growth-meta-context-'));
    const recordPath = '.unisane/ops/connections/meta-primary.json';
    writeFileSync(
      path.join(projectRoot, 'unisane.config.ts'),
      `export default {
  schemaVersion: 1,
  project: { id: 'commerce-site' },
  environments: { production: { production: true } },
  ops: {
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
          resources: [
            {
              provider: 'meta',
              connection: 'meta-primary',
              service: 'ads-insights',
              resourceType: 'ad-account',
              resourceId: 'act_123'
            },
            {
              provider: 'meta',
              connection: 'meta-primary',
              service: 'event-measurement',
              resourceType: 'pixel',
              resourceId: 'pixel_456'
            }
          ]
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
            version: 1,
            state: 'active',
            observedAt: '2026-09-02T00:00:00.000Z',
          },
          grants: [
            {
              service: 'ads-insights',
              scopes: ['ads_read'],
              state: 'granted',
              observedAt: '2026-09-02T00:00:00.000Z',
            },
            {
              service: 'event-measurement',
              scopes: ['ads_read'],
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
            {
              service: 'event-measurement',
              resourceType: 'pixel',
              resourceId: 'pixel_456',
              displayName: 'Commerce Pixel',
              state: 'selected',
              observedAt: '2026-09-02T00:00:00.000Z',
            },
          ],
          observedAt: '2026-09-02T00:00:00.000Z',
        },
      }),
    });

    const context = await executeGrowthProviderOperation(
      projectRoot,
      'growth.connections.context',
      { environment: 'production' },
    );

    expect(context).toMatchObject({
      environmentId: 'production',
      providers: [
        { provider: 'google', available: true },
        {
          provider: 'meta',
          available: true,
          connection: {
            id: 'meta-primary',
            displayName: 'Primary Meta measurement',
            identity: 'Measurement system user',
            credentialState: 'active',
            grants: [
              expect.objectContaining({ service: 'ads-insights', state: 'granted' }),
              expect.objectContaining({ service: 'event-measurement', state: 'granted' }),
            ],
            resources: [
              expect.objectContaining({ resourceId: 'act_123' }),
              expect.objectContaining({ resourceId: 'pixel_456' }),
            ],
          },
        },
      ],
    });
    expect(JSON.stringify(context)).not.toMatch(
      /meta-primary-graph|access.?token|secretReference|credentialVersion/i,
    );
  });

  it('executes discovery only through the host credential callback and rejects token arguments', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'growth-meta-discovery-'));
    const recordPath = '.unisane/ops/connections/meta-primary.json';
    writeFileSync(
      path.join(projectRoot, 'unisane.config.ts'),
      `export default {
  schemaVersion: 1,
  project: { id: 'commerce-site' },
  environments: { production: { production: true } },
  ops: {
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
          resources: []
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
            version: 3,
            state: 'active',
            observedAt: '2026-09-02T00:00:00.000Z',
          },
          grants: [],
          resources: [],
          observedAt: '2026-09-02T00:00:00.000Z',
        },
      }),
    });

    const callback = vi.fn();
    const resolver: MetaHostCredentialResolver = {
      async withCredential(input) {
        callback(input);
        return input.use(new TextEncoder().encode('host-only-meta-token'));
      },
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'system-user-123', name: 'Measurement system user' })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ permission: 'ads_read', status: 'granted' }] })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'act_123', name: 'Primary account' }] })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] })));

    const result = await executeGrowthProviderOperation(
      projectRoot,
      'meta.connection.discover',
      { environment: 'production', maxPages: 1 },
      {
        metaCredentialResolver: resolver,
        fetch: fetcher,
        now: () => new Date('2026-09-02T03:00:00.000Z'),
      },
    );

    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      reference: { credentialId: 'meta-primary-graph', version: 3 },
      context: {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        provider: 'meta',
        secretKind: 'meta-graph-access',
      },
    });
    expect(result).toMatchObject({
      connectionId: 'meta-primary',
      grants: [
        { service: 'ads-insights', state: 'granted' },
        { service: 'event-measurement', state: 'granted' },
      ],
      resources: [expect.objectContaining({ resourceType: 'ad-account', resourceId: 'act_123' })],
    });
    expect(JSON.stringify(result)).not.toMatch(/host-only-meta-token|meta-primary-graph/);

    await expect(
      executeGrowthProviderOperation(
        projectRoot,
        'meta.connection.discover',
        { environment: 'production', accessToken: 'forbidden-token-argument' },
        { metaCredentialResolver: resolver, fetch: fetcher },
      ),
    ).rejects.toThrow('Unrecognized key');
    await expect(
      executeGrowthProviderOperation(projectRoot, 'meta.connection.resolve-token', {}),
    ).rejects.toThrow('[GROWTH_META_OPERATION_UNKNOWN]');
  });

  it('pulls Meta Ads reports inside the host callback and enforces exact account selection', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'growth-meta-report-'));
    writeMetaReportFixture(projectRoot);
    const callback = vi.fn();
    const resolver: MetaHostCredentialResolver = {
      async withCredential(input) {
        callback(input);
        return input.use(new TextEncoder().encode('host-only-report-token'));
      },
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              account_id: '123',
              campaign_id: 'campaign_1',
              spend: '125.50',
              actions: [{ action_type: 'purchase', value: '2' }],
            },
          ],
        }),
      ),
    );

    const result = await executeGrowthProviderOperation(
      projectRoot,
      'meta.marketing.pull-report',
      {
        environment: 'production',
        accountId: 'act_123',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        reportType: 'campaign',
        maxPages: 2,
        pageSize: 50,
      },
      { metaCredentialResolver: resolver, fetch: fetcher },
    );

    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      reference: { credentialId: 'meta-primary-graph', version: 4 },
      context: {
        projectId: 'commerce-site',
        connectionId: 'meta-primary',
        provider: 'meta',
      },
    });
    expect(result).toMatchObject({
      accountId: 'act_123',
      inputFormat: 'meta-ads',
      reportType: 'campaign',
      value: {
        partial: false,
        window: { startDate: '2026-08-01', endDate: '2026-08-31' },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/host-only-report-token|meta-primary-graph/);
    const requestUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestUrl.pathname).toBe('/v25.0/act_123/insights');
    expect(requestUrl.searchParams.get('limit')).toBe('50');
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: { authorization: 'Bearer host-only-report-token' },
    });

    await expect(
      executeGrowthProviderOperation(
        projectRoot,
        'meta.marketing.pull-report',
        {
          environment: 'production',
          accountId: 'act_999',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
        },
        { metaCredentialResolver: resolver, fetch: fetcher },
      ),
    ).rejects.toThrow('[META_ADS_ACCOUNT_SELECTION_MISMATCH]');
    expect(callback).toHaveBeenCalledOnce();

    await expect(
      executeGrowthProviderOperation(
        projectRoot,
        'meta.marketing.pull-report',
        {
          environment: 'production',
          accountId: 'act_123',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          accessToken: 'forbidden-token-argument',
        },
        { metaCredentialResolver: resolver, fetch: fetcher },
      ),
    ).rejects.toThrow('Unrecognized key');
    expect(callback).toHaveBeenCalledOnce();

    await expect(
      executeGrowthProviderOperation(projectRoot, 'meta.marketing.pull-report', {
        environment: 'production',
        accountId: 'act_123',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      }),
    ).rejects.toThrow('[META_CREDENTIAL_RESOLVER_UNAVAILABLE]');
  });

  it('keeps Meta mutation transports blocked without returning credentials', async () => {
    await expect(
      executeGrowthProviderOperation('.', 'meta.marketing.execute-live', {
        credentials: { accessToken: 'must-not-be-used' },
      }),
    ).rejects.toThrow('[META_MUTATION_CREDENTIAL_CALLBACK_REQUIRED]');
    await expect(
      executeGrowthProviderOperation('.', 'meta.marketing.upload-asset', {
        credentials: { accessToken: 'must-not-be-used' },
      }),
    ).rejects.toThrow('[META_MUTATION_CREDENTIAL_CALLBACK_REQUIRED]');
  });

  it('composes the local Meta credential source into the ordinary Growth host binding', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'growth-meta-local-host-'));
    writeMetaReportFixture(projectRoot);
    const credential = new TextEncoder().encode('local-host-meta-token');
    const read = vi.fn(() => credential);
    const dependencies = await createLocalGrowthProviderOperationDependencies({
      metaCredentialSource: { read } satisfies MetaLocalCredentialSource,
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ campaign_id: 'campaign_1', spend: '10.00' }] })),
      );
    dependencies.fetch = fetcher;

    const result = await resolveGrowthProviderBinding(
      {} as PackCommandRuntime,
      {
        operation: 'meta.marketing.pull-report',
        cwd: projectRoot,
        input: {
          environment: 'production',
          accountId: 'act_123',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
        },
      },
      dependencies,
    );

    expect(result).toMatchObject({ accountId: 'act_123', inputFormat: 'meta-ads' });
    expect(read).toHaveBeenCalledWith({
      reference: { credentialId: 'meta-primary-graph', version: 4 },
      context: {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        provider: 'meta',
        secretKind: 'meta-graph-access',
      },
    });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: { authorization: 'Bearer local-host-meta-token' },
    });
    expect(JSON.stringify(result)).not.toContain('local-host-meta-token');
    expect([...credential]).toEqual(new Array(credential.byteLength).fill(0));
  });
});

describe('account-aware Meta capability host', () => {
  const target = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'user.test' },
  };
  it('projects the selected account without resolving credentials or calling Meta', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'meta-capabilities-'));
    writeMetaReportFixture(root);
    const fetcher = vi.fn().mockRejectedValue(new Error('Unexpected network access'));
    const withCredential = vi.fn().mockRejectedValue(new Error('Unexpected credential access'));
    const result = await executeGrowthProviderOperation(
      root,
      'growth.capabilities.review',
      target,
      {
        now: () => new Date('2026-09-02T01:00:00Z'),
        fetch: fetcher,
        metaCredentialResolver: { withCredential },
      },
    );
    expect(result).toMatchObject({
      projectId: 'commerce-site',
      liveVerified: false,
      capabilities: expect.arrayContaining([
        expect.objectContaining({ id: 'meta.ads.reporting', status: 'ready-to-read' }),
        expect.objectContaining({ id: 'meta.ads.campaign.pause', status: 'blocked' }),
      ]),
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(withCredential).not.toHaveBeenCalled();
    const defaultHost = await resolveGrowthProviderBinding(
      { resolveBinding: vi.fn() },
      {
        cwd: root,
        operation: 'growth.capabilities.review',
        input: target,
      },
    );
    expect(defaultHost).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({ id: 'meta.ads.reporting', hostState: 'bound' }),
      ]),
    });
    const unavailable = await executeGrowthProviderOperation(
      root,
      'growth.capabilities.review',
      target,
      { now: () => new Date('2026-09-02T01:00:00Z') },
    );
    expect(unavailable).toMatchObject({
      capabilities: expect.arrayContaining([
        expect.objectContaining({
          id: 'meta.ads.reporting',
          status: 'blocked',
          hostReason: 'The host has no Meta credential callback.',
        }),
      ]),
    });
    await expect(
      executeGrowthProviderOperation(root, 'growth.capabilities.review', {
        ...target,
        projectId: 'other',
      }),
    ).rejects.toThrow('TARGET_MISMATCH');
  });
});

it('reads an exactly bound snapshot with host credentials and redacts provider failures', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'meta-shared-report-'));
  writeMetaReportFixture(root);
  const withCredential: MetaHostCredentialResolver['withCredential'] = async (input) =>
    input.use(new TextEncoder().encode('fixture-token'));
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            account_id: '123',
            campaign_id: 'campaign-1',
            spend: '0',
            actions: [
              { action_type: 'purchase', value: '1' },
              { action_type: 'omni_purchase', value: '1' },
            ],
          },
        ],
      }),
    ),
  );
  const input = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'test' },
    report: { startDate: '2026-09-01', endDate: '2026-09-05' },
  };
  const deps = { metaCredentialResolver: { withCredential }, fetch: fetcher };
  const result = await executeGrowthProviderOperation(root, 'growth.reports.read', input, deps);
  expect(result).toMatchObject({
    projectId: 'commerce-site',
    accountId: 'act_123',
    persisted: false,
    rows: [
      {
        spend: 0,
        actions: [
          { type: 'purchase', count: 1 },
          { type: 'omni_purchase', count: 1 },
        ],
      },
    ],
  });
  fetcher.mockClear();
  await expect(
    executeGrowthProviderOperation(
      root,
      'growth.reports.read',
      { ...input, projectId: 'other' },
      deps,
    ),
  ).rejects.toThrow('does not match');
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockRejectedValue(new Error('fixture-token'));
  await expect(
    executeGrowthProviderOperation(root, 'growth.reports.read', input, deps),
  ).rejects.toThrow('Meta report reading failed');
});

it('collects a report and retrieves its exact evidence offline through the shared host operation', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'meta-history-host-'));
  writeMetaReportFixture(root);
  const withCredential: MetaHostCredentialResolver['withCredential'] = async (input) =>
    input.use(new TextEncoder().encode('fixture-only'));
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ data: [] })));
  const target = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'test' },
  };
  const raw = await executeGrowthProviderOperation(
    root,
    'growth.reports.collect',
    { ...target, report: { startDate: '2026-09-01', endDate: '2026-09-05' } },
    { metaCredentialResolver: { withCredential }, fetch: fetcher },
  );
  const { growthReportEvidenceSchema } = await import('@unisane/growth/contracts');
  const evidence = growthReportEvidenceSchema.parse(raw);
  fetcher.mockClear();
  const history = await executeGrowthProviderOperation(
    root,
    'growth.reports.history',
    { ...target, query: { evidenceId: evidence.evidenceId } },
    { fetch: fetcher },
  );
  expect(history).toMatchObject({
    projectId: target.projectId,
    entries: [{ evidenceId: evidence.evidenceId }],
    selected: evidence,
  });
  expect(fetcher).not.toHaveBeenCalled();
  await expect(
    executeGrowthProviderOperation(
      root,
      'growth.reports.history',
      { ...target, projectId: 'other', query: {} },
      {},
    ),
  ).rejects.toThrow('another project');
});

it('imports and reviews diagnostics for an exact selected dataset without credentials', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'meta-diagnostics-host-'));
  writeMetaReportFixture(root);
  for (const file of ['unisane.config.ts', '.unisane/ops/connections/meta-primary.json']) {
    const name = path.join(root, file);
    writeFileSync(
      name,
      readFileSync(name, 'utf8')
        .replaceAll('ads-insights', 'event-measurement')
        .replaceAll('ad-account', 'dataset')
        .replaceAll('act_123', '123'),
    );
  }
  const now = new Date('2026-09-06T00:00:00Z');
  const target = {
    projectId: 'commerce-site',
    environmentId: 'production',
    principal: { kind: 'user', id: 'test' },
  };
  const observation = {
    schemaVersion: 1,
    provider: 'meta',
    projectId: target.projectId,
    environmentId: target.environmentId,
    connectionId: 'meta-primary',
    datasetId: '123',
    capturedAt: now.toISOString(),
    window: { startDate: '2026-09-01', endDate: '2026-09-05' },
    source: {
      kind: 'manual-import',
      reference: 'Synthetic diagnostic fixture',
      verifiedLive: false,
    },
    completeness: 'partial',
    events: [
      {
        name: 'Purchase',
        activity: 'active',
        total: 0,
        channels: ['browser'],
        issues: [
          {
            code: 'currency',
            severity: 'error',
            state: 'active',
            explanation: 'Currency needs investigation.',
          },
        ],
      },
    ],
  };
  const fetcher = vi.fn().mockRejectedValue(new Error('No network'));
  const withCredential = vi.fn().mockRejectedValue(new Error('No credential access'));
  const deps = { now: () => now, fetch: fetcher, metaCredentialResolver: { withCredential } };
  expect(
    await executeGrowthProviderOperation(
      root,
      'growth.meta.diagnostics.review',
      { ...target, query: {} },
      deps,
    ),
  ).toMatchObject({ freshness: 'missing', events: [] });
  expect(
    await executeGrowthProviderOperation(
      root,
      'growth.meta.diagnostics.import',
      { ...target, observation },
      deps,
    ),
  ).toMatchObject({ eventCount: 1, verifiedLive: false });
  expect(
    await executeGrowthProviderOperation(
      root,
      'growth.meta.diagnostics.review',
      { ...target, query: { eventName: 'Purchase' } },
      deps,
    ),
  ).toMatchObject({
    freshness: 'current',
    events: [{ name: 'Purchase', total: 0 }],
    handoffs: [{ owner: 'investigation', verified: false }],
  });
  await expect(
    executeGrowthProviderOperation(
      root,
      'growth.meta.diagnostics.import',
      { ...target, observation: { ...observation, datasetId: 'other' } },
      deps,
    ),
  ).rejects.toThrow('Diagnostic evidence');
  expect(fetcher).not.toHaveBeenCalled();
  expect(withCredential).not.toHaveBeenCalled();
});

it('rejects superseded raw GTM mutation routes without loading credentials', async () => {
  for (const operation of ['apply', 'preview', 'create-version', 'publish', 'rollback']) {
    await expect(
      executeGrowthProviderOperation('/unused', `gtm.provider.${operation}`, {}),
    ).rejects.toThrow('GROWTH_GTM_OPERATION_UNKNOWN');
  }
});
