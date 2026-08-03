import { describe, expect, it } from 'vitest';
import { resumeOpsWorkflowHandoff } from '@unisane/ops-engine/workflows';
import { validateGrowthPlaybookActionReferences } from './contracts.js';
import {
  createGrowthMeasurementAuditWorkflowProjection,
  growthMeasurementAuditPlaybook,
  reconcileProviderAttribution,
  type CanonicalOutcome,
  type ProviderAttributedConversion,
} from './measurement-audit.js';

const observedAt = '2026-08-03T00:00:00.000Z';

const canonical: CanonicalOutcome = {
  outcomeId: 'purchase',
  label: 'Completed purchases',
  count: 10,
  source: 'Order service',
  observedAt,
  freshness: 'fresh',
};

const attributed: ProviderAttributedConversion = {
  providerId: 'google-ads',
  outcomeId: 'purchase',
  attributedCount: 12,
  source: 'Google Ads conversion report',
  observedAt,
  freshness: 'fresh',
  attributionModel: 'data-driven',
  attributionWindow: '30 days',
};

describe('measurement audit playbook', () => {
  it('references the exact registered read action', () => {
    expect(() =>
      validateGrowthPlaybookActionReferences({
        playbook: growthMeasurementAuditPlaybook,
        actions: [{ id: 'growth.measurement.audit', schemaVersion: 1 }],
      }),
    ).not.toThrow();
  });

  it('keeps provider attribution distinct and preserves the canonical count', () => {
    const comparisons = reconcileProviderAttribution({
      canonicalOutcomes: [canonical],
      providerAttributions: [attributed],
      limit: 10,
    });

    expect(comparisons[0]).toMatchObject({
      comparison: 'different',
      canonicalCount: 10,
      attributedCount: 12,
      difference: 2,
      differenceRatio: 0.2,
    });
    expect(comparisons[0]?.explanation).toContain('canonical count remains authoritative');
  });

  it('labels attribution as not comparable when canonical truth is missing', () => {
    expect(
      reconcileProviderAttribution({
        canonicalOutcomes: [],
        providerAttributions: [attributed],
        limit: 10,
      })[0],
    ).toMatchObject({ comparison: 'canonical-missing', attributedCount: 12 });
  });

  it('creates one resumable projection with provider-attributed evidence', () => {
    const projection = createGrowthMeasurementAuditWorkflowProjection({
      runId: 'workflow.measurement-audit',
      briefId: 'brief.measurement-audit',
      handoffId: 'handoff.measurement-audit',
      context: {
        requestId: 'request.measurement-audit',
        scopeId: 'scope.true-resume',
        projectId: 'true-resume',
        environmentId: 'production',
        principal: { kind: 'agent', id: 'agent.codex' },
        requestedAt: observedAt,
      },
      snapshot: {
        schemaVersion: 1,
        projectId: 'true-resume',
        environmentId: 'production',
        observedAt,
        period: { start: observedAt, end: observedAt },
        status: 'ready',
        safeToScale: true,
        trustReason: 'Canonical outcomes and tracking evidence are ready.',
        trackingIntegrity: {
          status: 'ready',
          generatedAt: observedAt,
          freshness: 'fresh',
          errorCount: 0,
          warningCount: 0,
          findingCount: 0,
          summary: 'Tracking evidence is ready.',
          provenance: 'Growth tracking audit',
        },
        canonicalOutcomes: [canonical],
        attributionComparisons: reconcileProviderAttribution({
          canonicalOutcomes: [canonical],
          providerAttributions: [attributed],
          limit: 10,
        }),
        totalAttributionCount: 1,
        truncated: false,
        limitations: [],
      },
    });

    expect(projection.contextBrief.presentation).toEqual(projection.presentation);
    expect(projection.run.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'provider-attributed' })]),
    );
    expect(
      resumeOpsWorkflowHandoff({ handoff: projection.handoff, run: projection.run }),
    ).toMatchObject({ status: 'resumable', nextStep: projection.presentation.nextStep });
  });
});
