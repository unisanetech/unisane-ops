import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  MarketingAdsAssetProviderUploadOptions,
  MarketingAdsLiveProviderExecutionOptions,
  MarketingConfig,
  ProviderApiPullContext,
} from '@unisane/growth/contracts';
import {
  deleteMarketingMetaAuthProfile,
  getMarketingMetaAuthStatus,
  resolveMarketingMetaAccessToken,
  saveMarketingMetaAuthProfile,
} from '../auth.js';
import {
  collectMetaSocialInventory,
  discoverMarketingMetaAccounts,
  executeMetaAdsLiveOperation,
  pullMetaAdsReport,
  uploadMetaAdsAsset,
} from '../marketing/index.js';

function marketingConfig(): MarketingConfig {
  return {
    version: 1,
    platformId: 'example',
    appId: 'example',
    defaultEnvironment: 'production',
    environments: {},
    paths: {
      gtmManifest: 'config/google-tag-manager.ts',
      webTrackingConfig: 'config/web-tracking.ts',
      webConversionsConfig: 'config/web-conversions.ts',
      eventRegistry: 'docs/marketing/events.json',
      conversionRegistry: 'docs/marketing/conversions.json',
      sourceRoots: ['src'],
      seoRoot: 'docs/seo',
      marketingRoot: 'docs/marketing',
      analyticsRoot: 'docs/analytics',
    },
    providers: {
      googleAds: { state: 'disabled', googleSearchDefaults: {} },
      metaAds: {
        state: 'configured',
        accountIdEnv: 'META_ACCOUNT_ID',
        accessTokenEnv: 'META_ACCESS_TOKEN',
        pixelIdEnv: 'META_PIXEL_ID',
        pageIdEnv: 'META_PAGE_ID',
        googleSearchDefaults: {},
      },
      ga4: { state: 'disabled', googleSearchDefaults: {} },
      searchConsole: { state: 'disabled', googleSearchDefaults: {} },
    },
    attributionStore: {
      state: 'planned',
      freshnessWarningDays: 7,
    },
    requiredEnv: [],
  };
}

describe('Meta provider family', () => {
  it('owns saved Meta auth profiles without exposing the token in status', async () => {
    const authHome = mkdtempSync(path.join(tmpdir(), 'unisane-meta-auth-'));
    const runtime = { authHome, store: 'file' as const, allowPlaintextStore: true };
    try {
      await saveMarketingMetaAuthProfile({
        profile: 'test',
        accessToken: 'redacted-test-token',
        scopes: ['ads_read'],
        secretStore: 'file',
        runtime,
      });

      await expect(
        resolveMarketingMetaAccessToken({
          accessTokenEnv: 'UNISANE_TEST_META_TOKEN_NOT_SET',
          authProfile: 'test',
          runtime,
        }),
      ).resolves.toBe('redacted-test-token');
      await expect(getMarketingMetaAuthStatus({ profile: 'test', runtime })).resolves.toEqual(
        expect.objectContaining({
          configured: true,
          accessTokenStored: true,
          scopes: ['ads_read'],
          secretStore: 'file',
        }),
      );

      await deleteMarketingMetaAuthProfile({ profile: 'test', runtime });
      await expect(getMarketingMetaAuthStatus({ profile: 'test', runtime })).resolves.toEqual(
        expect.objectContaining({ configured: false, accessTokenStored: false }),
      );
    } finally {
      rmSync(authHome, { recursive: true, force: true });
    }
  });

  it('discovers Meta ad accounts and pixels through provider-owned Graph transport', async () => {
    const calls: string[] = [];
    const report = await discoverMarketingMetaAccounts(marketingConfig(), {
      accessToken: 'redacted-test-token',
      fetch: async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.includes('/me/adaccounts')) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: 'act_123',
                  account_id: '123',
                  name: 'Example',
                  account_status: 1,
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: [{ id: 'pixel_1', name: 'Example Pixel' }] }), {
          status: 200,
        });
      },
    });

    expect(calls).toHaveLength(2);
    expect(report.adAccounts.accounts[0]).toEqual(
      expect.objectContaining({ accountId: 'act_123', displayName: 'Example' }),
    );
    expect(report.pixels.pixels[0]).toEqual(
      expect.objectContaining({ id: 'pixel_1', accountId: 'act_123' }),
    );
  });

  it('paginates Meta Ads reports through the provider-owned transport', async () => {
    const calls: string[] = [];
    const context: ProviderApiPullContext = {
      config: marketingConfig(),
      options: {
        startDate: '2026-07-01',
        endDate: '2026-07-24',
        pageSize: 25,
      },
      env: {
        META_ACCOUNT_ID: '123',
        META_ACCESS_TOKEN: 'redacted-test-token',
      },
      fetch: async (input) => {
        calls.push(String(input));
        return new Response(
          JSON.stringify({ data: [{ campaign_id: 'campaign_1', impressions: '10' }] }),
          { status: 200 },
        );
      },
    };

    const result = await pullMetaAdsReport(context);

    expect(calls[0]).toContain('/v25.0/act_123/insights');
    expect(calls[0]).toContain('limit=25');
    expect(result).toEqual(
      expect.objectContaining({
        accountId: '123',
        inputFormat: 'meta-ads',
      }),
    );
  });

  it('collects business, Page, and Instagram inventory through one provider connection', async () => {
    const inventory = await collectMetaSocialInventory({
      accessToken: 'redacted-test-token',
      apiVersion: 'v25.0',
      pageSize: 25,
      maxPages: 2,
      fetch: async (input) => {
        if (String(input).includes('/me/businesses')) {
          return new Response(JSON.stringify({ data: [{ id: 'business_1', name: 'Example' }] }), {
            status: 200,
          });
        }
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'page_1',
                name: 'Example Page',
                instagram_business_account: {
                  id: 'instagram_1',
                  username: 'example',
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    expect(inventory.warnings).toEqual([]);
    expect(inventory.resources.map((resource) => resource.type)).toEqual([
      'business',
      'page',
      'instagramActor',
    ]);
  });

  it('uploads image assets and sends campaign pauses through injected Growth contracts', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      if (String(input).includes('/adimages')) {
        return new Response(
          JSON.stringify({ images: { 'creative.png': { hash: 'image_hash_1' } } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    const config = marketingConfig();
    const env = {
      META_ACCOUNT_ID: '123',
      META_ACCESS_TOKEN: 'redacted-test-token',
    };

    const asset = await uploadMetaAdsAsset({
      config,
      operation: {
        provider: 'metaAds',
        assetType: 'image',
      },
      source: {
        fileName: 'creative.png',
        mimeType: 'image/png',
        bytes: new Uint8Array([1, 2, 3]),
      },
      env,
      fetch: fetcher,
    } as MarketingAdsAssetProviderUploadOptions);
    const pause = await executeMetaAdsLiveOperation({
      config,
      plan: {},
      operation: {
        provider: 'metaAds',
        actionType: 'pause_campaign',
      },
      candidate: {
        campaignIds: ['campaign_1'],
      },
      env,
      fetch: fetcher,
    } as MarketingAdsLiveProviderExecutionOptions);

    expect(asset.providerAssetId).toBe('image_hash_1');
    expect(pause.providerOperationId).toBe('campaign_1');
    expect(calls.map((call) => call.url)).toEqual([
      expect.stringContaining('/v25.0/act_123/adimages'),
      expect.stringContaining('/v23.0/campaign_1'),
    ]);
    expect(calls.every((call) => call.init?.method === 'POST')).toBe(true);
  });
});
