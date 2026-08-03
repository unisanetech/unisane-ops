import { describe, expect, it, vi } from 'vitest';
import {
  createGoogleAdsCampaignControlAdapter,
  pauseGoogleAdsCampaign,
  readGoogleAdsCampaignStatus,
} from './live-ads-executor.js';

const credentials = {
  customerId: '123-456-7890',
  campaignId: '998877',
  accessToken: 'secret-access-token',
  developerToken: 'secret-developer-token',
};

describe('Google Ads campaign control', () => {
  it('sends one exact pause mutation and reads the resulting campaign status', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ results: [{ resourceName: 'customers/1234567890/campaigns/998877' }] }),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ results: [{ campaign: { id: '998877', status: 'PAUSED' } }] }]),
          {
            status: 200,
          },
        ),
      );

    const paused = await pauseGoogleAdsCampaign({ ...credentials, fetcher });
    expect(paused).toEqual({
      outcome: 'succeeded',
      providerOperationId: 'customers/1234567890/campaigns/998877',
      safeMessage: 'Google Ads confirmed the campaign pause request.',
    });
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://googleads.googleapis.com/v24/customers/1234567890/campaigns:mutate',
    );
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      operations: [
        {
          updateMask: 'status',
          update: {
            resourceName: 'customers/1234567890/campaigns/998877',
            status: 'PAUSED',
          },
        },
      ],
    });
    expect(await readGoogleAdsCampaignStatus({ ...credentials, fetcher })).toBe('paused');
    expect(String(fetcher.mock.calls[1]?.[1]?.body)).toContain('campaign.id = 998877');
  });

  it('captures credentials in an exact provider adapter instead of action input', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const adapter = createGoogleAdsCampaignControlAdapter({
      accessToken: credentials.accessToken,
      developerToken: credentials.developerToken,
      fetcher,
    });
    await adapter.pauseCampaign({
      providerAccountId: credentials.customerId,
      campaignId: '998877',
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns an unknown outcome after a transport failure without leaking credentials', async () => {
    const result = await pauseGoogleAdsCampaign({
      ...credentials,
      fetcher: vi.fn().mockRejectedValue(new Error(`network ${credentials.accessToken}`)),
    });
    expect(result).toMatchObject({ outcome: 'outcome-unknown' });
    expect(JSON.stringify(result)).not.toContain(credentials.accessToken);
    expect(JSON.stringify(result)).not.toContain(credentials.developerToken);
  });
});
