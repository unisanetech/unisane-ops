import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { ContentSection, MetricCard, MetricGrid, Summary } from '../../shared/content.js';

export function SeoOverviewScreen({ state, navigate, openOverlay }: ConsoleScreenProps) {
  return (
    <>
      <Summary headline={state.seo.overview.headline} detail={state.seo.overview.detail} />
      <ContentSection>
        <MetricGrid>
          {state.seo.overview.metrics.map((metric) => (
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
      <ContentSection
        title="Best opportunities"
        description="Evidence-backed improvements to review first."
      >
        <CardGrid minItemWidth="md">
          {state.seo.overview.opportunities.slice(0, 3).map((item) => (
            <Card variant="low" padding="md" key={item.id}>
              <Badge
                variant="tonal"
                color={item.kind === 'problem' ? 'error' : 'primary'}
                size="sm"
              >
                {item.kind.replace('-', ' ')}
              </Badge>
              <Typography variant="cardTitle" className="mt-3">
                {item.title}
              </Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                {item.reason}
              </Typography>
              <Button
                className="mt-5"
                variant="tonal"
                size="sm"
                onClick={() =>
                  openOverlay({ kind: 'seo', detail: { kind: 'opportunity', id: item.id } })
                }
              >
                Open details
              </Button>
            </Card>
          ))}
        </CardGrid>
        <Button className="mt-4" variant="outlined" onClick={() => navigate('/seo/opportunities')}>
          Review all opportunities
        </Button>
      </ContentSection>
    </>
  );
}
