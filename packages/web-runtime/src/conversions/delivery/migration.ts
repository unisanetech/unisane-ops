import type { WebConversionConsent, WebConversionEnvelope } from '../types';

export function migrateWebConversionEnvelope(
  input: WebConversionEnvelope,
  evidence: {
    occurredAt: string;
    consent: WebConversionConsent;
  },
): WebConversionEnvelope {
  if (!input.event_id?.trim())
    throw new Error('Persisted conversions without an event ID require manual reconciliation.');
  if (!Number.isFinite(Date.parse(evidence.occurredAt)))
    throw new Error('Historical occurrence time is required.');
  if (input.schema_version === 2) return structuredClone(input);
  return {
    ...structuredClone(input),
    schema_version: 2,
    occurred_at: new Date(evidence.occurredAt).toISOString(),
    consent: { ...evidence.consent },
  };
}
