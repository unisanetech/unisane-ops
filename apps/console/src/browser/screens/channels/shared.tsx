import type {
  MarketingConsoleMetric,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { healthStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, EvidenceRow, MetricCard, MetricGrid } from '../../shared/content.js';

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
  const comparisonUnavailable = selected.some((metric) =>
    /not available|without a previous-period baseline/i.test(metric.comparisonLabel),
  );
  return (
    <ContentSection
      description={
        comparisonUnavailable
          ? 'Showing the selected period. Add a previous period to see what changed.'
          : undefined
      }
    >
      <MetricGrid layout="four-up">
        {selected.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            helper={metric.definition}
            context={`${metric.sourceLabel} · ${metric.freshnessLabel}`}
            comparison={
              /not available|without a previous-period baseline/i.test(metric.comparisonLabel)
                ? undefined
                : metric.comparisonLabel
            }
          />
        ))}
      </MetricGrid>
    </ContentSection>
  );
}

export function SourceSummary({ source }: { source: MarketingConsoleSourceSummary }) {
  return (
    <ContentSection title="Data source">
      <EvidenceRow
        title={source.label}
        detail={source.detail}
        status={
          <>
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
          </>
        }
      />
    </ContentSection>
  );
}

export function SourceSummaries({ sources }: { sources: MarketingConsoleSourceSummary[] }) {
  if (!sources.length) return null;
  return (
    <ContentSection title={sources.length === 1 ? 'Data source' : 'Data sources'}>
      <div className="grid gap-3">
        {sources.map((source) => (
          <EvidenceRow
            key={source.provider ?? source.label}
            title={source.label}
            detail={source.detail}
            status={
              <>
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
              </>
            }
          />
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
