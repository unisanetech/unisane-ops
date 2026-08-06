import { z } from 'zod';

export const serpResearchSourceSchema = z.enum([
  'manual-serp-model',
  'web-search',
  'provider-export',
]);

export const serpOrganicResultSchema = z.object({
  position: z.number().int().positive().optional(),
  url: z.string().url().optional(),
  domain: z.string().min(1),
  pageType: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
});

export const serpSnapshotSchema = z.object({
  id: z.string().min(1).optional(),
  keyword: z.string().min(1),
  country: z.string().min(2),
  language: z.string().min(2),
  capturedAt: z.string().min(1),
  routePath: z.string().startsWith('/').optional(),
  intent: z.string().min(1).optional(),
  organicResults: z.array(serpOrganicResultSchema).default([]),
  peopleAlsoAsk: z.array(z.string().min(1)).default([]),
  opportunities: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string().min(1)).default([]),
});

export const serpResearchFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  source: serpResearchSourceSchema,
  capturedAt: z.string().min(1).optional(),
  sampleData: z.boolean().default(false),
  limitations: z.array(z.string().min(1)).default([]),
  snapshots: z.array(serpSnapshotSchema),
});

export type SerpResearchFile = z.infer<typeof serpResearchFileSchema>;
export type SerpSnapshot = z.infer<typeof serpSnapshotSchema>;
