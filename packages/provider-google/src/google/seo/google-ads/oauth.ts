export type FetchLike = typeof fetch;

export type RefreshGoogleOAuthAccessTokenOptions = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fetchImpl?: FetchLike;
};

export async function refreshGoogleOAuthAccessToken(
  options: RefreshGoogleOAuthAccessTokenOptions,
): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      refresh_token: options.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Google OAuth token refresh failed: ${readErrorMessage(payload)}.`);
  }
  const accessToken = readString(payload, 'access_token');
  if (!accessToken) {
    throw new Error('Google OAuth token refresh failed: missing access_token.');
  }
  return accessToken;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'unknown error';
  }
  const record = payload as Record<string, unknown>;
  const description = record.error_description;
  if (typeof description === 'string' && description.trim()) {
    return description;
  }
  const error = record.error;
  return typeof error === 'string' && error.trim() ? error : 'unknown error';
}

function readString(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}
