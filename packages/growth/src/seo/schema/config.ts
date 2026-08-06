import { z } from 'zod';
import { getSeoPlatformPack } from '../config/platform-packs.js';

export const seoSiteUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
      );
    } catch {
      return false;
    }
  }, 'Expected an HTTP or HTTPS site URL without credentials.');

export const seoResearchConfigSchema = z.object({
  version: z.literal(2),
  platformId: z.string().min(1),
  seoPatternPack: z.string().min(1).default('generic'),
  keywordPatternPack: z.string().min(1).default('tool'),
  markets: z
    .array(
      z.object({
        country: z.string().trim().min(2),
        language: z.string().trim().min(2),
      }),
    )
    .min(1),
  site: z
    .object({
      url: seoSiteUrlSchema,
      ownershipConfirmedAt: z.string().datetime(),
      crawl: z
        .object({
          maxPages: z.number().int().positive().default(100),
          maxDepth: z.number().int().nonnegative().default(2),
          maxSitemaps: z.number().int().nonnegative().default(10),
          maxDiscoveredUrls: z.number().int().positive().default(1_000),
          maxResponseBytes: z.number().int().positive().default(2_000_000),
          timeoutMs: z.number().int().positive().default(10_000),
          freshnessHours: z.number().int().positive().default(24),
          discoverSitemaps: z.boolean().default(true),
        })
        .default({}),
    })
    .optional(),
  sources: z
    .object({
      routes: z.boolean().default(true),
      sitemap: z.boolean().default(true),
      catalogs: z.boolean().default(true),
      competitors: z.boolean().default(true),
      manualSeeds: z.boolean().default(true),
    })
    .default({}),
  providers: z
    .object({
      googleAds: z
        .object({
          enabled: z.boolean().default(false),
        })
        .default({}),
      ga4: z
        .object({
          enabled: z.boolean().default(false),
          property: z.string().trim().min(1).optional(),
        })
        .default({}),
      searchConsole: z
        .object({
          enabled: z.boolean().default(false),
          property: z.string().trim().min(1).optional(),
        })
        .default({}),
      trends: z
        .object({
          enabled: z.boolean().default(false),
          mode: z.enum(['csv-import', 'api-alpha']).default('csv-import'),
        })
        .default({}),
      csvImport: z
        .object({
          enabled: z.boolean().default(true),
        })
        .default({}),
    })
    .default({}),
  opportunities: z
    .object({
      basePath: z.string().min(1).default('seo-pages'),
      ctaLabel: z.string().min(1).default('Get started'),
      ctaTarget: z.string().min(1).default('/'),
    })
    .default({}),
  internalLinks: z
    .object({
      hubLabel: z.string().min(1).optional(),
      maxRelated: z.number().int().nonnegative().default(3),
      includeConversionLinks: z.boolean().default(false),
    })
    .default({}),
  scoring: z
    .object({
      productFitWeight: z.number().min(0).max(1).default(0.35),
      volumeWeight: z.number().min(0).max(1).default(0.25),
      conversionFitWeight: z.number().min(0).max(1).default(0.2),
      contentFeasibilityWeight: z.number().min(0).max(1).default(0.2),
    })
    .default({}),
});

export type SeoResearchConfig = z.infer<typeof seoResearchConfigSchema>;

export function createDefaultSeoResearchConfig(platformId: string): SeoResearchConfig {
  const pack = getSeoPlatformPack(platformId);
  return seoResearchConfigSchema.parse({
    version: 2,
    platformId,
    seoPatternPack: pack.seoPatternPack,
    keywordPatternPack: pack.keywordPatternPack,
    markets: [{ country: pack.defaultCountry, language: pack.defaultLanguage }],
    opportunities: pack.opportunityDefaults,
    internalLinks: pack.internalLinkDefaults,
  });
}
