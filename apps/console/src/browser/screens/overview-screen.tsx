import type { ConsoleScreenProps } from '../contracts.js';
import {
  ConsoleCardGrid,
  ContentSection,
  MetricCard,
  MetricGrid,
  DataState,
  InsightCard,
  Summary,
} from '../shared/content.js';
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
          <MetricGrid layout="four-up">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                label={metric.label}
                value={metric.value}
                helper={metric.definition}
                context={`${metric.sourceLabel} · ${metric.freshnessLabel}`}
                comparison={
                  metric.comparisonLabel.includes('not available')
                    ? undefined
                    : metric.comparisonLabel
                }
              />
            ))}
          </MetricGrid>
        ) : (
          <DataState
            kind="unavailable"
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
          <ConsoleCardGrid minItemWidth="md">
            {state.priorities.slice(0, 3).map((item) => (
              <InsightCard
                key={item.id}
                badge={item.priorityLabel}
                title={item.title}
                description={item.expectedOutcome}
                evidence={item.reason}
                metadata={`${item.confidenceLabel} · ${item.effortLabel} · ${item.freshnessLabel}`}
                actionLabel={item.action.label}
                onAction={() => navigate(item.action.path)}
              />
            ))}
          </ConsoleCardGrid>
        ) : (
          <DataState
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
        <ConsoleCardGrid minItemWidth="md">
          {state.overview.capabilitySummaries.map((capability) => (
            <InsightCard
              key={capability.id}
              badge={capability.statusLabel}
              tone={capability.status === 'ready' ? 'success' : 'warning'}
              title={capability.label}
              description={capability.summary}
              actionLabel={`Open ${capability.label}`}
              onAction={() => navigate(capability.path)}
            />
          ))}
        </ConsoleCardGrid>
      </ContentSection>
    </>
  );
}
