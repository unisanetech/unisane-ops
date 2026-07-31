import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../contracts.js';
import { statusColor } from '../lib/format.js';
import { ContentSection, MetricCard, MetricGrid, EmptyState, Summary } from '../shared/content.js';
import { OverviewFunnel, RecentOutcomes } from './overview-insights.js';

export function OverviewScreen({ state, navigate }: ConsoleScreenProps) {
  const metrics = state.overview.metricIds
    .map((id) => state.metrics.find((metric) => metric.id === id))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  return (
    <>
      <Summary headline={state.overview.headline} detail={state.overview.detail} />
      <ContentSection title="Growth snapshot" description={metrics[0]?.comparisonLabel}>
        {metrics.length ? (
          <MetricGrid minItemWidth="lg">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                label={metric.label}
                value={metric.value}
                helper={metric.definition}
                context={`${metric.sourceLabel} · ${metric.freshnessLabel}`}
              />
            ))}
          </MetricGrid>
        ) : (
          <EmptyState
            title="No usable growth metrics are available yet."
            description="The console waits for real provider evidence instead of presenting unavailable values as zero."
            actionLabel="Review connections"
            onAction={() => navigate('/connections')}
          />
        )}
      </ContentSection>
      <ContentSection
        title="What needs attention"
        description="Prioritized from the evidence available now."
      >
        {state.priorities.length ? (
          <CardGrid minItemWidth="md">
            {state.priorities.slice(0, 3).map((item) => (
              <Card variant="low" padding="md" key={item.id}>
                <Badge variant="tonal" color="primary" size="sm">
                  {item.priorityLabel}
                </Badge>
                <Typography variant="cardTitle" className="mt-3">
                  {item.title}
                </Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                  {item.reason}
                </Typography>
                <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
                  {item.confidenceLabel} · {item.effortLabel}
                </Typography>
                <Button
                  className="mt-5"
                  variant="tonal"
                  size="sm"
                  onClick={() => navigate(item.action.path)}
                >
                  {item.action.label}
                </Button>
              </Card>
            ))}
          </CardGrid>
        ) : (
          <EmptyState
            title="No immediate action needs attention."
            description="Review the capability summaries below or refresh a source when you need newer evidence."
          />
        )}
      </ContentSection>
      {state.overview.funnel ? <OverviewFunnel funnel={state.overview.funnel} /> : null}
      <RecentOutcomes outcomes={state.overview.recentOutcomes} />
      <ContentSection
        title="Growth areas"
        description="Open a channel to review its evidence and next actions."
      >
        <CardGrid minItemWidth="md">
          {state.overview.capabilitySummaries.map((capability) => (
            <Card variant="outlined" padding="md" key={capability.id}>
              <div className="flex items-start justify-between gap-3">
                <Typography variant="cardTitle">{capability.label}</Typography>
                <Badge variant="tonal" color={statusColor(capability.status)} size="sm">
                  {capability.statusLabel}
                </Badge>
              </div>
              <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
                {capability.summary}
              </Typography>
              <Button
                className="mt-5"
                variant="tonal"
                size="sm"
                onClick={() => navigate(capability.path)}
              >
                Open {capability.label}
              </Button>
            </Card>
          ))}
        </CardGrid>
      </ContentSection>
    </>
  );
}
