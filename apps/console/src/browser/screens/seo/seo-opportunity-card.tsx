import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Icon } from '@unisane/ui/icon';
import { Typography } from '@unisane/ui/typography';
import { formatCompactNumber, humanize } from '../../lib/format.js';

type SeoOpportunity = MarketingConsoleState['seo']['opportunityReview']['opportunities'][number];

function confidenceColor(confidence: SeoOpportunity['confidence']): 'success' | 'warning' | 'info' {
  if (confidence === 'high') return 'success';
  if (confidence === 'low') return 'warning';
  return 'info';
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <Typography variant="labelSmall" component="dt" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="bodyMedium" component="dd" className="mt-0.5 font-medium">
        {value}
      </Typography>
    </div>
  );
}

export function SeoOpportunityCard({
  opportunity,
  selected,
  actionLabel,
  onAction,
}: {
  opportunity: SeoOpportunity;
  selected: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  const demand = opportunity.signals.estimatedMonthlySearches;
  const competition = opportunity.signals.competitionIndex;
  const evidenceNote =
    opportunity.limitations[0] ?? `${opportunity.provenance.length} recorded sources`;

  return (
    <Card
      variant="outlined"
      padding="md"
      className={selected ? 'border-primary bg-surface-container-low shadow-1' : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="tonal" color="info" size="sm">
          Priority {opportunity.rank}
        </Badge>
        <Badge variant="tonal" color={confidenceColor(opportunity.confidence)} size="sm">
          {humanize(opportunity.confidence)} confidence
        </Badge>
      </div>
      <Typography variant="cardTitle" component="h3" className="mt-4 font-semibold">
        {opportunity.title}
      </Typography>
      <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
        {opportunity.rationale}
      </Typography>
      <dl className="border-outline-weak mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
        <Metric label="Opportunity score" value={`${opportunity.score}/100`} />
        <Metric label="Market" value={opportunity.market ?? 'Not recorded'} />
        <Metric
          label="Monthly demand"
          value={demand === undefined ? 'Not recorded' : formatCompactNumber(demand)}
        />
        <Metric
          label="Competition"
          value={competition === undefined ? 'Not recorded' : `${competition}/100`}
        />
      </dl>
      <div className="mt-4 flex items-start gap-2">
        <Icon symbol="schedule" size="sm" className="text-on-surface-variant mt-0.5 shrink-0" />
        <div className="min-w-0">
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Evidence note
          </Typography>
          <Typography variant="bodySmall" className="mt-0.5">
            {evidenceNote}
          </Typography>
        </div>
      </div>
      <div className="mt-auto pt-5">
        <Button
          variant="text"
          size="sm"
          trailingIcon={<Icon symbol="arrow_forward" />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
