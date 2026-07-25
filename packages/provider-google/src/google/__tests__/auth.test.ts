import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  googleAuthEnvEntries,
  googleAuthStatusToControlPlaneProfile,
  getGoogleAuthStatus,
  openAuthorizationUrl,
  refreshGoogleAccessToken,
  resolveOpenCommand,
  resolveGoogleAccessToken,
  saveGoogleAuthProfile,
  type GoogleAuthNamespaceConfig,
} from '../auth.js';

describe('google auth profiles', () => {
  it('resolves the local browser opener for supported platforms', () => {
    expect(resolveOpenCommand('darwin')).toEqual({ command: 'open', args: [] });
    expect(resolveOpenCommand('win32')).toEqual({ command: 'cmd', args: ['/c', 'start', ''] });
    expect(resolveOpenCommand('linux')).toEqual({ command: 'xdg-open', args: [] });
    expect(resolveOpenCommand('aix')).toBeNull();
  });

  it('allows auth commands to inject a browser opener', async () => {
    const opened: string[] = [];
    await expect(
      openAuthorizationUrl('https://accounts.google.com/o/oauth2/v2/auth', {
        openUrl: (url) => {
          opened.push(url);
          return true;
        },
      }),
    ).resolves.toBe(true);

    expect(opened).toEqual(['https://accounts.google.com/o/oauth2/v2/auth']);
  });

  it('stores refresh-token profiles outside repo files and mints access tokens', async () => {
    const authHome = await mkdtemp(join(tmpdir(), 'unisane-google-auth-'));
    try {
      await saveGoogleAuthProfile({
        profile: 'seo-ads',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
        scopes: ['https://www.googleapis.com/auth/adwords'],
        secretStore: 'file',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });

      const status = await getGoogleAuthStatus({
        profile: 'seo-ads',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });
      const token = await refreshGoogleAccessToken({
        profile: 'seo-ads',
        requiredScope: 'https://www.googleapis.com/auth/adwords',
        runtime: {
          authHome,
          store: 'file',
          allowPlaintextStore: true,
          fetch: async () =>
            ({
              ok: true,
              status: 200,
              text: async () =>
                JSON.stringify({
                  access_token: 'access-token',
                  expires_in: 3600,
                  scope: 'https://www.googleapis.com/auth/adwords',
                  token_type: 'Bearer',
                }),
            }) as Response,
        },
      });

      expect(status).toMatchObject({
        configured: true,
        profile: 'seo-ads',
        refreshTokenStored: true,
        clientSecretStored: true,
      });
      expect(token).toMatchObject({
        accessToken: 'access-token',
        expiresIn: 3600,
      });
    } finally {
      await rm(authHome, { recursive: true, force: true });
    }
  });

  it('keeps namespace-configured profile homes and env fallbacks isolated', async () => {
    const googleHome = await mkdtemp(join(tmpdir(), 'unisane-google-auth-'));
    const analyticsHome = await mkdtemp(join(tmpdir(), 'unisane-analytics-auth-'));
    const namespace: GoogleAuthNamespaceConfig = {
      displayName: 'Google Analytics',
      commandName: 'analytics auth',
      errorPrefix: 'ANALYTICS_AUTH',
      keychainService: 'dev.unisane.analytics-auth',
      secretAccountPrefix: 'analytics',
      profileEnv: 'UNISANE_ANALYTICS_AUTH_PROFILE',
      storeEnv: 'UNISANE_ANALYTICS_AUTH_STORE',
      authHomeEnv: 'UNISANE_ANALYTICS_AUTH_HOME',
      allowPlaintextStoreEnv: 'UNISANE_ANALYTICS_AUTH_ALLOW_PLAINTEXT_STORE',
      authHomeDir: 'analytics-auth',
      defaultAccessTokenEnv: 'GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN',
      defaultClientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
      defaultScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    };
    const previousGoogleHome = process.env.UNISANE_GOOGLE_AUTH_HOME;
    const previousAnalyticsHome = process.env.UNISANE_ANALYTICS_AUTH_HOME;
    const previousAccessToken = process.env.GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN;
    process.env.UNISANE_GOOGLE_AUTH_HOME = googleHome;
    process.env.UNISANE_ANALYTICS_AUTH_HOME = analyticsHome;
    process.env.GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN = 'env-access-token';

    try {
      await saveGoogleAuthProfile({
        profile: 'default',
        clientId: 'google-client',
        clientSecret: 'google-secret',
        refreshToken: 'google-refresh',
        scopes: ['https://www.googleapis.com/auth/adwords'],
        secretStore: 'file',
        runtime: { store: 'file', allowPlaintextStore: true },
      });
      await saveGoogleAuthProfile({
        profile: 'default',
        clientId: 'analytics-client',
        clientSecret: 'analytics-secret',
        refreshToken: 'analytics-refresh',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        secretStore: 'file',
        runtime: { store: 'file', allowPlaintextStore: true, namespace },
      });

      const googleStatus = await getGoogleAuthStatus({
        profile: 'default',
        runtime: { store: 'file', allowPlaintextStore: true },
      });
      const analyticsStatus = await getGoogleAuthStatus({
        profile: 'default',
        runtime: { store: 'file', allowPlaintextStore: true, namespace },
      });
      const token = await resolveGoogleAccessToken({
        requiredScope: 'https://www.googleapis.com/auth/analytics.readonly',
        runtime: { namespace },
      });

      expect(googleStatus.authHome).toBe(googleHome);
      expect(analyticsStatus.authHome).toBe(analyticsHome);
      expect(googleStatus.clientId).toBe('google-client');
      expect(analyticsStatus.clientId).toBe('analytics-client');
      expect(token).toBe('env-access-token');
      expect(
        googleAuthStatusToControlPlaneProfile({
          provider: 'analytics',
          status: analyticsStatus,
          requiredScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        }),
      ).toEqual(
        expect.objectContaining({
          provider: 'analytics',
          profile: 'default',
          status: 'ready',
          requiredScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        }),
      );
      expect(
        googleAuthEnvEntries({
          runtime: { namespace },
          env: {
            GOOGLE_OAUTH_CLIENT_ID: 'client-id',
            GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
            GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN: 'access-token',
          },
        }),
      ).toContainEqual(
        expect.objectContaining({
          name: 'GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN',
          kind: 'fallback-debug',
          configured: true,
          example: null,
        }),
      );
    } finally {
      if (previousGoogleHome === undefined) {
        delete process.env.UNISANE_GOOGLE_AUTH_HOME;
      } else {
        process.env.UNISANE_GOOGLE_AUTH_HOME = previousGoogleHome;
      }
      if (previousAnalyticsHome === undefined) {
        delete process.env.UNISANE_ANALYTICS_AUTH_HOME;
      } else {
        process.env.UNISANE_ANALYTICS_AUTH_HOME = previousAnalyticsHome;
      }
      if (previousAccessToken === undefined) {
        delete process.env.GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN;
      } else {
        process.env.GOOGLE_ANALYTICS_DATA_ACCESS_TOKEN = previousAccessToken;
      }
      await rm(googleHome, { recursive: true, force: true });
      await rm(analyticsHome, { recursive: true, force: true });
    }
  });

  it('selects the built-in marketing namespace without a custom namespace object', async () => {
    const googleHome = await mkdtemp(join(tmpdir(), 'unisane-google-auth-'));
    const marketingHome = await mkdtemp(join(tmpdir(), 'unisane-marketing-auth-'));
    const previousGoogleHome = process.env.UNISANE_GOOGLE_AUTH_HOME;
    const previousMarketingHome = process.env.UNISANE_MARKETING_AUTH_HOME;
    const previousMarketingToken = process.env.GOOGLE_MARKETING_ACCESS_TOKEN;
    process.env.UNISANE_GOOGLE_AUTH_HOME = googleHome;
    process.env.UNISANE_MARKETING_AUTH_HOME = marketingHome;
    process.env.GOOGLE_MARKETING_ACCESS_TOKEN = 'marketing-env-token';

    try {
      await saveGoogleAuthProfile({
        profile: 'true-resume',
        clientId: 'marketing-client',
        clientSecret: 'marketing-secret',
        refreshToken: 'marketing-refresh',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        secretStore: 'file',
        runtime: {
          authNamespace: 'marketing',
          store: 'file',
          allowPlaintextStore: true,
        },
      });

      const genericStatus = await getGoogleAuthStatus({
        profile: 'true-resume',
        runtime: { store: 'file', allowPlaintextStore: true },
      });
      const marketingStatus = await getGoogleAuthStatus({
        profile: 'true-resume',
        runtime: {
          authNamespace: 'marketing',
          store: 'file',
          allowPlaintextStore: true,
        },
      });
      const token = await resolveGoogleAccessToken({
        requiredScope: 'https://www.googleapis.com/auth/analytics.readonly',
        runtime: { authNamespace: 'marketing' },
      });

      expect(genericStatus.configured).toBe(false);
      expect(marketingStatus).toMatchObject({
        authHome: marketingHome,
        configured: true,
        clientId: 'marketing-client',
      });
      expect(token).toBe('marketing-env-token');
      expect(
        googleAuthEnvEntries({
          runtime: { authNamespace: 'marketing' },
          env: {
            GOOGLE_MARKETING_ACCESS_TOKEN: 'token',
          },
        }),
      ).toContainEqual(
        expect.objectContaining({
          name: 'GOOGLE_MARKETING_ACCESS_TOKEN',
          kind: 'fallback-debug',
          configured: true,
        }),
      );
    } finally {
      if (previousGoogleHome === undefined) {
        delete process.env.UNISANE_GOOGLE_AUTH_HOME;
      } else {
        process.env.UNISANE_GOOGLE_AUTH_HOME = previousGoogleHome;
      }
      if (previousMarketingHome === undefined) {
        delete process.env.UNISANE_MARKETING_AUTH_HOME;
      } else {
        process.env.UNISANE_MARKETING_AUTH_HOME = previousMarketingHome;
      }
      if (previousMarketingToken === undefined) {
        delete process.env.GOOGLE_MARKETING_ACCESS_TOKEN;
      } else {
        process.env.GOOGLE_MARKETING_ACCESS_TOKEN = previousMarketingToken;
      }
      await rm(googleHome, { recursive: true, force: true });
      await rm(marketingHome, { recursive: true, force: true });
    }
  });
});
