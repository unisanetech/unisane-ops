import { z } from 'zod';

export const seoPerformanceSourceSchema = z.enum(['google-search-console', 'ga4']);

export const seoPerformanceAcquisitionSchema = z.enum(['api', 'csv-import']);

export const seoPerformanceDateRangeSchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: 'Performance evidence start date must not be after its end date.',
  });

export const seoPerformanceTargetMarketSchema = z.object({
  country: z.string().trim().min(2),
  language: z.string().trim().min(2),
});

export const seoPerformanceEvidenceSchema = z
  .object({
    acquisition: seoPerformanceAcquisitionSchema,
    sampleData: z.boolean(),
    observedAt: z.string().datetime(),
    freshUntil: z.string().datetime(),
    limitations: z.array(z.string().trim().min(1)),
  })
  .refine((value) => value.observedAt < value.freshUntil, {
    message: 'Performance evidence must expire after it was observed.',
  });

export const seoPerformanceRecordSchema = z.object({
  id: z.string().min(1),
  platformId: z.string().min(1),
  source: seoPerformanceSourceSchema,
  pagePath: z.string().min(1),
  query: z.string().min(1).optional(),
  clicks: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  ctr: z.number().min(0).max(1).optional(),
  position: z.number().positive().optional(),
  sessions: z.number().int().nonnegative().optional(),
  users: z.number().int().nonnegative().optional(),
  analyticsConversions: z.number().nonnegative().optional(),
  analyticsRevenue: z.number().nonnegative().optional(),
  sourceFile: z.string().min(1).optional(),
  sourceRow: z.number().int().positive().optional(),
});

export const seoPerformanceFileSchema = z
  .object({
    version: z.literal(2),
    platformId: z.string().min(1),
    source: seoPerformanceSourceSchema,
    siteUrl: z.string().url(),
    targetMarkets: z.array(seoPerformanceTargetMarketSchema).min(1),
    property: z.string().min(1),
    dateRange: seoPerformanceDateRangeSchema,
    evidence: seoPerformanceEvidenceSchema,
    records: z.array(seoPerformanceRecordSchema),
  })
  .superRefine((file, context) => {
    file.records.forEach((record, index) => {
      if (record.platformId !== file.platformId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'platformId'],
          message: 'Performance record platform must match its file.',
        });
      }
      if (record.source !== file.source) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'source'],
          message: 'Performance record source must match its file.',
        });
      }
    });
  });

export type SeoPerformanceFile = z.infer<typeof seoPerformanceFileSchema>;
export type SeoPerformanceRecord = z.infer<typeof seoPerformanceRecordSchema>;
export type SeoPerformanceSource = z.infer<typeof seoPerformanceSourceSchema>;
export type SeoPerformanceAcquisition = z.infer<typeof seoPerformanceAcquisitionSchema>;
export type SeoPerformanceDateRange = z.infer<typeof seoPerformanceDateRangeSchema>;
export type SeoPerformanceEvidence = z.infer<typeof seoPerformanceEvidenceSchema>;
export type SeoPerformanceTargetMarket = z.infer<typeof seoPerformanceTargetMarketSchema>;

export function normalizeSearchConsoleProperty(value: string): string {
  const property = value.trim();
  if (property.toLowerCase().startsWith('sc-domain:')) {
    const domain = property.slice('sc-domain:'.length).trim().toLowerCase();
    if (!domain || domain.includes('/') || domain.includes(':')) {
      throw new Error('Invalid Search Console domain property.');
    }
    return `sc-domain:${domain}`;
  }
  const url = new URL(property);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Search Console URL-prefix properties must use HTTP or HTTPS.');
  }
  url.hash = '';
  url.search = '';
  return url.toString();
}

export function searchConsolePropertyMatchesSite(property: string, siteUrl: string): boolean {
  const normalizedProperty = normalizeSearchConsoleProperty(property);
  const site = new URL(siteUrl);
  if (normalizedProperty.startsWith('sc-domain:')) {
    const domain = normalizedProperty.slice('sc-domain:'.length);
    return site.hostname === domain || site.hostname.endsWith(`.${domain}`);
  }
  const prefix = new URL(normalizedProperty);
  return site.origin === prefix.origin && site.pathname.startsWith(prefix.pathname);
}

export function normalizeGa4Property(value: string): string {
  const property = value.trim().replace(/^properties\//, '');
  if (!/^\d+$/.test(property)) {
    throw new Error('GA4 property must be a numeric property id or properties/<id>.');
  }
  return `properties/${property}`;
}

export function createSeoPerformanceEvidence(options: {
  acquisition: SeoPerformanceAcquisition;
  sampleData: boolean;
  observedAt?: string;
  freshnessHours?: number;
  limitations?: string[];
}): SeoPerformanceEvidence {
  const observedAt = new Date(options.observedAt ?? new Date().toISOString());
  const freshnessHours = options.freshnessHours ?? 24;
  if (!Number.isInteger(freshnessHours) || freshnessHours < 1) {
    throw new Error('Performance evidence freshness must be a positive whole number of hours.');
  }
  return seoPerformanceEvidenceSchema.parse({
    acquisition: options.acquisition,
    sampleData: options.sampleData,
    observedAt: observedAt.toISOString(),
    freshUntil: new Date(observedAt.getTime() + freshnessHours * 3_600_000).toISOString(),
    limitations: [...new Set(options.limitations ?? [])],
  });
}

export function assertCompatibleSeoPerformanceFiles(files: SeoPerformanceFile[]): void {
  const [first, ...rest] = files;
  if (!first) {
    return;
  }
  for (const file of rest) {
    if (file.platformId !== first.platformId || file.siteUrl !== first.siteUrl) {
      throw new Error('Performance evidence files must belong to the same platform and site.');
    }
    if (
      file.dateRange.startDate !== first.dateRange.startDate ||
      file.dateRange.endDate !== first.dateRange.endDate
    ) {
      throw new Error('Performance evidence files must use the same date range.');
    }
    if (JSON.stringify(file.targetMarkets) !== JSON.stringify(first.targetMarkets)) {
      throw new Error('Performance evidence files must use the same target-market context.');
    }
  }
}
