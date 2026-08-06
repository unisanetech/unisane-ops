import type { SiteCrawlFailure } from '../schema/site-crawl.js';
import {
  rethrowSiteCrawlCancellation,
  siteCrawlErrorMessage,
  siteCrawlFailureCode,
  throwIfSiteCrawlCancelled,
} from './errors.js';
import {
  fetchSiteCrawlResponse,
  readSiteCrawlResponseText,
  type SiteCrawlFetch,
} from './request.js';
import { parseRobotsText, type RobotsPolicy } from './robots.js';
import { parseSitemapXml } from './sitemap.js';
import { normalizeSameOriginSiteCrawlUrl } from './url-policy.js';

export async function loadSiteCrawlRobotsPolicy(options: {
  origin: string;
  fetchImpl: SiteCrawlFetch;
  signal?: AbortSignal;
  timeoutMs: number;
  maxResponseBytes: number;
  userAgent: string;
  failures: SiteCrawlFailure[];
}): Promise<RobotsPolicy> {
  const url = new URL('/robots.txt', options.origin).href;
  try {
    const response = await fetchSiteCrawlResponse(url, {
      fetchImpl: options.fetchImpl,
      signal: options.signal,
      timeoutMs: options.timeoutMs,
      headers: { accept: 'text/plain', 'user-agent': options.userAgent },
    });
    if (response.status === 404) {
      return { groups: [], sitemapUrls: [] };
    }
    if (!response.ok) {
      options.failures.push({
        url,
        stage: 'robots',
        code: 'http-status',
        message: `robots.txt returned HTTP ${response.status}; crawling is denied conservatively.`,
        statusCode: response.status,
      });
      return denyAllRobotsPolicy();
    }
    return parseRobotsText(await readSiteCrawlResponseText(response, options.maxResponseBytes));
  } catch (error: unknown) {
    rethrowSiteCrawlCancellation(error, options.signal);
    options.failures.push({
      url,
      stage: 'robots',
      code: siteCrawlFailureCode(error),
      message: siteCrawlErrorMessage(error),
    });
    return denyAllRobotsPolicy();
  }
}

export async function discoverSiteCrawlSitemapUrls(options: {
  origin: string;
  initialSitemaps: string[];
  fetchImpl: SiteCrawlFetch;
  signal?: AbortSignal;
  timeoutMs: number;
  userAgent: string;
  maxSitemaps: number;
  maxUrls: number;
  maxResponseBytes: number;
  failures: SiteCrawlFailure[];
}): Promise<{ pageUrls: string[]; fetchedSitemaps: string[] }> {
  const pending = options.initialSitemaps
    .map((url) => normalizeSameOriginSiteCrawlUrl(url, options.origin))
    .filter(isDefined)
    .sort();
  const seenSitemaps = new Set<string>();
  const pageUrls = new Set<string>();

  while (
    pending.length &&
    seenSitemaps.size < options.maxSitemaps &&
    pageUrls.size < options.maxUrls
  ) {
    throwIfSiteCrawlCancelled(options.signal);
    const sitemapUrl = pending.shift();
    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) {
      continue;
    }
    seenSitemaps.add(sitemapUrl);
    await readSitemap({ ...options, sitemapUrl, pending, seenSitemaps, pageUrls });
  }

  return {
    pageUrls: [...pageUrls].sort(),
    fetchedSitemaps: [...seenSitemaps].sort(),
  };
}

async function readSitemap(
  options: Parameters<typeof discoverSiteCrawlSitemapUrls>[0] & {
    sitemapUrl: string;
    pending: string[];
    seenSitemaps: Set<string>;
    pageUrls: Set<string>;
  },
): Promise<void> {
  try {
    const response = await fetchSiteCrawlResponse(options.sitemapUrl, {
      fetchImpl: options.fetchImpl,
      signal: options.signal,
      timeoutMs: options.timeoutMs,
      headers: { accept: 'application/xml,text/xml', 'user-agent': options.userAgent },
    });
    if (!response.ok) {
      if (response.status !== 404) {
        options.failures.push({
          url: options.sitemapUrl,
          stage: 'sitemap',
          code: 'http-status',
          message: `Sitemap returned HTTP ${response.status}.`,
          statusCode: response.status,
        });
      }
      return;
    }
    const parsed = parseSitemapXml(
      await readSiteCrawlResponseText(response, options.maxResponseBytes),
    );
    for (const candidate of parsed.urls) {
      const normalized = normalizeSameOriginSiteCrawlUrl(candidate, options.origin);
      if (!normalized) {
        continue;
      }
      if (parsed.kind === 'index') {
        if (!options.seenSitemaps.has(normalized) && !options.pending.includes(normalized)) {
          options.pending.push(normalized);
          options.pending.sort();
        }
      } else if (options.pageUrls.size < options.maxUrls) {
        options.pageUrls.add(normalized);
      }
    }
  } catch (error: unknown) {
    rethrowSiteCrawlCancellation(error, options.signal);
    options.failures.push({
      url: options.sitemapUrl,
      stage: 'sitemap',
      code: siteCrawlFailureCode(error),
      message: siteCrawlErrorMessage(error),
    });
  }
}

function denyAllRobotsPolicy(): RobotsPolicy {
  return {
    groups: [{ userAgents: ['*'], rules: [{ directive: 'disallow', path: '/' }] }],
    sitemapUrls: [],
  };
}

function isDefined(value: string | undefined): value is string {
  return value !== undefined;
}
