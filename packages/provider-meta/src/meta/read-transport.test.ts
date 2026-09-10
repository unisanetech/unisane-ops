import { describe, expect, it, vi } from 'vitest';
import { MetaGraphReadError, readMetaGraphJson } from './read-transport.js';

function json(value: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('Meta read transport policy', () => {
  it('honors bounded Retry-After and succeeds without exposing provider bodies', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({ error: { message: 'provider echoed fixture-meta-token', code: 4 } }, 429, {
          'retry-after': '120',
        }),
      )
      .mockResolvedValueOnce(json({ data: [{ id: 'ok' }] }));
    const sleep = vi.fn(async () => undefined);

    await expect(
      readMetaGraphJson({
        url: 'https://graph.facebook.com/v25.0/me',
        accessToken: 'fixture-meta-token',
        fetch: fetcher,
        policy: { maxRetries: 1, maxRetryAfterSeconds: 5 },
        sleep,
      }),
    ).resolves.toEqual({ data: [{ id: 'ok' }] });
    expect(sleep).toHaveBeenCalledWith(5_000);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('classifies revoked credentials without retrying or returning provider text', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      json(
        {
          error: {
            message: 'provider echoed fixture-meta-token',
            code: 190,
            error_subcode: 463,
          },
        },
        400,
      ),
    );
    const error = await readMetaGraphJson({
      url: 'https://graph.facebook.com/v25.0/me',
      accessToken: 'fixture-meta-token',
      fetch: fetcher,
    }).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(MetaGraphReadError);
    expect((error as MetaGraphReadError).safeFailure).toEqual({
      kind: 'credential-revoked',
      httpStatus: 400,
      providerCode: 190,
      providerSubcode: 463,
      attempts: 1,
    });
    expect((error as Error).message).not.toMatch(/fixture-meta-token|provider echoed/);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('bounds a stalled request with an abort timeout', async () => {
    const fetcher = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const error = await readMetaGraphJson({
      url: 'https://graph.facebook.com/v25.0/me',
      accessToken: 'fixture-meta-token',
      fetch: fetcher,
      policy: { timeoutMs: 250, maxRetries: 0 },
    }).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(MetaGraphReadError);
    expect((error as MetaGraphReadError).safeFailure).toEqual({
      kind: 'timeout',
      attempts: 1,
    });
  });
});
