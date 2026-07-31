import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleActivity } from './activity.js';

describe('Growth console Activity projection', () => {
  it('combines readable syncs and changes while keeping machine evidence technical', () => {
    const activity = buildMarketingConsoleActivity({
      receipts: [
        {
          id: 'ads-change.json',
          lane: 'ads',
          action: 'ads.google-ads-india-targeting-restore-receipt',
          status: 'ready',
          timestamp: '2026-07-29T00:00:00.000Z',
          path: '/private/evidence/ads-change.json',
          message: 'ads-change.json updated 1 day ago.',
        },
      ],
      freshness: [
        {
          id: 'ga4.channel',
          provider: 'ga4',
          reportType: 'channel',
          status: 'ready',
          label: 'Google Analytics channels',
          message: 'Google Analytics channels are fresh.',
          path: '/private/evidence/ga4-channel.json',
          pulledAt: '2026-07-30T00:00:00.000Z',
          ageDays: 0,
        },
      ],
    });

    expect(activity).toEqual(
      expect.objectContaining({
        status: 'ready',
        items: [
          expect.objectContaining({
            category: 'syncs',
            title: 'Google Analytics channels updated',
            providerLabel: 'Google Analytics',
            approvalLabel: 'Read-only update',
            technical: expect.objectContaining({
              sourcePath: '/private/evidence/ga4-channel.json',
            }),
          }),
          expect.objectContaining({
            category: 'changes',
            title: 'Advertising targeting restored',
            summary: 'The advertising configuration change completed successfully.',
            providerLabel: 'Google Ads',
            technical: expect.objectContaining({
              action: 'ads.google-ads-india-targeting-restore-receipt',
            }),
          }),
        ],
      }),
    );
    expect(JSON.stringify(activity.items.map((item) => item.summary))).not.toContain('.json');
  });
});
