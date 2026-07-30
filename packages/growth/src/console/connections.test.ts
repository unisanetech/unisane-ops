import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleConnections } from './connections.js';

describe('Growth console connection projection', () => {
  it('keeps working and partial Google services independent', () => {
    const [google] = buildMarketingConsoleConnections({
      context: {
        environmentId: 'production',
        providers: [
          {
            provider: 'google',
            available: true,
            connection: {
              id: 'google-primary',
              displayName: 'Primary Google',
              identity: 'operator@example.test',
              credentialState: 'active',
              grants: [
                {
                  service: 'analytics',
                  state: 'granted',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
                {
                  service: 'search-console',
                  state: 'partial',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
              ],
              resources: [
                {
                  service: 'analytics',
                  resourceType: 'property',
                  displayName: 'True Resume',
                  state: 'selected',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
                {
                  service: 'search-console',
                  resourceType: 'site',
                  displayName: 'trueresume.io',
                  state: 'selected',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
              ],
              updatedAt: '2026-07-30T00:00:00.000Z',
              lastVerifiedAt: '2026-07-30T00:00:00.000Z',
            },
          },
        ],
      },
      capabilities: ['seo', 'analytics'],
      evidence: [
        {
          provider: 'ga4',
          state: 'connected',
          reportFamilies: [],
          evidenceStatus: 'pass',
          evidenceMessage: 'Google Analytics data is current.',
          evidenceCommands: [],
        },
        {
          provider: 'searchConsole',
          state: 'connected',
          reportFamilies: [],
          evidenceStatus: 'pending',
          evidenceMessage: 'Search Console is waiting for access.',
          evidenceCommands: [],
        },
      ],
      freshness: [],
    });

    expect(google).toMatchObject({
      provider: 'google',
      connected: true,
      state: 'partial-permission',
      identityLabel: 'operator@example.test',
      disconnect: {
        command:
          'unisane disconnect google --environment production --connection google-primary --yes',
        historicalDataRemains: true,
        providerResourcesUnchanged: true,
      },
    });
    expect(google?.services).toEqual([
      expect.objectContaining({
        id: 'search-console',
        state: 'partial-permission',
        action: expect.objectContaining({
          command:
            'unisane connect google --environment production --connection google-primary --service search-console',
        }),
      }),
      expect.objectContaining({
        id: 'analytics',
        state: 'current',
        resource: { type: 'Property', label: 'True Resume' },
      }),
    ]);
  });

  it('offers only the admitted Google flow when no provider is connected', () => {
    const connections = buildMarketingConsoleConnections({
      context: {
        environmentId: 'development',
        providers: [
          { provider: 'google', available: true },
          { provider: 'meta', available: true },
        ],
      },
      capabilities: ['seo'],
      evidence: [],
      freshness: [],
    });

    expect(connections).toEqual([
      expect.objectContaining({
        provider: 'google',
        available: true,
        connected: false,
        state: 'not-connected',
        primaryAction: expect.objectContaining({
          label: 'Continue with Google',
          command: 'unisane connect google --environment development',
        }),
      }),
    ]);
    expect(JSON.stringify(connections)).not.toMatch(/Meta|coming soon|scope|token/i);
  });
});
