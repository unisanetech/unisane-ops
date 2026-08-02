import { createContext, useContext, type ReactNode } from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { Icon } from '@unisane/ui/icon';
import { PageSection } from '@unisane/ui/page-section';
import { Typography } from '@unisane/ui/typography';
import { humanize, statusColor } from '../lib/format.js';
import type { ConsoleRoute } from '../../routes.js';

export type PageDensity = 'reading' | 'standard' | 'data-dense';

const PageDensityContext = createContext<PageDensity>('standard');

export function PageContent({
  density = 'standard',
  children,
}: {
  density?: PageDensity;
  children: ReactNode;
}) {
  return (
    <PageDensityContext.Provider value={density}>
      <div data-page-density={density} className="min-w-0 pb-8">
        {children}
      </div>
    </PageDensityContext.Provider>
  );
}

export function PageHeader({
  actions,
  route,
  state,
}: {
  actions?: ReactNode;
  route: ConsoleRoute;
  state: MarketingConsoleState;
}) {
  return (
    <PageSection rhythm="none" className="medium:py-5 flex shrink-0 justify-center py-4">
      <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Typography
            variant="headlineMedium"
            component="h1"
            className="font-semibold tracking-tight"
            tabIndex={-1}
          >
            {route.title}
          </Typography>
          <Typography variant="bodyLarge" className="text-on-surface-variant mt-1.5 max-w-4xl">
            {route.description}
          </Typography>
          <Typography
            variant="labelMedium"
            className="text-on-surface-variant mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="whitespace-nowrap">
              {humanize(state.platformId)} · {humanize(state.environment)}
            </span>
            {route.timeAnalysis ? (
              <span className="whitespace-nowrap">{state.dateWindow.label}</span>
            ) : null}
          </Typography>
        </div>
        {actions}
      </div>
    </PageSection>
  );
}

export function Summary({
  headline,
  detail,
  context,
}: {
  headline: string;
  detail: string;
  context?: string;
}) {
  const density = useContext(PageDensityContext);
  return (
    <PageSection
      rhythm="none"
      className={density === 'data-dense' ? 'shrink-0 py-2' : 'shrink-0 py-3'}
    >
      <Card variant="low" padding="md" className="border-outline-weak border">
        <Typography variant="titleMedium" component="h2" className="font-semibold">
          {headline}
        </Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1.5 max-w-3xl">
          {detail}
        </Typography>
        {context ? (
          <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
            {context}
          </Typography>
        ) : null}
      </Card>
    </PageSection>
  );
}

export function ContentSection({
  title,
  description,
  width = 'full',
  children,
}: {
  title?: string;
  description?: string;
  width?: 'reading' | 'wide' | 'full';
  children: React.ReactNode;
}) {
  const density = useContext(PageDensityContext);
  const effectiveWidth = width === 'full' && density === 'reading' ? 'reading' : width;
  const widthClass =
    effectiveWidth === 'reading'
      ? 'max-w-4xl'
      : effectiveWidth === 'wide'
        ? 'max-w-6xl'
        : 'max-w-none';
  return (
    <PageSection
      rhythm="none"
      className={density === 'data-dense' ? 'shrink-0 py-3' : 'shrink-0 py-4'}
    >
      <div className={widthClass}>
        {title ? (
          <Typography variant="titleLarge" component="h2" className="font-semibold tracking-tight">
            {title}
          </Typography>
        ) : null}
        {description ? (
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
            {description}
          </Typography>
        ) : null}
        <div className={title || description ? 'mt-4' : ''}>{children}</div>
      </div>
    </PageSection>
  );
}

export function MetricGrid({
  children,
  minItemWidth = 'sm',
  layout = 'auto',
}: {
  children: ReactNode;
  minItemWidth?: 'sm' | 'md' | 'lg';
  layout?: 'auto' | 'four-up';
}) {
  if (layout === 'four-up') {
    return (
      <div className="ops-metric-grid-four-up">
        <div className="ops-metric-grid-four-up__items">{children}</div>
      </div>
    );
  }
  return <ConsoleCardGrid minItemWidth={minItemWidth}>{children}</ConsoleCardGrid>;
}

export function ConsoleCardGrid({
  children,
  minItemWidth = 'md',
}: {
  children: ReactNode;
  minItemWidth?: 'sm' | 'md' | 'lg';
}) {
  return (
    <CardGrid minItemWidth={minItemWidth} className="gap-4">
      {children}
    </CardGrid>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  context,
  comparison,
}: {
  label: string;
  value: ReactNode;
  helper: string;
  context?: string;
  comparison?: string;
}) {
  return (
    <Card variant="outlined" padding="md" className="min-h-40">
      <Typography variant="labelLarge" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography
        variant="headlineMedium"
        component="p"
        className="mt-2 font-semibold tracking-tight tabular-nums"
      >
        {value}
      </Typography>
      {comparison ? (
        <Typography variant="labelMedium" className="text-primary mt-1">
          {comparison}
        </Typography>
      ) : null}
      <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
        {helper}
      </Typography>
      {context ? (
        <Typography variant="labelSmall" className="text-on-surface-variant mt-auto pt-4">
          {context}
        </Typography>
      ) : null}
    </Card>
  );
}

type InsightTone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';

export function InsightCard({
  badge,
  tone = 'primary',
  title,
  description,
  evidence,
  metadata,
  actionLabel,
  onAction,
  density = 'comfortable',
}: {
  badge?: string;
  tone?: InsightTone;
  title: string;
  description: string;
  evidence?: string;
  metadata?: string;
  actionLabel?: string;
  onAction?: () => void;
  density?: 'compact' | 'comfortable';
}) {
  return (
    <Card
      variant="outlined"
      padding="md"
      className={density === 'comfortable' ? 'min-h-48' : undefined}
    >
      {badge ? (
        <div>
          <Badge variant="tonal" color={tone} size="sm">
            {badge}
          </Badge>
        </div>
      ) : null}
      <Typography variant="cardTitle" className={badge ? 'mt-4 font-semibold' : 'font-semibold'}>
        {title}
      </Typography>
      <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
        {description}
      </Typography>
      {evidence ? (
        <Typography variant="labelMedium" className="mt-3 font-medium">
          {evidence}
        </Typography>
      ) : null}
      {metadata ? (
        <Typography variant="labelSmall" className="text-on-surface-variant mt-2">
          {metadata}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
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
      ) : null}
    </Card>
  );
}

export function EvidenceRow({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status?: ReactNode;
}) {
  return (
    <Card variant="outlined" padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Typography variant="labelLarge" className="font-semibold">
            {title}
          </Typography>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-1 max-w-3xl">
            {detail}
          </Typography>
        </div>
        {status ? <div className="flex shrink-0 flex-wrap items-center gap-2">{status}</div> : null}
      </div>
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

type DataStateKind = 'empty' | 'error' | 'loading' | 'stale' | 'unavailable';

const dataStateIcon: Record<DataStateKind, string> = {
  empty: 'inbox',
  error: 'error',
  loading: 'progress_activity',
  stale: 'schedule',
  unavailable: 'cloud_off',
};

const dataStateColor: Record<DataStateKind, string> = {
  empty: 'text-on-surface-variant',
  error: 'text-error',
  loading: 'text-primary',
  stale: 'text-warning',
  unavailable: 'text-on-surface-variant',
};

export function DataState({
  kind = 'empty',
  title,
  description,
  actionLabel,
  onAction,
}: {
  kind?: DataStateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card
      variant="low"
      padding="md"
      className="border-outline-weak border"
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'loading' ? 'polite' : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 pt-0.5 ${dataStateColor[kind]}`} aria-hidden="true">
          <Icon symbol={dataStateIcon[kind]} />
        </div>
        <div className="min-w-0 flex-1">
          <Typography variant="titleMedium" className="font-semibold">
            {title}
          </Typography>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-1.5 max-w-3xl">
            {description}
          </Typography>
          {actionLabel && onAction ? (
            <div className="mt-4">
              <Button
                variant="text"
                size="sm"
                trailingIcon={<Icon symbol="arrow_forward" />}
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

type ConsoleAction = {
  label: string;
  onAction: () => void;
};

export function ActionGroup({
  primary,
  secondary = [],
}: {
  primary: ConsoleAction;
  secondary?: readonly ConsoleAction[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button size="sm" onClick={primary.onAction}>
        {primary.label}
      </Button>
      {secondary.map((action) => (
        <Button variant="tonal" size="sm" onClick={action.onAction} key={action.label}>
          {action.label}
        </Button>
      ))}
    </div>
  );
}
