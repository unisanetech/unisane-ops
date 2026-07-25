import { createHash } from 'node:crypto';
import {
  competitorResearchFileSchema,
  type CompetitorPage,
  type CompetitorResearchFile,
} from '../schema/competitor.js';
import { extractCompetitorHtmlMetadata } from './extract-html.js';

export type CompetitorUrlInput = {
  url: string;
  keyword?: string;
  position?: number;
  pageType?: string;
  notes?: string;
};

export type FetchLike = typeof fetch;

export type FetchCompetitorUrlsOptions = {
  platformId: string;
  urls: CompetitorUrlInput[];
  market?: string;
  sourceFile?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  userAgent?: string;
  maxPages?: number;
};

export type FetchCompetitorUrlsResult = {
  competitorFile: CompetitorResearchFile;
  failedUrls: Array<{ url: string; message: string }>;
};

export async function fetchCompetitorUrls(
  options: FetchCompetitorUrlsOptions,
): Promise<FetchCompetitorUrlsResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxPages = options.maxPages ?? 25;
  const requestedUrls = options.urls.slice(0, maxPages);
  const pages: CompetitorPage[] = [];
  const failedUrls: Array<{ url: string; message: string }> = [];

  for (const [index, input] of requestedUrls.entries()) {
    try {
      const html = await fetchHtml({
        url: input.url,
        fetchImpl,
        timeoutMs: options.timeoutMs ?? 10_000,
        userAgent: options.userAgent,
      });
      const metadata = extractCompetitorHtmlMetadata({ html, url: input.url });
      pages.push(
        createCompetitorPage({
          input,
          metadata,
          index,
          platformId: options.platformId,
          sourceFile: options.sourceFile,
        }),
      );
    } catch (error: unknown) {
      failedUrls.push({
        url: input.url,
        message: error instanceof Error ? error.message : 'Unknown fetch error',
      });
    }
  }

  return {
    competitorFile: competitorResearchFileSchema.parse({
      version: 1,
      platformId: options.platformId,
      market: cleanOptional(options.market),
      source: 'url-fetch',
      pages,
    }),
    failedUrls,
  };
}

async function fetchHtml(options: {
  url: string;
  fetchImpl: FetchLike;
  timeoutMs: number;
  userAgent?: string;
}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await options.fetchImpl(options.url, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        ...(options.userAgent ? { 'user-agent': options.userAgent } : {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType && !contentType.toLowerCase().includes('html')) {
      throw new Error(`Expected HTML response, received ${contentType}`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function createCompetitorPage(options: {
  input: CompetitorUrlInput;
  metadata: ReturnType<typeof extractCompetitorHtmlMetadata>;
  index: number;
  platformId: string;
  sourceFile?: string;
}): CompetitorPage {
  const domain = getDomain(options.input.url);
  const page: CompetitorPage = {
    id: `competitor-${stableId(options.input.url, options.index)}`,
    platformId: options.platformId,
    source: 'url-fetch',
    sourceFile: cleanOptional(options.sourceFile),
    keyword: cleanOptional(options.input.keyword),
    position: options.input.position,
    url: options.input.url,
    domain,
    title: options.metadata.title,
    h1: options.metadata.h1,
    metaDescription: options.metadata.metaDescription,
    canonicalUrl: options.metadata.canonicalUrl,
    pageType: cleanOptional(options.input.pageType),
    categoryPath: options.metadata.categoryPath,
    headings: options.metadata.headings,
    contentPatterns: options.metadata.contentPatterns,
    keywordSignals: options.metadata.keywordSignals,
    onPageSignals: options.metadata.onPageSignals,
    notes: cleanOptional(options.input.notes),
  };

  return page;
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
