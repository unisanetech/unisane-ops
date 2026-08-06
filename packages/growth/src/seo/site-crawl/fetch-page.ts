import type {
  SiteCrawlDiscoverySource,
  SiteCrawlFailure,
  SiteCrawlPage,
} from '../schema/site-crawl.js';
import {
  rethrowSiteCrawlCancellation,
  siteCrawlErrorMessage,
  siteCrawlFailureCode,
} from './errors.js';
import { extractSitePageEvidence } from './extract-page.js';
import {
  fetchSiteCrawlResponse,
  readSiteCrawlResponseText,
  type SiteCrawlFetch,
} from './request.js';

export async function fetchSiteCrawlPageEvidence(options: {
  url: string;
  depth: number;
  discoveredBy: SiteCrawlDiscoverySource[];
  previousPage?: SiteCrawlPage;
  siteOrigin: string;
  fetchImpl: SiteCrawlFetch;
  signal?: AbortSignal;
  timeoutMs: number;
  maxResponseBytes: number;
  userAgent: string;
  now: () => Date;
  failures: SiteCrawlFailure[];
}): Promise<SiteCrawlPage | undefined> {
  const headers = buildPageHeaders(options.previousPage, options.userAgent);
  try {
    const response = await fetchSiteCrawlResponse(options.url, {
      fetchImpl: options.fetchImpl,
      signal: options.signal,
      timeoutMs: options.timeoutMs,
      headers,
    });
    const fetchedAt = options.now().toISOString();
    if (response.status === 304 && options.previousPage) {
      return {
        ...options.previousPage,
        depth: options.depth,
        discoveredBy: options.discoveredBy,
        fetchedAt,
        fetchState: 'not-modified',
      };
    }
    if (!response.ok) {
      options.failures.push({
        url: options.url,
        stage: 'page',
        code: 'http-status',
        message: `Page returned HTTP ${response.status}.`,
        statusCode: response.status,
      });
      return undefined;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType && !/html|xhtml/i.test(contentType)) {
      options.failures.push({
        url: options.url,
        stage: 'page',
        code: 'unsupported-content-type',
        message: `Expected HTML but received ${contentType}.`,
        statusCode: response.status,
      });
      return undefined;
    }
    const evidence = extractSitePageEvidence({
      html: await readSiteCrawlResponseText(response, options.maxResponseBytes),
      url: response.url || options.url,
      siteOrigin: options.siteOrigin,
    });
    const fetchState = !options.previousPage
      ? 'fresh'
      : options.previousPage.contentHash === evidence.contentHash
        ? 'unchanged'
        : 'changed';
    const etag = response.headers.get('etag')?.trim();
    const lastModified = response.headers.get('last-modified')?.trim();
    return {
      url: options.url,
      depth: options.depth,
      discoveredBy: options.discoveredBy,
      fetchedAt,
      evidenceObservedAt: fetchedAt,
      statusCode: response.status,
      contentType,
      fetchState,
      ...(etag ? { etag } : {}),
      ...(lastModified ? { lastModified } : {}),
      ...evidence,
      robotsDirectives: mergeRobotsDirectives(
        evidence.robotsDirectives,
        response.headers.get('x-robots-tag'),
      ),
    };
  } catch (error: unknown) {
    rethrowSiteCrawlCancellation(error, options.signal);
    options.failures.push({
      url: options.url,
      stage: 'page',
      code: siteCrawlFailureCode(error),
      message: siteCrawlErrorMessage(error),
    });
    return undefined;
  }
}

function buildPageHeaders(
  previousPage: SiteCrawlPage | undefined,
  userAgent: string,
): Record<string, string> {
  return {
    accept: 'text/html,application/xhtml+xml',
    'user-agent': userAgent,
    ...(previousPage?.etag ? { 'if-none-match': previousPage.etag } : {}),
    ...(previousPage?.lastModified ? { 'if-modified-since': previousPage.lastModified } : {}),
  };
}

function mergeRobotsDirectives(values: string[], headerValue: string | null): string[] {
  const headerDirectives = (headerValue ?? '')
    .split(',')
    .map((directive) => directive.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...values, ...headerDirectives])].sort();
}
