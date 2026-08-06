import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  seoImplementationPacketSchema,
  type SeoImplementationPacket,
} from './seo-opportunity-preparation.js';
import {
  rankedSeoOpportunitySchema,
  seoOpportunityEvidenceSchema,
  type RankedSeoOpportunity,
  type SeoOpportunityEvidence,
} from './seo-opportunity-research.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const conciseTextSchema = z.string().trim().min(1).max(280);
const metricNameSchema = z.enum([
  'search-clicks',
  'search-impressions',
  'search-ctr',
  'search-average-position',
]);
const searchMetricValuesSchema = z
  .object({
    clicks: z.number().int().nonnegative().optional(),
    impressions: z.number().int().nonnegative().optional(),
    ctr: z.number().min(0).max(1).optional(),
    averagePosition: z.number().positive().optional(),
  })
  .strict();

export const seoPublicationRecordSchema = z
  .object({
    kind: z.literal('unisane.growth.seo-publication-record'),
    version: z.literal(1),
    publicationId: stableIdSchema,
    packet: z
      .object({
        packetId: stableIdSchema,
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    opportunity: z
      .object({
        id: stableIdSchema,
        routePath: z.string().startsWith('/'),
        primaryKeyword: z.string().min(1),
        market: z.string().min(1).optional(),
      })
      .strict(),
    publishedUrl: z.string().url(),
    publishedAt: z.string().datetime({ offset: true }),
    recordedAt: z.string().datetime({ offset: true }),
    review: z
      .object({
        confirmation: z.literal('human-reviewed'),
        recordedBy: z.string().trim().min(1).max(160),
      })
      .strict(),
    measurementPlan: seoImplementationPacketSchema.shape.measurementPlan,
    verification: z
      .object({
        notBeforeAt: z.string().datetime({ offset: true }),
        expiresAt: z.string().datetime({ offset: true }),
        status: z.literal('pending'),
      })
      .strict(),
    effect: z.literal('external-publication-record-only'),
    prohibitedEffects: seoImplementationPacketSchema.shape.delivery.shape.prohibitedEffects,
  })
  .strict();

export type SeoPublicationRecord = z.infer<typeof seoPublicationRecordSchema>;

const metricResultSchema = z
  .object({
    metric: metricNameSchema,
    baseline: z.number().nonnegative(),
    current: z.number().nonnegative(),
    delta: z.number(),
    direction: z.enum(['improved', 'declined', 'no-change']),
  })
  .strict();

export const seoPublicationVerificationSchema = z
  .object({
    kind: z.literal('unisane.growth.seo-publication-verification'),
    version: z.literal(1),
    verificationId: stableIdSchema,
    publicationId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    opportunityId: stableIdSchema,
    observedAt: z.string().datetime({ offset: true }),
    windowState: z.enum(['waiting', 'eligible', 'late']),
    outcome: z.enum([
      'waiting',
      'improved',
      'declined',
      'mixed',
      'no-change',
      'baseline-established',
      'not-measurable',
    ]),
    currentEvidenceIds: z.array(stableIdSchema).max(5),
    metrics: z.array(metricResultSchema).max(4),
    establishedBaseline: z
      .object({
        observedAt: z.string().datetime({ offset: true }),
        values: searchMetricValuesSchema,
      })
      .optional(),
    summary: conciseTextSchema,
    limitations: z.array(conciseTextSchema).min(1).max(12),
    causalClaim: z.literal('not-established'),
    nextStep: conciseTextSchema,
  })
  .strict();

export type SeoPublicationVerification = z.infer<typeof seoPublicationVerificationSchema>;

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'seo'
  );
}

function addDays(value: string, days: number): string {
  return new Date(new Date(value).getTime() + days * 86_400_000).toISOString();
}

function normalizedPath(value: string): string {
  const normalized = value.replace(/\/+$/, '');
  return normalized || '/';
}

export function digestSeoImplementationPacket(packet: SeoImplementationPacket): string {
  const value = seoImplementationPacketSchema.parse(packet);
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function recordSeoPublication(input: {
  packet: SeoImplementationPacket;
  publishedUrl: string;
  publishedAt: string;
  recordedAt: string;
  recordedBy: string;
  confirmedReviewed: boolean;
  expectedProjectId?: string;
  expectedEnvironmentId?: string;
}): SeoPublicationRecord {
  const packet = seoImplementationPacketSchema.parse(input.packet);
  if (!input.confirmedReviewed) {
    throw new Error('Explicit human review confirmation is required to record publication.');
  }
  if (input.expectedProjectId && packet.projectId !== input.expectedProjectId) {
    throw new Error('The implementation packet does not match the selected project.');
  }
  if (input.expectedEnvironmentId && packet.environmentId !== input.expectedEnvironmentId) {
    throw new Error('The implementation packet does not match the selected environment.');
  }
  const url = new URL(input.publishedUrl);
  if (
    url.search ||
    url.hash ||
    normalizedPath(url.pathname) !== normalizedPath(packet.pageSpecification.routePath)
  ) {
    throw new Error(
      'The published URL must identify the exact approved route without a query or fragment.',
    );
  }
  const publishedAt = new Date(input.publishedAt);
  const recordedAt = new Date(input.recordedAt);
  if (!Number.isFinite(publishedAt.getTime()) || !Number.isFinite(recordedAt.getTime())) {
    throw new Error('Publication and recording timestamps must be valid.');
  }
  if (publishedAt.getTime() > recordedAt.getTime()) {
    throw new Error('Publication cannot be recorded before it occurred.');
  }
  const window = packet.measurementPlan.verificationWindow;
  return seoPublicationRecordSchema.parse({
    kind: 'unisane.growth.seo-publication-record',
    version: 1,
    publicationId: stableId(
      `seo.publication.${packet.selection.opportunityId}.${publishedAt.toISOString()}`,
    ),
    packet: { packetId: packet.packetId, sha256: digestSeoImplementationPacket(packet) },
    projectId: packet.projectId,
    environmentId: packet.environmentId,
    opportunity: {
      id: packet.selection.opportunityId,
      routePath: packet.pageSpecification.routePath,
      primaryKeyword: packet.pageSpecification.primaryKeyword,
      ...(packet.opportunity.market ? { market: packet.opportunity.market } : {}),
    },
    publishedUrl: url.toString(),
    publishedAt: publishedAt.toISOString(),
    recordedAt: recordedAt.toISOString(),
    review: { confirmation: 'human-reviewed', recordedBy: input.recordedBy },
    measurementPlan: packet.measurementPlan,
    verification: {
      notBeforeAt: addDays(publishedAt.toISOString(), window.notBeforeDaysAfterPublication),
      expiresAt: addDays(publishedAt.toISOString(), window.expiresDaysAfterPublication),
      status: 'pending',
    },
    effect: 'external-publication-record-only',
    prohibitedEffects: packet.delivery.prohibitedEffects,
  });
}

function currentValues(opportunity: RankedSeoOpportunity) {
  const values: Partial<Record<z.infer<typeof metricNameSchema>, number>> = {
    ...(opportunity.signals.currentClicks !== undefined
      ? { 'search-clicks': opportunity.signals.currentClicks }
      : {}),
    ...(opportunity.signals.currentImpressions !== undefined
      ? { 'search-impressions': opportunity.signals.currentImpressions }
      : {}),
    ...(opportunity.signals.currentCtr !== undefined
      ? { 'search-ctr': opportunity.signals.currentCtr }
      : {}),
    ...(opportunity.signals.currentPosition !== undefined
      ? { 'search-average-position': opportunity.signals.currentPosition }
      : {}),
  };
  return values;
}

function baselineValues(record: SeoPublicationRecord) {
  if (record.measurementPlan.baseline.status !== 'recorded') return {};
  const values = record.measurementPlan.baseline.values;
  const metrics: Partial<Record<z.infer<typeof metricNameSchema>, number>> = {
    ...(values.clicks !== undefined ? { 'search-clicks': values.clicks } : {}),
    ...(values.impressions !== undefined ? { 'search-impressions': values.impressions } : {}),
    ...(values.ctr !== undefined ? { 'search-ctr': values.ctr } : {}),
    ...(values.averagePosition !== undefined
      ? { 'search-average-position': values.averagePosition }
      : {}),
  };
  return metrics;
}

function direction(metric: z.infer<typeof metricNameSchema>, delta: number) {
  if (delta === 0) return 'no-change' as const;
  if (metric === 'search-average-position') return delta < 0 ? 'improved' : 'declined';
  return delta > 0 ? 'improved' : 'declined';
}

function verifiedOutcome(metrics: z.infer<typeof metricResultSchema>[]) {
  if (metrics.length === 0) return 'not-measurable' as const;
  const directions = new Set(metrics.map((metric) => metric.direction));
  if (directions.size === 1 && directions.has('no-change')) return 'no-change' as const;
  if (directions.has('improved') && directions.has('declined')) return 'mixed' as const;
  if (directions.has('improved')) return 'improved' as const;
  if (directions.has('declined')) return 'declined' as const;
  return 'no-change' as const;
}

export function verifySeoPublication(input: {
  publication: SeoPublicationRecord;
  opportunity?: RankedSeoOpportunity;
  evidence?: readonly SeoOpportunityEvidence[];
  observedAt: string;
}): SeoPublicationVerification {
  const publication = seoPublicationRecordSchema.parse(input.publication);
  const observedAt = new Date(input.observedAt);
  const notBefore = new Date(publication.verification.notBeforeAt);
  const expires = new Date(publication.verification.expiresAt);
  const windowState =
    observedAt < notBefore ? 'waiting' : observedAt > expires ? 'late' : 'eligible';
  const base = {
    kind: 'unisane.growth.seo-publication-verification' as const,
    version: 1 as const,
    verificationId: stableId(
      `seo.verification.${publication.publicationId}.${observedAt.toISOString()}`,
    ),
    publicationId: publication.publicationId,
    projectId: publication.projectId,
    environmentId: publication.environmentId,
    opportunityId: publication.opportunity.id,
    observedAt: observedAt.toISOString(),
    windowState,
    causalClaim: 'not-established' as const,
  };
  if (windowState === 'waiting') {
    return seoPublicationVerificationSchema.parse({
      ...base,
      outcome: 'waiting',
      currentEvidenceIds: [],
      metrics: [],
      summary: 'The declared post-publication measurement window has not started.',
      limitations: [
        'No performance conclusion is available before the declared verification window.',
      ],
      nextStep: `Refresh the exact opportunity evidence on or after ${publication.verification.notBeforeAt}.`,
    });
  }
  if (!input.opportunity || input.opportunity.id !== publication.opportunity.id) {
    throw new Error('Current research did not return the exact published opportunity.');
  }
  const opportunity = rankedSeoOpportunitySchema.parse(input.opportunity);
  const evidence = z
    .array(seoOpportunityEvidenceSchema)
    .max(5)
    .parse(input.evidence ?? []);
  const evidenceIds = new Set(evidence.map((item) => item.evidenceId));
  if (opportunity.evidenceIds.some((id) => !evidenceIds.has(id))) {
    throw new Error('Current opportunity evidence is incomplete.');
  }
  const unreliable =
    opportunity.confidence === 'low' ||
    evidence.some(
      (item) => item.sampleData || item.freshness !== 'fresh' || item.status === 'conflicting',
    );
  const limitations = [
    'Observed changes are associated with the recorded publication window; causation is not established.',
    'Search performance varies by query, market, device, season, and provider aggregation.',
    ...(windowState === 'late'
      ? ['Verification occurred after the declared window and should be interpreted cautiously.']
      : []),
  ];
  if (unreliable) {
    return seoPublicationVerificationSchema.parse({
      ...base,
      outcome: 'not-measurable',
      currentEvidenceIds: opportunity.evidenceIds,
      metrics: [],
      summary: 'Current evidence is not reliable enough to measure this publication.',
      limitations: [
        ...limitations,
        'Current evidence is low-confidence, sample, stale, or conflicting.',
      ],
      nextStep: 'Refresh or resolve the exact opportunity evidence, then verify again.',
    });
  }
  const current = currentValues(opportunity);
  if (publication.measurementPlan.baseline.status === 'not-available') {
    if (Object.keys(current).length === 0) {
      return seoPublicationVerificationSchema.parse({
        ...base,
        outcome: 'not-measurable',
        currentEvidenceIds: opportunity.evidenceIds,
        metrics: [],
        summary: 'No current search metrics are recorded for the published route.',
        limitations,
        nextStep: 'Record page-level Search Console evidence, then verify again.',
      });
    }
    return seoPublicationVerificationSchema.parse({
      ...base,
      outcome: 'baseline-established',
      currentEvidenceIds: opportunity.evidenceIds,
      metrics: [],
      establishedBaseline: {
        observedAt: observedAt.toISOString(),
        values: {
          ...(current['search-clicks'] !== undefined ? { clicks: current['search-clicks'] } : {}),
          ...(current['search-impressions'] !== undefined
            ? { impressions: current['search-impressions'] }
            : {}),
          ...(current['search-ctr'] !== undefined ? { ctr: current['search-ctr'] } : {}),
          ...(current['search-average-position'] !== undefined
            ? { averagePosition: current['search-average-position'] }
            : {}),
        },
      },
      summary: 'The first reliable post-publication search result is now recorded as a baseline.',
      limitations,
      nextStep: 'Compare a later eligible evidence window with this newly established baseline.',
    });
  }
  const baseline = baselineValues(publication);
  const metrics: Array<z.infer<typeof metricResultSchema>> =
    publication.measurementPlan.metrics.flatMap((metric) => {
      const before = baseline[metric];
      const after = current[metric];
      if (before === undefined || after === undefined) return [];
      const delta = after - before;
      return [
        metricResultSchema.parse({
          metric,
          baseline: before,
          current: after,
          delta,
          direction: direction(metric, delta),
        }),
      ];
    });
  const outcome = verifiedOutcome(metrics);
  return seoPublicationVerificationSchema.parse({
    ...base,
    outcome,
    currentEvidenceIds: opportunity.evidenceIds,
    metrics,
    summary:
      outcome === 'not-measurable'
        ? 'The current evidence does not contain metrics comparable with the recorded baseline.'
        : `The declared window contains an observed ${outcome} search-performance result.`,
    limitations,
    nextStep:
      outcome === 'not-measurable'
        ? 'Record comparable page-level Search Console evidence, then verify again.'
        : 'Review the metric directions and limitations before deciding whether to retain or revise the page.',
  });
}
