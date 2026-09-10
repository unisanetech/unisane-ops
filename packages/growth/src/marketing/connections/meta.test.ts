import { describe, expect, it } from 'vitest';
import {
  assessMarketingMetaConnection,
  marketingMetaConnectionReady,
  marketingMetaConnectionStatusSchema,
  type MarketingMetaConnectionStatus,
} from './meta.js';

const now = new Date('2026-09-02T00:00:00.000Z');

function status(
  overrides: Partial<MarketingMetaConnectionStatus> = {},
): MarketingMetaConnectionStatus {
  return {
    schemaVersion: 1,
    connectionId: 'meta-primary',
    connected: true,
    scopes: ['ads_read'],
    credentialAvailable: true,
    credentialState: 'active',
    expiresAt: '2026-10-02T00:00:00.000Z',
    grants: [
      {
        service: 'ads-insights',
        scopes: ['ads_read'],
        state: 'granted',
        observedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        service: 'event-measurement',
        scopes: ['ads_read'],
        state: 'granted',
        observedAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    resources: [
      {
        service: 'ads-insights',
        resourceType: 'ad-account',
        resourceId: 'act_123',
        displayName: 'Primary ad account',
        state: 'selected',
        observedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        service: 'event-measurement',
        resourceType: 'pixel',
        resourceId: 'pixel_456',
        displayName: 'Store Pixel',
        state: 'selected',
        observedAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('Meta measurement connection readiness', () => {
  it('accepts exact read grants and explicit account and event-source selections', () => {
    const result = assessMarketingMetaConnection(status(), { now });

    expect(result).toMatchObject({ ready: true, state: 'ready' });
    expect(result.services).toEqual([
      expect.objectContaining({ service: 'ads-insights', ready: true }),
      expect.objectContaining({ service: 'event-measurement', ready: true }),
    ]);
    expect(marketingMetaConnectionReady(status(), now)).toBe(true);
  });

  it('fails only the service with a partial grant', () => {
    const input = status({
      grants: status().grants?.map((grant) =>
        grant.service === 'event-measurement' ? { ...grant, state: 'partial' as const } : grant,
      ),
    });

    const result = assessMarketingMetaConnection(input, { now });

    expect(result).toMatchObject({ ready: false, state: 'grant-partial' });
    expect(result.services).toEqual([
      expect.objectContaining({ service: 'ads-insights', ready: true }),
      expect.objectContaining({ service: 'event-measurement', ready: false }),
    ]);
  });

  it('blocks expired credentials and grants deterministically', () => {
    expect(
      assessMarketingMetaConnection(status({ expiresAt: '2026-09-01T23:59:59.000Z' }), {
        now,
      }),
    ).toMatchObject({ ready: false, state: 'credential-expired' });

    const expiredGrant = status({
      grants: status().grants?.map((grant) => ({
        ...grant,
        expiresAt: '2026-09-01T23:59:59.000Z',
      })),
    });
    expect(assessMarketingMetaConnection(expiredGrant, { now })).toMatchObject({
      ready: false,
      state: 'grant-expired',
    });
  });

  it('refuses ambiguous account and event-source selection', () => {
    const input = status({
      resources: [
        ...status().resources!,
        {
          service: 'ads-insights',
          resourceType: 'ad-account',
          resourceId: 'act_999',
          displayName: 'Second ad account',
          state: 'selected',
          observedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
    });

    const result = assessMarketingMetaConnection(input, { now });

    expect(result).toMatchObject({ ready: false, state: 'resource-ambiguous' });
    expect(result.issues).toContain('More than one Meta ad account is selected for ads insights.');
  });

  it('requires an exact Pixel or dataset for event measurement', () => {
    const input = status({
      resources: status().resources?.filter((resource) => resource.service !== 'event-measurement'),
    });

    expect(assessMarketingMetaConnection(input, { now })).toMatchObject({
      ready: false,
      state: 'resource-missing',
      issues: ['Select one exact Meta Pixel or dataset for event measurement.'],
    });
  });

  it('rejects campaign-management and unknown scopes', () => {
    for (const scope of ['ads_management', 'unreviewed_scope']) {
      const result = assessMarketingMetaConnection(status({ scopes: ['ads_read', scope] }), {
        now,
      });
      expect(result).toMatchObject({ ready: false, state: 'scope-forbidden' });
      expect(result.issues.join(' ')).toContain(scope);
    }
  });

  it('stops new reads after disconnect without requiring historical evidence deletion', () => {
    expect(
      assessMarketingMetaConnection(
        status({ connected: false, credentialAvailable: false, credentialState: 'missing' }),
        { now },
      ),
    ).toEqual({
      ready: false,
      state: 'disconnected',
      issues: ['Meta is not connected; historical evidence may remain but new reads must stop.'],
      services: [],
    });
  });

  it('uses a strict token-free evidence contract', () => {
    expect(
      marketingMetaConnectionStatusSchema.safeParse({
        ...status(),
        accessToken: 'must-never-cross-this-boundary',
      }).success,
    ).toBe(false);
  });
});
