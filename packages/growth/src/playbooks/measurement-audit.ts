import { z } from 'zod';
import type { OpsActionContext } from '@unisane/ops-engine/actions';
import {
  buildOpsWorkflowContextBrief,
  createOpsWorkflowHandoff,
  defineOpsWorkflowRun,
  opsWorkflowContextBriefSchema,
  opsWorkflowHandoffSchema,
  opsWorkflowPresentationSchema,
  opsWorkflowRunSchema,
} from '@unisane/ops-engine/workflows';
import { defineGrowthGoal, defineGrowthPlaybook } from './contracts.js';
import { deriveEvidenceRevision } from './evidence-revision.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const conciseTextSchema = z.string().trim().min(1).max(280);

export const growthMeasurementTrustGoal = defineGrowthGoal({
  id: 'growth.measurement-trust',
  version: 1,
  title: 'Decide whether Growth numbers are trustworthy',
  description:
    'Check canonical outcomes, tracking integrity, and provider attribution before using numbers to guide work.',
  outcome: 'Know which numbers are authoritative, what differs, and whether it is safe to scale.',
  conversationStarters: [
    'Can I trust these Growth numbers?',
    'Check our measurement before we spend more.',
    'Compare our real outcomes with the conversions reported by advertising providers.',
  ],
});

export const growthMeasurementAuditPlaybook = defineGrowthPlaybook({
  id: 'growth.measurement-audit',
  version: 1,
  goal: { id: growthMeasurementTrustGoal.id, version: growthMeasurementTrustGoal.version },
  title: 'Measurement audit',
  description:
    'Gate Growth decisions on canonical outcomes and tracking integrity while keeping provider attribution clearly labelled.',
  stages: [
    {
      id: 'understand-decision',
      title: 'Understand the decision',
      guidance: 'Confirm the project, environment, period, and decision the numbers will support.',
      actionReferences: [],
    },
    {
      id: 'inspect-measurement',
      title: 'Check measurement evidence',
      guidance:
        'Load the canonical tracking audit, canonical outcomes, and provider-attributed conversions.',
      actionReferences: [{ id: 'growth.measurement.audit', schemaVersion: 1 }],
    },
    {
      id: 'explain-trust',
      title: 'Explain what can be trusted',
      guidance:
        'Keep canonical outcomes separate from provider attribution and explain limitations in plain language.',
      actionReferences: [],
    },
    {
      id: 'choose-next-step',
      title: 'Choose the safe next step',
      guidance: 'Repair measurement before scaling when current evidence is not trustworthy.',
      actionReferences: [],
    },
    {
      id: 'verify-result',
      title: 'Check again',
      guidance: 'Re-run the audit after tracking, consent, tagging, or outcome evidence changes.',
      actionReferences: [{ id: 'growth.measurement.audit', schemaVersion: 1 }],
    },
  ],
});

export const measurementFreshnessSchema = z.enum(['fresh', 'stale', 'unknown']);

export const canonicalOutcomeSchema = z
  .object({
    outcomeId: stableIdSchema,
    label: z.string().trim().min(1).max(120),
    count: z.number().int().nonnegative(),
    source: z.string().trim().min(1).max(160),
    observedAt: z.string().datetime({ offset: true }),
    freshness: measurementFreshnessSchema,
  })
  .strict();
export type CanonicalOutcome = z.infer<typeof canonicalOutcomeSchema>;

export const providerAttributedConversionSchema = z
  .object({
    providerId: stableIdSchema,
    outcomeId: stableIdSchema,
    attributedCount: z.number().int().nonnegative(),
    source: z.string().trim().min(1).max(160),
    observedAt: z.string().datetime({ offset: true }),
    freshness: measurementFreshnessSchema,
    attributionModel: z.string().trim().min(1).max(120).optional(),
    attributionWindow: z.string().trim().min(1).max(120).optional(),
  })
  .strict();
export type ProviderAttributedConversion = z.infer<typeof providerAttributedConversionSchema>;

export const measurementAttributionComparisonSchema = z
  .object({
    providerId: stableIdSchema,
    outcomeId: stableIdSchema,
    canonicalCount: z.number().int().nonnegative().optional(),
    attributedCount: z.number().int().nonnegative(),
    difference: z.number().int().optional(),
    differenceRatio: z.number().finite().optional(),
    comparison: z.enum(['aligned', 'different', 'canonical-missing']),
    explanation: conciseTextSchema,
    source: z.string().trim().min(1).max(160),
    observedAt: z.string().datetime({ offset: true }),
    freshness: measurementFreshnessSchema,
    attributionModel: z.string().trim().min(1).max(120).optional(),
    attributionWindow: z.string().trim().min(1).max(120).optional(),
  })
  .strict();
export type MeasurementAttributionComparison = z.infer<
  typeof measurementAttributionComparisonSchema
>;

export const measurementTrackingIntegritySchema = z
  .object({
    status: z.enum(['ready', 'attention', 'blocked']),
    generatedAt: z.string().datetime({ offset: true }),
    freshness: measurementFreshnessSchema,
    errorCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    findingCount: z.number().int().nonnegative(),
    summary: conciseTextSchema,
    provenance: z.string().trim().min(1).max(200),
  })
  .strict();

export const growthMeasurementAuditSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    observedAt: z.string().datetime({ offset: true }),
    period: z
      .object({
        start: z.string().datetime({ offset: true }),
        end: z.string().datetime({ offset: true }),
      })
      .strict(),
    status: z.enum(['ready', 'attention', 'blocked']),
    safeToScale: z.boolean(),
    trustReason: conciseTextSchema,
    trackingIntegrity: measurementTrackingIntegritySchema,
    canonicalOutcomes: z.array(canonicalOutcomeSchema).max(50),
    attributionComparisons: z.array(measurementAttributionComparisonSchema).max(20),
    totalAttributionCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    limitations: z.array(conciseTextSchema).max(20),
  })
  .strict();
export type GrowthMeasurementAuditSnapshot = z.infer<typeof growthMeasurementAuditSnapshotSchema>;

export const growthMeasurementAuditWorkflowProjectionSchema = z
  .object({
    run: opsWorkflowRunSchema,
    contextBrief: opsWorkflowContextBriefSchema,
    handoff: opsWorkflowHandoffSchema,
    presentation: opsWorkflowPresentationSchema,
  })
  .strict();
export type GrowthMeasurementAuditWorkflowProjection = z.infer<
  typeof growthMeasurementAuditWorkflowProjectionSchema
>;

export function reconcileProviderAttribution(input: {
  canonicalOutcomes: readonly CanonicalOutcome[];
  providerAttributions: readonly ProviderAttributedConversion[];
  limit: number;
}): MeasurementAttributionComparison[] {
  const canonical = new Map(input.canonicalOutcomes.map((outcome) => [outcome.outcomeId, outcome]));
  return input.providerAttributions.slice(0, input.limit).map((attribution) => {
    const outcome = canonical.get(attribution.outcomeId);
    if (!outcome) {
      return measurementAttributionComparisonSchema.parse({
        ...attribution,
        comparison: 'canonical-missing',
        explanation:
          'This is a provider-attributed conversion; no canonical outcome is recorded for comparison.',
      });
    }
    const difference = attribution.attributedCount - outcome.count;
    const comparison = difference === 0 ? 'aligned' : 'different';
    return measurementAttributionComparisonSchema.parse({
      ...attribution,
      canonicalCount: outcome.count,
      difference,
      ...(outcome.count > 0 ? { differenceRatio: difference / outcome.count } : {}),
      comparison,
      explanation:
        comparison === 'aligned'
          ? 'Provider attribution and the canonical outcome count are numerically aligned for this period.'
          : 'Provider attribution differs from the canonical outcome count; attribution rules may explain the difference and the canonical count remains authoritative.',
    });
  });
}

export function projectGrowthMeasurementAuditPresentation(input: GrowthMeasurementAuditSnapshot) {
  const snapshot = growthMeasurementAuditSnapshotSchema.parse(input);
  if (snapshot.status === 'blocked') {
    return opsWorkflowPresentationSchema.parse({
      headline: 'Do not scale acquisition yet.',
      whyItMatters: snapshot.trustReason,
      nextStep: {
        label: 'Repair measurement first',
        reason: snapshot.limitations[0] ?? snapshot.trackingIntegrity.summary,
        deepLink: '/analytics/tracking-health',
      },
      supportingReason: 'Provider-attributed conversions do not replace canonical outcomes.',
    });
  }
  if (snapshot.status === 'attention') {
    return opsWorkflowPresentationSchema.parse({
      headline: 'Measurement needs review before scaling.',
      whyItMatters: snapshot.trustReason,
      nextStep: {
        label: 'Review measurement evidence',
        reason: snapshot.limitations[0] ?? snapshot.trackingIntegrity.summary,
        deepLink: '/analytics/tracking-health',
      },
      supportingReason:
        'Canonical outcomes remain the decision authority while attribution differs.',
    });
  }
  return opsWorkflowPresentationSchema.parse({
    headline: 'Measurement is trustworthy enough to guide decisions.',
    whyItMatters: snapshot.trustReason,
    nextStep: {
      label: 'Review Growth priorities',
      reason: 'Current canonical outcomes and tracking integrity are usable for this period.',
      deepLink: '/overview',
    },
    supportingReason: 'Provider conversions are shown separately as attributed evidence.',
  });
}

export function createGrowthMeasurementAuditWorkflowProjection(input: {
  runId: string;
  briefId: string;
  handoffId: string;
  context: OpsActionContext;
  snapshot: GrowthMeasurementAuditSnapshot;
}): GrowthMeasurementAuditWorkflowProjection {
  const snapshot = growthMeasurementAuditSnapshotSchema.parse(input.snapshot);
  const presentation = projectGrowthMeasurementAuditPresentation(snapshot);
  const evidence = [
    {
      evidenceId: 'tracking.integrity',
      revision: deriveEvidenceRevision([
        snapshot.trackingIntegrity.status,
        snapshot.trackingIntegrity.provenance,
        snapshot.trackingIntegrity.freshness,
        snapshot.trackingIntegrity.summary,
      ]),
      kind:
        snapshot.trackingIntegrity.status === 'blocked'
          ? ('conflicting' as const)
          : ('observed' as const),
      source: snapshot.trackingIntegrity.provenance,
      observedAt: snapshot.trackingIntegrity.generatedAt,
      freshness: snapshot.trackingIntegrity.freshness,
      summary: snapshot.trackingIntegrity.summary,
      status: 'current' as const,
    },
    ...snapshot.canonicalOutcomes.map((outcome) => ({
      evidenceId: `canonical.${outcome.outcomeId}`,
      revision: deriveEvidenceRevision([
        outcome.outcomeId,
        outcome.count,
        outcome.source,
        outcome.observedAt,
        outcome.freshness,
      ]),
      kind: 'observed' as const,
      source: outcome.source,
      observedAt: outcome.observedAt,
      freshness: outcome.freshness,
      summary: `${outcome.label}: ${outcome.count} canonical outcomes.`,
      status: 'current' as const,
    })),
    ...snapshot.attributionComparisons.map((comparison, index) => ({
      evidenceId: `attribution.${comparison.providerId}.${comparison.outcomeId}.${index + 1}`,
      revision: deriveEvidenceRevision([
        comparison.providerId,
        comparison.outcomeId,
        comparison.attributedCount,
        comparison.canonicalCount,
        comparison.comparison,
        comparison.source,
        comparison.observedAt,
        comparison.freshness,
      ]),
      kind:
        comparison.comparison === 'canonical-missing'
          ? ('missing' as const)
          : ('provider-attributed' as const),
      source: comparison.source,
      observedAt: comparison.observedAt,
      freshness: comparison.freshness,
      summary: `${comparison.providerId}: ${comparison.attributedCount} provider-attributed conversions.`,
      status: 'current' as const,
    })),
  ].slice(0, 50);
  const run = defineOpsWorkflowRun({
    schemaVersion: 1,
    kind: 'ops.workflow-run',
    runId: input.runId,
    revision: 1,
    goal: { id: growthMeasurementTrustGoal.id, version: growthMeasurementTrustGoal.version },
    playbook: {
      id: growthMeasurementAuditPlaybook.id,
      version: growthMeasurementAuditPlaybook.version,
    },
    context: {
      scopeId: input.context.scopeId,
      projectId: input.context.projectId,
      environmentId: input.context.environmentId,
      ...(input.context.targetId ? { targetId: input.context.targetId } : {}),
      principal: input.context.principal,
    },
    status: snapshot.status === 'blocked' ? 'blocked' : 'ready',
    currentStageId: snapshot.status === 'ready' ? 'choose-next-step' : 'inspect-measurement',
    evidence,
    startedAt: input.context.requestedAt,
    updatedAt: snapshot.observedAt,
  });
  const contextBrief = buildOpsWorkflowContextBrief({
    briefId: input.briefId,
    run,
    presentation,
    generatedAt: snapshot.observedAt,
  });
  const handoff = createOpsWorkflowHandoff({
    handoffId: input.handoffId,
    run,
    contextBrief,
    createdAt: snapshot.observedAt,
  });
  return growthMeasurementAuditWorkflowProjectionSchema.parse({
    run,
    contextBrief,
    handoff,
    presentation,
  });
}
