import { renderToStaticMarkup } from 'react-dom/server';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { describe, expect, it } from 'vitest';
import {
  ClusterResearchDetailsPane,
  CompetitorResearchDetailsPane,
  MarketResearchDetailsPane,
  MetadataExperimentDetailsPane,
  SerpResearchDetailsPane,
} from './research-detail-panes.js';

const keyword = {
  term: 'resume templates',
  normalizedTerm: 'resume templates',
  clusterId: 'templates',
  clusterLabel: 'Resume templates and formats',
  marketCount: 2,
  totalKnownVolume: 368_000,
  bestMarket: 'US / en',
  markets: {},
};

const cluster: MarketingConsoleState['keywordResearch']['clusters'][number] = {
  id: 'templates',
  label: 'Resume templates and formats',
  intent: 'Template discovery',
  recommendedUse: 'Build the category page before expanding paid acquisition.',
  metricCount: 1202,
  totalKnownVolume: 6_745_370,
  averageCompetitionIndex: 50,
  bestMarket: 'US / en',
  bestMarketVolume: 2_000_000,
  marketVolumes: { 'US / en': 2_000_000 },
  topKeywords: [keyword],
};

const markets: MarketingConsoleState['keywordResearch']['markets'] = [
  {
    market: 'US / en',
    country: 'US',
    language: 'en',
    currencyCode: 'USD',
    metricCount: 120,
    totalKnownVolume: 2_000_000,
    averageCompetitionIndex: 60,
    topKeywords: [
      {
        term: 'resume templates',
        normalizedTerm: 'resume templates',
        country: 'US',
        language: 'en',
        currencyCode: 'USD',
        avgMonthlySearches: 368_000,
        competitionIndex: 68,
        lowTopOfPageBidMicros: 1250000,
        highTopOfPageBidMicros: 3500000,
      },
      {
        term: 'build your resume',
        normalizedTerm: 'build your resume',
        country: 'US',
        language: 'en',
        currencyCode: 'INR',
        avgMonthlySearches: 110_000,
        competitionIndex: 58,
        lowTopOfPageBidMicros: 250000000,
        highTopOfPageBidMicros: 600000000,
      },
    ],
  },
  {
    market: 'IN / en',
    country: 'IN',
    language: 'en',
    currencyCode: 'INR',
    metricCount: 80,
    totalKnownVolume: 1_000_000,
    averageCompetitionIndex: 40,
    topKeywords: [],
  },
];

const competitor: MarketingConsoleState['competitorResearch']['domains'][number] = {
  domain: 'resume.io',
  pageCount: 11,
  keywordCount: 11,
  bestPosition: 1,
  pageTypes: ['template'],
  topPatterns: ['builder CTA', 'multiple resume examples'],
  opportunities: ['Explain ATS matching more clearly.'],
};

const snapshot: MarketingConsoleState['seoIntelligence']['serp']['snapshots'][number] = {
  id: 'ats-checker-in-en',
  keyword: 'ats resume checker',
  country: 'IN',
  language: 'en',
  capturedAt: '2026-07-29T12:00:00.000Z',
  intent: 'Users expect a score, parsing feedback, keyword match, and practical fixes.',
  topDomains: ['jobscan.co', 'resumeworded.com'],
  competitorCount: 2,
  resultCount: 10,
  peopleAlsoAsk: ['What is a good ATS score?'],
  opportunities: ['Explain what the checker examines before asking users to start.'],
};

const experiment: MarketingConsoleState['seoIntelligence']['metadata']['experiments'][number] = {
  id: 'ats-title',
  routePath: '/ats-checker',
  status: 'proposed',
  priority: 'p0',
  primaryKeyword: 'ats resume checker',
  currentTitle: 'ATS Checker',
  proposedTitle: 'Free ATS Resume Checker | Score, Keywords, and Job Match',
  currentDescription: 'Check a resume.',
  proposedDescription: 'Check an existing resume against ATS expectations.',
  rationale: 'Make the diagnostic intent explicit.',
  expectedImpact: 'Improve qualified search-result clicks.',
};

describe('SEO research detail panes', () => {
  it('presents cluster planning evidence and estimate limitations', () => {
    const html = renderToStaticMarkup(<ClusterResearchDetailsPane cluster={cluster} />);
    expect(html).toContain('Planning summary');
    expect(html).toContain('Leading keywords');
    expect(html).toContain('Recommended use');
    expect(html).toContain('Planning context');
    expect(html).toContain('US / en: 2,000,000');
    expect(html).toContain('provider estimates');
  });

  it('presents comparative market evidence without turning estimates into a recommendation', () => {
    const html = renderToStaticMarkup(
      <MarketResearchDetailsPane market={markets[0]!} markets={markets} />,
    );
    expect(html).toContain('#1 of 2');
    expect(html).toContain('66.7%');
    expect(html).toContain('10 points higher than the compared-market average');
    expect(html).toContain('368,000 estimated monthly searches');
    expect(html).toContain('Estimated top-of-page bid');
    expect(html).toContain('USD · INR');
    expect(html).toContain('Compare bid estimates only when their currency matches');
    expect(html).toContain('not as automatic approval');
    expect(html).toContain('provider estimates');
  });

  it('presents competitor and SERP evidence without broad unsupported claims', () => {
    const competitorHtml = renderToStaticMarkup(
      <CompetitorResearchDetailsPane competitor={competitor} />,
    );
    const serpHtml = renderToStaticMarkup(<SerpResearchDetailsPane snapshot={snapshot} />);
    expect(competitorHtml).toContain('Recorded coverage');
    expect(competitorHtml).toContain('Supported opportunities');
    expect(competitorHtml).toContain('Recorded page types');
    expect(competitorHtml).toContain('only recorded pages and keywords');
    expect(serpHtml).toContain('Observed intent');
    expect(serpHtml).toContain('Snapshot context');
    expect(serpHtml).toContain('People also ask');
    expect(serpHtml).toContain('Search results can change');
  });

  it('keeps metadata proposals clearly within an experiment and measurement boundary', () => {
    const html = renderToStaticMarkup(<MetadataExperimentDetailsPane experiment={experiment} />);
    expect(html).toContain('Proposed experiment');
    expect(html).toContain('Why test this');
    expect(html).toContain('Expected impact');
    expect(html).toContain('Current title');
    expect(html).toContain('Proposed description');
    expect(html).toContain('remains a hypothesis');
  });
});
