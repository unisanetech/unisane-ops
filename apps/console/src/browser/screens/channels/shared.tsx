import type {
  MarketingConsoleMetric,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Typography } from '@unisane/ui/typography';
import { healthStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, MetricCard, MetricGrid } from '../../shared/content.js';

export function ChannelMetrics({
  metrics,
  ids,
}: {
  metrics: MarketingConsoleMetric[];
  ids: string[];
}) {
  const selected = ids
    .map((id) => metrics.find((metric) => metric.id === id))
    .filter((metric): metric is MarketingConsoleMetric => metric !== undefined);
  if (!selected.length) return null;
  return (
    <ContentSection>
      <MetricGrid>
        {selected.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            helper={metric.definition}
            context={`${metric.sourceLabel} · ${metric.freshnessLabel}`}
          />
        ))}
      </MetricGrid>
    </ContentSection>
  );
}

export function SourceSummary({ source }: { source: MarketingConsoleSourceSummary }) {
  return (
    <ContentSection title="Data source">
      <div className="border-outline-soft bg-surface flex flex-wrap items-start justify-between gap-3 rounded-sm border px-4 py-3">
        <div>
          <Typography variant="labelLarge">{source.label}</Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-1 max-w-2xl">
            {source.detail}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {source.sourceKind === 'fixture' ? (
            <Badge variant="tonal" color="warning" size="sm">
              Sample data
            </Badge>
          ) : null}
          {source.sourceKind !== 'fixture' ? (
            <Badge variant="tonal" color={statusColor(source.status)} size="sm">
              {source.available ? source.freshnessLabel : healthStatusLabel(source.status)}
            </Badge>
          ) : null}
        </div>
      </div>
    </ContentSection>
  );
}

export function SourceSummaries({ sources }: { sources: MarketingConsoleSourceSummary[] }) {
  if (!sources.length) return null;
  return (
    <ContentSection title={sources.length === 1 ? 'Data source' : 'Data sources'}>
      <div className="grid gap-3">
        {sources.map((source) => (
          <div
            key={source.provider ?? source.label}
            className="border-outline-soft bg-surface flex flex-wrap items-start justify-between gap-3 rounded-sm border px-4 py-3"
          >
            <div>
              <Typography variant="labelLarge">{source.label}</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant mt-1 max-w-2xl">
                {source.detail}
              </Typography>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {source.sourceKind === 'fixture' ? (
                <Badge variant="tonal" color="warning" size="sm">
                  Sample data
                </Badge>
              ) : null}
              {source.sourceKind !== 'fixture' ? (
                <Badge variant="tonal" color={statusColor(source.status)} size="sm">
                  {source.available ? source.freshnessLabel : healthStatusLabel(source.status)}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </ContentSection>
  );
}

export function formatMoney(value: number, currencyCode?: string): string {
  if (!currencyCode) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? 'Not available' : `${value.toFixed(1)}%`;
}
