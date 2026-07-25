import { createHash } from 'node:crypto';
import type { CsvRecord } from '../providers/csv/parse-csv.js';
import {
  competitorResearchFileSchema,
  type CompetitorContentPattern,
  type CompetitorKeywordSignal,
  type CompetitorPage,
  type CompetitorPageSource,
  type CompetitorResearchFile,
} from '../schema/competitor.js';

export type ImportCompetitorCsvOptions = {
  records: CsvRecord[];
  platformId: string;
  source: CompetitorPageSource;
  sourceFile?: string;
  market?: string;
};

export function importCompetitorCsv(options: ImportCompetitorCsvOptions): CompetitorResearchFile {
  const pages = options.records
    .map((record, index) => mapRecordToCompetitorPage(record, options, index))
    .filter((page): page is CompetitorPage => page !== null);

  return competitorResearchFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    market: cleanOptional(options.market),
    source: options.source,
    pages,
  });
}

function mapRecordToCompetitorPage(
  record: CsvRecord,
  options: ImportCompetitorCsvOptions,
  index: number,
): CompetitorPage | null {
  const url = readFirst(record, ['url', 'URL', 'link', 'Link']);
  if (!url) {
    return null;
  }

  const keyword = readFirst(record, ['keyword', 'query', 'search term', 'Search term']);
  const domain = getDomain(url);
  const position = parsePositiveInteger(readFirst(record, ['position', 'rank', 'serp position']));
  const title = readFirst(record, ['title', 'seo title', 'page title']);
  const h1 = readFirst(record, ['h1', 'H1', 'heading']);
  const metaDescription = readFirst(record, ['metaDescription', 'meta description', 'description']);
  const pageType = readFirst(record, ['pageType', 'page type', 'type']);
  const categoryPath = splitList(readFirst(record, ['categoryPath', 'category path', 'category']));
  const contentPatterns = splitPatterns(
    readFirst(record, ['patterns', 'contentPatterns', 'content patterns']),
  );
  const keywordSignals = splitKeywordSignals(
    readFirst(record, ['keywordSignals', 'keyword signals', 'page keywords', 'terms']),
  );
  const notes = readFirst(record, ['notes', 'note']);
  const idSeed = [keyword, url].filter(Boolean).join('|');

  return {
    id: `competitor-${stableId(idSeed, index)}`,
    platformId: options.platformId,
    source: options.source,
    sourceFile: cleanOptional(options.sourceFile),
    keyword: cleanOptional(keyword),
    position,
    url,
    domain,
    title: cleanOptional(title),
    h1: cleanOptional(h1),
    metaDescription: cleanOptional(metaDescription),
    pageType: cleanOptional(pageType),
    categoryPath,
    contentPatterns,
    keywordSignals,
    notes: cleanOptional(notes),
  };
}

function readFirst(record: CsvRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function splitList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/[>|;/]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function splitPatterns(value: string | undefined): CompetitorContentPattern[] {
  return splitList(value).map((label) => ({ label }));
}

function splitKeywordSignals(value: string | undefined): CompetitorKeywordSignal[] | undefined {
  const signals = splitList(value).map((term) => ({
    term,
    count: 1,
    sources: ['manual' as const],
  }));
  return signals.length > 0 ? signals : undefined;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown-domain';
  }
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function stableId(value: string, fallbackIndex: number): string {
  const seed = value.length > 0 ? value : String(fallbackIndex + 1);
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}
