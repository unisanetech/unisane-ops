import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { expandKeywordSeedFile } from '../expansion/expand-file.js';
import { expandKeywordSeeds } from '../expansion/expand-keywords.js';
import type { KeywordSeedFile } from '../schema/seed.js';

describe('expandKeywordSeeds', () => {
  it('expands seeds through the selected pattern pack and dedupes normalized terms', () => {
    const expanded = expandKeywordSeeds({
      patternPackId: 'resume-examples',
      seedFile: createSeedFile(),
    });

    expect(expanded.platformId).toBe('true-resume');
    expect(expanded.patternPack).toBe('resume-examples');
    expect(expanded.candidates.map((candidate) => candidate.normalizedTerm)).toContain(
      'data analyst resume example',
    );
    expect(expanded.candidates.map((candidate) => candidate.normalizedTerm)).toContain(
      'entry level data analyst resume',
    );
    expect(new Set(expanded.candidates.map((candidate) => candidate.normalizedTerm)).size).toBe(
      expanded.candidates.length,
    );
  });

  it('throws for unknown pattern packs', () => {
    expect(() =>
      expandKeywordSeeds({
        patternPackId: 'missing-pack',
        seedFile: createSeedFile(),
      }),
    ).toThrow('Unknown keyword pattern pack');
  });
});

describe('expandKeywordSeedFile', () => {
  it('reads a seed file and writes expanded candidates', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-expand-'));
    try {
      await mkdir(join(cwd, 'docs/domains/seo/keyword-research/seeds'), { recursive: true });
      await writeFile(
        join(cwd, 'docs/domains/seo/keyword-research/seeds/manual.seed.json'),
        JSON.stringify(createSeedFile(), null, 2),
      );

      const result = await expandKeywordSeedFile({
        cwd,
        input: 'docs/domains/seo/keyword-research/seeds/manual.seed.json',
        output: 'docs/domains/seo/keyword-research/normalized/resume-keywords.json',
        patternPackId: 'resume-examples',
      });

      expect(result.candidateCount).toBeGreaterThan(0);
      const output = JSON.parse(
        await readFile(
          join(cwd, 'docs/domains/seo/keyword-research/normalized/resume-keywords.json'),
          'utf8',
        ),
      );
      expect(output.candidates[0]).toMatchObject({
        platformId: 'true-resume',
        patternPack: 'resume-examples',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-expand-'));
    try {
      await mkdir(join(cwd, 'seeds'), { recursive: true });
      await writeFile(join(cwd, 'seeds/manual.seed.json'), JSON.stringify(createSeedFile()));

      await expandKeywordSeedFile({
        cwd,
        input: 'seeds/manual.seed.json',
        output: 'normalized/resume-keywords.json',
        patternPackId: 'resume-examples',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'normalized/resume-keywords.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createSeedFile(): KeywordSeedFile {
  return {
    version: 1,
    platformId: 'true-resume',
    seeds: [
      {
        id: 'data-analyst',
        term: 'data analyst',
        source: 'manual',
        platformId: 'true-resume',
        intent: 'seo',
        topic: 'data analyst',
        country: 'US',
        language: 'en',
      },
      {
        id: 'data-analyst-duplicate',
        term: 'Data Analyst',
        source: 'manual',
        platformId: 'true-resume',
        intent: 'seo',
        topic: 'Data Analyst',
      },
    ],
  };
}
