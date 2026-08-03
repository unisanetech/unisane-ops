import { describe, expect, it } from 'vitest';
import { resumeOpsWorkflowHandoff } from '@unisane/ops-engine/workflows';
import { validateGrowthPlaybookActionReferences } from './contracts.js';
import {
  createGrowthSeoOpportunityWorkflowProjection,
  growthSeoOpportunityPlaybook,
  rankSeoOpportunityCandidates,
  type SeoOpportunityCandidate,
} from './seo-opportunity-research.js';

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
