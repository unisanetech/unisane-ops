import path from 'node:path';
import { readText, writeJson } from '../../utils/fs.js';
import { parseCsvRecords } from '../providers/csv/parse-csv.js';
import { trendSignalFileSchema, type TrendsProvider } from '../schema/trends.js';
import { mapTrendCsv } from './map-csv.js';

export type ImportTrendSignalFileOptions = {
  cwd?: string;
  platformId: string;
  input: string;
  output: string;
  provider?: TrendsProvider;
  country?: string;
  language?: string;
  dateRange?: string;
  dryRun?: boolean;
};

export type ImportTrendSignalFileResult = {
  input: string;
  output: string;
  platformId: string;
  provider: TrendsProvider;
  signalCount: number;
  termCount: number;
  relatedQueryCount: number;
  dryRun: boolean;
};

export async function importTrendSignalFile(
  options: ImportTrendSignalFileOptions,
): Promise<ImportTrendSignalFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const provider = options.provider ?? 'google-trends';
  const records = parseCsvRecords(await readText(inputPath));
  const relativeInput = path.relative(cwd, inputPath);
  const trendFile = trendSignalFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    provider,
    country: cleanOptional(options.country),
    language: cleanOptional(options.language),
    dateRange: cleanOptional(options.dateRange),
    source: {
      kind: 'csv-import',
      input: relativeInput,
    },
    signals: mapTrendCsv({
      records,
      platformId: options.platformId,
      provider,
      country: cleanOptional(options.country),
      language: cleanOptional(options.language),
      dateRange: cleanOptional(options.dateRange),
      sourceFile: relativeInput,
    }),
  });

  if (!options.dryRun) {
    await writeJson(outputPath, trendFile);
  }

  return {
    input: relativeInput,
    output: path.relative(cwd, outputPath),
    platformId: trendFile.platformId,
    provider: trendFile.provider,
    signalCount: trendFile.signals.length,
    termCount: new Set(trendFile.signals.map((signal) => signal.normalizedTerm)).size,
    relatedQueryCount: trendFile.signals.filter((signal) => signal.relatedQuery).length,
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
