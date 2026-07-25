import { createHash } from 'node:crypto';
import type { CsvRecord } from '../providers/csv/parse-csv.js';
import type { SeoPerformanceRecord, SeoPerformanceSource } from '../schema/performance.js';

export type MapSeoPerformanceCsvOptions = {
  records: CsvRecord[];
  platformId: string;
  source: SeoPerformanceSource;
  sourceFile?: string;
  fetchedAt?: string;
};

const pageColumns = ['page', 'page path', 'page path + query string', 'landing page', 'url'];
const queryColumns = ['query', 'search query', 'search term'];
const clickColumns = ['clicks'];
const impressionColumns = ['impressions'];
const ctrColumns = ['ctr', 'url ctr'];
const positionColumns = ['position', 'average position'];
const sessionColumns = ['sessions', 'engaged sessions'];
const userColumns = ['users', 'total users', 'active users'];
const conversionColumns = ['conversions', 'key events'];
const revenueColumns = ['revenue', 'total revenue'];

export function mapSeoPerformanceCsv(options: MapSeoPerformanceCsvOptions): SeoPerformanceRecord[] {
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const performanceRecords: SeoPerformanceRecord[] = [];

  options.records.forEach((record, index) => {
    const pagePath = normalizePagePath(readAliasedColumn(record, pageColumns));
    if (!pagePath) {
      return;
    }

    const query = cleanOptional(readAliasedColumn(record, queryColumns));
    const performanceRecord: SeoPerformanceRecord = {
      id: createRecordId({
        source: options.source,
        pagePath,
        query,
        index,
      }),
      platformId: options.platformId,
      source: options.source,
      pagePath,
      sourceRow: index + 2,
      fetchedAt,
    };

    assignIfDefined(performanceRecord, 'query', query);
    assignIfDefined(
      performanceRecord,
      'clicks',
      parseInteger(readAliasedColumn(record, clickColumns)),
    );
    assignIfDefined(
      performanceRecord,
      'impressions',
      parseInteger(readAliasedColumn(record, impressionColumns)),
    );
    assignIfDefined(performanceRecord, 'ctr', parseRatio(readAliasedColumn(record, ctrColumns)));
    assignIfDefined(
      performanceRecord,
      'position',
      parseNumber(readAliasedColumn(record, positionColumns)),
    );
    assignIfDefined(
      performanceRecord,
      'sessions',
      parseInteger(readAliasedColumn(record, sessionColumns)),
    );
    assignIfDefined(
      performanceRecord,
      'users',
      parseInteger(readAliasedColumn(record, userColumns)),
    );
    assignIfDefined(
      performanceRecord,
      'conversions',
      parseNumber(readAliasedColumn(record, conversionColumns)),
    );
    assignIfDefined(
      performanceRecord,
      'revenue',
      parseCurrency(readAliasedColumn(record, revenueColumns)),
    );
    assignIfDefined(performanceRecord, 'sourceFile', options.sourceFile);

    performanceRecords.push(performanceRecord);
  });

  return performanceRecords;
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

function readAliasedColumn(record: CsvRecord, aliases: string[]): string {
  const normalizedRecord = new Map(
    Object.entries(record).map(([key, value]) => [normalizeHeader(key), value]),
  );
  for (const alias of aliases) {
    const value = normalizedRecord.get(normalizeHeader(alias));
    if (value) {
      return value;
    }
  }
  return '';
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePagePath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}

function createRecordId(options: {
  source: SeoPerformanceSource;
  pagePath: string;
  query?: string;
  index: number;
}): string {
  const seed = [
    options.source,
    options.pagePath,
    options.query ?? '',
    String(options.index + 1),
  ].join('|');
  return `perf-${createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
}

function cleanOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseInteger(value: string): number | undefined {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const numeric = Number(value.replace(/[$,%\s,]/g, ''));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseCurrency(value: string): number | undefined {
  return parseNumber(value);
}

function parseRatio(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = parseNumber(trimmed);
  if (parsed === undefined) {
    return undefined;
  }
  return trimmed.includes('%') ? parsed / 100 : parsed;
}
