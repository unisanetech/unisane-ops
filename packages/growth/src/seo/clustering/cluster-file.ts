import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { keywordCandidateFileSchema } from '../schema/keyword.js';
import { keywordMetricFileSchema } from '../schema/metric.js';
import type { KeywordClusterPageType } from '../schema/cluster.js';
import { groupKeywordClusters } from './group-keywords.js';

export type ClusterKeywordFileOptions = {
  cwd?: string;
  candidates: string;
  metrics?: string;
  output: string;
  pageType?: KeywordClusterPageType;
  dryRun?: boolean;
};

export type ClusterKeywordFileResult = {
  candidates: string;
  metrics?: string;
  output: string;
  platformId: string;
  sourcePatternPack: string;
  clusterCount: number;
  dryRun: boolean;
};

export async function clusterKeywordFile(
  options: ClusterKeywordFileOptions,
): Promise<ClusterKeywordFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const candidatePath = resolvePath(cwd, options.candidates);
  const metricPath = options.metrics ? resolvePath(cwd, options.metrics) : undefined;
  const outputPath = resolvePath(cwd, options.output);
  const candidateFile = keywordCandidateFileSchema.parse(await readJson(candidatePath));
  const metricFile = metricPath
    ? keywordMetricFileSchema.parse(await readJson(metricPath))
    : undefined;
  const clusterFile = groupKeywordClusters({
    candidateFile,
    metricFile,
    pageType: options.pageType,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, clusterFile);
  }

  return {
    candidates: path.relative(cwd, candidatePath),
    metrics: metricPath ? path.relative(cwd, metricPath) : undefined,
    output: path.relative(cwd, outputPath),
    platformId: clusterFile.platformId,
    sourcePatternPack: clusterFile.sourcePatternPack,
    clusterCount: clusterFile.clusters.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
