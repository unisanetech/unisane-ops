import { z } from 'zod';
import {
  seoPerformanceDateRangeSchema,
  seoPerformanceEvidenceSchema,
  seoPerformanceTargetMarketSchema,
} from './performance.js';

export const seoPageEvidencePresenceSchema = z.enum([
  'available',
  'not-present-in-source',
  'not-recorded',
]);

export const seoPageIndexabilitySchema = z.enum([
  'indexable',
  'noindex',
  'non-success-status',
  'unknown',
]);

export const seoPageCanonicalStateSchema = z.enum([
  'self',
  'other-internal',
  'external',
  'missing',
  'not-recorded',
]);

const unavailableSourceSchema = z.object({
  state: z.enum(['not-present-in-source', 'not-recorded']),
});

export const seoPageSearchEvidenceSchema = z.union([
  z.object({
    state: z.literal('available'),
    rowCount: z.number().int().positive(),
    queryCount: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    impressions: z.number().int().nonnegative(),
    ctr: z.number().min(0).max(1).optional(),
    averagePosition: z.number().positive().optional(),
  }),
  unavailableSourceSchema,
]);

export const seoPageAnalyticsEvidenceSchema = z.union([
  z.object({
    state: z.literal('available'),
    rowCount: z.number().int().positive(),
    sessions: z.number().int().nonnegative().optional(),
    users: z.number().int().nonnegative().optional(),
    analyticsConversions: z.number().nonnegative().optional(),
    analyticsRevenue: z.number().nonnegative().optional(),
  }),
  unavailableSourceSchema,
]);

export const seoPageCrawlEvidenceSchema = z.union([
  z.object({
    state: z.literal('available'),
    fetchedAt: z.string().datetime(),
    statusCode: z.number().int().min(100).max(599),
    fetchState: z.enum(['fresh', 'changed', 'unchanged', 'not-modified']),
    indexability: seoPageIndexabilitySchema,
    title: z.string().min(1).optional(),
    metaDescription: z.string().min(1).optional(),
    h1: z.string().min(1).optional(),
    wordCount: z.number().int().nonnegative(),
    internalLinkCount: z.number().int().nonnegative(),
    externalLinkCount: z.number().int().nonnegative(),
    canonical: z.object({
      state: seoPageCanonicalStateSchema,
      url: z.string().url().optional(),
    }),
    robotsDirectives: z.array(z.string().min(1)),
    schemaTypes: z.array(z.string().min(1)),
  }),
  z.object({
    state: z.literal('failed'),
    failures: z
      .array(
        z.object({
          code: z.string().min(1),
          message: z.string().min(1),
          statusCode: z.number().int().min(100).max(599).optional(),
        }),
      )
      .min(1),
    indexability: z.literal('unknown'),
    canonical: z.object({ state: z.literal('not-recorded') }),
  }),
  z.object({
    state: z.literal('not-present-in-source'),
    indexability: z.literal('unknown'),
    canonical: z.object({ state: z.literal('not-recorded') }),
  }),
]);

export const seoPageRenderEvidenceSchema = z.union([
  z.object({
    state: z.literal('available'),
    renderedAt: z.string().datetime(),
    finalUrl: z.string().url(),
    reasons: z.array(z.string().min(1)).min(1),
    statusCode: z.number().int().min(100).max(599).optional(),
    title: z.string().min(1).optional(),
    metaDescription: z.string().min(1).optional(),
    h1: z.string().min(1).optional(),
    wordCount: z.number().int().nonnegative(),
    internalLinkCount: z.number().int().nonnegative(),
    externalLinkCount: z.number().int().nonnegative(),
    canonical: z.object({
      state: seoPageCanonicalStateSchema,
      url: z.string().url().optional(),
    }),
    robotsDirectives: z.array(z.string().min(1)),
    schemaTypes: z.array(z.string().min(1)),
  }),
  z.object({
    state: z.literal('failed'),
    failures: z.array(z.object({ code: z.string().min(1), message: z.string().min(1) })).min(1),
  }),
  z.object({ state: z.literal('not-selected') }),
  z.object({ state: z.literal('not-recorded') }),
]);

export const seoPageContentEvidenceSchema = z.union([
  z.object({
    state: z.literal('available'),
    source: z.enum(['static-html', 'browser-render']),
    observedAt: z.string().datetime(),
    title: z.string().min(1).optional(),
    metaDescription: z.string().min(1).optional(),
    h1: z.string().min(1).optional(),
    wordCount: z.number().int().nonnegative(),
    internalLinkCount: z.number().int().nonnegative(),
    externalLinkCount: z.number().int().nonnegative(),
    canonical: z.object({
      state: seoPageCanonicalStateSchema,
      url: z.string().url().optional(),
    }),
    robotsDirectives: z.array(z.string().min(1)),
    schemaTypes: z.array(z.string().min(1)),
  }),
  z.object({ state: z.literal('unavailable') }),
]);

export const seoPageEvidenceSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  path: z.string().startsWith('/'),
  crawl: seoPageCrawlEvidenceSchema,
  render: seoPageRenderEvidenceSchema.optional(),
  content: seoPageContentEvidenceSchema.optional(),
  search: seoPageSearchEvidenceSchema,
  analytics: seoPageAnalyticsEvidenceSchema,
  evidence: z.object({
    sampleData: z.boolean(),
    stale: z.boolean(),
    freshUntil: z.string().datetime().optional(),
    limitations: z.array(z.string().min(1)),
  }),
});

const performanceSourceReferenceSchema = z.object({
  property: z.string().min(1),
  dateRange: seoPerformanceDateRangeSchema,
  evidence: seoPerformanceEvidenceSchema,
});

export const seoPageEvidenceFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  siteUrl: z.string().url(),
  targetMarkets: z.array(seoPerformanceTargetMarketSchema).min(1),
  generatedAt: z.string().datetime(),
  sources: z.object({
    crawl: z.object({
      snapshotId: z.string().min(1),
      observedAt: z.string().datetime(),
      freshUntil: z.string().datetime(),
      truncated: z.boolean(),
      failureCount: z.number().int().nonnegative(),
    }),
    render: z
      .object({
        renderId: z.string().min(1),
        crawlSnapshotId: z.string().min(1),
        observedAt: z.string().datetime(),
        freshUntil: z.string().datetime(),
        browser: z.string().min(1),
        failureCount: z.number().int().nonnegative(),
        truncated: z.boolean(),
      })
      .optional(),
    searchConsole: performanceSourceReferenceSchema.optional(),
    ga4: performanceSourceReferenceSchema.optional(),
  }),
  sampleData: z.boolean(),
  freshness: z.object({
    freshUntil: z.string().datetime(),
    staleSources: z.array(z.enum(['crawl', 'render', 'search-console', 'ga4'])),
  }),
  limitations: z.array(z.string().min(1)),
  summary: z.object({
    pageCount: z.number().int().nonnegative(),
    crawledPageCount: z.number().int().nonnegative(),
    crawlFailurePageCount: z.number().int().nonnegative(),
    performanceOnlyPageCount: z.number().int().nonnegative(),
    searchEvidencePageCount: z.number().int().nonnegative(),
    analyticsEvidencePageCount: z.number().int().nonnegative(),
  }),
  pages: z.array(seoPageEvidenceSchema),
});

export type SeoPageAnalyticsEvidence = z.infer<typeof seoPageAnalyticsEvidenceSchema>;
export type SeoPageCrawlEvidence = z.infer<typeof seoPageCrawlEvidenceSchema>;
export type SeoPageEvidence = z.infer<typeof seoPageEvidenceSchema>;
export type SeoPageEvidenceFile = z.infer<typeof seoPageEvidenceFileSchema>;
export type SeoPageContentEvidence = z.infer<typeof seoPageContentEvidenceSchema>;
export type SeoPageRenderEvidence = z.infer<typeof seoPageRenderEvidenceSchema>;
export type SeoPageSearchEvidence = z.infer<typeof seoPageSearchEvidenceSchema>;
