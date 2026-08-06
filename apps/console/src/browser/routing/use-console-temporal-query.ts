import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MarketingConsoleState, MarketingConsoleTemporalQuery } from '@unisane/growth/console';
import type { ConsoleRoute } from '../../routes.js';

const REPORTING_RANGE_STORAGE_KEY = 'unisane-ops-reporting-range';

export type ConsoleDatePreset =
  | 'today'
  | 'yesterday'
  | 'last-7-days'
  | 'last-28-days'
  | 'last-30-days'
  | 'this-month'
  | 'last-month'
  | 'custom';

export function routeHasDateRange(route: ConsoleRoute): boolean {
  return route.temporalMode === 'performance-range' || route.temporalMode === 'event-range';
}

function storageKeyForRoute(route: ConsoleRoute): string | undefined {
  if (route.temporalMode === 'performance-range' || route.temporalMode === 'event-range') {
    return REPORTING_RANGE_STORAGE_KEY;
  }
  return undefined;
}

function isTemporalQuery(value: unknown): value is MarketingConsoleTemporalQuery {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MarketingConsoleTemporalQuery>;
  return (
    typeof candidate.startDate === 'string' &&
    typeof candidate.endDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.endDate) &&
    candidate.startDate <= candidate.endDate
  );
}

function readRememberedQuery(route: ConsoleRoute): MarketingConsoleTemporalQuery | undefined {
  const storageKey = storageKeyForRoute(route);
  if (!storageKey) return undefined;
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return undefined;
    const parsed: unknown = JSON.parse(stored);
    return isTemporalQuery(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function rememberQuery(route: ConsoleRoute, query: MarketingConsoleTemporalQuery): void {
  const storageKey = storageKeyForRoute(route);
  if (!storageKey) return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(query));
  } catch {
    return;
  }
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return isoDate(value);
}

function defaultEndDate(state: MarketingConsoleState): string {
  return state.dateWindow.endDate ?? state.history.latestEndDate ?? state.generatedAt.slice(0, 10);
}

function defaultQuery(
  route: ConsoleRoute,
  state: MarketingConsoleState,
): MarketingConsoleTemporalQuery {
  const endDate = defaultEndDate(state);
  if (route.temporalMode === 'performance-range' && state.dateWindow.startDate) {
    return { startDate: state.dateWindow.startDate, endDate };
  }
  return {
    startDate: addDays(endDate, -27),
    endDate,
  };
}

function readQuery(
  route: ConsoleRoute,
  state: MarketingConsoleState,
): MarketingConsoleTemporalQuery {
  const fallback = defaultQuery(route, state);
  if (!routeHasDateRange(route)) return fallback;
  const params = new URLSearchParams(window.location.search);
  const startDate = params.get('from');
  const endDate = params.get('to');
  const urlQuery =
    startDate &&
    endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate
      ? { startDate, endDate }
      : undefined;
  return urlQuery ?? readRememberedQuery(route) ?? fallback;
}

function replaceUrlQuery(query: MarketingConsoleTemporalQuery): void {
  const url = new URL(window.location.href);
  url.searchParams.set('from', query.startDate);
  url.searchParams.set('to', query.endDate);
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}

export function pathWithRememberedTemporalQuery(path: string, route: ConsoleRoute): string {
  const query = readRememberedQuery(route);
  if (!query) return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('from', query.startDate);
  url.searchParams.set('to', query.endDate);
  return `${url.pathname}${url.search}`;
}

export function queryForPreset(
  preset: Exclude<ConsoleDatePreset, 'custom'>,
  endDate: string,
): MarketingConsoleTemporalQuery {
  if (preset === 'today') return { startDate: endDate, endDate };
  if (preset === 'yesterday') {
    const yesterday = addDays(endDate, -1);
    return { startDate: yesterday, endDate: yesterday };
  }
  const anchor = new Date(`${endDate}T00:00:00.000Z`);
  if (preset === 'this-month') {
    return {
      startDate: isoDate(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))),
      endDate,
    };
  }
  if (preset === 'last-month') {
    const startDate = isoDate(
      new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1)),
    );
    const lastDate = isoDate(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 0)));
    return { startDate, endDate: lastDate };
  }
  const days = preset === 'last-7-days' ? 7 : preset === 'last-28-days' ? 28 : 30;
  return { startDate: addDays(endDate, -(days - 1)), endDate };
}

export function useConsoleTemporalQuery(route: ConsoleRoute, bootState: MarketingConsoleState) {
  const [query, setQueryState] = useState(() => readQuery(route, bootState));
  const enabled = routeHasDateRange(route);

  useEffect(() => {
    const nextQuery = readQuery(route, bootState);
    setQueryState(nextQuery);
    if (routeHasDateRange(route)) {
      rememberQuery(route, nextQuery);
      replaceUrlQuery(nextQuery);
    }
  }, [bootState, route.id]);

  useEffect(() => {
    const onPopState = () => setQueryState(readQuery(route, bootState));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [bootState, route]);

  const setQuery = useCallback(
    (next: MarketingConsoleTemporalQuery) => {
      if (!enabled) return;
      rememberQuery(route, next);
      replaceUrlQuery(next);
      setQueryState(next);
    },
    [enabled, route],
  );

  return useMemo(() => ({ enabled, query, setQuery }), [enabled, query, setQuery]);
}
