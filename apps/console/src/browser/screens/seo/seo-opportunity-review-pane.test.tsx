import { renderToStaticMarkup } from 'react-dom/server';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { describe, expect, it, vi } from 'vitest';
import { SeoOpportunityReviewPane } from './seo-opportunity-review-pane.js';

type SeoReview = MarketingConsoleState['seo']['opportunityReview'];
type SeoWorkflow = MarketingConsoleState['seo']['opportunityWorkflows'][number];

const opportunity = {
  id: 'resume-templates',
  rank: 1,
  title: 'Resume templates',
  routePath: '/templates',
  primaryKeyword: 'resume templates',
  market: 'US / en',
  score: 88,
  confidence: 'high',
  rationale: 'Recorded research supports this page.',
  limitations: ['Demand remains a provider estimate.'],
  provenance: ['Keyword research'],
  evidenceIds: ['resume-templates.keyword'],
  signals: { estimatedMonthlySearches: 720, competitionIndex: 62 },
} as SeoReview['opportunities'][number];

const evidence = [
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
] as SeoReview['evidence'];

function renderReview(workflow: SeoWorkflow) {
  return renderToStaticMarkup(
    <SeoOpportunityReviewPane
      opportunity={opportunity}
      evidence={[...evidence]}
      workflow={workflow}
      onReviewAction={vi.fn()}
      onResearch={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe('SEO opportunity review pane', () => {
  it('explains the selection decision, exact page plan, evidence, and approval boundary', () => {
    const html = renderReview({
      opportunityId: 'resume-templates',
      stage: 'approval-required',
      status: 'warn',
      stageLabel: 'Selection review required',
      summary: 'Review the exact opportunity before approval.',
      selectionReview: {
        routePath: '/templates',
        title: 'Resume templates',
        h1: 'Professional resume templates',
        metaDescription: 'Choose a resume template.',
        primaryKeyword: 'resume templates',
        supportingKeywords: ['professional resume templates'],
        sections: [
          {
            heading: 'Choose a template',
            purpose: 'Help visitors compare formats.',
            required: true,
          },
        ],
        internalLinks: [{ label: 'Resume builder', path: '/builder' }],
        cta: { label: 'Build my resume', target: '/builder' },
        rationale: 'Recorded demand supports the page.',
      },
      nextAction: {
        id: 'seo.approve.resume-templates',
        label: 'Approve selection',
        description: 'Records the human decision.',
        command: 'unisane growth seo opportunities status',
      },
    });

    expect(html).toContain('Recommended for selection review');
    expect(html).toContain('Decision summary');
    expect(html).toContain('720');
    expect(html).toContain('Proposed page');
    expect(html).toContain('Choose a template');
    expect(html).toContain('Evidence reviewed');
    expect(html).toContain('Demand remains a provider estimate.');
    expect(html).toContain('What approval does');
    expect(html).toContain('does not create, edit, publish, or deploy a page');
    expect(html).toContain('Approve selection');
  });

  it('asks for research before selection when evidence is not reliable enough', () => {
    const html = renderReview({
      opportunityId: 'resume-templates',
      stage: 'research-required',
      status: 'blocked',
      stageLabel: 'Research needs attention',
      summary: 'Resolve unreliable evidence first.',
    });

    expect(html).toContain('Research before deciding');
    expect(html).toContain('not reliable enough for selection yet');
    expect(html).toContain('Research evidence first');
  });
});
