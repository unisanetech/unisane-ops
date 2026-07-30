import { createHash } from 'node:crypto';
import type { SeoPerformanceFile, SeoPerformanceRecord } from '@unisane/growth/contracts';
import { seoPerformanceFileSchema } from '@unisane/growth/contracts';
import type { FetchLike } from '../google-ads/transport.js';

export type SearchConsoleDimension =
  | 'query'
  | 'page'
  | 'country'
  | 'device'
  | 'date'
  | 'searchAppearance';

export type QuerySearchConsolePerformanceOptions = {
  platformId: string;
  accessToken: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: SearchConsoleDimension[];
  rowLimit?: number;
  startRow?: number;
  maxRows?: number;
  searchType?: string;
  dataState?: string;
  fetchImpl?: FetchLike;
  fetchedAt?: string;
};

export async function querySearchConsolePerformance(
  options: QuerySearchConsolePerformanceOptions,
): Promise<SeoPerformanceFile> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const accessToken = options.accessToken;
  const rows = await fetchAllRows({
    options,
    fetchImpl,
    accessToken,
  });

  return seoPerformanceFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    source: 'google-search-console',
    property: options.siteUrl,
    dateRange: `${options.startDate}..${options.endDate}`,
    records: mapRowsToPerformanceRecords({
      rows,
      platformId: options.platformId,
      dimensions: options.dimensions,
      fetchedAt: options.fetchedAt ?? new Date().toISOString(),
    }),
  });
}

async function fetchAllRows(options: {
  options: QuerySearchConsolePerformanceOptions;
  fetchImpl: FetchLike;
  accessToken: string;
}): Promise<SearchConsoleResponseRow[]> {
  const rowLimit = clampRowLimit(options.options.rowLimit ?? 1000);
  const startRow = options.options.startRow ?? 0;
  const maxRows = options.options.maxRows ?? rowLimit;
  const rows: SearchConsoleResponseRow[] = [];
  let nextStartRow = startRow;

  while (rows.length < maxRows) {
    const currentLimit = Math.min(rowLimit, maxRows - rows.length);
    const pageRows = await fetchRows({
      options: options.options,
      fetchImpl: options.fetchImpl,
      accessToken: options.accessToken,
      rowLimit: currentLimit,
      startRow: nextStartRow,
    });
    rows.push(...pageRows);
    if (pageRows.length < currentLimit) {
      break;
    }
    nextStartRow += pageRows.length;
  }

  return rows;
}

async function fetchRows(options: {
  options: QuerySearchConsolePerformanceOptions;
  fetchImpl: FetchLike;
  accessToken: string;
  rowLimit: number;
  startRow: number;
}): Promise<SearchConsoleResponseRow[]> {
  const response = await options.fetchImpl(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(options.options.siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        startDate: options.options.startDate,
        endDate: options.options.endDate,
        dimensions: options.options.dimensions,
        rowLimit: options.rowLimit,
        startRow: options.startRow,
        type: options.options.searchType ?? 'web',
        ...(options.options.dataState ? { dataState: options.options.dataState } : {}),
      }),
    },
  );
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Google Search Console query failed: ${readErrorMessage(payload)}.`);
  }
  return readRows(payload);
}

function mapRowsToPerformanceRecords(options: {
  rows: SearchConsoleResponseRow[];
  platformId: string;
  dimensions: SearchConsoleDimension[];
  fetchedAt: string;
}): SeoPerformanceRecord[] {
  return options.rows
    .map((row, index) => {
      const pagePath = readDimensionValue({
        row,
        dimensions: options.dimensions,
        dimension: 'page',
      });
      const normalizedPagePath = normalizePagePath(pagePath);
      if (!normalizedPagePath) {
        return null;
      }

      const query = readDimensionValue({
        row,
        dimensions: options.dimensions,
        dimension: 'query',
      });
      const record: SeoPerformanceRecord = {
        id: createRecordId({
          pagePath: normalizedPagePath,
          query,
          index,
        }),
        platformId: options.platformId,
        source: 'google-search-console',
        pagePath: normalizedPagePath,
        clicks: Math.round(row.clicks ?? 0),
        impressions: Math.round(row.impressions ?? 0),
        ctr: row.ctr,
        position: row.position,
        fetchedAt: options.fetchedAt,
      };
      if (query) {
        record.query = query;
      }
      return record;
    })
    .filter((record): record is SeoPerformanceRecord => record !== null);
}

type SearchConsoleResponseRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function readRows(payload: unknown): SearchConsoleResponseRow[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const rows = (payload as Record<string, unknown>).rows;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.filter(
    (row): row is SearchConsoleResponseRow => row !== null && typeof row === 'object',
  );
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'unknown error';
  }
  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'unknown error';
}

function readDimensionValue(options: {
  row: SearchConsoleResponseRow;
  dimensions: SearchConsoleDimension[];
  dimension: SearchConsoleDimension;
}): string | undefined {
  const index = options.dimensions.indexOf(options.dimension);
  if (index < 0) {
    return undefined;
  }
  const value = options.row.keys?.[index]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function clampRowLimit(value: number): number {
  return Math.min(Math.max(Math.round(value), 1), 25_000);
}

function normalizePagePath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
}

function createRecordId(options: { pagePath: string; query?: string; index: number }): string {
  const seed = [
    'google-search-console',
    options.pagePath,
    options.query ?? '',
    String(options.index + 1),
  ].join('|');
  return `perf-${createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
}
