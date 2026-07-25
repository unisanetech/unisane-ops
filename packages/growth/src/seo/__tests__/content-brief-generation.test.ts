import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { generateContentBriefFile } from '../briefs/generate-file.js';
import { renderContentBrief } from '../briefs/render-brief.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

describe('renderContentBrief', () => {
  it('renders a compact human-readable brief from an opportunity', () => {
    const markdown = renderContentBrief(createOpportunity());

    expect(markdown).toContain('# Data Analyst Resume Examples and Format');
    expect(markdown).toContain('Route: `/resume-examples/data-analyst`');
    expect(markdown).toContain('- Supporting keywords:');
    expect(markdown).toContain('1. Data Analyst resume examples by experience level');
    expect(markdown).toContain('- All resume examples: `/resume-examples`');
    expect(markdown).toContain(
      '- Do not invent claims, salaries, success rates, or provider data.',
    );
  });
});

describe('generateContentBriefFile', () => {
  it('writes markdown briefs and an index file', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-briefs-'));
    try {
      await mkdir(join(cwd, 'docs/seo/keyword-research/opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'docs/seo/keyword-research/opportunities/resume-examples.json'),
        JSON.stringify(createOpportunityFile(), null, 2),
      );

      const result = await generateContentBriefFile({
        cwd,
        opportunities: 'docs/seo/keyword-research/opportunities/resume-examples.json',
        outputDir: 'docs/seo/keyword-research/briefs/resume-examples',
      });

      expect(result.briefCount).toBe(1);
      const markdown = await readFile(
        join(cwd, 'docs/seo/keyword-research/briefs/resume-examples/data-analyst.md'),
        'utf8',
      );
      const index = JSON.parse(
        await readFile(
          join(cwd, 'docs/seo/keyword-research/briefs/resume-examples/briefs.index.json'),
          'utf8',
        ),
      );
      expect(markdown).toContain('Primary keyword: `data analyst resume example`');
      expect(index.briefs[0]).toMatchObject({
        routePath: '/resume-examples/data-analyst',
        filePath: 'docs/seo/keyword-research/briefs/resume-examples/data-analyst.md',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-briefs-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      await generateContentBriefFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        outputDir: 'briefs',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'briefs/briefs.index.json'))).rejects.toThrow();
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
    opportunities: [createOpportunity()],
  };
}

function createOpportunity(): PageOpportunity {
  return {
    id: 'true-resume:cluster:data-analyst:page',
    platformId: 'true-resume',
    clusterId: 'true-resume:cluster:data-analyst',
    sourcePatternPack: 'resume-examples',
    status: 'candidate',
    priority: 'p0',
    fit: 'strong',
    intent: 'informational',
    pageType: 'role-page',
    slug: 'data-analyst',
    routePath: '/resume-examples/data-analyst',
    title: 'Data Analyst Resume Examples and Format',
    h1: 'Data Analyst resume examples and format',
    metaDescription: 'Compare data analyst resume examples by experience level.',
    primaryKeyword: 'data analyst resume example',
    supportingKeywords: ['data analyst resume', 'data analyst resume format'],
    totalVolume: 1520,
    sections: [
      {
        id: 'examples-by-experience',
        heading: 'Data Analyst resume examples by experience level',
        purpose: 'Show several complete examples for different candidate stages.',
        required: true,
      },
    ],
    internalLinks: [
      {
        label: 'All resume examples',
        path: '/resume-examples',
      },
    ],
    cta: {
      label: 'Start with this example',
      target: '/resumes/new',
    },
    rationale: 'Data Analyst groups related resume example keywords.',
  };
}
