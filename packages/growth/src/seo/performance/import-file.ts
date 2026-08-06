import path from 'node:path';
import { readText, writeJson } from '../../utils/fs.js';
import { parseCsvRecords } from '../providers/csv/parse-csv.js';
import {
  createSeoPerformanceEvidence,
  seoPerformanceFileSchema,
  type SeoPerformanceSource,
} from '../schema/performance.js';
import { mapSeoPerformanceCsv } from './map-csv.js';
import { resolveSeoPerformanceContext } from './context.js';

export type ImportSeoPerformanceFileOptions = {
  cwd?: string;
  platformId?: string;
  source: SeoPerformanceSource;
  input: string;
  output?: string;
  property: string;
  startDate: string;
  endDate: string;
  sampleData: boolean;
  freshnessHours?: number;
  dryRun?: boolean;
  now?: () => Date;
};

export type ImportSeoPerformanceFileResult = {
  input: string;
  output: string;
  platformId: string;
  source: SeoPerformanceSource;
  siteUrl: string;
  property: string;
  sampleData: boolean;
  freshUntil: string;
  recordCount: number;
  pageCount: number;
  queryCount: number;
  dryRun: boolean;
};

export async function importSeoPerformanceFile(
  options: ImportSeoPerformanceFileOptions,
): Promise<ImportSeoPerformanceFileResult> {
  const context = await resolveSeoPerformanceContext({
    cwd: options.cwd,
    platformId: options.platformId,
    source: options.source,
    property: options.property,
  });
  const cwd = context.cwd;
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = options.output ? resolvePath(cwd, options.output) : context.defaultOutput;
  const records = parseCsvRecords(await readText(inputPath));
  const observedAt = (options.now ?? (() => new Date()))().toISOString();
  const performanceFile = seoPerformanceFileSchema.parse({
    version: 2,
    platformId: context.platformId,
    source: options.source,
    siteUrl: context.siteUrl,
    targetMarkets: context.targetMarkets,
    property: context.property,
    dateRange: {
      startDate: options.startDate,
      endDate: options.endDate,
    },
    evidence: createSeoPerformanceEvidence({
      acquisition: 'csv-import',
      sampleData: options.sampleData,
      observedAt,
      freshnessHours: options.freshnessHours ?? context.freshnessHours,
      limitations: buildImportLimitations(options.source),
    }),
    records: mapSeoPerformanceCsv({
      records,
      platformId: context.platformId,
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
    siteUrl: performanceFile.siteUrl,
    property: performanceFile.property,
    sampleData: performanceFile.evidence.sampleData,
    freshUntil: performanceFile.evidence.freshUntil,
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

function buildImportLimitations(source: SeoPerformanceSource): string[] {
  const limitations = [
    'CSV evidence preserves provider rows but cannot prove export completeness.',
  ];
  if (source === 'ga4') {
    limitations.push(
      'Analytics conversions and revenue are provider-measured and are not canonical business outcomes.',
    );
  }
  return limitations;
}
