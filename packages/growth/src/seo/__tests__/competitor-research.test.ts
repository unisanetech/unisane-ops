import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractCompetitorHtmlMetadata,
  fetchCompetitorResearchFile,
  fetchCompetitorUrls,
  generateCompetitorResearchReportFile,
  importCompetitorCsv,
  importCompetitorResearchFile,
  renderCompetitorResearchReport,
} from '../index.js';
import { readJson, readText, writeText } from '../../utils/fs.js';

describe('competitor research', () => {
  it('imports structured competitor metadata from CSV records', () => {
    const competitorFile = importCompetitorCsv({
      platformId: 'true-resume',
      source: 'csv-import',
      market: 'US resume examples',
      sourceFile: 'competitors.csv',
      records: [
        {
          keyword: 'data analyst resume examples',
          position: '1',
          url: 'https://resume.io/resume-examples/data-analyst',
          title: 'Data Analyst Resume Examples',
          h1: 'Data Analyst Resume Examples & Writing Guide',
          category: 'Resume Examples > Data and Analytics',
          patterns: 'examples by experience level;writing tips;related examples',
          notes: 'Strong hub/detail structure.',
        },
      ],
    });

    expect(competitorFile.pages).toHaveLength(1);
    expect(competitorFile.pages[0]).toMatchObject({
      domain: 'resume.io',
      keyword: 'data analyst resume examples',
      position: 1,
      categoryPath: ['Resume Examples', 'Data and Analytics'],
    });
    expect(competitorFile.pages[0]?.contentPatterns.map((pattern) => pattern.label)).toEqual([
      'examples by experience level',
      'writing tips',
      'related examples',
    ]);
  });

  it('writes a competitor research JSON artifact from CSV', async () => {
    const tmpDir = path.join(os.tmpdir(), `unisane-competitors-${Date.now()}`);
    const input = path.join(tmpDir, 'competitors.csv');
    const output = path.join(tmpDir, 'competitors.json');
    await writeText(
      input,
      [
        'keyword,position,url,title,h1,patterns',
        'resume examples,2,https://example.com/resume-examples,Resume Examples,Resume Examples,"category index;cards"',
      ].join('\n'),
    );

    const result = await importCompetitorResearchFile({
      cwd: tmpDir,
      platformId: 'true-resume',
      input: 'competitors.csv',
      output: 'competitors.json',
    });
    const artifact = await readJson(output);

    expect(result).toMatchObject({
      input: 'competitors.csv',
      output: 'competitors.json',
      pageCount: 1,
      domainCount: 1,
      keywordCount: 1,
    });
    expect(artifact).toMatchObject({
      version: 1,
      platformId: 'true-resume',
      pages: [{ domain: 'example.com' }],
    });
  });

  it('extracts structured metadata from competitor HTML', () => {
    const metadata = extractCompetitorHtmlMetadata({
      url: 'https://resume.example/resume-examples/data-analyst',
      html: [
        '<html><head>',
        '<title>Data Analyst Resume Examples</title>',
        '<meta name="description" content="Simple examples for data analyst resumes.">',
        '<link rel="canonical" href="/resume-examples/data-analyst">',
        '</head><body>',
        '<nav class="breadcrumbs"><a>Resume Examples</a><a>Data and Analytics</a></nav>',
        '<h1>Data Analyst Resume Examples</h1>',
        '<h2>Examples by experience level</h2>',
        '<h2>What to include</h2>',
        '<h3>Related resume examples</h3>',
        '<a href="/builder">Create my resume</a>',
        '<a href="https://external.example/resource">External resource</a>',
        '<script type="application/ld+json">{"@type":"FAQPage"}</script>',
        '</body></html>',
      ].join(''),
    });

    expect(metadata).toMatchObject({
      title: 'Data Analyst Resume Examples',
      h1: 'Data Analyst Resume Examples',
      metaDescription: 'Simple examples for data analyst resumes.',
      canonicalUrl: 'https://resume.example/resume-examples/data-analyst',
      categoryPath: ['Resume Examples', 'Data and Analytics'],
    });
    expect(metadata.contentPatterns.map((pattern) => pattern.label)).toEqual([
      'Examples by experience level',
      'What to include',
      'Related resume examples',
    ]);
    expect(metadata.keywordSignals.map((signal) => signal.term)).toContain('data analyst');
    expect(metadata.onPageSignals).toMatchObject({
      h1Count: 1,
      h2Count: 2,
      h3Count: 1,
      internalLinkCount: 1,
      externalLinkCount: 1,
      canonicalPresent: true,
      schemaTypes: ['FAQPage'],
      ctaPatterns: expect.arrayContaining(['creation CTA']),
    });
  });

  it('fetches competitor URL metadata with a mocked provider', async () => {
    const result = await fetchCompetitorUrls({
      platformId: 'true-resume',
      market: 'US',
      urls: [
        {
          url: 'https://competitor.test/resume-examples/data-analyst',
          keyword: 'data analyst resume examples',
          position: 1,
        },
      ],
      fetchImpl: async () =>
        new Response(
          [
            '<html><head>',
            '<title>Data Analyst Resume Examples</title>',
            '<meta name="description" content="Review strong data analyst examples.">',
            '</head><body>',
            '<h1>Data Analyst Resume Examples</h1>',
            '<h2>Entry-level data analyst resume</h2>',
            '<h2>Senior data analyst resume</h2>',
            '<a href="/templates">Resume templates</a>',
            '</body></html>',
          ].join(''),
          { headers: { 'content-type': 'text/html; charset=utf-8' } },
        ),
    });

    expect(result.failedUrls).toEqual([]);
    expect(result.competitorFile).toMatchObject({
      source: 'url-fetch',
      pages: [
        {
          domain: 'competitor.test',
          keyword: 'data analyst resume examples',
          position: 1,
          title: 'Data Analyst Resume Examples',
          h1: 'Data Analyst Resume Examples',
        },
      ],
    });
    expect(result.competitorFile.pages[0]?.contentPatterns.map((pattern) => pattern.label)).toEqual(
      ['Entry-level data analyst resume', 'Senior data analyst resume'],
    );
    expect(result.competitorFile.pages[0]?.keywordSignals?.map((signal) => signal.term)).toContain(
      'data analyst',
    );
    expect(result.competitorFile.pages[0]?.onPageSignals).toMatchObject({
      h1Count: 1,
      h2Count: 2,
      internalLinkCount: 1,
      ctaPatterns: ['template/example CTA'],
    });
  });

  it('writes a competitor research JSON artifact from fetched URLs', async () => {
    const tmpDir = path.join(os.tmpdir(), `unisane-competitor-fetch-${Date.now()}`);
    const input = path.join(tmpDir, 'competitor-urls.csv');
    const output = path.join(tmpDir, 'competitors.json');
    await writeText(
      input,
      ['keyword,position,url', 'resume examples,1,https://example.com/resume-examples'].join('\n'),
    );

    const result = await fetchCompetitorResearchFile({
      cwd: tmpDir,
      platformId: 'true-resume',
      input: 'competitor-urls.csv',
      output: 'competitors.json',
      fetchImpl: async () =>
        new Response(
          '<html><head><title>Resume Examples</title></head><body><h1>Resume Examples</h1><h2>Popular examples</h2></body></html>',
          { headers: { 'content-type': 'text/html' } },
        ),
    });
    const artifact = await readJson(output);

    expect(result).toMatchObject({
      input: 'competitor-urls.csv',
      output: 'competitors.json',
      requestedCount: 1,
      pageCount: 1,
      failedCount: 0,
    });
    expect(artifact).toMatchObject({
      version: 1,
      source: 'url-fetch',
      pages: [{ domain: 'example.com', title: 'Resume Examples' }],
    });
  });

  it('renders a readable competitor research report', () => {
    const markdown = renderCompetitorResearchReport({
      competitorFile: importCompetitorCsv({
        platformId: 'true-resume',
        source: 'manual',
        records: [
          {
            keyword: 'data analyst resume format',
            position: '1',
            url: 'https://competitor.test/data-analyst',
            title: 'Data Analyst Resume Format',
            h1: 'Data Analyst Resume Format',
            patterns: 'sample resumes;section guidance',
            terms: 'resume format;data analyst',
          },
          {
            keyword: 'data analyst resume format',
            position: '2',
            url: 'https://another.test/data-analyst',
            title: 'Data Analyst Resume Example',
            h1: 'Data Analyst Resume Example',
            patterns: 'sample resumes;download CTA',
            terms: 'resume example;data analyst',
          },
        ],
      }),
    });

    expect(markdown).toContain('# Competitor Research Report: true-resume');
    expect(markdown).toContain('- Competitor pages: 2');
    expect(markdown).toContain('- data analyst resume format: 2');
    expect(markdown).toContain('- sample resumes: 2');
    expect(markdown).toContain('## Inferred Keyword Signals');
    expect(markdown).toContain('- data analyst: 2');
  });

  it('writes a competitor report Markdown artifact', async () => {
    const tmpDir = path.join(os.tmpdir(), `unisane-competitor-report-${Date.now()}`);
    const input = path.join(tmpDir, 'competitors.csv');
    const competitors = path.join(tmpDir, 'competitors.json');
    const report = path.join(tmpDir, 'competitors.md');
    await writeText(
      input,
      [
        'keyword,position,url,title,h1,patterns',
        'resume examples,1,https://example.com/resume-examples,Resume Examples,Resume Examples,"hub;filters"',
      ].join('\n'),
    );
    await importCompetitorResearchFile({
      cwd: tmpDir,
      platformId: 'true-resume',
      input,
      output: competitors,
    });

    const result = await generateCompetitorResearchReportFile({
      cwd: tmpDir,
      competitors,
      output: report,
    });
    const markdown = await readText(report);

    expect(result).toMatchObject({ pageCount: 1, domainCount: 1 });
    expect(markdown).toContain('## Top Domains');
    expect(markdown).toContain('- example.com: 1');
  });
});
