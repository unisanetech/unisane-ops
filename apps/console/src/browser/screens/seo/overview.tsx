import { Button } from '@unisane/ui/button';
import type { ConsoleScreenProps } from '../../contracts.js';
import {
  ConsoleCardGrid,
  ContentSection,
  InsightCard,
  MetricCard,
  MetricGrid,
  Summary,
} from '../../shared/content.js';

export function SeoOverviewScreen({ state, navigate }: ConsoleScreenProps) {
  return (
    <>
      <Summary
        headline={state.seo.overview.headline}
        detail={state.seo.overview.detail}
        context={`${state.seo.sourceLabel} · ${state.seo.freshnessLabel}`}
      />
      <ContentSection>
        <MetricGrid>
          {state.seo.overview.metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              helper={metric.definition}
              context={`${metric.sourceLabel} · ${metric.freshnessLabel}`}
              comparison={state.seo.comparisonAvailable ? metric.comparisonLabel : undefined}
            />
          ))}
        </MetricGrid>
      </ContentSection>
      <ContentSection
        title="Best opportunities"
        description="Evidence-backed improvements to review first."
      >
        <ConsoleCardGrid minItemWidth="md">
          {state.seo.overview.opportunities.slice(0, 3).map((item) => (
            <InsightCard
              key={item.id}
              badge={item.kind.replace('-', ' ')}
              tone={
                item.kind === 'problem' ? 'warning' : item.kind === 'quick-win' ? 'success' : 'info'
              }
              title={item.title}
              description={item.expectedOutcome}
              evidence={item.reason}
              metadata={`${item.evidence} · ${item.freshnessLabel}`}
            />
          ))}
        </ConsoleCardGrid>
        <Button className="mt-4" variant="outlined" onClick={() => navigate('/seo/opportunities')}>
          Review all opportunities
        </Button>
      </ContentSection>
    </>
  );
}
