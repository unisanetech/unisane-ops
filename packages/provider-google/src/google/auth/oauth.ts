import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { log } from '@unisane/cli-core';
import {
  authNamespace,
  DEFAULT_AUTH_TIMEOUT_MS,
  errorCode,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  isRecord,
  type FetchLike,
  type GoogleAccessTokenResult,
  type GoogleAuthRuntimeOptions,
  type TokenResponse,
} from './types.js';

export function parseScopes(
  input: string | undefined,
  options: GoogleAuthRuntimeOptions,
): readonly string[] {
  const fallback = authNamespace(options).defaultScopes;
  if (!input?.trim() && fallback) return fallback;
  const scopes = (input ?? '')
    .split(/[,\s]+/g)
    .map((scope) => scope.trim())
    .filter(Boolean);
  if (scopes.length === 0) {
    throw new Error(
      `[${errorCode(options, 'SCOPES_REQUIRED')}] Pass --scopes with at least one OAuth scope.`,
    );
  }
  return scopes;
}

export function parsePort(input: string | undefined, options: GoogleAuthRuntimeOptions): number {
  if (!input?.trim()) return 0;
  const port = Number.parseInt(input, 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(
      `[${errorCode(options, 'PORT_INVALID')}] --port must be an integer from 0 to 65535.`,
    );
  }
  return port;
}

export function parseTimeoutMs(
  input: string | undefined,
  options: GoogleAuthRuntimeOptions,
): number {
  if (!input?.trim()) return DEFAULT_AUTH_TIMEOUT_MS;
  const value = Number.parseInt(input, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `[${errorCode(options, 'TIMEOUT_INVALID')}] --timeout-ms must be a positive integer.`,
    );
  }
  return value;
}

function base64Url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createCodeVerifier(): string {
  return base64Url(randomBytes(64));
}

function createCodeChallenge(verifier: string): string {
  return base64Url(createHash('sha256').update(verifier, 'ascii').digest());
}

function fetchImpl(runtime: GoogleAuthRuntimeOptions = {}): FetchLike {
  if (runtime.fetch) return runtime.fetch;
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      `[${errorCode(runtime, 'FETCH_UNAVAILABLE')}] This Node runtime does not provide fetch.`,
    );
  }
  return globalThis.fetch as FetchLike;
}

async function postToken(
  body: URLSearchParams,
  runtime: GoogleAuthRuntimeOptions = {},
): Promise<TokenResponse> {
  const response = await fetchImpl(runtime)(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `[${errorCode(runtime, 'TOKEN_RESPONSE_INVALID')}] Google token endpoint returned non-JSON status ${response.status}.`,
    );
  }
  if (!isRecord(parsed)) {
    throw new Error(
      `[${errorCode(runtime, 'TOKEN_RESPONSE_INVALID')}] Google token endpoint returned an invalid JSON payload.`,
    );
  }
  if (!response.ok) {
    const error = typeof parsed.error === 'string' ? parsed.error : `HTTP ${response.status}`;
    const description =
      typeof parsed.error_description === 'string' ? `: ${parsed.error_description}` : '';
    throw new Error(`[${errorCode(runtime, 'TOKEN_EXCHANGE_FAILED')}] ${error}${description}`);
  }
  return parsed as TokenResponse;
}

export async function exchangeAuthorizationCode(args: {
  clientId: string;
  clientSecret?: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  runtime?: GoogleAuthRuntimeOptions;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: args.clientId,
    code: args.code,
    code_verifier: args.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: args.redirectUri,
  });
  if (args.clientSecret) body.set('client_secret', args.clientSecret);
  return postToken(body, args.runtime);
}

export async function refreshAccessToken(args: {
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  runtime?: GoogleAuthRuntimeOptions;
}): Promise<GoogleAccessTokenResult> {
  const body = new URLSearchParams({
    client_id: args.clientId,
    grant_type: 'refresh_token',
    refresh_token: args.refreshToken,
  });
  if (args.clientSecret) body.set('client_secret', args.clientSecret);
  const response = await postToken(body, args.runtime);
  if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
    throw new Error(
      `[${errorCode(args.runtime, 'ACCESS_TOKEN_MISSING')}] Google token endpoint did not return an access token.`,
    );
  }
  return {
    accessToken: response.access_token,
    expiresIn: typeof response.expires_in === 'number' ? response.expires_in : undefined,
    scope: typeof response.scope === 'string' ? response.scope : undefined,
    tokenType: typeof response.token_type === 'string' ? response.token_type : undefined,
  };
}

export function assertRequiredScope(args: {
  grantedScope?: string;
  profileScopes: readonly string[];
  requiredScope: string;
  runtime?: GoogleAuthRuntimeOptions;
}): void {
  const required = args.requiredScope.trim();
  if (!required) return;
  const granted = new Set(
    (args.grantedScope ? args.grantedScope.split(/\s+/g) : args.profileScopes).map((scope) =>
      scope.trim(),
    ),
  );
  const exactRequired = required.startsWith('https://')
    ? required
    : `https://www.googleapis.com/auth/${required}`;
  if (granted.has(exactRequired)) return;
  throw new Error(
    `[${errorCode(args.runtime, 'SCOPE_MISSING')}] Auth profile does not include required scope ${exactRequired}.`,
  );
}

export async function openAuthorizationUrl(
  url: string,
  runtime: GoogleAuthRuntimeOptions = {},
): Promise<boolean> {
  if (runtime.openUrl) {
    try {
      return Boolean(await runtime.openUrl(url));
    } catch {
      return false;
    }
  }
  const command = resolveOpenCommand(process.platform);
  if (!command) return false;

  try {
    const result = spawnSync(command.command, [...command.args, url], {
      stdio: 'ignore',
      timeout: 5000,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

export function resolveOpenCommand(
  platform: NodeJS.Platform,
): { command: string; args: readonly string[] } | null {
  if (platform === 'darwin') return { command: 'open', args: [] };
  if (platform === 'win32') return { command: 'cmd', args: ['/c', 'start', ''] };
  if (platform === 'linux' || platform === 'freebsd' || platform === 'openbsd') {
    return { command: 'xdg-open', args: [] };
  }
  return null;
}

export async function waitForAuthorizationCode(args: {
  clientId: string;
  scopes: readonly string[];
  port: number;
  timeoutMs: number;
  json?: boolean;
  runtime?: GoogleAuthRuntimeOptions;
}): Promise<{ code: string; redirectUri: string; codeVerifier: string }> {
  const namespace = authNamespace(args.runtime);
  const state = base64Url(randomBytes(32));
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  let server: Server | undefined;

  try {
    return await new Promise<{ code: string; redirectUri: string; codeVerifier: string }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              `[${errorCode(args.runtime, 'TIMEOUT')}] Timed out waiting for the OAuth browser callback.`,
            ),
          );
        }, args.timeoutMs);

        server = createServer((request, response) => {
          try {
            const host = request.headers.host ?? `127.0.0.1:${args.port}`;
            const url = new URL(request.url ?? '/', `http://${host}`);
            const error = url.searchParams.get('error');
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');
            if (error) {
              response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
              response.end(
                namespace.authorizationFailedMessage ??
                  `${namespace.displayName} authorization failed. You can close this tab.`,
              );
              clearTimeout(timeout);
              reject(
                new Error(`[${errorCode(args.runtime, 'DENIED')}] Google OAuth returned ${error}.`),
              );
              return;
            }
            if (!code) {
              response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              response.end(
                namespace.authorizationMissingCodeMessage ??
                  `No ${namespace.displayName} authorization code was found.`,
              );
              return;
            }
            if (returnedState !== state) {
              response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
              response.end(
                `Invalid ${namespace.displayName} authorization response. You can close this tab.`,
              );
              clearTimeout(timeout);
              reject(
                new Error(
                  `[${errorCode(args.runtime, 'STATE_MISMATCH')}] Google OAuth state did not match the local auth session.`,
                ),
              );
              return;
            }
            const address = server?.address();
            const port = typeof address === 'object' && address ? address.port : args.port;
            response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end(
              namespace.authorizationReceivedMessage ??
                `${namespace.displayName} authorization received. You can close this tab.`,
            );
            clearTimeout(timeout);
            resolve({
              code,
              redirectUri: `http://127.0.0.1:${port}`,
              codeVerifier,
            });
          } catch (error_) {
            clearTimeout(timeout);
            reject(error_);
          }
        });

        server.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        server.listen(args.port, '127.0.0.1', () => {
          const address = server?.address();
          const port = typeof address === 'object' && address ? address.port : args.port;
          const redirectUri = `http://127.0.0.1:${port}`;
          const authUrl = new URL(GOOGLE_AUTH_URL);
          authUrl.searchParams.set('client_id', args.clientId);
          authUrl.searchParams.set('redirect_uri', redirectUri);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('scope', args.scopes.join(' '));
          authUrl.searchParams.set('state', state);
          authUrl.searchParams.set('code_challenge', codeChallenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');
          authUrl.searchParams.set('access_type', 'offline');
          authUrl.searchParams.set('prompt', 'consent');
          if (args.json) {
            process.stderr.write(
              `${JSON.stringify({ authorizationUrl: authUrl.href, redirectUri })}\n`,
            );
          } else {
            log.section(namespace.authSectionTitle ?? `${namespace.displayName} OAuth`);
            void openAuthorizationUrl(authUrl.href, args.runtime).then((opened) => {
              if (opened) {
                log.info('Opened authorization URL in your browser.');
              } else {
                log.info(`Open this URL in your browser:\n${authUrl.href}`);
              }
            });
            log.info('Waiting for Google OAuth callback...');
          }
        });
      },
    );
  } finally {
    server?.close();
  }
}
