import path from 'node:path';
import { readText, writeJson } from '../../utils/fs.js';
import { parseCsvRecords, type CsvRecord } from '../providers/csv/parse-csv.js';
import { fetchCompetitorUrls, type CompetitorUrlInput, type FetchLike } from './fetch-url.js';

export type FetchCompetitorResearchFileOptions = {
  cwd?: string;
  platformId: string;
  input: string;
  output: string;
  market?: string;
  timeoutMs?: number;
  userAgent?: string;
  maxPages?: number;
  dryRun?: boolean;
  fetchImpl?: FetchLike;
};

export type FetchCompetitorResearchFileResult = {
  input: string;
  output: string;
  platformId: string;
  market?: string;
  source: 'url-fetch';
  requestedCount: number;
  pageCount: number;
  failedCount: number;
  domainCount: number;
  keywordCount: number;
  dryRun: boolean;
};

export async function fetchCompetitorResearchFile(
  options: FetchCompetitorResearchFileOptions,
): Promise<FetchCompetitorResearchFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const inputText = await readText(inputPath);
  const urlInputs = parseUrlInputs(inputText);
  const sourceFile = path.relative(cwd, inputPath);
  const { competitorFile, failedUrls } = await fetchCompetitorUrls({
    platformId: options.platformId,
    urls: urlInputs,
    market: options.market,
    sourceFile,
    timeoutMs: options.timeoutMs,
    userAgent: options.userAgent,
    maxPages: options.maxPages,
    fetchImpl: options.fetchImpl,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, competitorFile);
  }

  return {
    input: sourceFile,
    output: path.relative(cwd, outputPath),
    platformId: options.platformId,
    market: competitorFile.market,
    source: 'url-fetch',
    requestedCount: Math.min(urlInputs.length, options.maxPages ?? 25),
    pageCount: competitorFile.pages.length,
    failedCount: failedUrls.length,
    domainCount: new Set(competitorFile.pages.map((page) => page.domain)).size,
    keywordCount: new Set(competitorFile.pages.flatMap((page) => page.keyword ?? [])).size,
    dryRun: options.dryRun === true,
  };
}

function parseUrlInputs(input: string): CompetitorUrlInput[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? '';
  if (
    firstLine
      .toLowerCase()
      .split(',')
      .map((cell) => cell.trim())
      .includes('url')
  ) {
    return parseCsvRecords(trimmed)
      .map(mapCsvRecordToUrlInput)
      .filter((record): record is CompetitorUrlInput => record !== null);
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((url) => ({ url }));
}

function mapCsvRecordToUrlInput(record: CsvRecord): CompetitorUrlInput | null {
  const url = readFirst(record, ['url', 'URL', 'link', 'Link']);
  if (!url) {
    return null;
  }
  return {
    url,
    keyword: cleanOptional(readFirst(record, ['keyword', 'query', 'search term', 'Search term'])),
    position: parsePositiveInteger(readFirst(record, ['position', 'rank', 'serp position'])),
    pageType: cleanOptional(readFirst(record, ['pageType', 'page type', 'type'])),
    notes: cleanOptional(readFirst(record, ['notes', 'note'])),
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

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
