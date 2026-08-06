import { z } from 'zod';
import {
  marketingProviderReportTypeSchema,
  marketingReportMetricsSchema,
  marketingReportProviderSchema,
  marketingReportSourceSchema,
  marketingReportWindowSchema,
} from '../schema/report.js';

export const marketingHistoryMetricSchema = z.enum([
  'impressions',
  'clicks',
  'cost',
  'conversions',
  'conversionValue',
  'revenue',
  'margin',
  'sessions',
  'users',
  'keyEvents',
  'purchases',
]);

export const marketingHistoryRetentionPolicySchema = z.object({
  rawArtifactDays: z.number().int().positive(),
  normalizedDailyMonths: z.number().int().positive(),
  monthlyRollupMonths: z.number().int().positive(),
  researchSnapshotMonths: z.number().int().positive(),
  preserveMilestones: z.boolean(),
  preserveReceipts: z.boolean(),
});

export const DEFAULT_MARKETING_HISTORY_RETENTION_POLICY =
  marketingHistoryRetentionPolicySchema.parse({
    rawArtifactDays: 90,
    normalizedDailyMonths: 24,
    monthlyRollupMonths: 60,
    researchSnapshotMonths: 13,
    preserveMilestones: true,
    preserveReceipts: true,
  });

export const marketingHistoryObservationSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  seriesKey: z.string().min(1),
  supersedesObservationId: z.string().min(1).optional(),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  provider: marketingReportProviderSchema,
  reportType: marketingProviderReportTypeSchema.optional(),
  accountId: z.string().min(1).optional(),
  source: marketingReportSourceSchema,
  sampleData: z.boolean(),
  pulledAt: z.string().datetime(),
  window: marketingReportWindowSchema,
  partial: z.boolean(),
  recordCount: z.number().int().nonnegative(),
  metrics: marketingReportMetricsSchema,
  currencyCodes: z.array(z.string().length(3)),
  artifactPath: z.string().min(1),
  artifactDigest: z.string().regex(/^[a-f0-9]{64}$/),
});

export const marketingHistoryCatalogSchema = z.object({
  kind: z.literal('unisane.growth.marketing-history-catalog'),
  version: z.literal(1),
  updatedAt: z.string().datetime(),
  retention: marketingHistoryRetentionPolicySchema,
  observations: z.array(marketingHistoryObservationSchema),
});

export type MarketingHistoryMetric = z.infer<typeof marketingHistoryMetricSchema>;
export type MarketingHistoryRetentionPolicy = z.infer<typeof marketingHistoryRetentionPolicySchema>;
export type MarketingHistoryObservation = z.infer<typeof marketingHistoryObservationSchema>;
export type MarketingHistoryCatalog = z.infer<typeof marketingHistoryCatalogSchema>;

export type MarketingHistoryCoverage = {
  status: 'none' | 'complete' | 'gapped' | 'partial';
  requestedStartDate?: string;
  requestedEndDate?: string;
  earliestStartDate?: string;
  latestEndDate?: string;
  expectedDayCount: number;
  coveredDayCount: number;
  gapRanges: Array<{ startDate: string; endDate: string }>;
  overlappingWindowCount: number;
  partialObservationCount: number;
};

export type MarketingHistoryPoint = {
  observationId: string;
  label: string;
  startDate: string;
  endDate: string;
  pulledAt: string;
  value: number;
  currencyCode?: string;
  partial: boolean;
  source: z.infer<typeof marketingReportSourceSchema>;
};

export type MarketingHistoryQuery = {
  provider: z.infer<typeof marketingReportProviderSchema>;
  reportType?: z.infer<typeof marketingProviderReportTypeSchema>;
  accountId?: string;
  metric: MarketingHistoryMetric;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type MarketingHistoryQueryResult = {
  query: MarketingHistoryQuery;
  points: MarketingHistoryPoint[];
  coverage: MarketingHistoryCoverage;
  comparable: boolean;
  comparisonLimitation?: string;
  truncated: boolean;
};

export type MarketingHistoryReportWindow = {
  startDate: string;
  endDate: string;
};

export type MarketingHistoryReportWindowResult =
  | {
      status: 'available';
      artifact: import('../schema/report.js').MarketingProviderReportArtifact;
      artifactPaths: string[];
      coverageDays: number;
      expectedDays: number;
    }
  | {
      status: 'partial';
      artifact: import('../schema/report.js').MarketingProviderReportArtifact;
      artifactPaths: string[];
      coverageDays: number;
      expectedDays: number;
      reason: string;
    }
  | {
      status: 'unavailable';
      reason: string;
    };

export type MarketingHistoryPeriodComparison =
  | {
      status: 'available';
      current: MarketingHistoryPoint;
      baseline: MarketingHistoryPoint;
      absoluteChange: number;
      percentageChange?: number;
    }
  | {
      status: 'unavailable';
      reason: string;
      current?: MarketingHistoryPoint;
    };
