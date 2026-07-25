import path from 'node:path';
import { readJson, writeText } from '../../utils/fs.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { seoPerformanceFileSchema } from '../schema/performance.js';
import { renderSeoPerformanceReport } from './render-report.js';

export type GenerateSeoPerformanceReportFileOptions = {
  cwd?: string;
  searchConsole?: string;
  ga4?: string;
  opportunities?: string;
  output: string;
  dryRun?: boolean;
};

export type GenerateSeoPerformanceReportFileResult = {
  output: string;
  searchConsole?: string;
  ga4?: string;
  opportunities?: string;
  platformId: string;
  dryRun: boolean;
};

export async function generateSeoPerformanceReportFile(
  options: GenerateSeoPerformanceReportFileOptions,
): Promise<GenerateSeoPerformanceReportFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const outputPath = resolvePath(cwd, options.output);
  const searchConsolePath = options.searchConsole
    ? resolvePath(cwd, options.searchConsole)
    : undefined;
  const ga4Path = options.ga4 ? resolvePath(cwd, options.ga4) : undefined;
  const opportunityPath = options.opportunities
    ? resolvePath(cwd, options.opportunities)
    : undefined;
  const searchConsoleFile = searchConsolePath
    ? seoPerformanceFileSchema.parse(await readJson(searchConsolePath))
    : undefined;
  const ga4File = ga4Path ? seoPerformanceFileSchema.parse(await readJson(ga4Path)) : undefined;
  const opportunityFile = opportunityPath
    ? pageOpportunityFileSchema.parse(await readJson(opportunityPath))
    : undefined;
  const markdown = renderSeoPerformanceReport({
    searchConsoleFile,
    ga4File,
    opportunityFile,
  });

  if (!options.dryRun) {
    await writeText(outputPath, markdown);
  }

  return {
    output: path.relative(cwd, outputPath),
    searchConsole: searchConsolePath ? path.relative(cwd, searchConsolePath) : undefined,
    ga4: ga4Path ? path.relative(cwd, ga4Path) : undefined,
    opportunities: opportunityPath ? path.relative(cwd, opportunityPath) : undefined,
    platformId:
      opportunityFile?.platformId ??
      searchConsoleFile?.platformId ??
      ga4File?.platformId ??
      'unknown-platform',
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
