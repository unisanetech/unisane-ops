import { createHash } from 'node:crypto';
import type { SeoPerformanceRecord } from '@unisane/growth/contracts';

export type Ga4ResponseRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

export type MapGa4RowsToPerformanceRecordsOptions = {
  rows: Ga4ResponseRow[];
  platformId: string;
  dimensions: string[];
  metrics: string[];
  fetchedAt: string;
};

export function mapGa4RowsToPerformanceRecords(
  options: MapGa4RowsToPerformanceRecordsOptions,
): SeoPerformanceRecord[] {
  return options.rows
    .map((row, index) => {
      const pagePath = normalizePagePath(
        readDimensionValue(row, options.dimensions, [
          'landingPagePlusQueryString',
          'pagePathPlusQueryString',
          'pagePath',
        ]),
      );
      if (!pagePath) {
        return null;
      }

      const record: SeoPerformanceRecord = {
        id: createRecordId({ pagePath, index }),
        platformId: options.platformId,
        source: 'ga4',
        pagePath,
        fetchedAt: options.fetchedAt,
      };
      assignIfDefined(record, 'sessions', readMetricInteger(row, options.metrics, ['sessions']));
      assignIfDefined(
        record,
        'users',
        readMetricInteger(row, options.metrics, ['totalUsers', 'activeUsers', 'users']),
      );
      assignIfDefined(
        record,
        'conversions',
        readMetricNumber(row, options.metrics, ['conversions', 'keyEvents']),
      );
      assignIfDefined(
        record,
        'revenue',
        readMetricNumber(row, options.metrics, ['totalRevenue', 'purchaseRevenue']),
      );
      return record;
    })
    .filter((record): record is SeoPerformanceRecord => record !== null);
}

function assignIfDefined<TKey extends keyof SeoPerformanceRecord>(
  record: SeoPerformanceRecord,
  key: TKey,
  value: SeoPerformanceRecord[TKey] | undefined,
): void {
  if (value !== undefined) {
    record[key] = value;
  }
}

function readDimensionValue(
  row: Ga4ResponseRow,
  dimensions: string[],
  candidates: string[],
): string | undefined {
  for (const candidate of candidates) {
    const index = dimensions.indexOf(candidate);
    const value = index >= 0 ? row.dimensionValues?.[index]?.value?.trim() : undefined;
    if (value) {
      return value;
    }
  }
  return undefined;
}

function readMetricInteger(
  row: Ga4ResponseRow,
  metrics: string[],
  candidates: string[],
): number | undefined {
  const value = readMetricNumber(row, metrics, candidates);
  return value === undefined ? undefined : Math.round(value);
}

function readMetricNumber(
  row: Ga4ResponseRow,
  metrics: string[],
  candidates: string[],
): number | undefined {
  for (const candidate of candidates) {
    const index = metrics.indexOf(candidate);
    const rawValue = index >= 0 ? row.metricValues?.[index]?.value : undefined;
    const value = rawValue ? Number(rawValue) : undefined;
    if (value !== undefined && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function normalizePagePath(value: string | undefined): string | undefined {
  if (!value || value === '(not set)') {
    return undefined;
  }
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
}

function createRecordId(options: { pagePath: string; index: number }): string {
  const seed = ['ga4', options.pagePath, String(options.index + 1)].join('|');
  return `perf-${createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
}
