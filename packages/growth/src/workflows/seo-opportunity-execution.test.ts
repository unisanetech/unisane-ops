import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { SeoOpportunityCandidate } from '../playbooks/index.js';
import {
  createGrowthSeoOpportunityExecutor,
  formatGrowthSeoOpportunityResearch,
} from './seo-opportunity-execution.js';

const now = new Date('2026-08-03T00:00:00.000Z');

function candidate(freshness: 'fresh' | 'stale'): SeoOpportunityCandidate {
  return {
    id: 'resume-templates',
    title: 'Resume templates',
    routePath: '/templates',
    primaryKeyword: 'resume templates',
    market: 'US / en',
    intent: 'commercial',
    rationale: 'Recorded research supports a focused templates page.',
    signals: { estimatedMonthlySearches: 10_000, marketFit: 'strong' },
    evidence: [
      {
        evidenceId: 'resume-templates.keyword',
        revision: 1,
        kind: 'keyword',
        source: 'Recorded keyword cluster',
        observedAt: now.toISOString(),
        freshness,
        summary: 'Recorded keyword evidence.',
        sampleData: false,
        limitations: [],
        issues: [],
        status: 'current',
      },
      {
        evidenceId: 'resume-templates.serp',
        revision: 1,
        kind: 'serp',
        source: 'Recorded search results',
        observedAt: now.toISOString(),
        freshness,
        summary: 'Recorded search-result evidence.',
        sampleData: false,
        limitations: [],
        issues: [],
        status: 'current',
      },
    ],
  };
}

function execute(candidates: SeoOpportunityCandidate[]) {
  return createGrowthSeoOpportunityExecutor({ loadCandidates: () => candidates })({
    cwd: '/workspace',
    projectId: 'true-resume',
    environmentId: 'production',
    principal: { kind: 'agent', id: 'agent.codex' },
    opportunityLimit: 1,
    now,
  });
}

describe('SEO opportunity execution', () => {
  it('loads and reconciles recorded opportunity, keyword, competitor, SERP, and page evidence', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'growth-seo-opportunity-'));
    const root = path.join(cwd, 'research');
    try {
      for (const directory of ['opportunities', 'clusters', 'competitors', 'serp', 'page-audits']) {
        await mkdir(path.join(root, directory), { recursive: true });
      }
      await writeFile(
        path.join(root, 'seo-research.config.json'),
        JSON.stringify({
          version: 2,
          platformId: 'true-resume',
          markets: [{ country: 'US', language: 'en' }],
          site: {
            url: 'https://trueresume.example/',
            ownershipConfirmedAt: '2026-08-01T00:00:00.000Z',
          },
        }),
      );
      await writeFile(
        path.join(root, 'opportunities', 'pages.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          sourcePatternPack: 'resume',
          basePath: 'templates',
          opportunities: [
            {
              id: 'resume-templates',
              platformId: 'true-resume',
              clusterId: 'templates',
              sourcePatternPack: 'resume',
              status: 'candidate',
              priority: 'p0',
              fit: 'strong',
              intent: 'commercial',
              pageType: 'category',
              slug: 'templates',
              routePath: '/templates',
              title: 'Resume templates',
              h1: 'Resume templates',
              metaDescription: 'Build a resume.',
              primaryKeyword: 'resume templates',
              supportingKeywords: ['resume formats'],
              totalVolume: 10000,
              sections: [],
              internalLinks: [],
              cta: { label: 'Build', target: '/builder' },
              rationale: 'Recorded research supports this page.',
            },
            {
              id: 'resume-builder',
              platformId: 'true-resume',
              clusterId: 'builder',
              sourcePatternPack: 'resume',
              status: 'candidate',
              priority: 'p1',
              fit: 'strong',
              intent: 'commercial',
              pageType: 'landing',
              slug: 'builder',
              routePath: '/builder',
              title: 'Resume builder',
              h1: 'Resume builder',
              metaDescription: 'Build a resume online.',
              primaryKeyword: 'resume builder',
              supportingKeywords: [],
              sections: [],
              internalLinks: [],
              cta: { label: 'Build', target: '/builder' },
              rationale: 'The current builder page needs reliable crawl evidence.',
            },
            {
              id: 'resume-checklist',
              platformId: 'true-resume',
              clusterId: 'checklist',
              sourcePatternPack: 'resume',
              status: 'candidate',
              priority: 'p2',
              fit: 'medium',
              intent: 'informational',
              pageType: 'guide',
              slug: 'resume-checklist',
              routePath: '/resume-checklist',
              title: 'Resume checklist',
              h1: 'Resume checklist',
              metaDescription: 'Review a practical resume checklist.',
              primaryKeyword: 'resume checklist',
              supportingKeywords: [],
              sections: [],
              internalLinks: [],
              cta: { label: 'Build', target: '/builder' },
              rationale: 'Recorded research proposes a new checklist page.',
            },
            {
              id: 'resume-data-analyst',
              platformId: 'true-resume',
              clusterId: 'data-analyst',
              sourcePatternPack: 'resume',
              status: 'candidate',
              priority: 'p1',
              fit: 'strong',
              intent: 'commercial',
              pageType: 'role-page',
              slug: 'data-analyst',
              routePath: '/resume-examples/data-analyst',
              title: 'Data analyst resume examples',
              h1: 'Data analyst resume examples',
              metaDescription: 'Review data analyst resume examples.',
              primaryKeyword: 'data analyst resume examples',
              supportingKeywords: [],
              sections: [],
              internalLinks: [],
              cta: { label: 'Build', target: '/builder' },
              rationale: 'Recorded research proposes a role page.',
            },
          ],
        }),
      );
      await writeFile(
        path.join(root, 'clusters', 'clusters.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          sourcePatternPack: 'resume',
          clusters: [
            {
              id: 'templates',
              label: 'Templates',
              platformId: 'true-resume',
              intent: 'commercial',
              pageType: 'category',
              primaryKeyword: 'resume templates',
              secondaryKeywords: ['resume formats'],
              totalVolume: 10000,
              metricEvidence: {
                provider: 'google-ads',
                country: 'US',
                language: 'en',
                observedAt: '2026-08-02T00:00:00.000Z',
                matchedMetricCount: 2,
                keywordCount: 2,
                primaryCompetitionIndex: 52,
                sourceRunId: 'keyword-plan.1',
                sampleData: false,
              },
              priority: 'p0',
              rationale: 'Supported cluster.',
              fit: 'strong',
              status: 'candidate',
            },
          ],
        }),
      );
      await writeFile(
        path.join(root, 'competitors', 'competitors.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          market: 'US / en',
          source: 'manual',
          evidence: {
            observedAt: '2026-08-02T00:00:00.000Z',
            sampleData: false,
            limitations: [],
            failures: [],
          },
          pages: [
            {
              id: 'competitor',
              platformId: 'true-resume',
              source: 'manual',
              keyword: 'resume templates',
              url: 'https://example.com/templates',
              domain: 'example.com',
              categoryPath: [],
              contentPatterns: [],
            },
          ],
        }),
      );
      await writeFile(
        path.join(root, 'serp', 'serp.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          source: 'provider-export',
          sampleData: false,
          limitations: [],
          snapshots: [
            {
              keyword: 'resume templates',
              country: 'US',
              language: 'en',
              capturedAt: '2026-08-02T00:00:00.000Z',
            },
          ],
        }),
      );
      await writeFile(
        path.join(root, 'page-audits', 'page-evidence.latest.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          siteUrl: 'https://trueresume.example/',
          targetMarkets: [{ country: 'US', language: 'en' }],
          generatedAt: '2026-08-03T00:00:00.000Z',
          sources: {
            crawl: {
              snapshotId: 'crawl.production',
              observedAt: '2026-08-03T00:00:00.000Z',
              freshUntil: '2026-08-04T00:00:00.000Z',
              truncated: false,
              failureCount: 0,
            },
            searchConsole: {
              property: 'sc-domain:trueresume.example',
              dateRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
              evidence: {
                acquisition: 'api',
                sampleData: false,
                observedAt: '2026-08-03T00:00:00.000Z',
                freshUntil: '2026-08-04T00:00:00.000Z',
                limitations: ['Previous-period comparison is not available.'],
              },
            },
          },
          sampleData: false,
          freshness: {
            freshUntil: '2026-08-04T00:00:00.000Z',
            staleSources: [],
          },
          limitations: ['Previous-period comparison is not available.'],
          summary: {
            pageCount: 2,
            crawledPageCount: 1,
            crawlFailurePageCount: 1,
            performanceOnlyPageCount: 0,
            searchEvidencePageCount: 1,
            analyticsEvidencePageCount: 0,
          },
          pages: [
            {
              id: 'page.templates',
              url: 'https://trueresume.example/templates',
              path: '/templates',
              crawl: {
                state: 'available',
                fetchedAt: '2026-08-03T00:00:00.000Z',
                statusCode: 200,
                fetchState: 'fresh',
                indexability: 'indexable',
                title: 'Resume templates',
                h1: 'Resume templates',
                wordCount: 900,
                internalLinkCount: 12,
                externalLinkCount: 2,
                canonical: {
                  state: 'self',
                  url: 'https://trueresume.example/templates',
                },
                robotsDirectives: [],
                schemaTypes: ['WebPage'],
              },
              search: {
                state: 'available',
                rowCount: 2,
                queryCount: 2,
                clicks: 5,
                impressions: 100,
                ctr: 0.05,
                averagePosition: 12,
              },
              analytics: { state: 'not-recorded' },
              evidence: {
                sampleData: false,
                stale: false,
                freshUntil: '2026-08-04T00:00:00.000Z',
                limitations: ['Previous-period comparison is not available.'],
              },
            },
            {
              id: 'page.builder',
              url: 'https://trueresume.example/builder',
              path: '/builder',
              crawl: {
                state: 'failed',
                failures: [{ code: 'timeout', message: 'The page request timed out.' }],
                indexability: 'unknown',
                canonical: { state: 'not-recorded' },
              },
              search: { state: 'not-present-in-source' },
              analytics: { state: 'not-recorded' },
              evidence: {
                sampleData: false,
                stale: false,
                freshUntil: '2026-08-04T00:00:00.000Z',
                limitations: ['The page crawl failed.'],
              },
            },
            {
              id: 'page.data-analyst',
              url: 'https://trueresume.example/resume-examples/data-analyst-resume',
              path: '/resume-examples/data-analyst-resume',
              crawl: {
                state: 'available',
                fetchedAt: '2026-08-03T00:00:00.000Z',
                statusCode: 200,
                fetchState: 'fresh',
                indexability: 'indexable',
                title: 'Data analyst resume examples',
                h1: 'Data analyst resume examples',
                wordCount: 800,
                internalLinkCount: 8,
                externalLinkCount: 1,
                canonical: {
                  state: 'self',
                  url: 'https://trueresume.example/resume-examples/data-analyst-resume',
                },
                robotsDirectives: [],
                schemaTypes: ['WebPage'],
              },
              search: { state: 'not-present-in-source' },
              analytics: { state: 'not-recorded' },
              evidence: {
                sampleData: false,
                stale: false,
                freshUntil: '2026-08-04T00:00:00.000Z',
                limitations: [],
              },
            },
          ],
        }),
      );

      const output = await createGrowthSeoOpportunityExecutor()({
        cwd,
        researchRoot: 'research',
        projectId: 'true-resume',
        environmentId: 'production',
        principal: { kind: 'agent', id: 'agent.codex' },
        maxAgeDays: 30,
        now: new Date('2026-08-03T12:00:00.000Z'),
      });
      expect(output.opportunities[0]).toMatchObject({
        id: 'resume-templates',
        market: 'US / en',
        confidence: 'high',
        signals: {
          estimatedMonthlySearches: 10000,
          competitionIndex: 52,
          currentPosition: 12,
          currentClicks: 5,
          currentImpressions: 100,
          currentCtr: 0.05,
        },
      });
      expect(new Set(output.evidence.map((item) => item.kind))).toEqual(
        new Set(['page', 'keyword', 'competitor', 'serp']),
      );
      expect(output.opportunities[0]?.limitations).toContain(
        'Previous-period comparison is not available.',
      );
      expect(output.opportunities[0]?.limitations).toContain(
        'Keyword demand and competition are provider estimates, not observed site outcomes.',
      );
      expect(output.evidence.find((item) => item.kind === 'keyword')).toMatchObject({
        observedAt: '2026-08-02T00:00:00.000Z',
        freshness: 'fresh',
      });
      expect(
        output.opportunities.find((item) => item.id === 'resume-builder')?.limitations,
      ).toEqual(
        expect.arrayContaining([
          'The page crawl failed.',
          'The matching page could not be crawled, so its current page facts are unknown.',
        ]),
      );
      expect(
        output.opportunities.find((item) => item.id === 'resume-checklist')?.limitations,
      ).toContain(
        'No current page in the inventory matches this proposed route or primary keyword.',
      );
      expect(
        output.opportunities.find((item) => item.id === 'resume-data-analyst')?.limitations,
      ).toContain(
        'The proposed route differs from the current page matched by primary keyword; resolve the target before acting.',
      );

      const pageEvidencePath = path.join(root, 'page-audits', 'page-evidence.latest.json');
      const recordedPageEvidence = JSON.parse(await readFile(pageEvidencePath, 'utf8'));
      await writeFile(
        pageEvidencePath,
        JSON.stringify({ ...recordedPageEvidence, siteUrl: 'https://another.example/' }),
      );
      await expect(
        createGrowthSeoOpportunityExecutor()({
          cwd,
          researchRoot: 'research',
          projectId: 'true-resume',
          environmentId: 'production',
          principal: { kind: 'agent', id: 'agent.codex' },
          maxAgeDays: 30,
          now: new Date('2026-08-03T12:00:00.000Z'),
        }),
      ).rejects.toThrow('does not match configured site');

      await writeFile(
        pageEvidencePath,
        JSON.stringify({
          ...recordedPageEvidence,
          targetMarkets: [{ country: 'IN', language: 'en' }],
        }),
      );
      await expect(
        createGrowthSeoOpportunityExecutor()({
          cwd,
          researchRoot: 'research',
          projectId: 'true-resume',
          environmentId: 'production',
          principal: { kind: 'agent', id: 'agent.codex' },
          maxAgeDays: 30,
          now: new Date('2026-08-03T12:00:00.000Z'),
        }),
      ).rejects.toThrow('target markets do not match');

      await writeFile(
        pageEvidencePath,
        JSON.stringify({ ...recordedPageEvidence, platformId: 'another-platform' }),
      );
      await expect(
        createGrowthSeoOpportunityExecutor()({
          cwd,
          researchRoot: 'research',
          projectId: 'true-resume',
          environmentId: 'production',
          principal: { kind: 'agent', id: 'agent.codex' },
          maxAgeDays: 30,
          now: new Date('2026-08-03T12:00:00.000Z'),
        }),
      ).rejects.toThrow('does not match the recorded opportunities');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('projects the same ready result for structured and human surfaces', async () => {
    const output = await execute([candidate('fresh')]);
    expect(output).toMatchObject({ status: 'ready', returnedOpportunityCount: 1 });
    expect(formatGrowthSeoOpportunityResearch(output)).toContain(
      output.workflow.presentation.headline,
    );
    expect(formatGrowthSeoOpportunityResearch(output)).toContain('Targeted research needed:');
    expect(formatGrowthSeoOpportunityResearch(output)).toContain(
      'Research runs only after an explicit user request or admitted automation.',
    );
  });

  it('preserves attention and blocked decisions from the action', async () => {
    expect((await execute([candidate('stale')])).status).toBe('attention');
    const blocked = await execute([]);
    expect(blocked.status).toBe('blocked');
    expect(formatGrowthSeoOpportunityResearch(blocked)).toContain('needs recorded research');
  });

  it('does not treat derived-file mtime as keyword-demand freshness', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'growth-seo-demand-provenance-'));
    const root = path.join(cwd, 'research');
    try {
      for (const directory of ['opportunities', 'clusters']) {
        await mkdir(path.join(root, directory), { recursive: true });
      }
      await writeFile(
        path.join(root, 'opportunities', 'pages.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          sourcePatternPack: 'resume',
          basePath: 'templates',
          opportunities: [
            {
              id: 'resume-templates',
              platformId: 'true-resume',
              clusterId: 'templates',
              sourcePatternPack: 'resume',
              status: 'candidate',
              priority: 'p0',
              fit: 'strong',
              intent: 'commercial',
              pageType: 'category',
              slug: 'templates',
              routePath: '/templates',
              title: 'Resume templates',
              h1: 'Resume templates',
              metaDescription: 'Build a resume.',
              primaryKeyword: 'resume templates',
              supportingKeywords: [],
              totalVolume: 10000,
              sections: [],
              internalLinks: [],
              cta: { label: 'Build', target: '/builder' },
              rationale: 'Recorded research supports this page.',
            },
          ],
        }),
      );
      await writeFile(
        path.join(root, 'clusters', 'clusters.json'),
        JSON.stringify({
          version: 1,
          platformId: 'true-resume',
          sourcePatternPack: 'resume',
          clusters: [
            {
              id: 'templates',
              label: 'Templates',
              platformId: 'true-resume',
              intent: 'commercial',
              pageType: 'category',
              primaryKeyword: 'resume templates',
              secondaryKeywords: [],
              totalVolume: 10000,
              metricEvidence: {
                provider: 'google-ads',
                country: 'US',
                language: 'en',
                observedAt: '2026-05-01T00:00:00.000Z',
                matchedMetricCount: 1,
                keywordCount: 1,
                sampleData: false,
              },
              priority: 'p0',
              rationale: 'Supported cluster.',
              fit: 'strong',
              status: 'candidate',
            },
          ],
        }),
      );

      const output = await createGrowthSeoOpportunityExecutor()({
        cwd,
        researchRoot: 'research',
        projectId: 'true-resume',
        environmentId: 'production',
        principal: { kind: 'agent', id: 'agent.codex' },
        maxAgeDays: 30,
        now: new Date('2026-08-03T00:00:00.000Z'),
      });

      expect(output.status).toBe('attention');
      expect(output.evidence.find((item) => item.kind === 'keyword')).toMatchObject({
        observedAt: '2026-05-01T00:00:00.000Z',
        freshness: 'stale',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
