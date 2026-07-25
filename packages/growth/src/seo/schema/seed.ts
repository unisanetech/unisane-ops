import { z } from 'zod';

export const keywordSeedSourceSchema = z.enum([
  'manual',
  'competitor',
  'route',
  'catalog',
  'sitemap',
  'import',
]);

export const keywordSeedSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  source: keywordSeedSourceSchema,
  platformId: z.string().min(1),
  intent: z.enum(['seo', 'ads', 'both']).optional(),
  topic: z.string().optional(),
  role: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  notes: z.string().optional(),
});

export const keywordSeedFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  seeds: z.array(keywordSeedSchema),
});

export type KeywordSeed = z.infer<typeof keywordSeedSchema>;
export type KeywordSeedFile = z.infer<typeof keywordSeedFileSchema>;

export function createEmptyKeywordSeedFile(platformId: string): KeywordSeedFile {
  return keywordSeedFileSchema.parse({
    version: 1,
    platformId,
    seeds: [],
  });
}
