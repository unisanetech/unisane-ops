import { z } from 'zod';

export const siteCrawlDiscoverySourceSchema = z.enum(['seed', 'sitemap', 'internal-link']);

export const siteCrawlFetchStateSchema = z.enum(['fresh', 'changed', 'unchanged', 'not-modified']);

export const siteCrawlFailureStageSchema = z.enum(['robots', 'sitemap', 'page']);

export const siteCrawlFailureCodeSchema = z.enum([
  'cancelled',
  'fetch-failed',
  'http-status',
  'invalid-url',
  'robots-disallowed',
  'response-too-large',
  'unsupported-content-type',
]);

export const siteCrawlPageSchema = z.object({
  url: z.string().url(),
  depth: z.number().int().nonnegative(),
  discoveredBy: z.array(siteCrawlDiscoverySourceSchema).min(1),
  fetchedAt: z.string().datetime(),
  evidenceObservedAt: z.string().datetime(),
  statusCode: z.number().int().min(100).max(599),
  contentType: z.string(),
  fetchState: siteCrawlFetchStateSchema,
  etag: z.string().min(1).optional(),
  lastModified: z.string().min(1).optional(),
  contentHash: z.string().min(1),
  title: z.string().min(1).optional(),
  metaDescription: z.string().min(1).optional(),
  canonicalUrl: z.string().url().optional(),
  h1: z.string().min(1).optional(),
  headings: z.array(z.string().min(1)),
  robotsDirectives: z.array(z.string().min(1)),
  schemaTypes: z.array(z.string().min(1)),
  wordCount: z.number().int().nonnegative(),
  internalLinks: z.array(z.string().url()),
  externalLinkCount: z.number().int().nonnegative(),
});

export const siteCrawlFailureSchema = z.object({
  url: z.string().url(),
  stage: siteCrawlFailureStageSchema,
  code: siteCrawlFailureCodeSchema,
  message: z.string().min(1),
  statusCode: z.number().int().min(100).max(599).optional(),
});

export const siteCrawlSnapshotSchema = z.object({
  version: z.literal(1),
  snapshotId: z.string().min(1),
  platformId: z.string().min(1),
  site: z.object({
    requestedUrl: z.string().url(),
    origin: z.string().url(),
  }),
  source: z.object({
    kind: z.literal('local-http-crawl'),
    userAgent: z.string().min(1),
    staticHtmlOnly: z.literal(true),
  }),
  sampleData: z.literal(false),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  freshness: z.object({
    observedAt: z.string().datetime(),
    freshUntil: z.string().datetime(),
  }),
  previousSnapshotId: z.string().min(1).optional(),
  limits: z.object({
    maxPages: z.number().int().positive(),
    maxDepth: z.number().int().nonnegative(),
    maxSitemaps: z.number().int().nonnegative(),
    maxDiscoveredUrls: z.number().int().positive(),
    maxResponseBytes: z.number().int().positive(),
    timeoutMs: z.number().int().positive(),
  }),
  discovery: z.object({
    sitemapUrls: z.array(z.string().url()),
    discoveredUrlCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
  }),
  pages: z.array(siteCrawlPageSchema),
  failures: z.array(siteCrawlFailureSchema),
  summary: z.object({
    pageCount: z.number().int().nonnegative(),
    failureCount: z.number().int().nonnegative(),
    changedPageCount: z.number().int().nonnegative(),
    reusedPageCount: z.number().int().nonnegative(),
  }),
});

export type SiteCrawlDiscoverySource = z.infer<typeof siteCrawlDiscoverySourceSchema>;
export type SiteCrawlFailure = z.infer<typeof siteCrawlFailureSchema>;
export type SiteCrawlPage = z.infer<typeof siteCrawlPageSchema>;
export type SiteCrawlSnapshot = z.infer<typeof siteCrawlSnapshotSchema>;
