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
                  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
                  state: 'granted',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
                {
                  service: 'search-console',
                  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
                  state: 'partial',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
              ],
              resources: [
                {
                  service: 'analytics',
                  resourceType: 'property',
                  resourceId: 'properties/123',
                  displayName: 'True Resume',
                  state: 'selected',
                  observedAt: '2026-07-30T00:00:00.000Z',
                },
                {
                  service: 'search-console',
                  resourceType: 'site',
                  resourceId: 'sc-domain:trueresume.io',
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
        primaryAction: expect.objectContaining({
          command:
            'unisane connect google --environment production --connection google-primary --service search-console',
        }),
      }),
      expect.objectContaining({
        id: 'analytics',
        state: 'current',
        accessLevelLabel: 'Read-only provider access',
        resource: {
          type: 'Property',
          label: 'True Resume',
          identifier: 'properties/123',
          selectedAt: '2026-07-30T00:00:00.000Z',
        },
        resourceAction: expect.objectContaining({
          label: 'Change resource',
        }),
      }),
    ]);
  });

  it('keeps Meta visible but optional without inventing a connection flow', () => {
    const connections = buildMarketingConsoleConnections({
      context: {
        environmentId: 'development',
        providers: [
          { provider: 'google', available: true },
          { provider: 'meta', available: true },
        ],
      },
      capabilities: ['seo', 'advertising'],
      evidence: [],
      freshness: [],
    });

    expect(connections).toEqual([
      expect.objectContaining({
        provider: 'google',
        required: true,
        available: true,
        connected: false,
        state: 'not-connected',
        primaryAction: expect.objectContaining({
          label: 'Continue with Google',
          command: 'unisane connect google --environment development',
        }),
      }),
      expect.objectContaining({
        provider: 'meta',
        required: false,
        available: true,
        connected: false,
        state: 'not-connected',
        statusLabel: 'Not connected',
      }),
    ]);
    expect(connections[1]).not.toHaveProperty('primaryAction');
    expect(JSON.stringify(connections)).not.toMatch(/coming soon|scope|token/i);
  });
});
