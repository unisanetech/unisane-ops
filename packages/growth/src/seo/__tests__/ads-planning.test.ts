import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planAdsFile, planAdsFromOpportunities } from '../index.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

describe('planAdsFromOpportunities', () => {
  it('creates ad groups from approved and built page opportunities', () => {
    const plan = planAdsFromOpportunities({
      opportunityFile: createOpportunityFile(),
      maxKeywordsPerAdGroup: 2,
    });

    expect(plan).toMatchObject({
      version: 1,
      platformId: 'true-resume',
      sourcePatternPack: 'resume-examples',
      statusFilter: 'approved-or-built',
    });
    expect(plan.adGroups.map((group) => group.opportunitySlug)).toEqual([
      'data-analyst',
      'product-manager',
    ]);
    expect(plan.adGroups[0]?.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'data analyst resume example',
          matchType: 'exact',
          landingPage: '/resume-examples/data-analyst',
        }),
        expect.objectContaining({
          keyword: 'data analyst resume format',
          matchType: 'phrase',
        }),
      ]),
    );
  });

  it('can include every opportunity for planning scenarios', () => {
    const plan = planAdsFromOpportunities({
      opportunityFile: createOpportunityFile(),
      statusFilter: 'all',
    });

    expect(plan.adGroups).toHaveLength(3);
  });
});

describe('planAdsFile', () => {
  it('writes ads plan JSON', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-ads-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      const result = await planAdsFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'ads/plan.json',
        status: 'approved',
      });
      const output = JSON.parse(await readFile(join(cwd, 'ads/plan.json'), 'utf8'));

      expect(result).toMatchObject({
        adGroupCount: 1,
        statusFilter: 'approved',
      });
      expect(output.adGroups[0]).toMatchObject({
        opportunitySlug: 'data-analyst',
        landingPage: '/resume-examples/data-analyst',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-ads-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      await planAdsFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'ads/plan.json',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'ads/plan.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createOpportunityFile(): PageOpportunityFile {
  return {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    basePath: 'resume-examples',
    opportunities: [
      createOpportunity('data-analyst', 'Data Analyst', 'approved'),
      createOpportunity('product-manager', 'Product Manager', 'built'),
      createOpportunity('teacher', 'Teacher', 'candidate'),
    ],
  };
}

function createOpportunity(
  slug: string,
  label: string,
  status: PageOpportunity['status'],
): PageOpportunity {
  return {
    id: `true-resume:cluster:${slug}:page`,
    platformId: 'true-resume',
    clusterId: `true-resume:cluster:${slug}`,
    sourcePatternPack: 'resume-examples',
    status,
    priority: 'p1',
    fit: 'strong',
    intent: 'commercial',
    pageType: 'role-page',
    slug,
    routePath: `/resume-examples/${slug}`,
    title: `${label} Resume Examples`,
    h1: `${label} resume examples`,
    metaDescription: `Compare ${label.toLowerCase()} resume examples.`,
    primaryKeyword: `${label.toLowerCase()} resume example`,
    supportingKeywords: [
      `${label.toLowerCase()} resume format`,
      `${label.toLowerCase()} resume template`,
    ],
    totalVolume: 1000,
    sections: [],
    internalLinks: [],
    cta: {
      label: 'Start with this example',
      target: '/resumes/new',
    },
    rationale: `${label} keyword group.`,
  };
}
