import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { MarketingConfig } from '../schema/marketing-config.js';
import { ensurePathWithinCwd } from '../reports/paths.js';

const negativeKeywordMatchTypeSchema = z.enum(['exact', 'phrase', 'broad']);
const negativeKeywordScopeSchema = z.enum(['account', 'campaign', 'adGroup']);

export const marketingNegativeKeywordEntrySchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  matchType: negativeKeywordMatchTypeSchema,
  scope: negativeKeywordScopeSchema,
  campaignId: z.string().min(1).optional(),
  campaignName: z.string().min(1).optional(),
  adGroupId: z.string().min(1).optional(),
  adGroupName: z.string().min(1).optional(),
  theme: z.string().min(1),
  reason: z.string().min(1),
});

export const marketingNegativeKeywordRegistrySchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  owner: z.string().min(1),
  entries: z.array(marketingNegativeKeywordEntrySchema).default([]),
});

const searchTermsClassificationSchema = z.object({
  query: z.string().min(1),
  actions: z.array(z.string().min(1)).default([]),
  suggestedNegative: z
    .object({
      text: z.string().min(1),
      matchType: z.string().min(1),
    })
    .optional(),
});

const searchTermsReportSchema = z.object({
  classifications: z.array(searchTermsClassificationSchema).default([]),
});

export type MarketingNegativeKeywordEntry = z.infer<typeof marketingNegativeKeywordEntrySchema>;
export type MarketingNegativeKeywordRegistry = z.infer<
  typeof marketingNegativeKeywordRegistrySchema
>;

export type MarketingNegativeKeywordCoverage = {
  query: string;
  covered: boolean;
  matchedEntryId?: string;
  suggestedNegative?: string;
};

export type MarketingNegativeKeywordCheck = {
  id: string;
  status: 'pass' | 'warn' | 'error';
  message: string;
  path?: string;
};

export type MarketingNegativeKeywordReport = {
  kind: 'unisane.marketing.ads.negative-keywords';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  cwd: string;
  platformId: string;
  appId: string;
  ok: boolean;
  registryPath: string;
  searchTermsPath: string;
  summary: {
    entries: number;
    accountLevel: number;
    campaignLevel: number;
    adGroupLevel: number;
    duplicateTexts: number;
    searchTermNegativeCandidates: number;
    uncoveredSearchTermNegatives: number;
  };
  checks: MarketingNegativeKeywordCheck[];
  coverage: MarketingNegativeKeywordCoverage[];
  nextWorkflowStep: string;
};

export type MarketingNegativeKeywordOptions = {
  cwd?: string;
  registryPath?: string;
  searchTermsPath?: string;
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingNegativeKeywordResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  report: MarketingNegativeKeywordReport;
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function defaultRegistryPath(cwd: string): string {
  return path.join(cwd, 'docs', 'marketing', 'ads', 'negative-keywords.json');
}

function defaultSearchTermsPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms', 'latest.json');
}

function defaultOutputPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'negative-keywords', 'latest.json');
}

function resolveWithinCwd(cwd: string, inputPath: string | undefined, fallback: string): string {
  const resolved = inputPath ? path.resolve(cwd, inputPath) : fallback;
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function entryCoversQuery(entry: MarketingNegativeKeywordEntry, query: string): boolean {
  const entryText = normalizeText(entry.text);
  const normalizedQuery = normalizeText(query);
  if (entry.matchType === 'exact') return entryText === normalizedQuery;
  return normalizedQuery.includes(entryText);
}

function duplicateTexts(entries: MarketingNegativeKeywordEntry[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.scope}:${normalizeText(entry.text)}`;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

function readSearchTermNegativeCandidates(searchTermsPath: string): Array<{
  query: string;
  suggestedNegative?: string;
}> {
  if (!existsSync(searchTermsPath)) return [];
  const parsed = searchTermsReportSchema.parse(readJsonFile(searchTermsPath));
  return parsed.classifications
    .filter((classification) => classification.actions.includes('add_negative'))
    .map((classification) => ({
      query: classification.query,
      suggestedNegative: classification.suggestedNegative?.text,
    }));
}

export function buildMarketingNegativeKeywordReport(
  config: MarketingConfig,
  options: MarketingNegativeKeywordOptions = {},
): MarketingNegativeKeywordReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const registryPath = resolveWithinCwd(cwd, options.registryPath, defaultRegistryPath(cwd));
  const searchTermsPath = resolveWithinCwd(
    cwd,
    options.searchTermsPath,
    defaultSearchTermsPath(cwd),
  );
  const checks: MarketingNegativeKeywordCheck[] = [];
  const registry = existsSync(registryPath)
    ? marketingNegativeKeywordRegistrySchema.parse(readJsonFile(registryPath))
    : undefined;

  checks.push({
    id: 'registry.exists',
    status: registry ? 'pass' : 'error',
    message: registry
      ? `Negative keyword registry has ${registry.entries.length} entries.`
      : `Negative keyword registry was not found at ${registryPath}.`,
    path: registryPath,
  });

  const entries = registry?.entries ?? [];
  const duplicates = duplicateTexts(entries);
  checks.push({
    id: 'registry.duplicates',
    status: duplicates.length === 0 ? 'pass' : 'warn',
    message:
      duplicates.length === 0
        ? 'No duplicate negative keyword text/scope pairs found.'
        : `${duplicates.length} duplicate negative keyword text/scope pair(s) found.`,
    path: registryPath,
  });
  checks.push({
    id: 'registry.scopedAdGroups',
    status: entries.some(
      (entry) => entry.scope === 'adGroup' && !entry.adGroupId && !entry.adGroupName,
    )
      ? 'warn'
      : 'pass',
    message: 'Ad-group negatives should include adGroupId or adGroupName when scope is adGroup.',
    path: registryPath,
  });

  const candidates = readSearchTermNegativeCandidates(searchTermsPath);
  checks.push({
    id: 'searchTerms.exists',
    status: existsSync(searchTermsPath) ? 'pass' : 'warn',
    message: existsSync(searchTermsPath)
      ? `Search-term intelligence artifact has ${candidates.length} negative candidate(s).`
      : `Search-term intelligence artifact was not found at ${searchTermsPath}.`,
    path: searchTermsPath,
  });

  const coverage = candidates.map((candidate) => {
    const matched = entries.find((entry) => entryCoversQuery(entry, candidate.query));
    return {
      query: candidate.query,
      covered: Boolean(matched),
      matchedEntryId: matched?.id,
      suggestedNegative: candidate.suggestedNegative,
    };
  });
  const uncovered = coverage.filter((entry) => !entry.covered);

  checks.push({
    id: 'searchTerms.coverage',
    status: uncovered.length === 0 ? 'pass' : 'warn',
    message:
      uncovered.length === 0
        ? 'All search-term negative candidates are covered by the registry.'
        : `${uncovered.length} search-term negative candidate(s) are not covered by the registry.`,
    path: searchTermsPath,
  });

  const ok = checks.every((check) => check.status !== 'error');

  return {
    kind: 'unisane.marketing.ads.negative-keywords',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    cwd,
    platformId: config.platformId,
    appId: config.appId,
    ok,
    registryPath,
    searchTermsPath,
    summary: {
      entries: entries.length,
      accountLevel: entries.filter((entry) => entry.scope === 'account').length,
      campaignLevel: entries.filter((entry) => entry.scope === 'campaign').length,
      adGroupLevel: entries.filter((entry) => entry.scope === 'adGroup').length,
      duplicateTexts: duplicates.length,
      searchTermNegativeCandidates: candidates.length,
      uncoveredSearchTermNegatives: uncovered.length,
    },
    checks,
    coverage,
    nextWorkflowStep: uncovered.length
      ? 'Review uncovered search-term negatives and add approved entries to docs/marketing/ads/negative-keywords.json.'
      : 'Use the registry as the source for guarded Google Ads negative keyword planning.',
  };
}

export function writeMarketingNegativeKeywordReport(
  config: MarketingConfig,
  options: MarketingNegativeKeywordOptions = {},
): MarketingNegativeKeywordResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const report = buildMarketingNegativeKeywordReport(config, options);
  if (options.dryRun) return { ok: report.ok, dryRun: true, report };
  const outputPath = resolveWithinCwd(cwd, options.out, defaultOutputPath(cwd));
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ok: report.ok, dryRun: false, path: outputPath, report };
}
