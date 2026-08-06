import type { MarketingConsoleSourceSummary } from '@unisane/growth/console';
import type { ReactNode } from 'react';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Progress } from '@unisane/ui/progress';
import { Typography } from '@unisane/ui/typography';
import { formatNumber } from '../../lib/format.js';

export function AdvertisingDetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined" padding="sm" className="min-w-0">
      <Typography variant="labelSmall" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="titleMedium" className="mt-1 font-semibold break-words tabular-nums">
        {value}
      </Typography>
    </Card>
  );
}

export function AdvertisingDetailFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-on-surface-variant text-label-small">{label}</dt>
      <dd className="text-body-medium mt-1 break-words">{value}</dd>
    </div>
  );
}

export function AdvertisingDetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="ops-advertising-detail-pane__section px-5 py-5">
      <Typography variant="titleMedium" component="h3" className="font-semibold">
        {title}
      </Typography>
      {description ? (
        <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
          {description}
        </Typography>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FunnelStep({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Typography variant="labelMedium" className="font-medium">
          {label}
        </Typography>
        <Typography variant="labelSmall" className="text-on-surface-variant tabular-nums">
          {value.toFixed(1)}%
        </Typography>
      </div>
      <Progress value={value} className="mt-2 h-1.5" />
      <Typography variant="labelSmall" className="text-on-surface-variant mt-1.5">
        {detail}
      </Typography>
    </div>
  );
}

export function AdvertisingPerformanceFunnel({
  impressions,
  clicks,
  conversions,
}: {
  impressions: number;
  clicks: number;
  conversions: number;
}) {
  const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  return (
    <div className="grid gap-4">
      <FunnelStep
        label="Impressions to clicks"
        value={clickRate}
        detail={`${formatNumber(clicks)} of ${formatNumber(impressions)} impressions produced a click.`}
      />
      <FunnelStep
        label="Clicks to reported conversions"
        value={conversionRate}
        detail={`${formatNumber(conversions)} of ${formatNumber(clicks)} clicks were attributed as conversions.`}
      />
    </div>
  );
}

export function AdvertisingSourceEvidence({
  source,
  fallbackLabel,
  fallbackDetail,
}: {
  source?: MarketingConsoleSourceSummary;
  fallbackLabel: string;
  fallbackDetail: string;
}) {
  return (
    <>
      <Card variant="low" padding="sm" className="border-outline-weak border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Typography variant="labelMedium" className="font-semibold">
              {source?.label ?? fallbackLabel}
            </Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
              {source?.detail ?? fallbackDetail}
            </Typography>
          </div>
          {source ? (
            <Badge
              variant="tonal"
              color={source.sourceKind === 'fixture' ? 'warning' : 'secondary'}
              size="sm"
            >
              {source.sourceKind === 'fixture' ? 'Sample data' : source.freshnessLabel}
            </Badge>
          ) : null}
        </div>
      </Card>
      <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
        Previous-period evidence is not recorded for this item, so no change indicator is shown.
      </Typography>
      <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
        This panel is read-only. Changes still require an explicit reviewed action.
      </Typography>
    </>
  );
}
