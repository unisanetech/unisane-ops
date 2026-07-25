import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { planPageOpportunityFile } from '../opportunities/plan-file.js';
import { planPageOpportunities } from '../opportunities/plan-opportunities.js';
import type { KeywordClusterFile } from '../schema/cluster.js';

describe('planPageOpportunities', () => {
  it('turns keyword clusters into deterministic page opportunity records', () => {
    const planned = planPageOpportunities({
      clusterFile: createClusterFile(),
    });

    expect(planned).toMatchObject({
      version: 1,
      platformId: 'true-resume',
      sourcePatternPack: 'resume-examples',
      basePath: 'resume-examples',
    });
    expect(planned.opportunities).toHaveLength(1);
    expect(planned.opportunities[0]).toMatchObject({
      slug: 'data-analyst',
      routePath: '/resume-examples/data-analyst',
      title: 'Data Analyst Resume Examples and Format',
      h1: 'Data Analyst resume examples and format',
      primaryKeyword: 'data analyst resume example',
      supportingKeywords: ['data analyst resume', 'data analyst resume format'],
      cta: {
        label: 'Start with this example',
        target: '/resumes/new',
      },
      status: 'candidate',
    });
    expect(planned.opportunities[0]?.sections.map((section) => section.id)).toEqual([
      'examples-by-experience',
      'what-to-include',
      'format-tips',
      'related-examples',
      'start-with-example',
    ]);
  });

  it('supports base path and CTA overrides', () => {
    const planned = planPageOpportunities({
      clusterFile: createClusterFile(),
      basePath: '/examples/',
      ctaLabel: 'Create this resume',
      ctaTarget: '/resume/new?source=examples',
    });

    expect(planned.basePath).toBe('examples');
    expect(planned.opportunities[0]).toMatchObject({
      routePath: '/examples/data-analyst',
      cta: {
        label: 'Create this resume',
        target: '/resume/new?source=examples',
      },
    });
  });
});

describe('planPageOpportunityFile', () => {
  it('writes opportunity JSON from a cluster file', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-opportunities-'));
    try {
      await mkdir(join(cwd, 'docs/seo/keyword-research/clusters'), { recursive: true });
      await mkdir(join(cwd, 'docs/seo/keyword-research/opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'docs/seo/keyword-research/clusters/resume-examples-clusters.json'),
        JSON.stringify(createClusterFile(), null, 2),
      );

      const result = await planPageOpportunityFile({
        cwd,
        clusters: 'docs/seo/keyword-research/clusters/resume-examples-clusters.json',
        output: 'docs/seo/keyword-research/opportunities/resume-examples-opportunities.json',
      });

      expect(result.opportunityCount).toBe(1);
      const output = JSON.parse(
        await readFile(
          join(cwd, 'docs/seo/keyword-research/opportunities/resume-examples-opportunities.json'),
          'utf8',
        ),
      );
      expect(output.opportunities[0]).toMatchObject({
        routePath: '/resume-examples/data-analyst',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-opportunities-'));
    try {
      await mkdir(join(cwd, 'clusters'), { recursive: true });
      await writeFile(join(cwd, 'clusters/clusters.json'), JSON.stringify(createClusterFile()));

      await planPageOpportunityFile({
        cwd,
        clusters: 'clusters/clusters.json',
        output: 'opportunities/result.json',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'opportunities/result.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createClusterFile(): KeywordClusterFile {
  return {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    metricSource: 'csv-import',
    clusters: [
      {
        id: 'true-resume:cluster:data-analyst',
        label: 'Data Analyst',
        platformId: 'true-resume',
        intent: 'informational',
        pageType: 'role-page',
        primaryKeyword: 'data analyst resume example',
        secondaryKeywords: ['data analyst resume', 'data analyst resume format'],
        totalVolume: 1520,
        priority: 'p0',
        rationale: 'Data Analyst groups related resume example keywords.',
        fit: 'strong',
        status: 'candidate',
      },
    ],
  };
}
