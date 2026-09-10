import type { FetchLike } from '@unisane/growth/contracts';
import { z } from 'zod';

export const metaReadPolicySchema = z
  .object({
    timeoutMs: z.number().int().min(250).max(30_000).default(10_000),
    maxRetries: z.number().int().min(0).max(3).default(2),
    maxRetryAfterSeconds: z.number().int().min(0).max(60).default(30),
  })
  .strict();
export type MetaReadPolicyInput = z.input<typeof metaReadPolicySchema>;
export type MetaReadSleep = (milliseconds: number) => Promise<void>;

export interface MetaGraphReadFailure {
  kind:
    | 'transport'
    | 'timeout'
    | 'http'
    | 'rate-limited'
    | 'credential-revoked'
    | 'invalid-response';
  httpStatus?: number;
  providerCode?: number;
  providerSubcode?: number;
  retryAfterSeconds?: number;
  attempts: number;
}

export class MetaGraphReadError extends Error {
  constructor(readonly safeFailure: MetaGraphReadFailure) {
    super(
      safeFailure.httpStatus
        ? `[META_GRAPH_READ_FAILED] Meta Graph read failed with HTTP ${safeFailure.httpStatus}.`
        : `[META_GRAPH_READ_FAILED] Meta Graph read failed (${safeFailure.kind}).`,
    );
  }
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function integerOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function retryAfter(response: Response, maximum: number): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(seconds, maximum);
}

function failureOf(
  response: Response,
  value: unknown,
  attempts: number,
  maximumRetryAfter: number,
): MetaGraphReadFailure {
  const provider = recordOf(recordOf(value).error);
  const providerCode = integerOf(provider.code);
  const providerSubcode = integerOf(provider.error_subcode);
  const retryAfterSeconds = retryAfter(response, maximumRetryAfter);
  return {
    kind:
      providerCode === 190
        ? 'credential-revoked'
        : response.status === 429
          ? 'rate-limited'
          : 'http',
    httpStatus: response.status,
    ...(providerCode !== undefined ? { providerCode } : {}),
    ...(providerSubcode !== undefined ? { providerSubcode } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    attempts,
  };
}

function retryable(failure: MetaGraphReadFailure): boolean {
  return (
    failure.kind === 'transport' ||
    failure.kind === 'timeout' ||
    failure.kind === 'rate-limited' ||
    (failure.kind === 'http' && Boolean(failure.httpStatus && failure.httpStatus >= 500))
  );
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithTimeout(input: {
  url: URL | string;
  accessToken: string;
  fetch: FetchLike;
  timeoutMs: number;
  attempt: number;
}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    return await input.fetch(input.url, {
      method: 'GET',
      headers: { authorization: `Bearer ${input.accessToken}` },
      signal: controller.signal,
    });
  } catch {
    throw new MetaGraphReadError({
      kind: controller.signal.aborted ? 'timeout' : 'transport',
      attempts: input.attempt,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function readMetaGraphJson(input: {
  url: URL | string;
  accessToken: string;
  fetch: FetchLike;
  policy?: MetaReadPolicyInput;
  sleep?: MetaReadSleep;
}): Promise<unknown> {
  const policy = metaReadPolicySchema.parse(input.policy ?? {});
  const sleep = input.sleep ?? defaultSleep;
  let attempt = 0;
  while (attempt <= policy.maxRetries) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout({
        url: input.url,
        accessToken: input.accessToken,
        fetch: input.fetch,
        timeoutMs: policy.timeoutMs,
        attempt,
      });
      let value: unknown;
      try {
        value = await response.json();
      } catch {
        throw new MetaGraphReadError({
          kind: 'invalid-response',
          httpStatus: response.status,
          attempts: attempt,
        });
      }
      if (response.ok) return value;
      throw new MetaGraphReadError(
        failureOf(response, value, attempt, policy.maxRetryAfterSeconds),
      );
    } catch (error) {
      const failure =
        error instanceof MetaGraphReadError
          ? error.safeFailure
          : ({ kind: 'transport', attempts: attempt } satisfies MetaGraphReadFailure);
      if (!retryable(failure) || attempt > policy.maxRetries) {
        throw error instanceof MetaGraphReadError ? error : new MetaGraphReadError(failure);
      }
      const delay = (failure.retryAfterSeconds ?? Math.min(2 ** (attempt - 1), 4)) * 1_000;
      await sleep(delay);
    }
  }
  throw new MetaGraphReadError({ kind: 'transport', attempts: attempt });
}
