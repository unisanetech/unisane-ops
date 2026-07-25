import path from 'node:path';
import { readText, writeJson } from '../../utils/fs.js';
import { parseCsvRecords } from '../providers/csv/parse-csv.js';
import { seoPerformanceFileSchema, type SeoPerformanceSource } from '../schema/performance.js';
import { mapSeoPerformanceCsv } from './map-csv.js';

export type ImportSeoPerformanceFileOptions = {
  cwd?: string;
  platformId: string;
  source: SeoPerformanceSource;
  input: string;
  output: string;
  property?: string;
  dateRange?: string;
  dryRun?: boolean;
};

export type ImportSeoPerformanceFileResult = {
  input: string;
  output: string;
  platformId: string;
  source: SeoPerformanceSource;
  recordCount: number;
  pageCount: number;
  queryCount: number;
  dryRun: boolean;
};

export async function importSeoPerformanceFile(
  options: ImportSeoPerformanceFileOptions,
): Promise<ImportSeoPerformanceFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const records = parseCsvRecords(await readText(inputPath));
  const performanceFile = seoPerformanceFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    source: options.source,
    property: cleanOptional(options.property),
    dateRange: cleanOptional(options.dateRange),
    records: mapSeoPerformanceCsv({
      records,
      platformId: options.platformId,
      source: options.source,
      sourceFile: path.relative(cwd, inputPath),
    }),
  });

  if (!options.dryRun) {
    await writeJson(outputPath, performanceFile);
  }

  return {
    input: path.relative(cwd, inputPath),
    output: path.relative(cwd, outputPath),
    platformId: performanceFile.platformId,
    source: performanceFile.source,
    recordCount: performanceFile.records.length,
    pageCount: new Set(performanceFile.records.map((record) => record.pagePath)).size,
    queryCount: new Set(performanceFile.records.flatMap((record) => record.query ?? [])).size,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
