import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportRecord,
} from '../schema/report.js';
import { readMarketingProviderReportStatus } from '../reports/provider-pulls.js';
import { ensurePathWithinCwd, providerLatestPullPath } from '../reports/paths.js';

export type MarketingAdsSearchTermAction =
  | 'add_negative'
  | 'promote_keyword'
  | 'create_landing_page'
  | 'create_seo_page'
  | 'product_insight'
  | 'monitor';

export type MarketingAdsSearchTermClassification = {
  query: string;
  campaignId?: string;
  campaignName?: string;
  adGroupId?: string;
  adGroupName?: string;
  metrics: MarketingProviderReportRecord['metrics'];
  actions: MarketingAdsSearchTermAction[];
  intent: 'commercial' | 'comparison' | 'template' | 'ats' | 'fresher' | 'utility' | 'lowIntent';
  reason: string;
  suggestedKeyword?: {
    text: string;
    matchType: 'EXACT' | 'PHRASE';
  };
  suggestedNegative?: {
    text: string;
    matchType: 'PHRASE' | 'EXACT';
  };
  suggestedLandingPage?: string;
};

export type MarketingAdsSearchTermsReport = {
  kind: 'unisane.marketing.ads.search-terms';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  cwd: string;
  platformId: string;
  appId: string;
  ok: boolean;
  sourcePath: string;
  sourceStatus: ReturnType<typeof readMarketingProviderReportStatus>['providers'][number];
  summary: {
    totalQueries: number;
    negativeCandidates: number;
    keywordPromotions: number;
    landingPageOpportunities: number;
    seoOpportunities: number;
    productInsights: number;
  };
  classifications: MarketingAdsSearchTermClassification[];
  nextWorkflowStep: string;
};

export type MarketingAdsSearchTermsOptions = {
  cwd?: string;
  maxAgeDays?: number;
  now?: Date;
  out?: string;
  dryRun?: boolean;
};

export type MarketingAdsSearchTermsResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  report: MarketingAdsSearchTermsReport;
};

const negativePatterns = [
  'job',
  'jobs',
  'salary',
  'meaning',
  'definition',
  'spell',
  'apk',
  'mod',
  'cracked',
  'nulled',
] as const;

const comparisonPatterns = ['alternative', 'review', 'reviews', 'best', 'vs', 'compare'] as const;
const atsPatterns = ['ats', 'applicant tracking', 'resume checker', 'resume score'] as const;
const templatePatterns = ['template', 'format', 'sample', 'example'] as const;
const fresherPatterns = ['fresher', 'student', 'no experience', 'entry level'] as const;
const utilityPatterns = ['pdf', 'download', 'maker', 'builder', 'create'] as const;

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function includesAny(query: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => query.includes(pattern));
}

function slugFromQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function classifyIntent(query: string): MarketingAdsSearchTermClassification['intent'] {
  if (includesAny(query, atsPatterns)) return 'ats';
  if (includesAny(query, fresherPatterns)) return 'fresher';
  if (includesAny(query, comparisonPatterns)) return 'comparison';
  if (includesAny(query, templatePatterns)) return 'template';
  if (includesAny(query, utilityPatterns)) return 'utility';
  if (includesAny(query, negativePatterns)) return 'lowIntent';
  return 'commercial';
}

function classifySearchTerm(
  record: MarketingProviderReportRecord,
): MarketingAdsSearchTermClassification | undefined {
  const rawQuery = record.query?.trim();
  if (!rawQuery) return undefined;
  const query = rawQuery.toLowerCase();
  const conversions = record.metrics.conversions ?? 0;
  const clicks = record.metrics.clicks ?? 0;
  const impressions = record.metrics.impressions ?? 0;
  const cost = record.metrics.cost ?? 0;
  const intent = classifyIntent(query);
  const actions: MarketingAdsSearchTermAction[] = [];
  let reason = 'Monitor until enough click and conversion signal exists.';

  if (includesAny(query, negativePatterns) && conversions === 0) {
    actions.push('add_negative');
    reason = 'Looks low-intent or irrelevant and has no conversion signal.';
  }

  if (conversions > 0 || (clicks >= 5 && cost > 0 && !actions.includes('add_negative'))) {
    actions.push('promote_keyword');
    reason =
      conversions > 0
        ? 'Has conversion signal; promote into controlled exact or phrase coverage.'
        : 'Has click/spend signal; review for controlled keyword coverage.';
  }

  if (
    includesAny(query, [
      ...atsPatterns,
      ...templatePatterns,
      ...fresherPatterns,
      ...utilityPatterns,
    ]) &&
    impressions > 0
  ) {
    actions.push('create_landing_page');
    if (!actions.includes('promote_keyword')) {
      reason = 'Repeated product-specific intent should map to a dedicated landing page.';
    }
  }

  if (
    includesAny(query, [...templatePatterns, ...fresherPatterns, 'software engineer', 'teacher']) &&
    impressions >= 10
  ) {
    actions.push('create_seo_page');
  }

  if (includesAny(query, ['checker', 'score', 'tailor', 'download', 'pdf'])) {
    actions.push('product_insight');
  }

  if (actions.length === 0) actions.push('monitor');

  const suggestedNegative = actions.includes('add_negative')
    ? {
        text: rawQuery,
        matchType: query.split(/\s+/).length > 1 ? ('PHRASE' as const) : ('EXACT' as const),
      }
    : undefined;
  const suggestedKeyword = actions.includes('promote_keyword')
    ? { text: rawQuery, matchType: conversions > 0 ? ('EXACT' as const) : ('PHRASE' as const) }
    : undefined;
  const suggestedLandingPage = actions.includes('create_landing_page')
    ? `/${slugFromQuery(rawQuery)}`
    : undefined;

  return {
    query: rawQuery,
    campaignId: record.campaignId,
    campaignName: record.campaignName,
    adGroupId: record.adGroupId,
    adGroupName: record.adGroupName,
    metrics: record.metrics,
    actions,
    intent,
    reason,
    suggestedKeyword,
    suggestedNegative,
    suggestedLandingPage,
  };
}

function defaultOutputPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms', 'latest.json');
}

function resolveOutputPath(cwd: string, out: string | undefined): string {
  const resolved = out ? path.resolve(cwd, out) : defaultOutputPath(cwd);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export function buildMarketingAdsSearchTermsReport(
  config: MarketingConfig,
  options: MarketingAdsSearchTermsOptions = {},
): MarketingAdsSearchTermsReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const sourcePath = providerLatestPullPath(cwd, 'googleAds', 'query');
  const sourceStatusReport = readMarketingProviderReportStatus({
    cwd,
    provider: 'googleAds',
    reportType: 'query',
    maxAgeDays: options.maxAgeDays,
    now,
  });
  const sourceStatus = sourceStatusReport.providers[0] ?? {
    provider: 'googleAds',
    reportType: 'query',
    status: 'missing',
    path: sourcePath,
    exists: false,
    message: 'googleAds/query has no latest provider pull artifact.',
  };
  const records = existsSync(sourcePath)
    ? marketingProviderReportArtifactSchema.parse(readJsonFile(sourcePath)).records
    : [];
  const classifications = records
    .map((record) => classifySearchTerm(record))
    .filter((classification): classification is MarketingAdsSearchTermClassification =>
      Boolean(classification),
    );
  const countAction = (action: MarketingAdsSearchTermAction): number =>
    classifications.filter((classification) => classification.actions.includes(action)).length;
  const ok = sourceStatus?.status === 'fresh' || sourceStatus?.status === 'partial';

  return {
    kind: 'unisane.marketing.ads.search-terms',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    cwd,
    platformId: config.platformId,
    appId: config.appId,
    ok,
    sourcePath,
    sourceStatus,
    summary: {
      totalQueries: classifications.length,
      negativeCandidates: countAction('add_negative'),
      keywordPromotions: countAction('promote_keyword'),
      landingPageOpportunities: countAction('create_landing_page'),
      seoOpportunities: countAction('create_seo_page'),
      productInsights: countAction('product_insight'),
    },
    classifications,
    nextWorkflowStep: ok
      ? 'Review search-term classifications, then promote approved negatives, keywords, and landing-page backlog items.'
      : 'Run `unisane growth ads pull --provider googleAds --report query --api` before search-term classification.',
  };
}

export function writeMarketingAdsSearchTermsReport(
  config: MarketingConfig,
  options: MarketingAdsSearchTermsOptions = {},
): MarketingAdsSearchTermsResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const report = buildMarketingAdsSearchTermsReport(config, options);
  if (options.dryRun) {
    return { ok: report.ok, dryRun: true, report };
  }
  const outputPath = resolveOutputPath(cwd, options.out);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ok: report.ok, dryRun: false, path: outputPath, report };
}
