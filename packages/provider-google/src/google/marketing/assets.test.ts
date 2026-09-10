import { expect, it, vi } from 'vitest';
import type { MarketingAdsAssetProviderUploadOptions } from '@unisane/growth/contracts';
import { createGoogleAdsAssetProvider } from './assets.js';
const link = {
  customerId: '123',
  campaignResourceName: 'customers/123/campaigns/4',
  providerAssetIds: ['customers/123/assets/5'],
  fieldType: 'MARKETING_IMAGE' as const,
};
function fixture() {
  const fetcher = vi.fn<typeof fetch>();
  return {
    fetcher,
    provider: createGoogleAdsAssetProvider({
      customerId: '123',
      accessToken: 'secret-fixture',
      developerToken: 'dev-fixture',
      fetch: fetcher,
    }),
  };
}
it('uploads image bytes and links exact selected resources', async () => {
  const { provider, fetcher } = fixture();
  fetcher.mockResolvedValueOnce(
    new Response(JSON.stringify({ results: [{ resourceName: 'customers/123/assets/5' }] })),
  );
  const upload = {
    operation: { provider: 'googleAds', assetId: 'hero', assetType: 'image' },
    source: { fileName: 'hero.png', bytes: new Uint8Array([1, 2, 3]) },
  } as MarketingAdsAssetProviderUploadOptions;
  expect((await provider.upload(upload)).providerAssetId).toBe('customers/123/assets/5');
  expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
    partialFailure: false,
    operations: [{ create: { imageAsset: { data: 'AQID' } } }],
  });
  fetcher.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        results: [{ resourceName: 'customers/123/campaignAssets/4~5~MARKETING_IMAGE' }],
      }),
    ),
  );
  expect((await provider.link(link)).providerResourceNames).toHaveLength(1);
});
it('rejects foreign and duplicate targets before network access', async () => {
  const { provider, fetcher } = fixture();
  await expect(
    provider.link({ ...link, providerAssetIds: ['customers/999/assets/5'] }),
  ).rejects.toThrow();
  await expect(
    provider.link({
      ...link,
      providerAssetIds: [link.providerAssetIds[0]!, link.providerAssetIds[0]!],
    }),
  ).rejects.toThrow();
  await expect(provider.link({ ...link, customerId: '999' })).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it('rejects incomplete, foreign and partial mutation receipts without retry', async () => {
  for (const body of [
    {},
    { results: [] },
    { results: [{ resourceName: 'customers/123/campaignAssets/99~5~2' }] },
    { results: [{ resourceName: 'customers/999/campaignAssets/4~5~2' }] },
    { results: [{ resourceName: 'customers/123/campaignAssets/4~5~2' }], partialFailureError: {} },
  ]) {
    const { provider, fetcher } = fixture();
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify(body)));
    await expect(provider.link(link)).rejects.toThrow('OUTCOME_UNKNOWN');
    expect(fetcher).toHaveBeenCalledOnce();
  }
});
it('redacts HTTP bodies, malformed JSON and transport errors', async () => {
  for (const response of [
    new Response('secret-fixture', { status: 403 }),
    new Response('secret-fixture'),
    new Error('secret-fixture'),
  ]) {
    const { provider, fetcher } = fixture();
    if (response instanceof Error) fetcher.mockRejectedValueOnce(response);
    else fetcher.mockResolvedValueOnce(response);
    const error = await provider.link(link).catch((error) => error);
    expect(error.message).toContain('ADS_ASSET_GOOGLE_');
    expect(error.message).not.toContain('secret-fixture');
    expect(fetcher).toHaveBeenCalledOnce();
  }
});
