import { describe, expect, it } from 'vitest';
import {
  marketingRecommendationArtifactSchema,
  marketingRecommendationDecisionReceiptSchema,
} from '@unisane/growth/marketing';
import {
  buildMarketingConsoleRecommendations,
  recommendationPriorities,
} from './recommendations.js';

const artifact = marketingRecommendationArtifactSchema.parse({
  kind: 'unisane.marketing.recommendations',
  version: 1,
  generatedAt: '2026-07-30T00:00:00.000Z',
  platformId: 'true-resume',
  appId: 'true-resume',
  nonMutating: true,
  sourceReportGeneratedAt: '2026-07-30T00:00:00.000Z',
  thresholds: { maxAgeDays: 3, targetCpa: 100, spendSpikeAmount: 500 },
  alerts: [
    {
      id: 'tracking-alert',
      type: 'broken_tracking',
      severity: 'high',
      owner: 'marketing/tracking',
      source: 'marketing-audit',
      message: 'Tracking needs review.',
      recommendedAction: 'Fix tracking.',
      rootCauseKey: 'tracking',
    },
  ],
  recommendations: [
    {
      id: 'fix-tracking',
      action: 'fix_tracking',
      severity: 'high',
      approvalTier: 'none',
      owner: 'marketing/tracking',
      source: 'marketing-audit',
      alertIds: ['tracking-alert'],
      experimentIds: [],
      dataWindow: '2026-07-01 to 2026-07-29',
      confidence: 'high',
      risk: 'high',
      metrics: {},
      title: 'Fix tracking before scaling',
      rationale: 'Conversion evidence is incomplete.',
      nextStep: 'Review tracking.',
      requiresReceipt: true,
    },
    {
      id: 'run-test',
      action: 'run_experiment',
      severity: 'warn',
      approvalTier: 'standard',
      owner: 'marketing/experiments',
      source: 'strategy-object-report',
      alertIds: [],
      experimentIds: ['experiment-1'],
      dataWindow: '2026-07-01 to 2026-07-29',
      confidence: 'medium',
      risk: 'medium',
      metrics: {},
      title: 'Run a bounded campaign test',
      rationale: 'A test can reduce acquisition cost.',
      nextStep: 'Review the experiment.',
      requiresReceipt: true,
    },
  ],
  experiments: [],
  blockers: [],
  decisionPolicy: {
    acceptedRecommendationRequiresReceipt: true,
    rejectedRecommendationAllowsReason: true,
    spendIncreasingRecommendationRequiresStrictApproval: true,
    trackingFixOutranksScaling: true,
  },
  nextWorkflowStep: 'Review recommendations.',
});

const acceptedReceipt = marketingRecommendationDecisionReceiptSchema.parse({
  kind: 'unisane.marketing.recommendation-decision-receipt',
  version: 1,
  generatedAt: '2026-07-30T01:00:00.000Z',
  platformId: 'true-resume',
  appId: 'true-resume',
  nonMutating: true,
  liveMutationAllowed: false,
  recommendationArtifactPath: '/project/recommendations.json',
  recommendationArtifactHash: 'hash',
  recommendationArtifactGeneratedAt: artifact.generatedAt,
  recommendationId: 'run-test',
  decision: 'accepted',
  decidedBy: 'operator',
  recommendation: artifact.recommendations[1],
  linkedAlertIds: [],
  linkedExperimentIds: ['experiment-1'],
  policy: {
    acceptedRecommendationRequiresReceipt: true,
    rejectedRecommendationReasonRequired: false,
    approverRequired: true,
    approvalReferenceRequired: false,
    liveMutationRequiresSeparatePlanApplyReceipt: true,
  },
  nextWorkflowStep: 'Use as planning input.',
});

describe('Growth console recommendations projection', () => {
  it('keeps recommendations contextual and decisions non-mutating', () => {
    const result = buildMarketingConsoleRecommendations({
      artifact,
      artifactPath: '.unisane/marketing/recommendations/current.json',
      receipts: [acceptedReceipt],
      experimentsAvailable: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ready',
        headline: '1 evidence-backed recommendation needs a decision.',
        items: [
          expect.objectContaining({
            id: 'fix-tracking',
            lane: 'analytics',
            expectedOutcome:
              'Restore trustworthy conversion and attribution evidence before scaling.',
            decision: 'pending',
            primaryAction: {
              label: 'Review tracking health',
              path: '/analytics/tracking-health',
            },
            acceptAction: expect.objectContaining({
              command: expect.stringContaining('--decision accepted'),
            }),
            dismissAction: expect.objectContaining({
              command: expect.stringContaining("--reason '<reason>'"),
            }),
          }),
          expect.objectContaining({
            id: 'run-test',
            lane: 'experiments',
            decision: 'accepted',
            primaryAction: {
              label: 'Review campaign evidence',
              path: '/advertising/all/campaigns',
            },
          }),
        ],
      }),
    );
    expect(result.items[1]).not.toHaveProperty('acceptAction');
    expect(recommendationPriorities(result)).toEqual([
      expect.objectContaining({
        id: 'recommendation.fix-tracking',
        lane: 'analytics',
      }),
    ]);
  });
});
