import { hashOpsValue } from '@unisane/ops-engine';
import {
  metaDiagnosticObservationSchema,
  metaDiagnosticEvidenceSchema,
  metaDiagnosticReviewInputSchema,
  metaDiagnosticReviewResultSchema,
  type MetaDiagnosticBinding,
  type MetaDiagnosticReviewInput,
  type MetaDiagnosticEvidence,
} from './contracts.js';
export function validateMetaDiagnosticBinding(
  value: MetaDiagnosticBinding,
  binding: MetaDiagnosticBinding,
) {
  if (
    (['projectId', 'environmentId', 'connectionId', 'datasetId'] as const).some(
      (key) => value[key] !== binding[key],
    )
  )
    throw new Error(
      '[META_DIAGNOSTIC_TARGET_MISMATCH] Diagnostic evidence does not match the selected event source.',
    );
}
export function createMetaDiagnosticEvidence(
  raw: unknown,
  binding: MetaDiagnosticBinding,
  now: Date,
): MetaDiagnosticEvidence {
  const observation = metaDiagnosticObservationSchema.parse(raw);
  validateMetaDiagnosticBinding(observation, binding);
  return metaDiagnosticEvidenceSchema.parse({
    schemaVersion: 1,
    evidenceId: hashOpsValue(observation),
    importedAt: now.toISOString(),
    observation,
  });
}
export function validateMetaDiagnosticEvidence(raw: unknown, binding: MetaDiagnosticBinding) {
  const value = metaDiagnosticEvidenceSchema.parse(raw);
  validateMetaDiagnosticBinding(value.observation, binding);
  if (value.evidenceId !== hashOpsValue(value.observation))
    throw new Error('[META_DIAGNOSTIC_REVISION_INVALID] Diagnostic evidence revision is invalid.');
  return value;
}
export function reviewMetaDiagnosticEvidence(
  binding: MetaDiagnosticBinding,
  raw: unknown | undefined,
  input: MetaDiagnosticReviewInput,
  now: Date,
) {
  const query = metaDiagnosticReviewInputSchema.parse(input);
  const value = raw === undefined ? undefined : validateMetaDiagnosticEvidence(raw, binding);
  const age = value ? now.getTime() - Date.parse(value.observation.capturedAt) : 0;
  const freshness = !value
    ? 'missing'
    : age < 0
      ? 'future'
      : age > query.maxAgeHours * 3600000
        ? 'stale'
        : 'current';
  const matching =
    value?.observation.events.filter(
      (event) => !query.eventName || event.name === query.eventName,
    ) ?? [];
  const events = matching.slice(0, query.limit);
  return metaDiagnosticReviewResultSchema.parse({
    schemaVersion: 1,
    actionId: 'growth.meta.diagnostics.review',
    ...binding,
    evidenceId: value?.evidenceId,
    capturedAt: value?.observation.capturedAt,
    window: value?.observation.window,
    source: value?.observation.source,
    freshness,
    completeness: value?.observation.completeness ?? 'unavailable',
    verifiedLive: false,
    matchedEventCount: matching.length,
    truncated: matching.length > events.length,
    events,
    handoffs: events.flatMap((event) =>
      event.issues
        .filter((issue) => issue.state === 'active')
        .map((issue) => ({
          eventName: event.name,
          issueCode: issue.code,
          owner: issue.suggestion?.owner ?? 'investigation',
          proposal:
            issue.suggestion?.proposal ??
            'Inspect the event trigger and browser/server delivery evidence before preparing a change.',
          basis: issue.suggestion ? 'imported-suggestion' : 'investigation-required',
          verified: false,
        })),
    ),
    message: value
      ? 'Imported historical evidence. Scores and suggestions are source-reported, not verified by Ops. Missing fields remain unknown; current capture time does not prove tracking health.'
      : 'No diagnostic evidence has been imported for this selected event source.',
  });
}
