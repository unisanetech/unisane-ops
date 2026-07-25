import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { keywordCandidateFileSchema } from '../schema/keyword.js';
import { keywordSeedFileSchema } from '../schema/seed.js';
import { expandKeywordSeeds } from './expand-keywords.js';

export type ExpandKeywordSeedFileOptions = {
  cwd?: string;
  input: string;
  output: string;
  patternPackId: string;
  dryRun?: boolean;
};

export type ExpandKeywordSeedFileResult = {
  input: string;
  output: string;
  patternPack: string;
  candidateCount: number;
  dryRun: boolean;
};

export async function expandKeywordSeedFile(
  options: ExpandKeywordSeedFileOptions,
): Promise<ExpandKeywordSeedFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const inputPath = resolvePath(cwd, options.input);
  const outputPath = resolvePath(cwd, options.output);
  const seedFile = keywordSeedFileSchema.parse(await readJson(inputPath));
  const expandedFile = keywordCandidateFileSchema.parse(
    expandKeywordSeeds({
      seedFile,
      patternPackId: options.patternPackId,
    }),
  );

  if (!options.dryRun) {
    await writeJson(outputPath, expandedFile);
  }

  return {
    input: path.relative(cwd, inputPath),
    output: path.relative(cwd, outputPath),
    patternPack: expandedFile.patternPack,
    candidateCount: expandedFile.candidates.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
