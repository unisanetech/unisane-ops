import { log } from '@unisane/cli-core';
import {
  exchangeAuthorizationCode,
  parsePort,
  parseScopes,
  parseTimeoutMs,
  waitForAuthorizationCode,
} from './oauth.js';
import {
  assertPlaintextStoreAllowed,
  authHome,
  deleteGoogleAuthProfile,
  getProfile,
  resolveLoginStore,
  saveGoogleAuthProfile,
} from './store.js';
import { getGoogleAuthStatus, refreshGoogleAccessToken } from './profile.js';
import {
  authNamespace,
  errorCode,
  normalizeProfileName,
  type GoogleAuthCliOptions,
} from './types.js';

export async function loginGoogleAuthCommand(options: GoogleAuthCliOptions): Promise<number> {
  try {
    const namespace = authNamespace(options);
    const profile = normalizeProfileName(options.profile, options);
    const existing = getProfile(profile, options);
    const clientId =
      options.clientId?.trim() || existing?.clientId || process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
    if (!clientId) {
      throw new Error(
        `[${errorCode(options, 'CLIENT_ID_REQUIRED')}] Pass --client-id <oauth-client-id> for first-time login, or set GOOGLE_OAUTH_CLIENT_ID.`,
      );
    }
    const clientSecretEnv = options.clientSecretEnv ?? namespace.defaultClientSecretEnv;
    const clientSecret = process.env[clientSecretEnv]?.trim() || undefined;
    const scopes = parseScopes(options.scopes, options);
    const store = resolveLoginStore(options, existing);
    if (store === 'file') assertPlaintextStoreAllowed(options);
    const auth = await waitForAuthorizationCode({
      clientId,
      scopes,
      port: parsePort(options.port, options),
      timeoutMs: parseTimeoutMs(options.timeoutMs, options),
      json: options.json,
      runtime: options,
    });
    const response = await exchangeAuthorizationCode({
      clientId,
      clientSecret,
      code: auth.code,
      codeVerifier: auth.codeVerifier,
      redirectUri: auth.redirectUri,
      runtime: options,
    });
    if (typeof response.refresh_token !== 'string' || !response.refresh_token.trim()) {
      throw new Error(
        `[${errorCode(options, 'REFRESH_TOKEN_NOT_RETURNED')}] Google did not return a refresh token. Re-run login with consent, or create a Desktop app OAuth client.`,
      );
    }
    await saveGoogleAuthProfile({
      profile,
      clientId,
      clientSecret,
      refreshToken: response.refresh_token,
      scopes,
      secretStore: store,
      runtime: options,
    });
    if (options.json) {
      printAuthJson({
        ok: true,
        profile,
        authHome: authHome(options),
        secretStore: store,
        scopes,
        clientSecretStored: Boolean(clientSecret),
      });
    } else {
      log.success(
        `Saved ${namespace.displayName} auth profile '${profile}' using ${store} secret storage.`,
      );
      if (!clientSecret) {
        log.warn(
          `No client secret was read from ${clientSecretEnv}; this is expected for Desktop app OAuth clients.`,
        );
      }
    }
    return 0;
  } catch (error) {
    return handleAuthError(error, options);
  }
}

export async function statusGoogleAuthCommand(options: GoogleAuthCliOptions): Promise<number> {
  try {
    const namespace = authNamespace(options);
    const status = await getGoogleAuthStatus({ profile: options.profile, runtime: options });
    if (options.json) {
      printAuthJson(status);
    } else if (!status.configured) {
      log.warn(`${namespace.displayName} auth profile '${status.profile}' is not configured.`);
      log.info(`Run ${namespace.commandName} login --profile <name> --scopes <scope>.`);
    } else {
      log.section(`${namespace.displayName} Auth`);
      log.info(`Profile: ${status.profile}`);
      log.info(`Client ID: ${status.clientId}`);
      log.info(`Secret store: ${status.secretStore}`);
      log.info(`Refresh token: ${status.refreshTokenStored ? 'stored' : 'missing'}`);
      log.info(`Client secret: ${status.clientSecretStored ? 'stored' : 'not stored'}`);
      log.info(`Scopes: ${status.scopes.join(', ')}`);
      if (!status.refreshTokenStored) {
        log.warn(
          'Profile metadata exists, but the refresh token is unavailable. Re-run login or allow local secret-store access.',
        );
      }
    }
    return status.ok ? 0 : 1;
  } catch (error) {
    return handleAuthError(error, options);
  }
}

export async function tokenGoogleAuthCommand(options: GoogleAuthCliOptions): Promise<number> {
  try {
    const namespace = authNamespace(options);
    const profile = normalizeProfileName(options.profile, options);
    const token = await refreshGoogleAccessToken({
      profile,
      requiredScope: options.requiredScope,
      runtime: options,
    });
    if (options.print) {
      if (options.json) {
        printAuthJson({
          ok: true,
          profile,
          accessToken: token.accessToken,
          expiresIn: token.expiresIn,
        });
      } else {
        console.log(token.accessToken);
      }
    } else if (options.json) {
      printAuthJson({
        ok: true,
        profile,
        expiresIn: token.expiresIn,
        scope: token.scope,
        tokenType: token.tokenType,
      });
    } else {
      log.success(`Minted ${namespace.displayName} access token for profile '${profile}'.`);
      log.info(
        'Token was not printed. Pass --print only when a downstream tool needs a raw access token.',
      );
    }
    return 0;
  } catch (error) {
    return handleAuthError(error, options);
  }
}

export async function logoutGoogleAuthCommand(options: GoogleAuthCliOptions): Promise<number> {
  try {
    const namespace = authNamespace(options);
    const profile = normalizeProfileName(options.profile, options);
    await deleteGoogleAuthProfile({ profile, runtime: options });
    if (options.json) {
      printAuthJson({ ok: true, profile, deleted: true });
    } else {
      log.success(`Deleted ${namespace.displayName} auth profile '${profile}'.`);
    }
    return 0;
  } catch (error) {
    return handleAuthError(error, options);
  }
}

function printAuthJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function handleAuthError(error: unknown, options: GoogleAuthCliOptions): number {
  const message =
    error instanceof Error
      ? error.message
      : `Unknown ${authNamespace(options).displayName} auth command error`;
  if (options.json) {
    printAuthJson({ ok: false, error: message });
  } else {
    log.error(message);
  }
  return 1;
}
