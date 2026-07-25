import path from 'node:path';
import { readJson, writeJson } from '../../../utils/fs.js';
import { normalizeKeywordTerm } from '@unisane/growth/contracts';
import { keywordCandidateFileSchema, keywordSeedFileSchema } from '@unisane/growth/contracts';
import { keywordMetricFileSchema, type KeywordMetricFile } from '@unisane/growth/contracts';
import type { GoogleAdsKeywordPlannerCredentials } from './config.js';
import { fetchGoogleAdsKeywordIdeas } from './keyword-ideas.js';
import type { FetchLike } from './oauth.js';

const GOOGLE_ADS_KEYWORD_SEED_BATCH_SIZE = 20;

export type FetchGoogleAdsKeywordMetricsFileOptions = {
  cwd?: string;
  platformId: string;
  output: string;
  credentials: GoogleAdsKeywordPlannerCredentials;
  accessToken?: string;
  candidates?: string;
  seedFile?: string;
  keywords?: string[];
  pageUrl?: string;
  country: string;
  language: string;
  languageId: string;
  locationIds: string[];
  currencyCode?: string;
  clusterId?: string;
  campaignIntent?: string;
  requireTermGroups?: string[][];
  excludeTerms?: string[];
  pageSize?: number;
  fetchImpl?: FetchLike;
  dryRun?: boolean;
};

export type FetchGoogleAdsKeywordMetricsFileResult = {
  output: string;
  candidates?: string;
  seedFile?: string;
  platformId: string;
  country: string;
  language: string;
  locationIds: string[];
  languageId: string;
  currencyCode?: string;
  runId?: string;
  metricCount: number;
  droppedMetricCount: number;
  requireTermGroups: string[][];
  excludeTerms: string[];
  dryRun: boolean;
};

export async function fetchGoogleAdsKeywordMetricsFile(
  options: FetchGoogleAdsKeywordMetricsFileOptions,
): Promise<FetchGoogleAdsKeywordMetricsFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const outputPath = resolvePath(cwd, options.output);
  const candidatePath = options.candidates ? resolvePath(cwd, options.candidates) : undefined;
  const seedFilePath = options.seedFile ? resolvePath(cwd, options.seedFile) : undefined;
  const fileKeywords = candidatePath
    ? keywordCandidateFileSchema
        .parse(await readJson(candidatePath))
        .candidates.map((candidate) => candidate.term)
    : [];
  const seedFileKeywords = seedFilePath
    ? keywordSeedFileSchema
        .parse(await readJson(seedFilePath))
        .seeds.map((seed) => (typeof seed === 'string' ? seed : seed.term))
    : [];
  const allKeywords = dedupeKeywords([
    ...fileKeywords,
    ...seedFileKeywords,
    ...(options.keywords ?? []),
  ]);
  const candidateFile = candidatePath ? path.relative(cwd, candidatePath) : undefined;
  const seedFile = seedFilePath ? path.relative(cwd, seedFilePath) : undefined;
  const fetchedAt = new Date().toISOString();
  const metricFiles = await Promise.all(
    chunkKeywords(allKeywords).map((keywordBatch) =>
      fetchGoogleAdsKeywordIdeas({
        platformId: options.platformId,
        credentials: options.credentials,
        accessToken: options.accessToken,
        country: options.country,
        language: options.language,
        languageId: options.languageId,
        locationIds: options.locationIds,
        currencyCode: options.currencyCode,
        keywords: keywordBatch,
        pageUrl: options.pageUrl,
        candidateFile,
        seedFile,
        clusterId: options.clusterId,
        campaignIntent: options.campaignIntent,
        pageSize: options.pageSize,
        fetchImpl: options.fetchImpl,
        fetchedAt,
      }),
    ),
  );
  const mergedKeywordMetrics = mergeKeywordMetricFiles({
    metricFiles,
    seedKeywords: allKeywords,
    candidateFile,
    seedFile,
    clusterId: options.clusterId,
    campaignIntent: options.campaignIntent,
    pageUrl: options.pageUrl,
  });
  const keywordFilter = normalizeKeywordFilter({
    requireTermGroups: options.requireTermGroups,
    excludeTerms: options.excludeTerms,
  });
  const keywordMetrics = applyKeywordFilter(mergedKeywordMetrics, keywordFilter);
  const droppedMetricCount = mergedKeywordMetrics.metrics.length - keywordMetrics.metrics.length;

  if (!options.dryRun) {
    await writeJson(outputPath, keywordMetrics);
  }

  return {
    output: path.relative(cwd, outputPath),
    candidates: candidatePath ? path.relative(cwd, candidatePath) : undefined,
    platformId: keywordMetrics.platformId,
    country: keywordMetrics.country,
    language: keywordMetrics.language,
    locationIds: options.locationIds,
    languageId: options.languageId,
    currencyCode: keywordMetrics.market?.currencyCode,
    runId: keywordMetrics.runId,
    metricCount: keywordMetrics.metrics.length,
    droppedMetricCount,
    requireTermGroups: keywordFilter.requireTermGroups,
    excludeTerms: keywordFilter.excludeTerms,
    dryRun: options.dryRun === true,
    seedFile: seedFilePath ? path.relative(cwd, seedFilePath) : undefined,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}

function chunkKeywords(keywords: string[]): string[][] {
  if (keywords.length === 0) {
    return [[]];
  }
  const chunks: string[][] = [];
  for (let index = 0; index < keywords.length; index += GOOGLE_ADS_KEYWORD_SEED_BATCH_SIZE) {
    chunks.push(keywords.slice(index, index + GOOGLE_ADS_KEYWORD_SEED_BATCH_SIZE));
  }
  return chunks;
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const keyword of keywords) {
    const normalized = normalizeKeywordTerm(keyword);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(keyword.trim());
  }
  return deduped;
}

function mergeKeywordMetricFiles(options: {
  metricFiles: KeywordMetricFile[];
  seedKeywords: string[];
  candidateFile?: string;
  seedFile?: string;
  clusterId?: string;
  campaignIntent?: string;
  pageUrl?: string;
}): KeywordMetricFile {
  const firstFile = options.metricFiles[0];
  if (!firstFile) {
    throw new Error('Google Ads keyword metrics fetch returned no result files.');
  }
  const metricsByKeyword = new Map(
    options.metricFiles
      .flatMap((file) => file.metrics)
      .map((metric) => [metric.normalizedTerm, metric] as const),
  );
  const kind =
    options.pageUrl && options.seedKeywords.length > 0
      ? 'keyword-and-url-seed'
      : options.pageUrl
        ? 'page-url'
        : options.candidateFile
          ? 'candidate-file'
          : options.seedFile
            ? 'seed-file'
            : 'keyword-seed';

  return keywordMetricFileSchema.parse({
    ...firstFile,
    source: {
      kind,
      ...(options.candidateFile ? { candidateFile: options.candidateFile } : {}),
      ...(options.seedFile ? { seedFile: options.seedFile } : {}),
      ...(options.pageUrl ? { pageUrl: options.pageUrl } : {}),
      seedKeywords: options.seedKeywords,
      ...(options.clusterId ? { clusterId: options.clusterId } : {}),
      ...(options.campaignIntent ? { campaignIntent: options.campaignIntent } : {}),
    },
    metrics: [...metricsByKeyword.values()],
  });
}

type KeywordFilter = {
  requireTermGroups: string[][];
  excludeTerms: string[];
};

function normalizeKeywordFilter(filter: {
  requireTermGroups?: string[][];
  excludeTerms?: string[];
}): KeywordFilter {
  return {
    requireTermGroups: (filter.requireTermGroups ?? [])
      .map((group) => dedupeKeywords(group))
      .filter((group) => group.length > 0),
    excludeTerms: dedupeKeywords(filter.excludeTerms ?? []),
  };
}

function applyKeywordFilter(
  keywordMetrics: KeywordMetricFile,
  filter: KeywordFilter,
): KeywordMetricFile {
  if (filter.requireTermGroups.length === 0 && filter.excludeTerms.length === 0) {
    return keywordMetrics;
  }
  return keywordMetricFileSchema.parse({
    ...keywordMetrics,
    metrics: keywordMetrics.metrics.filter((metric) => matchesKeywordFilter(metric.term, filter)),
  });
}

function matchesKeywordFilter(term: string, filter: KeywordFilter): boolean {
  if (filter.excludeTerms.some((filterTerm) => termIncludesFilterTerm(term, filterTerm))) {
    return false;
  }
  return filter.requireTermGroups.every((group) =>
    group.some((filterTerm) => termIncludesFilterTerm(term, filterTerm)),
  );
}

function termIncludesFilterTerm(term: string, filterTerm: string): boolean {
  return normalizeKeywordTerm(term).includes(normalizeKeywordTerm(filterTerm));
}
