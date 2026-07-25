import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { importCsvKeywordMetrics } from '../providers/csv/import-metrics.js';
import { mapCsvMetrics } from '../providers/csv/map-columns.js';
import { parseCsvRecords } from '../providers/csv/parse-csv.js';

describe('parseCsvRecords', () => {
  it('parses quoted commas and escaped quotes', () => {
    const records = parseCsvRecords(
      'Keyword,Search volume\n"data, analyst","1,200"\n"a ""quote""",10\n',
    );

    expect(records).toEqual([
      {
        Keyword: 'data, analyst',
        'Search volume': '1,200',
      },
      {
        Keyword: 'a "quote"',
        'Search volume': '10',
      },
    ]);
  });
});

describe('mapCsvMetrics', () => {
  it('maps common keyword metric columns into normalized records', () => {
    const metrics = mapCsvMetrics({
      platformId: 'true-resume',
      country: 'US',
      language: 'en',
      provider: 'csv-import',
      fetchedAt: '2026-05-17T00:00:00.000Z',
      records: [
        {
          Keyword: 'Data Analyst Resume Example',
          'Search volume': '1,200',
          Competition: 'Medium',
          'Competition index': '42',
          'Low top of page bid': '$1.25',
          'High top of page bid': '$5.50',
        },
        {
          Keyword: 'data analyst resume example',
          'Search volume': '999',
        },
      ],
    });

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      term: 'Data Analyst Resume Example',
      normalizedTerm: 'data analyst resume example',
      avgMonthlySearches: 1200,
      competition: 'MEDIUM',
      competitionIndex: 42,
      lowTopOfPageBidMicros: 1_250_000,
      highTopOfPageBidMicros: 5_500_000,
    });
  });
});

describe('importCsvKeywordMetrics', () => {
  it('writes normalized keyword metric JSON from a CSV file', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-metrics-'));
    try {
      await mkdir(join(cwd, 'imports'), { recursive: true });
      await writeFile(
        join(cwd, 'imports/keyword-planner.csv'),
        'Keyword,Avg. monthly searches,Competition\n"data analyst resume",900,HIGH\n',
      );

      const result = await importCsvKeywordMetrics({
        cwd,
        platformId: 'true-resume',
        input: 'imports/keyword-planner.csv',
        output: 'docs/seo/keyword-research/normalized/metrics-us-en.json',
        country: 'US',
        language: 'en',
      });

      expect(result.metricCount).toBe(1);
      const output = JSON.parse(
        await readFile(
          join(cwd, 'docs/seo/keyword-research/normalized/metrics-us-en.json'),
          'utf8',
        ),
      );
      expect(output).toMatchObject({
        version: 1,
        platformId: 'true-resume',
        country: 'US',
        language: 'en',
        provider: 'csv-import',
      });
      expect(output.metrics[0]).toMatchObject({
        normalizedTerm: 'data analyst resume',
        avgMonthlySearches: 900,
        competition: 'HIGH',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-metrics-'));
    try {
      await mkdir(join(cwd, 'imports'), { recursive: true });
      await writeFile(join(cwd, 'imports/metrics.csv'), 'Keyword,Volume\nx,10\n');

      await importCsvKeywordMetrics({
        cwd,
        platformId: 'true-resume',
        input: 'imports/metrics.csv',
        output: 'normalized/metrics.json',
        country: 'US',
        language: 'en',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'normalized/metrics.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
