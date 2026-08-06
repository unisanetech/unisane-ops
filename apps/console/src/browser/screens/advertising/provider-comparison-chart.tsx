import type { MarketingConsoleState } from '@unisane/growth/console';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatNumber } from '../../lib/format.js';
import { ComparisonBarChart } from '../../shared/comparison-bar-chart.js';
import { formatMoney } from '../channels/shared.js';

type AdvertisingProvider = MarketingConsoleState['advertising']['providers'][number];

export function AdvertisingProviderSpendComparison({
  providers,
}: {
  providers: Array<Pick<AdvertisingProvider, 'scope' | 'label' | 'metrics' | 'sources'>>;
}) {
  const rows = providers
    .map((provider) => {
      const spend = provider.metrics.find((metric) => metric.id === 'spend');
      const clicks = provider.metrics.find((metric) => metric.id === 'paid-clicks');
      const conversions = provider.metrics.find((metric) => metric.id === 'paid-conversions');
      return {
        provider,
        spend: spend?.numericValue,
        currencyCode: spend?.currencyCode,
        clicks: clicks?.numericValue,
        conversions: conversions?.numericValue,
      };
    })
    .filter((row): row is typeof row & { spend: number } => row.spend !== undefined);

  if (rows.length < 2) return null;

  const currencies = [
    ...new Set(
      rows.map((row) => row.currencyCode).filter((value): value is string => Boolean(value)),
    ),
  ];
  if (currencies.length > 1 || rows.some((row) => !row.currencyCode)) {
    return (
      <Card variant="low" padding="sm" className="border-outline-weak border">
        <Typography variant="titleSmall" className="font-semibold">
          Provider spend is kept separate.
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
          A combined visual comparison is not shown because the provider reports do not share one
          recorded currency. Review each provider view without converting or summing unlike values.
        </Typography>
      </Card>
    );
  }

  const includesSampleData = rows.some((row) =>
    row.provider.sources.some((source) => source.sourceKind === 'fixture'),
  );

  return (
    <ComparisonBarChart
      title="Provider-reported spend"
      description="Compare recorded advertising cost across connected providers for the selected period."
      items={rows.map((row, index) => ({
        id: row.provider.scope,
        label: row.provider.label,
        value: row.spend,
        valueLabel: formatMoney(row.spend, row.currencyCode),
        detail: [
          row.clicks === undefined ? undefined : `${formatNumber(row.clicks)} clicks`,
          row.conversions === undefined
            ? undefined
            : `${formatNumber(row.conversions)} provider-attributed conversions`,
        ]
          .filter(Boolean)
          .join(' · '),
        tone: index === 0 ? 'primary' : 'secondary',
      }))}
      caption={`Provider-reported values remain separate from canonical outcomes.${includesSampleData ? ' Includes explicitly labelled sample data.' : ''}`}
      compact
    />
  );
}
