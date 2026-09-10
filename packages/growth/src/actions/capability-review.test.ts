import { describe, expect, it } from 'vitest';
import { createGrowthCapabilityReviewAction } from './capability-review.js';
import type { GrowthCapabilitySnapshot } from '../capabilities/contracts.js';
import { loadConsoleCapabilityReview } from '../console/capability-review.js';

const now = new Date('2026-09-06T00:00:00Z');
const context = {
  requestId: 'request.test',
  scopeId: 'scope.store',
  projectId: 'store',
  environmentId: 'production',
  principal: { kind: 'user' as const, id: 'user.test' },
  requestedAt: now.toISOString(),
};
function snapshot(): GrowthCapabilitySnapshot {
  const resource = {
    service: 'ads-insights' as const,
    resourceType: 'ad-account' as const,
    resourceId: 'act_123',
    displayName: 'Store ads',
    state: 'selected' as const,
    observedAt: now.toISOString(),
  };
  return {
    projectId: 'store',
    environmentId: 'production',
    connectionId: 'meta-store',
    configuredResources: [{ ...resource }],
    connection: {
      connectionId: 'meta-store',
      connected: true,
      credentialAvailable: true,
      credentialState: 'active',
      scopes: ['ads_read'],
      lastVerifiedAt: now.toISOString(),
      resources: [resource],
      grants: [
        {
          service: 'ads-insights',
          scopes: ['ads_read'],
          state: 'granted',
          observedAt: now.toISOString(),
        },
      ],
    },
    capabilities: [
      {
        id: 'meta.ads.reporting',
        title: 'Ads reports',
        implementation: 'implemented',
        verification: 'fixture-proven',
        effect: 'read-network',
        hostState: 'bound',
        hostReason: 'Host callback is bound.',
        assessment: 'ads-insights',
        executionSurfaces: ['cli'],
        nextStep: 'Read the selected report.',
      },
    ],
  };
}
async function review(value = snapshot()) {
  return createGrowthCapabilityReviewAction({ loadSnapshot: () => value, now: () => now }).execute(
    { maxAgeHours: 24 },
    context,
  );
}

describe('account-aware capability review', () => {
  it('reports recorded read prerequisites without claiming live verification', async () => {
    const result = await review();
    expect(result.liveVerified).toBe(false);
    expect(result.capabilities[0]).toMatchObject({
      status: 'ready-to-read',
      accountState: 'recorded-ready',
      executionSurfaces: ['cli'],
    });
  });
  it.each([
    [
      'missing',
      (s: GrowthCapabilitySnapshot) => {
        s.connection = undefined;
      },
    ],
    [
      'expired',
      (s: GrowthCapabilitySnapshot) => {
        s.connection!.credentialState = 'expired';
      },
    ],
    [
      'revoked grant',
      (s: GrowthCapabilitySnapshot) => {
        s.connection!.grants![0]!.state = 'revoked';
      },
    ],
    [
      'stale',
      (s: GrowthCapabilitySnapshot) => {
        s.connection!.lastVerifiedAt = '2026-01-01T00:00:00Z';
      },
    ],
    [
      'future',
      (s: GrowthCapabilitySnapshot) => {
        s.connection!.lastVerifiedAt = '2027-01-01T00:00:00Z';
      },
    ],
    [
      'ambiguous',
      (s: GrowthCapabilitySnapshot) => {
        s.connection!.resources![0]!.state = 'ambiguous';
      },
    ],
    [
      'resource mismatch',
      (s: GrowthCapabilitySnapshot) => {
        s.configuredResources[0]!.resourceId = 'act_999';
      },
    ],
    [
      'connection mismatch',
      (s: GrowthCapabilitySnapshot) => {
        s.connectionId = 'other';
      },
    ],
    [
      'host blocked',
      (s: GrowthCapabilitySnapshot) => {
        s.capabilities[0]!.hostState = 'blocked';
      },
    ],
    [
      'no execution interface',
      (s: GrowthCapabilitySnapshot) => {
        s.capabilities[0]!.executionSurfaces = [];
      },
    ],
    [
      'write',
      (s: GrowthCapabilitySnapshot) => {
        s.capabilities[0]!.effect = 'write-network';
      },
    ],
  ] as const)('blocks %s', async (_, change) => {
    const value = snapshot();
    change(value);
    expect((await review(value)).capabilities[0]!.status).toBe('blocked');
  });
  it('rejects cross-project host evidence', async () => {
    const value = snapshot();
    value.projectId = 'other';
    await expect(review(value)).rejects.toThrow('different project');
  });
  it('does not infer missing implementation from a healthy account', async () => {
    const value = snapshot();
    value.capabilities[0]!.implementation = 'not-implemented';
    expect((await review(value)).capabilities[0]!.status).toBe('not-implemented');
  });
  it('validates console targets and preserves the shared result', async () => {
    const output = await review();
    const target = { projectId: 'store', environmentId: 'production' };
    expect(await loadConsoleCapabilityReview(async () => output, target)).toEqual(output);
    expect(await loadConsoleCapabilityReview(undefined, target)).toBeUndefined();
    await expect(
      loadConsoleCapabilityReview(async () => output, { ...target, projectId: 'other' }),
    ).rejects.toThrow('TARGET_MISMATCH');
  });
});
