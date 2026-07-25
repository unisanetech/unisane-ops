import path from 'node:path';
import { readJson, writeText } from '../../utils/fs.js';
import { internalLinkPlanFileSchema } from '../schema/internal-link.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { renderSeoResearchReport } from './render-report.js';

export type GenerateSeoReportFileOptions = {
  cwd?: string;
  opportunities: string;
  internalLinks?: string;
  output: string;
  dryRun?: boolean;
};

export type GenerateSeoReportFileResult = {
  opportunities: string;
  internalLinks?: string;
  output: string;
  platformId: string;
  opportunityCount: number;
  dryRun: boolean;
};

export async function generateSeoReportFile(
  options: GenerateSeoReportFileOptions,
): Promise<GenerateSeoReportFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const opportunityPath = resolvePath(cwd, options.opportunities);
  const internalLinkPath = options.internalLinks
    ? resolvePath(cwd, options.internalLinks)
    : undefined;
  const outputPath = resolvePath(cwd, options.output);
  const opportunityFile = pageOpportunityFileSchema.parse(await readJson(opportunityPath));
  const internalLinkPlan = internalLinkPath
    ? internalLinkPlanFileSchema.parse(await readJson(internalLinkPath))
    : undefined;
  const markdown = renderSeoResearchReport({
    opportunityFile,
    internalLinkPlan,
  });

  if (!options.dryRun) {
    await writeText(outputPath, markdown);
  }

  return {
    opportunities: path.relative(cwd, opportunityPath),
    internalLinks: internalLinkPath ? path.relative(cwd, internalLinkPath) : undefined,
    output: path.relative(cwd, outputPath),
    platformId: opportunityFile.platformId,
    opportunityCount: opportunityFile.opportunities.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
