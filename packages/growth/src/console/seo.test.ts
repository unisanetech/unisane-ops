import { describe, expect, it } from 'vitest';
import type {
  MarketingConsoleCompetitorResearchSummary,
  MarketingConsoleFaqResearchSummary,
  MarketingConsoleKeywordResearchSummary,
  MarketingConsoleSeoIntelligenceSummary,
} from './contracts.js';
import { buildMarketingConsoleSeo } from './seo.js';

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
        title: 'Improve Executive template for searches already finding it',
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
              warnings: ['Missing structured data'],
              recommendations: [],
            },
          ],
        },
      },
    });

    expect(result.siteHealth).toEqual(
      expect.objectContaining({
        available: true,
        status: 'blocked',
        headline: '2 search visibility issues need attention.',
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
});
