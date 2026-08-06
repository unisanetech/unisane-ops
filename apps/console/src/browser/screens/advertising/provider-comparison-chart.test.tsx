import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdvertisingProviderSpendComparison } from './provider-comparison-chart.js';

const source = {
  status: 'ready' as const,
  label: 'Provider report',
  freshnessLabel: 'Current',
  detail: 'Recorded report.',
  available: true,
};

const providers = [
  {
    scope: 'googleAds' as const,
    label: 'Google Ads',
    sources: [{ ...source, provider: 'googleAds' as const }],
    metrics: [
      {
        id: 'spend',
        label: 'Spend',
        value: '$200',
        numericValue: 200,
        currencyCode: 'USD',
        definition: 'Provider cost.',
        sourceLabel: 'Google Ads',
        freshnessLabel: 'Current',
        comparisonLabel: 'Unavailable',
        status: 'ready' as const,
      },
    ],
  },
  {
    scope: 'metaAds' as const,
    label: 'Meta Ads',
    sources: [{ ...source, provider: 'metaAds' as const }],
    metrics: [
      {
        id: 'spend',
        label: 'Spend',
        value: '$100',
        numericValue: 100,
        currencyCode: 'USD',
        definition: 'Provider cost.',
        sourceLabel: 'Meta Ads',
        freshnessLabel: 'Current',
        comparisonLabel: 'Unavailable',
        status: 'ready' as const,
      },
    ],
  },
];

describe('AdvertisingProviderSpendComparison', () => {
  it('compares compatible provider spend without treating attribution as canonical', () => {
    const html = renderToStaticMarkup(<AdvertisingProviderSpendComparison providers={providers} />);
    expect(html).toContain('Provider-reported spend');
    expect(html).toContain('Google Ads');
    expect(html).toContain('Meta Ads');
    expect(html).toContain('remain separate from canonical outcomes');
  });

  it('does not combine unlike currencies', () => {
    const html = renderToStaticMarkup(
      <AdvertisingProviderSpendComparison
        providers={[
          providers[0]!,
          {
            ...providers[1]!,
            metrics: [{ ...providers[1]!.metrics[0]!, currencyCode: 'INR' }],
          },
        ]}
      />,
    );
    expect(html).toContain('Provider spend is kept separate');
    expect(html).toContain('do not share one recorded currency');
  });
});
