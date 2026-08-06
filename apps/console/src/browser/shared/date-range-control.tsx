import { useMemo } from 'react';
import type { MarketingConsoleTemporalQuery } from '@unisane/growth/console';
import { DateRangePicker, type DateRangeValue } from '@unisane/ui/date-range-picker';
import { SegmentedButton } from '@unisane/ui/segmented-button';
import { queryForPreset } from '../routing/use-console-temporal-query.js';

type ReportingPreset = 'last-7-days' | 'last-28-days' | 'last-3-months';

const presetOptions = [
  { value: 'last-7-days', label: '7 days' },
  { value: 'last-28-days', label: '28 days' },
  { value: 'last-3-months', label: '3 months' },
] as const;

function dateFromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day);
}

function isoFromDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function humanDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    dateFromIso(value),
  );
}

function today(): Date {
  const value = new Date();
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function threeMonthQuery(endDate: string): MarketingConsoleTemporalQuery {
  const end = dateFromIso(endDate);
  const start = new Date(end.getFullYear(), end.getMonth() - 3, end.getDate() + 1);
  return { startDate: isoFromDate(start), endDate };
}

function queryForReportingPreset(
  preset: ReportingPreset,
  endDate: string,
): MarketingConsoleTemporalQuery {
  return preset === 'last-3-months' ? threeMonthQuery(endDate) : queryForPreset(preset, endDate);
}

function sameQuery(left: MarketingConsoleTemporalQuery, right: MarketingConsoleTemporalQuery) {
  return left.startDate === right.startDate && left.endDate === right.endDate;
}

function activePreset(query: MarketingConsoleTemporalQuery): ReportingPreset | 'custom' {
  for (const option of presetOptions) {
    if (sameQuery(query, queryForReportingPreset(option.value, query.endDate))) return option.value;
  }
  return 'custom';
}

export function DateRangeControl({
  query,
  contextLabel = 'Reporting period',
  onChange,
}: {
  query: MarketingConsoleTemporalQuery;
  contextLabel?: string;
  onChange: (query: MarketingConsoleTemporalQuery) => void;
}) {
  const selectedPreset = activePreset(query);
  const label = useMemo(
    () => `${humanDate(query.startDate)} – ${humanDate(query.endDate)}`,
    [query.endDate, query.startDate],
  );
  const value = useMemo<DateRangeValue>(
    () => ({ start: dateFromIso(query.startDate), end: dateFromIso(query.endDate) }),
    [query.endDate, query.startDate],
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <SegmentedButton
        aria-label={`${contextLabel} presets`}
        size="sm"
        value={selectedPreset === 'custom' ? null : selectedPreset}
        options={presetOptions}
        onValueChange={(preset) => onChange(queryForReportingPreset(preset, query.endDate))}
      />
      <DateRangePicker
        value={value}
        onValueChange={(range) => {
          if (!range.end) return;
          onChange({ startDate: isoFromDate(range.start), endDate: isoFromDate(range.end) });
        }}
        max={today()}
        label={contextLabel}
        triggerLabel={selectedPreset === 'custom' ? label : 'Custom'}
        triggerVariant={selectedPreset === 'custom' ? 'tonal' : 'outlined'}
        size="sm"
      />
    </div>
  );
}
