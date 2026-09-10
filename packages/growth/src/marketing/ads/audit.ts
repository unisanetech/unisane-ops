import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  auditMarketingTrackingSource,
  type MarketingTrackingAuditReport,
} from '../tracking/audit-source.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import {
  buildMarketingAdsCompetitorMonitorReport,
  type MarketingAdsCompetitorMonitorReport,
} from './competitors.js';
import {
  buildMarketingAdsCreativeStatusReport,
  type MarketingAdsCreativeStatusReport,
} from './creative-status.js';
import {
  buildMarketingNegativeKeywordReport,
  type MarketingNegativeKeywordReport,
} from './negative-keywords.js';
import { buildMarketingAdsReadinessPlan, type MarketingAdsReadinessPlan } from './readiness.js';
import {
  buildMarketingAdsSearchTermsReport,
  type MarketingAdsSearchTermsReport,
} from './search-terms.js';

export type MarketingAdsAuditSeverity = 'critical' | 'high' | 'medium' | 'low';

export type MarketingAdsAuditAction = {
  id: string;
  severity: MarketingAdsAuditSeverity;
  owner: string;
  title: string;
  rationale: string;
  command?: string;
  evidencePath?: string;
};

export type MarketingAdsAuditSectionStatus = 'pass' | 'warn' | 'error';

export type MarketingAdsAuditSection = {
  id: string;
  label: string;
  status: MarketingAdsAuditSectionStatus;
  summary: string;
  evidencePath?: string;
};

export type MarketingAdsAuditReport = {
  kind: 'unisane.marketing.ads.audit';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  cwd: string;
  platformId: string;
  appId: string;
  ok: boolean;
  score: number;
  sections: MarketingAdsAuditSection[];
  actions: MarketingAdsAuditAction[];
  readiness: MarketingAdsReadinessPlan;
  tracking: MarketingTrackingAuditReport;
  searchTerms: MarketingAdsSearchTermsReport;
  negatives: MarketingNegativeKeywordReport;
  competitors: MarketingAdsCompetitorMonitorReport;
  creative: MarketingAdsCreativeStatusReport;
  nextWorkflowStep: string;
};

export type MarketingAdsAuditOptions = {
  cwd?: string;
  configPath?: string;
  maxAgeDays?: number;
  planPath?: string;
  sourceRoot?: string[];
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingAdsAuditResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  report: MarketingAdsAuditReport;
};

function defaultOutputPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'audit', 'latest.json');
}

function resolveOutputPath(cwd: string, out: string | undefined): string {
  const resolved = out ? path.resolve(cwd, out) : defaultOutputPath(cwd);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function sectionStatus(hasError: boolean, hasWarn: boolean): MarketingAdsAuditSectionStatus {
  if (hasError) return 'error';
  if (hasWarn) return 'warn';
  return 'pass';
}

function scoreSections(sections: MarketingAdsAuditSection[]): number {
  if (sections.length === 0) return 0;
  const points = sections.reduce((sum, section) => {
    if (section.status === 'pass') return sum + 1;
    if (section.status === 'warn') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / sections.length) * 100);
}

function severityRank(severity: MarketingAdsAuditSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity];
}

function addUniqueAction(
  actions: MarketingAdsAuditAction[],
  action: MarketingAdsAuditAction,
): void {
  if (actions.some((existing) => existing.id === action.id)) return;
  actions.push(action);
}

function buildSections(input: {
  readiness: MarketingAdsReadinessPlan;
  tracking: MarketingTrackingAuditReport;
  searchTerms: MarketingAdsSearchTermsReport;
  negatives: MarketingNegativeKeywordReport;
  competitors: MarketingAdsCompetitorMonitorReport;
  creative: MarketingAdsCreativeStatusReport;
}): MarketingAdsAuditSection[] {
  const trackingErrors = input.tracking.checks.some((check) => check.status === 'error');
  const trackingWarnings = input.tracking.checks.some((check) => check.status === 'warn');
  const creativeErrors = input.creative.checks.some((check) => check.status === 'error');
  const creativeWarnings = input.creative.checks.some((check) => check.status === 'warn');
  const competitorWarnings = input.competitors.checks.some((check) => check.status === 'warn');
  const negativeWarnings = input.negatives.checks.some((check) => check.status === 'warn');

  return [
    {
      id: 'readiness',
      label: 'Ads readiness',
      status: input.readiness.ok ? 'pass' : 'warn',
      summary: `${input.readiness.readinessScore}% ready with ${input.readiness.actions.length} action(s).`,
    },
    {
      id: 'tracking',
      label: 'Tracking and conversions',
      status: sectionStatus(trackingErrors, trackingWarnings),
      summary: `${input.tracking.checks.length} tracking check(s) scanned across ${input.tracking.scannedFileCount} file(s).`,
    },
    {
      id: 'searchTerms',
      label: 'Search terms',
      status: input.searchTerms.ok ? 'pass' : 'warn',
      summary: `${input.searchTerms.summary.totalQueries} query classification(s), ${input.searchTerms.summary.negativeCandidates} negative candidate(s).`,
      evidencePath: input.searchTerms.sourcePath,
    },
    {
      id: 'negatives',
      label: 'Negative keywords',
      status: sectionStatus(!input.negatives.ok, negativeWarnings),
      summary: `${input.negatives.summary.entries} registry entry/entries, ${input.negatives.summary.uncoveredSearchTermNegatives} uncovered negative candidate(s).`,
      evidencePath: input.negatives.registryPath,
    },
    {
      id: 'competitors',
      label: 'Auction Insights competitors',
      status: sectionStatus(!input.competitors.ok, competitorWarnings),
      summary: `${input.competitors.summary.knownCompetitors} tracked competitor(s), ${input.competitors.summary.auctionInsightRows} auction row(s).`,
      evidencePath: input.competitors.auctionInsightsPath,
    },
    {
      id: 'creative',
      label: 'Creative and assets',
      status: sectionStatus(creativeErrors, creativeWarnings),
      summary: `${input.creative.plannedAssets.length} planned asset(s), ${input.creative.providerAssets.length} provider asset(s).`,
      evidencePath: input.creative.planPath,
    },
  ];
}

function buildActions(input: {
  readiness: MarketingAdsReadinessPlan;
  tracking: MarketingTrackingAuditReport;
  searchTerms: MarketingAdsSearchTermsReport;
  negatives: MarketingNegativeKeywordReport;
  competitors: MarketingAdsCompetitorMonitorReport;
  creative: MarketingAdsCreativeStatusReport;
}): MarketingAdsAuditAction[] {
  const actions: MarketingAdsAuditAction[] = [];

  for (const check of input.tracking.checks.filter((check) => check.status === 'error')) {
    addUniqueAction(actions, {
      id: `tracking:${check.id}`,
      severity: 'critical',
      owner: 'marketing/tracking',
      title: 'Fix blocking tracking check',
      rationale: check.message,
      evidencePath: check.path,
    });
  }

  for (const action of input.readiness.actions.filter((action) => action.blocksLaunch)) {
    addUniqueAction(actions, {
      id: `readiness:${action.id}`,
      severity: action.priority === 'must' ? 'high' : 'medium',
      owner: 'marketing/ads',
      title: action.title,
      rationale: action.rationale,
      command: action.command,
    });
  }

  if (!input.searchTerms.ok) {
    addUniqueAction(actions, {
      id: 'pull:search-terms',
      severity: 'medium',
      owner: 'marketing/reporting',
      title: 'Refresh Google Ads search terms',
      rationale: input.searchTerms.sourceStatus.message,
      command:
        'pnpm --filter @unisane/ops exec unisane-ops growth ads pull --cwd <app-cwd> --provider googleAds --report query --api --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>',
      evidencePath: input.searchTerms.sourcePath,
    });
  }

  if (input.negatives.summary.uncoveredSearchTermNegatives > 0) {
    addUniqueAction(actions, {
      id: 'negatives:coverage',
      severity: 'medium',
      owner: 'marketing/ads',
      title: 'Cover new negative keyword candidates',
      rationale: `${input.negatives.summary.uncoveredSearchTermNegatives} search-term negative candidate(s) are not covered by the registry.`,
      evidencePath: input.negatives.searchTermsPath,
    });
  }

  if (input.competitors.sourceStatus.status === 'missing') {
    addUniqueAction(actions, {
      id: 'pull:auction-insights',
      severity: 'low',
      owner: 'marketing/reporting',
      title: 'Pull Auction Insights',
      rationale:
        'Competitor pressure cannot be monitored until Google Ads Auction Insights is cached.',
      command:
        'pnpm --filter @unisane/ops exec unisane-ops growth ads pull --cwd <app-cwd> --provider googleAds --report auctionInsight --api --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>',
      evidencePath: input.competitors.auctionInsightsPath,
    });
  }

  for (const signal of input.competitors.signals.filter((signal) => signal.pressure === 'high')) {
    addUniqueAction(actions, {
      id: `competitor:${signal.domain}`,
      severity: 'medium',
      owner: 'marketing/ads',
      title: `Review competitor pressure: ${signal.domain}`,
      rationale: signal.reason,
    });
  }

  for (const check of input.creative.checks.filter((check) => check.status === 'error')) {
    addUniqueAction(actions, {
      id: `creative:${check.id}`,
      severity: 'high',
      owner: 'marketing/creative',
      title: 'Fix blocking creative check',
      rationale: check.message,
      evidencePath: check.path,
    });
  }

  return actions.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function nextStep(actions: MarketingAdsAuditAction[]): string {
  const first = actions[0];
  if (!first)
    return 'Ads operating loop is ready; refresh provider pulls on schedule and monitor trends.';
  if (first.command) return first.command;
  return first.title;
}

export async function buildMarketingAdsAuditReport(
  config: MarketingExecutionContext,
  options: MarketingAdsAuditOptions = {},
): Promise<MarketingAdsAuditReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const readiness = await buildMarketingAdsReadinessPlan(config, {
    cwd,
    configPath: options.configPath,
    maxAgeDays,
    now,
    dryRun: true,
  });
  const tracking = await auditMarketingTrackingSource(config, {
    cwd,
    sourceRoots: options.sourceRoot,
  });
  const searchTerms = buildMarketingAdsSearchTermsReport(config, { cwd, maxAgeDays, now });
  const negatives = buildMarketingNegativeKeywordReport(config, { cwd, now });
  const competitors = buildMarketingAdsCompetitorMonitorReport(config, { cwd, maxAgeDays, now });
  const creative = buildMarketingAdsCreativeStatusReport({
    cwd,
    planPath: options.planPath,
    provider: 'all',
    maxAgeDays,
    now,
  });
  const sections = buildSections({
    readiness,
    tracking,
    searchTerms,
    negatives,
    competitors,
    creative,
  });
  const actions = buildActions({
    readiness,
    tracking,
    searchTerms,
    negatives,
    competitors,
    creative,
  });
  const score = scoreSections(sections);
  const ok = !sections.some((section) => section.status === 'error') && score >= 80;

  return {
    kind: 'unisane.marketing.ads.audit',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    cwd,
    platformId: config.platformId,
    appId: config.appId,
    ok,
    score,
    sections,
    actions,
    readiness,
    tracking,
    searchTerms,
    negatives,
    competitors,
    creative,
    nextWorkflowStep: nextStep(actions),
  };
}

export async function writeMarketingAdsAuditReport(
  config: MarketingExecutionContext,
  options: MarketingAdsAuditOptions = {},
): Promise<MarketingAdsAuditResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const report = await buildMarketingAdsAuditReport(config, options);
  if (options.dryRun) {
    return { ok: report.ok, dryRun: true, report };
  }
  const outputPath = resolveOutputPath(cwd, options.out);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { ok: report.ok, dryRun: false, path: outputPath, report };
}
