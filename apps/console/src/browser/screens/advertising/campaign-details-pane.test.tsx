import { renderToStaticMarkup } from 'react-dom/server';
import type { MarketingConsoleSourceSummary } from '@unisane/growth/console';
import { describe, expect, it } from 'vitest';
import { CampaignDetailsPane } from './campaign-details-pane.js';
import type { AdvertisingCampaign } from './campaign-presenters.js';

const campaign: AdvertisingCampaign = {
  id: 'campaign-1',
  provider: 'googleAds',
  providerLabel: 'Google Ads',
  name: 'Resume search campaign',
  deliveryStatus: 'LIMITED',
  primaryStatusReasons: ['LIMITED_BY_BUDGET'],
  channelType: 'SEARCH',
  dailyBudget: 1000,
  sharedBudget: false,
  biddingStrategy: 'MAXIMIZE_CONVERSIONS',
  biddingStrategyStatus: 'LEARNING',
  startDate: '2026-07-01T00:00:00.000Z',
  spend: 8400,
  impressions: 42_000,
  clicks: 2_100,
  conversions: 84,
  conversionValue: 31_500,
  currencyCode: 'INR',
  ctr: 5,
  cpc: 4,
  cpa: 100,
  roas: 3.75,
};

const source: MarketingConsoleSourceSummary = {
  provider: 'googleAds',
  sourceKind: 'fixture',
  status: 'ready',
  label: 'Google Ads',
  freshnessLabel: '2 days old',
  detail: 'Selected-period Google Ads campaign report.',
  available: true,
};

describe('campaign details pane', () => {
  it('presents operational campaign context without implying that the pane can change it', () => {
    const html = renderToStaticMarkup(<CampaignDetailsPane campaign={campaign} source={source} />);

    expect(html).toContain('Limited');
    expect(html).toContain('Limited by budget');
    expect(html).toContain('Performance');
    expect(html).toContain('Current-period funnel');
    expect(html).toContain('Impressions to clicks');
    expect(html).toContain('not change over time');
    expect(html).toContain('Budget and bidding');
    expect(html).toContain('Schedule');
    expect(html).toContain('Reporting context');
    expect(html).toContain('Sample data');
    expect(html).toContain('Previous-period evidence is not recorded');
    expect(html).toContain('This panel is read-only');
  });
});
