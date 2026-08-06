import { describe, expect, it } from 'vitest';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { SeoOpportunityCandidate } from '../playbooks/seo-opportunity-research.js';
import type { PageOpportunityFile } from '../seo/schema/opportunity.js';
import { createGrowthSeoOpportunityExecutor } from './seo-opportunity-execution.js';
import { prepareSeoOpportunityArtifacts } from './seo-opportunity-preparation.js';

const now = new Date('2026-08-04T00:00:00.000Z');

const opportunityFile: PageOpportunityFile = {
  version: 1,
  platformId: 'true-resume',
  sourcePatternPack: 'resume',
  basePath: '/templates',
  opportunities: [
    {
      id: 'true-resume:cluster:resume-templates:page',
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
      totalVolume: 10_000,
      sections: [
        {
          id: 'formats',
          heading: 'Compare resume formats',
          purpose: 'Explain when each format fits.',
          required: true,
        },
      ],
      internalLinks: [{ label: 'Resume builder', path: '/builder' }],
      cta: { label: 'Build my resume', target: '/builder' },
      rationale: 'Recorded research supports this page.',
    },
  ],
};

const candidate: SeoOpportunityCandidate = {
  id: 'true-resume-cluster-resume-templates-page',
  title: 'Resume templates',
  routePath: '/templates',
  primaryKeyword: 'resume templates',
  market: 'US / en',
  intent: 'commercial',
  rationale: 'Recorded evidence supports the templates page.',
  signals: { estimatedMonthlySearches: 10_000, competitionIndex: 24, marketFit: 'strong' },
  evidence: ['keyword', 'market', 'serp', 'page'].map((kind) => ({
    evidenceId: `resume-templates.${kind}`,
    revision: 1,
    kind: kind as 'keyword' | 'market' | 'serp' | 'page',
    source: `${kind} research`,
    observedAt: now.toISOString(),
    freshness: 'fresh' as const,
    summary: `Recorded ${kind} evidence.`,
    sampleData: false,
    limitations: [],
    issues: [],
    status: 'current' as const,
  })),
};

async function review() {
  return createGrowthSeoOpportunityExecutor({ loadCandidates: () => [candidate] })({
    cwd: '/workspace',
    projectId: 'true-resume',
    environmentId: 'production',
    principal: { kind: 'user', id: 'user.test' },
    now,
  });
}

describe('SEO opportunity preparation artifacts', () => {
  it('previews deterministic JSON and Markdown paths without writing', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'seo-preparation-'));
    try {
      const result = await prepareSeoOpportunityArtifacts({
        cwd,
        opportunitySource: 'research/opportunities.json',
        outputDir: 'prepared',
        opportunityId: 'true-resume-cluster-resume-templates-page',
        opportunityFile,
        review: await review(),
        preparedAt: now,
        dryRun: true,
      });

      expect(result).toMatchObject({
        jsonPath: 'prepared/templates.implementation.json',
        markdownPath: 'prepared/templates.implementation.md',
        dryRun: true,
      });
      await expect(access(path.join(cwd, result.jsonPath))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('writes equivalent versioned JSON and human-readable Markdown', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'seo-preparation-'));
    try {
      const result = await prepareSeoOpportunityArtifacts({
        cwd,
        opportunitySource: 'research/opportunities.json',
        outputDir: 'prepared',
        opportunityId: 'true-resume-cluster-resume-templates-page',
        opportunityFile,
        review: await review(),
        preparedAt: now,
        audience: 'content-team',
      });
      const json = JSON.parse(await readFile(path.join(cwd, result.jsonPath), 'utf8'));
      const markdown = await readFile(path.join(cwd, result.markdownPath), 'utf8');

      expect(json).toEqual(result.packet);
      expect(json.delivery.audience).toBe('content-team');
      expect(markdown).toContain('# Resume templates');
      expect(markdown).toContain('Implementation approval: not-granted');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('rejects invalid relative verification windows', async () => {
    await expect(
      prepareSeoOpportunityArtifacts({
        cwd: '/workspace',
        opportunitySource: 'research/opportunities.json',
        outputDir: 'prepared',
        opportunityId: 'true-resume-cluster-resume-templates-page',
        opportunityFile,
        review: await review(),
        notBeforeDaysAfterPublication: 28,
        expiresDaysAfterPublication: 14,
        dryRun: true,
      }),
    ).rejects.toThrow(/verification window/);
  });
});
