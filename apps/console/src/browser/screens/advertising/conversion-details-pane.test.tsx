import { renderToStaticMarkup } from 'react-dom/server';
import type {
  MarketingConsoleAdvertisingConversion,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { describe, expect, it } from 'vitest';
import { ConversionDetailsPane } from './conversion-details-pane.js';

const conversion: MarketingConsoleAdvertisingConversion = {
  id: 'meta-actions',
  provider: 'metaAds',
  providerLabel: 'Meta Ads',
  name: 'Meta attributed actions',
  conversions: 241,
  conversionValue: 139_400,
  currencyCode: 'INR',
  measurementLabel:
    'Aggregate actions reported by Meta campaign evidence; canonical conversion reconciliation remains separate.',
};

const source: MarketingConsoleSourceSummary = {
  provider: 'metaAds',
  sourceKind: 'fixture',
  status: 'ready',
  label: 'Meta Ads',
  freshnessLabel: 'Current',
  detail: 'Explicitly labelled Meta sample evidence.',
  available: true,
};

describe('conversion details pane', () => {
  it('separates provider outcomes, measurement meaning, next step, and source limits', () => {
    const html = renderToStaticMarkup(
      <ConversionDetailsPane conversion={conversion} source={source} />,
    );

    expect(html).toContain('Conversion action details');
    expect(html).toContain('Provider-attributed outcomes');
    expect(html).toContain('241');
    expect(html).toContain('Measurement evidence');
    expect(html).toContain('canonical conversion reconciliation remains separate');
    expect(html).toContain('Recommended next step');
    expect(html).toContain('reconcile it with canonical outcomes');
    expect(html).toContain('Sample data');
    expect(html).toContain('This panel is read-only');
  });
});
