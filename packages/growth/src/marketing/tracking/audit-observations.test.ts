import { describe, expect, it } from 'vitest';
import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import { marketingConversionRegistrySchema } from '../schema/conversion-registry.js';
import { marketingEventRegistrySchema } from '../schema/event-registry.js';
import { detectMarketingTrackingEmitters } from './audit-emitters.js';
import {
  marketingTrackingObservationArtifactSchema,
  reconcileMarketingTrackingObservations,
} from './audit-observations.js';

const events = marketingEventRegistrySchema.parse({
  version: 1,
  platformId: 'sample',
  events: [
    {
      id: 'lead-created',
      name: 'lead_created',
      owner: 'sample',
      source: 'browser',
      lifecycle: 'lead',
      requiredProperties: [{ name: 'emailHash', type: 'string' }],
      consent: { required: true, categories: ['analytics', 'ads'] },
      eventIdRule: 'one browser event id',
      dedupeRule: 'dedupe by event id',
      mappings: { gtm: { dataLayerEvent: 'lead_created' } },
    },
    {
      id: 'purchase-confirmed',
      name: 'purchase_confirmed',
      owner: 'sample',
      source: 'server',
      lifecycle: 'purchase',
      requiredProperties: [
        { name: 'transactionId', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'currency', type: 'string' },
      ],
      consent: { required: true, categories: ['analytics', 'ads'] },
      eventIdRule: 'one server event id',
      transactionIdRule: 'order id',
      valueRule: 'order total',
      currencyRule: 'order currency',
      dedupeRule: 'dedupe by transaction id',
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

describe('Growth tracking observation reconciliation', () => {
  it('normalizes duplicate, consent, payload, parameter, and environment failures', () => {
    const artifact = marketingTrackingObservationArtifactSchema.parse({
      kind: 'unisane.growth.tracking-observations',
      version: 1,
      environment: 'production',
      capturedAt: '2026-07-31T00:00:00.000Z',
      observations: [
        {
          eventName: 'lead_created',
          eventId: 'evt-1',
          channel: 'browser',
          emitter: 'web-runtime',
          outcome: 'emitted',
          payload: { emailHash: 'hash' },
        },
        {
          eventName: 'lead_created',
          eventId: 'evt-1',
          channel: 'browser',
          emitter: 'gtag',
          outcome: 'emitted',
          payload: {},
        },
        {
          eventName: 'lead_created',
          eventId: 'evt-2',
          channel: 'browser',
          emitter: 'gtm',
          outcome: 'suppressed',
          reason: 'Ads consent was denied.',
          payload: { emailHash: 'hash' },
        },
        {
          eventName: 'purchase_confirmed',
          eventId: 'evt-3',
          conversionId: 'purchase',
          channel: 'server',
          emitter: 'meta-capi',
          environment: 'staging',
          outcome: 'emitted',
          payload: { transactionId: 'order-1', value: '25' },
        },
      ],
    });

    const result = reconcileMarketingTrackingObservations({
      registries,
      loaded: { path: '/workspace/ops/growth/tracking-observations.json', artifact },
      environment: 'production',
    });

    expect(result.coverage).toMatchObject({
      expectedEventCount: 2,
      observedEventCount: 2,
      expectedConversionCount: 1,
      observedConversionCount: 1,
      observationCount: 4,
    });
    expect(new Set(result.findings.map((finding) => finding.category))).toEqual(
      new Set([
        'duplicate-event',
        'consent-suppression',
        'environment-mismatch',
        'invalid-payload',
        'missing-parameter',
      ]),
    );
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
