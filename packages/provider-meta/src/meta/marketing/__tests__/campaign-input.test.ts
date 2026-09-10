import { describe, expect, it, vi } from 'vitest';
import type { MarketingAdsLiveProviderExecutionOptions } from '@unisane/growth/contracts';
import { metaCampaignDailyBudget, resolveMetaCampaignDestination } from '../campaign-input.js';
import { executeMetaAdsLiveOperation } from '../live-ads-executor.js';

describe('reviewed Meta campaign inputs', () => {
  it('resolves explicit destinations without a product-specific fallback', () => {
    expect(resolveMetaCampaignDestination(undefined, 'https://shop.example/item?q=1')).toBe(
      'https://shop.example/item?q=1',
    );
    expect(resolveMetaCampaignDestination('https://shop.example', '/item')).toBe(
      'https://shop.example/item',
    );
    expect(resolveMetaCampaignDestination('https://shop.example', 'item')).toBe(
      'https://shop.example/item',
    );
  });

  it.each([
    [undefined, '/item'],
    [undefined, ''],
    ['https://shop.example', '//other.example/item'],
    [undefined, 'javascript:alert(1)'],
    [undefined, 'https://user:secret@shop.example'],
    ['https://user:secret@shop.example', '/item'],
    ['https://shop.example/path', '/item'],
    ['https://shop.example', '\\other.example'],
  ])('rejects an invalid or ambiguous destination without exposing input', (origin, value) => {
    expect(() => resolveMetaCampaignDestination(origin, value!)).toThrow(
      'ADS_LIVE_META_DESTINATION_INVALID',
    );
    try {
      resolveMetaCampaignDestination(origin, value!);
    } catch (error) {
      expect(String(error)).not.toContain('secret');
    }
  });

  it.each([undefined, 0, -1, NaN, Infinity, 0.001, Number.MAX_VALUE])(
    'rejects missing or unrepresentable budget %s',
    (value) => {
      expect(() => metaCampaignDailyBudget(value)).toThrow(/ADS_LIVE_META_BUDGET_/);
    },
  );

  it('preserves explicit budget conversion', () => {
    expect(metaCampaignDailyBudget(12.34)).toBe(1234);
  });

  it.each([
    { destinationUrl: '/item', dailyBudgetAmount: 12, code: 'DESTINATION_INVALID' },
    {
      destinationUrl: 'https://shop.example/item',
      dailyBudgetAmount: undefined,
      code: 'BUDGET_REQUIRED',
    },
  ])('rejects $code before creating even the campaign', async (input) => {
    const fetcher = vi.fn<typeof fetch>();
    // Only these fields are consumed by the provider create path; no host state is involved.
    const options = {
      operation: { provider: 'metaAds', actionType: 'create_campaign' },
      candidate: {
        budgetGuardrail: { dailyBudgetAmount: input.dailyBudgetAmount },
        metaAdsBuildout: {
          destinationUrl: input.destinationUrl,
          creative: {
            providerAssetId: 'asset-1',
            primaryText: 'Reviewed copy',
            headline: 'Reviewed title',
          },
        },
      },
      credentials: {
        accountId: 'account-1',
        pageId: 'page-1',
        pixelId: 'pixel-1',
        accessToken: 'fixture-token',
      },
      fetch: fetcher,
    } as MarketingAdsLiveProviderExecutionOptions;
    await expect(executeMetaAdsLiveOperation(options)).rejects.toThrow(
      `ADS_LIVE_META_${input.code}`,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
