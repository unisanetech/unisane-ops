import { describe, expect, it, vi } from 'vitest';
import {
  createConversionDeliverySubscriber,
  createReliableConversionPublisher,
  WebConversionDeliveryError,
  createWebConversionDeliveryKey,
  webConversionDeliverySchema,
  migrateWebConversionEnvelope,
} from '../index';
import { createMetaCapiWebConversionTransport } from '../../meta';
import {
  createInMemoryTrackingObservationSink,
  createOutboxTrackingObservationAdapter,
  createConversionReceiptObservationRecorder,
} from '../../../observations';

const at = '2026-09-11T00:00:00.000Z';
const binding = {
  projectId: 'project',
  environment: 'test',
  appId: 'app',
  scopeId: 'tenant',
  provider: 'meta',
  destinationId: '123',
};
function delivery() {
  return webConversionDeliverySchema.parse({
    version: 1,
    binding,
    envelope: {
      schema_version: 2,
      occurred_at: at,
      event: 'purchase_completed',
      event_id: 'paid-1',
      app_id: 'app',
      scope_id: 'tenant',
      consent: { advertising: 'granted', capturedAt: at },
      user_id: 'account-1',
      value: 10,
      currency: 'USD',
      transaction_id: 'payment-1',
      customer: { sourceUrl: 'https://example.com/checkout', fbp: 'fb.1.123.browser' },
      items: [{ item_id: 'sku-1', quantity: 2, price: 5 }],
    },
  });
}
const now = () => new Date(at);

describe('reliable conversion composition', () => {
  it('publishes through the existing transactional runtime without sending before commit', async () => {
    const publishReliable = vi.fn().mockResolvedValue(undefined);
    const publisher = createReliableConversionPublisher({
      config: { appId: 'app' },
      binding,
      publishReliable,
    });
    const transaction = { id: 'transaction' };
    const input = {
      name: 'purchase_completed',
      scopeId: 'tenant',
      transactionId: 'payment-1',
      occurredAt: at,
      consent: { advertising: 'granted' as const, capturedAt: at },
    };
    const first = await publisher.publish(input, { transaction });
    const again = await publisher.publish(input, { transaction });
    expect(first.envelope.event_id).toBe(again.envelope.event_id);
    expect(publishReliable.mock.calls[0]?.[2]).toMatchObject({
      transaction,
      dedupeKey: createWebConversionDeliveryKey(first),
    });
    await expect(
      publisher.publish({ ...input, transactionId: undefined }, { transaction }),
    ).rejects.toThrow('stable');
    await expect(
      publisher.publish({ ...input, occurredAt: undefined }, { transaction }),
    ).rejects.toThrow('occurrence');
  });
  it('keeps project, environment, tenant and destination in the durable identity', () => {
    const original = delivery();
    for (const key of ['projectId', 'environment', 'scopeId', 'destinationId'] as const) {
      const other = structuredClone(original);
      other.binding[key] += '-other';
      expect(createWebConversionDeliveryKey(other)).not.toBe(
        createWebConversionDeliveryKey(original),
      );
    }
  });
  it('retries an uncertain delivery with identical Meta ID and time, then records acceptance in Growth observations', async () => {
    const httpClient = vi
      .fn()
      .mockRejectedValueOnce(new Error('raw-token-must-not-escape'))
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events_received: 1, fbtrace_id: 'trace_1' }),
      });
    const transport = createMetaCapiWebConversionTransport({
      pixelId: '123',
      accessTokenProvider: () => 'secret',
      eventNames: { purchase_completed: 'Purchase' },
      httpClient,
    });
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'project',
      environment: 'test',
      now,
    });
    const recordReceipt = createConversionReceiptObservationRecorder(
      createOutboxTrackingObservationAdapter({
        projectId: 'project',
        environment: 'test',
        sink,
        now,
      }),
    );
    const subscriber = createConversionDeliverySubscriber({
      binding,
      transport,
      isDeliveryAllowed: () => true,
      recordReceipt,
      now,
    });
    await expect(subscriber(delivery(), { attempt: 1 })).rejects.toMatchObject({
      kind: 'uncertain',
      code: 'meta_transport_unavailable',
    });
    await subscriber(delivery(), { attempt: 2 });
    const requests = httpClient.mock.calls.map((call) => JSON.parse(call[1].body));
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[0].data[0]).toMatchObject({
      event_id: 'paid-1',
      event_time: Date.parse(at) / 1000,
      custom_data: { contents: [{ id: 'sku-1', quantity: 2, item_price: 5 }], num_items: 2 },
    });
    expect(sink.list().map((item) => item.outcome)).toEqual(['unknown', 'accepted']);
    expect(JSON.stringify(sink.list())).not.toContain('fb.1.123.browser');
    expect(JSON.stringify(sink.list())).not.toContain('secret');
  });
  it('suppresses withdrawn consent, and rejects old events without a provider call', async () => {
    const send = vi.fn();
    const recordReceipt = vi.fn().mockResolvedValue(undefined);
    const subscriber = createConversionDeliverySubscriber({
      binding,
      transport: { send, destination: { provider: 'meta', destinationId: '123' } },
      recordReceipt,
      isDeliveryAllowed: () => false,
      now,
    });
    await subscriber(delivery(), { attempt: 1 });
    expect(send).not.toHaveBeenCalled();
    expect(recordReceipt.mock.calls[0]?.[0]).toMatchObject({
      outcome: 'suppressed',
      code: 'advertising_not_permitted',
    });
    const oldSubscriber = createConversionDeliverySubscriber({
      binding,
      transport: { send, destination: { provider: 'meta', destinationId: '123' } },
      recordReceipt,
      isDeliveryAllowed: () => true,
      now: () => new Date('2026-09-20'),
      maxEventAgeMs: 86400000,
    });
    await oldSubscriber(delivery(), { attempt: 1 });
    expect(recordReceipt.mock.calls[1]?.[0]).toMatchObject({
      outcome: 'rejected',
      code: 'conversion_too_old',
    });
  });
  it('fails closed for a foreign destination', async () => {
    const send = vi.fn();
    const subscriber = createConversionDeliverySubscriber({
      binding: { ...binding, destinationId: 'other' },
      transport: { send, destination: { provider: 'meta', destinationId: '123' } },
      recordReceipt: async () => {},
      isDeliveryAllowed: () => true,
      now,
    });
    await expect(subscriber(delivery(), { attempt: 1 })).rejects.toMatchObject({
      code: 'conversion_binding_mismatch',
    });
    expect(send).not.toHaveBeenCalled();
  });
  it('never treats a void transport result as accepted', async () => {
    const subscriber = createConversionDeliverySubscriber({
      binding,
      transport: { send() {}, destination: { provider: 'meta', destinationId: '123' } },
      recordReceipt: async () => {},
      isDeliveryAllowed: () => true,
      now,
    });
    await expect(subscriber(delivery(), { attempt: 1 })).rejects.toBeInstanceOf(
      WebConversionDeliveryError,
    );
  });
  it('requires a receipt to be persisted before acknowledging delivery', async () => {
    const subscriber = createConversionDeliverySubscriber({
      binding,
      transport: {
        destination: { provider: 'meta', destinationId: '123' },
        send: () => ({ status: 'accepted', provider: 'meta', acceptedCount: 1 }),
      },
      recordReceipt: async () => {
        throw new Error('store unavailable');
      },
      isDeliveryAllowed: () => true,
      now,
    });
    await expect(subscriber(delivery(), { attempt: 1 })).rejects.toThrow('store unavailable');
  });
  it('migrates recorded events without inventing another identity or occurrence time', () => {
    const original = delivery().envelope;
    const legacy = {
      event: original.event,
      event_id: original.event_id,
      app_id: original.app_id,
      scope_id: original.scope_id,
    };
    const migrated = migrateWebConversionEnvelope(legacy, {
      occurredAt: at,
      consent: original.consent,
    });
    expect(migrated.event_id).toBe(original.event_id);
    expect(migrated.occurred_at).toBe(at);
    expect(() =>
      migrateWebConversionEnvelope(
        { ...legacy, event_id: '' },
        { occurredAt: at, consent: original.consent },
      ),
    ).toThrow('manual reconciliation');
  });
});
