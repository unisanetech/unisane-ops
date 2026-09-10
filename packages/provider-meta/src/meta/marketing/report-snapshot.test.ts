import { describe, expect, it } from 'vitest';
import { normalizeMetaReportSnapshot } from './report-snapshot.js';
const binding = {
  projectId: 'store',
  environmentId: 'production',
  connectionId: 'meta',
  accountId: 'act_123',
};
const request = { startDate: '2026-09-01', endDate: '2026-09-05' };
const row = {
  account_id: '123',
  campaign_id: 'cmp',
  spend: '0',
  actions: [
    { action_type: 'purchase', value: '2' },
    { action_type: 'omni_purchase', value: '2' },
  ],
  action_values: [{ action_type: 'purchase', value: '120' }],
};
function normalize(data: unknown = [row]) {
  return normalizeMetaReportSnapshot({
    binding,
    request,
    capturedAt: '2026-09-06T00:00:00Z',
    payload: {
      accountId: 'act_123',
      inputFormat: 'meta-ads',
      value: { data, partial: false, reportType: 'campaign', window: request },
    },
  });
}
describe('Meta report snapshot', () => {
  it('keeps action counts and values distinct', () => {
    expect(normalize().rows[0]).toMatchObject({
      spend: 0,
      actions: [
        { type: 'purchase', count: 2, value: 120 },
        { type: 'omni_purchase', count: 2 },
      ],
    });
  });
  it('accepts an explicitly empty report', () => expect(normalize([]).rows).toEqual([]));
  it.each([
    undefined,
    {},
    [{ ...row, account_id: '999' }],
    [{ ...row, campaign_id: undefined }],
    [{ ...row, spend: 'NaN' }],
    [{ ...row, actions: [row.actions[0], row.actions[0]] }],
  ])('rejects malformed or ambiguous evidence %#', (data) =>
    expect(() => normalize(data === undefined ? null : data)).toThrow(),
  );
});
