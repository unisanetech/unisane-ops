import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportRecord,
} from '../schema/report.js';
import { readMarketingProviderReportStatus } from '../reports/provider-pulls.js';
import { ensurePathWithinCwd, providerLatestPullPath } from '../reports/paths.js';

const competitorPrioritySchema = z.enum(['high', 'medium', 'low']);

export const marketingAdsCompetitorEntrySchema = z.object({
  id: z.string().min(1),
  domain: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  priority: competitorPrioritySchema,
  reason: z.string().min(1),
});

export const marketingAdsCompetitorRegistrySchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  appId: z.string().min(1),
  generatedAt: z.string().datetime(),
  owner: z.string().min(1),
  entries: z.array(marketingAdsCompetitorEntrySchema).default([]),
});

export type MarketingAdsCompetitorEntry = z.infer<typeof marketingAdsCompetitorEntrySchema>;
export type MarketingAdsCompetitorRegistry = z.infer<typeof marketingAdsCompetitorRegistrySchema>;

export type MarketingAdsCompetitorAction =
  | 'monitor'
  | 'landing_page_review'
  | 'bid_pressure_review'
  | 'creative_review'
  | 'positioning_research';

export type MarketingAdsCompetitorSignal = {
  domain: string;
  name?: string;
  known: boolean;
  category?: string;
  priority?: MarketingAdsCompetitorEntry['priority'];
  campaignId?: string;
  campaignName?: string;
  metrics: {
    impressionShare?: number;
    overlapRate?: number;
    positionAboveRate?: number;
    outrankingShare?: number;
    topImpressionPercentage?: number;
    absoluteTopImpressionPercentage?: number;
  };
  pressure: 'high' | 'medium' | 'low';
  actions: MarketingAdsCompetitorAction[];
  reason: string;
};

export type MarketingAdsCompetitorCheck = {
  id: string;
  status: 'pass' | 'warn' | 'error';
  message: string;
  path?: string;
};

export type MarketingAdsCompetitorMonitorReport = {
  kind: 'unisane.marketing.ads.competitors';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  cwd: string;
  platformId: string;
  appId: string;
  ok: boolean;
  registryPath: string;
  auctionInsightsPath: string;
  sourceStatus: ReturnType<typeof readMarketingProviderReportStatus>['providers'][number];
  summary: {
    knownCompetitors: number;
    auctionInsightRows: number;
    domains: number;
    knownDomainsSeen: number;
    unknownDomainsSeen: number;
    highPressureDomains: number;
    mediumPressureDomains: number;
  };
  checks: MarketingAdsCompetitorCheck[];
  signals: MarketingAdsCompetitorSignal[];
  nextWorkflowStep: string;
};

export type MarketingAdsCompetitorMonitorOptions = {
  cwd?: string;
  registryPath?: string;
  auctionInsightsPath?: string;
  maxAgeDays?: number;
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingAdsCompetitorMonitorResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  report: MarketingAdsCompetitorMonitorReport;
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function defaultRegistryPath(cwd: string): string {
  return path.join(cwd, 'docs', 'marketing', 'ads', 'competitors.json');
}

function defaultOutputPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'competitors', 'latest.json');
}

function resolveWithinCwd(cwd: string, inputPath: string | undefined, fallback: string): string {
  const resolved = inputPath ? path.resolve(cwd, inputPath) : fallback;
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function normalizeDomain(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? value.trim().toLowerCase()
  );
}

function duplicateDomains(entries: MarketingAdsCompetitorEntry[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const domain = normalizeDomain(entry.domain);
    if (seen.has(domain)) duplicates.add(domain);
    seen.add(domain);
  }
  return [...duplicates];
}

function readAuctionInsightRows(auctionInsightsPath: string): MarketingProviderReportRecord[] {
  if (!existsSync(auctionInsightsPath)) return [];
  return marketingProviderReportArtifactSchema.parse(readJsonFile(auctionInsightsPath)).records;
}

function maxDefined(...values: Array<number | undefined>): number | undefined {
  const defined = values.filter((value): value is number => typeof value === 'number');
  return defined.length ? Math.max(...defined) : undefined;
}

function pressureFromMetrics(
  signal: MarketingAdsCompetitorSignal['metrics'],
): MarketingAdsCompetitorSignal['pressure'] {
  const topPresence = maxDefined(
    signal.topImpressionPercentage,
    signal.absoluteTopImpressionPercentage,
  );
  if (
    (signal.impressionShare ?? 0) >= 0.3 ||
    (signal.overlapRate ?? 0) >= 0.5 ||
    (signal.positionAboveRate ?? 0) >= 0.35 ||
    (topPresence ?? 0) >= 0.45
  ) {
    return 'high';
  }
  if (
    (signal.impressionShare ?? 0) >= 0.15 ||
    (signal.overlapRate ?? 0) >= 0.25 ||
    (signal.positionAboveRate ?? 0) >= 0.15 ||
    (topPresence ?? 0) >= 0.25
  ) {
    return 'medium';
  }
  return 'low';
}

function actionsForSignal(
  signal: Omit<MarketingAdsCompetitorSignal, 'actions' | 'reason'>,
): MarketingAdsCompetitorAction[] {
  const actions: MarketingAdsCompetitorAction[] = [];
  if (!signal.known) actions.push('positioning_research');
  if (signal.pressure === 'high') actions.push('landing_page_review', 'bid_pressure_review');
  if ((signal.metrics.positionAboveRate ?? 0) >= 0.25) actions.push('creative_review');
  if (actions.length === 0) actions.push('monitor');
  return [...new Set(actions)];
}

function reasonForSignal(signal: Omit<MarketingAdsCompetitorSignal, 'reason'>): string {
  if (!signal.known) {
    return 'Auction Insights shows an untracked domain; classify it before changing campaign settings.';
  }
  if (signal.pressure === 'high') {
    return 'Competitor has high auction pressure; review landing-page promise, ad copy, bid posture, and query fit.';
  }
  if (signal.pressure === 'medium') {
    return 'Competitor is visible enough to monitor weekly and compare against conversion economics.';
  }
  return 'Competitor pressure is currently low; keep it in trend monitoring.';
}

function buildSignals(
  rows: MarketingProviderReportRecord[],
  entries: MarketingAdsCompetitorEntry[],
): MarketingAdsCompetitorSignal[] {
  const entryByDomain = new Map(entries.map((entry) => [normalizeDomain(entry.domain), entry]));
  return rows
    .map((record): MarketingAdsCompetitorSignal | undefined => {
      if (!record.auctionInsightDomain) return undefined;
      const domain = normalizeDomain(record.auctionInsightDomain);
      const entry = entryByDomain.get(domain);
      const metrics = {
        impressionShare: record.auctionInsightSearchImpressionShare,
        overlapRate: record.auctionInsightSearchOverlapRate,
        positionAboveRate: record.auctionInsightSearchPositionAboveRate,
        outrankingShare: record.auctionInsightSearchOutrankingShare,
        topImpressionPercentage: record.auctionInsightSearchTopImpressionPercentage,
        absoluteTopImpressionPercentage: record.auctionInsightSearchAbsoluteTopImpressionPercentage,
      };
      const base = {
        domain,
        name: entry?.name,
        known: Boolean(entry),
        category: entry?.category,
        priority: entry?.priority,
        campaignId: record.campaignId,
        campaignName: record.campaignName,
        metrics,
        pressure: pressureFromMetrics(metrics),
      };
      const withActions = {
        ...base,
        actions: actionsForSignal(base),
      };
      return {
        ...withActions,
        reason: reasonForSignal(withActions),
      };
    })
    .filter((signal): signal is MarketingAdsCompetitorSignal => Boolean(signal))
    .sort((a, b) => {
      const pressureOrder = { high: 0, medium: 1, low: 2 };
      return pressureOrder[a.pressure] - pressureOrder[b.pressure];
    });
}

export function buildMarketingAdsCompetitorMonitorReport(
  config: MarketingExecutionContext,
  options: MarketingAdsCompetitorMonitorOptions = {},
): MarketingAdsCompetitorMonitorReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const registryPath = resolveWithinCwd(cwd, options.registryPath, defaultRegistryPath(cwd));
  const auctionInsightsPath = resolveWithinCwd(
    cwd,
    options.auctionInsightsPath,
    providerLatestPullPath(cwd, 'googleAds', 'auctionInsight'),
  );
  const sourceStatusReport = readMarketingProviderReportStatus({
    cwd,
    provider: 'googleAds',
    reportType: 'auctionInsight',
    maxAgeDays: options.maxAgeDays,
    now,
  });
  const sourceStatus = sourceStatusReport.providers[0] ?? {
    provider: 'googleAds',
    reportType: 'auctionInsight',
    status: 'missing',
    path: auctionInsightsPath,
    exists: false,
    message: 'googleAds/auctionInsight has no latest provider pull artifact.',
  };
  const checks: MarketingAdsCompetitorCheck[] = [];
  const registry = existsSync(registryPath)
    ? marketingAdsCompetitorRegistrySchema.parse(readJsonFile(registryPath))
    : undefined;

  checks.push({
    id: 'registry.exists',
    status: registry ? 'pass' : 'error',
    message: registry
      ? `Competitor registry has ${registry.entries.length} entries.`
      : `Competitor registry was not found at ${registryPath}.`,
    path: registryPath,
  });

  const entries = registry?.entries ?? [];
  const duplicates = duplicateDomains(entries);
  checks.push({
    id: 'registry.duplicates',
    status: duplicates.length === 0 ? 'pass' : 'warn',
    message:
      duplicates.length === 0
        ? 'No duplicate competitor domains found.'
        : `${duplicates.length} duplicate competitor domain(s) found.`,
    path: registryPath,
  });

  checks.push({
    id: 'auctionInsights.exists',
    status: existsSync(auctionInsightsPath) ? 'pass' : 'warn',
    message: existsSync(auctionInsightsPath)
      ? `Auction Insights artifact is available at ${auctionInsightsPath}.`
      : `Auction Insights artifact was not found at ${auctionInsightsPath}.`,
    path: auctionInsightsPath,
  });

  const rows = readAuctionInsightRows(auctionInsightsPath);
  const signals = buildSignals(rows, entries);
  const domains = new Set(signals.map((signal) => signal.domain));
  const unknownDomains = signals.filter((signal) => !signal.known);
  checks.push({
    id: 'auctionInsights.unknownDomains',
    status: unknownDomains.length === 0 ? 'pass' : 'warn',
    message:
      unknownDomains.length === 0
        ? 'All visible auction domains are in the competitor registry.'
        : `${unknownDomains.length} visible auction domain row(s) are not in the competitor registry.`,
    path: auctionInsightsPath,
  });

  const highPressure = signals.filter((signal) => signal.pressure === 'high').length;
  const ok = Boolean(registry) && sourceStatus.status !== 'error';

  return {
    kind: 'unisane.marketing.ads.competitors',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    cwd,
    platformId: config.platformId,
    appId: config.appId,
    ok,
    registryPath,
    auctionInsightsPath,
    sourceStatus,
    summary: {
      knownCompetitors: entries.length,
      auctionInsightRows: rows.length,
      domains: domains.size,
      knownDomainsSeen: signals.filter((signal) => signal.known).length,
      unknownDomainsSeen: unknownDomains.length,
      highPressureDomains: highPressure,
      mediumPressureDomains: signals.filter((signal) => signal.pressure === 'medium').length,
    },
    checks,
    signals,
    nextWorkflowStep:
      rows.length === 0
        ? 'Run `unisane-ops growth ads pull --provider googleAds --report auctionInsight --api` after enough auction volume exists.'
        : highPressure > 0
          ? 'Review high-pressure competitors against landing pages, ad copy, bids, and conversion economics before changing budgets.'
          : 'Keep weekly competitor trend monitoring and refresh the registry when new domains appear.',
  };
}

export function writeMarketingAdsCompetitorMonitorReport(
  config: MarketingExecutionContext,
  options: MarketingAdsCompetitorMonitorOptions = {},
): MarketingAdsCompetitorMonitorResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const report = buildMarketingAdsCompetitorMonitorReport(config, options);
  if (options.dryRun) {
    return { ok: report.ok, dryRun: true, report };
  }
  const outputPath = resolveWithinCwd(cwd, options.out, defaultOutputPath(cwd));
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ok: report.ok, dryRun: false, path: outputPath, report };
}
