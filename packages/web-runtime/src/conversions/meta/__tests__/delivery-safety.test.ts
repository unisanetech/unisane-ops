import { describe, expect, it, vi } from 'vitest';
import {
  uploadMetaCapiEvents,
  createMetaCapiWebConversionTransport,
  hashMetaCapiPhoneNumber,
  hashMetaCapiCountry,
} from '../index';
import { createHash } from 'node:crypto';
const request = {
  data: [
    {
      event_name: 'Lead',
      event_time: 1777371072,
      action_source: 'website' as const,
      user_data: { external_id: ['a'.repeat(64)] },
    },
  ],
};
const config = {
  pixelId: '123',
  accessTokenProvider: () => 'secret-token',
  eventNames: { lead: 'Lead' },
};

describe('Meta delivery safety', () => {
  it.each([{}, { events_received: 0 }, { events_received: 2 }])(
    'requires explicit provider acceptance: %j',
    async (body) => {
      await expect(
        uploadMetaCapiEvents({
          config: {
            ...config,
            httpClient: async () => ({ ok: true, status: 200, json: async () => body }),
          },
          request,
        }),
      ).rejects.toMatchObject({ code: 'meta_acceptance_unconfirmed', kind: 'uncertain' });
    },
  );
  it('bounds even a custom transport that ignores cancellation', async () => {
    vi.useFakeTimers();
    try {
      const result = uploadMetaCapiEvents({
        config: { ...config, timeoutMs: 50, httpClient: async () => new Promise(() => {}) },
        request,
      });
      const assertion = expect(result).rejects.toMatchObject({
        code: 'delivery_timeout',
        kind: 'uncertain',
      });
      await vi.advanceTimersByTimeAsync(51);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
  it('honors cancellation before reading credentials', async () => {
    const controller = new AbortController();
    controller.abort();
    const token = vi.fn();
    await expect(
      uploadMetaCapiEvents({
        config: { ...config, accessTokenProvider: token },
        request,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: 'delivery_aborted' });
    expect(token).not.toHaveBeenCalled();
  });
  it.each([
    [429, 'retryable'],
    [503, 'retryable'],
    [400, 'permanent'],
  ])('classifies %s and redacts provider errors', async (status, kind) => {
    const result = uploadMetaCapiEvents({
      config: {
        ...config,
        httpClient: async () => ({
          ok: false,
          status: Number(status),
          json: async () => ({ error: { message: 'secret-token raw@example.com', code: 100 } }),
        }),
      },
      request,
    });
    const error = await result.catch((error) => error);
    expect(error.kind).toBe(kind);
    expect(JSON.stringify(error)).not.toContain('secret-token');
    expect(JSON.stringify(error)).not.toContain('raw@example.com');
  });
  it('returns a skipped receipt without fetching when advertising permission is denied', async () => {
    const httpClient = vi.fn();
    const transport = createMetaCapiWebConversionTransport({ ...config, httpClient });
    const result = await transport.send({
      event: 'lead',
      app_id: 'app',
      scope_id: 'scope',
      event_id: 'id',
      consent: { advertising: 'denied', capturedAt: '2026-09-11T00:00:00Z' },
    });
    expect(result).toMatchObject({ status: 'skipped' });
    expect(httpClient).not.toHaveBeenCalled();
  });
  it('hashes phone digits without the plus sign and requires an explicit country', () => {
    expect(hashMetaCapiPhoneNumber('+1 (415) 555-1212')).toBe(
      createHash('sha256').update('14155551212').digest('hex'),
    );
    expect(hashMetaCapiCountry('US')).toBe(createHash('sha256').update('us').digest('hex'));
    expect(() => hashMetaCapiCountry('')).toThrow();
  });
});
