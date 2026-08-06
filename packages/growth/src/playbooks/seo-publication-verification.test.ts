import { describe, expect, it } from 'vitest';
import type { PageOpportunity } from '../seo/schema/opportunity.js';
import { prepareSeoImplementationPacket } from './seo-opportunity-preparation.js';
import { planSeoOpportunityResearch } from './seo-opportunity-research-plan.js';
import {
  rankSeoOpportunityCandidates,
  type RankedSeoOpportunity,
  type SeoOpportunityCandidate,
  type SeoOpportunityEvidence,
} from './seo-opportunity-research.js';
import { recordSeoPublication, verifySeoPublication } from './seo-publication-verification.js';

const preparedAt = '2026-08-04T00:00:00.000Z';

function evidence(kind: SeoOpportunityEvidence['kind']): SeoOpportunityEvidence {
  return {
    evidenceId: `resume-templates.${kind}`,
    revision: 1,
    kind,
    source: `${kind} research`,
    observedAt: preparedAt,
    freshness: 'fresh',
    summary: `Recorded ${kind} evidence.`,
    sampleData: false,
    limitations: [],
    issues: [],
    status: 'current',
  };
}

function candidate(withBaseline = true): SeoOpportunityCandidate {
  return {
    id: 'resume-templates',
    title: 'Resume templates',
    routePath: '/templates',
    primaryKeyword: 'resume templates',
    market: 'US / en',
    intent: 'commercial',
    rationale: 'Recorded research supports the templates page.',
    signals: {
      estimatedMonthlySearches: 10_000,
      competitionIndex: 24,
      marketFit: 'strong',
      ...(withBaseline
        ? { currentClicks: 10, currentImpressions: 200, currentCtr: 0.05, currentPosition: 18 }
        : {}),
    },
    evidence: ['keyword', 'market', 'serp', 'page'].map((kind) =>
      evidence(kind as SeoOpportunityEvidence['kind']),
    ),
  };
}

const page: PageOpportunity = {
  id: 'resume-templates',
  platformId: 'true-resume',
  clusterId: 'templates',
  sourcePatternPack: 'resume',
  status: 'approved',
  priority: 'p0',
  fit: 'strong',
  intent: 'commercial',
  pageType: 'category',
  slug: 'templates',
  routePath: '/templates',
  title: 'Resume templates',
  h1: 'Resume templates',
  metaDescription: 'Compare practical resume templates.',
  primaryKeyword: 'resume templates',
  supportingKeywords: ['resume formats'],
  sections: [],
  internalLinks: [],
  cta: { label: 'Build', target: '/builder' },
  rationale: 'Recorded research supports this page.',
};

function packet(withBaseline = true) {
  const source = candidate(withBaseline);
  const opportunity = rankSeoOpportunityCandidates({ candidates: [source], limit: 1 })[0]!;
  return prepareSeoImplementationPacket({
    projectId: 'true-resume',
    environmentId: 'production',
    preparedAt,
    opportunityReviewObservedAt: preparedAt,
    opportunitySource: 'research/opportunities.json',
    opportunity,
    pageOpportunity: page,
    evidence: source.evidence,
    researchPlan: planSeoOpportunityResearch({
      candidates: [source],
      opportunities: [opportunity],
    }),
  });
}

function publication(withBaseline = true) {
  return recordSeoPublication({
    packet: packet(withBaseline),
    publishedUrl: 'https://example.com/templates',
    publishedAt: '2026-08-04T00:00:00.000Z',
    recordedAt: '2026-08-04T01:00:00.000Z',
    recordedBy: 'operator@example.com',
    confirmedReviewed: true,
    expectedProjectId: 'true-resume',
    expectedEnvironmentId: 'production',
  });
}

function currentOpportunity(overrides: Partial<RankedSeoOpportunity['signals']> = {}) {
  const source = candidate();
  source.signals = { ...source.signals, ...overrides };
  return {
    opportunity: rankSeoOpportunityCandidates({ candidates: [source], limit: 1 })[0]!,
    evidence: source.evidence,
  };
}

describe('SEO publication and verification', () => {
  it('records an exact reviewed external publication and derives the verification window', () => {
    const record = publication();

    expect(record).toMatchObject({
      kind: 'unisane.growth.seo-publication-record',
      version: 1,
      opportunity: { id: 'resume-templates', routePath: '/templates' },
      review: { confirmation: 'human-reviewed', recordedBy: 'operator@example.com' },
      verification: {
        notBeforeAt: '2026-08-18T00:00:00.000Z',
        expiresAt: '2026-09-01T00:00:00.000Z',
        status: 'pending',
      },
      effect: 'external-publication-record-only',
    });
    expect(record.packet.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails closed without human confirmation or with the wrong route or context', () => {
    const base = {
      packet: packet(),
      publishedUrl: 'https://example.com/templates',
      publishedAt: '2026-08-04T00:00:00.000Z',
      recordedAt: '2026-08-04T01:00:00.000Z',
      recordedBy: 'operator@example.com',
      confirmedReviewed: true,
    };
    expect(() => recordSeoPublication({ ...base, confirmedReviewed: false })).toThrow(
      /confirmation/,
    );
    expect(() =>
      recordSeoPublication({ ...base, publishedUrl: 'https://example.com/pricing' }),
    ).toThrow(/exact approved route/);
    expect(() => recordSeoPublication({ ...base, expectedProjectId: 'different-project' })).toThrow(
      /selected project/,
    );
  });

  it('waits before the window and records relative improvements without a causal claim', () => {
    const record = publication();
    const waiting = verifySeoPublication({
      publication: record,
      observedAt: '2026-08-10T00:00:00.000Z',
    });
    expect(waiting).toMatchObject({ windowState: 'waiting', outcome: 'waiting', metrics: [] });

    const current = currentOpportunity({
      currentClicks: 20,
      currentImpressions: 300,
      currentCtr: 20 / 300,
      currentPosition: 12,
    });
    const measured = verifySeoPublication({
      publication: record,
      ...current,
      observedAt: '2026-08-20T00:00:00.000Z',
    });
    expect(measured).toMatchObject({
      windowState: 'eligible',
      outcome: 'improved',
      causalClaim: 'not-established',
    });
    expect(measured.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: 'search-clicks', delta: 10, direction: 'improved' }),
        expect.objectContaining({
          metric: 'search-average-position',
          delta: -6,
          direction: 'improved',
        }),
      ]),
    );
  });

  it('establishes the first observed baseline and preserves honest no-change', () => {
    const current = currentOpportunity();
    const established = verifySeoPublication({
      publication: publication(false),
      ...current,
      observedAt: '2026-08-20T00:00:00.000Z',
    });
    expect(established).toMatchObject({
      outcome: 'baseline-established',
      establishedBaseline: { values: { clicks: 10, impressions: 200 } },
    });

    const unchanged = verifySeoPublication({
      publication: publication(),
      ...current,
      observedAt: '2026-08-20T00:00:00.000Z',
    });
    expect(unchanged).toMatchObject({ outcome: 'no-change', causalClaim: 'not-established' });
  });

  it('does not measure low-confidence or incomplete current evidence', () => {
    const source = candidate();
    source.evidence[0] = { ...source.evidence[0]!, sampleData: true };
    const opportunity = rankSeoOpportunityCandidates({ candidates: [source], limit: 1 })[0]!;
    const result = verifySeoPublication({
      publication: publication(),
      opportunity,
      evidence: source.evidence,
      observedAt: '2026-08-20T00:00:00.000Z',
    });
    expect(result).toMatchObject({ outcome: 'not-measurable', causalClaim: 'not-established' });

    expect(() =>
      verifySeoPublication({
        publication: publication(),
        opportunity: currentOpportunity().opportunity,
        evidence: [],
        observedAt: '2026-08-20T00:00:00.000Z',
      }),
    ).toThrow(/incomplete/);
  });
});
