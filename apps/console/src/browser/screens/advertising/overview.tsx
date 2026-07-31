import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { healthStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { ChannelMetrics, SourceSummaries } from '../channels/shared.js';
import { advertisingConnectionPath, advertisingView } from './view.js';

export function AdvertisingOverview({ state, route, navigate }: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  return (
    <>
      <Summary headline={advertising.headline} detail={advertising.detail} />
      <ChannelMetrics
        metrics={advertising.metrics}
        ids={['spend', 'paid-clicks', 'paid-conversions', 'roas']}
      />
      <ContentSection
        title="What needs attention"
        description="Audit areas are kept separate so a passing setup check cannot hide a performance risk."
      >
        {state.advertising.auditSections.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {state.advertising.auditSections.map((section) => (
              <Card key={section.id} variant="outlined" padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <Typography variant="labelLarge">{section.label}</Typography>
                  <Badge variant="tonal" color={statusColor(section.status)} size="sm">
                    {healthStatusLabel(section.status)}
                  </Badge>
                </div>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                  {section.summary}
                </Typography>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No advertising audit is available."
            description="Refresh the advertising evidence before using recommendations to guide spend."
            actionLabel="Review connection"
            onAction={() => navigate(advertisingConnectionPath(route.advertisingPlatform))}
          />
        )}
      </ContentSection>
      <SourceSummaries sources={advertising.sources} />
    </>
  );
}
