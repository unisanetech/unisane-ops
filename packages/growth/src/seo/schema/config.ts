import { z } from 'zod';
import { getSeoPlatformPack } from '../config/platform-packs.js';

export const seoResearchConfigSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  seoPatternPack: z.string().min(1).default('generic'),
  keywordPatternPack: z.string().min(1).default('tool'),
  defaultCountry: z.string().min(2).default('US'),
  defaultLanguage: z.string().min(2).default('en'),
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
        })
        .default({}),
      searchConsole: z
        .object({
          enabled: z.boolean().default(false),
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
    version: 1,
    platformId,
    seoPatternPack: pack.seoPatternPack,
    keywordPatternPack: pack.keywordPatternPack,
    defaultCountry: pack.defaultCountry,
    defaultLanguage: pack.defaultLanguage,
    opportunities: pack.opportunityDefaults,
    internalLinks: pack.internalLinkDefaults,
  });
}
