import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  configureSeoResearchWorkspace,
  generateSeoPerformanceReportFile,
  importSeoPerformanceFile,
  renderSeoPerformanceReport,
} from '../index.js';
import type { PageOpportunityFile } from '../schema/opportunity.js';
import type { SeoPerformanceFile } from '../schema/performance.js';

describe('SEO performance feedback', () => {
  it('imports Google Search Console CSV exports into normalized performance records', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-search-console-'));
    try {
      await configurePerformanceWorkspace(cwd);
      await writeFile(
        join(cwd, 'gsc.csv'),
        [
          'Query,Page,Clicks,Impressions,CTR,Position',
          'data analyst resume example,https://true-resume.test/resume-examples/data-analyst,42,1200,3.5%,4.2',
        ].join('\n'),
      );

      const result = await importSeoPerformanceFile({
        cwd,
        platformId: 'true-resume',
        source: 'google-search-console',
        input: 'gsc.csv',
        output: 'normalized/gsc.json',
        property: 'https://true-resume.test/',
        startDate: '2026-04-19',
        endDate: '2026-05-16',
        sampleData: false,
        now: () => new Date('2026-05-17T00:00:00.000Z'),
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/gsc.json'), 'utf8'));

      expect(result).toMatchObject({
        recordCount: 1,
        pageCount: 1,
        queryCount: 1,
      });
      expect(artifact.records[0]).toMatchObject({
        pagePath: '/resume-examples/data-analyst',
        query: 'data analyst resume example',
        clicks: 42,
        impressions: 1200,
        ctr: 0.035,
        position: 4.2,
      });
      expect(artifact).toMatchObject({
        version: 2,
        siteUrl: 'https://true-resume.test/',
        property: 'https://true-resume.test/',
        evidence: {
          acquisition: 'csv-import',
          sampleData: false,
          observedAt: '2026-05-17T00:00:00.000Z',
        },
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('imports GA4 landing page CSV exports into normalized performance records', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-ga4-'));
    try {
      await configurePerformanceWorkspace(cwd);
      await writeFile(
        join(cwd, 'ga4.csv'),
        [
          'Page path + query string,Sessions,Total users,Conversions,Total revenue',
          '/resume-examples/data-analyst,320,210,12,49.50',
        ].join('\n'),
      );

      const result = await importSeoPerformanceFile({
        cwd,
        platformId: 'true-resume',
        source: 'ga4',
        input: 'ga4.csv',
        output: 'normalized/ga4.json',
        property: 'properties/123456',
        startDate: '2026-04-19',
        endDate: '2026-05-16',
        sampleData: true,
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/ga4.json'), 'utf8'));

      expect(result).toMatchObject({
        recordCount: 1,
        pageCount: 1,
        queryCount: 0,
      });
      expect(artifact.records[0]).toMatchObject({
        pagePath: '/resume-examples/data-analyst',
        sessions: 320,
        users: 210,
        analyticsConversions: 12,
        analyticsRevenue: 49.5,
      });
      expect(artifact.evidence.sampleData).toBe(true);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run import without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-performance-dry-run-'));
    try {
      await configurePerformanceWorkspace(cwd);
      await writeFile(
        join(cwd, 'gsc.csv'),
        ['Query,Page,Clicks', 'resume examples,/resume-examples,10'].join('\n'),
      );

      await importSeoPerformanceFile({
        cwd,
        platformId: 'true-resume',
        source: 'google-search-console',
        input: 'gsc.csv',
        output: 'normalized/gsc.json',
        property: 'https://true-resume.test/',
        startDate: '2026-04-19',
        endDate: '2026-05-16',
        sampleData: false,
        dryRun: true,
      });

      await expect(stat(join(cwd, 'normalized/gsc.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('rejects evidence from a provider resource outside the configured site context', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-performance-mismatch-'));
    try {
      await configurePerformanceWorkspace(cwd);
      await writeFile(
        join(cwd, 'gsc.csv'),
        ['Query,Page,Clicks', 'resume examples,/resume-examples,10'].join('\n'),
      );

      await expect(
        importSeoPerformanceFile({
          cwd,
          platformId: 'true-resume',
          source: 'google-search-console',
          input: 'gsc.csv',
          property: 'sc-domain:other.test',
          startDate: '2026-04-19',
          endDate: '2026-05-16',
          sampleData: false,
        }),
      ).rejects.toThrow('does not match the configured resource');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('renders a combined opportunity feedback report', () => {
    const markdown = renderSeoPerformanceReport({
      searchConsoleFile: createSearchConsoleFile(),
      ga4File: createGa4File(),
      opportunityFile: createOpportunityFile(),
    });

    expect(markdown).toContain('# SEO Performance Report: true-resume');
    expect(markdown).toContain('- data analyst resume example: 42 clicks, 1200 impressions');
    expect(markdown).toContain(
      '- Data Analyst Resume Examples (built/p0): 42 clicks, 1200 impressions, 320 sessions, 12 Analytics conversions',
    );
    expect(markdown).toContain('Search Console evidence: api; live; fresh until');
  });

  it('rejects report inputs from different sites', () => {
    const ga4File = createGa4File();
    ga4File.siteUrl = 'https://other.test/';

    expect(() =>
      renderSeoPerformanceReport({
        searchConsoleFile: createSearchConsoleFile(),
        ga4File,
      }),
    ).toThrow('same platform and site');
  });

  it('writes a performance report artifact', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-performance-report-'));
    try {
      await mkdir(join(cwd, 'normalized'), { recursive: true });
      await writeFile(join(cwd, 'gsc.json'), JSON.stringify(createSearchConsoleFile(), null, 2));
      await writeFile(join(cwd, 'ga4.json'), JSON.stringify(createGa4File(), null, 2));
      await writeFile(
        join(cwd, 'opportunities.json'),
        JSON.stringify(createOpportunityFile(), null, 2),
      );

      const result = await generateSeoPerformanceReportFile({
        cwd,
        searchConsole: 'gsc.json',
        ga4: 'ga4.json',
        opportunities: 'opportunities.json',
        output: 'reports/performance.md',
      });
      const markdown = await readFile(join(cwd, 'reports/performance.md'), 'utf8');

      expect(result).toMatchObject({
        output: 'reports/performance.md',
        platformId: 'true-resume',
      });
      expect(markdown).toContain('## Opportunity Feedback');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createSearchConsoleFile(): SeoPerformanceFile {
  return {
    version: 2,
    platformId: 'true-resume',
    source: 'google-search-console',
    siteUrl: 'https://true-resume.test/',
    targetMarkets: [{ country: 'US', language: 'en' }],
    property: 'https://true-resume.test/',
    dateRange: { startDate: '2026-04-19', endDate: '2026-05-16' },
    evidence: createEvidence(),
    records: [
      {
        id: 'perf-gsc',
        platformId: 'true-resume',
        source: 'google-search-console',
        pagePath: '/resume-examples/data-analyst',
        query: 'data analyst resume example',
        clicks: 42,
        impressions: 1200,
        ctr: 0.035,
        position: 4.2,
      },
    ],
  };
}

function createGa4File(): SeoPerformanceFile {
  return {
    version: 2,
    platformId: 'true-resume',
    source: 'ga4',
    siteUrl: 'https://true-resume.test/',
    targetMarkets: [{ country: 'US', language: 'en' }],
    property: 'properties/123456',
    dateRange: { startDate: '2026-04-19', endDate: '2026-05-16' },
    evidence: createEvidence(),
    records: [
      {
        id: 'perf-ga4',
        platformId: 'true-resume',
        source: 'ga4',
        pagePath: '/resume-examples/data-analyst',
        sessions: 320,
        users: 210,
        analyticsConversions: 12,
        analyticsRevenue: 49.5,
      },
    ],
  };
}

function createEvidence(): SeoPerformanceFile['evidence'] {
  return {
    acquisition: 'api',
    sampleData: false,
    observedAt: '2026-05-17T00:00:00.000Z',
    freshUntil: '2026-05-18T00:00:00.000Z',
    limitations: [],
  };
}

async function configurePerformanceWorkspace(cwd: string): Promise<void> {
  await configureSeoResearchWorkspace({
    cwd,
    platformId: 'true-resume',
    siteUrl: 'https://true-resume.test/',
    markets: [{ country: 'US', language: 'en' }],
    ownershipConfirmed: true,
    searchConsoleProperty: 'https://true-resume.test/',
    ga4Property: '123456',
    now: () => new Date('2026-05-16T00:00:00.000Z'),
  });
}

function createOpportunityFile(): PageOpportunityFile {
  return {
    version: 1,
    platformId: 'true-resume',
    sourcePatternPack: 'resume-examples',
    basePath: 'resume-examples',
    opportunities: [
      {
        id: 'true-resume:cluster:data-analyst:page',
        platformId: 'true-resume',
        clusterId: 'true-resume:cluster:data-analyst',
        sourcePatternPack: 'resume-examples',
        status: 'built',
        priority: 'p0',
        fit: 'strong',
        intent: 'commercial',
        pageType: 'role-page',
        slug: 'data-analyst',
        routePath: '/resume-examples/data-analyst',
        title: 'Data Analyst Resume Examples',
        h1: 'Data Analyst resume examples',
        metaDescription: 'Compare data analyst resume examples.',
        primaryKeyword: 'data analyst resume example',
        supportingKeywords: ['data analyst resume format'],
        totalVolume: 1200,
        sections: [],
        internalLinks: [],
        cta: {
          label: 'Start with this example',
          target: '/resumes/new',
        },
        rationale: 'Strong product fit.',
      },
    ],
  };
}
