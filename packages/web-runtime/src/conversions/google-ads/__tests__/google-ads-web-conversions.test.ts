import { describe, expect, it, vi } from 'vitest';
import type { WebConversionEnvelope } from '../../types';
import {
  createGoogleAdsWebConversionTransport,
  GoogleAdsWebConversionUploadError,
  hashGoogleAdsEmail,
  mapWebConversionEnvelopeToGoogleAdsClickConversion,
  uploadGoogleAdsClickConversions,
} from '../index';

function createEnvelope(overrides: Partial<WebConversionEnvelope> = {}): WebConversionEnvelope {
  return {
    occurred_at: '2026-04-28T10:11:12.000Z',
    consent: { advertising: 'granted', capturedAt: '2026-04-28T10:11:12.000Z' },
    customer: { sourceUrl: 'https://example.com/pricing' },
    event: 'purchase_completed',
    app_id: 'commerce',
    scope_id: 'scope_1',
    event_id: 'evt_1',
    transaction_id: 'order_1',
    value: 49,
    currency: 'USD',
    properties: {
      gclid: 'gclid_123',
    },
    ...overrides,
  };
}

describe('google ads web conversion adapter', () => {
  it('maps canonical server envelopes to Google Ads click conversions', () => {
    expect(
      mapWebConversionEnvelopeToGoogleAdsClickConversion({
        envelope: createEnvelope({
          properties: {
            gclid: 'gclid_123',
            adUserDataConsent: 'GRANTED',
          },
        }),
        config: {
          customerId: '123-456-7890',
          conversionActions: {
            purchase_completed: { conversionActionId: '111222333' },
          },
          conversionEnvironment: 'WEB',
          adPersonalizationConsent: 'DENIED',
        },
        now: () => new Date('2026-04-28T10:11:12.000Z'),
      }),
    ).toEqual({
      conversionAction: 'customers/1234567890/conversionActions/111222333',
      conversionDateTime: '2026-04-28 10:11:12+00:00',
      conversionValue: 49,
      currencyCode: 'USD',
      orderId: 'order_1',
      conversionEnvironment: 'WEB',
      consent: {
        adUserData: 'GRANTED',
        adPersonalization: 'DENIED',
      },
      gclid: 'gclid_123',
    });
  });

  it('supports enhanced conversion user identifiers when already hashed by the app', () => {
    const hashedEmail = hashGoogleAdsEmail(' Buyer@Example.COM ');

    expect(
      mapWebConversionEnvelopeToGoogleAdsClickConversion({
        envelope: createEnvelope({
          customer: {
            hashedEmail,
          },
        }),
        config: {
          customerId: '1234567890',
          conversionActions: {
            purchase_completed: 'customers/1234567890/conversionActions/111222333',
          },
        },
        now: () => new Date('2026-04-28T10:11:12.000Z'),
      }),
    ).toMatchObject({
      userIdentifiers: [{ hashedEmail }],
    });
  });

  it('can skip events without Google Ads attribution when configured', () => {
    expect(
      mapWebConversionEnvelopeToGoogleAdsClickConversion({
        envelope: createEnvelope({ properties: {} }),
        config: {
          customerId: '1234567890',
          conversionActions: {
            purchase_completed: { conversionActionId: '111222333' },
          },
          missingAttributionBehavior: 'skip',
        },
      }),
    ).toBeNull();
  });

  it('uploads click conversions with Google Ads API headers', async () => {
    const httpClient = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ conversionAction: 'customers/1234567890/conversionActions/111222333' }],
        jobId: '123',
      }),
    });

    await expect(
      uploadGoogleAdsClickConversions({
        config: {
          customerId: '123-456-7890',
          developerToken: 'developer_token',
          accessTokenProvider: () => 'access_token',
          loginCustomerId: '999-888-7777',
          conversionActions: {
            purchase_completed: { conversionActionId: '111222333' },
          },
          httpClient,
        },
        request: {
          conversions: [
            {
              conversionAction: 'customers/1234567890/conversionActions/111222333',
              conversionDateTime: '2026-04-28 10:11:12+00:00',
              gclid: 'gclid_123',
            },
          ],
          partialFailure: true,
        },
      }),
    ).resolves.toEqual({
      results: [{ conversionAction: 'customers/1234567890/conversionActions/111222333' }],
      jobId: '123',
    });

    expect(httpClient).toHaveBeenCalledWith(
      'https://googleads.googleapis.com/v21/customers/1234567890:uploadClickConversions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer access_token',
          'content-type': 'application/json',
          'developer-token': 'developer_token',
          'login-customer-id': '9998887777',
        },
      }),
    );
  });

  it('throws on Google Ads partial failures so runtime retry lanes can handle delivery', async () => {
    await expect(
      uploadGoogleAdsClickConversions({
        config: {
          customerId: '1234567890',
          developerToken: 'developer_token',
          accessTokenProvider: () => 'access_token',
          conversionActions: {
            purchase_completed: { conversionActionId: '111222333' },
          },
          httpClient: async () => ({
            ok: true,
            status: 200,
            json: async () => ({ partialFailureError: { message: 'bad conversion' } }),
          }),
        },
        request: {
          conversions: [],
          partialFailure: true,
        },
      }),
    ).rejects.toBeInstanceOf(GoogleAdsWebConversionUploadError);
  });

  it('implements the @unisane/web-runtime/conversions transport contract', async () => {
    const httpClient = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ conversionAction: 'customers/1234567890/conversionActions/111222333' }],
      }),
    });
    const transport = createGoogleAdsWebConversionTransport({
      customerId: '1234567890',
      developerToken: 'developer_token',
      accessTokenProvider: () => 'access_token',
      conversionActions: {
        purchase_completed: { conversionActionId: '111222333' },
      },
      httpClient,
    });

    await transport.send(createEnvelope());

    expect(httpClient).toHaveBeenCalledTimes(1);
    const body = JSON.parse(httpClient.mock.calls[0]?.[1].body as string) as {
      conversions: unknown[];
      partialFailure: boolean;
    };
    expect(body.partialFailure).toBe(true);
    expect(body.conversions).toHaveLength(1);
  });
});
