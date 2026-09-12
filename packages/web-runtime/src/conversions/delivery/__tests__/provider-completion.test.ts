import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  parseConversionRetryAfter,
  resolveConversionRetryDelayMs,
  WebConversionDeliveryError,
} from '../index';
import {
  createGoogleAdsWebConversionTransport,
  hashGoogleAdsEmail,
  hashGoogleAdsPhoneNumber,
} from '../../google-ads';
import { createMetaCapiWebConversionTransport } from '../../meta';
import { createConversionDeliverySubscriber } from '../subscriber';
import {
  createConversionReceiptObservationRecorder,
  createOutboxTrackingObservationAdapter,
  createInMemoryTrackingObservationSink,
} from '../../../observations';

const at = '2026-09-11T00:00:00.000Z';
const envelope = {
  schema_version: 2 as const,
  event: 'lead',
  event_id: 'lead-1',
  app_id: 'app',
  scope_id: 'tenant',
  occurred_at: at,
  consent: { advertising: 'granted' as const, capturedAt: at },
  customer: {
    hashedEmail: 'a'.repeat(64),
    hashedPhone: 'b'.repeat(64),
    clientIpAddress: '192.0.2.1',
    sourceUrl: 'https://example.com/lead',
  },
  value: 10,
  currency: 'USD',
};
const google = {
  customerId: '123',
  developerToken: 'secret',
  accessTokenProvider: () => 'secret',
  conversionActions: { lead: '456' },
};
function partial(code: string) {
  return {
    partialFailureError: {
      details: [
        {
          errors: [
            { errorCode: { conversionUploadError: code }, message: 'private-email@example.com' },
          ],
        },
      ],
    },
    results: [{}],
  };
}

describe('provider completion', () => {
  it('uses typed Google hashes and provider-specific normalization', async () => {
    let payload: Record<string, unknown> = {};
    const transport = createGoogleAdsWebConversionTransport({
      ...google,
      httpClient: async (_url, init) => {
        payload = JSON.parse(init.body).conversions[0];
        return {
          ok: true,
          status: 200,
          json: async () => ({ results: [{ conversionAction: '456' }] }),
        };
      },
    });
    await transport.send(envelope);
    expect(payload.userIdentifiers).toEqual([
      { hashedEmail: 'a'.repeat(64) },
      { hashedPhoneNumber: 'b'.repeat(64) },
    ]);
    expect(hashGoogleAdsEmail('First.Last@gmail.com')).toBe(
      hashGoogleAdsEmail('firstlast@gmail.com'),
    );
    expect(hashGoogleAdsPhoneNumber('+1 (650) 555-1212')).toBe(
      createHash('sha256').update('+16505551212').digest('hex'),
    );
    expect(() => hashGoogleAdsPhoneNumber('01760153160')).toThrow('E.164');
  });
  it.each([
    ['INVALID_USER_IDENTIFIER', 'permanent'],
    ['TOO_RECENT_EVENT', 'retryable'],
    ['NEW_UNKNOWN_ERROR', 'uncertain'],
  ])('classifies structured Google error %s', async (code, kind) => {
    const transport = createGoogleAdsWebConversionTransport({
      ...google,
      httpClient: async () => ({
        ok: true,
        status: 200,
        json: async () => partial(code!),
      }),
    });
    const error = await Promise.resolve(transport.send(envelope)).catch((error: unknown) => error);
    expect(error).toMatchObject({ kind });
    expect(JSON.stringify(error)).not.toContain('private-email');
    if (kind === 'retryable') expect(error).toHaveProperty('retryAfterMs', 21600000);
  });
  it('defers too-recent Google events even when partial failure mode is disabled', async () => {
    const transport = createGoogleAdsWebConversionTransport({
      ...google,
      partialFailure: false,
      httpClient: async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: partial('TOO_RECENT_EVENT').partialFailureError }),
      }),
    });
    await expect(transport.send(envelope)).rejects.toMatchObject({
      kind: 'retryable',
      retryAfterMs: 21600000,
    });
  });
  it('honors rate-limit guidance through Core aggregate errors', async () => {
    const transport = createMetaCapiWebConversionTransport({
      pixelId: '123',
      accessTokenProvider: () => 'secret',
      eventNames: { lead: 'Lead' },
      httpClient: async () => ({
        ok: false,
        status: 429,
        headers: { get: () => '120' },
        json: async () => ({ error: { message: 'secret' } }),
      }),
    });
    const error = await Promise.resolve(transport.send(envelope)).catch((error: unknown) => error);
    expect(error).toMatchObject({ kind: 'retryable', retryAfterMs: 120000 });
    expect(resolveConversionRetryDelayMs(new AggregateError([error]), 1000)).toBe(120000);
    expect(parseConversionRetryAfter('Fri, 11 Sep 2026 00:02:00 GMT', Date.parse(at))).toBe(120000);
    for (const value of ['-1', 'no', '1.2'])
      expect(parseConversionRetryAfter(value)).toBeUndefined();
    expect(
      resolveConversionRetryDelayMs(
        new WebConversionDeliveryError('x', 'permanent', 'x', 9000),
        1000,
      ),
    ).toBe(1000);
  });
  it('records actual attempt, timing, mapped presence and suppression without customer values', async () => {
    const binding = {
      projectId: 'project',
      environment: 'test',
      appId: 'app',
      scopeId: 'tenant',
      provider: 'meta',
      destinationId: '123',
    };
    const sink = createInMemoryTrackingObservationSink({
      projectId: 'project',
      environment: 'test',
    });
    const recorder = createConversionReceiptObservationRecorder(
      createOutboxTrackingObservationAdapter({ projectId: 'project', environment: 'test', sink }),
    );
    let time = Date.parse(at) + 600000;
    let allowed = true;
    const subscriber = createConversionDeliverySubscriber({
      binding,
      now: () => new Date(time),
      isDeliveryAllowed: () => allowed,
      recordReceipt: recorder,
      transport: createMetaCapiWebConversionTransport({
        pixelId: '123',
        accessTokenProvider: () => 'secret',
        eventNames: { lead: 'Lead' },
        httpClient: async () => {
          time += 150;
          return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
        },
      }),
    });
    await subscriber({ version: 1, binding, envelope }, { attempt: 3 });
    const observed = sink.list()[0]!;
    expect(observed).toMatchObject({
      attempt: 3,
      occurredAt: at,
      customerFields: { email: 'hashed', city: 'absent' },
      transportFields: { clientIp: 'present', fbp: 'absent' },
      commerce: { value: 'valid', currency: 'valid' },
      diagnostics: { latencyMs: 150 },
      capture: { receivedAt: '2026-09-11T00:10:00.150Z' },
    });
    expect(JSON.stringify(observed)).not.toContain('192.0.2.1');
    expect(JSON.stringify(observed)).not.toContain('a'.repeat(64));
    allowed = false;
    await subscriber({ version: 1, binding, envelope }, { attempt: 4 });
    expect(sink.list()[1]).toMatchObject({
      outcome: 'suppressed',
      consent: { suppressionReasonCode: 'advertising_not_permitted' },
    });
  });
});
