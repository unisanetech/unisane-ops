import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  createDefaultSeoResearchConfig,
  initSeoResearchWorkspace,
  runSeoDoctor,
} from '@unisane/growth/seo';
import { seoDoctor } from '../doctor.js';

describe('runSeoDoctor', () => {
  it('reports missing provider env for enabled providers', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      await initSeoResearchWorkspace({ cwd });
      await writeJson(join(cwd, 'docs/seo/keyword-research/seo-research.config.json'), {
        ...createDefaultSeoResearchConfig('true-resume'),
        providers: {
          ...createDefaultSeoResearchConfig('true-resume').providers,
          googleAds: {
            ...createDefaultSeoResearchConfig('true-resume').providers.googleAds,
            enabled: true,
          },
        },
      });

      const result = await runSeoDoctor({ cwd, env: {} });

      expect(result.ok).toBe(false);
      expect(result.providers.find((provider) => provider.id === 'google-ads')?.missingEnv).toEqual(
        [
          'GOOGLE_ADS_DEVELOPER_TOKEN',
          'GOOGLE_ADS_CUSTOMER_ID',
          'GOOGLE_OAUTH_CLIENT_ID',
          'GOOGLE_OAUTH_CLIENT_SECRET',
          'GOOGLE_ADS_REFRESH_TOKEN',
        ],
      );
      expect(result.nextStep).toContain('Configure google-ads');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('prints command JSON with secret-free control-plane env guidance', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      await initSeoResearchWorkspace({ cwd });
      await writeJson(join(cwd, 'docs/seo/keyword-research/seo-research.config.json'), {
        ...createDefaultSeoResearchConfig('true-resume'),
        providers: {
          ...createDefaultSeoResearchConfig('true-resume').providers,
          googleAds: {
            ...createDefaultSeoResearchConfig('true-resume').providers.googleAds,
            enabled: true,
          },
        },
      });

      const code = await seoDoctor({ cwd, json: true });
      const output = JSON.parse(String(writeSpy.mock.calls.at(-1)?.[0] ?? '{}')) as {
        controlPlane: {
          envReport: { entries: Array<{ name: string; kind: string; example: string | null }> };
        };
      };

      expect(code).toBe(1);
      expect(output.controlPlane.envReport.entries).toContainEqual(
        expect.objectContaining({
          name: 'GOOGLE_ADS_REFRESH_TOKEN',
          kind: 'fallback-debug',
          example: null,
        }),
      );
    } finally {
      writeSpy.mockRestore();
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('reports stale artifacts', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      await initSeoResearchWorkspace({ cwd });
      await writeHealthyArtifacts(cwd);
      const performancePath = join(
        cwd,
        'docs/seo/keyword-research/normalized/search-console-performance.json',
      );
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await utimes(performancePath, oldDate, oldDate);

      const result = await runSeoDoctor({ cwd, maxArtifactAgeHours: 1, env: {} });

      expect(result.ok).toBe(false);
      expect(result.artifacts.find((artifact) => artifact.kind === 'performance')?.status).toBe(
        'stale',
      );
      expect(result.nextStep).toContain('fresh GA4/Search Console performance');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('reports a healthy True Resume pattern pack workflow', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      await initSeoResearchWorkspace({ cwd });
      await writeHealthyArtifacts(cwd);

      const result = await runSeoDoctor({ cwd, maxArtifactAgeHours: 24, env: {} });

      expect(result.ok).toBe(true);
      expect(result.patternPack).toBe('true-resume');
      expect(result.keywordPatternPack).toBe('resume-examples');
      expect(result.artifacts.every((artifact) => artifact.status === 'fresh')).toBe(true);
      expect(result.nextStep).toContain('Generate or review the SEO report');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

async function createPackageWorkspace(packageName: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-doctor-'));
  await mkdir(cwd, { recursive: true });
  await writeJson(join(cwd, 'package.json'), { name: packageName });
  return cwd;
}

async function writeHealthyArtifacts(cwd: string): Promise<void> {
  const root = join(cwd, 'docs/seo/keyword-research');
  await writeJson(join(root, 'normalized/resume-candidates.json'), {
    version: 1,
    platformId: 'true-resume',
    patternPack: 'resume-examples',
    candidates: [
      {
        id: 'resume-examples:data-analyst',
        term: 'data analyst resume example',
        normalizedTerm: 'data analyst resume example',
        platformId: 'true-resume',
        sourceSeedId: 'seed:data-analyst',
        sourceTerm: 'data analyst',
        pattern: '{topic} resume example',
        patternPack: 'resume-examples',
        intent: 'seo',
        topic: 'Data Analyst',
        country: 'US',
        language: 'en',
      },
    ],
  });
  await writeJson(join(root, 'normalized/resume-metrics.json'), {
    version: 1,
    platformId: 'true-resume',
    provider: 'csv-import',
    country: 'US',
    language: 'en',
    importedAt: new Date().toISOString(),
    metrics: [
      {
        provider: 'csv-import',
        term: 'data analyst resume example',
        normalizedTerm: 'data analyst resume example',
        country: 'US',
        language: 'en',
        avgMonthlySearches: 1200,
        competition: 'MEDIUM',
        fetchedAt: new Date().toISOString(),
      },
    ],
  });
  await writeJson(join(root, 'opportunities/resume-examples.json'), {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    basePath: 'resume-examples',
    opportunities: [createOpportunity()],
  });
  await writeJson(join(root, 'briefs/resume-examples/briefs.index.json'), {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    generatedFrom: 'docs/seo/keyword-research/opportunities/resume-examples.json',
    briefs: [
      {
        id: 'true-resume:cluster:data-analyst:page',
        opportunityId: 'true-resume:cluster:data-analyst:page',
        slug: 'data-analyst',
        routePath: '/resume-examples/data-analyst',
        title: 'Data Analyst Resume Examples and Format',
        primaryKeyword: 'data analyst resume example',
        priority: 'p0',
        status: 'candidate',
        filePath: 'docs/seo/keyword-research/briefs/resume-examples/data-analyst.md',
      },
    ],
  });
  await writeJson(join(root, 'internal-links/resume-examples-links.json'), {
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
  });
  await writeJson(join(root, 'normalized/search-console-performance.json'), {
    version: 1,
    platformId: 'true-resume',
    source: 'google-search-console',
    property: 'https://true-resume.test',
    dateRange: '2026-05-01..2026-05-20',
    records: [
      {
        id: 'gsc:data-analyst',
        platformId: 'true-resume',
        source: 'google-search-console',
        pagePath: '/resume-examples/data-analyst',
        query: 'data analyst resume example',
        clicks: 42,
        impressions: 1200,
        fetchedAt: new Date().toISOString(),
      },
    ],
  });
  await writeFile(join(root, 'reports/resume-examples-report.md'), '# SEO report\n', 'utf8');
}

function createOpportunity(): Record<string, unknown> {
  return {
    id: 'true-resume:cluster:data-analyst:page',
    platformId: 'true-resume',
    clusterId: 'true-resume:cluster:data-analyst',
    sourcePatternPack: 'resume-examples',
    status: 'candidate',
    priority: 'p0',
    fit: 'strong',
    intent: 'commercial',
    pageType: 'role-page',
    slug: 'data-analyst',
    routePath: '/resume-examples/data-analyst',
    title: 'Data Analyst Resume Examples and Format',
    h1: 'Data Analyst resume examples and format',
    metaDescription: 'Compare data analyst resume examples.',
    primaryKeyword: 'data analyst resume example',
    supportingKeywords: ['data analyst resume format'],
    totalVolume: 1200,
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
    rationale: 'High fit page candidate.',
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
