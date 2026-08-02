import type { MarketingConsoleOverview } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatDateTime, outcomeStatusLabel, statusColor } from '../lib/format.js';
import { ConsoleCardGrid, ContentSection } from '../shared/content.js';

export function OverviewFunnel({
  funnel,
}: {
  funnel: NonNullable<MarketingConsoleOverview['funnel']>;
}) {
  const maximum = Math.max(...funnel.stages.map((stage) => stage.value), 1);
  return (
    <ContentSection title={funnel.title} description={funnel.summary}>
      <Card variant="outlined" padding="md">
        <ol className="grid gap-4" aria-label={funnel.title}>
          {funnel.stages.map((stage) => {
            const width = Math.max(3, Math.round((stage.value / maximum) * 100));
            return (
              <li key={stage.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <Typography variant="labelLarge">{stage.label}</Typography>
                  <Typography variant="labelMedium">{stage.valueLabel}</Typography>
                </div>
                <div
                  className="bg-surface-container-highest mt-2 h-2 overflow-hidden rounded-sm"
                  aria-hidden="true"
                >
                  <div className="bg-primary h-full rounded-sm" style={{ width: `${width}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <Typography variant="labelSmall" className="text-on-surface-variant mt-4">
          {funnel.sourceLabel}
        </Typography>
      </Card>
    </ContentSection>
  );
}

export function RecentOutcomes({
  outcomes,
}: {
  outcomes: MarketingConsoleOverview['recentOutcomes'];
}) {
  if (!outcomes.length) return null;
  return (
    <ContentSection
      title="Recent outcomes"
      description="The latest recorded provider updates and managed changes."
    >
      <ConsoleCardGrid minItemWidth="md">
        {outcomes.map((outcome) => (
          <Card key={outcome.id} variant="outlined" padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Typography variant="cardTitle">{outcome.title}</Typography>
              <Badge variant="tonal" color={statusColor(outcome.status)} size="sm">
                {outcomeStatusLabel(outcome.status)}
              </Badge>
            </div>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
              {outcome.summary}
            </Typography>
            {outcome.timestamp ? (
              <time dateTime={outcome.timestamp}>
                <Typography
                  component="span"
                  variant="labelSmall"
                  className="text-on-surface-variant mt-3 block"
                >
                  {formatDateTime(outcome.timestamp)}
                </Typography>
              </time>
            ) : null}
          </Card>
        ))}
      </ConsoleCardGrid>
    </ContentSection>
  );
}
