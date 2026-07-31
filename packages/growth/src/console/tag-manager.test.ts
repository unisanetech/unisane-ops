import { describe, expect, it } from 'vitest';
import type { MarketingConsoleConnection } from './contracts.js';
import { buildMarketingConsoleTagManager } from './tag-manager.js';

const connection: MarketingConsoleConnection = {
  provider: 'google',
  label: 'Google',
  available: true,
  required: true,
  connected: true,
  state: 'current',
  statusLabel: 'Working',
  summary: 'Google services are working.',
  connectionId: 'google-primary',
  services: [
    {
      id: 'tag-manager',
      label: 'Tag Manager',
      purpose: 'Manage measurement.',
      state: 'current',
      statusLabel: 'Working',
      accessLabel: 'Required access is available',
      accessLevelLabel: 'Read-only provider access',
      dataLabel: 'Workspace evidence is current',
      dataCoverageLabel: 'Tag Manager workspace',
    },
  ],
  disconnect: {
    title: 'Disconnect Google?',
    consequences: [],
    historicalDataRemains: true,
    providerResourcesUnchanged: true,
  },
};

describe('Growth console Tag Manager projection', () => {
  it('does not claim an old plan represents the latest workspace or manifest', () => {
    const result = buildMarketingConsoleTagManager({
      appId: 'true-resume',
      environment: 'production',
      manifestChangedAt: '2026-07-30T10:00:00.000Z',
      connection,
      snapshot: {
        path: '/project/snapshot.json',
        observedAt: '2026-07-30T09:00:00.000Z',
        resourceCount: 94,
        workspacePath: 'accounts/1/containers/2/workspaces/3',
      },
      plan: {
        path: '/project/old-plan.json',
        observedAt: '2026-06-14T09:00:00.000Z',
        operationCount: 3,
        valid: true,
      },
      preview: {
        path: '/project/preview.json',
        observedAt: '2026-06-14T10:00:00.000Z',
        valid: true,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'warn',
        headline: 'Review Tag Manager changes against the current workspace.',
        resourceCount: 94,
        checks: expect.arrayContaining([
          expect.objectContaining({
            id: 'tag-manager-drift',
            status: 'warn',
            detail:
              'Changes have not been reviewed since the latest workspace sync or manifest edit.',
          }),
        ]),
        actions: expect.arrayContaining([
          expect.objectContaining({
            id: 'gtm.refresh',
            command:
              'unisane growth gtm pull --cwd . --app true-resume --env production --connection google-primary',
          }),
          expect.objectContaining({
            id: 'gtm.review-changes',
          }),
        ]),
      }),
    );
    expect(result).not.toHaveProperty('pendingChangeCount');
  });

  it('shows a reviewed zero-change state without inventing publication work', () => {
    const result = buildMarketingConsoleTagManager({
      appId: 'true-resume',
      environment: 'production',
      manifestChangedAt: '2026-07-30T08:00:00.000Z',
      connection,
      snapshot: {
        path: '/project/snapshot.json',
        observedAt: '2026-07-30T09:00:00.000Z',
        resourceCount: 94,
      },
      plan: {
        path: '/project/plan.json',
        observedAt: '2026-07-30T10:00:00.000Z',
        operationCount: 0,
        valid: true,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ready',
        headline: 'Tag Manager matches the reviewed desired state.',
        pendingChangeCount: 0,
      }),
    );
    expect(result.actions.map((action) => action.id)).toEqual([
      'gtm.refresh',
      'gtm.review-changes',
    ]);
  });
});
