import type { TrackingObservationRecordInput } from './adapter';

export function createCommerceTrackingObservationFixture(
  overrides: Partial<TrackingObservationRecordInput> = {},
): TrackingObservationRecordInput {
  return {
    observationId: 'fixture-commerce-observation-1',
    logicalEventId: 'fixture-commerce-logical-1',
    eventId: 'fixture-commerce-event-1',
    canonicalCorrelationId: 'fixture-commerce-correlation-1',
    transactionReference: 'fixture-commerce-transaction-1',
    eventName: 'commerce_completed',
    conversionId: 'commerce-conversion',
    occurredAt: '2026-08-01T00:00:00.000Z',
    outcome: 'accepted',
    consent: { state: 'granted', categories: ['analytics', 'ads'] },
    parameterEvidence: {
      transactionId: { state: 'present', type: 'string' },
      value: { state: 'present', type: 'number' },
      currency: { state: 'normalized', type: 'string' },
    },
    commerce: { value: 'valid', currency: 'valid', catalog: 'valid' },
    customerFields: {
      email: 'hashed',
      phone: 'normalized',
      country: 'normalized',
    },
    transportFields: {
      fbp: 'present',
      fbc: 'present',
      clientIp: 'present',
      userAgent: 'present',
      sourceUrl: 'present',
    },
    ...overrides,
  };
}

export function createLeadTrackingObservationFixture(
  overrides: Partial<TrackingObservationRecordInput> = {},
): TrackingObservationRecordInput {
  return {
    observationId: 'fixture-lead-observation-1',
    logicalEventId: 'fixture-lead-logical-1',
    eventId: 'fixture-lead-event-1',
    eventName: 'lead_created',
    occurredAt: '2026-08-01T01:00:00.000Z',
    outcome: 'emitted',
    consent: { state: 'granted', categories: ['analytics'] },
    parameterEvidence: {
      formId: { state: 'present', type: 'string' },
    },
    customerFields: { email: 'hashed' },
    transportFields: { userAgent: 'present', sourceUrl: 'present' },
    ...overrides,
  };
}
