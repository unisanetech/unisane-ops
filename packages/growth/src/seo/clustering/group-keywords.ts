import type { KeywordCandidate, KeywordCandidateFile } from '../schema/keyword.js';
import type { KeywordMetric, KeywordMetricFile } from '../schema/metric.js';
import {
  keywordClusterFileSchema,
  type KeywordCluster,
  type KeywordClusterFile,
  type KeywordClusterPageType,
} from '../schema/cluster.js';
import { createKeywordId, normalizeKeywordTerm } from '../expansion/normalize-keywords.js';

export type GroupKeywordClustersOptions = {
  candidateFile: KeywordCandidateFile;
  metricFile?: KeywordMetricFile;
  pageType?: KeywordClusterPageType;
};

type CandidateWithMetric = {
  candidate: KeywordCandidate;
  metric?: KeywordMetric;
};

const REMOVABLE_PHRASES = [
  'resume examples',
  'resume example',
  'resume formats',
  'resume format',
  'resume templates',
  'resume template',
  'resume samples',
  'resume sample',
  'resume skills',
  'resume summary',
  'resume objective',
  'resume bullet points',
  'cover letter',
  'entry level',
  'senior',
  'junior',
  'best',
  'for freshers',
  'for students',
  'for career change',
  'resume',
];

export function groupKeywordClusters(options: GroupKeywordClustersOptions): KeywordClusterFile {
  assertMatchingPlatform(options.candidateFile, options.metricFile);

  const metricsByTerm = new Map(
    (options.metricFile?.metrics ?? []).map((metric) => [metric.normalizedTerm, metric]),
  );
  const grouped = new Map<string, CandidateWithMetric[]>();

  for (const candidate of options.candidateFile.candidates) {
    const clusterKey = getClusterKey(candidate);
    const entries = grouped.get(clusterKey) ?? [];
    entries.push({
      candidate,
      metric: metricsByTerm.get(candidate.normalizedTerm),
    });
    grouped.set(clusterKey, entries);
  }

  const clusters = Array.from(grouped.entries())
    .map(([clusterKey, entries]) =>
      buildCluster({
        clusterKey,
        entries,
        platformId: options.candidateFile.platformId,
        patternPack: options.candidateFile.patternPack,
        pageType: options.pageType,
      }),
    )
    .sort(sortClusters);

  return keywordClusterFileSchema.parse({
    version: 1,
    platformId: options.candidateFile.platformId,
    sourcePatternPack: options.candidateFile.patternPack,
    metricSource: options.metricFile?.provider,
    clusters,
  });
}

function assertMatchingPlatform(
  candidateFile: KeywordCandidateFile,
  metricFile?: KeywordMetricFile,
): void {
  if (metricFile && metricFile.platformId !== candidateFile.platformId) {
    throw new Error(
      `Metric platform ${metricFile.platformId} does not match candidate platform ${candidateFile.platformId}.`,
    );
  }
}

function getClusterKey(candidate: KeywordCandidate): string {
  return normalizeKeywordTerm(
    candidate.topic ?? candidate.role ?? stripKeywordModifiers(candidate),
  );
}

function stripKeywordModifiers(candidate: KeywordCandidate): string {
  let term = ` ${candidate.normalizedTerm} `;
  for (const phrase of REMOVABLE_PHRASES) {
    term = term.replaceAll(` ${phrase} `, ' ');
  }
  return normalizeKeywordTerm(term);
}

function buildCluster(options: {
  clusterKey: string;
  entries: CandidateWithMetric[];
  platformId: string;
  patternPack: string;
  pageType?: KeywordClusterPageType;
}): KeywordCluster {
  const sortedEntries = [...options.entries].sort(sortEntriesForPrimary);
  const primary = sortedEntries[0];
  if (!primary) {
    throw new Error(`Cannot create an empty keyword cluster for ${options.clusterKey}.`);
  }
  const secondaryKeywords = sortedEntries
    .slice(1)
    .sort(sortEntriesForSecondary)
    .map((entry) => entry.candidate.normalizedTerm);
  const totalVolume = sumKnownVolume(sortedEntries);
  const intent = classifyClusterIntent(sortedEntries);
  const pageType = options.pageType ?? inferPageType(options.patternPack);

  return {
    id: createKeywordId([options.platformId, 'cluster', options.clusterKey]),
    label: toTitleCase(options.clusterKey),
    platformId: options.platformId,
    intent,
    pageType,
    primaryKeyword: primary.candidate.normalizedTerm,
    secondaryKeywords,
    totalVolume,
    priority: classifyPriority(totalVolume),
    rationale: createClusterRationale(options.clusterKey, sortedEntries.length, totalVolume),
    fit: classifyFit(totalVolume, sortedEntries.length),
    status: 'candidate',
  };
}

function sortEntriesForPrimary(left: CandidateWithMetric, right: CandidateWithMetric): number {
  return (
    compareMetricVolume(right.metric, left.metric) ||
    left.candidate.normalizedTerm.length - right.candidate.normalizedTerm.length ||
    left.candidate.normalizedTerm.localeCompare(right.candidate.normalizedTerm)
  );
}

function sortEntriesForSecondary(left: CandidateWithMetric, right: CandidateWithMetric): number {
  return (
    compareMetricVolume(right.metric, left.metric) ||
    left.candidate.normalizedTerm.localeCompare(right.candidate.normalizedTerm)
  );
}

function compareMetricVolume(left?: KeywordMetric, right?: KeywordMetric): number {
  return getMetricVolume(left) - getMetricVolume(right);
}

function getMetricVolume(metric?: KeywordMetric): number {
  return metric?.avgMonthlySearches ?? -1;
}

function sumKnownVolume(entries: CandidateWithMetric[]): number | undefined {
  const volumes = new Map<string, number>();
  for (const entry of entries) {
    if (entry.metric?.avgMonthlySearches !== undefined) {
      volumes.set(entry.candidate.normalizedTerm, entry.metric.avgMonthlySearches);
    }
  }

  if (volumes.size === 0) {
    return undefined;
  }

  return Array.from(volumes.values()).reduce((total, volume) => total + volume, 0);
}

function classifyClusterIntent(entries: CandidateWithMetric[]): KeywordCluster['intent'] {
  const terms = entries.map((entry) => entry.candidate.normalizedTerm).join(' ');
  if (/\b(pricing|price|cost|login|sign in)\b/.test(terms)) {
    return terms.includes('login') || terms.includes('sign in') ? 'navigational' : 'commercial';
  }
  if (/\b(template|builder|software|tool|generator|best)\b/.test(terms)) {
    return 'commercial';
  }
  if (/\b(download|buy|subscribe|start)\b/.test(terms)) {
    return 'transactional';
  }
  return 'informational';
}

function inferPageType(patternPack: string): KeywordClusterPageType {
  return patternPack === 'resume-examples' ? 'role-page' : 'landing';
}

function classifyPriority(totalVolume?: number): KeywordCluster['priority'] {
  if (totalVolume === undefined) {
    return 'later';
  }
  if (totalVolume >= 1_000) {
    return 'p0';
  }
  if (totalVolume >= 300) {
    return 'p1';
  }
  return 'p2';
}

function classifyFit(
  totalVolume: number | undefined,
  candidateCount: number,
): KeywordCluster['fit'] {
  if (candidateCount >= 4 && (totalVolume === undefined || totalVolume >= 300)) {
    return 'strong';
  }
  if (candidateCount >= 2) {
    return 'medium';
  }
  return 'weak';
}

function createClusterRationale(
  clusterKey: string,
  candidateCount: number,
  totalVolume?: number,
): string {
  const metricText =
    totalVolume === undefined ? 'no imported volume yet' : `${totalVolume} total monthly searches`;
  return `${toTitleCase(clusterKey)} groups ${candidateCount} related keyword candidates with ${metricText}.`;
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortClusters(left: KeywordCluster, right: KeywordCluster): number {
  return (
    getPriorityRank(left.priority) - getPriorityRank(right.priority) ||
    (right.totalVolume ?? -1) - (left.totalVolume ?? -1) ||
    left.label.localeCompare(right.label)
  );
}

function getPriorityRank(priority: KeywordCluster['priority']): number {
  return {
    p0: 0,
    p1: 1,
    p2: 2,
    later: 3,
  }[priority];
}
