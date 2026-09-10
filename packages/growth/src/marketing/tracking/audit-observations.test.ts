import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import { marketingConversionRegistrySchema } from '../schema/conversion-registry.js';
import { marketingEventRegistrySchema } from '../schema/event-registry.js';
import { detectMarketingTrackingEmitters } from './audit-emitters.js';
import {
  loadMarketingTrackingObservations,
  marketingTrackingObservationArtifactSchema,
  migrateMarketingTrackingObservationArtifactV1,
  reconcileMarketingTrackingObservations,
  type MarketingTrackingObservation,
} from './audit-observations.js';

const events = marketingEventRegistrySchema.parse({
  version: 2,
  platformId: 'sample',
  events: [
    {
      id: 'lead-created',
      name: 'lead_created',
      owner: 'sample',
      deliveryExpectation: 'browser-only',
      expectedEmitters: { browser: ['web-runtime'] },
      lifecycle: 'lead',
      requiredProperties: [{ name: 'emailHash', type: 'string' }],
      consent: { required: true, categories: ['analytics', 'ads'] },
      eventIdRule: 'one browser event id',
      logicalEventIdRule: 'one logical lead id',
      dedupeRule: 'dedupe by event id',
      mappings: { gtm: { dataLayerEvent: 'lead_created' } },
    },
    {
      id: 'purchase-confirmed',
      name: 'purchase_confirmed',
      owner: 'sample',
      deliveryExpectation: 'browser-and-server',
      expectedEmitters: { browser: ['meta-pixel'], server: ['meta-capi'] },
      lifecycle: 'purchase',
      requiredProperties: [
        { name: 'transactionId', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'currency', type: 'string' },
      ],
      consent: { required: true, categories: ['analytics', 'ads'] },
      eventIdRule: 'one shared browser and server event id',
      logicalEventIdRule: 'one stable order correlation',
      canonicalCorrelationRule: 'order id',
      transactionIdRule: 'order id',
      valueRule: 'order total',
      currencyRule: 'order currency',
      dedupeRule: 'browser and server share the event id',
      mappings: {},
    },
  ],
});

const conversions = marketingConversionRegistrySchema.parse({
  version: 1,
  platformId: 'sample',
  conversions: [
    {
      id: 'purchase',
      name: 'Purchase',
      owner: 'sample',
      sourceEventId: 'purchase-confirmed',
      lifecycle: 'purchase',
      goal: 'purchase',
      confirmationSource: 'server',
      eventIdRule: 'source event id',
      transactionIdRule: 'order id',
      valueRule: 'order total',
      currencyRule: 'order currency',
      dedupeRule: 'transaction id',
      mappings: { meta: { pixelEventName: 'Purchase', capiEventName: 'Purchase' } },
      reportingGoal: 'Revenue',
    },
  ],
});

const registries: LoadedMarketingRegistries = {
  events: { path: '/workspace/ops/growth/events.json', value: events },
  conversions: { path: '/workspace/ops/growth/conversions.json', value: conversions },
};

const occurredAt = '2026-07-31T00:00:00.000Z';
const receivedAt = '2026-07-31T00:00:01.000Z';
const auditNow = new Date('2026-07-31T00:10:00.000Z');
const digest = (character: string) => `sha256:${character.repeat(64)}`;
const purchaseParameterEvidence = {
  transactionId: { state: 'present' as const, type: 'string' as const },
  value: { state: 'present' as const, type: 'number' as const },
  currency: { state: 'normalized' as const, type: 'string' as const },
};

function purchaseObservation(
  input: Partial<MarketingTrackingObservation> &
    Pick<MarketingTrackingObservation, 'channel' | 'emitter' | 'outcome'>,
): MarketingTrackingObservation {
  return {
    projectId: 'sample',
    observationId: digest('8'),
    logicalEventId: digest('1'),
    eventName: 'purchase_confirmed',
    eventId: digest('2'),
    environment: 'production',
    occurredAt,
    attempt: 1,
    consent: { state: 'granted', categories: ['analytics', 'ads'] },
    parameterEvidence: purchaseParameterEvidence,
    commerce: { value: 'valid', currency: 'valid', catalog: 'present' },
    customerFields: {},
    transportFields: {},
    capture: {
      source: input.channel === 'browser' ? 'browser-adapter' : 'server-adapter',
      schemaVersion: 2,
      provenance: 'fixture',
      receivedAt,
    },
    ...input,
  };
}

function reconcile(
  observations: MarketingTrackingObservation[],
  options: {
    now?: Date;
    capturedAt?: string;
    windows?: {
      correlationSeconds?: number;
      deliveryFreshnessSeconds?: number;
      evidenceFreshnessSeconds?: number;
    };
  } = {},
) {
  const artifact = marketingTrackingObservationArtifactSchema.parse({
    kind: 'unisane.growth.tracking-observations',
    version: 2,
    projectId: 'sample',
    environment: 'production',
    capturedAt: options.capturedAt ?? receivedAt,
    windows: options.windows ?? {},
    observations,
  });
  return reconcileMarketingTrackingObservations({
    registries,
    loaded: { path: '/workspace/ops/growth/tracking-observations.json', artifact },
    projectId: 'sample',
    environment: 'production',
    now: options.now ?? auditNow,
  });
}

describe('Growth tracking observation v2 reconciliation', () => {
  it('accepts a declared browser-only event without requiring a server pair', () => {
    const result = reconcile([
      {
        projectId: 'sample',
        observationId: digest('c'),
        logicalEventId: digest('a'),
        eventName: 'lead_created',
        eventId: digest('b'),
        channel: 'browser',
        emitter: 'web-runtime',
        environment: 'production',
        occurredAt,
        outcome: 'emitted',
        attempt: 1,
        consent: { state: 'granted', categories: ['analytics', 'ads'] },
        parameterEvidence: {
          emailHash: { state: 'hashed', type: 'string' },
        },
        commerce: {
          value: 'not-applicable',
          currency: 'not-applicable',
          catalog: 'not-applicable',
        },
        customerFields: { email: 'hashed' },
        transportFields: {},
        capture: {
          source: 'browser-adapter',
          schemaVersion: 2,
          provenance: 'fixture',
          receivedAt,
        },
      },
    ]);

    expect(result.coverage).toMatchObject({
      observedLogicalEventCount: 1,
      deduplicationFailureCount: 0,
      missingChannelCount: 0,
    });
  });

  it('classifies one browser and one accepted server delivery with the same id as valid', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
        conversionId: 'purchase',
      }),
    ]);

    expect(result.coverage).toMatchObject({
      expectedDualDeliveryEventCount: 1,
      observedLogicalEventCount: 1,
      validDeduplicationPairCount: 1,
      deduplicationFailureCount: 0,
      browserDuplicateCount: 0,
      serverDuplicateCount: 0,
      eventIdCollisionCount: 0,
      missingChannelCount: 0,
    });
    expect(result.findings.map((finding) => finding.category)).not.toContain('duplicate-event');
  });

  it('reports different browser and server ids as a deduplication failure', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
        eventId: digest('3'),
      }),
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 0,
      deduplicationFailureCount: 1,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'deduplication-failure', severity: 'error' }),
    );
  });

  it('reports repeated browser deliveries separately from a valid pair', () => {
    const browser = purchaseObservation({
      channel: 'browser',
      emitter: 'meta-pixel',
      outcome: 'emitted',
    });
    const result = reconcile([
      browser,
      { ...browser },
      purchaseObservation({ channel: 'server', emitter: 'meta-capi', outcome: 'accepted' }),
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 0,
      browserDuplicateCount: 1,
      deduplicationFailureCount: 1,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        category: 'duplicate-event',
        channel: 'browser',
        severity: 'error',
      }),
    );
  });

  it('reports multiple accepted server deliveries as a server duplicate', () => {
    const server = purchaseObservation({
      channel: 'server',
      emitter: 'meta-capi',
      outcome: 'accepted',
    });
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      server,
      { ...server, attempt: 2 },
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 0,
      serverDuplicateCount: 1,
      deduplicationFailureCount: 1,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        category: 'retry-leak',
        channel: 'server',
        severity: 'error',
      }),
    );
  });

  it('accepts stable server retries only when one provider acceptance is recorded', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'retried',
        attempt: 1,
      }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'retried',
        attempt: 2,
      }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
        attempt: 3,
      }),
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 1,
      stableServerRetryCount: 1,
      serverDuplicateCount: 0,
      deduplicationFailureCount: 0,
    });
  });

  it('reports an event id change during server retries as a retry leak', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'retried',
        attempt: 1,
      }),
      purchaseObservation({
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
        attempt: 2,
        eventId: digest('3'),
      }),
    ]);

    expect(result.coverage).toMatchObject({
      serverDuplicateCount: 1,
      deduplicationFailureCount: 1,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'retry-leak', severity: 'error' }),
    );
  });

  it('reports event id reuse across different logical events as a collision', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
      purchaseObservation({ channel: 'server', emitter: 'meta-capi', outcome: 'accepted' }),
      purchaseObservation({
        logicalEventId: digest('3'),
        channel: 'browser',
        emitter: 'meta-pixel',
        outcome: 'emitted',
      }),
      purchaseObservation({
        logicalEventId: digest('3'),
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
      }),
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 0,
      eventIdCollisionCount: 1,
      deduplicationFailureCount: 2,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'event-id-collision', severity: 'error' }),
    );
  });

  it('reports a missing required delivery channel without calling it a duplicate', () => {
    const result = reconcile([
      purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
    ]);

    expect(result.coverage).toMatchObject({
      validDeduplicationPairCount: 0,
      missingChannelCount: 1,
      deduplicationFailureCount: 1,
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'missing-channel', channel: 'server' }),
    );
  });

  it('keeps a missing channel pending while the delivery freshness window remains open', () => {
    const result = reconcile(
      [purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' })],
      { now: new Date('2026-07-31T00:02:00.000Z') },
    );

    expect(result.coverage).toMatchObject({
      missingChannelCount: 0,
      pendingFreshnessCount: 1,
      deduplicationFailureCount: 0,
    });
    expect(result.findings.map((finding) => finding.category)).not.toContain('missing-channel');
  });

  it('separates repeated logical identities into bounded occurrence windows', () => {
    const secondOccurredAt = '2026-07-31T01:00:00.000Z';
    const secondReceivedAt = '2026-07-31T01:00:01.000Z';
    const secondCapture = {
      source: 'browser-adapter' as const,
      schemaVersion: 2,
      provenance: 'fixture' as const,
      receivedAt: secondReceivedAt,
    };
    const result = reconcile(
      [
        purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
        purchaseObservation({ channel: 'server', emitter: 'meta-capi', outcome: 'accepted' }),
        purchaseObservation({
          channel: 'browser',
          emitter: 'meta-pixel',
          outcome: 'emitted',
          eventId: digest('4'),
          occurredAt: secondOccurredAt,
          capture: secondCapture,
        }),
        purchaseObservation({
          channel: 'server',
          emitter: 'meta-capi',
          outcome: 'accepted',
          eventId: digest('4'),
          occurredAt: secondOccurredAt,
          capture: { ...secondCapture, source: 'server-adapter' },
        }),
      ],
      {
        capturedAt: secondReceivedAt,
        now: new Date('2026-07-31T01:10:00.000Z'),
        windows: { correlationSeconds: 1_800 },
      },
    );

    expect(result.coverage).toMatchObject({
      observedLogicalEventCount: 2,
      validDeduplicationPairCount: 2,
      browserDuplicateCount: 0,
      serverDuplicateCount: 0,
      eventIdCollisionCount: 0,
    });
  });

  it('uses canonical correlation to separate concurrent logical event groups', () => {
    const first = {
      logicalEventId: digest('5'),
      canonicalCorrelationId: digest('a'),
      eventId: digest('6'),
    };
    const second = {
      logicalEventId: digest('5'),
      canonicalCorrelationId: digest('b'),
      eventId: digest('7'),
    };
    const result = reconcile([
      purchaseObservation({
        ...first,
        channel: 'browser',
        emitter: 'meta-pixel',
        outcome: 'emitted',
      }),
      purchaseObservation({
        ...first,
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
      }),
      purchaseObservation({
        ...second,
        channel: 'browser',
        emitter: 'meta-pixel',
        outcome: 'emitted',
      }),
      purchaseObservation({
        ...second,
        channel: 'server',
        emitter: 'meta-capi',
        outcome: 'accepted',
      }),
    ]);

    expect(result.coverage).toMatchObject({
      observedLogicalEventCount: 2,
      validDeduplicationPairCount: 2,
      browserDuplicateCount: 0,
      serverDuplicateCount: 0,
    });
  });

  it('marks an expired observation artifact as stale evidence', () => {
    const result = reconcile(
      [
        purchaseObservation({ channel: 'browser', emitter: 'meta-pixel', outcome: 'emitted' }),
        purchaseObservation({ channel: 'server', emitter: 'meta-capi', outcome: 'accepted' }),
      ],
      {
        now: new Date('2026-08-01T00:00:02.000Z'),
        windows: { evidenceFreshnessSeconds: 86_400 },
      },
    );

    expect(result).toMatchObject({
      evidenceFreshness: 'stale',
      coverage: { staleEvidenceCount: 1 },
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'stale-evidence', severity: 'warning' }),
    );
  });

  it('rejects observation evidence captured for another project', () => {
    const artifact = marketingTrackingObservationArtifactSchema.parse({
      kind: 'unisane.growth.tracking-observations',
      version: 2,
      projectId: 'other-project',
      environment: 'production',
      capturedAt: receivedAt,
      observations: [],
    });
    const result = reconcileMarketingTrackingObservations({
      registries,
      loaded: { path: '/workspace/ops/growth/tracking-observations.json', artifact },
      projectId: 'sample',
      environment: 'production',
      now: auditNow,
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({ category: 'project-mismatch', severity: 'error' }),
    );
  });

  it('normalizes consent, payload, environment, and emitter failures', () => {
    const artifact = marketingTrackingObservationArtifactSchema.parse({
      kind: 'unisane.growth.tracking-observations',
      version: 2,
      projectId: 'sample',
      environment: 'staging',
      capturedAt: '2026-07-31T00:00:00.000Z',
      observations: [
        {
          projectId: 'sample',
          observationId: digest('c'),
          logicalEventId: digest('a'),
          eventName: 'lead_created',
          eventId: digest('b'),
          channel: 'browser',
          emitter: 'gtm',
          environment: 'staging',
          occurredAt,
          outcome: 'suppressed',
          consent: {
            state: 'denied',
            categories: ['ads'],
            suppressionReasonCode: 'ads-consent-denied',
          },
          parameterEvidence: {},
          commerce: {
            value: 'not-applicable',
            currency: 'not-applicable',
            catalog: 'not-applicable',
          },
          customerFields: {},
          transportFields: {},
          capture: {
            source: 'consent-adapter',
            schemaVersion: 2,
            provenance: 'fixture',
            receivedAt,
          },
        },
      ],
    });
    const result = reconcileMarketingTrackingObservations({
      registries,
      loaded: { path: '/workspace/ops/growth/tracking-observations.json', artifact },
      projectId: 'sample',
      environment: 'production',
      now: auditNow,
    });

    expect(new Set(result.findings.map((finding) => finding.category))).toEqual(
      expect.objectContaining(
        new Set([
          'consent-suppression',
          'environment-mismatch',
          'missing-parameter',
          'unexpected-emitter',
        ]),
      ),
    );
  });

  it('migrates version 1 once and rejects it during ordinary loading', () => {
    const legacy = {
      kind: 'unisane.growth.tracking-observations',
      version: 1,
      environment: 'production',
      capturedAt: '2026-07-31T00:00:00.000Z',
      observations: [
        {
          eventName: 'purchase_confirmed',
          eventId: 'event-order-1',
          channel: 'server',
          emitter: 'meta-capi',
          outcome: 'emitted',
          payload: { transactionId: 'order-1', value: 25, currency: 'BDT' },
        },
      ],
    };
    const migrated = migrateMarketingTrackingObservationArtifactV1(legacy, {
      projectId: 'sample',
    });

    expect(migrated).toMatchObject({
      version: 2,
      projectId: 'sample',
      observations: [
        {
          projectId: 'sample',
          observationId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          logicalEventId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          eventId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          environment: 'production',
          attempt: 1,
          parameterEvidence: {
            transactionId: { state: 'present', type: 'string' },
            value: { state: 'present', type: 'number' },
            currency: { state: 'present', type: 'string' },
          },
          customerFields: {},
          transportFields: {},
        },
      ],
    });
    expect(() =>
      migrateMarketingTrackingObservationArtifactV1(
        {
          ...legacy,
          observations: [
            {
              eventName: 'lead_created',
              channel: 'browser',
              emitter: 'web-runtime',
              outcome: 'suppressed',
              payload: {},
            },
          ],
        },
        { projectId: 'sample' },
      ),
    ).toThrow();

    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-growth-observations-'));
    try {
      writeFileSync(path.join(cwd, 'observations.json'), JSON.stringify(legacy));
      expect(() => loadMarketingTrackingObservations(cwd, 'observations.json')).toThrow(
        '[MARKETING_TRACKING_OBSERVATIONS_V1_RETIRED]',
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('detects direct emitters competing with Web Runtime', () => {
    const result = detectMarketingTrackingEmitters({
      cwd: '/workspace',
      gtmManifestPath: 'ops/growth/tag-manager.ts',
      observedEmitterIds: [],
      files: [
        {
          path: '/workspace/src/tracking.ts',
          source:
            "import '@unisane/web-runtime/tracking'; window.gtag('event', 'lead_created'); window.fbq('track', 'Lead');",
        },
      ],
    });

    expect(result.emitters.map((emitter) => emitter.id)).toEqual([
      'web-runtime',
      'gtag',
      'meta-pixel',
    ]);
    expect(result.findings).toEqual([
      expect.objectContaining({
        category: 'competing-emitter',
        severity: 'error',
      }),
    ]);
  });
});
