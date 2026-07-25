import path from 'node:path';
import { readJson, writeText } from '../../utils/fs.js';
import { competitorResearchFileSchema } from '../schema/competitor.js';
import { renderCompetitorResearchReport } from './render-report.js';

export type GenerateCompetitorResearchReportFileOptions = {
  cwd?: string;
  competitors: string;
  output: string;
  dryRun?: boolean;
};

export type GenerateCompetitorResearchReportFileResult = {
  competitors: string;
  output: string;
  platformId: string;
  pageCount: number;
  domainCount: number;
  dryRun: boolean;
};

export async function generateCompetitorResearchReportFile(
  options: GenerateCompetitorResearchReportFileOptions,
): Promise<GenerateCompetitorResearchReportFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const competitorPath = resolvePath(cwd, options.competitors);
  const outputPath = resolvePath(cwd, options.output);
  const competitorFile = competitorResearchFileSchema.parse(await readJson(competitorPath));
  const markdown = renderCompetitorResearchReport({ competitorFile });

  if (!options.dryRun) {
    await writeText(outputPath, markdown);
  }

  return {
    competitors: path.relative(cwd, competitorPath),
    output: path.relative(cwd, outputPath),
    platformId: competitorFile.platformId,
    pageCount: competitorFile.pages.length,
    domainCount: new Set(competitorFile.pages.map((page) => page.domain)).size,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
