import { describe, expect, it } from 'vitest';
import {
  planSeoOpportunityResearch,
  type SeoOpportunityResearchPlan,
} from './seo-opportunity-research-plan.js';
import {
  rankSeoOpportunityCandidates,
  type SeoOpportunityCandidate,
  type SeoOpportunityEvidence,
} from './seo-opportunity-research.js';
import {
  prepareSeoImplementationPacket,
  renderSeoImplementationPacket,
} from './seo-opportunity-preparation.js';
import type { PageOpportunity } from '../seo/schema/opportunity.js';

const observedAt = '2026-08-03T00:00:00.000Z';

function evidence(
  kind: SeoOpportunityEvidence['kind'],
  overrides: Partial<SeoOpportunityEvidence> = {},
): SeoOpportunityEvidence {
  return {
    evidenceId: `resume-templates.${kind}`,
    revision: 1,
    kind,
    source: `${kind} research`,
    observedAt,
    freshness: 'fresh',
    summary: `Recorded ${kind} evidence.`,
    sampleData: false,
    limitations: [],
    issues: [],
    status: 'current',
    ...overrides,
  };
}

function candidate(overrides: Partial<SeoOpportunityCandidate> = {}): SeoOpportunityCandidate {
  return {
    id: 'resume-templates',
    title: 'Resume templates',
    routePath: '/templates',
    primaryKeyword: 'resume templates',
    market: 'US / en',
    intent: 'commercial',
    rationale: 'Recorded research supports a focused templates page.',
    signals: {
      estimatedMonthlySearches: 10_000,
      competitionIndex: 24,
      currentPosition: 18,
      currentClicks: 24,
      currentImpressions: 800,
      currentCtr: 0.03,
      marketFit: 'strong',
    },
    evidence: [evidence('keyword'), evidence('market'), evidence('serp'), evidence('page')],
    ...overrides,
  };
}

function approvedOpportunity(overrides: Partial<PageOpportunity> = {}): PageOpportunity {
  return {
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
    h1: 'Resume templates for every role',
    metaDescription: 'Compare practical resume templates and start a focused resume.',
    primaryKeyword: 'resume templates',
    supportingKeywords: ['resume formats'],
    totalVolume: 10_000,
    sections: [
      {
        id: 'choose-template',
        heading: 'Choose a resume template',
        purpose: 'Help readers compare suitable formats.',
        required: true,
      },
    ],
    internalLinks: [{ label: 'Resume builder', path: '/builder' }],
    cta: { label: 'Build my resume', target: '/builder' },
    rationale: 'Recorded research supports this page.',
    ...overrides,
  };
}

function packetInput(
  options: {
    candidate?: SeoOpportunityCandidate;
    pageOpportunity?: PageOpportunity;
    researchPlan?: SeoOpportunityResearchPlan;
    evidence?: SeoOpportunityEvidence[];
  } = {},
) {
  const source = options.candidate ?? candidate();
  const opportunity = rankSeoOpportunityCandidates({ candidates: [source], limit: 1 })[0]!;
  return {
    projectId: 'true-resume',
    environmentId: 'production',
    preparedAt: '2026-08-04T00:00:00.000Z',
    opportunityReviewObservedAt: observedAt,
    opportunitySource: 'research/opportunities/pages.json',
    opportunity,
    pageOpportunity: options.pageOpportunity ?? approvedOpportunity(),
    evidence: options.evidence ?? source.evidence,
    researchPlan:
      options.researchPlan ??
      planSeoOpportunityResearch({ candidates: [source], opportunities: [opportunity] }),
  };
}

describe('SEO opportunity implementation preparation', () => {
  it('creates a deterministic evidence-bound coding-agent packet without mutation authority', () => {
    const packet = prepareSeoImplementationPacket(packetInput());

    expect(packet).toMatchObject({
      kind: 'unisane.growth.seo-implementation-packet',
      version: 1,
      selection: {
        opportunityId: 'resume-templates',
        opportunityStatus: 'approved',
        implementationApproval: 'not-granted',
      },
      pageSpecification: { routePath: '/templates', primaryKeyword: 'resume templates' },
      delivery: { audience: 'coding-agent', effect: 'offline-artifact-only' },
      measurementPlan: {
        baseline: { status: 'recorded', values: { clicks: 24, impressions: 800 } },
        comparisonMode: 'compare-to-recorded-baseline',
        publicationStatus: 'not-recorded',
      },
    });
    expect(packet.evidence.map((item) => item.evidenceId)).toEqual(packet.opportunity.evidenceIds);
    expect(packet.recommendedResearch).toEqual([
      expect.objectContaining({ source: 'competitor-page', priority: 'recommended' }),
    ]);
    expect(packet.delivery.prohibitedEffects).toEqual([
      'repository-edit',
      'cms-publication',
      'provider-mutation',
      'production-deployment',
    ]);
    expect(renderSeoImplementationPacket(packet)).toContain(
      'This packet does not authorize a repository edit',
    );
  });

  it('accepts the normalized reviewed id for a colon-delimited approved source record', () => {
    const source = candidate({ id: 'true-resume-cluster-resume-templates-page' });
    const packet = prepareSeoImplementationPacket(
      packetInput({
        candidate: source,
        pageOpportunity: approvedOpportunity({
          id: 'true-resume:cluster:resume-templates:page',
        }),
      }),
    );

    expect(packet.selection.opportunityId).toBe('true-resume-cluster-resume-templates-page');
  });

  it('uses the first observed post-publication result when no page baseline exists', () => {
    const source = candidate({
      signals: {
        estimatedMonthlySearches: 10_000,
        competitionIndex: 24,
        marketFit: 'strong',
      },
    });
    const packet = prepareSeoImplementationPacket(packetInput({ candidate: source }));

    expect(packet.measurementPlan).toMatchObject({
      baseline: { status: 'not-available' },
      comparisonMode: 'establish-first-observed-result',
      verificationWindow: {
        notBeforeDaysAfterPublication: 14,
        expiresDaysAfterPublication: 28,
      },
    });
  });

  it.each([
    ['unapproved selection', candidate(), approvedOpportunity({ status: 'candidate' })],
    ['route mismatch', candidate(), approvedOpportunity({ routePath: '/different-templates' })],
    [
      'sample evidence',
      candidate({ evidence: [evidence('keyword', { sampleData: true }), evidence('serp')] }),
      approvedOpportunity(),
    ],
    [
      'stale evidence',
      candidate({ evidence: [evidence('keyword', { freshness: 'stale' }), evidence('serp')] }),
      approvedOpportunity(),
    ],
  ])('rejects %s before producing an implementation packet', (_label, source, page) => {
    expect(() =>
      prepareSeoImplementationPacket(packetInput({ candidate: source, pageOpportunity: page })),
    ).toThrow();
  });

  it('rejects required research and missing referenced evidence', () => {
    const incomplete = candidate({
      market: undefined,
      signals: { marketFit: 'strong' },
      evidence: [evidence('page')],
    });
    expect(() => prepareSeoImplementationPacket(packetInput({ candidate: incomplete }))).toThrow(
      /Low-confidence|required research/,
    );

    const valid = packetInput();
    expect(() =>
      prepareSeoImplementationPacket({ ...valid, evidence: valid.evidence.slice(1) }),
    ).toThrow(/missing referenced evidence/);
  });
});
