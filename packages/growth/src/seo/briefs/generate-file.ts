import path from 'node:path';
import { readJson } from '../../utils/fs.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import {
  generateContentBriefs,
  type ContentBriefStatusFilter,
  type GenerateContentBriefsResult,
} from './generate-briefs.js';

export type GenerateContentBriefFileOptions = {
  cwd?: string;
  opportunities: string;
  outputDir: string;
  status?: ContentBriefStatusFilter;
  dryRun?: boolean;
};

export type GenerateContentBriefFileResult = GenerateContentBriefsResult & {
  opportunities: string;
};

export async function generateContentBriefFile(
  options: GenerateContentBriefFileOptions,
): Promise<GenerateContentBriefFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const opportunityPath = resolvePath(cwd, options.opportunities);
  const outputDir = resolvePath(cwd, options.outputDir);
  const opportunityFile = pageOpportunityFileSchema.parse(await readJson(opportunityPath));
  const result = await generateContentBriefs({
    opportunityFile,
    outputDir,
    indexOutputDir: path.relative(cwd, outputDir),
    generatedFrom: path.relative(cwd, opportunityPath),
    status: options.status,
    dryRun: options.dryRun,
  });

  return {
    ...result,
    opportunities: path.relative(cwd, opportunityPath),
    outputDir: path.relative(cwd, result.outputDir),
    indexPath: path.relative(cwd, result.indexPath),
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
