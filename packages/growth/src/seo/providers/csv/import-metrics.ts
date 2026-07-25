import path from 'node:path';
import { readText, writeJson } from '../../../utils/fs.js';
import { keywordMetricFileSchema, type KeywordMetricProvider } from '../../schema/metric.js';
import { mapCsvMetrics } from './map-columns.js';
import { parseCsvRecords } from './parse-csv.js';

export type ImportCsvKeywordMetricsOptions = {
  cwd?: string;
  platformId: string;
  input: string;
  output: string;
  country: string;
  language: string;
  provider?: KeywordMetricProvider;
  dryRun?: boolean;
};

export type ImportCsvKeywordMetricsResult = {
  input: string;
  output: string;
  platformId: string;
  country: string;
  language: string;
  provider: KeywordMetricProvider;
  metricCount: number;
  dryRun: boolean;
};

export async function importCsvKeywordMetrics(
  options: ImportCsvKeywordMetricsOptions,
): Promise<ImportCsvKeywordMetricsResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const provider = options.provider ?? 'csv-import';
  const records = parseCsvRecords(await readText(inputPath));
  const metricFile = keywordMetricFileSchema.parse({
    version: 1,
    platformId: options.platformId,
    country: options.country,
    language: options.language,
    provider,
    metrics: mapCsvMetrics({
      records,
      platformId: options.platformId,
      country: options.country,
      language: options.language,
      provider,
      sourceFile: path.relative(cwd, inputPath),
    }),
  });

  if (!options.dryRun) {
    await writeJson(outputPath, metricFile);
  }

  return {
    input: path.relative(cwd, inputPath),
    output: path.relative(cwd, outputPath),
    platformId: options.platformId,
    country: options.country,
    language: options.language,
    provider,
    metricCount: metricFile.metrics.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
