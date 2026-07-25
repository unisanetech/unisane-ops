import { normalizeKeywordTerm } from '@unisane/growth/contracts';
import { keywordMetricFileSchema, type KeywordMetricFile } from '@unisane/growth/contracts';
import type { GoogleAdsKeywordPlannerCredentials } from './config.js';
import { refreshGoogleOAuthAccessToken, type FetchLike } from './oauth.js';

export type FetchGoogleAdsKeywordIdeasOptions = {
  platformId: string;
  credentials: GoogleAdsKeywordPlannerCredentials;
  country: string;
  language: string;
  languageId: string;
  locationIds: string[];
  currencyCode?: string;
  keywords?: string[];
  pageUrl?: string;
  candidateFile?: string;
  seedFile?: string;
  clusterId?: string;
  campaignIntent?: string;
  includeAdultKeywords?: boolean;
  pageSize?: number;
  accessToken?: string;
  fetchImpl?: FetchLike;
  fetchedAt?: string;
  runId?: string;
};

type GoogleAdsKeywordIdeaResult = {
  text?: string;
  keywordIdeaMetrics?: {
    avgMonthlySearches?: string | number;
    competition?: string;
    competitionIndex?: string | number;
    lowTopOfPageBidMicros?: string | number;
    highTopOfPageBidMicros?: string | number;
  };
};

export async function fetchGoogleAdsKeywordIdeas(
  options: FetchGoogleAdsKeywordIdeasOptions,
): Promise<KeywordMetricFile> {
  const keywords = dedupeKeywords(options.keywords ?? []);
  if (keywords.length === 0 && !options.pageUrl) {
    throw new Error('Pass at least one keyword or pageUrl for Google Ads keyword ideas.');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const accessToken =
    options.accessToken ??
    (await refreshGoogleOAuthAccessToken({
      clientId: options.credentials.clientId,
      clientSecret: options.credentials.clientSecret,
      refreshToken: requireRefreshToken(options.credentials.refreshToken),
      fetchImpl,
    }));
  const response = await fetchImpl(createKeywordIdeasUrl(options.credentials), {
    method: 'POST',
    headers: createGoogleAdsHeaders(options.credentials, accessToken),
    body: JSON.stringify(createKeywordIdeasRequest(options, keywords)),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(`Google Ads keyword ideas request failed: ${readErrorMessage(payload)}.`);
  }

  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  return keywordMetricFileSchema.parse({
    version: 2,
    platformId: options.platformId,
    country: options.country,
    language: options.language,
    provider: 'google-ads',
    runId:
      options.runId ??
      createKeywordMetricsRunId(options.platformId, options.country, options.language, fetchedAt),
    fetchedAt,
    market: {
      country: options.country,
      language: options.language,
      locationIds: options.locationIds,
      languageId: options.languageId,
      ...(options.currencyCode ? { currencyCode: options.currencyCode } : {}),
    },
    source: createKeywordMetricSource(options, keywords),
    metrics: readKeywordIdeas(payload)
      .map((result) =>
        mapKeywordIdeaResult(result, {
          country: options.country,
          language: options.language,
          fetchedAt,
        }),
      )
      .filter((metric) => metric.normalizedTerm.length > 0),
  });
}

function requireRefreshToken(refreshToken: string | undefined): string {
  if (refreshToken?.trim()) return refreshToken;
  throw new Error('Missing Google Ads OAuth refresh token or access token.');
}

function createKeywordIdeasUrl(credentials: GoogleAdsKeywordPlannerCredentials): string {
  return `https://googleads.googleapis.com/${credentials.apiVersion}/customers/${credentials.customerId}:generateKeywordIdeas`;
}

function createGoogleAdsHeaders(
  credentials: GoogleAdsKeywordPlannerCredentials,
  accessToken: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
    'developer-token': credentials.developerToken,
  };
  if (credentials.loginCustomerId) {
    headers['login-customer-id'] = credentials.loginCustomerId;
  }
  return headers;
}

function createKeywordIdeasRequest(
  options: FetchGoogleAdsKeywordIdeasOptions,
  keywords: string[],
): Record<string, unknown> {
  return {
    language: `languageConstants/${options.languageId}`,
    geoTargetConstants: options.locationIds.map((id) => `geoTargetConstants/${id}`),
    includeAdultKeywords: options.includeAdultKeywords === true,
    keywordPlanNetwork: 'GOOGLE_SEARCH',
    pageSize: options.pageSize ?? 1000,
    ...createSeed(options.pageUrl, keywords),
  };
}

function createSeed(pageUrl: string | undefined, keywords: string[]): Record<string, unknown> {
  if (pageUrl && keywords.length > 0) {
    return { keywordAndUrlSeed: { url: pageUrl, keywords } };
  }
  if (pageUrl) {
    return { urlSeed: { url: pageUrl } };
  }
  return { keywordSeed: { keywords } };
}

function createKeywordMetricSource(
  options: FetchGoogleAdsKeywordIdeasOptions,
  keywords: string[],
): Record<string, unknown> {
  const kind =
    options.pageUrl && keywords.length > 0
      ? 'keyword-and-url-seed'
      : options.pageUrl
        ? 'page-url'
        : options.candidateFile
          ? 'candidate-file'
          : options.seedFile
            ? 'seed-file'
            : 'keyword-seed';
  return {
    kind,
    ...(options.candidateFile ? { candidateFile: options.candidateFile } : {}),
    ...(options.seedFile ? { seedFile: options.seedFile } : {}),
    ...(options.pageUrl ? { pageUrl: options.pageUrl } : {}),
    seedKeywords: keywords,
    ...(options.clusterId ? { clusterId: options.clusterId } : {}),
    ...(options.campaignIntent ? { campaignIntent: options.campaignIntent } : {}),
  };
}

function createKeywordMetricsRunId(
  platformId: string,
  country: string,
  language: string,
  fetchedAt: string,
): string {
  return [
    platformId,
    country.toLowerCase(),
    language.toLowerCase(),
    fetchedAt.replace(/[:.]/g, '-'),
  ].join('-');
}

function readKeywordIdeas(payload: unknown): GoogleAdsKeywordIdeaResult[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const results: unknown = (payload as Record<string, unknown>).results;
  if (!Array.isArray(results)) {
    return [];
  }
  return results.filter(isKeywordIdeaResult);
}

function isKeywordIdeaResult(value: unknown): value is GoogleAdsKeywordIdeaResult {
  return value !== null && typeof value === 'object';
}

function mapKeywordIdeaResult(
  result: GoogleAdsKeywordIdeaResult,
  context: { country: string; language: string; fetchedAt: string },
) {
  const term = result.text?.trim() ?? '';
  const metrics = result.keywordIdeaMetrics ?? {};
  return {
    term,
    normalizedTerm: normalizeKeywordTerm(term),
    country: context.country,
    language: context.language,
    provider: 'google-ads' as const,
    avgMonthlySearches: parseInteger(metrics.avgMonthlySearches),
    competition: normalizeCompetition(metrics.competition),
    competitionIndex: parseInteger(metrics.competitionIndex),
    lowTopOfPageBidMicros: parseInteger(metrics.lowTopOfPageBidMicros),
    highTopOfPageBidMicros: parseInteger(metrics.highTopOfPageBidMicros),
    fetchedAt: context.fetchedAt,
  };
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

function normalizeCompetition(value: string | undefined) {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') {
    return value;
  }
  return value ? 'UNSPECIFIED' : undefined;
}

function parseInteger(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const keyword of keywords) {
    const normalized = normalizeKeywordTerm(keyword);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(keyword.trim());
  }
  return result;
}
