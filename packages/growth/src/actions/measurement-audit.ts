import { z } from 'zod';
import { defineOpsReadAction, type OpsActionContext } from '@unisane/ops-engine/actions';
import type { MarketingTrackingAuditReport } from '../marketing/tracking/audit-types.js';
import {
  canonicalOutcomeSchema,
  createGrowthMeasurementAuditWorkflowProjection,
  growthMeasurementAuditSnapshotSchema,
  growthMeasurementAuditWorkflowProjectionSchema,
  providerAttributedConversionSchema,
  reconcileProviderAttribution,
  type CanonicalOutcome,
  type ProviderAttributedConversion,
} from '../playbooks/measurement-audit.js';

export const growthMeasurementAuditInputSchema = z
  .object({
    period: z
      .object({
        start: z.string().datetime({ offset: true }),
        end: z.string().datetime({ offset: true }),
      })
      .strict(),
    comparisonLimit: z.number().int().min(1).max(20).default(20),
  })
  .strict()
  .refine((input) => Date.parse(input.period.start) <= Date.parse(input.period.end), {
    message: 'The measurement period start must be before or equal to its end.',
    path: ['period', 'start'],
  });
export type GrowthMeasurementAuditInput = z.infer<typeof growthMeasurementAuditInputSchema>;

export const growthMeasurementAuditOutputSchema = growthMeasurementAuditSnapshotSchema
  .extend({ workflow: growthMeasurementAuditWorkflowProjectionSchema })
  .strict();
export type GrowthMeasurementAuditOutput = z.infer<typeof growthMeasurementAuditOutputSchema>;

export interface GrowthMeasurementAuditDependencies {
  loadTrackingAudit(
    context: OpsActionContext,
  ): MarketingTrackingAuditReport | Promise<MarketingTrackingAuditReport>;
  loadCanonicalOutcomes(
    input: GrowthMeasurementAuditInput,
    context: OpsActionContext,
  ): readonly CanonicalOutcome[] | Promise<readonly CanonicalOutcome[]>;
  loadProviderAttributions(
    input: GrowthMeasurementAuditInput,
    context: OpsActionContext,
  ): readonly ProviderAttributedConversion[] | Promise<readonly ProviderAttributedConversion[]>;
  now?: () => Date;
}

const canonicalOutcomeListSchema = z
  .array(canonicalOutcomeSchema)
  .max(50)
  .superRefine((outcomes, context) => {
    const seen = new Set<string>();
    outcomes.forEach((outcome, index) => {
      if (seen.has(outcome.outcomeId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Canonical outcome ${outcome.outcomeId} is duplicated.`,
          path: [index, 'outcomeId'],
        });
      }
      seen.add(outcome.outcomeId);
    });
  });

const providerAttributionListSchema = z
  .array(providerAttributedConversionSchema)
  .max(200)
  .superRefine((attributions, context) => {
    const seen = new Set<string>();
    attributions.forEach((attribution, index) => {
      const key = `${attribution.providerId}:${attribution.outcomeId}`;
      if (seen.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provider attribution ${key} is duplicated.`,
          path: [index, 'providerId'],
        });
      }
      seen.add(key);
    });
  });

function trackingSummary(report: MarketingTrackingAuditReport) {
  const status = report.summary.status;
  const summary =
    status === 'ready'
      ? 'Tracking evidence matches the expected events and conversions.'
      : status === 'blocked'
        ? `${report.summary.errorCount} tracking error${report.summary.errorCount === 1 ? '' : 's'} make conversion evidence unreliable.`
        : `${report.summary.warningCount} tracking warning${report.summary.warningCount === 1 ? '' : 's'} need review.`;
  return {
    status,
    generatedAt: report.generatedAt,
    freshness: report.readiness.evidence[0]?.freshness ?? 'unknown',
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    findingCount: report.summary.findingCount,
    summary,
    provenance:
      report.observationArtifactPath ??
      report.readiness.evidence[0]?.source ??
      'Growth tracking audit',
  };
}

function limitationsFor(input: {
  trackingAudit: MarketingTrackingAuditReport;
  canonicalOutcomes: readonly CanonicalOutcome[];
  providerAttributions: readonly ProviderAttributedConversion[];
  environmentId: string;
}) {
  const limitations: string[] = [];
  if (input.canonicalOutcomes.length === 0) {
    limitations.push('No canonical outcome is recorded for this period.');
  }
  if (input.trackingAudit.summary.status === 'blocked') {
    limitations.push('Tracking errors make conversion evidence unreliable.');
  } else if (input.trackingAudit.summary.status === 'attention') {
    limitations.push('Tracking warnings need review before acquisition is scaled.');
  }
  if (input.trackingAudit.environment !== input.environmentId) {
    limitations.push('The tracking audit belongs to a different environment.');
  }
  if (input.trackingAudit.readiness.evidence[0]?.freshness === 'stale') {
    limitations.push('The tracking audit evidence is stale.');
  }
  if (
    !input.trackingAudit.readiness.evidence[0] ||
    input.trackingAudit.readiness.evidence[0].freshness === 'unknown'
  ) {
    limitations.push('The tracking audit evidence has unknown freshness.');
  }
  if (input.canonicalOutcomes.some((outcome) => outcome.freshness === 'stale')) {
    limitations.push('Some canonical outcome evidence is stale.');
  }
  if (input.canonicalOutcomes.some((outcome) => outcome.freshness === 'unknown')) {
    limitations.push('Some canonical outcome evidence has unknown freshness.');
  }
  if (input.providerAttributions.some((attribution) => attribution.freshness === 'stale')) {
    limitations.push('Some provider-attributed conversion evidence is stale.');
  }
  if (input.providerAttributions.some((attribution) => attribution.freshness === 'unknown')) {
    limitations.push('Some provider-attributed conversion evidence has unknown freshness.');
  }
  const outcomeIds = new Set(input.canonicalOutcomes.map((outcome) => outcome.outcomeId));
  if (input.providerAttributions.some((attribution) => !outcomeIds.has(attribution.outcomeId))) {
    limitations.push('Some provider-attributed conversions have no canonical outcome mapping.');
  }
  return limitations;
}

function trustStatus(input: {
  trackingAudit: MarketingTrackingAuditReport;
  canonicalOutcomes: readonly CanonicalOutcome[];
  limitations: readonly string[];
  environmentId: string;
}) {
  if (
    input.canonicalOutcomes.length === 0 ||
    input.trackingAudit.summary.status === 'blocked' ||
    input.trackingAudit.environment !== input.environmentId
  ) {
    return 'blocked' as const;
  }
  if (input.trackingAudit.summary.status === 'attention' || input.limitations.length > 0) {
    return 'attention' as const;
  }
  return 'ready' as const;
}

export function createGrowthMeasurementAuditAction(
  dependencies: GrowthMeasurementAuditDependencies,
) {
  return defineOpsReadAction({
    id: 'growth.measurement.audit',
    schemaVersion: 1,
    maximumEffect: 'offline',
    inputSchema: growthMeasurementAuditInputSchema,
    outputSchema: growthMeasurementAuditOutputSchema,
    async execute(input, context) {
      const [trackingAudit, loadedCanonicalOutcomes, loadedProviderAttributions] =
        await Promise.all([
          dependencies.loadTrackingAudit(context),
          dependencies.loadCanonicalOutcomes(input, context),
          dependencies.loadProviderAttributions(input, context),
        ]);
      const canonicalOutcomes = canonicalOutcomeListSchema.parse(loadedCanonicalOutcomes);
      const providerAttributions = providerAttributionListSchema.parse(loadedProviderAttributions);
      const limitations = limitationsFor({
        trackingAudit,
        canonicalOutcomes,
        providerAttributions,
        environmentId: context.environmentId,
      });
      const status = trustStatus({
        trackingAudit,
        canonicalOutcomes,
        limitations,
        environmentId: context.environmentId,
      });
      const observedAt = (dependencies.now ?? (() => new Date()))().toISOString();
      const safeToScale = status === 'ready';
      const snapshot = growthMeasurementAuditSnapshotSchema.parse({
        schemaVersion: 1,
        projectId: context.projectId,
        environmentId: context.environmentId,
        observedAt,
        period: input.period,
        status,
        safeToScale,
        trustReason: safeToScale
          ? 'Canonical outcomes are current and the tracking audit found no issue that weakens this period.'
          : status === 'blocked'
            ? 'Canonical outcomes or tracking integrity are not reliable enough to guide acquisition decisions.'
            : 'The evidence is usable for review, but measurement limitations should be resolved before scaling.',
        trackingIntegrity: trackingSummary(trackingAudit),
        canonicalOutcomes,
        attributionComparisons: reconcileProviderAttribution({
          canonicalOutcomes,
          providerAttributions,
          limit: input.comparisonLimit,
        }),
        totalAttributionCount: providerAttributions.length,
        truncated: providerAttributions.length > input.comparisonLimit,
        limitations,
      });
      return growthMeasurementAuditOutputSchema.parse({
        ...snapshot,
        workflow: createGrowthMeasurementAuditWorkflowProjection({
          runId: `workflow.${context.requestId}`,
          briefId: `brief.${context.requestId}`,
          handoffId: `handoff.${context.requestId}`,
          context,
          snapshot,
        }),
      });
    },
  });
}
