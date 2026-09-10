import { describe, expect, it } from 'vitest';
import {
  marketingTrackingObservationArtifactSchema,
  marketingTrackingObservationSchema,
} from '@unisane/web-runtime/contracts';
import { migrateMarketingTrackingObservationArtifactV1 } from './audit-observations.js';

const occurredAt = '2026-08-01T00:00:00.000Z';
const digest = (character: string) => `sha256:${character.repeat(64)}`;

function redactedObservation() {
  return {
    projectId: 'sample',
    observationId: digest('0'),
    logicalEventId: digest('1'),
    eventName: 'purchase_confirmed',
    eventId: digest('2'),
    canonicalCorrelationId: digest('3'),
    transactionReference: digest('4'),
    channel: 'server' as const,
    emitter: 'meta-capi' as const,
    environment: 'production',
    occurredAt,
    outcome: 'accepted' as const,
    attempt: 2,
    consent: { state: 'granted' as const, categories: ['ads' as const] },
    parameterEvidence: {
      value: { state: 'present' as const, type: 'number' as const },
      currency: { state: 'normalized' as const, type: 'string' as const },
    },
    commerce: { value: 'valid' as const, currency: 'valid' as const, catalog: 'valid' as const },
    customerFields: {
      email: 'hashed' as const,
      phone: 'normalized' as const,
      country: 'normalized' as const,
    },
    transportFields: {
      fbp: 'present' as const,
      fbc: 'present' as const,
      clientIp: 'present' as const,
      userAgent: 'present' as const,
      sourceUrl: 'present' as const,
    },
    capture: {
      source: 'outbox-adapter' as const,
      schemaVersion: 2,
      provenance: 'adopter-reported' as const,
      receivedAt: '2026-08-01T00:00:01.000Z',
    },
    providerReference: {
      provider: 'meta',
      resourceType: 'dataset',
      resourceId: 'sha256:provider-resource-digest',
    },
    diagnostics: {
      latencyMs: 240,
      httpStatusClass: '2xx' as const,
      providerCode: 'events-received',
      messageCode: 'accepted',
      traceReference: 'sha256:trace-digest',
      extensions: { receiptState: 'accepted' },
    },
  };
}

describe('Growth tracking observation privacy contract', () => {
  it('accepts bounded status-only customer, transport, commerce, and provider evidence', () => {
    const observation = marketingTrackingObservationSchema.parse(redactedObservation());

    expect(observation.customerFields).toEqual({
      email: 'hashed',
      phone: 'normalized',
      country: 'normalized',
    });
    expect(observation.transportFields.clientIp).toBe('present');
    expect(observation.diagnostics?.httpStatusClass).toBe('2xx');
  });

  it('rejects unrestricted payload copies and raw customer or transport values', () => {
    const observation = redactedObservation();

    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        payload: { email: 'person@example.com' },
      }),
    ).toThrow();
    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        logicalEventId: 'person@example.com',
      }),
    ).toThrow();
    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        logicalEventId: 'private-order-42',
        eventId: 'private-order-event-42',
      }),
    ).toThrow('SHA-256 identity digest');
    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        transportFields: { ...observation.transportFields, clientIp: '203.0.113.42' },
      }),
    ).toThrow();
    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        accessToken: 'secret-provider-token',
      }),
    ).toThrow();
  });

  it('rejects unbounded provider extensions and response bodies', () => {
    const observation = redactedObservation();
    const tooManyExtensions = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`code${index}`, `value${index}`]),
    );

    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        diagnostics: { extensions: tooManyExtensions },
      }),
    ).toThrow('limited to 20 entries');
    expect(() =>
      marketingTrackingObservationSchema.parse({
        ...observation,
        diagnostics: { providerBody: { events_received: 1 } },
      }),
    ).toThrow();
  });

  it('bounds artifact size and timing windows', () => {
    expect(() =>
      marketingTrackingObservationArtifactSchema.parse({
        kind: 'unisane.growth.tracking-observations',
        version: 2,
        projectId: 'sample',
        environment: 'production',
        capturedAt: occurredAt,
        windows: { correlationSeconds: 0 },
        observations: [redactedObservation()],
      }),
    ).toThrow();
  });

  it('migrates legacy values into digests and field states without retaining raw values', () => {
    const migrated = migrateMarketingTrackingObservationArtifactV1(
      {
        kind: 'unisane.growth.tracking-observations',
        version: 1,
        environment: 'production',
        capturedAt: occurredAt,
        observations: [
          {
            eventName: 'purchase_confirmed',
            eventId: 'legacy-order-event-42',
            channel: 'server',
            emitter: 'meta-capi',
            outcome: 'emitted',
            payload: {
              transactionId: 'private-order-42',
              email: 'person@example.com',
              phone: '+8801700000000',
              client_ip_address: '203.0.113.42',
              client_user_agent: 'Example Browser/1.0',
              event_source_url: 'https://shop.example/thank-you',
              value: 250,
              currency: 'BDT',
            },
          },
        ],
      },
      { projectId: 'sample' },
    );
    const serialized = JSON.stringify(migrated);

    expect(serialized).not.toContain('private-order-42');
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('+8801700000000');
    expect(serialized).not.toContain('203.0.113.42');
    expect(serialized).not.toContain('Example Browser/1.0');
    expect(serialized).not.toContain('https://shop.example/thank-you');
    expect(migrated.observations[0]).toMatchObject({
      customerFields: { email: 'present', phone: 'present' },
      transportFields: {
        clientIp: 'present',
        userAgent: 'present',
        sourceUrl: 'present',
      },
      commerce: { value: 'valid', currency: 'valid' },
    });
  });
});
