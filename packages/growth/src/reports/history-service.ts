import { hashOpsValue } from '@unisane/ops-engine';
import { growthReportReadOutputSchema, type GrowthReportBinding } from './contracts.js';
import {
  growthReportEvidenceSchema,
  growthReportHistoryInputSchema,
  growthReportHistoryResultSchema,
  type GrowthReportEvidence,
  type GrowthReportHistoryInput,
  type GrowthReportHistoryResult,
} from './history.js';
export function createGrowthReportEvidence(
  reportInput: unknown,
  savedAt: string,
): GrowthReportEvidence {
  const report = growthReportReadOutputSchema.parse(reportInput);
  return growthReportEvidenceSchema.parse({
    schemaVersion: 1,
    kind: 'growth.report-evidence',
    evidenceId: hashOpsValue(report),
    savedAt,
    report,
  });
}
export function validateGrowthReportEvidence(
  input: unknown,
  binding: GrowthReportBinding,
): GrowthReportEvidence {
  const value = growthReportEvidenceSchema.parse(input);
  if (
    value.evidenceId !== hashOpsValue(value.report) ||
    (['projectId', 'environmentId', 'connectionId', 'accountId'] as const).some(
      (key) => value.report[key] !== binding[key],
    ) ||
    value.report.rows.some((row) => row.accountId !== binding.accountId)
  )
    throw new Error(
      '[GROWTH_REPORT_EVIDENCE_INVALID] Report evidence has an invalid revision or target.',
    );
  return value;
}
export function buildGrowthReportHistory(
  binding: GrowthReportBinding,
  raw: unknown[],
  input: GrowthReportHistoryInput,
): GrowthReportHistoryResult {
  const query = growthReportHistoryInputSchema.parse(input);
  const records = raw
    .map((value) => validateGrowthReportEvidence(value, binding))
    .filter((value) => !query.reportType || value.report.reportType === query.reportType)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt) || a.evidenceId.localeCompare(b.evidenceId));
  const selected = query.evidenceId
    ? records.find((record) => record.evidenceId === query.evidenceId)
    : undefined;
  if (query.evidenceId && !selected)
    throw new Error(
      '[GROWTH_REPORT_EVIDENCE_NOT_FOUND] No report matches this reference and selected account.',
    );
  return growthReportHistoryResultSchema.parse({
    schemaVersion: 1,
    actionId: 'growth.reports.history',
    ...binding,
    truncated: records.length > query.limit,
    entries: records
      .slice(0, query.limit)
      .map(({ evidenceId, savedAt, report }) => ({
        evidenceId,
        savedAt,
        capturedAt: report.capturedAt,
        reportType: report.reportType,
        startDate: report.startDate,
        endDate: report.endDate,
        partial: report.partial,
        rowsTruncated: report.rowsTruncated,
        storedRowCount: report.rows.length,
      })),
    ...(selected ? { selected } : {}),
  });
}
