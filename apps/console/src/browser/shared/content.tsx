import type React from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { PageSection } from '@unisane/ui/page-section';
import { Typography } from '@unisane/ui/typography';
import { humanize, statusColor } from '../lib/format.js';
import type { ConsoleRoute } from '../../routes.js';

export function PageHeader({
  actions,
  route,
  state,
}: {
  actions?: React.ReactNode;
  route: ConsoleRoute;
  state: MarketingConsoleState;
}) {
  return (
    <PageSection rhythm="none" className="medium:min-h-40 flex shrink-0 justify-center py-5">
      <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Typography variant="headlineSmall" component="h1" tabIndex={-1}>
            {route.title}
          </Typography>
          <Typography variant="sectionLead" className="text-on-surface-variant mt-2 max-w-4xl">
            {route.description}
          </Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
            {humanize(state.platformId)} · {humanize(state.environment)}
            {route.timeAnalysis ? ` · ${state.dateWindow.label}` : ''}
          </Typography>
        </div>
        {actions}
      </div>
    </PageSection>
  );
}

export function Summary({ headline, detail }: { headline: string; detail: string }) {
  return (
    <PageSection rhythm="none" className="shrink-0 py-3">
      <Card variant="outlined" padding="md">
        <Typography variant="titleLarge" component="h2">
          {headline}
        </Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-2 max-w-2xl">
          {detail}
        </Typography>
      </Card>
    </PageSection>
  );
}

export function ContentSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <PageSection rhythm="none" className="shrink-0 py-3">
      {title ? (
        <Typography variant="titleLarge" component="h2">
          {title}
        </Typography>
      ) : null}
      {description ? (
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          {description}
        </Typography>
      ) : null}
      <div className={title || description ? 'mt-4' : ''}>{children}</div>
    </PageSection>
  );
}

export function MetricGrid({
  children,
  minItemWidth = 'sm',
}: {
  children: React.ReactNode;
  minItemWidth?: 'sm' | 'md' | 'lg';
}) {
  return <CardGrid minItemWidth={minItemWidth}>{children}</CardGrid>;
}

export function MetricCard({
  label,
  value,
  helper,
  context,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  context?: string;
}) {
  return (
    <Card variant="outlined" padding="sm">
      <Typography variant="labelMedium" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="headlineSmall" component="p" className="mt-2">
        {value}
      </Typography>
      <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
        {helper}
      </Typography>
      {context ? (
        <Typography
          variant="labelSmall"
          className="border-outline-subtle text-on-surface-variant mt-4 border-t pt-3"
        >
          {context}
        </Typography>
      ) : null}
    </Card>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status:
    | MarketingConsoleState['readiness']['status']
    | MarketingConsoleState['connections'][number]['state'];
  label: string;
}) {
  return (
    <Badge variant="tonal" color={statusColor(status)} size="sm">
      {label}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card variant="low" padding="lg">
      <Typography variant="panelTitle">{title}</Typography>
      <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
