import { expect, it, vi } from 'vitest';
import { adsAssets } from './run.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
vi.mock('../../../project-context.js', () => ({
  loadMarketingExecutionContext: async () => ({ config: {}, path: '/fixture/unisane.config.ts' }),
}));
vi.mock('../../../provider-runtime.js', () => ({ executeGrowthProviderCommand: vi.fn() }));
it('dispatches linking through the host with selected environment and explicit confirmation', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.mocked(executeGrowthProviderCommand).mockResolvedValueOnce({ ok: true, receipt: {} });
  try {
    expect(
      await adsAssets({
        assetMode: 'link-google-campaign',
        environment: 'test',
        connection: 'google',
        assetId: 'hero',
        campaignResource: 'customers/123/campaigns/4',
        accountConfirm: 'test:googleAds:123:ads-assets-link',
        yes: true,
      }),
    ).toBe(0);
    expect(executeGrowthProviderCommand).toHaveBeenCalledWith(
      'google.marketing.assets',
      expect.objectContaining({
        kind: 'link',
        environment: 'test',
        connection: 'google',
        assetIds: ['hero'],
        accountConfirm: 'test:googleAds:123:ads-assets-link',
      }),
    );
    expect(JSON.stringify(vi.mocked(executeGrowthProviderCommand).mock.calls)).not.toMatch(
      /accessToken|developerToken|credentials/,
    );
  } finally {
    log.mockRestore();
  }
});
