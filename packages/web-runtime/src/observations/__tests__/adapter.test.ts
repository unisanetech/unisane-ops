import { describe, expect, it } from 'vitest';
import {
  createBrowserTrackingObservationAdapter,
  createConsentTrackingObservationAdapter,
  createInMemoryTrackingObservationSink,
  createOutboxTrackingObservationAdapter,
  createServerTrackingObservationAdapter,
  digestTrackingObservationIdentity,
} from '../adapter';
import {
  createCommerceTrackingObservationFixture,
  createLeadTrackingObservationFixture,
} from '../testing';

const capturedAt = new Date('2026-08-01T02:00:00.000Z');
const now = () => capturedAt;

describe('provider-neutral tracking observation adapters', () => {
  it('records portable commerce browser and outbox evidence with hashed identities', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'commerce-shop',
      environment: 'production',
      now,
    });
    const browser = createBrowserTrackingObservationAdapter({
      projectId: 'commerce-shop',
      environment: 'production',
      emitter: 'meta-pixel',
      sink,
      now,
      provenance: 'fixture',
    });
    const outbox = createOutboxTrackingObservationAdapter({
      projectId: 'commerce-shop',
      environment: 'production',
      emitter: 'meta-capi',
      sink,
      now,
      provenance: 'fixture',
    });

    const browserResult = await browser.record(
      createCommerceTrackingObservationFixture({
        observationId: 'commerce-browser-attempt-1',
        outcome: 'emitted',
      }),
    );
    const serverResult = await outbox.record(
      createCommerceTrackingObservationFixture({
        observationId: 'commerce-outbox-attempt-1',
        outcome: 'accepted',
      }),
    );

    expect(browserResult.observation).toMatchObject({
      projectId: 'commerce-shop',
      channel: 'browser',
      capture: { source: 'browser-adapter' },
    });
    expect(serverResult.observation).toMatchObject({
      projectId: 'commerce-shop',
      channel: 'server',
      capture: { source: 'outbox-adapter' },
    });
    expect(browserResult.observation.eventId).toBe(serverResult.observation.eventId);
    expect(browserResult.observation.observationId).not.toBe(
      serverResult.observation.observationId,
    );
    expect(JSON.stringify(sink.artifact())).not.toContain('fixture-commerce-event-1');
    expect(sink.list()).toHaveLength(2);
  });

  it('uses the same contract for an unrelated lead adopter and consent suppression', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'lead-portal',
      environment: 'staging',
      now,
    });
    const server = createServerTrackingObservationAdapter({
      projectId: 'lead-portal',
      environment: 'staging',
      sink,
      now,
      provenance: 'fixture',
    });
    const consent = createConsentTrackingObservationAdapter({
      projectId: 'lead-portal',
      environment: 'staging',
      channel: 'browser',
      emitter: 'web-runtime',
      sink,
      now,
      provenance: 'fixture',
    });

    await server.record(createLeadTrackingObservationFixture());
    await consent.record(
      createLeadTrackingObservationFixture({
        observationId: 'fixture-lead-consent-1',
        eventId: undefined,
        outcome: 'suppressed',
        consent: {
          state: 'denied',
          categories: ['ads'],
          suppressionReasonCode: 'ads-consent-denied',
        },
      }),
    );

    expect(sink.list()).toEqual([
      expect.objectContaining({
        channel: 'server',
        capture: {
          source: 'server-adapter',
          schemaVersion: 2,
          provenance: 'fixture',
          receivedAt: capturedAt.toISOString(),
        },
      }),
      expect.objectContaining({
        channel: 'browser',
        outcome: 'suppressed',
        capture: expect.objectContaining({ source: 'consent-adapter' }),
      }),
    ]);
  });

  it('treats an exact observation replay as idempotent', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'commerce-shop',
      environment: 'production',
      now,
    });
    const adapter = createBrowserTrackingObservationAdapter({
      projectId: 'commerce-shop',
      environment: 'production',
      sink,
      now,
      provenance: 'fixture',
    });
    const input = createCommerceTrackingObservationFixture();

    expect((await adapter.record(input)).result.status).toBe('recorded');
    expect((await adapter.record(input)).result.status).toBe('replayed');
    expect(sink.list()).toHaveLength(1);
  });

  it('rejects an idempotency-key collision with different evidence', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'commerce-shop',
      environment: 'production',
      now,
    });
    const adapter = createBrowserTrackingObservationAdapter({
      projectId: 'commerce-shop',
      environment: 'production',
      sink,
      now,
      provenance: 'fixture',
    });
    const input = createCommerceTrackingObservationFixture({ outcome: 'emitted' });
    await adapter.record(input);

    await expect(
      adapter.record({ ...input, diagnostics: { messageCode: 'different-evidence' } }),
    ).rejects.toThrow('[TRACKING_OBSERVATION_IDEMPOTENCY_COLLISION]');
  });

  it('preserves distinct delivery attempts that share one event identity', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'commerce-shop',
      environment: 'production',
      now,
    });
    const adapter = createOutboxTrackingObservationAdapter({
      projectId: 'commerce-shop',
      environment: 'production',
      sink,
      now,
      provenance: 'fixture',
    });

    await adapter.record(
      createCommerceTrackingObservationFixture({
        observationId: 'outbox-attempt-1',
        outcome: 'retried',
        attempt: 1,
      }),
    );
    await adapter.record(
      createCommerceTrackingObservationFixture({
        observationId: 'outbox-attempt-2',
        outcome: 'accepted',
        attempt: 2,
      }),
    );

    expect(sink.list()).toHaveLength(2);
    expect(new Set(sink.list().map((observation) => observation.eventId)).size).toBe(1);
    expect(new Set(sink.list().map((observation) => observation.observationId)).size).toBe(2);
  });

  it('rejects project or environment crossover at the sink boundary', async () => {
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'expected-project',
      environment: 'production',
      now,
    });
    const wrongProject = createBrowserTrackingObservationAdapter({
      projectId: 'other-project',
      environment: 'production',
      sink,
      now,
      provenance: 'fixture',
    });
    const wrongEnvironment = createBrowserTrackingObservationAdapter({
      projectId: 'expected-project',
      environment: 'staging',
      sink,
      now,
      provenance: 'fixture',
    });

    await expect(wrongProject.record(createLeadTrackingObservationFixture())).rejects.toThrow(
      'Observation projectId must match',
    );
    await expect(wrongEnvironment.record(createLeadTrackingObservationFixture())).rejects.toThrow(
      'Observation environment must match',
    );
  });

  it('preserves a valid digest and never emits the raw identity', async () => {
    const digest = `sha256:${'a'.repeat(64)}`;

    expect(await digestTrackingObservationIdentity(digest)).toBe(digest);
    expect(await digestTrackingObservationIdentity('private-order-42')).toMatch(
      /^sha256:[a-f0-9]{64}$/,
    );
  });
});
