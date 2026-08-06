import path from 'node:path';
import { ensureMarketingHistoryCatalog } from './catalog.js';
import type {
  MarketingHistoryCatalog,
  MarketingHistoryCoverage,
  MarketingHistoryObservation,
  MarketingHistoryPeriodComparison,
  MarketingHistoryPoint,
  MarketingHistoryQuery,
  MarketingHistoryQueryResult,
} from './contracts.js';
import { selectNonOverlappingHistoryObservations } from './report-window.js';

const DAY_MS = 86_400_000;

function isoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateText(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function dayCount(startDate: string, endDate: string): number {
  return Math.floor((isoDate(endDate).getTime() - isoDate(startDate).getTime()) / DAY_MS) + 1;
}

function activeObservations(catalog: MarketingHistoryCatalog): MarketingHistoryObservation[] {
  const superseded = new Set(
    catalog.observations
      .map((observation) => observation.supersedesObservationId)
      .filter((id): id is string => id !== undefined),
  );
  return catalog.observations.filter((observation) => !superseded.has(observation.id));
}

function matchingObservations(
  catalog: MarketingHistoryCatalog,
  query: MarketingHistoryQuery,
): MarketingHistoryObservation[] {
  return activeObservations(catalog)
    .filter(
      (observation) =>
        observation.provider === query.provider &&
        observation.reportType === query.reportType &&
        (!query.accountId || observation.accountId === query.accountId) &&
        (!query.startDate || observation.window.endDate >= query.startDate) &&
        (!query.endDate || observation.window.startDate <= query.endDate) &&
        observation.metrics[query.metric] !== undefined,
    )
    .sort(
      (left, right) =>
        left.window.startDate.localeCompare(right.window.startDate) ||
        left.window.endDate.localeCompare(right.window.endDate) ||
        left.pulledAt.localeCompare(right.pulledAt),
    );
}

function pointFromObservation(
  observation: MarketingHistoryObservation,
  query: MarketingHistoryQuery,
): MarketingHistoryPoint {
  const currencyCode =
    query.metric === 'cost' && observation.currencyCodes.length === 1
      ? observation.currencyCodes[0]
      : undefined;
  return {
    observationId: observation.id,
    label:
      observation.window.startDate === observation.window.endDate
        ? observation.window.startDate
        : `${observation.window.startDate} to ${observation.window.endDate}`,
    startDate: observation.window.startDate,
    endDate: observation.window.endDate,
    pulledAt: observation.pulledAt,
    value: observation.metrics[query.metric] ?? 0,
    ...(currencyCode ? { currencyCode } : {}),
    partial: observation.partial,
    source: observation.source,
  };
}

function coverageFor(
  observations: MarketingHistoryObservation[],
  query: MarketingHistoryQuery,
): MarketingHistoryCoverage {
  if (observations.length === 0) {
    return {
      status: 'none',
      ...(query.startDate ? { requestedStartDate: query.startDate } : {}),
      ...(query.endDate ? { requestedEndDate: query.endDate } : {}),
      expectedDayCount:
        query.startDate && query.endDate ? dayCount(query.startDate, query.endDate) : 0,
      coveredDayCount: 0,
      gapRanges:
        query.startDate && query.endDate
          ? [{ startDate: query.startDate, endDate: query.endDate }]
          : [],
      overlappingWindowCount: 0,
      partialObservationCount: 0,
    };
  }
  const earliestStartDate = query.startDate ?? observations[0]!.window.startDate;
  const latestEndDate = query.endDate ?? observations.at(-1)!.window.endDate;
  const covered = new Set<string>();
  let overlappingWindowCount = 0;
  let previousEnd: string | undefined;
  for (const observation of observations) {
    if (previousEnd && observation.window.startDate <= previousEnd) overlappingWindowCount += 1;
    if (!previousEnd || observation.window.endDate > previousEnd)
      previousEnd = observation.window.endDate;
    let cursor = isoDate(observation.window.startDate);
    const end = isoDate(observation.window.endDate);
    while (cursor <= end) {
      const date = dateText(cursor);
      if (date >= earliestStartDate && date <= latestEndDate) covered.add(date);
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
  }
  const gapRanges: Array<{ startDate: string; endDate: string }> = [];
  let cursor = isoDate(earliestStartDate);
  const end = isoDate(latestEndDate);
  let gapStart: string | undefined;
  while (cursor <= end) {
    const date = dateText(cursor);
    if (!covered.has(date) && !gapStart) gapStart = date;
    if (covered.has(date) && gapStart) {
      gapRanges.push({
        startDate: gapStart,
        endDate: dateText(new Date(cursor.getTime() - DAY_MS)),
      });
      gapStart = undefined;
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  if (gapStart) gapRanges.push({ startDate: gapStart, endDate: latestEndDate });
  const partialObservationCount = observations.filter((observation) => observation.partial).length;
  return {
    status: partialObservationCount > 0 ? 'partial' : gapRanges.length > 0 ? 'gapped' : 'complete',
    ...(query.startDate ? { requestedStartDate: query.startDate } : {}),
    ...(query.endDate ? { requestedEndDate: query.endDate } : {}),
    earliestStartDate: observations[0]!.window.startDate,
    latestEndDate: observations.at(-1)!.window.endDate,
    expectedDayCount: dayCount(earliestStartDate, latestEndDate),
    coveredDayCount: covered.size,
    gapRanges,
    overlappingWindowCount,
    partialObservationCount,
  };
}

function comparisonLimitation(
  points: MarketingHistoryPoint[],
  coverage: MarketingHistoryCoverage,
  metric: MarketingHistoryQuery['metric'],
): string | undefined {
  if (points.length < 2) return 'At least two recorded periods are required.';
  const durations = new Set(points.map((point) => dayCount(point.startDate, point.endDate)));
  if (durations.size !== 1) return 'Recorded periods use different window lengths.';
  if (coverage.overlappingWindowCount > 0) return 'Recorded periods overlap and cannot be added.';
  if (coverage.partialObservationCount > 0) return 'One or more recorded periods are partial.';
  if (metric === 'cost') {
    if (points.some((point) => point.currencyCode === undefined)) {
      return 'One or more cost periods do not contain exactly one comparable currency.';
    }
    const currencies = new Set(points.map((point) => point.currencyCode).filter(Boolean));
    if (currencies.size !== 1) return 'Cost periods do not share one comparable currency.';
  }
  return undefined;
}

export function queryMarketingHistoryCatalog(
  catalog: MarketingHistoryCatalog,
  query: MarketingHistoryQuery,
): MarketingHistoryQueryResult {
  const limit = Math.min(Math.max(query.limit ?? 120, 1), 500);
  const matching = matchingObservations(catalog, query);
  const observations =
    query.startDate && query.endDate
      ? selectNonOverlappingHistoryObservations({
          observations: matching,
          window: { startDate: query.startDate, endDate: query.endDate },
        })
      : matching;
  const selected = observations.slice(-limit);
  const points = selected.map((observation) => pointFromObservation(observation, query));
  const coverage = coverageFor(selected, query);
  const limitation = comparisonLimitation(points, coverage, query.metric);
  return {
    query,
    points,
    coverage,
    comparable: limitation === undefined,
    ...(limitation ? { comparisonLimitation: limitation } : {}),
    truncated: observations.length > selected.length,
  };
}

export function queryMarketingHistory(input: {
  cwd: string;
  query: MarketingHistoryQuery;
}): MarketingHistoryQueryResult {
  return queryMarketingHistoryCatalog(
    ensureMarketingHistoryCatalog(path.resolve(input.cwd)),
    input.query,
  );
}

export function compareLatestMarketingHistoryPeriods(
  result: MarketingHistoryQueryResult,
): MarketingHistoryPeriodComparison {
  const current = result.points.at(-1);
  if (!current) return { status: 'unavailable', reason: 'No recorded period is available.' };
  if (!result.comparable) {
    return {
      status: 'unavailable',
      reason: result.comparisonLimitation ?? 'The recorded periods are not comparable.',
      current,
    };
  }
  const duration = dayCount(current.startDate, current.endDate);
  const baseline = result.points
    .slice(0, -1)
    .reverse()
    .find(
      (point) =>
        point.endDate < current.startDate && dayCount(point.startDate, point.endDate) === duration,
    );
  if (!baseline) {
    return {
      status: 'unavailable',
      reason: 'No non-overlapping previous period with the same duration is available.',
      current,
    };
  }
  const absoluteChange = current.value - baseline.value;
  return {
    status: 'available',
    current,
    baseline,
    absoluteChange,
    ...(baseline.value !== 0 ? { percentageChange: (absoluteChange / baseline.value) * 100 } : {}),
  };
}
