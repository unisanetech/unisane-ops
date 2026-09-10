import { describe, expect, it, vi } from 'vitest';
import { createGrowthReportReadAction } from './report-read.js';
const binding = {
  projectId: 'store',
  environmentId: 'production',
  connectionId: 'meta',
  accountId: 'act_123',
};
const context = {
  requestId: 'test',
  scopeId: 'store',
  projectId: 'store',
  environmentId: 'production',
  principal: { kind: 'user' as const, id: 'test' },
  requestedAt: '2026-09-06T00:00:00Z',
};
const input = { startDate: '2026-09-01', endDate: '2026-09-05' };
const snapshot = () => ({
  binding,
  ...input,
  reportType: 'campaign',
  capturedAt: context.requestedAt,
  partial: true,
  rows: [1, 2].map((id) => ({
    id: String(id),
    accountId: binding.accountId,
    spend: 0,
    actions: [
      { type: 'purchase', count: 0 },
      { type: 'omni_purchase', count: 1 },
    ],
  })),
});
describe('shared report read', () => {
  it('bounds rows and preserves zero and overlapping action types without a conversion total', async () => {
    const result = await createGrowthReportReadAction({
      resolveBinding: async () => binding,
      read: async () => snapshot(),
    }).execute({ ...input, rowLimit: 1 }, context);
    expect(result).toMatchObject({
      partial: true,
      rowsTruncated: true,
      observedRowCount: 2,
      persisted: false,
      attributionBasis: 'provider-default-not-verified',
      timeZoneBasis: 'unavailable',
    });
    expect(result.rows[0]).toMatchObject({
      spend: 0,
      actions: [
        { type: 'purchase', count: 0 },
        { type: 'omni_purchase', count: 1 },
      ],
    });
    expect(result.rows[0]).not.toHaveProperty('conversions');
  });
  it('rejects invalid dates before resolving credentials or fetching', async () => {
    const resolveBinding = vi.fn();
    const read = vi.fn();
    await expect(
      createGrowthReportReadAction({ resolveBinding, read }).execute(
        { ...input, endDate: '2026-08-01' },
        context,
      ),
    ).rejects.toThrow();
    expect(resolveBinding).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });
  it('rejects another environment before reading', async () => {
    const read = vi.fn();
    await expect(
      createGrowthReportReadAction({
        resolveBinding: async () => ({ ...binding, environmentId: 'test' }),
        read,
      }).execute(input, context),
    ).rejects.toThrow('does not match');
    expect(read).not.toHaveBeenCalled();
  });
  it.each(['binding', 'window', 'type', 'row'])('rejects mismatched %s evidence', async (kind) => {
    const value = snapshot();
    if (kind === 'binding') value.binding = { ...binding, connectionId: 'other' };
    if (kind === 'window') value.endDate = '2026-09-04';
    if (kind === 'type') value.reportType = 'ad';
    if (kind === 'row') value.rows[0]!.accountId = 'act_999';
    await expect(
      createGrowthReportReadAction({
        resolveBinding: async () => binding,
        read: async () => value,
      }).execute(input, context),
    ).rejects.toThrow('does not match');
  });
});
