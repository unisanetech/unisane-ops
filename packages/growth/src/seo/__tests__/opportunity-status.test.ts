import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { updateOpportunityStatusFile } from '../opportunities/update-status-file.js';
import { updateOpportunityStatus } from '../opportunities/update-status.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

describe('updateOpportunityStatus', () => {
  it('updates one opportunity status by slug', () => {
    const result = updateOpportunityStatus({
      opportunityFile: createOpportunityFile(),
      match: { slug: 'data-analyst' },
      status: 'approved',
    });

    expect(result.updated).toMatchObject({
      slug: 'data-analyst',
      status: 'approved',
    });
    expect(
      result.opportunityFile.opportunities.find((item) => item.slug === 'teacher'),
    ).toMatchObject({
      status: 'candidate',
    });
  });

  it('throws when no match selector is provided', () => {
    expect(() =>
      updateOpportunityStatus({
        opportunityFile: createOpportunityFile(),
        match: {},
        status: 'approved',
      }),
    ).toThrow('Provide one of');
  });
});

describe('updateOpportunityStatusFile', () => {
  it('writes updated opportunities to the output path', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-status-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile(), null, 2),
      );

      const result = await updateOpportunityStatusFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'opportunities/pages.approved.json',
        slug: 'data-analyst',
        status: 'approved',
      });

      expect(result).toMatchObject({
        updatedSlug: 'data-analyst',
        status: 'approved',
      });
      const output = JSON.parse(
        await readFile(join(cwd, 'opportunities/pages.approved.json'), 'utf8'),
      );
      expect(output.opportunities[0]).toMatchObject({
        slug: 'data-analyst',
        status: 'approved',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-status-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      await updateOpportunityStatusFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'opportunities/pages.approved.json',
        slug: 'data-analyst',
        status: 'approved',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'opportunities/pages.approved.json'))).rejects.toThrow();
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
      createOpportunity('data-analyst', 'Data Analyst'),
      createOpportunity('teacher', 'Teacher'),
    ],
  };
}

function createOpportunity(slug: string, label: string): PageOpportunity {
  return {
    id: `true-resume:cluster:${slug}:page`,
    platformId: 'true-resume',
    clusterId: `true-resume:cluster:${slug}`,
    sourcePatternPack: 'resume-examples',
    status: 'candidate',
    priority: 'p1',
    fit: 'strong',
    intent: 'informational',
    pageType: 'role-page',
    slug,
    routePath: `/resume-examples/${slug}`,
    title: `${label} Resume Examples and Format`,
    h1: `${label} resume examples and format`,
    metaDescription: `Compare ${label.toLowerCase()} resume examples.`,
    primaryKeyword: `${label.toLowerCase()} resume example`,
    supportingKeywords: [],
    sections: [],
    internalLinks: [],
    cta: {
      label: 'Start with this example',
      target: '/resumes/new',
    },
    rationale: `${label} keyword group.`,
  };
}
