import { z } from 'zod';

export const siteRenderReasonSchema = z.enum([
  'explicit',
  'missing-title',
  'missing-h1',
  'thin-static-content',
]);

export const siteRenderFailureCodeSchema = z.enum([
  'browser-unavailable',
  'cancelled',
  'navigation-failed',
  'offsite-redirect',
  'render-timeout',
]);

export const siteRenderPageSchema = z.object({
  url: z.string().url(),
  finalUrl: z.string().url(),
  reasons: z.array(siteRenderReasonSchema).min(1),
  renderedAt: z.string().datetime(),
  statusCode: z.number().int().min(100).max(599).optional(),
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

export const siteRenderFailureSchema = z.object({
  url: z.string().url(),
  reasons: z.array(siteRenderReasonSchema).min(1),
  code: siteRenderFailureCodeSchema,
  message: z.string().min(1),
});

export const siteRenderSnapshotSchema = z.object({
  version: z.literal(1),
  renderId: z.string().min(1),
  platformId: z.string().min(1),
  site: z.object({ origin: z.string().url() }),
  crawlSnapshotId: z.string().min(1),
  source: z.object({
    kind: z.literal('local-browser-render'),
    driver: z.literal('playwright'),
    browser: z.string().min(1),
    javascript: z.literal(true),
  }),
  sampleData: z.literal(false),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  freshness: z.object({
    observedAt: z.string().datetime(),
    freshUntil: z.string().datetime(),
  }),
  limits: z.object({
    maxPages: z.number().int().positive(),
    timeoutMs: z.number().int().positive(),
    settleMs: z.number().int().nonnegative(),
    minStaticWordCount: z.number().int().nonnegative(),
  }),
  pages: z.array(siteRenderPageSchema),
  failures: z.array(siteRenderFailureSchema),
  summary: z.object({
    selectedPageCount: z.number().int().nonnegative(),
    renderedPageCount: z.number().int().nonnegative(),
    failureCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
  }),
});

export type SiteRenderFailure = z.infer<typeof siteRenderFailureSchema>;
export type SiteRenderFailureCode = z.infer<typeof siteRenderFailureCodeSchema>;
export type SiteRenderPage = z.infer<typeof siteRenderPageSchema>;
export type SiteRenderReason = z.infer<typeof siteRenderReasonSchema>;
export type SiteRenderSnapshot = z.infer<typeof siteRenderSnapshotSchema>;
