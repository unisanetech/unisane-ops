import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { generateSeoReportFile } from '../reports/generate-file.js';
import { renderSeoResearchReport } from '../reports/render-report.js';
import type { InternalLinkPlanFile } from '../schema/internal-link.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

describe('renderSeoResearchReport', () => {
  it('renders a concise platform SEO report', () => {
    const markdown = renderSeoResearchReport({
      opportunityFile: createOpportunityFile(),
      internalLinkPlan: createInternalLinkPlan(),
    });

    expect(markdown).toContain('# true-resume SEO Research Report');
    expect(markdown).toContain('- Planned pages: 2');
    expect(markdown).toContain('## Top Opportunities');
    expect(markdown).toContain('Data Analyst Resume Examples and Format');
    expect(markdown).toContain('- Hub path: `/resume-examples`');
  });
});

describe('generateSeoReportFile', () => {
  it('writes a Markdown report from opportunities and internal links', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-report-'));
    try {
      await mkdir(join(cwd, 'docs/domains/seo/keyword-research/opportunities'), {
        recursive: true,
      });
      await mkdir(join(cwd, 'docs/domains/seo/keyword-research/internal-links'), {
        recursive: true,
      });
      await writeFile(
        join(cwd, 'docs/domains/seo/keyword-research/opportunities/pages.json'),
        JSON.stringify(createOpportunityFile(), null, 2),
      );
      await writeFile(
        join(cwd, 'docs/domains/seo/keyword-research/internal-links/links.json'),
        JSON.stringify(createInternalLinkPlan(), null, 2),
      );

      const result = await generateSeoReportFile({
        cwd,
        opportunities: 'docs/domains/seo/keyword-research/opportunities/pages.json',
        internalLinks: 'docs/domains/seo/keyword-research/internal-links/links.json',
        output: 'docs/domains/seo/keyword-research/reports/resume-examples-report.md',
      });

      expect(result.opportunityCount).toBe(2);
      const report = await readFile(
        join(cwd, 'docs/domains/seo/keyword-research/reports/resume-examples-report.md'),
        'utf8',
      );
      expect(report).toContain('Known search volume: 1700');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-report-'));
    try {
      await mkdir(join(cwd, 'opportunities'), { recursive: true });
      await writeFile(
        join(cwd, 'opportunities/pages.json'),
        JSON.stringify(createOpportunityFile()),
      );

      await generateSeoReportFile({
        cwd,
        opportunities: 'opportunities/pages.json',
        output: 'reports/report.md',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'reports/report.md'))).rejects.toThrow();
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
      createOpportunity('data-analyst', 'Data Analyst', 1200, 'approved'),
      createOpportunity('teacher', 'Teacher', 500, 'candidate'),
    ],
  };
}

function createOpportunity(
  slug: string,
  label: string,
  totalVolume: number,
  status: PageOpportunity['status'],
): PageOpportunity {
  return {
    id: `true-resume:cluster:${slug}:page`,
    platformId: 'true-resume',
    clusterId: `true-resume:cluster:${slug}`,
    sourcePatternPack: 'resume-examples',
    status,
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
    supportingKeywords: [],
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

function createInternalLinkPlan(): InternalLinkPlanFile {
  return {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    hubPath: '/resume-examples',
    pages: [
      {
        routePath: '/resume-examples/data-analyst',
        title: 'Data Analyst Resume Examples and Format',
        primaryKeyword: 'data analyst resume example',
        priority: 'p0',
        inboundCount: 1,
        outboundCount: 1,
        orphanRisk: false,
      },
    ],
    edges: [
      {
        fromPath: '/resume-examples',
        toPath: '/resume-examples/data-analyst',
        label: 'Data Analyst Resume Examples and Format',
        type: 'hub',
        reason: 'Hub page should link to every planned detail page.',
      },
    ],
    orphanPaths: [],
  };
}
