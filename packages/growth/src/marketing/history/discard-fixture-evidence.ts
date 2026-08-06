import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  marketingProviderReportArtifactSchema,
  marketingReportProviderSchema,
  type MarketingProviderReportArtifact,
  type MarketingReportProvider,
} from '../schema/report.js';
import { MARKETING_PROVIDER_PULL_CACHE_ROOT } from '../reports/paths.js';
import { rebuildMarketingHistoryCatalog } from './catalog.js';

export type DiscardMarketingFixtureEvidenceOptions = {
  cwd: string;
  provider: MarketingReportProvider;
  confirm?: boolean;
  now?: Date;
};

export type DiscardMarketingFixtureEvidenceResult = {
  ok: true;
  applied: boolean;
  provider: MarketingReportProvider;
  candidatePaths: string[];
  removedPaths: string[];
  restoredLatestPaths: string[];
  historyCatalogPath?: string;
  historyObservationCount?: number;
};

type ArtifactFile = {
  absolutePath: string;
  relativePath: string;
  artifact: MarketingProviderReportArtifact;
};

function artifactFiles(root: string, cwd: string): ArtifactFile[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return artifactFiles(entryPath, cwd);
    if (!entry.isFile() || !entry.name.endsWith('.json')) return [];
    const artifact = marketingProviderReportArtifactSchema.parse(
      JSON.parse(readFileSync(entryPath, 'utf8')),
    );
    return [{ absolutePath: entryPath, relativePath: path.relative(cwd, entryPath), artifact }];
  });
}

function restoreLatestAliases(input: {
  cwd: string;
  providerRoot: string;
  provider: MarketingReportProvider;
}): string[] {
  const surviving = artifactFiles(input.providerRoot, input.cwd).filter(
    (file) =>
      file.artifact.provider === input.provider &&
      path.basename(file.absolutePath) !== 'latest.json',
  );
  const byDirectory = new Map<string, ArtifactFile[]>();
  for (const file of surviving) {
    const directory = path.dirname(file.absolutePath);
    byDirectory.set(directory, [...(byDirectory.get(directory) ?? []), file]);
  }
  const restored: string[] = [];
  for (const [directory, files] of byDirectory) {
    const latestPath = path.join(directory, 'latest.json');
    if (existsSync(latestPath)) continue;
    const latest = files.sort((left, right) =>
      right.artifact.pulledAt.localeCompare(left.artifact.pulledAt),
    )[0];
    if (!latest) continue;
    writeFileSync(latestPath, readFileSync(latest.absolutePath, 'utf8'), 'utf8');
    restored.push(path.relative(input.cwd, latestPath));
  }
  return restored.sort();
}

export function discardMarketingFixtureEvidence(
  options: DiscardMarketingFixtureEvidenceOptions,
): DiscardMarketingFixtureEvidenceResult {
  const cwd = path.resolve(options.cwd);
  const provider = marketingReportProviderSchema.parse(options.provider);
  const providerRoot = path.resolve(cwd, MARKETING_PROVIDER_PULL_CACHE_ROOT, provider);
  const candidates = artifactFiles(providerRoot, cwd)
    .filter((file) => file.artifact.provider === provider && file.artifact.source === 'fixture')
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const candidatePaths = candidates.map((file) => file.relativePath);
  if (!options.confirm) {
    return {
      ok: true,
      applied: false,
      provider,
      candidatePaths,
      removedPaths: [],
      restoredLatestPaths: [],
    };
  }
  for (const candidate of candidates) unlinkSync(candidate.absolutePath);
  const restoredLatestPaths = restoreLatestAliases({ cwd, providerRoot, provider });
  const rebuilt = rebuildMarketingHistoryCatalog({ cwd, now: options.now });
  return {
    ok: true,
    applied: true,
    provider,
    candidatePaths,
    removedPaths: candidatePaths,
    restoredLatestPaths,
    historyCatalogPath: path.relative(cwd, rebuilt.catalogPath),
    historyObservationCount: rebuilt.catalog.observations.length,
  };
}
