import { describe, expect, it } from 'vitest';
import type {
  MarketingConsoleCompetitorResearchSummary,
  MarketingConsoleFaqResearchSummary,
  MarketingConsoleKeywordResearchSummary,
  MarketingConsoleSeoIntelligenceSummary,
} from './contracts.js';
import { buildMarketingConsoleSeo } from './seo.js';
import type { GrowthSeoOpportunityResearchOutput } from '../actions/seo-opportunity-research.js';
import type { SeoImplementationPacket } from '../playbooks/seo-opportunity-preparation.js';
import type {
  SeoPublicationRecord,
  SeoPublicationVerification,
} from '../playbooks/seo-publication-verification.js';
import type { PageOpportunity } from '../seo/schema/opportunity.js';

const opportunityReview = {
  status: 'blocked',
  opportunities: [],
} as unknown as GrowthSeoOpportunityResearchOutput;

const missingKeywordResearch: MarketingConsoleKeywordResearchSummary = {
  status: 'missing',
  metricCount: 0,
  totalKnownVolume: 0,
  keywords: [],
  matrix: [],
  clusters: [],
  markets: [],
  topKeywords: [],
};

const missingCompetitorResearch: MarketingConsoleCompetitorResearchSummary = {
  status: 'missing',
  sourceCount: 0,
  pageCount: 0,
  domainCount: 0,
  keywordCount: 0,
  domains: [],
  pages: [],
  opportunities: [],
};

const missingFaqResearch: MarketingConsoleFaqResearchSummary = {
  status: 'missing',
  sourceCount: 0,
  questionCount: 0,
  pageCount: 0,
  approvedCount: 0,
  highPriorityCount: 0,
  totalKnownVolume: 0,
  qualityScore: 0,
  evidenceSourceCount: 0,
  marketCount: 0,
  needsProofCount: 0,
  duplicateQuestionCount: 0,
  routeConflictCount: 0,
  warnings: [],
  pages: [],
  questions: [],
  topQuestions: [],
};

const missingIntelligence: MarketingConsoleSeoIntelligenceSummary = {
  status: 'missing',
  score: 0,
  serp: {
    status: 'missing',
    sourceCount: 0,
    snapshotCount: 0,
    countryCount: 0,
    keywordCount: 0,
    snapshots: [],
  },
  metadata: {
    status: 'missing',
    sourceCount: 0,
    experimentCount: 0,
    readyCount: 0,
    experiments: [],
  },
  pageAudits: {
    status: 'missing',
    sourceCount: 0,
    pageCount: 0,
    averageScore: 0,
    blockedCount: 0,
    warningCount: 0,
    audits: [],
  },
  warnings: [],
};

describe('Growth console SEO projection', () => {
  it('aggregates current page and query evidence without inventing comparison claims', () => {
    const result = buildMarketingConsoleSeo({
      rows: [
        {
          id: 'one',
          query: 'executive resume templates',
          pageUrl: 'https://example.com/templates/executive',
          clicks: 3,
          impressions: 120,
          ctr: 2.5,
          position: 8.4,
        },
        {
          id: 'two',
          query: 'executive template',
          pageUrl: 'https://example.com/templates/executive',
          clicks: 0,
          impressions: 80,
          ctr: 0,
          position: 12,
        },
      ],
      metrics: [
        {
          id: 'organic-clicks',
          label: 'Organic clicks',
          value: '3',
          numericValue: 3,
          definition: 'Organic visits.',
          sourceLabel: 'Search Console',
          freshnessLabel: '4 days old',
          comparisonLabel: 'Previous-period comparison is not available yet.',
          status: 'warn',
        },
        {
          id: 'organic-impressions',
          label: 'Search views',
          value: '200',
          numericValue: 200,
          definition: 'Search appearances.',
          sourceLabel: 'Search Console',
          freshnessLabel: '4 days old',
          comparisonLabel: 'Previous-period comparison is not available yet.',
          status: 'warn',
        },
      ],
      freshness: [
        {
          id: 'searchConsole.queryPage',
          provider: 'searchConsole',
          reportType: 'queryPage',
          label: 'Search Console query/page',
          status: 'warn',
          message: 'Update search data.',
          ageDays: 4,
          path: '/evidence/search.json',
        },
      ],
      keywordResearch: missingKeywordResearch,
      competitorResearch: missingCompetitorResearch,
      faqResearch: missingFaqResearch,
      intelligence: missingIntelligence,
      opportunityReview,
    });

    expect(result.overview).toEqual(
      expect.objectContaining({
        status: 'warn',
        headline: 'Search results are available, but they are 4 days old.',
        metrics: expect.arrayContaining([
          expect.objectContaining({ id: 'organic-clicks', value: '3' }),
          expect.objectContaining({ id: 'organic-impressions', value: '200' }),
          expect.objectContaining({ id: 'average-position', value: '9.8' }),
        ]),
      }),
    );
    expect(result.pages).toEqual([
      expect.objectContaining({
        title: 'Executive template',
        clicks: 3,
        searchViews: 200,
        status: 'Review',
        changeLabel: 'Previous-period comparison is not available yet.',
        topQueries: ['executive resume templates', 'executive template'],
      }),
    ]);
    expect(result.queries).toHaveLength(2);
    expect(result.opportunities[0]).toEqual(
      expect.objectContaining({
        kind: 'quick-win',
        title: 'Improve Executive template search click-through',
        action: { label: 'Review page', path: '/seo/pages' },
      }),
    );
    expect(result.comparisonAvailable).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/SEO readiness/i);
  });

  it('groups real site issues and turns market research into qualified ideas', () => {
    const result = buildMarketingConsoleSeo({
      rows: [],
      metrics: [],
      freshness: [],
      keywordResearch: {
        ...missingKeywordResearch,
        status: 'ready',
        metricCount: 1,
        totalKnownVolume: 2400,
        keywords: [
          {
            term: 'ats resume checker',
            normalizedTerm: 'ats resume checker',
            country: 'US',
            language: 'en',
            avgMonthlySearches: 2400,
            competition: 'MEDIUM',
          },
        ],
        matrix: [
          {
            term: 'ats resume checker',
            normalizedTerm: 'ats resume checker',
            clusterId: 'ats',
            clusterLabel: 'ATS checker and job match',
            marketCount: 1,
            totalKnownVolume: 2400,
            bestMarket: 'US / en',
            bestMarketVolume: 2400,
            markets: {},
          },
        ],
        markets: [
          {
            market: 'US / en',
            country: 'US',
            language: 'en',
            metricCount: 1,
            totalKnownVolume: 2400,
            topKeywords: [],
          },
        ],
      },
      competitorResearch: {
        ...missingCompetitorResearch,
        status: 'ready',
        opportunities: ['Explain ATS-safe formatting more clearly.'],
      },
      faqResearch: {
        ...missingFaqResearch,
        status: 'ready',
        questionCount: 1,
        topQuestions: [
          {
            id: 'ats-question',
            question: 'Will my resume be ATS-friendly?',
            answerIntent: 'Explain ATS formatting',
            pageRole: 'homepage',
            routePath: '/',
            priority: 'p0',
            status: 'approved',
            sourceTerms: ['ats resume checker'],
            supportingKeywords: [],
            avgMonthlySearches: 2400,
            marketCount: 1,
            evidenceSourceCount: 1,
            evidenceSources: ['google-ads'],
            proofStatus: 'ready',
            evidence: ['Keyword demand'],
            recommendedAnswer: 'Explain readable structure.',
            internalLinks: [],
          },
        ],
      },
      intelligence: {
        ...missingIntelligence,
        status: 'blocked',
        pageAudits: {
          status: 'blocked',
          sourceCount: 1,
          pageCount: 1,
          averageScore: 50,
          blockedCount: 1,
          warningCount: 0,
          audits: [
            {
              id: 'homepage-audit',
              routePath: '/',
              status: 'blocked',
              score: 50,
              missing: ['Page is blocked from indexing'],
              warnings: [
                'Missing structured data',
                'Add category chips for commercial search intent',
              ],
              recommendations: [],
            },
          ],
        },
      },
      opportunityReview,
    });

    expect(result.siteHealth).toEqual(
      expect.objectContaining({
        available: true,
        status: 'blocked',
        headline: '2 technical search issues need attention.',
      }),
    );
    expect(result.siteHealth.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'indexing',
          issues: [expect.objectContaining({ title: 'Page is blocked from indexing' })],
        }),
        expect.objectContaining({
          id: 'structured-data',
          issues: [expect.objectContaining({ title: 'Missing structured data' })],
        }),
      ]),
    );
    expect(JSON.stringify(result.siteHealth)).not.toContain(
      'Add category chips for commercial search intent',
    );
    expect(result.research).toEqual(
      expect.objectContaining({
        available: true,
        contextLabel: 'Markets: US / en',
        keywordIdeas: [
          expect.objectContaining({
            topic: 'ats resume checker',
            estimatedMonthlySearches: 2400,
            difficultyLabel: 'Medium',
            intentLabel: 'Learn',
          }),
        ],
        questions: [expect.objectContaining({ question: 'Will my resume be ATS-friendly?' })],
        contentGaps: [
          expect.objectContaining({ title: 'Explain ATS-safe formatting more clearly.' }),
        ],
      }),
    );
  });

  it('projects exact preparation, publication, and verification stages from canonical artifacts', () => {
    const reviewedOpportunityId = 'true-resume-cluster-resume-templates-page';
    const sourceOpportunityId = 'true-resume:cluster:resume-templates:page';
    const sourceOpportunity = {
      id: sourceOpportunityId,
      platformId: 'true-resume',
      clusterId: 'resume-templates',
      sourcePatternPack: 'resume-examples',
      status: 'approved',
      priority: 'p0',
      fit: 'strong',
      intent: 'commercial',
      pageType: 'category',
      slug: 'templates',
      routePath: '/templates',
      title: 'Resume templates',
      h1: 'Professional resume templates',
      metaDescription: 'Choose a resume template.',
      primaryKeyword: 'resume templates',
      supportingKeywords: ['professional resume templates'],
      sections: [
        {
          id: 'choose-template',
          heading: 'Choose a template',
          purpose: 'Help visitors compare formats.',
          required: true,
        },
      ],
      internalLinks: [{ label: 'Resume builder', path: '/builder' }],
      cta: { label: 'Build my resume', target: '/builder' },
      rationale: 'Recorded demand supports this page.',
    } as PageOpportunity;
    const review = {
      observedAt: '2026-08-04T00:00:00.000Z',
      status: 'ready',
      opportunities: [
        {
          id: reviewedOpportunityId,
          rank: 1,
          title: 'Resume templates',
          routePath: '/templates',
          primaryKeyword: 'resume templates',
          market: 'US / en',
          score: 88,
          confidence: 'high',
          rationale: 'Recorded research supports this page.',
          limitations: [],
          provenance: ['keyword research'],
          evidenceIds: ['resume-templates.keyword'],
          signals: {},
        },
      ],
      evidence: [
        {
          evidenceId: 'resume-templates.keyword',
          revision: 1,
          kind: 'keyword',
          source: 'Keyword research',
          observedAt: '2026-08-04T00:00:00.000Z',
          freshness: 'fresh',
          summary: 'Recorded keyword evidence.',
          sampleData: false,
          limitations: [],
          issues: [],
          status: 'current',
        },
      ],
      researchPlan: { requests: [] },
    } as unknown as GrowthSeoOpportunityResearchOutput;
    const paths = {
      opportunitySource: 'research/opportunities/pages.json',
      preparedDirectory: 'research/prepared',
      publicationsDirectory: 'research/publications',
      verificationsDirectory: 'research/verifications',
    };
    const base = {
      rows: [],
      metrics: [],
      freshness: [],
      keywordResearch: missingKeywordResearch,
      competitorResearch: missingCompetitorResearch,
      faqResearch: missingFaqResearch,
      intelligence: missingIntelligence,
      opportunityReview: review,
      workflowPaths: paths,
      now: new Date('2026-08-20T00:00:00.000Z'),
    };
    const approved = buildMarketingConsoleSeo({
      ...base,
      workflowArtifacts: {
        approvedOpportunityIds: [sourceOpportunityId],
        opportunityRecords: [
          {
            path: 'research/opportunities/resume-examples.opportunities.json',
            opportunity: sourceOpportunity,
          },
        ],
        packets: [],
        publications: [],
        verifications: [],
      },
    });
    expect(approved.opportunityWorkflows[0]).toMatchObject({
      stage: 'ready-to-prepare',
      selectionReview: {
        routePath: '/templates',
        sections: [{ heading: 'Choose a template' }],
      },
      nextAction: {
        label: 'Prepare implementation brief',
        command: expect.stringContaining(`--id '${reviewedOpportunityId}'`),
      },
    });
    expect(approved.opportunityWorkflows[0]?.nextAction?.command).toContain(
      "--opportunities 'research/opportunities/resume-examples.opportunities.json'",
    );

    const packet = {
      packetId: 'seo.packet.resume-templates',
      projectId: 'true-resume',
      environmentId: 'production',
      preparedAt: '2026-08-04T00:00:00.000Z',
      source: { opportunityReviewObservedAt: '2026-08-04T00:00:00.000Z' },
      selection: { opportunityId: reviewedOpportunityId },
      delivery: { audience: 'coding-agent' },
      measurementPlan: {
        baseline: { status: 'recorded' },
        verificationWindow: {
          notBeforeDaysAfterPublication: 14,
          expiresDaysAfterPublication: 28,
        },
      },
    } as SeoImplementationPacket;
    const prepared = buildMarketingConsoleSeo({
      ...base,
      workflowArtifacts: {
        approvedOpportunityIds: [sourceOpportunityId],
        packets: [{ path: 'research/prepared/resume-templates.implementation.json', packet }],
        publications: [],
        verifications: [],
      },
    });
    expect(prepared.opportunityWorkflows[0]).toMatchObject({
      stage: 'prepared',
      packet: { audience: 'coding-agent', baselineStatus: 'recorded' },
      nextAction: {
        command: expect.stringContaining("--published-url 'REPLACE_WITH_PUBLISHED_URL'"),
      },
    });
    expect(prepared.opportunityWorkflows[0]?.nextAction?.description).toMatch(
      /cannot publish the page/i,
    );

    const stalePacket = {
      ...packet,
      source: { opportunityReviewObservedAt: '2026-08-03T00:00:00.000Z' },
    } as SeoImplementationPacket;
    const refreshedReview = buildMarketingConsoleSeo({
      ...base,
      workflowArtifacts: {
        approvedOpportunityIds: [sourceOpportunityId],
        packets: [
          {
            path: 'research/prepared/resume-templates.implementation.json',
            packet: stalePacket,
          },
        ],
        publications: [],
        verifications: [],
      },
    });
    expect(refreshedReview.opportunityWorkflows[0]).toMatchObject({
      stage: 'ready-to-prepare',
      nextAction: { label: 'Prepare implementation brief' },
    });

    const publication = {
      publicationId: 'seo.publication.resume-templates',
      packet: { packetId: packet.packetId },
      projectId: 'true-resume',
      environmentId: 'production',
      opportunity: { id: sourceOpportunityId },
      publishedUrl: 'https://example.com/templates',
      publishedAt: '2026-08-04T00:00:00.000Z',
      recordedAt: '2026-08-04T01:00:00.000Z',
      review: { recordedBy: 'operator' },
      verification: {
        notBeforeAt: '2026-08-18T00:00:00.000Z',
        expiresAt: '2026-09-01T00:00:00.000Z',
      },
    } as SeoPublicationRecord;
    const verification = {
      verificationId: 'seo.verification.resume-templates',
      publicationId: publication.publicationId,
      observedAt: '2026-08-20T00:00:00.000Z',
      outcome: 'mixed',
      windowState: 'eligible',
      summary: 'Clicks improved while average position declined.',
      limitations: ['The result is observational.'],
      nextStep: 'Review the changed metrics before making another page change.',
      causalClaim: 'not-established',
    } as SeoPublicationVerification;
    const measured = buildMarketingConsoleSeo({
      ...base,
      workflowArtifacts: {
        approvedOpportunityIds: [sourceOpportunityId],
        packets: [{ path: 'research/prepared/resume-templates.implementation.json', packet }],
        publications: [{ path: 'research/publications/resume-templates.json', publication }],
        verifications: [{ path: 'research/verifications/resume-templates.json', verification }],
      },
    });
    expect(measured.opportunityWorkflows[0]).toMatchObject({
      stage: 'needs-attention',
      verification: { outcome: 'mixed', causalClaim: 'not-established' },
      nextAction: { label: 'Refresh measurement' },
    });
  });
});
