import { describe, expect, it } from 'vitest';
import { resumeOpsWorkflowHandoff } from '@unisane/ops-engine/workflows';
import { validateGrowthPlaybookActionReferences } from './contracts.js';
import {
  createGrowthSeoOpportunityWorkflowProjection,
  growthSeoOpportunityPlaybook,
  rankSeoOpportunityCandidates,
  type SeoOpportunityCandidate,
} from './seo-opportunity-research.js';
import { planSeoOpportunityResearch } from './seo-opportunity-research-plan.js';

const observedAt = '2026-08-03T00:00:00.000Z';

function evidence(
  id: string,
  kind: 'keyword' | 'market' | 'competitor' | 'serp' | 'page',
  overrides: Partial<SeoOpportunityCandidate['evidence'][number]> = {},
) {
  return {
    evidenceId: id,
    revision: 1,
    kind,
    source: `${kind} research`,
    observedAt,
    freshness: 'fresh' as const,
    summary: `${kind} evidence for this opportunity.`,
    sampleData: false,
    limitations: [],
    issues: [],
    status: 'current' as const,
    ...overrides,
  };
}

function candidate(
  id: string,
  overrides: Partial<SeoOpportunityCandidate> = {},
): SeoOpportunityCandidate {
  return {
    id,
    title: id.replaceAll('-', ' '),
    routePath: `/seo/research?opportunity=${id}`,
    primaryKeyword: id.replaceAll('-', ' '),
    market: 'US / en',
    intent: 'Learn',
    rationale: 'Recorded research supports reviewing this opportunity.',
    signals: {
      estimatedMonthlySearches: 1_000,
      competitionIndex: 20,
      currentPosition: 24,
      marketFit: 'strong',
    },
    evidence: [
      evidence(`${id}.keyword`, 'keyword'),
      evidence(`${id}.market`, 'market'),
      evidence(`${id}.serp`, 'serp'),
    ],
    ...overrides,
  };
}

describe('SEO opportunity research playbook', () => {
  it('references the exact registered read action', () => {
    expect(() =>
      validateGrowthPlaybookActionReferences({
        playbook: growthSeoOpportunityPlaybook,
        actions: [{ id: 'growth.seo.opportunities.review', schemaVersion: 1 }],
      }),
    ).not.toThrow();
  });

  it('ranks recorded signals deterministically and keeps missing demand absent', () => {
    const ranked = rankSeoOpportunityCandidates({
      candidates: [
        candidate('weak-large-demand', {
          signals: {
            estimatedMonthlySearches: 10_000,
            competitionIndex: 90,
            currentPosition: 30,
            marketFit: 'weak',
          },
          evidence: [evidence('weak-large-demand.keyword', 'keyword')],
        }),
        candidate('supported-focus'),
        candidate('unknown-demand', {
          signals: { marketFit: 'medium' },
          evidence: [evidence('unknown-demand.page', 'page')],
        }),
      ],
      limit: 3,
    });

    expect(ranked.map((item) => item.id)).toEqual([
      'supported-focus',
      'weak-large-demand',
      'unknown-demand',
    ]);
    expect(ranked[0]).toMatchObject({ rank: 1, confidence: 'high' });
    expect(ranked[2]?.signals).not.toHaveProperty('estimatedMonthlySearches');
    expect(ranked[2]?.limitations).toContain('Estimated search demand is not available.');
  });

  it('retains observed page performance while lowering trust for sample evidence', () => {
    const ranked = rankSeoOpportunityCandidates({
      candidates: [
        candidate('sample-page', {
          signals: {
            estimatedMonthlySearches: 1_000,
            currentPosition: 18,
            currentClicks: 4,
            currentImpressions: 120,
            currentCtr: 4 / 120,
            marketFit: 'strong',
          },
          evidence: [
            evidence('sample-page.keyword', 'keyword'),
            evidence('sample-page.page', 'page', {
              sampleData: true,
              limitations: ['The page metrics are sample data.'],
            }),
          ],
        }),
      ],
      limit: 1,
    });

    expect(ranked[0]).toMatchObject({
      confidence: 'low',
      signals: {
        currentPosition: 18,
        currentClicks: 4,
        currentImpressions: 120,
      },
    });
    expect(ranked[0]?.limitations).toEqual(
      expect.arrayContaining([
        'Sample data supports presentation only and cannot justify a live decision.',
        'The page metrics are sample data.',
      ]),
    );
  });

  it('returns no research requests when the opportunity has complete current evidence', () => {
    const candidates = [
      candidate('complete-opportunity', {
        evidence: [
          evidence('complete.keyword', 'keyword'),
          evidence('complete.market', 'market'),
          evidence('complete.competitor', 'competitor'),
          evidence('complete.serp', 'serp'),
          evidence('complete.page', 'page'),
        ],
      }),
    ];
    const opportunities = rankSeoOpportunityCandidates({ candidates, limit: 1 });

    expect(planSeoOpportunityResearch({ candidates, opportunities })).toEqual({
      schemaVersion: 1,
      status: 'complete',
      totalRequestCount: 0,
      returnedRequestCount: 0,
      truncated: false,
      requests: [],
      executionPolicy: 'explicit-user-or-automation-authority-required',
    });
  });

  it('deduplicates and bounds exact research requests for missing and unreliable evidence', () => {
    const candidates = [
      candidate('needs-research', {
        market: undefined,
        signals: { marketFit: 'strong' },
        evidence: [
          evidence('needs-research.page', 'page', {
            freshness: 'stale',
            sampleData: true,
            status: 'conflicting',
            issues: ['ambiguous-page', 'crawl-failed', 'search-performance-missing'],
          }),
        ],
      }),
    ];
    const opportunities = rankSeoOpportunityCandidates({ candidates, limit: 1 });
    const plan = planSeoOpportunityResearch({ candidates, opportunities, limit: 3 });

    expect(plan).toMatchObject({
      status: 'required',
      returnedRequestCount: 3,
      truncated: true,
      executionPolicy: 'explicit-user-or-automation-authority-required',
    });
    expect(plan.totalRequestCount).toBeGreaterThan(plan.returnedRequestCount);
    expect(new Set(plan.requests.map((request) => request.id)).size).toBe(plan.requests.length);
    expect(plan.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opportunityId: 'needs-research',
          source: 'site-page',
          priority: 'required',
          automatic: false,
          target: expect.objectContaining({
            routePath: '/seo/research?opportunity=needs-research',
          }),
        }),
      ]),
    );
  });

  it('creates one resumable projection for ranked output and presentation', () => {
    const candidates = [candidate('supported-focus')];
    const opportunities = rankSeoOpportunityCandidates({ candidates, limit: 5 });
    const projection = createGrowthSeoOpportunityWorkflowProjection({
      runId: 'workflow.seo-research',
      briefId: 'brief.seo-research',
      handoffId: 'handoff.seo-research',
      context: {
        requestId: 'request.seo-research',
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
        status: 'ready',
        totalCandidateCount: 1,
        returnedOpportunityCount: 1,
        truncated: false,
        opportunities,
        evidence: candidates[0]?.evidence ?? [],
      },
    });

    expect(projection.contextBrief.presentation).toEqual(projection.presentation);
    expect(projection.presentation.nextStep.deepLink).toBe('/seo/research');
    expect(
      resumeOpsWorkflowHandoff({ handoff: projection.handoff, run: projection.run }),
    ).toMatchObject({ status: 'resumable', nextStep: projection.presentation.nextStep });
  });

  it('lowers conflicting evidence to low confidence with an explicit limitation', () => {
    const ranked = rankSeoOpportunityCandidates({
      candidates: [
        candidate('conflicting-focus', {
          evidence: [
            evidence('conflicting-focus.keyword', 'keyword'),
            evidence('conflicting-focus.page', 'page', { status: 'conflicting' }),
          ],
        }),
      ],
      limit: 1,
    });

    expect(ranked[0]).toMatchObject({ confidence: 'low' });
    expect(ranked[0]?.limitations).toContain('Recorded sources disagree and need review.');
  });
});
