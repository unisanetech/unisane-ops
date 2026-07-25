export type GoogleControlPlaneFetchResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  text(): Promise<string>;
};

export type GoogleControlPlaneFetch = (
  input: string | URL,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | URLSearchParams;
  },
) => Promise<GoogleControlPlaneFetchResponse>;

export function googleFetchImpl(fetcher?: GoogleControlPlaneFetch): GoogleControlPlaneFetch {
  if (fetcher) return fetcher;
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      '[GOOGLE_CONTROL_PLANE_FETCH_UNAVAILABLE] This Node runtime does not provide fetch.',
    );
  }
  return globalThis.fetch as GoogleControlPlaneFetch;
}

export function asGoogleRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asGoogleArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function optionalGoogleString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function readGoogleJson(
  response: GoogleControlPlaneFetchResponse,
  label: string,
): Promise<unknown> {
  const text = await response.text();
  let parsed: unknown = {};
  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(
        `[GOOGLE_CONTROL_PLANE_RESPONSE_INVALID] ${label} returned non-JSON status ${response.status}.`,
      );
    }
  }
  if (response.ok) return parsed;
  const message =
    optionalGoogleString(asGoogleRecord(asGoogleRecord(parsed).error).message) ??
    `${label} failed with ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  throw new Error(`[GOOGLE_CONTROL_PLANE_API_ERROR] ${message}`);
}

export function googleBearerHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
  };
}
