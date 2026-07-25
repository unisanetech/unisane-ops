import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { planInternalLinks } from './plan-links.js';

export type PlanInternalLinkFileOptions = {
  cwd?: string;
  opportunities: string;
  output: string;
  hubLabel?: string;
  maxRelated?: number;
  includeConversionLinks?: boolean;
  dryRun?: boolean;
};

export type PlanInternalLinkFileResult = {
  opportunities: string;
  output: string;
  platformId: string;
  sourcePatternPack: string;
  pageCount: number;
  edgeCount: number;
  orphanCount: number;
  dryRun: boolean;
};

export async function planInternalLinkFile(
  options: PlanInternalLinkFileOptions,
): Promise<PlanInternalLinkFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const opportunityPath = resolvePath(cwd, options.opportunities);
  const outputPath = resolvePath(cwd, options.output);
  const opportunityFile = pageOpportunityFileSchema.parse(await readJson(opportunityPath));
  const linkPlan = planInternalLinks({
    opportunityFile,
    hubLabel: options.hubLabel,
    maxRelated: options.maxRelated,
    includeConversionLinks: options.includeConversionLinks,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, linkPlan);
  }

  return {
    opportunities: path.relative(cwd, opportunityPath),
    output: path.relative(cwd, outputPath),
    platformId: linkPlan.platformId,
    sourcePatternPack: linkPlan.sourcePatternPack,
    pageCount: linkPlan.pages.length,
    edgeCount: linkPlan.edges.length,
    orphanCount: linkPlan.orphanPaths.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
