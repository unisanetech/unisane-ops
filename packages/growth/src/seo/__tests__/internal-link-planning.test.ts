import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { planInternalLinkFile } from '../internal-links/plan-file.js';
import { planInternalLinks } from '../internal-links/plan-links.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

describe('planInternalLinks', () => {
  it('creates hub, related, and conversion links without orphaning detail pages', () => {
    const plan = planInternalLinks({
      opportunityFile: createOpportunityFile(),
      includeConversionLinks: true,
    });

    expect(plan).toMatchObject({
      version: 1,
      platformId: 'true-resume',
      sourcePatternPack: 'resume-examples',
      hubPath: '/resume-examples',
      orphanPaths: [],
    });
    expect(plan.pages).toHaveLength(3);
    expect(plan.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromPath: '/resume-examples',
          toPath: '/resume-examples/data-analyst',
          type: 'hub',
        }),
        expect.objectContaining({
          fromPath: '/resume-examples/data-analyst',
          toPath: '/resume-examples',
          type: 'hub',
        }),
        expect.objectContaining({
          fromPath: '/resume-examples/data-analyst',
          toPath: '/resumes/new',
          type: 'conversion',
        }),
      ]),
    );
  });

  it('does not create related links for unrelated terms when max related is zero', () => {
    const plan = planInternalLinks({
      opportunityFile: createOpportunityFile(),
      maxRelated: 0,
    });

    expect(plan.edges.every((edge) => edge.type !== 'related')).toBe(true);
  });
});

describe('planInternalLinkFile', () => {
  it('writes internal link plan JSON', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-links-'));
    try {
      await mkdir(join(cwd, 'docs/seo/keyword-research/opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'docs/seo/keyword-research/opportunities/resume-examples.json'),
        JSON.stringify(createOpportunityFile(), null, 2),
      );

      const result = await planInternalLinkFile({
        cwd,
        opportunities: 'docs/seo/keyword-research/opportunities/resume-examples.json',
        output: 'docs/seo/keyword-research/internal-links/resume-examples-links.json',
      });

      expect(result).toMatchObject({
        pageCount: 3,
        orphanCount: 0,
      });
      const output = JSON.parse(
        await readFile(
          join(cwd, 'docs/seo/keyword-research/internal-links/resume-examples-links.json'),
          'utf8',
        ),
      );
      expect(output.edges.length).toBeGreaterThan(0);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-links-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      await planInternalLinkFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'internal-links/result.json',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'internal-links/result.json'))).rejects.toThrow();
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
      createOpportunity('data-analyst', 'Data Analyst', 1200, ['business analyst resume example']),
      createOpportunity('business-analyst', 'Business Analyst', 800, [
        'data analyst resume example',
      ]),
      createOpportunity('teacher', 'Teacher', 500, ['education resume example']),
    ],
  };
}

function createOpportunity(
  slug: string,
  label: string,
  totalVolume: number,
  supportingKeywords: string[],
): PageOpportunity {
  return {
    id: `true-resume:cluster:${slug}:page`,
    platformId: 'true-resume',
    clusterId: `true-resume:cluster:${slug}`,
    sourcePatternPack: 'resume-examples',
    status: 'candidate',
    priority: totalVolume >= 1000 ? 'p0' : 'p1',
    fit: 'strong',
    intent: 'informational',
    pageType: 'role-page',
    slug,
    routePath: `/resume-examples/${slug}`,
    title: `${label} Resume Examples and Format`,
    h1: `${label} resume examples and format`,
    metaDescription: `Compare ${label.toLowerCase()} resume examples.`,
    primaryKeyword: `${label.toLowerCase()} resume example`,
    supportingKeywords,
    totalVolume,
    sections: [],
    internalLinks: [],
    cta: {
      label: 'Start with this example',
      target: '/resumes/new',
    },
    rationale: `${label} keyword group.`,
  };
}
