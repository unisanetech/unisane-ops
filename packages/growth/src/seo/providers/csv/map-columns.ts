import { normalizeKeywordTerm } from '../../expansion/normalize-keywords.js';
import type { KeywordMetric, KeywordMetricProvider } from '../../schema/metric.js';
import type { CsvRecord } from './parse-csv.js';

export type MapCsvMetricsOptions = {
  records: CsvRecord[];
  platformId: string;
  country: string;
  language: string;
  provider: KeywordMetricProvider;
  sourceFile?: string;
  fetchedAt?: string;
};

const termColumns = ['keyword', 'term', 'search term', 'keyword idea'];
const volumeColumns = [
  'avg monthly searches',
  'avg. monthly searches',
  'average monthly searches',
  'search volume',
  'volume',
];
const competitionColumns = ['competition'];
const competitionIndexColumns = [
  'competition index',
  'competition indexed value',
  'competition (indexed value)',
];
const lowBidColumns = ['low top of page bid', 'top of page bid low range', 'low bid'];
const highBidColumns = ['high top of page bid', 'top of page bid high range', 'high bid'];

export function mapCsvMetrics(options: MapCsvMetricsOptions): KeywordMetric[] {
  const seenTerms = new Set<string>();
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const metrics: KeywordMetric[] = [];

  options.records.forEach((record, index) => {
    const term = readAliasedColumn(record, termColumns);
    const normalizedTerm = normalizeKeywordTerm(term);
    if (!normalizedTerm || seenTerms.has(normalizedTerm)) {
      return;
    }
    seenTerms.add(normalizedTerm);

    metrics.push({
      term: term.trim(),
      normalizedTerm,
      country: options.country,
      language: options.language,
      provider: options.provider,
      avgMonthlySearches: parseInteger(readAliasedColumn(record, volumeColumns)),
      competition: normalizeCompetition(readAliasedColumn(record, competitionColumns)),
      competitionIndex: parseNumber(readAliasedColumn(record, competitionIndexColumns)),
      lowTopOfPageBidMicros: parseBidMicros(readAliasedColumn(record, lowBidColumns)),
      highTopOfPageBidMicros: parseBidMicros(readAliasedColumn(record, highBidColumns)),
      sourceFile: options.sourceFile,
      sourceRow: index + 2,
      fetchedAt,
    });
  });

  return metrics.sort((left, right) => left.normalizedTerm.localeCompare(right.normalizedTerm));
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

function parseInteger(value: string): number | undefined {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

function parseNumber(value: string): number | undefined {
  const numeric = Number(value.replace(/[$,%\s,]/g, ''));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseBidMicros(value: string): number | undefined {
  const parsed = parseNumber(value);
  if (parsed === undefined) {
    return undefined;
  }
  return Math.round(parsed * 1_000_000);
}

function normalizeCompetition(value: string): KeywordMetric['competition'] {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH') {
    return normalized;
  }
  return value.trim() ? 'UNSPECIFIED' : undefined;
}
