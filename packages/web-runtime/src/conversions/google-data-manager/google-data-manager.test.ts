import { describe, expect, it, vi } from 'vitest';
import { createGoogleDataManagerTransport, mapGoogleDataManagerEvent, readGoogleDataManagerRequestStatus } from './index';
import type { WebConversionEnvelope } from '../types';
const event: WebConversionEnvelope = { event: 'payment_completed', app_id: 'app', scope_id: 'scope', event_id: 'event', transaction_id: 'actual-payment', occurred_at: '2026-09-12T10:00:00Z', consent: { advertising: 'granted', capturedAt: '2026-09-12T09:00:00Z' }, properties: { gclid: 'click', resumeText: 'must not leave' }, value: 99, currency: 'INR' };
const config = { customerId: '123-456-7890', conversionActions: { payment_completed: '345' }, accessToken: async () => 'temporary-test-only' };
describe('Google Data Manager conversion delivery', () => {
  it('binds the real action, transaction and original timestamp; omits arbitrary product data', () => {
    const payload = mapGoogleDataManagerEvent(config, event)!;
    expect(payload.destinations).toEqual([{ operatingAccount: { accountType: 'GOOGLE_ADS', accountId: '1234567890' }, productDestinationId: '345' }]);
    expect(payload.events[0]).toMatchObject({ transactionId: 'actual-payment', eventTimestamp: '2026-09-12T10:00:00.000Z', conversionValue: 99, currency: 'INR', adIdentifiers: { gclid: 'click' } });
    expect(JSON.stringify(payload)).not.toContain('resumeText');
  });
  it('does not invoke credentials or HTTP without permission or usable matching', async () => {
    const token = vi.fn(); const httpClient = vi.fn();
    const transport = createGoogleDataManagerTransport({ ...config, accessToken: token, httpClient });
    await transport.send({ ...event, consent: { ...event.consent!, advertising: 'denied' } });
    await transport.send({ ...event, properties: {} });
    expect(token).not.toHaveBeenCalled(); expect(httpClient).not.toHaveBeenCalled();
  });
  it('records request receipt without claiming attributed or processed conversions', async () => {
    const httpClient = vi.fn().mockResolvedValue(new Response(JSON.stringify({ requestId: 'google-request' })));
    const result = await createGoogleDataManagerTransport({ ...config, httpClient }).send(event);
    expect(result).toMatchObject({ status: 'accepted', reason: 'ingestion_received', providerReference: 'google-request' });
    expect(result).not.toHaveProperty('acceptedCount');
    expect(httpClient.mock.calls[0]?.[0]).toBe('https://datamanager.googleapis.com/v1/events:ingest');
  });
  it('retries rate limiting with fresh credentials and the same transaction ID', async () => {
    const accessToken = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('rotated');
    const httpClient = vi.fn().mockResolvedValueOnce(new Response('private provider text', { status: 429, headers: { 'Retry-After': '30' } })).mockResolvedValueOnce(new Response(JSON.stringify({ requestId: 'ok' })));
    const transport = createGoogleDataManagerTransport({ ...config, accessToken, httpClient });
    await expect(transport.send(event)).rejects.toMatchObject({ code: 'google_data_manager_http_429', retryAfterMs: 30000, kind: 'retryable' });
    await transport.send(event);
    expect(httpClient.mock.calls[0]?.[1].body).toBe(httpClient.mock.calls[1]?.[1].body);
    expect(httpClient.mock.calls[1]?.[1].headers.Authorization).toBe('Bearer rotated');
  });
  it('does not treat validation-only or malformed success as a successful upload', async () => {
    const httpClient = vi.fn().mockImplementation(async () => new Response('{}'));
    await expect(createGoogleDataManagerTransport({ ...config, httpClient }).send(event)).rejects.toMatchObject({ kind: 'uncertain' });
    expect(await createGoogleDataManagerTransport({ ...config, httpClient, validateOnly: true }).send(event)).toMatchObject({ status: 'skipped', reason: 'validation_only' });
  });
  it('reconciles the recorded provider request through the read-only status endpoint', async () => {
    const httpClient = vi.fn().mockResolvedValue(new Response(JSON.stringify({ requestStatusPerDestination: [{ requestStatus: 'PROCESSING' }] })));
    expect(await readGoogleDataManagerRequestStatus({ ...config, httpClient }, 'request/1')).toEqual([{ requestStatus: 'PROCESSING' }]);
    expect(httpClient.mock.calls[0]?.[0]).toContain('requestStatus:retrieve?requestId=request%2F1');
    expect(httpClient.mock.calls[0]?.[1].method).toBe('GET');
  });
});
