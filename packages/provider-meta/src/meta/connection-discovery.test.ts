import { describe, expect, it, vi } from 'vitest';
import { createMetaConnectionRecord, type MetaConnectionRecord } from './connection.js';
import {
  discoverMetaConnection,
  type MetaConnectionDiscoveryResult,
} from './connection-discovery.js';
import {
  discoverMetaConnectionWithHostCredential,
  type MetaHostCredentialResolver,
} from './credential-execution.js';

const token = 'secret-meta-access-token';

function connection(): MetaConnectionRecord {
  return createMetaConnectionRecord({
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
        version: 2,
        state: 'active',
        observedAt: '2026-09-02T00:00:00.000Z',
      },
      grants: [],
      resources: [],
      observedAt: '2026-09-02T00:00:00.000Z',
    },
  });
}

function json(value: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function successfulFetcher() {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ id: 'system-user-123', name: 'Measurement system user' }))
    .mockResolvedValueOnce(
      json({
        data: [
          { permission: 'ads_read', status: 'granted' },
          { permission: 'pages_show_list', status: 'granted' },
        ],
      }),
    )
    .mockResolvedValueOnce(json({ data: [{ id: 'business-1', name: 'Commerce Business' }] }))
    .mockResolvedValueOnce(
      json({ data: [{ id: 'act_123', name: 'Primary ad account', account_status: 1 }] }),
    )
    .mockResolvedValueOnce(
      json({
        data: [
          {
            id: 'page-1',
            name: 'Commerce Page',
            instagram_business_account: {
              id: 'instagram-1',
              username: 'commerce',
            },
          },
        ],
      }),
    )
    .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Commerce Pixel' }] }))
    .mockResolvedValueOnce(json({ data: [{ id: 'dataset-1', name: 'Commerce Dataset' }] }))
    .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Commerce Pixel' }] }));
}

function resolver(captured: {
  reference?: unknown;
  context?: unknown;
  zeroed?: boolean;
}): MetaHostCredentialResolver {
  return {
    async withCredential(input) {
      captured.reference = input.reference;
      captured.context = input.context;
      const bytes = new TextEncoder().encode(token);
      try {
        return await input.use(bytes);
      } finally {
        bytes.fill(0);
        captured.zeroed = bytes.every((byte) => byte === 0);
      }
    },
  };
}

describe('Meta connection discovery', () => {
  it('discovers exact read grants and candidate resources only inside the host callback', async () => {
    const fetcher = successfulFetcher();
    const captured: { reference?: unknown; context?: unknown; zeroed?: boolean } = {};

    const result = await discoverMetaConnectionWithHostCredential({
      connection: connection(),
      resolver: resolver(captured),
      fetch: fetcher,
      now: new Date('2026-09-02T03:00:00.000Z'),
    });

    expect(captured).toEqual({
      reference: { credentialId: 'meta-primary-graph', version: 2 },
      context: {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        provider: 'meta',
        secretKind: 'meta-graph-access',
      },
      zeroed: true,
    });
    expect(result).toMatchObject({
      connectionId: 'meta-primary',
      resourceLimitReached: false,
      identity: { kind: 'system-user', subject: 'system-user-123' },
      grants: [
        { service: 'ads-insights', state: 'granted' },
        { service: 'event-measurement', state: 'granted' },
      ],
    });
    expect(result.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceType: 'business', resourceId: 'business-1' }),
        expect.objectContaining({ resourceType: 'ad-account', resourceId: 'act_123' }),
        expect.objectContaining({ resourceType: 'page', resourceId: 'page-1' }),
        expect.objectContaining({
          resourceType: 'instagram-account',
          resourceId: 'instagram-1',
          parentResourceId: 'page-1',
        }),
        expect.objectContaining({
          resourceType: 'pixel',
          resourceId: 'pixel-1',
          parentResourceId: 'business-1',
        }),
        expect.objectContaining({
          resourceType: 'dataset',
          resourceId: 'dataset-1',
          parentResourceId: 'business-1',
        }),
      ]),
    );
    expect(fetcher).toHaveBeenCalledTimes(8);
    for (const call of fetcher.mock.calls) {
      expect(call[1]).toMatchObject({
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
    }
    expect(JSON.stringify(result)).not.toMatch(
      /secret-meta-access-token|meta-primary-graph|credentialId|credentialVersion/i,
    );
  });

  it('rejects a credential that resolves to another Meta identity', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ id: 'different-user', name: 'Wrong identity' }));

    await expect(
      discoverMetaConnection({
        connection: connection(),
        accessToken: token,
        fetch: fetcher,
      }),
    ).rejects.toThrow('[META_CONNECTION_IDENTITY_MISMATCH]');
  });

  it('bounds pagination and marks truncated evidence as partial', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ id: 'system-user-123', name: 'Measurement system user' }))
      .mockResolvedValueOnce(
        json({
          data: [{ permission: 'ads_read', status: 'granted' }],
          paging: { next: 'https://graph.facebook.com/v25.0/me/permissions?after=next' },
        }),
      )
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(json({ data: [] }));

    const result = await discoverMetaConnection({
      connection: connection(),
      accessToken: token,
      fetch: fetcher,
      options: { maxPages: 1 },
    });

    expect(result.areas).toContainEqual(
      expect.objectContaining({
        area: 'permissions',
        state: 'partial',
        pageCount: 1,
        truncated: true,
      }),
    );
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it('keeps service failures independent and never includes provider error bodies', async () => {
    const fetcher = successfulFetcher();
    fetcher.mockReset();
    fetcher
      .mockResolvedValueOnce(json({ id: 'system-user-123', name: 'Measurement system user' }))
      .mockResolvedValueOnce(json({ data: [{ permission: 'ads_read', status: 'granted' }] }))
      .mockResolvedValueOnce(json({ data: [{ id: 'business-1', name: 'Commerce Business' }] }))
      .mockResolvedValueOnce(json({ data: [{ id: 'act_123', name: 'Primary account' }] }))
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(
        json(
          {
            error: {
              message: `provider echoed ${token}`,
              code: 190,
              error_subcode: 463,
            },
          },
          403,
          { 'retry-after': '60' },
        ),
      )
      .mockResolvedValueOnce(json({ data: [{ id: 'dataset-1', name: 'Dataset' }] }))
      .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Account Pixel' }] }));

    const result: MetaConnectionDiscoveryResult = await discoverMetaConnection({
      connection: connection(),
      accessToken: token,
      fetch: fetcher,
    });

    expect(result.areas).toContainEqual(
      expect.objectContaining({ area: 'ad-accounts', state: 'ready' }),
    );
    expect(result.areas).toContainEqual(
      expect.objectContaining({ area: 'event-sources', state: 'partial' }),
    );
    expect(result.resources).toContainEqual(
      expect.objectContaining({ resourceType: 'dataset', resourceId: 'dataset-1' }),
    );
    expect(result.resources).toContainEqual(
      expect.objectContaining({ resourceType: 'pixel', resourceId: 'pixel-1' }),
    );
    expect(JSON.stringify(result)).not.toContain(token);
    expect(JSON.stringify(result)).not.toContain('provider echoed');
  });

  it('discovers pixels through accessible ad accounts when businesses are unavailable', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ id: 'system-user-123', name: 'Measurement system user' }))
      .mockResolvedValueOnce(json({ data: [{ permission: 'ads_read', status: 'granted' }] }))
      .mockResolvedValueOnce(json({ error: { code: 100 } }, 403))
      .mockResolvedValueOnce(json({ data: [{ id: 'act_123', name: 'Primary account' }] }))
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Account Pixel' }] }));

    const result = await discoverMetaConnection({
      connection: connection(),
      accessToken: token,
      fetch: fetcher,
    });

    expect(result.resources).toContainEqual(
      expect.objectContaining({
        resourceType: 'pixel',
        resourceId: 'pixel-1',
        parentResourceId: 'act_123',
      }),
    );
    expect(result.areas).toContainEqual(
      expect.objectContaining({ area: 'event-sources', state: 'partial', itemCount: 1 }),
    );
  });

  it('rejects provider pagination that leaves the pinned Graph origin and version', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ id: 'system-user-123', name: 'Measurement system user' }))
      .mockResolvedValueOnce(
        json({
          data: [{ permission: 'ads_read', status: 'granted' }],
          paging: { next: 'https://attacker.example/v25.0/stolen' },
        }),
      )
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(json({ data: [] }))
      .mockResolvedValueOnce(json({ data: [] }));

    const result = await discoverMetaConnection({
      connection: connection(),
      accessToken: token,
      fetch: fetcher,
    });

    expect(result.areas).toContainEqual({
      area: 'permissions',
      state: 'unavailable',
      pageCount: 0,
      itemCount: 0,
      truncated: false,
      failure: { kind: 'pagination-rejected' },
    });
    expect(result.grants.every((grant) => grant.state === 'missing')).toBe(true);
  });
});
