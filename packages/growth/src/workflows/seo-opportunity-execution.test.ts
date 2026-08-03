import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
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
          snapshots: [{ keyword: 'resume templates', country: 'US', language: 'en' }],
        }),
      );
      await writeFile(
        path.join(root, 'page-audits', 'pages.json'),
        JSON.stringify({ audits: [{ routePath: '/templates', score: 80 }] }),
      );

      const output = await createGrowthSeoOpportunityExecutor()({
        cwd,
        researchRoot: 'research',
        projectId: 'true-resume',
        environmentId: 'production',
        principal: { kind: 'agent', id: 'agent.codex' },
        maxAgeDays: 30,
      });
      expect(output.opportunities[0]).toMatchObject({
        id: 'resume-templates',
        market: 'US / en',
        confidence: 'high',
      });
      expect(new Set(output.evidence.map((item) => item.kind))).toEqual(
        new Set(['page', 'keyword', 'competitor', 'serp']),
      );
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
  });

  it('preserves attention and blocked decisions from the action', async () => {
    expect((await execute([candidate('stale')])).status).toBe('attention');
    const blocked = await execute([]);
    expect(blocked.status).toBe('blocked');
    expect(formatGrowthSeoOpportunityResearch(blocked)).toContain('needs recorded research');
  });
});
