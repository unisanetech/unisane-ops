import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { clusterKeywordFile } from '../clustering/cluster-file.js';
import { groupKeywordClusters } from '../clustering/group-keywords.js';
import type { KeywordCandidateFile } from '../schema/keyword.js';
import type { KeywordMetricFile } from '../schema/metric.js';

describe('groupKeywordClusters', () => {
  it('groups candidates by topic and selects the highest-volume primary keyword', () => {
    const clusters = groupKeywordClusters({
      candidateFile: createCandidateFile(),
      metricFile: createMetricFile(),
    });

    expect(clusters).toMatchObject({
      version: 1,
      platformId: 'true-resume',
      sourcePatternPack: 'resume-examples',
    });
    expect(clusters.clusters).toHaveLength(2);
    expect(clusters.clusters[0]).toMatchObject({
      label: 'Data Analyst',
      primaryKeyword: 'data analyst resume example',
      priority: 'p0',
      fit: 'strong',
      pageType: 'role-page',
      status: 'candidate',
      totalVolume: 1770,
      metricEvidence: {
        provider: 'csv-import',
        country: 'US',
        language: 'en',
        observedAt: '2026-05-17T00:00:00.000Z',
        matchedMetricCount: 4,
        keywordCount: 4,
        sampleData: false,
      },
    });
    expect(clusters.clusters[0]?.secondaryKeywords).toEqual([
      'data analyst resume',
      'entry level data analyst resume',
      'data analyst resume format',
    ]);
  });

  it('can cluster candidates without imported metrics', () => {
    const clusters = groupKeywordClusters({
      candidateFile: createCandidateFile(),
    });

    expect(clusters.clusters[0]).toMatchObject({
      primaryKeyword: 'data analyst resume',
      priority: 'later',
      fit: 'strong',
    });
  });

  it('rejects mismatched metric platform ids', () => {
    expect(() =>
      groupKeywordClusters({
        candidateFile: createCandidateFile(),
        metricFile: {
          ...createMetricFile(),
          platformId: 'other-platform',
        },
      }),
    ).toThrow('does not match candidate platform');
  });

  it('rejects metrics that do not match the declared file market', () => {
    const metricFile = createMetricFile();
    metricFile.metrics[0] = { ...metricFile.metrics[0]!, country: 'IN' };
    expect(() =>
      groupKeywordClusters({ candidateFile: createCandidateFile(), metricFile }),
    ).toThrow('does not match file market US/en');
  });
});

describe('clusterKeywordFile', () => {
  it('writes keyword clusters from candidates and metrics', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-cluster-'));
    try {
      await mkdir(join(cwd, 'docs/domains/seo/keyword-research/normalized'), { recursive: true });
      await mkdir(join(cwd, 'docs/domains/seo/keyword-research/clusters'), { recursive: true });
      await writeFile(
        join(cwd, 'docs/domains/seo/keyword-research/normalized/resume-keywords.json'),
        JSON.stringify(createCandidateFile(), null, 2),
      );
      await writeFile(
        join(cwd, 'docs/domains/seo/keyword-research/normalized/metrics-us-en.json'),
        JSON.stringify(createMetricFile(), null, 2),
      );

      const result = await clusterKeywordFile({
        cwd,
        candidates: 'docs/domains/seo/keyword-research/normalized/resume-keywords.json',
        metrics: 'docs/domains/seo/keyword-research/normalized/metrics-us-en.json',
        output: 'docs/domains/seo/keyword-research/clusters/resume-examples-clusters.json',
      });

      expect(result.clusterCount).toBe(2);
      const output = JSON.parse(
        await readFile(
          join(cwd, 'docs/domains/seo/keyword-research/clusters/resume-examples-clusters.json'),
          'utf8',
        ),
      );
      expect(output.clusters[0]).toMatchObject({
        label: 'Data Analyst',
        primaryKeyword: 'data analyst resume example',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-cluster-'));
    try {
      await mkdir(join(cwd, 'normalized'), { recursive: true });
      await writeFile(
        join(cwd, 'normalized/resume-keywords.json'),
        JSON.stringify(createCandidateFile()),
      );

      await clusterKeywordFile({
        cwd,
        candidates: 'normalized/resume-keywords.json',
        output: 'clusters/result.json',
        dryRun: true,
      });

      await expect(stat(join(cwd, 'clusters/result.json'))).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

function createCandidateFile(): KeywordCandidateFile {
  return {
    version: 1,
    platformId: 'true-resume',
    patternPack: 'resume-examples',
    candidates: [
      createCandidate('data analyst resume', 'data analyst', 'data analyst resume'),
      createCandidate('data analyst resume example', 'data analyst', 'data analyst resume example'),
      createCandidate(
        'entry level data analyst resume',
        'data analyst',
        'entry level data analyst resume',
      ),
      createCandidate('data analyst resume format', 'data analyst', 'data analyst resume format'),
      createCandidate('teacher resume example', 'teacher', 'teacher resume example'),
    ],
  };
}

function createCandidate(term: string, topic: string, pattern: string) {
  return {
    id: `resume-examples:seed:${term.replace(/\s+/g, '-')}`,
    term,
    normalizedTerm: term,
    platformId: 'true-resume',
    sourceSeedId: topic.replace(/\s+/g, '-'),
    sourceTerm: topic,
    pattern,
    patternPack: 'resume-examples',
    intent: 'seo' as const,
    topic,
  };
}

function createMetricFile(): KeywordMetricFile {
  return {
    version: 1,
    platformId: 'true-resume',
    country: 'US',
    language: 'en',
    provider: 'csv-import',
    metrics: [
      createMetric('data analyst resume', 500),
      createMetric('data analyst resume example', 900),
      createMetric('entry level data analyst resume', 250),
      createMetric('data analyst resume format', 120),
      createMetric('teacher resume example', 80),
    ],
  };
}

function createMetric(term: string, avgMonthlySearches: number) {
  return {
    term,
    normalizedTerm: term,
    country: 'US',
    language: 'en',
    provider: 'csv-import' as const,
    avgMonthlySearches,
    fetchedAt: '2026-05-17T00:00:00.000Z',
  };
}
