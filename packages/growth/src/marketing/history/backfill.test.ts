import { describe, expect, it, vi } from 'vitest';
import { executeMarketingHistoryBackfill, planMarketingHistoryBackfill } from './backfill.js';

const target = {
  provider: 'googleAds' as const,
  reportType: 'campaign' as const,
  accountId: 'ads-1',
};

describe('marketing history backfill', () => {
  it('plans bounded one-day windows and resumes after the returned cursor', () => {
    const first = planMarketingHistoryBackfill({
      target,
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      maxDays: 2,
    });
    expect(first).toMatchObject({
      complete: false,
      nextAfterDate: '2026-07-02',
      windows: [
        { startDate: '2026-07-01', endDate: '2026-07-01' },
        { startDate: '2026-07-02', endDate: '2026-07-02' },
      ],
    });

    const resumed = planMarketingHistoryBackfill({
      target,
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      afterDate: first.nextAfterDate,
      maxDays: 3,
    });
    expect(resumed.complete).toBe(true);
    expect(resumed.windows.map((window) => window.startDate)).toEqual([
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ]);
  });

  it('stops at the first provider failure and returns a safe resume cursor', async () => {
    const plan = planMarketingHistoryBackfill({
      target,
      startDate: '2026-07-01',
      endDate: '2026-07-03',
    });
    const pullDay = vi.fn(async (_target, window) => {
      if (window.startDate === '2026-07-02') throw new Error('provider unavailable');
      return { historyObservationId: `history.${window.startDate}` };
    });

    const result = await executeMarketingHistoryBackfill({ plan, pullDay });

    expect(result).toMatchObject({
      status: 'failed',
      completedDates: ['2026-07-01'],
      resumeAfterDate: '2026-07-01',
      failure: { date: '2026-07-02', message: 'provider unavailable' },
    });
    expect(pullDay).toHaveBeenCalledTimes(2);
  });

  it('treats a successful bounded batch as resumable progress rather than failure', async () => {
    const plan = planMarketingHistoryBackfill({
      target,
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      maxDays: 2,
    });

    const result = await executeMarketingHistoryBackfill({
      plan,
      pullDay: async (_target, window) => ({
        historyObservationId: `history.${window.startDate}`,
      }),
    });

    expect(result).toMatchObject({
      status: 'continuation-required',
      completedDates: ['2026-07-01', '2026-07-02'],
      resumeAfterDate: '2026-07-02',
    });
  });
});
