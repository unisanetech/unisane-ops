import { createHash } from 'node:crypto';
import { normalizeKeywordTerm } from '../expansion/normalize-keywords.js';
import type { CsvRecord } from '../providers/csv/parse-csv.js';
import type { TrendRelatedQueryType, TrendsProvider, TrendSignal } from '../schema/trends.js';

export type MapTrendCsvOptions = {
  records: CsvRecord[];
  platformId: string;
  provider: TrendsProvider;
  country?: string;
  language?: string;
  dateRange?: string;
  sourceFile?: string;
  fetchedAt?: string;
};

const termColumns = ['term', 'keyword', 'query', 'search term'];
const dateColumns = ['date', 'week', 'month', 'time'];
const countryColumns = ['country', 'market'];
const regionColumns = ['region', 'subregion', 'metro'];
const languageColumns = ['language', 'lang'];
const interestColumns = ['relative interest', 'interest', 'value', 'score'];
const relatedQueryColumns = ['related query', 'related queries', 'rising query', 'top query'];
const relatedQueryTypeColumns = ['related query type', 'query type', 'type'];
const breakoutColumns = ['breakout', 'is breakout'];

export function mapTrendCsv(options: MapTrendCsvOptions): TrendSignal[] {
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const signals: TrendSignal[] = [];

  options.records.forEach((record, index) => {
    const term = cleanOptional(readAliasedColumn(record, termColumns));
    const relatedQuery = cleanOptional(readAliasedColumn(record, relatedQueryColumns));
    if (!term && !relatedQuery) {
      return;
    }
    const signalTerm = term ?? relatedQuery;
    if (!signalTerm) {
      return;
    }

    const signal: TrendSignal = {
      id: createTrendSignalId({
        provider: options.provider,
        term: signalTerm,
        relatedQuery,
        index,
      }),
      platformId: options.platformId,
      provider: options.provider,
      term: signalTerm,
      normalizedTerm: normalizeKeywordTerm(signalTerm),
      fetchedAt,
      sourceRow: index + 2,
    };

    assignIfDefined(
      signal,
      'country',
      cleanOptional(readAliasedColumn(record, countryColumns)) ?? options.country,
    );
    assignIfDefined(signal, 'region', cleanOptional(readAliasedColumn(record, regionColumns)));
    assignIfDefined(
      signal,
      'language',
      cleanOptional(readAliasedColumn(record, languageColumns)) ?? options.language,
    );
    assignIfDefined(signal, 'date', cleanOptional(readAliasedColumn(record, dateColumns)));
    assignIfDefined(signal, 'dateRange', options.dateRange);
    assignIfDefined(
      signal,
      'relativeInterest',
      parseTrendInterest(readAliasedColumn(record, interestColumns)),
    );
    assignIfDefined(signal, 'relatedQuery', relatedQuery);
    assignIfDefined(
      signal,
      'relatedQueryType',
      parseRelatedQueryType(readAliasedColumn(record, relatedQueryTypeColumns)),
    );
    assignIfDefined(signal, 'breakout', parseBoolean(readAliasedColumn(record, breakoutColumns)));
    assignIfDefined(signal, 'sourceFile', options.sourceFile);

    signals.push(signal);
  });

  return signals;
}

function assignIfDefined<TKey extends keyof TrendSignal>(
  record: TrendSignal,
  key: TKey,
  value: TrendSignal[TKey] | undefined,
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

function createTrendSignalId(options: {
  provider: TrendsProvider;
  term: string;
  relatedQuery?: string;
  index: number;
}): string {
  const seed = [
    options.provider,
    options.term,
    options.relatedQuery ?? '',
    String(options.index + 1),
  ].join('|');
  return `trend-${createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function parseTrendInterest(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.toLowerCase() === 'breakout') {
    return 100;
  }
  const parsed = Number(trimmed.replace(/[,%\s]/g, ''));
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, parsed));
}

function parseRelatedQueryType(value: string): TrendRelatedQueryType | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'top' || normalized === 'rising') {
    return normalized;
  }
  return undefined;
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (['true', 'yes', '1', 'breakout'].includes(normalized)) {
    return true;
  }
  if (['false', 'no', '0'].includes(normalized)) {
    return false;
  }
  return undefined;
}
