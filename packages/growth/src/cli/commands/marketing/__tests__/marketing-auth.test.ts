import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../provider-runtime.js', async () => {
  const { executeGrowthTestProviderCommand } =
    await import('../../../__tests__/provider-command.js');
  return { executeGrowthProviderCommand: executeGrowthTestProviderCommand };
});
import {
  getMarketingGoogleAuthStatus,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_AUTH_SCOPES,
  marketingGoogleAuthEnvEntries,
  marketingGoogleAuthStatusToControlPlaneProfile,
  resolveMarketingGoogleAccessToken,
  saveMarketingGoogleAuthProfile,
} from '../auth/google.js';
import {
  getMarketingMetaAuthStatus,
  marketingMetaAuthEnvEntries,
  marketingMetaAuthStatusToControlPlaneProfile,
  resolveMarketingMetaAccessToken,
  saveMarketingMetaAuthProfile,
} from '../auth/meta.js';

describe('marketing google auth profiles', () => {
  it('uses one saved Google profile for marketing provider scopes', async () => {
    const authHome = await mkdtemp(join(tmpdir(), 'unisane-marketing-auth-'));
    try {
      await saveMarketingGoogleAuthProfile({
        profile: 'true-resume',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
        scopes: [...MARKETING_GOOGLE_AUTH_SCOPES],
        secretStore: 'file',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });

      const status = await getMarketingGoogleAuthStatus({
        profile: 'true-resume',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });
      const token = await resolveMarketingGoogleAccessToken({
        authProfile: 'true-resume',
        requiredScope: MARKETING_GOOGLE_ANALYTICS_SCOPE,
        runtime: {
          authHome,
          store: 'file',
          allowPlaintextStore: true,
          fetch: async () =>
            new Response(
              JSON.stringify({
                access_token: 'marketing-access-token',
                expires_in: 3600,
                scope: `${MARKETING_GOOGLE_ADS_SCOPE} ${MARKETING_GOOGLE_ANALYTICS_SCOPE}`,
                token_type: 'Bearer',
              }),
            ),
        },
      });

      expect(status).toMatchObject({
        configured: true,
        profile: 'true-resume',
        refreshTokenStored: true,
        clientSecretStored: true,
      });
      expect(status.scopes).toEqual([...MARKETING_GOOGLE_AUTH_SCOPES]);
      expect(
        marketingGoogleAuthStatusToControlPlaneProfile({
          status,
          requiredScopes: [MARKETING_GOOGLE_ANALYTICS_SCOPE],
        }),
      ).toEqual(
        expect.objectContaining({
          provider: 'google',
          profile: 'true-resume',
          status: 'ready',
        }),
      );
      expect(
        marketingGoogleAuthEnvEntries({
          env: {
            GOOGLE_OAUTH_CLIENT_ID: 'client-id',
            GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
            GOOGLE_MARKETING_ACCESS_TOKEN: 'access-token',
          },
        }),
      ).toContainEqual(
        expect.objectContaining({
          name: 'GOOGLE_MARKETING_ACCESS_TOKEN',
          kind: 'fallback-debug',
          configured: true,
          example: null,
        }),
      );
      expect(token).toBe('marketing-access-token');
    } finally {
      await rm(authHome, { recursive: true, force: true });
    }
  });
});

describe('marketing meta auth profiles', () => {
  it('stores a local Meta token profile without exposing token values', async () => {
    const authHome = await mkdtemp(join(tmpdir(), 'unisane-marketing-meta-auth-'));
    try {
      await saveMarketingMetaAuthProfile({
        profile: 'true-resume',
        accessToken: 'meta-access-token',
        scopes: ['ads_read', 'business_management'],
        secretStore: 'file',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });

      const status = await getMarketingMetaAuthStatus({
        profile: 'true-resume',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });
      const token = await resolveMarketingMetaAccessToken({
        authProfile: 'true-resume',
        runtime: { authHome, store: 'file', allowPlaintextStore: true },
      });

      expect(status).toMatchObject({
        configured: true,
        profile: 'true-resume',
        accessTokenStored: true,
        scopes: ['ads_read', 'business_management'],
      });
      expect(
        marketingMetaAuthStatusToControlPlaneProfile({
          status,
          requiredScopes: ['ads_read'],
        }),
      ).toEqual(
        expect.objectContaining({
          provider: 'meta',
          profile: 'true-resume',
          status: 'ready',
          requiredScopes: ['ads_read'],
        }),
      );
      expect(
        marketingMetaAuthEnvEntries({
          env: {
            META_ADS_ACCESS_TOKEN: 'meta-access-token',
            UNISANE_MARKETING_META_AUTH_PROFILE: 'true-resume',
          },
        }),
      ).toContainEqual(
        expect.objectContaining({
          name: 'META_ADS_ACCESS_TOKEN',
          kind: 'fallback-debug',
          configured: true,
          example: null,
        }),
      );
      expect(JSON.stringify(status)).not.toContain('meta-access-token');
      expect(token).toBe('meta-access-token');
    } finally {
      await rm(authHome, { recursive: true, force: true });
    }
  });
});
