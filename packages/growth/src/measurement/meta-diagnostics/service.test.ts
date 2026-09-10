import { describe, it, expect } from 'vitest';
import { metaDiagnosticObservationSchema } from './contracts.js';
import {
  createMetaDiagnosticEvidence,
  reviewMetaDiagnosticEvidence,
  validateMetaDiagnosticEvidence,
} from './service.js';
const binding = {
  projectId: 'store',
  environmentId: 'test',
  connectionId: 'meta',
  datasetId: '123',
};
const now = new Date('2026-09-06T00:00:00Z');
const observation = () => ({
  schemaVersion: 1,
  provider: 'meta',
  ...binding,
  capturedAt: now.toISOString(),
  window: { startDate: '2026-09-01', endDate: '2026-09-05' },
  source: {
    kind: 'manual-import',
    reference: 'Synthetic Events Manager export',
    verifiedLive: false,
  },
  completeness: 'partial',
  events: [
    {
      name: 'Purchase',
      activity: 'active',
      total: 0,
      channels: ['browser', 'server'],
      issues: [
        {
          code: 'invalid_currency',
          severity: 'error',
          state: 'active',
          explanation: 'Source reported invalid currency.',
          suggestion: {
            owner: 'adopter',
            proposal: 'Inspect the emitted currency against the order currency.',
          },
        },
      ],
    },
  ],
});
describe('Meta diagnostic evidence', () => {
  it('retains zero while leaving missing proprietary scores unknown', () => {
    const evidence = createMetaDiagnosticEvidence(observation(), binding, now);
    const result = reviewMetaDiagnosticEvidence(binding, evidence, {}, now);
    expect(result.verifiedLive).toBe(false);
    expect(result.events[0]?.total).toBe(0);
    expect(result.events[0]?.matchQuality).toBeUndefined();
    expect(result.handoffs[0]).toMatchObject({
      basis: 'imported-suggestion',
      owner: 'adopter',
      verified: false,
    });
  });
  it('rejects foreign datasets and tampered revisions', () => {
    const evidence = createMetaDiagnosticEvidence(observation(), binding, now);
    expect(() =>
      validateMetaDiagnosticEvidence(evidence, { ...binding, datasetId: 'other' }),
    ).toThrow('TARGET_MISMATCH');
    expect(() =>
      validateMetaDiagnosticEvidence({ ...evidence, evidenceId: '0'.repeat(64) }, binding),
    ).toThrow('REVISION_INVALID');
  });
  it('labels stale, future and missing evidence without inventing health', () => {
    const evidence = createMetaDiagnosticEvidence(observation(), binding, now);
    expect(
      reviewMetaDiagnosticEvidence(binding, evidence, {}, new Date('2026-09-08T00:00:00Z'))
        .freshness,
    ).toBe('stale');
    expect(
      reviewMetaDiagnosticEvidence(binding, evidence, {}, new Date('2026-09-05T00:00:00Z'))
        .freshness,
    ).toBe('future');
    expect(reviewMetaDiagnosticEvidence(binding, undefined, {}, now)).toMatchObject({
      freshness: 'missing',
      events: [],
      handoffs: [],
    });
  });
  it('filters exact event names and preserves a missing match rather than creating an event', () => {
    const evidence = createMetaDiagnosticEvidence(observation(), binding, now);
    expect(
      reviewMetaDiagnosticEvidence(binding, evidence, { eventName: 'purchase' }, now).events,
    ).toEqual([]);
    expect(
      reviewMetaDiagnosticEvidence(binding, evidence, { eventName: 'Purchase' }, now).events,
    ).toHaveLength(1);
  });
  it('rejects duplicate events, duplicate issue codes and invalid scores', () => {
    const value = observation();
    expect(() =>
      metaDiagnosticObservationSchema.parse({
        ...value,
        events: [...value.events, ...value.events],
      }),
    ).toThrow();
    expect(() =>
      metaDiagnosticObservationSchema.parse({
        ...value,
        events: [{ ...value.events[0], matchQuality: 11 }],
      }),
    ).toThrow();
    expect(() =>
      metaDiagnosticObservationSchema.parse({
        ...value,
        events: [
          { ...value.events[0], issues: [...value.events[0]!.issues, ...value.events[0]!.issues] },
        ],
      }),
    ).toThrow();
  });
});
