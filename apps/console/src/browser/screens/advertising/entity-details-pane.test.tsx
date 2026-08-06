import { renderToStaticMarkup } from 'react-dom/server';
import type {
  MarketingConsoleAdvertisingEntity,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { describe, expect, it } from 'vitest';
import { AdvertisingEntityDetailsPane } from './entity-details-pane.js';

const source: MarketingConsoleSourceSummary = {
  provider: 'metaAds',
  sourceKind: 'fixture',
  status: 'ready',
  label: 'Meta Ads',
  freshnessLabel: 'Current',
  detail: 'Explicitly labelled Meta sample evidence.',
  available: true,
};

const entity: MarketingConsoleAdvertisingEntity = {
  id: 'creative-1',
  provider: 'metaAds',
  providerLabel: 'Meta Ads',
  level: 'creative',
  name: 'Resume builder product card',
  campaignName: 'Resume Builder Prospecting',
  adSetName: 'India · Early career',
  deliveryStatus: 'ACTIVE',
  assetType: 'VIDEO',
  headline: 'Build a resume in minutes',
  body: 'Start from a proven template.',
  destinationUrl: 'https://example.com/resume-builder',
  spend: 6400,
  impressions: 101_000,
  clicks: 1690,
  conversions: 58,
  conversionValue: 22_000,
  currencyCode: 'INR',
  ctr: 1.67,
  cpc: 3.79,
  cpa: 110.34,
  roas: 3.44,
};

describe('advertising entity details pane', () => {
  it('presents Meta performance, funnel, placement, creative, and evidence context', () => {
    const html = renderToStaticMarkup(
      <AdvertisingEntityDetailsPane entity={entity} source={source} />,
    );

    expect(html).toContain('Creative details');
    expect(html).toContain('Current-period funnel');
    expect(html).toContain('Placement context');
    expect(html).toContain('India · Early career');
    expect(html).toContain('Creative evidence');
    expect(html).toContain('Build a resume in minutes');
    expect(html).toContain('Sample data');
    expect(html).toContain('Previous-period evidence is not recorded');
    expect(html).toContain('This panel is read-only');
  });
});
