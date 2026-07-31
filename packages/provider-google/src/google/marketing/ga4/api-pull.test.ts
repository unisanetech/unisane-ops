import type { ProviderApiPullContext } from '@unisane/growth/contracts';
import { describe, expect, it } from 'vitest';
import { pullGa4Report } from './api-pull.js';

describe('GA4 ecommerce pull', () => {
  it('uses item-scoped metrics with the itemName dimension', async () => {
    let requestBody: Record<string, unknown> = {};
    const fetcher: typeof fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          dimensionHeaders: [{ name: 'itemName' }],
          metricHeaders: [],
          rows: [],
          rowCount: 0,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    await pullGa4Report({
      config: {} as ProviderApiPullContext['config'],
      options: {
        accountId: '538672487',
        startDate: '2026-07-01',
        endDate: '2026-07-29',
        reportType: 'ecommerce',
      },
      credentials: { accessToken: '<REDACTED>' },
      env: {},
      fetch: fetcher,
    });

    expect(requestBody).toMatchObject({
      dimensions: [{ name: 'itemName' }],
      metrics: [
        { name: 'itemsViewed' },
        { name: 'itemsAddedToCart' },
        { name: 'itemsPurchased' },
        { name: 'itemRevenue' },
      ],
    });
  });
});
