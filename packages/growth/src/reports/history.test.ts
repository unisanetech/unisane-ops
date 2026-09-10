import { describe, it, expect } from 'vitest';
import {
  createGrowthReportEvidence,
  validateGrowthReportEvidence,
  buildGrowthReportHistory,
} from './history-service.js';
const binding = {
  projectId: 'store',
  environmentId: 'production',
  connectionId: 'meta',
  accountId: 'act_123',
};
const report = {
  ...binding,
  schemaVersion: 1,
  actionId: 'growth.reports.read',
  reportType: 'campaign',
  startDate: '2026-09-01',
  endDate: '2026-09-05',
  capturedAt: '2026-09-06T00:00:00Z',
  timeZoneBasis: 'unavailable',
  attributionBasis: 'provider-default-not-verified',
  persisted: false,
  partial: true,
  observedRowCount: 2,
  rowsTruncated: true,
  rows: [{ id: 'cmp', accountId: 'act_123', spend: 0, actions: [{ type: 'purchase', count: 0 }] }],
  presentation: { headline: 'One row', whyItMatters: 'Partial evidence' },
};
describe('durable report evidence', () => {
  it('uses a stable content reference and preserves omitted-row evidence', () => {
    const a = createGrowthReportEvidence(report, report.capturedAt);
    const b = createGrowthReportEvidence(report, '2026-09-07T00:00:00Z');
    expect(a.evidenceId).toBe(b.evidenceId);
    expect(validateGrowthReportEvidence(a, binding).report).toEqual(report);
  });
  it('rejects tampering and cross-environment retrieval', () => {
    const a = createGrowthReportEvidence(report, report.capturedAt);
    expect(() =>
      validateGrowthReportEvidence({ ...a, report: { ...report, partial: false } }, binding),
    ).toThrow();
    expect(() => validateGrowthReportEvidence(a, { ...binding, environmentId: 'test' })).toThrow();
  });
  it('bounds history without combining snapshots and retrieves exact references', () => {
    const a = createGrowthReportEvidence(report, report.capturedAt);
    const b = createGrowthReportEvidence(
      { ...report, capturedAt: '2026-09-07T00:00:00Z' },
      '2026-09-07T00:00:00Z',
    );
    const value = buildGrowthReportHistory(binding, [a, b], { limit: 1, evidenceId: a.evidenceId });
    expect(value.entries[0]?.evidenceId).toBe(b.evidenceId);
    expect(value.truncated).toBe(true);
    expect(value.selected).toEqual(a);
    expect(() => buildGrowthReportHistory(binding, [a], { evidenceId: 'f'.repeat(64) })).toThrow(
      'NOT_FOUND',
    );
  });
});
