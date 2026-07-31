import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleAutomations } from './automations.js';

describe('Growth console Automations projection', () => {
  it('shows only selected providers and does not claim that planned jobs are active', () => {
    const automations = buildMarketingConsoleAutomations({
      schedule: {
        jobs: [
          {
            id: 'googleAds.campaign.daily',
            provider: 'googleAds',
            reportType: 'campaign',
            cadence: 'daily',
            windowDays: 3,
            status: 'blocked',
            blocker:
              'Run unisane growth marketing conversion-pull --input <confirmed-conversions.json>.',
          },
          {
            id: 'metaAds.campaign.daily',
            provider: 'metaAds',
            reportType: 'campaign',
            cadence: 'daily',
            windowDays: 3,
          },
        ],
      },
      schedulePath: '/private/evidence/reporting-plan.json',
      connections: [
        {
          provider: 'google',
          label: 'Google',
          available: true,
          required: true,
          connected: true,
          state: 'current',
          statusLabel: 'Working',
          summary: 'Google is working.',
          connectionId: 'google-primary',
          services: [
            {
              id: 'ads',
              label: 'Google Ads',
              purpose: 'Advertising',
              state: 'current',
              statusLabel: 'Working',
              accessLabel: 'Access granted',
              accessLevelLabel: 'Advertising account access',
              dataLabel: 'Current',
              dataCoverageLabel: 'Campaign data',
            },
          ],
          disconnect: {
            title: 'Disconnect Google?',
            consequences: [],
            historicalDataRemains: true,
            providerResourcesUnchanged: true,
          },
        },
      ],
      freshness: [
        {
          id: 'googleAds.campaign',
          provider: 'googleAds',
          reportType: 'campaign',
          status: 'ready',
          label: 'Google Ads campaigns',
          message: 'Google Ads campaigns are fresh.',
          pulledAt: '2026-07-30T00:00:00.000Z',
          ageDays: 0,
        },
      ],
      now: new Date('2026-07-30T12:00:00.000Z'),
    });

    expect(automations).toEqual(
      expect.objectContaining({
        status: 'blocked',
        headline: '1 reporting automation has a shared activation dependency.',
        sharedIssue:
          'Refresh Unisane-confirmed conversion truth before activating scheduled reporting.',
        items: [
          expect.objectContaining({
            id: 'googleAds.campaign.daily',
            statusLabel: 'Blocked',
            issue:
              'Refresh Unisane-confirmed conversion truth before activating scheduled reporting.',
            lastSuccessLabel: 'Updated today',
            nextRunLabel: 'Not scheduled',
            runNow: expect.objectContaining({
              command:
                'unisane growth marketing pull-api --cwd . --provider googleAds --report campaign --start-date 2026-07-27 --end-date 2026-07-30 --connection google-primary',
            }),
          }),
        ],
      }),
    );
  });
});
