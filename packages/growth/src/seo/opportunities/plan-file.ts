import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { keywordClusterFileSchema } from '../schema/cluster.js';
import { planPageOpportunities } from './plan-opportunities.js';

export type PlanPageOpportunityFileOptions = {
  cwd?: string;
  clusters: string;
  output: string;
  basePath?: string;
  ctaLabel?: string;
  ctaTarget?: string;
  dryRun?: boolean;
};

export type PlanPageOpportunityFileResult = {
  clusters: string;
  output: string;
  platformId: string;
  sourcePatternPack: string;
  basePath: string;
  opportunityCount: number;
  dryRun: boolean;
};

export async function planPageOpportunityFile(
  options: PlanPageOpportunityFileOptions,
): Promise<PlanPageOpportunityFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const clusterPath = resolvePath(cwd, options.clusters);
  const outputPath = resolvePath(cwd, options.output);
  const clusterFile = keywordClusterFileSchema.parse(await readJson(clusterPath));
  const opportunityFile = planPageOpportunities({
    clusterFile,
    basePath: options.basePath,
    ctaLabel: options.ctaLabel,
    ctaTarget: options.ctaTarget,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, opportunityFile);
  }

  return {
    clusters: path.relative(cwd, clusterPath),
    output: path.relative(cwd, outputPath),
    platformId: opportunityFile.platformId,
    sourcePatternPack: opportunityFile.sourcePatternPack,
    basePath: opportunityFile.basePath,
    opportunityCount: opportunityFile.opportunities.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
