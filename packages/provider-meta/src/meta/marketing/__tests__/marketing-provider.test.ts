import { describe, expect, it, vi } from 'vitest';
import type {
  MarketingAdsAssetProviderUploadOptions,
  ProviderApiPullContext,
} from '@unisane/growth/contracts';
import { collectMetaSocialInventory, pullMetaAdsReport, uploadMetaAdsAsset } from '../index.js';

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  });
}

describe('@unisane/provider-meta marketing transport', () => {
  it('paginates and normalizes business, page, and Instagram inventory', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'business_1', name: 'Primary business' }],
          paging: { next: 'https://graph.facebook.com/v25.0/businesses-next' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'business_2' }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 'page_1',
              name: 'Product page',
              category: 'Software',
              instagram_business_account: {
                id: 'instagram_1',
                username: 'product',
              },
            },
          ],
        }),
      );

    const inventory = await collectMetaSocialInventory({
      accessToken: 'meta-access-token',
      fetch: fetcher,
      apiVersion: 'v25.0',
      pageSize: 50,
      maxPages: 3,
    });

    expect(inventory).toEqual({
      resources: [
        expect.objectContaining({
          type: 'business',
          id: 'business_1',
          title: 'Primary business',
        }),
        expect.objectContaining({ type: 'business', id: 'business_2' }),
        expect.objectContaining({
          type: 'page',
          id: 'page_1',
          title: 'Product page',
          metadata: { category: 'Software' },
        }),
        expect.objectContaining({
          type: 'instagramActor',
          id: 'instagram_1',
          parentId: 'page_1',
          metadata: { username: 'product' },
        }),
      ],
      warnings: [],
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    const businessUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(businessUrl.pathname).toBe('/v25.0/me/businesses');
    expect(businessUrl.searchParams.get('fields')).toBe('id,name');
    expect(businessUrl.searchParams.get('limit')).toBe('50');
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: { authorization: 'Bearer meta-access-token' },
    });
    expect(new URL(String(fetcher.mock.calls[2]?.[0])).pathname).toBe('/v25.0/me/accounts');
  });

  it('keeps independently accessible inventory while reporting provider failures', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: 'denied' }, 403, 'Forbidden'))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'page_1', name: 'Accessible page' }] }));

    const inventory = await collectMetaSocialInventory({
      accessToken: 'meta-access-token',
      fetch: fetcher,
      apiVersion: 'v25.0',
      pageSize: 25,
      maxPages: 1,
    });

    expect(inventory.resources).toEqual([
      expect.objectContaining({ type: 'page', id: 'page_1', title: 'Accessible page' }),
    ]);
    expect(inventory.warnings).toEqual([
      expect.stringContaining('Meta business inventory failed with 403 Forbidden'),
    ]);
  });

  it('builds a scoped report request and marks truncated provider pagination', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ campaign_id: 'campaign_1', impression_device: 'mobile_app' }],
          paging: {
            next: 'https://graph.facebook.com/v25.0/report-page-2?access_token=query-token&appsecret_proof=query-proof',
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ campaign_id: 'campaign_2', impression_device: 'desktop' }],
          paging: { next: 'https://graph.facebook.com/v25.0/report-page-3' },
        }),
      );
    const input: ProviderApiPullContext = {
      config: {} as ProviderApiPullContext['config'],
      options: {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        timeZone: 'UTC',
        reportType: 'device',
        pageSize: 100,
        maxPages: 2,
      },
      credentials: {
        accountId: '123456',
        accessToken: 'meta-access-token',
      },
      env: {},
      fetch: fetcher,
    };

    const report = await pullMetaAdsReport(input);

    expect(report).toEqual({
      accountId: '123456',
      inputFormat: 'meta-ads',
      reportType: 'device',
      value: {
        data: [
          { campaign_id: 'campaign_1', impression_device: 'mobile_app' },
          { campaign_id: 'campaign_2', impression_device: 'desktop' },
        ],
        partial: true,
        reportType: 'device',
        window: {
          startDate: '2026-07-01',
          endDate: '2026-07-31',
          timeZone: 'UTC',
        },
      },
    });
    const reportUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(reportUrl.pathname).toBe('/v25.0/act_123456/insights');
    expect(reportUrl.searchParams.get('level')).toBe('campaign');
    expect(reportUrl.searchParams.get('breakdowns')).toBe('impression_device');
    expect(reportUrl.searchParams.get('limit')).toBe('100');
    expect(JSON.parse(reportUrl.searchParams.get('time_range') ?? '')).toEqual({
      since: '2026-07-01',
      until: '2026-07-31',
    });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: { authorization: 'Bearer meta-access-token' },
    });
    const secondPageUrl = new URL(String(fetcher.mock.calls[1]?.[0]));
    expect(secondPageUrl.searchParams.has('access_token')).toBe(false);
    expect(secondPageUrl.searchParams.has('appsecret_proof')).toBe(false);
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      headers: { authorization: 'Bearer meta-access-token' },
    });
  });

  it('rejects pagination outside the configured Graph API boundary', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        data: [{ campaign_id: 'campaign_1' }],
        paging: { next: 'https://example.invalid/steal-report' },
      }),
    );

    await expect(
      pullMetaAdsReport({
        config: {} as ProviderApiPullContext['config'],
        options: {
          accountId: '123456',
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        },
        credentials: { accessToken: 'meta-access-token' },
        env: {},
        fetch: fetcher,
      }),
    ).rejects.toThrow('[MARKETING_META_ADS_PAGINATION_UNTRUSTED]');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not expose provider response bodies in report errors', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'secret-provider-detail' }, 403, 'Forbidden'));

    const error = await pullMetaAdsReport({
      config: {} as ProviderApiPullContext['config'],
      options: {
        accountId: '123456',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      },
      credentials: { accessToken: 'meta-access-token' },
      env: {},
      fetch: fetcher,
    }).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('HTTP 403');
    expect((error as Error).message).not.toContain('secret-provider-detail');
  });

  it('fails closed before report transport when canonical credentials are incomplete', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      pullMetaAdsReport({
        config: {} as ProviderApiPullContext['config'],
        options: {
          accountId: '123456',
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        },
        env: {},
        fetch: fetcher,
      }),
    ).rejects.toThrow('[MARKETING_META_ADS_CONNECTION_INCOMPLETE]');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uploads image bytes through the selected account and returns the provider hash', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        images: {
          'creative.png': { hash: 'image_hash_1' },
        },
      }),
    );
    const options: MarketingAdsAssetProviderUploadOptions = {
      config: {} as MarketingAdsAssetProviderUploadOptions['config'],
      operation: {
        provider: 'metaAds',
        assetType: 'image',
      } as MarketingAdsAssetProviderUploadOptions['operation'],
      source: {
        fileName: 'creative.png',
        mimeType: 'image/png',
        bytes: Uint8Array.from([1, 2, 3]),
      },
      env: {},
      credentials: {
        accountId: '123456',
        accessToken: 'meta-access-token',
      },
      fetch: fetcher,
      apiVersion: 'v25.0',
    };

    await expect(uploadMetaAdsAsset(options)).resolves.toEqual({
      providerAssetId: 'image_hash_1',
      message: 'Meta image asset upload sent.',
    });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://graph.facebook.com/v25.0/act_123456/adimages');
    const body = fetcher.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect((body as URLSearchParams).get('access_token')).toBe('meta-access-token');
    expect((body as URLSearchParams).get('bytes')).toBe('AQID');

    fetcher.mockResolvedValueOnce(
      jsonResponse({ images: { one: { hash: 'wrong-1' }, two: { hash: 'wrong-2' } } }),
    );
    await expect(uploadMetaAdsAsset(options)).rejects.toThrow('ADS_ASSET_META_UPLOAD_HASH_MISSING');
    fetcher.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'meta-access-token' } }), { status: 400 }),
    );
    await expect(uploadMetaAdsAsset(options)).rejects.toThrow(
      'Meta image upload failed (HTTP 400).',
    );
  });
});
