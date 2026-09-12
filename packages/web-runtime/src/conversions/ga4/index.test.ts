import { describe, expect, it, vi } from 'vitest';
import { createGa4ConversionTransport, mapGa4Conversion, type Ga4ConversionConfig } from './index';
import { createConversionDeliverySubscriber } from '../delivery/subscriber';
import type { WebConversionEnvelope } from '../types';

const at = '2026-09-12T12:00:00.000Z';
const config: Ga4ConversionConfig = { measurementId: 'G-TEST123', apiSecret: () => 'synthetic-secret',
  eventNames: { paid: 'purchase', signup: 'sign_up' }, now: () => new Date(at) };
const event: WebConversionEnvelope = { schema_version: 2, event: 'paid', event_id: 'paid-1', app_id: 'app', scope_id: 'scope',
  occurred_at: at, transaction_id: 'payment-1', value: 299, currency: 'INR',
  consent: { analytics: 'granted', advertising: 'denied', capturedAt: at },
  analytics: { clientId: '123456.1789200000', sessionId: '1789200000', capturedAt: at },
  customer: { hashedEmail: 'must-not-forward' }, properties: { email: 'private@example.test', description: 'private resume' } };

describe('GA4 confirmed server measurement', () => {
  it('maps confirmed money/time with analytics-only consent and drops arbitrary properties', () => {
    const payload = mapGa4Conversion(config, event)!;
    expect(payload).toMatchObject({ client_id: event.analytics!.clientId, timestamp_micros: Date.parse(at) * 1000,
      consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
      events: [{ name: 'purchase', params: { transaction_id: 'payment-1', value: 299, currency: 'INR', event_id: 'paid-1' } }] });
    expect(JSON.stringify(payload)).not.toMatch(/private|must-not-forward|user_id/);
    expect(mapGa4Conversion(config, { ...event, consent: { ...event.consent!, analytics: 'denied', advertising: 'granted' } })).toBeNull();
    expect(mapGa4Conversion(config, { ...event, analytics: undefined })).toBeNull();
    expect(mapGa4Conversion(config, { ...event, event: 'unmapped' })).toBeNull();
  });
  it('does not invent engagement duration or reuse an old checkout session for a renewal', () => {
    const payload = mapGa4Conversion(config, { ...event, analytics: { ...event.analytics!, capturedAt: '2026-09-01T00:00:00.000Z' } })!;
    expect(payload.events[0]!.params).not.toHaveProperty('session_id');
    expect(payload.events[0]!.params).not.toHaveProperty('engagement_time_msec');
  });
  it('rejects incomplete money, non-browser identities and expired events', () => {
    expect(() => mapGa4Conversion(config, { ...event, transaction_id: undefined })).toThrow('transaction');
    expect(() => mapGa4Conversion(config, { ...event, analytics: { ...event.analytics!, clientId: 'email@example.test' } })).toThrow('identity');
    expect(() => mapGa4Conversion(config, { ...event, occurred_at: '2026-09-01T00:00:00Z' })).toThrow('window');
  });
  it('records only HTTP acknowledgement; validation mode never counts delivery', async () => {
    const httpClient = vi.fn(async () => new Response(null, { status: 204 }));
    const transport = createGa4ConversionTransport({ ...config, httpClient });
    expect(await transport.send(event)).toEqual({ status: 'accepted', provider: 'ga4', reason: 'http_acknowledged' });
    const validate = createGa4ConversionTransport({ ...config, validateOnly: true,
      httpClient: vi.fn(async () => Response.json({ validationMessages: [] })) });
    expect(await validate.send(event)).toMatchObject({ status: 'skipped', reason: 'validation_only' });
  });
  it('sanitizes failures and preserves the payload when a retry is required', async () => {
    const httpClient = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '30' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const transport = createGa4ConversionTransport({ ...config, httpClient });
    await expect(transport.send(event)).rejects.toMatchObject({ code: 'ga4_http_429', kind: 'retryable', retryAfterMs: 30000 });
    await transport.send(event);
    expect(httpClient.mock.calls[0]?.[1]?.body).toEqual(httpClient.mock.calls[1]?.[1]?.body);
    await expect(createGa4ConversionTransport({ ...config, httpClient: vi.fn().mockRejectedValue(new Error('synthetic-secret')) }).send(event))
      .rejects.toThrow('GA4 delivery could not be confirmed');
  });
  it('shared durable delivery checks analytics permission independently and rechecks withdrawal', async () => {
    const transport = createGa4ConversionTransport({ ...config, httpClient: vi.fn(async () => new Response(null, { status: 204 })) });
    const binding = { projectId: 'project', environment: 'test', appId: 'app', scopeId: 'scope', provider: 'ga4', destinationId: 'G-TEST123' };
    const recordReceipt = vi.fn(); let allowed = true;
    const subscriber = createConversionDeliverySubscriber({ binding, transport, recordReceipt, isDeliveryAllowed: () => allowed, now: config.now });
    await subscriber({ version: 1, binding, envelope: event }, { attempt: 1 });
    expect(recordReceipt.mock.calls[0]?.[0]).toMatchObject({ outcome: 'accepted', advertising: 'denied', analytics: 'granted', consentPurpose: 'analytics' });
    allowed = false;
    await subscriber({ version: 1, binding, envelope: event }, { attempt: 2 });
    expect(recordReceipt.mock.calls[1]?.[0]).toMatchObject({ outcome: 'suppressed', analytics: 'denied', code: 'analytics_not_permitted' });
  });
});
