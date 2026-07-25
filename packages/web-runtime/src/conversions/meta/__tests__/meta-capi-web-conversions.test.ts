import { describe, expect, it, vi } from 'vitest';
import type { WebConversionEnvelope } from '../../types';
import {
  createMetaCapiWebConversionTransport,
  hashMetaCapiEmail,
  mapWebConversionEnvelopeToMetaCapiEvent,
  MetaCapiWebConversionUploadError,
  uploadMetaCapiEvents,
} from '../index';

function createEnvelope(overrides: Partial<WebConversionEnvelope> = {}): WebConversionEnvelope {
  return {
    event: 'purchase_completed',
    app_id: 'commerce',
    scope_id: 'scope_1',
    user_id: 'user_1',
    event_id: 'evt_1',
    transaction_id: 'order_1',
    value: 49,
    currency: 'USD',
    properties: {
      fbp: 'fb.1.123.abc',
      fbc: 'fb.1.123.click',
      page_location: 'https://example.com/pricing',
    },
    ...overrides,
  };
}

describe('meta capi web conversion adapter', () => {
  it('maps canonical server envelopes to Meta CAPI events', () => {
    const event = mapWebConversionEnvelopeToMetaCapiEvent({
      envelope: createEnvelope({
        properties: {
          hashedEmail: hashMetaCapiEmail(' Buyer@Example.COM '),
          fbp: 'fb.1.123.abc',
          clientUserAgent: 'Mozilla/5.0',
        },
      }),
      config: {
        eventNames: {
          purchase_completed: 'Purchase',
        },
        resolveEventTime: () => new Date('2026-04-28T10:11:12.000Z'),
      },
    });

    expect(event).toMatchObject({
      event_name: 'Purchase',
      event_time: 1777371072,
      event_id: 'evt_1',
      action_source: 'website',
      user_data: {
        em: [hashMetaCapiEmail('Buyer@Example.COM')],
        fbp: 'fb.1.123.abc',
        client_user_agent: 'Mozilla/5.0',
      },
      custom_data: {
        value: 49,
        currency: 'USD',
        order_id: 'order_1',
      },
    });
    expect(event?.user_data.external_id?.[0]).toHaveLength(64);
  });

  it('can skip events without Meta user data when configured', () => {
    expect(
      mapWebConversionEnvelopeToMetaCapiEvent({
        envelope: createEnvelope({ user_id: undefined, properties: {} }),
        config: {
          eventNames: {
            purchase_completed: 'Purchase',
          },
          missingAttributionBehavior: 'skip',
        },
      }),
    ).toBeNull();
  });

  it('uploads events with access token in the request body', async () => {
    const httpClient = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ events_received: 1, fbtrace_id: 'trace_1' }),
    });

    await expect(
      uploadMetaCapiEvents({
        config: {
          pixelId: '1234567890',
          accessTokenProvider: () => 'access_token',
          eventNames: {
            purchase_completed: 'Purchase',
          },
          httpClient,
        },
        request: {
          data: [
            {
              event_name: 'Purchase',
              event_time: 1777371072,
              action_source: 'website',
              user_data: {
                fbp: 'fb.1.123.abc',
              },
            },
          ],
        },
      }),
    ).resolves.toEqual({ events_received: 1, fbtrace_id: 'trace_1' });

    expect(httpClient).toHaveBeenCalledWith(
      'https://graph.facebook.com/v25.0/1234567890/events',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
    const body = JSON.parse(httpClient.mock.calls[0]?.[1].body as string) as {
      access_token: string;
      data: unknown[];
    };
    expect(body.access_token).toBe('access_token');
    expect(body.data).toHaveLength(1);
  });

  it('throws on failed Meta CAPI uploads so runtime retry lanes can handle delivery', async () => {
    await expect(
      uploadMetaCapiEvents({
        config: {
          pixelId: '1234567890',
          accessTokenProvider: () => 'access_token',
          eventNames: {
            purchase_completed: 'Purchase',
          },
          httpClient: async () => ({
            ok: false,
            status: 400,
            json: async () => ({ error: { message: 'bad event' } }),
          }),
        },
        request: {
          data: [],
        },
      }),
    ).rejects.toBeInstanceOf(MetaCapiWebConversionUploadError);
  });

  it('implements the @unisane/web-runtime/conversions transport contract', async () => {
    const httpClient = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ events_received: 1 }),
    });
    const transport = createMetaCapiWebConversionTransport({
      pixelId: '1234567890',
      accessTokenProvider: () => 'access_token',
      eventNames: {
        purchase_completed: 'Purchase',
      },
      httpClient,
    });

    await transport.send(createEnvelope());

    expect(httpClient).toHaveBeenCalledTimes(1);
    const body = JSON.parse(httpClient.mock.calls[0]?.[1].body as string) as {
      data: unknown[];
    };
    expect(body.data).toHaveLength(1);
  });
});
