import { describe, expect, it, vi } from 'vitest';
import {
  createMetaAdsCampaignControlAdapter,
  pauseMetaAdsCampaign,
  readMetaAdsCampaignStatus,
} from './live-ads-executor.js';

const credentials = {
  providerAccountId: 'act_123456',
  campaignId: '998877',
  accessToken: 'secret-meta-token',
};

describe('Meta Ads campaign control', () => {
  it('sends one exact pause mutation and reads the resulting campaign status', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '998877', status: 'PAUSED' }), { status: 200 }),
      );

    const paused = await pauseMetaAdsCampaign({ ...credentials, fetcher });
    expect(paused).toEqual({
      outcome: 'succeeded',
      providerOperationId: '998877',
      safeMessage: 'Meta Ads confirmed the campaign pause request.',
    });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://graph.facebook.com/v23.0/998877');
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain('status=PAUSED');
    expect(await readMetaAdsCampaignStatus({ ...credentials, fetcher })).toBe('paused');
    expect(String(fetcher.mock.calls[1]?.[0])).toContain('fields=id%2Cstatus');
  });

  it('captures credentials in an exact provider adapter instead of action input', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const adapter = createMetaAdsCampaignControlAdapter({
      accessToken: credentials.accessToken,
      fetcher,
    });
    await adapter.pauseCampaign({
      providerAccountId: credentials.providerAccountId,
      campaignId: credentials.campaignId,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns an unknown outcome after a transport failure without leaking credentials', async () => {
    const result = await pauseMetaAdsCampaign({
      ...credentials,
      fetcher: vi.fn().mockRejectedValue(new Error(`network ${credentials.accessToken}`)),
    });
    expect(result).toMatchObject({ outcome: 'outcome-unknown' });
    expect(JSON.stringify(result)).not.toContain(credentials.accessToken);
  });
});
