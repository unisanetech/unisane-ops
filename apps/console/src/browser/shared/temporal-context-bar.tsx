import type { MarketingConsoleState, MarketingConsoleTemporalQuery } from '@unisane/growth/console';
import { Progress } from '@unisane/ui/progress';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleRoute } from '../../routes.js';
import { DateRangeControl } from './date-range-control.js';

type TemporalContextBarProps = {
  route: ConsoleRoute;
  state: MarketingConsoleState;
  query: MarketingConsoleTemporalQuery;
  loading: boolean;
  error?: string;
  onQueryChange: (query: MarketingConsoleTemporalQuery) => void;
};

type TemporalPresentation = {
  label: string;
  value?: string;
  description: string;
  editable: boolean;
};

function dateFromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day);
}

function humanDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateFromIso(value));
}

function recordedDate(state: MarketingConsoleState): string {
  return state.dateWindow.endDate ?? state.history.latestEndDate ?? state.generatedAt.slice(0, 10);
}

function temporalPresentation(
  route: ConsoleRoute,
  state: MarketingConsoleState,
): TemporalPresentation | undefined {
  if (route.temporalMode === 'performance-range') {
    return {
      label: 'Reporting period',
      description: 'Performance shown for the selected dates.',
      editable: true,
    };
  }
  if (route.temporalMode === 'event-range') {
    return {
      label: 'Occurred during',
      description: 'Changes and events recorded during the selected dates.',
      editable: true,
    };
  }
  if (route.temporalMode === 'evidence-context') {
    return {
      label: 'Evidence through',
      value: humanDate(recordedDate(state)),
      description: 'Recommendations use evidence recorded up to this date.',
      editable: false,
    };
  }
  if (route.temporalMode === 'snapshot') {
    return {
      label: 'Snapshot as of',
      value: humanDate(recordedDate(state)),
      description: 'This page uses the latest recorded point-in-time evidence.',
      editable: false,
    };
  }
  if (route.id === 'analytics.tracking-health') {
    return {
      label: 'Last checked',
      value: humanDate(state.generatedAt.slice(0, 10)),
      description: 'Current measurement configuration and recorded diagnostics.',
      editable: false,
    };
  }
  return undefined;
}

export function TemporalContextBar({
  route,
  state,
  query,
  loading,
  error,
  onQueryChange,
}: TemporalContextBarProps) {
  const temporal = temporalPresentation(route, state);
  if (!temporal) return null;
  const message = loading
    ? 'Loading selected period…'
    : error
      ? error
      : temporal.editable
        ? undefined
        : temporal.description;

  return (
    <div
      className="px-layout-page-x mx-auto w-full max-w-7xl shrink-0"
      aria-busy={loading || undefined}
    >
      <div className="medium:min-h-14 medium:flex-row medium:items-center flex min-w-0 flex-col gap-2 py-3">
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <Typography variant="labelMedium" className="text-on-surface-variant shrink-0">
            {temporal.label}
          </Typography>
          {temporal.editable ? (
            <DateRangeControl
              query={query}
              contextLabel={temporal.label}
              onChange={onQueryChange}
            />
          ) : (
            <Typography variant="bodyMedium" className="font-medium">
              {temporal.value}
            </Typography>
          )}
        </div>
        {message ? (
          <div
            className="text-on-surface-variant medium:border-outline-weak medium:border-l medium:pl-4 flex min-w-0 items-center gap-2"
            aria-live="polite"
          >
            {loading ? (
              <Progress variant="circular" indeterminate className="h-4 w-4 shrink-0" />
            ) : null}
            <Typography variant="bodySmall">{message}</Typography>
          </div>
        ) : null}
      </div>
    </div>
  );
}
