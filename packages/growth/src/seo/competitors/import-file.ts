import path from 'node:path';
import { readText, writeJson } from '../../utils/fs.js';
import type { CompetitorPageSource } from '../schema/competitor.js';
import { parseCsvRecords } from '../providers/csv/parse-csv.js';
import { importCompetitorCsv } from './import-csv.js';

export type ImportCompetitorResearchFileOptions = {
  cwd?: string;
  platformId: string;
  input: string;
  output: string;
  market?: string;
  source?: CompetitorPageSource;
  dryRun?: boolean;
};

export type ImportCompetitorResearchFileResult = {
  input: string;
  output: string;
  platformId: string;
  market?: string;
  source: CompetitorPageSource;
  pageCount: number;
  domainCount: number;
  keywordCount: number;
  dryRun: boolean;
};

export async function importCompetitorResearchFile(
  options: ImportCompetitorResearchFileOptions,
): Promise<ImportCompetitorResearchFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const source = options.source ?? 'csv-import';
  const records = parseCsvRecords(await readText(inputPath));
  const competitorFile = importCompetitorCsv({
    records,
    platformId: options.platformId,
    market: options.market,
    source,
    sourceFile: path.relative(cwd, inputPath),
  });

  if (!options.dryRun) {
    await writeJson(outputPath, competitorFile);
  }

  return {
    input: path.relative(cwd, inputPath),
    output: path.relative(cwd, outputPath),
    platformId: options.platformId,
    market: competitorFile.market,
    source,
    pageCount: competitorFile.pages.length,
    domainCount: new Set(competitorFile.pages.map((page) => page.domain)).size,
    keywordCount: new Set(competitorFile.pages.flatMap((page) => page.keyword ?? [])).size,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
