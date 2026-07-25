import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importTrendSignalFile } from '../index.js';

describe('Trend signal imports', () => {
  it('imports Google Trends CSV exports into normalized trend signals', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-trends-'));
    try {
      await writeFile(
        join(cwd, 'trends.csv'),
        [
          'Keyword,Date,Relative interest,Related query,Query type,Breakout',
          'resume templates,2026-05,78,ats friendly resume template,rising,true',
        ].join('\n'),
      );

      const result = await importTrendSignalFile({
        cwd,
        platformId: 'true-resume',
        input: 'trends.csv',
        output: 'normalized/trends.json',
        country: 'US',
        language: 'en',
        dateRange: 'past-12-months',
      });
      const artifact = JSON.parse(await readFile(join(cwd, 'normalized/trends.json'), 'utf8'));

      expect(result).toMatchObject({
        signalCount: 1,
        termCount: 1,
        relatedQueryCount: 1,
      });
      expect(artifact).toMatchObject({
        version: 1,
        platformId: 'true-resume',
        provider: 'google-trends',
        country: 'US',
        language: 'en',
        dateRange: 'past-12-months',
        source: { kind: 'csv-import', input: 'trends.csv' },
      });
      expect(artifact.signals[0]).toMatchObject({
        term: 'resume templates',
        normalizedTerm: 'resume templates',
        country: 'US',
        language: 'en',
        date: '2026-05',
        dateRange: 'past-12-months',
        relativeInterest: 78,
        relatedQuery: 'ats friendly resume template',
        relatedQueryType: 'rising',
        breakout: true,
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-trends-dry-run-'));
    try {
      await writeFile(join(cwd, 'trends.csv'), ['Keyword,Interest', 'cv maker,55'].join('\n'));

      await importTrendSignalFile({
        cwd,
        platformId: 'true-resume',
        input: 'trends.csv',
        output: 'normalized/trends.json',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'normalized/trends.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
