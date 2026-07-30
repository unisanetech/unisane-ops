export const DEFAULT_OAUTH_TIMEOUT_MS = 120_000;
export const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type GoogleOAuthFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface GoogleOAuthRuntime {
  fetch?: GoogleOAuthFetch;
  openUrl?: (url: string) => Promise<boolean> | boolean;
}

export interface GoogleAccessTokenResult {
  accessToken: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}

export interface GoogleTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
  scope?: unknown;
  token_type?: unknown;
  refresh_token?: unknown;
  error?: unknown;
  error_description?: unknown;
}

export function googleOAuthErrorCode(code: string): string {
  return `GOOGLE_OAUTH_${code}`;
}

export function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}
