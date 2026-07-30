import type { SeoPerformanceFile } from '@unisane/growth/contracts';
import { seoPerformanceFileSchema } from '@unisane/growth/contracts';
import type { FetchLike } from '../google-ads/transport.js';
import { mapGa4RowsToPerformanceRecords, type Ga4ResponseRow } from './map-report.js';

export type RunGa4PerformanceReportOptions = {
  platformId: string;
  accessToken: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  offset?: number;
  maxRows?: number;
  fetchImpl?: FetchLike;
  fetchedAt?: string;
};

export async function runGa4PerformanceReport(
  options: RunGa4PerformanceReportOptions,
): Promise<SeoPerformanceFile> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const accessToken = options.accessToken;
  const rows = await fetchAllRows({ options, fetchImpl, accessToken });

  return seoPerformanceFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    source: 'ga4',
    property: normalizePropertyName(options.propertyId),
    dateRange: `${options.startDate}..${options.endDate}`,
    records: mapGa4RowsToPerformanceRecords({
      rows,
      platformId: options.platformId,
      dimensions: options.dimensions,
      metrics: options.metrics,
      fetchedAt: options.fetchedAt ?? new Date().toISOString(),
    }),
  });
}

async function fetchAllRows(options: {
  options: RunGa4PerformanceReportOptions;
  fetchImpl: FetchLike;
  accessToken: string;
}): Promise<Ga4ResponseRow[]> {
  const limit = clampLimit(options.options.limit ?? 1000);
  const offset = options.options.offset ?? 0;
  const maxRows = options.options.maxRows ?? limit;
  const rows: Ga4ResponseRow[] = [];
  let nextOffset = offset;

  while (rows.length < maxRows) {
    const currentLimit = Math.min(limit, maxRows - rows.length);
    const pageRows = await fetchRows({
      options: options.options,
      fetchImpl: options.fetchImpl,
      accessToken: options.accessToken,
      limit: currentLimit,
      offset: nextOffset,
    });
    rows.push(...pageRows);
    if (pageRows.length < currentLimit) {
      break;
    }
    nextOffset += pageRows.length;
  }

  return rows;
}

async function fetchRows(options: {
  options: RunGa4PerformanceReportOptions;
  fetchImpl: FetchLike;
  accessToken: string;
  limit: number;
  offset: number;
}): Promise<Ga4ResponseRow[]> {
  const response = await options.fetchImpl(
    `https://analyticsdata.googleapis.com/v1beta/${normalizePropertyName(options.options.propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: options.options.startDate, endDate: options.options.endDate }],
        dimensions: options.options.dimensions.map((name) => ({ name })),
        metrics: options.options.metrics.map((name) => ({ name })),
        limit: String(options.limit),
        offset: String(options.offset),
      }),
    },
  );
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Google Analytics Data API runReport failed: ${readErrorMessage(payload)}.`);
  }
  return readRows(payload);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readRows(payload: unknown): Ga4ResponseRow[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const rows = (payload as Record<string, unknown>).rows;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.filter((row): row is Ga4ResponseRow => row !== null && typeof row === 'object');
}

function readErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'unknown error';
  }
  const error = (payload as Record<string, unknown>).error;
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'unknown error';
}

function normalizePropertyName(propertyId: string): string {
  const normalized = propertyId.trim();
  return normalized.startsWith('properties/') ? normalized : `properties/${normalized}`;
}

function clampLimit(value: number): number {
  return Math.min(Math.max(Math.round(value), 1), 250_000);
}
