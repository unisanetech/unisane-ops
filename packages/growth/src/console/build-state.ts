import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  buildMarketingAdsStatusReport,
  buildMarketingEvidenceStatus,
  buildMarketingStatusReport,
  deriveMarketingMetrics,
  readMarketingResearchStatus,
  readMarketingProviderReportStatus,
  type MarketingProviderReportStatus,
  type MarketingGoogleConnectionStatus,
  type MarketingMetaConnectionStatus,
  type MarketingAdsAuditReport,
} from '@unisane/growth/marketing';
import { buildGrowthConfigReadiness } from '@unisane/growth/contracts';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  type GrowthProjectContext,
} from '../cli/project-context.js';
import type {
  MarketingProviderReportType,
  MarketingReportMetrics,
  MarketingReportProvider,
} from '@unisane/growth/marketing';
import type {
  MarketingConsoleActionItem,
  MarketingConsoleArtifactLink,
  MarketingConsoleComparisonRow,
  MarketingConsoleCompetitorResearchSummary,
  MarketingConsoleFaqResearchSummary,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleKeywordClusterSummary,
  MarketingConsoleKeywordResearchSummary,
  MarketingConsoleReceiptEvent,
  MarketingConsoleSeoRow,
  MarketingConsoleSeoIntelligenceSummary,
  MarketingConsoleSetupProjection,
  MarketingConsoleState,
  MarketingConsoleStatus,
  MarketingConsoleTrendPoint,
} from './contracts.js';

export type BuildMarketingConsoleStateOptions = {
  cwd?: string;
  configPath?: string;
  maxAgeDays?: number;
  now?: Date;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
};

type ProviderFreshnessCell = MarketingConsoleFreshnessCell & {
  provider: MarketingReportProvider;
};

type MarketingConsoleReadinessStatuses = {
  connections: MarketingConsoleStatus;
  overview: MarketingConsoleStatus;
  advertising: MarketingConsoleStatus;
  analytics: MarketingConsoleStatus;
  seo: MarketingConsoleStatus;
  tracking: MarketingConsoleStatus;
  automations: MarketingConsoleStatus;
};

type LocalJsonArtifact = {
  filePath: string;
  fileName: string;
  parsed: Record<string, unknown> | undefined;
  mtimeMs: number;
  timestamp: string;
};

const reportFamilies: Array<{
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
}> = [
  { provider: 'googleAds', reportType: 'campaign' },
  { provider: 'googleAds', reportType: 'keyword' },
  { provider: 'googleAds', reportType: 'conversion' },
  { provider: 'googleAds', reportType: 'auctionInsight' },
  { provider: 'metaAds', reportType: 'campaign' },
  { provider: 'metaAds', reportType: 'adSet' },
  { provider: 'metaAds', reportType: 'ad' },
  { provider: 'metaAds', reportType: 'creative' },
  { provider: 'ga4', reportType: 'landingPage' },
  { provider: 'ga4', reportType: 'channel' },
  { provider: 'ga4', reportType: 'sourceMedium' },
  { provider: 'searchConsole', reportType: 'queryPage' },
  { provider: 'searchConsole', reportType: 'page' },
  { provider: 'searchConsole', reportType: 'query' },
];

function buildConsoleSetupProjection(args: {
  cwd: string;
  configPath: string;
  generatedAt: string;
  context: GrowthProjectContext;
  googleConnected: boolean;
  proofReady: boolean;
  proofNext: string;
}): MarketingConsoleSetupProjection {
  const findings = buildGrowthConfigReadiness({
    projectId: args.context.projectId,
    config: args.context.growth,
    observedAt: args.generatedAt,
  });
  const environmentIds = Object.keys(args.context.growth.environments);
  const connectionFindings = findings.filter((finding) => finding.dimension === 'connection');
  const resourceFindings = findings.filter((finding) => finding.dimension === 'resource');
  const connectionReady = connectionFindings.length === 0 && args.googleConnected;
  const resourcesReady =
    resourceFindings.length > 0 && resourceFindings.every((finding) => finding.state === 'ready');
  const runtimeSelected = args.context.growth.runtime.integration !== 'none';
  const stages: MarketingConsoleSetupProjection['stages'] = [
    {
      id: 'local',
      status: 'pass',
      title: 'Project Intent',
      message: 'Canonical Growth intent is loaded from unisane.config.ts.',
      checks: [
        {
          id: 'growth.project.intent',
          status: 'pass',
          message: `${args.context.growth.capabilities.length} Growth capabilities are selected.`,
        },
      ],
    },
    {
      id: 'deployedDomain',
      status: environmentIds.length > 0 ? 'pass' : 'blocked',
      title: 'Deployed Domain',
      message:
        environmentIds.length > 0
          ? `Growth declares ${environmentIds.join(', ')}.`
          : 'Growth must declare at least one environment.',
      checks: [
        {
          id: 'growth.environment',
          status: environmentIds.length > 0 ? 'pass' : 'error',
          message: 'Environment identity comes from canonical project intent.',
        },
      ],
    },
    {
      id: 'providerAuth',
      status: connectionReady ? 'pass' : 'blocked',
      title: 'Provider Login',
      message: connectionReady
        ? 'The selected Google connection is available.'
        : 'Connect Google through the project lifecycle.',
      checks: [
        {
          id: 'growth.connection.google',
          status: connectionReady ? 'pass' : 'error',
          message:
            connectionFindings[0]?.summary ??
            (connectionReady
              ? 'Google connection selected.'
              : 'Google connection verification is required.'),
        },
      ],
    },
    {
      id: 'providerDiscovery',
      status: resourcesReady ? 'pass' : connectionReady ? 'current' : 'pending',
      title: 'Provider Discovery',
      message: resourcesReady
        ? 'Required Google resources are selected.'
        : 'Discover and select every required Google resource explicitly.',
      checks: resourceFindings.map((finding) => ({
        id: finding.code,
        status: finding.state === 'ready' ? 'pass' : 'warn',
        message: finding.summary,
      })),
    },
    {
      id: 'proofReady',
      status: args.proofReady ? 'pass' : runtimeSelected ? 'current' : 'blocked',
      title: 'Current Evidence',
      message: args.proofReady
        ? 'Current provider evidence is sufficient for scheduled reads.'
        : args.proofNext,
      checks: [
        {
          id: 'growth.current-evidence',
          status: args.proofReady ? 'pass' : runtimeSelected ? 'warn' : 'error',
          message: args.proofNext,
        },
      ],
    },
  ];
  const currentStage = stages.find((stage) => stage.status !== 'pass')?.id ?? 'proofReady';
  const canonicalActions = findings
    .flatMap((finding) => (finding.nextAction ? [finding.nextAction] : []))
    .map((action) => ({
      id: action.id,
      ...(action.command
        ? {
            command: `unisane ${[...action.command.path, ...action.command.args].join(' ')}`,
          }
        : {}),
      message: action.description,
    }));
  return {
    kind: 'unisane.marketing.console-setup-projection',
    version: 1,
    nonMutating: true,
    generatedAt: args.generatedAt,
    ok: stages.every((stage) => stage.status === 'pass'),
    cwd: args.cwd,
    configPath: args.configPath,
    appId: args.context.projectId,
    platformId: args.context.projectId,
    currentStage,
    stages,
    nextActions:
      canonicalActions.length > 0
        ? canonicalActions
        : [
            {
              id: 'growth.evidence.refresh',
              message: args.proofNext,
            },
          ],
  };
}

function providerLabel(
  provider: MarketingReportProvider | 'confirmedConversions' | 'strategyMap',
): string {
  const labels: Record<string, string> = {
    googleAds: 'Google Ads',
    metaAds: 'Meta Ads',
    ga4: 'GA4',
    searchConsole: 'Search Console',
    confirmedConversions: 'Confirmed conversions',
    strategyMap: 'Strategy map',
  };
  return labels[provider] ?? provider;
}

function reportTypeLabel(reportType: MarketingProviderReportType): string {
  const labels: Partial<Record<MarketingProviderReportType, string>> = {
    campaign: 'campaign',
    keyword: 'keyword',
    conversion: 'conversion',
    adSet: 'ad set',
    ad: 'ad',
    creative: 'creative',
    landingPage: 'landing page',
    channel: 'channel',
    sourceMedium: 'source / medium',
    queryPage: 'query/page',
    page: 'page',
    query: 'query',
  };
  return labels[reportType] ?? reportType;
}

function reportLabel(
  provider: MarketingReportProvider | 'confirmedConversions' | 'strategyMap',
  reportType: MarketingProviderReportType,
): string {
  return `${providerLabel(provider)} ${reportTypeLabel(reportType)}`;
}

export async function buildMarketingConsoleState(
  options: BuildMarketingConsoleStateOptions = {},
): Promise<MarketingConsoleState> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const loaded = await loadMarketingExecutionContext();
  const config = loaded.config;
  const proof = buildMarketingEvidenceStatus(config, {
    cwd,
    configPath: loaded.path,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
    maxAgeDays,
    now,
  });
  const projectContext = await loadGrowthProjectContext();
  const setup = buildConsoleSetupProjection({
    cwd,
    configPath: loaded.path,
    generatedAt,
    context: projectContext,
    googleConnected: Boolean(options.googleAuth?.connected),
    proofReady: proof.readyForScheduledPulls,
    proofNext: proof.nextWorkflowStep,
  });
  const marketingStatus = buildMarketingStatusReport({
    cwd,
    maxAgeDays,
    mode: 'marketing',
    now,
  });
  const analyticsStatus = buildMarketingStatusReport({
    cwd,
    maxAgeDays,
    mode: 'analytics',
    now,
  });
  const adsStatus = await buildMarketingAdsStatusReport(config, {
    cwd,
    configPath: loaded.path,
    maxAgeDays,
    now,
  });
  const adsAudit = readAdsAuditSummary(cwd);
  const researchStatus = readMarketingResearchStatus(config, { cwd });
  const freshness = buildFreshness(config, cwd, now, maxAgeDays);
  const channelRows = buildChannelRows(freshness);
  const seoRows = buildSeoRows(freshness);
  const keywordResearch = readKeywordResearchSummary(cwd);
  const competitorResearch = readCompetitorResearchSummary(cwd);
  const faqResearch = readFaqResearchSummary(cwd);
  const seoIntelligence = readSeoIntelligenceSummary(cwd);
  const metrics = buildMetrics(freshness);
  const gtmArtifacts = collectGtmArtifactLinks(cwd, config.appId, config.defaultEnvironment);
  const gtmIdentity = collectGtmIdentity(cwd, config.appId, config.defaultEnvironment);
  const receipts = [
    ...collectReceipts(cwd, config.defaultEnvironment, now),
    ...collectGtmReceiptEvents(cwd, config.appId, config.defaultEnvironment, now),
  ];
  const artifacts = buildArtifactLinks(
    freshness,
    receipts,
    [...gtmArtifacts, ...buildResearchArtifactLinks(researchStatus.files)],
    adsStatus.latestPlan?.path,
    adsAudit,
  );
  const schedule = readScheduleSummary(cwd, config.defaultEnvironment);
  const actions = buildActions({
    setupNext: setup.nextActions[0]?.message,
    proofNext: proof.nextWorkflowStep,
    marketingNext: marketingStatus.nextWorkflowStep,
    analyticsNext: analyticsStatus.nextWorkflowStep,
    adsNext: adsAudit?.nextWorkflowStep ?? adsStatus.nextWorkflowStep,
    researchNext: researchStatus.nextWorkflowStep,
    scheduleNext: schedule?.nextWorkflowStep,
  });
  const paidProviderEvidenceReady = freshness.some(
    (cell) =>
      (cell.provider === 'googleAds' || cell.provider === 'metaAds') && cell.status === 'ready',
  );
  const readinessStatuses: MarketingConsoleReadinessStatuses = {
    connections: combineConsoleStatuses(
      setupRouteStatus(setup),
      proof.readyForScheduledPulls ? 'ready' : proof.ok ? 'warn' : 'blocked',
    ),
    overview: marketingStatus.ok ? 'ready' : 'warn',
    advertising: adsAudit
      ? adsAudit.ok
        ? 'ready'
        : 'warn'
      : adsStatus.ok && paidProviderEvidenceReady
        ? 'ready'
        : 'warn',
    analytics: analyticsStatus.ok ? 'ready' : 'warn',
    seo: freshness.some((cell) => cell.provider === 'searchConsole' && cell.status === 'ready')
      ? 'ready'
      : 'warn',
    tracking: deriveGtmRouteStatus(gtmArtifacts),
    automations: schedule?.status ?? 'missing',
  };
  const readiness = buildReadiness(
    readinessStatuses,
    setup.currentStage,
    selectNextAction(actions),
  );

  return {
    kind: 'unisane.growth.console-state',
    version: 1,
    generatedAt,
    workspaceRoot: cwd,
    platformId: config.platformId,
    appId: config.appId,
    environment: config.defaultEnvironment,
    capabilities: [...projectContext.growth.capabilities],
    dateWindow: inferDateWindow(marketingStatus.providerFreshness),
    readiness,
    metrics,
    trends: buildTrends(freshness),
    comparisons: {
      channels: channelRows,
    },
    seo: {
      rows: seoRows,
    },
    keywordResearch,
    competitorResearch,
    faqResearch,
    seoIntelligence,
    freshness,
    actions,
    receipts,
    artifacts,
    reports: {
      setup,
      proof,
      marketingStatus,
      analyticsStatus,
      adsStatus,
      adsAudit,
      researchStatus,
    },
    ...(schedule ? { schedule } : {}),
    ...(gtmIdentity ? { gtm: gtmIdentity } : {}),
  };
}

type KeywordMetricJson = {
  provider?: string;
  country?: string;
  language?: string;
  runId?: string;
  fetchedAt?: string;
  market?: {
    country?: string;
    language?: string;
    currencyCode?: string;
    locationIds?: string[];
    languageId?: string;
  };
  source?: {
    kind?: string;
    clusterId?: string;
    campaignIntent?: string;
    candidateFile?: string;
    pageUrl?: string;
    seedKeywords?: string[];
  };
  metrics?: Array<{
    term?: string;
    normalizedTerm?: string;
    country?: string;
    language?: string;
    currencyCode?: string;
    sourceKind?: string;
    sourceClusterId?: string;
    avgMonthlySearches?: number;
    competition?: string;
    competitionIndex?: number;
    lowTopOfPageBidMicros?: number;
    highTopOfPageBidMicros?: number;
    fetchedAt?: string;
  }>;
};

type CompetitorResearchPageJson = {
  id?: string;
  competitor?: string;
  domain?: string;
  url?: string;
  keyword?: string;
  position?: number;
  pageType?: string;
  market?: string;
  source?: string;
  contentPatterns?: Array<{ label?: string } | string>;
  patterns?: string[];
  strengths?: string[];
  gaps?: string[];
  opportunities?: string[];
  notes?: string;
};

type CompetitorResearchJson = {
  market?: string;
  source?: string;
  pages?: CompetitorResearchPageJson[];
};

type FaqResearchQuestionJson = {
  id?: string;
  question?: string;
  answerIntent?: string;
  pageRole?: string;
  routePath?: string;
  clusterId?: string;
  priority?: string;
  status?: string;
  sourceTerms?: string[];
  supportingKeywords?: string[];
  avgMonthlySearches?: number;
  markets?: Array<{
    country?: string;
    language?: string;
    avgMonthlySearches?: number;
    competition?: string;
    competitionIndex?: number;
  }>;
  evidence?: Array<{
    source?: string;
    label?: string;
    url?: string;
    note?: string;
  }>;
  recommendedAnswer?: string;
  internalLinks?: Array<{
    label?: string;
    path?: string;
  }>;
};

type FaqResearchJson = {
  routePath?: string;
  source?: string;
  questions?: FaqResearchQuestionJson[];
};

type SerpSnapshotJson = {
  snapshots?: Array<{
    id?: string;
    keyword?: string;
    country?: string;
    language?: string;
    intent?: string;
    routePath?: string;
    capturedAt?: string;
    organicResults?: Array<{
      domain?: string;
      url?: string;
      title?: string;
      pageType?: string;
    }>;
    peopleAlsoAsk?: string[];
    opportunities?: string[];
  }>;
};

type MetadataExperimentJson = {
  experiments?: Array<{
    id?: string;
    routePath?: string;
    status?: string;
    priority?: string;
    primaryKeyword?: string;
    currentTitle?: string;
    proposedTitle?: string;
    currentDescription?: string;
    proposedDescription?: string;
    rationale?: string;
    expectedImpact?: string;
  }>;
};

type PageAuditJson = {
  audits?: Array<{
    id?: string;
    routePath?: string;
    status?: MarketingConsoleStatus;
    score?: number;
    primaryKeyword?: string;
    intent?: string;
    missing?: string[];
    warnings?: string[];
    recommendations?: string[];
  }>;
};

function readFaqResearchSummary(cwd: string): MarketingConsoleFaqResearchSummary {
  const faqsRoot = path.join(cwd, 'docs', 'seo', 'keyword-research', 'faqs');
  const missing: MarketingConsoleFaqResearchSummary = {
    status: 'missing',
    sourceCount: 0,
    questionCount: 0,
    pageCount: 0,
    approvedCount: 0,
    highPriorityCount: 0,
    totalKnownVolume: 0,
    qualityScore: 0,
    evidenceSourceCount: 0,
    marketCount: 0,
    needsProofCount: 0,
    duplicateQuestionCount: 0,
    routeConflictCount: 0,
    warnings: [],
    pages: [],
    questions: [],
    topQuestions: [],
  };
  if (!existsSync(faqsRoot)) return missing;
  const files = collectJsonFiles(faqsRoot);
  const latest = files[0];
  if (!latest) return missing;
  try {
    const parsedFiles = files.map((file) => ({
      file,
      parsed: JSON.parse(readFileSync(file.filePath, 'utf8')) as FaqResearchJson,
    }));
    const questionMap = new Map<string, MarketingConsoleFaqResearchSummary['questions'][number]>();
    for (const { parsed } of parsedFiles) {
      for (const question of normalizeFaqQuestions(parsed)) {
        const key = `${question.routePath}:${question.question.trim().toLowerCase()}`;
        const current = questionMap.get(key);
        if (!current || (question.avgMonthlySearches ?? 0) > (current.avgMonthlySearches ?? 0)) {
          questionMap.set(key, question);
        }
      }
    }
    const questions = [...questionMap.values()].sort(
      (left, right) =>
        priorityRank(left.priority) - priorityRank(right.priority) ||
        (right.avgMonthlySearches ?? 0) - (left.avgMonthlySearches ?? 0) ||
        left.routePath.localeCompare(right.routePath) ||
        left.question.localeCompare(right.question),
    );
    const totalKnownVolume = questions.reduce(
      (sum, question) => sum + (question.avgMonthlySearches ?? 0),
      0,
    );
    const pages = buildFaqPageSummaries(questions);
    const quality = buildFaqQualitySummary(questions, pages, parsedFiles.length);
    return {
      status: quality.status,
      path: latest.filePath,
      sourceCount: parsedFiles.length,
      questionCount: questions.length,
      pageCount: pages.length,
      approvedCount: questions.filter((question) => question.status === 'approved').length,
      highPriorityCount: questions.filter((question) => priorityRank(question.priority) <= 1)
        .length,
      totalKnownVolume,
      qualityScore: quality.score,
      evidenceSourceCount: quality.evidenceSourceCount,
      marketCount: quality.marketCount,
      needsProofCount: quality.needsProofCount,
      duplicateQuestionCount: quality.duplicateQuestionCount,
      routeConflictCount: quality.routeConflictCount,
      warnings: quality.warnings,
      pages,
      questions,
      topQuestions: questions.slice(0, 16),
    };
  } catch {
    return {
      ...missing,
      status: 'blocked',
      path: latest.filePath,
    };
  }
}

function normalizeFaqQuestions(
  parsed: FaqResearchJson,
): MarketingConsoleFaqResearchSummary['questions'] {
  const rows: MarketingConsoleFaqResearchSummary['questions'] = [];
  for (const [index, question] of (parsed.questions ?? []).entries()) {
    if (!question.question?.trim() || !question.recommendedAnswer?.trim()) continue;
    const routePath = question.routePath ?? parsed.routePath ?? '/';
    const evidence = (question.evidence ?? [])
      .map((item) => [item.label, item.note].filter(Boolean).join(': '))
      .filter((value): value is string => Boolean(value));
    const evidenceSources = uniqueStrings(
      (question.evidence ?? []).map((item) => item.source).filter(Boolean),
    );
    const internalLinks = (question.internalLinks ?? [])
      .map((link) => {
        if (!link.label?.trim() || !link.path?.trim()) return undefined;
        return { label: link.label, path: link.path };
      })
      .filter((link): link is { label: string; path: string } => link !== undefined);
    const marketKeys = uniqueStrings(
      (question.markets ?? []).map((market) => keywordMarketKey(market.country, market.language)),
    );
    const bestMarket = (question.markets ?? [])
      .filter((market) => typeof market.avgMonthlySearches === 'number')
      .sort((left, right) => (right.avgMonthlySearches ?? 0) - (left.avgMonthlySearches ?? 0))
      .map(
        (market) =>
          [market.country, market.language].filter(Boolean).join(' / ') +
          (market.avgMonthlySearches !== undefined ? ` · ${market.avgMonthlySearches}` : ''),
      )[0];
    rows.push({
      id: question.id ?? `${routePath}:faq:${index}`,
      question: question.question,
      answerIntent:
        question.answerIntent ??
        'Answer the user question clearly and route them to the correct product action.',
      pageRole: question.pageRole ?? 'landing-page',
      routePath,
      ...(question.clusterId ? { clusterId: question.clusterId } : {}),
      priority: question.priority ?? 'p1',
      status: question.status ?? 'planned',
      sourceTerms: uniqueStrings(question.sourceTerms ?? []),
      supportingKeywords: uniqueStrings(question.supportingKeywords ?? []),
      ...(question.avgMonthlySearches !== undefined
        ? { avgMonthlySearches: question.avgMonthlySearches }
        : {}),
      marketCount: marketKeys.length,
      ...(bestMarket ? { bestMarket } : {}),
      evidenceSourceCount: evidenceSources.length,
      evidenceSources,
      proofStatus: faqQuestionProofStatus({
        avgMonthlySearches: question.avgMonthlySearches,
        evidenceSources,
        marketCount: marketKeys.length,
        status: question.status,
      }),
      evidence,
      recommendedAnswer: question.recommendedAnswer,
      internalLinks,
    });
  }
  return rows;
}

function buildFaqPageSummaries(
  questions: MarketingConsoleFaqResearchSummary['questions'],
): MarketingConsoleFaqResearchSummary['pages'] {
  const groups = new Map<string, MarketingConsoleFaqResearchSummary['questions']>();
  for (const question of questions) {
    groups.set(question.routePath, [...(groups.get(question.routePath) ?? []), question]);
  }
  return [...groups.entries()]
    .map(([routePath, rows]) => ({
      routePath,
      ...(rows[0]?.pageRole ? { pageRole: rows[0].pageRole } : {}),
      questionCount: rows.length,
      approvedCount: rows.filter((row) => row.status === 'approved').length,
      needsProofCount: rows.filter((row) => row.proofStatus !== 'ready').length,
      marketCount: new Set(
        rows.flatMap((row) => (row.bestMarket ? [row.bestMarket.split(' · ')[0]] : [])),
      ).size,
      evidenceSourceCount: new Set(rows.flatMap((row) => row.evidenceSources)).size,
      totalKnownVolume: rows.reduce((sum, row) => sum + (row.avgMonthlySearches ?? 0), 0),
      ...(rows[0]?.question ? { topQuestion: rows[0].question } : {}),
      clusters: uniqueStrings(rows.map((row) => row.clusterId).filter(Boolean)),
    }))
    .sort(
      (left, right) =>
        right.totalKnownVolume - left.totalKnownVolume ||
        right.questionCount - left.questionCount ||
        left.routePath.localeCompare(right.routePath),
    );
}

function faqQuestionProofStatus(input: {
  avgMonthlySearches?: number;
  evidenceSources: string[];
  marketCount: number;
  status?: string;
}): MarketingConsoleStatus {
  if (input.status === 'needs-proof') return 'warn';
  if ((input.avgMonthlySearches ?? 0) <= 0) return 'warn';
  if (input.evidenceSources.length === 0) return 'missing';
  if (!input.evidenceSources.includes('google-ads')) return 'warn';
  if (input.marketCount === 0) return 'warn';
  return 'ready';
}

function buildFaqQualitySummary(
  questions: MarketingConsoleFaqResearchSummary['questions'],
  pages: MarketingConsoleFaqResearchSummary['pages'],
  sourceCount: number,
): {
  status: MarketingConsoleStatus;
  score: number;
  evidenceSourceCount: number;
  marketCount: number;
  needsProofCount: number;
  duplicateQuestionCount: number;
  routeConflictCount: number;
  warnings: MarketingConsoleFaqResearchSummary['warnings'];
} {
  if (questions.length === 0) {
    return {
      status: 'warn',
      score: 0,
      evidenceSourceCount: 0,
      marketCount: 0,
      needsProofCount: 0,
      duplicateQuestionCount: 0,
      routeConflictCount: 0,
      warnings: [
        {
          severity: 'warn',
          title: 'No FAQ questions',
          message: 'Add approved questions with keyword evidence before publishing FAQ blocks.',
        },
      ],
    };
  }
  const evidenceSources = new Set(questions.flatMap((question) => question.evidenceSources));
  const markets = new Set(
    questions
      .map((question) => question.bestMarket?.split(' · ')[0])
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
  const approvedCount = questions.filter((question) => question.status === 'approved').length;
  const needsProofCount = questions.filter((question) => question.proofStatus !== 'ready').length;
  const duplicateQuestionCount = countDuplicateFaqQuestions(questions);
  const routeConflictCount = countFaqRouteConflicts(questions);
  const linkedCount = questions.filter((question) => question.internalLinks.length > 0).length;
  const answerCount = questions.filter(
    (question) => question.recommendedAnswer.trim().length >= 40,
  ).length;
  const scoreParts = [
    approvedCount / questions.length,
    (questions.length - needsProofCount) / questions.length,
    linkedCount / questions.length,
    answerCount / questions.length,
    Math.min(evidenceSources.size / 3, 1),
    Math.min(markets.size / 3, 1),
    Math.min(pages.length / 4, 1),
    duplicateQuestionCount === 0 ? 1 : 0,
    routeConflictCount === 0 ? 1 : 0.5,
    sourceCount > 0 ? 1 : 0,
  ];
  const warnings = buildFaqQualityWarnings({
    questions,
    pages,
    evidenceSources,
    markets,
    needsProofCount,
    duplicateQuestionCount,
    routeConflictCount,
  });
  const score = Math.round(
    (scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length) * 100,
  );
  return {
    status: warnings.some((warning) => warning.severity === 'blocked')
      ? 'blocked'
      : score >= 80
        ? 'ready'
        : 'warn',
    score,
    evidenceSourceCount: evidenceSources.size,
    marketCount: markets.size,
    needsProofCount,
    duplicateQuestionCount,
    routeConflictCount,
    warnings,
  };
}

function buildFaqQualityWarnings(input: {
  questions: MarketingConsoleFaqResearchSummary['questions'];
  pages: MarketingConsoleFaqResearchSummary['pages'];
  evidenceSources: Set<string>;
  markets: Set<string>;
  needsProofCount: number;
  duplicateQuestionCount: number;
  routeConflictCount: number;
}): MarketingConsoleFaqResearchSummary['warnings'] {
  const warnings: MarketingConsoleFaqResearchSummary['warnings'] = [];
  if (input.needsProofCount > 0) {
    warnings.push({
      severity: 'warn',
      title: 'Proof gaps',
      message: `${input.needsProofCount} FAQ question(s) need stronger keyword, market, or evidence support before publishing.`,
    });
  }
  if (!input.evidenceSources.has('google-ads')) {
    warnings.push({
      severity: 'blocked',
      title: 'Missing search-volume proof',
      message:
        'FAQ research should include Google Ads Keyword Planner evidence before it is used for page planning.',
    });
  }
  if (input.evidenceSources.size < 2) {
    warnings.push({
      severity: 'warn',
      title: 'Single evidence source',
      message:
        'Blend Keyword Planner with competitor, Search Console, SERP, or manual evidence so answers are not based on one source only.',
    });
  }
  if (input.markets.size < 2) {
    warnings.push({
      severity: 'warn',
      title: 'Limited market coverage',
      message:
        'Add market-specific signals before using the same FAQ set across India, US, UK, and Australia pages.',
    });
  }
  if (input.pages.length < 3) {
    warnings.push({
      severity: 'warn',
      title: 'Thin page ownership',
      message:
        'Map FAQs to more page owners so homepage, CV maker, ATS, and template pages do not compete for the same intent.',
    });
  }
  if (input.duplicateQuestionCount > 0) {
    warnings.push({
      severity: 'blocked',
      title: 'Duplicate FAQ question',
      message: `${input.duplicateQuestionCount} duplicate question(s) were found across FAQ artifacts.`,
    });
  }
  if (input.routeConflictCount > 0) {
    warnings.push({
      severity: 'warn',
      title: 'Possible page cannibalization',
      message: `${input.routeConflictCount} keyword intent(s) are mapped to multiple routes. Confirm one primary page owner for each intent.`,
    });
  }
  for (const page of input.pages.filter((page) => page.questionCount > 6)) {
    warnings.push({
      severity: 'warn',
      title: 'Large FAQ block',
      routePath: page.routePath,
      message: `${page.routePath} has ${page.questionCount} FAQ questions. Split lower-intent questions into child pages if the block becomes too broad.`,
    });
  }
  return warnings;
}

function countDuplicateFaqQuestions(
  questions: MarketingConsoleFaqResearchSummary['questions'],
): number {
  const counts = new Map<string, number>();
  for (const question of questions) {
    const key = question.question.trim().toLowerCase().replace(/\s+/g, ' ');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function countFaqRouteConflicts(
  questions: MarketingConsoleFaqResearchSummary['questions'],
): number {
  const ownership = new Map<string, Set<string>>();
  for (const question of questions) {
    for (const term of [...question.sourceTerms, ...question.supportingKeywords]) {
      const key = term.trim().toLowerCase();
      if (!key) continue;
      const routes = ownership.get(key) ?? new Set<string>();
      routes.add(question.routePath);
      ownership.set(key, routes);
    }
  }
  return [...ownership.values()].filter((routes) => routes.size > 1).length;
}

function readSeoIntelligenceSummary(cwd: string): MarketingConsoleSeoIntelligenceSummary {
  const serp = readSerpSummary(cwd);
  const metadata = readMetadataExperimentSummary(cwd);
  const pageAudits = readPageAuditSummary(cwd);
  const warnings: MarketingConsoleSeoIntelligenceSummary['warnings'] = [];
  if (serp.snapshotCount === 0) {
    warnings.push({
      severity: 'warn',
      title: 'Missing SERP snapshots',
      message:
        'Capture country-specific Google result patterns before choosing page type, title, and content depth.',
    });
  }
  if (metadata.experimentCount === 0) {
    warnings.push({
      severity: 'warn',
      title: 'Missing metadata experiments',
      message:
        'Track title and meta-description changes against Search Console CTR instead of changing metadata blindly.',
    });
  }
  if (pageAudits.pageCount === 0) {
    warnings.push({
      severity: 'warn',
      title: 'Missing page audits',
      message:
        'Compare live page content against keyword, FAQ, metadata, schema, and internal-link research.',
    });
  }
  if (pageAudits.blockedCount > 0 || pageAudits.warningCount > 0) {
    warnings.push({
      severity: pageAudits.blockedCount > 0 ? 'blocked' : 'warn',
      title: 'Page audit gaps',
      message: `${pageAudits.blockedCount} blocked and ${pageAudits.warningCount} warning page audit(s) need fixes.`,
    });
  }
  const scoreParts = [
    serp.snapshotCount > 0 ? 1 : 0,
    Math.min(serp.countryCount / 3, 1),
    metadata.experimentCount > 0 ? 1 : 0,
    metadata.readyCount / Math.max(metadata.experimentCount, 1),
    pageAudits.pageCount > 0 ? 1 : 0,
    pageAudits.averageScore / 100,
    warnings.some((warning) => warning.severity === 'blocked') ? 0 : 1,
  ];
  const score = Math.round(
    (scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length) * 100,
  );
  return {
    status: warnings.some((warning) => warning.severity === 'blocked')
      ? 'blocked'
      : score >= 80
        ? 'ready'
        : 'warn',
    score,
    serp,
    metadata,
    pageAudits,
    warnings,
  };
}

function readSerpSummary(cwd: string): MarketingConsoleSeoIntelligenceSummary['serp'] {
  const root = path.join(cwd, 'docs', 'seo', 'keyword-research', 'serp');
  const missing = {
    status: 'missing' as const,
    sourceCount: 0,
    snapshotCount: 0,
    countryCount: 0,
    keywordCount: 0,
    snapshots: [],
  };
  if (!existsSync(root)) return missing;
  const files = collectJsonFiles(root);
  if (!files.length) return missing;
  try {
    const snapshots = files.flatMap((file) => {
      const parsed = JSON.parse(readFileSync(file.filePath, 'utf8')) as SerpSnapshotJson;
      return normalizeSerpSnapshots(parsed);
    });
    const countryCount = new Set(snapshots.map((snapshot) => snapshot.country)).size;
    const keywordCount = new Set(snapshots.map((snapshot) => snapshot.keyword)).size;
    return {
      status: snapshots.length > 0 ? 'ready' : 'warn',
      sourceCount: files.length,
      snapshotCount: snapshots.length,
      countryCount,
      keywordCount,
      snapshots: snapshots.slice(0, 80),
    };
  } catch {
    return { ...missing, status: 'blocked' };
  }
}

function normalizeSerpSnapshots(
  parsed: SerpSnapshotJson,
): MarketingConsoleSeoIntelligenceSummary['serp']['snapshots'] {
  return (parsed.snapshots ?? [])
    .map((snapshot, index) => {
      const keyword = snapshot.keyword?.trim();
      const country = snapshot.country?.trim();
      const language = snapshot.language?.trim() ?? 'en';
      if (!keyword || !country) return undefined;
      const topDomains = uniqueStrings(
        (snapshot.organicResults ?? [])
          .map((result) => result.domain?.trim() || domainFromUrl(result.url ?? ''))
          .filter(Boolean),
      );
      return {
        id: snapshot.id ?? `${country}:${keyword}:${index}`,
        keyword,
        country,
        language,
        intent: snapshot.intent ?? 'unknown',
        ...(snapshot.routePath ? { routePath: snapshot.routePath } : {}),
        ...(snapshot.capturedAt ? { capturedAt: snapshot.capturedAt } : {}),
        topDomains: topDomains.slice(0, 8),
        competitorCount: topDomains.length,
        resultCount: snapshot.organicResults?.length ?? 0,
        peopleAlsoAsk: uniqueStrings(snapshot.peopleAlsoAsk ?? []).slice(0, 8),
        opportunities: uniqueStrings(snapshot.opportunities ?? []).slice(0, 8),
      };
    })
    .filter(
      (snapshot): snapshot is MarketingConsoleSeoIntelligenceSummary['serp']['snapshots'][number] =>
        snapshot !== undefined,
    )
    .sort(
      (left, right) =>
        left.keyword.localeCompare(right.keyword) || left.country.localeCompare(right.country),
    );
}

function readMetadataExperimentSummary(
  cwd: string,
): MarketingConsoleSeoIntelligenceSummary['metadata'] {
  const root = path.join(cwd, 'docs', 'seo', 'keyword-research', 'metadata');
  const missing = {
    status: 'missing' as const,
    sourceCount: 0,
    experimentCount: 0,
    readyCount: 0,
    experiments: [],
  };
  if (!existsSync(root)) return missing;
  const files = collectJsonFiles(root);
  if (!files.length) return missing;
  try {
    const experiments = files.flatMap((file) => {
      const parsed = JSON.parse(readFileSync(file.filePath, 'utf8')) as MetadataExperimentJson;
      return normalizeMetadataExperiments(parsed);
    });
    const readyCount = experiments.filter((experiment) => experiment.status === 'ready').length;
    return {
      status: experiments.length > 0 ? 'ready' : 'warn',
      sourceCount: files.length,
      experimentCount: experiments.length,
      readyCount,
      experiments: experiments.slice(0, 80),
    };
  } catch {
    return { ...missing, status: 'blocked' };
  }
}

function normalizeMetadataExperiments(
  parsed: MetadataExperimentJson,
): MarketingConsoleSeoIntelligenceSummary['metadata']['experiments'] {
  return (parsed.experiments ?? [])
    .map((experiment, index) => {
      if (!experiment.routePath?.trim() || !experiment.proposedTitle?.trim()) return undefined;
      return {
        id: experiment.id ?? `${experiment.routePath}:metadata:${index}`,
        routePath: experiment.routePath,
        status: experiment.status ?? 'planned',
        priority: experiment.priority ?? 'p1',
        primaryKeyword: experiment.primaryKeyword ?? '-',
        ...(experiment.currentTitle ? { currentTitle: experiment.currentTitle } : {}),
        proposedTitle: experiment.proposedTitle,
        ...(experiment.currentDescription
          ? { currentDescription: experiment.currentDescription }
          : {}),
        proposedDescription: experiment.proposedDescription ?? '',
        rationale: experiment.rationale ?? 'Test title and description against Search Console CTR.',
        expectedImpact:
          experiment.expectedImpact ?? 'Improve qualified clicks without changing page ownership.',
      };
    })
    .filter(
      (
        experiment,
      ): experiment is MarketingConsoleSeoIntelligenceSummary['metadata']['experiments'][number] =>
        experiment !== undefined,
    )
    .sort(
      (left, right) =>
        priorityRank(left.priority) - priorityRank(right.priority) ||
        left.routePath.localeCompare(right.routePath),
    );
}

function readPageAuditSummary(cwd: string): MarketingConsoleSeoIntelligenceSummary['pageAudits'] {
  const root = path.join(cwd, 'docs', 'seo', 'keyword-research', 'page-audits');
  const missing = {
    status: 'missing' as const,
    sourceCount: 0,
    pageCount: 0,
    averageScore: 0,
    blockedCount: 0,
    warningCount: 0,
    audits: [],
  };
  if (!existsSync(root)) return missing;
  const files = collectJsonFiles(root);
  if (!files.length) return missing;
  try {
    const audits = files.flatMap((file) => {
      const parsed = JSON.parse(readFileSync(file.filePath, 'utf8')) as PageAuditJson;
      return normalizePageAudits(parsed);
    });
    const averageScore =
      audits.length > 0
        ? Math.round(audits.reduce((sum, audit) => sum + audit.score, 0) / audits.length)
        : 0;
    const blockedCount = audits.filter((audit) => audit.status === 'blocked').length;
    const warningCount = audits.filter((audit) => audit.status === 'warn').length;
    return {
      status:
        blockedCount > 0 ? 'blocked' : warningCount > 0 ? 'warn' : audits.length ? 'ready' : 'warn',
      sourceCount: files.length,
      pageCount: audits.length,
      averageScore,
      blockedCount,
      warningCount,
      audits: audits.slice(0, 80),
    };
  } catch {
    return { ...missing, status: 'blocked' };
  }
}

function normalizePageAudits(
  parsed: PageAuditJson,
): MarketingConsoleSeoIntelligenceSummary['pageAudits']['audits'] {
  return (parsed.audits ?? [])
    .map((audit, index) => {
      if (!audit.routePath?.trim()) return undefined;
      const score = Math.max(0, Math.min(100, Math.round(audit.score ?? 0)));
      const status = audit.status ?? (score >= 85 ? 'ready' : score >= 65 ? 'warn' : 'blocked');
      return {
        id: audit.id ?? `${audit.routePath}:audit:${index}`,
        routePath: audit.routePath,
        status,
        score,
        ...(audit.primaryKeyword ? { primaryKeyword: audit.primaryKeyword } : {}),
        ...(audit.intent ? { intent: audit.intent } : {}),
        missing: uniqueStrings(audit.missing ?? []),
        warnings: uniqueStrings(audit.warnings ?? []),
        recommendations: uniqueStrings(audit.recommendations ?? []),
      };
    })
    .filter(
      (audit): audit is MarketingConsoleSeoIntelligenceSummary['pageAudits']['audits'][number] =>
        audit !== undefined,
    )
    .sort(
      (left, right) => left.score - right.score || left.routePath.localeCompare(right.routePath),
    );
}

function priorityRank(priority: string | undefined): number {
  if (priority === 'p0') return 0;
  if (priority === 'p1') return 1;
  if (priority === 'p2') return 2;
  return 3;
}

function readCompetitorResearchSummary(cwd: string): MarketingConsoleCompetitorResearchSummary {
  const competitorsRoot = path.join(cwd, 'docs', 'seo', 'keyword-research', 'competitors');
  const missing: MarketingConsoleCompetitorResearchSummary = {
    status: 'missing',
    sourceCount: 0,
    pageCount: 0,
    domainCount: 0,
    keywordCount: 0,
    domains: [],
    pages: [],
    opportunities: [],
  };
  if (!existsSync(competitorsRoot)) return missing;
  const files = collectJsonFiles(competitorsRoot);
  const latest = files[0];
  if (!latest) return missing;
  try {
    const parsedFiles = files.map((file) => ({
      file,
      parsed: JSON.parse(readFileSync(file.filePath, 'utf8')) as CompetitorResearchJson,
    }));
    const pages = parsedFiles.flatMap(({ file, parsed }) =>
      normalizeCompetitorPages(parsed, file.filePath),
    );
    const domains = buildCompetitorDomainSummaries(pages);
    const opportunities = uniqueStrings(pages.flatMap((page) => page.opportunities)).slice(0, 12);
    return {
      status: pages.length > 0 ? 'ready' : 'warn',
      path: latest.filePath,
      sourceCount: parsedFiles.length,
      pageCount: pages.length,
      domainCount: domains.length,
      keywordCount: new Set(pages.map((page) => page.keyword).filter(Boolean)).size,
      domains,
      pages: pages.slice(0, 80),
      opportunities,
    };
  } catch {
    return {
      ...missing,
      status: 'blocked',
      path: latest.filePath,
    };
  }
}

function normalizeCompetitorPages(
  parsed: CompetitorResearchJson,
  sourcePath: string,
): MarketingConsoleCompetitorResearchSummary['pages'] {
  const rows: MarketingConsoleCompetitorResearchSummary['pages'] = [];
  for (const [index, page] of (parsed.pages ?? []).entries()) {
    const url = typeof page.url === 'string' ? page.url.trim() : '';
    const domain = page.domain ?? domainFromUrl(url);
    if (!url || !domain) continue;
    const patterns = [
      ...labelsFromPatterns(page.contentPatterns),
      ...(Array.isArray(page.patterns) ? page.patterns : []),
    ];
    rows.push({
      id: page.id ?? `${domain}:${index}`,
      competitor: page.competitor ?? competitorName(domain),
      domain,
      url,
      ...(page.keyword ? { keyword: page.keyword } : {}),
      ...(typeof page.position === 'number' ? { position: page.position } : {}),
      ...(page.pageType ? { pageType: page.pageType } : {}),
      ...((page.market ?? parsed.market) ? { market: page.market ?? parsed.market } : {}),
      source: page.source ?? parsed.source ?? path.relative(path.dirname(sourcePath), sourcePath),
      patterns: uniqueStrings(patterns),
      strengths: uniqueStrings(page.strengths ?? []),
      gaps: uniqueStrings(page.gaps ?? []),
      opportunities: uniqueStrings(page.opportunities ?? []),
      ...(page.notes ? { notes: page.notes } : {}),
    });
  }
  return rows.sort(
    (left, right) =>
      (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
      left.domain.localeCompare(right.domain) ||
      left.url.localeCompare(right.url),
  );
}

function buildCompetitorDomainSummaries(
  pages: MarketingConsoleCompetitorResearchSummary['pages'],
): MarketingConsoleCompetitorResearchSummary['domains'] {
  const groups = new Map<string, MarketingConsoleCompetitorResearchSummary['pages']>();
  for (const page of pages) {
    groups.set(page.domain, [...(groups.get(page.domain) ?? []), page]);
  }
  return [...groups.entries()]
    .map(([domain, rows]) => ({
      domain,
      pageCount: rows.length,
      keywordCount: new Set(rows.map((row) => row.keyword).filter(Boolean)).size,
      bestPosition: rows
        .map((row) => row.position)
        .filter((value): value is number => typeof value === 'number')
        .sort((left, right) => left - right)[0],
      pageTypes: uniqueStrings(rows.map((row) => row.pageType).filter(Boolean)),
      topPatterns: topStrings(
        rows.flatMap((row) => row.patterns),
        8,
      ),
      opportunities: uniqueStrings(rows.flatMap((row) => row.opportunities)).slice(0, 6),
    }))
    .sort(
      (left, right) =>
        right.pageCount - left.pageCount ||
        (left.bestPosition ?? Number.MAX_SAFE_INTEGER) -
          (right.bestPosition ?? Number.MAX_SAFE_INTEGER) ||
        left.domain.localeCompare(right.domain),
    );
}

function labelsFromPatterns(patterns: CompetitorResearchPageJson['contentPatterns']): string[] {
  return (patterns ?? [])
    .map((pattern: { label?: string } | string) =>
      typeof pattern === 'string' ? pattern : pattern.label,
    )
    .filter(
      (pattern): pattern is string => typeof pattern === 'string' && pattern.trim().length > 0,
    );
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function competitorName(domain: string): string {
  return domain
    .replace(/^www\./, '')
    .split('.')[0]!
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [
    ...new Set(
      values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)),
    ),
  ];
}

function topStrings(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function readKeywordResearchSummary(cwd: string): MarketingConsoleKeywordResearchSummary {
  const metricsRoot = path.join(cwd, 'docs', 'seo', 'keyword-research', 'metrics');
  const missing: MarketingConsoleKeywordResearchSummary = {
    status: 'missing',
    metricCount: 0,
    totalKnownVolume: 0,
    keywords: [],
    matrix: [],
    clusters: [],
    markets: [],
    topKeywords: [],
  };
  if (!existsSync(metricsRoot)) return missing;
  const files = collectJsonFiles(metricsRoot);
  const latest = files[0];
  if (!latest) return missing;
  try {
    const parsedFiles = files
      .map((file) => ({
        file,
        parsed: JSON.parse(readFileSync(file.filePath, 'utf8')) as KeywordMetricJson,
      }))
      .filter((entry) => Array.isArray(entry.parsed.metrics));
    const metricsByMarketTerm = new Map<
      string,
      NonNullable<KeywordMetricJson['metrics']>[number] & { country?: string; language?: string }
    >();
    for (const { parsed } of parsedFiles) {
      for (const metric of parsed.metrics ?? []) {
        if (typeof metric.term !== 'string' || metric.term.trim().length === 0) continue;
        const country = metric.country ?? parsed.market?.country ?? parsed.country;
        const language = metric.language ?? parsed.market?.language ?? parsed.language;
        const currencyCode = metric.currencyCode ?? parsed.market?.currencyCode;
        const normalizedTerm = metric.normalizedTerm ?? metric.term.trim().toLowerCase();
        const key = `${country ?? 'unknown'}:${language ?? 'unknown'}:${normalizedTerm}`;
        const current = metricsByMarketTerm.get(key);
        if (!current || (metric.avgMonthlySearches ?? 0) > (current.avgMonthlySearches ?? 0)) {
          metricsByMarketTerm.set(key, {
            ...metric,
            country,
            language,
            ...(currencyCode ? { currencyCode } : {}),
            ...(parsed.source?.kind ? { sourceKind: parsed.source.kind } : {}),
            ...(parsed.source?.clusterId ? { sourceClusterId: parsed.source.clusterId } : {}),
          });
        }
      }
    }
    const metrics = [...metricsByMarketTerm.values()];
    const totalKnownVolume = metrics.reduce(
      (sum, metric) => sum + (metric.avgMonthlySearches ?? 0),
      0,
    );
    const competitionValues = metrics
      .map((metric) => metric.competitionIndex)
      .filter((value): value is number => typeof value === 'number');
    const averageCompetitionIndex =
      competitionValues.length > 0
        ? Math.round(
            competitionValues.reduce((sum, value) => sum + value, 0) / competitionValues.length,
          )
        : undefined;
    const fetchedAt = metrics
      .map((metric) => metric.fetchedAt)
      .filter((value): value is string => typeof value === 'string')
      .sort()
      .at(-1);
    const keywords = metrics
      .map((metric) => ({
        term: metric.term ?? '',
        ...(metric.normalizedTerm ? { normalizedTerm: metric.normalizedTerm } : {}),
        ...(metric.country ? { country: metric.country } : {}),
        ...(metric.language ? { language: metric.language } : {}),
        ...(metric.currencyCode ? { currencyCode: metric.currencyCode } : {}),
        ...(metric.sourceKind ? { sourceKind: metric.sourceKind } : {}),
        ...(metric.sourceClusterId ? { sourceClusterId: metric.sourceClusterId } : {}),
        ...(metric.avgMonthlySearches !== undefined
          ? { avgMonthlySearches: metric.avgMonthlySearches }
          : {}),
        ...(metric.competition ? { competition: metric.competition } : {}),
        ...(metric.competitionIndex !== undefined
          ? { competitionIndex: metric.competitionIndex }
          : {}),
        ...(metric.lowTopOfPageBidMicros !== undefined
          ? { lowTopOfPageBidMicros: metric.lowTopOfPageBidMicros }
          : {}),
        ...(metric.highTopOfPageBidMicros !== undefined
          ? { highTopOfPageBidMicros: metric.highTopOfPageBidMicros }
          : {}),
      }))
      .sort(
        (left, right) =>
          (right.avgMonthlySearches ?? 0) - (left.avgMonthlySearches ?? 0) ||
          (right.highTopOfPageBidMicros ?? 0) - (left.highTopOfPageBidMicros ?? 0) ||
          left.term.localeCompare(right.term),
      );
    const matrix = buildKeywordMatrix(keywords);
    return {
      status: metrics.length > 0 ? 'ready' : 'warn',
      path: latest.filePath,
      provider: parsedFiles[0]?.parsed.provider,
      currencyCode: metrics.find((metric) => metric.currencyCode)?.currencyCode,
      sourceCount: parsedFiles.length,
      runCount: new Set(parsedFiles.map((entry) => entry.parsed.runId).filter(Boolean)).size,
      metricCount: metrics.length,
      totalKnownVolume,
      ...(averageCompetitionIndex !== undefined ? { averageCompetitionIndex } : {}),
      ...(fetchedAt ? { fetchedAt } : {}),
      keywords,
      matrix,
      clusters: buildKeywordClusters(matrix),
      markets: buildKeywordMarketSummaries(keywords),
      topKeywords: keywords.slice(0, 12),
    };
  } catch {
    return {
      ...missing,
      status: 'blocked',
      path: latest.filePath,
    };
  }
}

function collectJsonFiles(root: string): Array<{ filePath: string; mtimeMs: number }> {
  const files: Array<{ filePath: string; mtimeMs: number }> = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push({ filePath, mtimeMs: statSync(filePath).mtimeMs });
      }
    }
  };
  visit(root);
  return files.sort((left, right) => right.mtimeMs - left.mtimeMs);
}

function buildKeywordMarketSummaries(
  keywords: MarketingConsoleKeywordResearchSummary['keywords'],
): MarketingConsoleKeywordResearchSummary['markets'] {
  const groups = new Map<string, MarketingConsoleKeywordResearchSummary['keywords']>();
  for (const keyword of keywords) {
    const key = keywordMarketKey(keyword.country, keyword.language);
    groups.set(key, [...(groups.get(key) ?? []), keyword]);
  }
  return [...groups.entries()]
    .map(([market, rows]) => {
      const totalKnownVolume = rows.reduce((sum, row) => sum + (row.avgMonthlySearches ?? 0), 0);
      const competitionValues = rows
        .map((row) => row.competitionIndex)
        .filter((value): value is number => typeof value === 'number');
      const averageCompetitionIndex =
        competitionValues.length > 0
          ? Math.round(
              competitionValues.reduce((sum, value) => sum + value, 0) / competitionValues.length,
            )
          : undefined;
      return {
        market,
        ...(rows[0]?.country ? { country: rows[0].country } : {}),
        ...(rows[0]?.language ? { language: rows[0].language } : {}),
        ...(rows[0]?.currencyCode ? { currencyCode: rows[0].currencyCode } : {}),
        metricCount: rows.length,
        totalKnownVolume,
        ...(averageCompetitionIndex !== undefined ? { averageCompetitionIndex } : {}),
        topKeywords: rows.slice(0, 12),
      };
    })
    .sort(
      (left, right) =>
        right.totalKnownVolume - left.totalKnownVolume || left.market.localeCompare(right.market),
    );
}

function buildKeywordMatrix(
  keywords: MarketingConsoleKeywordResearchSummary['keywords'],
): MarketingConsoleKeywordResearchSummary['matrix'] {
  const rows = new Map<string, MarketingConsoleKeywordResearchSummary['matrix'][number]>();
  for (const keyword of keywords) {
    const normalizedTerm = keyword.normalizedTerm ?? keyword.term.trim().toLowerCase();
    if (!normalizedTerm) continue;
    const market = keywordMarketKey(keyword.country, keyword.language);
    const row =
      rows.get(normalizedTerm) ??
      ({
        term: keyword.term,
        normalizedTerm,
        marketCount: 0,
        totalKnownVolume: 0,
        markets: {},
      } satisfies MarketingConsoleKeywordResearchSummary['matrix'][number]);
    if (!row.markets[market]) {
      row.marketCount += 1;
    }
    row.markets[market] = {
      ...(keyword.avgMonthlySearches !== undefined
        ? { avgMonthlySearches: keyword.avgMonthlySearches }
        : {}),
      ...(keyword.competition ? { competition: keyword.competition } : {}),
      ...(keyword.competitionIndex !== undefined
        ? { competitionIndex: keyword.competitionIndex }
        : {}),
      ...(keyword.lowTopOfPageBidMicros !== undefined
        ? { lowTopOfPageBidMicros: keyword.lowTopOfPageBidMicros }
        : {}),
      ...(keyword.highTopOfPageBidMicros !== undefined
        ? { highTopOfPageBidMicros: keyword.highTopOfPageBidMicros }
        : {}),
      ...(keyword.currencyCode ? { currencyCode: keyword.currencyCode } : {}),
    };
    rows.set(normalizedTerm, row);
  }

  return [...rows.values()]
    .map((row) => {
      const entries = Object.entries(row.markets);
      const totalKnownVolume = entries.reduce(
        (sum, [, market]) => sum + (market.avgMonthlySearches ?? 0),
        0,
      );
      const [bestMarket, bestMarketMetrics] = entries.sort(
        (left, right) => (right[1].avgMonthlySearches ?? 0) - (left[1].avgMonthlySearches ?? 0),
      )[0] ?? [undefined, undefined];
      return {
        ...row,
        totalKnownVolume,
        ...(bestMarket ? { bestMarket } : {}),
        ...(bestMarketMetrics?.avgMonthlySearches !== undefined
          ? { bestMarketVolume: bestMarketMetrics.avgMonthlySearches }
          : {}),
      };
    })
    .sort(
      (left, right) =>
        right.totalKnownVolume - left.totalKnownVolume ||
        right.marketCount - left.marketCount ||
        left.normalizedTerm.localeCompare(right.normalizedTerm),
    );
}

function buildKeywordClusters(
  rows: MarketingConsoleKeywordResearchSummary['matrix'],
): MarketingConsoleKeywordResearchSummary['clusters'] {
  const clusterRows = new Map<string, MarketingConsoleKeywordResearchSummary['matrix']>();
  for (const row of rows) {
    const cluster = classifyKeywordCluster(row.normalizedTerm);
    clusterRows.set(cluster.id, [...(clusterRows.get(cluster.id) ?? []), row]);
  }

  const clusters: MarketingConsoleKeywordClusterSummary[] = [];
  for (const definition of keywordClusterDefinitions) {
    const rowsInCluster = clusterRows.get(definition.id) ?? [];
    const topKeywords = rowsInCluster.slice(0, 12);
    if (rowsInCluster.length === 0) continue;
    const marketVolumes: Record<string, number> = {};
    let competitionValueTotal = 0;
    let competitionValueCount = 0;
    for (const row of rowsInCluster) {
      for (const [market, metrics] of Object.entries(row.markets)) {
        marketVolumes[market] = (marketVolumes[market] ?? 0) + (metrics.avgMonthlySearches ?? 0);
        if (metrics.competitionIndex !== undefined) {
          competitionValueTotal += metrics.competitionIndex;
          competitionValueCount += 1;
        }
      }
    }
    const [bestMarket, bestMarketVolume] =
      Object.entries(marketVolumes).sort((left, right) => right[1] - left[1])[0] ?? [];
    clusters.push({
      ...definition,
      metricCount: rowsInCluster.length,
      totalKnownVolume: rowsInCluster.reduce((sum, row) => sum + row.totalKnownVolume, 0),
      ...(competitionValueCount > 0
        ? { averageCompetitionIndex: Math.round(competitionValueTotal / competitionValueCount) }
        : {}),
      ...(bestMarket ? { bestMarket } : {}),
      ...(bestMarketVolume !== undefined ? { bestMarketVolume } : {}),
      marketVolumes,
      topKeywords,
    });
  }
  return clusters.sort((left, right) => right.totalKnownVolume - left.totalKnownVolume);
}

const keywordClusterDefinitions = [
  {
    id: 'ats',
    label: 'ATS checker and job match',
    intent: 'Users checking ATS score, ATS compatibility, keywords, or job-description match.',
    recommendedUse:
      'Primary paid and landing-page test cluster; strongest fit for TrueResume differentiation.',
  },
  {
    id: 'templates',
    label: 'Resume templates and formats',
    intent: 'Users comparing templates, formats, layouts, and downloadable resume files.',
    recommendedUse:
      'SEO/category pages first; paid only after template conversion proof is strong.',
  },
  {
    id: 'builder',
    label: 'Resume builder and maker',
    intent: 'Users searching for resume builders, makers, editors, or AI resume creation.',
    recommendedUse:
      'Homepage/product positioning cluster; expensive paid terms need strict conversion proof.',
  },
  {
    id: 'cv-fresher',
    label: 'CV, fresher, and student',
    intent: 'Users looking for CV maker, CV templates, fresher resume formats, or student resumes.',
    recommendedUse:
      'India-focused SEO and landing-page cluster with separate copy from US resume language.',
  },
  {
    id: 'examples',
    label: 'Examples and samples',
    intent: 'Users searching for resume examples, samples, or role-specific inspiration.',
    recommendedUse: 'SEO content cluster; useful for internal links and remarketing audiences.',
  },
  {
    id: 'cover-letter',
    label: 'Cover letter',
    intent: 'Users needing cover letters alongside resumes.',
    recommendedUse: 'Attachment product and upsell cluster; avoid mixing with core ATS ad groups.',
  },
  {
    id: 'competitor-brand',
    label: 'Competitor and brand',
    intent: 'Users searching competitor tools or brand names.',
    recommendedUse: 'Monitor only unless explicit competitor campaign policy is approved.',
  },
  {
    id: 'other',
    label: 'Other resume intent',
    intent: 'Related resume searches that do not yet fit a primary campaign cluster.',
    recommendedUse: 'Review manually before creating pages or ad groups.',
  },
] as const;

function classifyKeywordCluster(term: string): (typeof keywordClusterDefinitions)[number] {
  if (/\b(ats|score|checker|scanner|keyword|match|tailor|job description)\b/.test(term)) {
    return keywordClusterDefinitions[0];
  }
  if (/\b(template|templates|format|formats|layout|download|google docs|word)\b/.test(term)) {
    return keywordClusterDefinitions[1];
  }
  if (/\b(builder|maker|creator|editor|create|make|ai)\b/.test(term)) {
    return keywordClusterDefinitions[2];
  }
  if (/\b(cv|fresher|freshers|student)\b/.test(term)) {
    return keywordClusterDefinitions[3];
  }
  if (/\b(example|examples|sample|samples)\b/.test(term)) {
    return keywordClusterDefinitions[4];
  }
  if (/\bcover letter\b/.test(term)) {
    return keywordClusterDefinitions[5];
  }
  if (/\b(zety|canva|resume io|resumeio|novoresume|enhancv)\b/.test(term)) {
    return keywordClusterDefinitions[6];
  }
  return keywordClusterDefinitions[7];
}

function keywordMarketKey(country: string | undefined, language: string | undefined): string {
  return [country ?? 'unknown', language ?? 'unknown'].join(' / ');
}

function setupRouteStatus(setup: MarketingConsoleSetupProjection): MarketingConsoleStatus {
  if (setup.ok) return 'ready';
  const preProofStages = setup.stages.filter((stage) => stage.id !== 'proofReady');
  return preProofStages.some(
    (stage) =>
      (stage.status === 'current' || stage.status === 'blocked') &&
      stage.checks.some((check) => check.status === 'error'),
  )
    ? 'blocked'
    : 'warn';
}

function combineConsoleStatuses(
  ...statuses: readonly MarketingConsoleStatus[]
): MarketingConsoleStatus {
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.includes('warn')) return 'warn';
  if (statuses.includes('missing')) return 'missing';
  return 'ready';
}

function toConsoleStatus(status: string): MarketingConsoleStatus {
  if (status === 'fresh' || status === 'pass' || status === 'ready' || status === 'executed') {
    return 'ready';
  }
  if (status === 'missing') return 'missing';
  if (status === 'error' || status === 'blocked') return 'blocked';
  return 'warn';
}

function buildFreshness(
  config: Awaited<ReturnType<typeof loadMarketingExecutionContext>>['config'],
  cwd: string,
  now: Date,
  maxAgeDays: number,
): MarketingConsoleFreshnessCell[] {
  return reportFamilies.map(({ provider, reportType }) => {
    const status = readMarketingProviderReportStatus({
      cwd,
      provider,
      reportType,
      now,
      maxAgeDays,
    }).providers[0];
    return {
      id: `${provider}.${reportType}`,
      provider,
      reportType,
      status: freshnessStatusFor(config.providers[provider].state, status?.status ?? 'missing'),
      label: reportLabel(provider, reportType),
      message: freshnessMessageFor(
        provider,
        reportType,
        status?.status ?? 'missing',
        status?.message,
      ),
      path: status?.path,
      ageDays: status?.ageDays,
      recordCount: status?.recordCount,
      ...(status?.path ? { currencyCode: readCurrencyFromReportPath(status.path) } : {}),
    };
  });
}

function freshnessStatusFor(providerState: string, status: string): MarketingConsoleStatus {
  if (status === 'fresh') return 'ready';
  if (status === 'error') return 'blocked';
  if (providerState === 'planned') return 'warn';
  return toConsoleStatus(status);
}

function freshnessMessageFor(
  provider: MarketingReportProvider,
  reportType: MarketingProviderReportType,
  status: string,
  fallback: string | undefined,
): string {
  if (status === 'fresh') return fallback ?? `${reportLabel(provider, reportType)} is fresh.`;
  if (provider === 'metaAds') {
    return 'Meta Ads is planned for a later proof pass. Connect the ad account, pixel, and reports before running Meta campaigns.';
  }
  if (provider === 'googleAds') {
    return 'Google Ads reports are not pulled yet. Keep ads read-only until account, conversion, and report proof are ready.';
  }
  if (provider === 'ga4') {
    return `Pull the GA4 ${reportTypeLabel(reportType)} report to show trusted analytics trends.`;
  }
  if (provider === 'searchConsole') {
    return `Pull the Search Console ${reportTypeLabel(reportType)} report to show organic search evidence.`;
  }
  return fallback ?? `${reportLabel(provider, reportType)} is not available yet.`;
}

function buildChannelRows(
  freshness: MarketingConsoleFreshnessCell[],
): MarketingConsoleComparisonRow[] {
  return freshness
    .filter(
      (cell): cell is ProviderFreshnessCell =>
        cell.provider !== 'confirmedConversions' && cell.provider !== 'strategyMap',
    )
    .map((cell) => {
      const metrics = readMetricsFromFreshnessCell(cell);
      return {
        id: cell.id,
        label: cell.reportType
          ? reportLabel(cell.provider, cell.reportType)
          : providerLabel(cell.provider),
        provider: cell.provider,
        ...(cell.reportType ? { reportType: cell.reportType } : {}),
        ...(cell.currencyCode ? { currencyCode: cell.currencyCode } : {}),
        metrics,
        derived: deriveMarketingMetrics(metrics),
      };
    })
    .filter((row) => Object.keys(row.metrics).length > 0)
    .sort((left, right) => (right.metrics.cost ?? 0) - (left.metrics.cost ?? 0))
    .slice(0, 8);
}

function buildSeoRows(freshness: MarketingConsoleFreshnessCell[]): MarketingConsoleSeoRow[] {
  const queryPageRows = readSeoRowsFromCell(
    freshness.find((cell) => cell.provider === 'searchConsole' && cell.reportType === 'queryPage'),
  );
  if (queryPageRows.length > 0) return queryPageRows;
  return readSeoRowsFromCell(
    freshness.find((cell) => cell.provider === 'searchConsole' && cell.reportType === 'query'),
  );
}

function readSeoRowsFromCell(
  cell: MarketingConsoleFreshnessCell | undefined,
): MarketingConsoleSeoRow[] {
  if (!cell?.path || !existsSync(cell.path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(cell.path, 'utf8')) as {
      records?: Array<{
        id?: string;
        query?: string;
        pageUrl?: string;
        metrics?: MarketingReportMetrics;
        ctr?: number;
        position?: number;
      }>;
    };
    return (parsed.records ?? [])
      .map((record, index): MarketingConsoleSeoRow | undefined => {
        if (!record.query) return undefined;
        const clicks = record.metrics?.clicks;
        const impressions = record.metrics?.impressions;
        const ctr =
          normalizeSearchConsoleCtr(record.ctr) ??
          (clicks !== undefined && impressions ? (clicks / impressions) * 100 : undefined);
        return {
          id: record.id ?? `${record.query}:${record.pageUrl ?? 'all'}:${index}`,
          query: record.query,
          ...(record.pageUrl ? { pageUrl: record.pageUrl } : {}),
          ...(clicks !== undefined ? { clicks } : {}),
          ...(impressions !== undefined ? { impressions } : {}),
          ...(ctr !== undefined ? { ctr } : {}),
          ...(record.position !== undefined ? { position: record.position } : {}),
        };
      })
      .filter((record): record is MarketingConsoleSeoRow => record !== undefined)
      .sort(
        (left, right) =>
          (right.clicks ?? 0) - (left.clicks ?? 0) ||
          (right.impressions ?? 0) - (left.impressions ?? 0) ||
          left.query.localeCompare(right.query),
      )
      .slice(0, 25);
  } catch {
    return [];
  }
}

function normalizeSearchConsoleCtr(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return value <= 1 ? value * 100 : value;
}

function readMetricsFromFreshnessCell(cell: MarketingConsoleFreshnessCell): MarketingReportMetrics {
  if (!cell.path || !existsSync(cell.path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(cell.path, 'utf8')) as {
      records?: Array<{ metrics?: MarketingReportMetrics }>;
    };
    const totals: MarketingReportMetrics = {};
    for (const record of parsed.records ?? []) {
      addMetric(totals, 'impressions', record.metrics?.impressions);
      addMetric(totals, 'clicks', record.metrics?.clicks);
      addMetric(totals, 'cost', record.metrics?.cost);
      addMetric(totals, 'conversions', record.metrics?.conversions);
      addMetric(totals, 'conversionValue', record.metrics?.conversionValue);
      addMetric(totals, 'revenue', record.metrics?.revenue);
      addMetric(totals, 'sessions', record.metrics?.sessions);
      addMetric(totals, 'users', record.metrics?.users);
      addMetric(totals, 'keyEvents', record.metrics?.keyEvents);
      addMetric(totals, 'purchases', record.metrics?.purchases);
    }
    return totals;
  } catch {
    return {};
  }
}

function readCurrencyFromReportPath(reportPath: string): string | undefined {
  if (!existsSync(reportPath)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(reportPath, 'utf8')) as {
      records?: Array<{ currency?: string }>;
    };
    const currencies = [
      ...new Set(
        (parsed.records ?? [])
          .map((record) => normalizeCurrencyCode(record.currency))
          .filter((currency): currency is string => currency !== undefined),
      ),
    ];
    return currencies.length === 1 ? currencies[0] : undefined;
  } catch {
    return undefined;
  }
}

function normalizeCurrencyCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const currencyCode = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : undefined;
}

function addMetric(
  metrics: MarketingReportMetrics,
  key: keyof MarketingReportMetrics,
  value: number | undefined,
): void {
  if (typeof value === 'number') metrics[key] = (metrics[key] ?? 0) + value;
}

function sumFreshnessMetrics(freshness: MarketingConsoleFreshnessCell[]): MarketingReportMetrics {
  const totals: MarketingReportMetrics = {};
  for (const cell of selectMetricFreshnessCells(freshness)) {
    const metrics = readMetricsFromFreshnessCell(cell);
    addMetric(totals, 'impressions', metrics.impressions);
    addMetric(totals, 'clicks', metrics.clicks);
    addMetric(totals, 'cost', metrics.cost);
    addMetric(totals, 'conversions', metrics.conversions);
    addMetric(totals, 'conversionValue', metrics.conversionValue);
    addMetric(totals, 'revenue', metrics.revenue);
    addMetric(totals, 'sessions', metrics.sessions);
    addMetric(totals, 'users', metrics.users);
  }
  return totals;
}

function selectMetricFreshnessCells(
  freshness: MarketingConsoleFreshnessCell[],
): MarketingConsoleFreshnessCell[] {
  const byProvider = new Map<string, MarketingConsoleFreshnessCell[]>();
  for (const cell of freshness) {
    byProvider.set(cell.provider, [...(byProvider.get(cell.provider) ?? []), cell]);
  }
  return [...byProvider.values()]
    .map((cells) => selectProviderMetricCell(cells))
    .filter((cell): cell is MarketingConsoleFreshnessCell => cell !== undefined);
}

function selectProviderMetricCell(
  cells: MarketingConsoleFreshnessCell[],
): MarketingConsoleFreshnessCell | undefined {
  const provider = cells[0]?.provider;
  const priority =
    provider === 'googleAds'
      ? ['campaign', 'account', 'adGroup', 'keyword', 'conversion']
      : provider === 'metaAds'
        ? ['campaign', 'adSet', 'ad', 'event']
        : provider === 'ga4'
          ? ['channel', 'sourceMedium', 'landingPage', 'ecommerce']
          : provider === 'searchConsole'
            ? ['queryPage', 'query', 'page']
            : [];
  for (const reportType of priority) {
    const cell = cells.find((candidate) => candidate.reportType === reportType);
    if (cell && Object.keys(readMetricsFromFreshnessCell(cell)).length > 0) return cell;
  }
  return cells.find((cell) => Object.keys(readMetricsFromFreshnessCell(cell)).length > 0);
}

function buildMetrics(freshness: MarketingConsoleFreshnessCell[]): MarketingConsoleMetric[] {
  const totals = sumFreshnessMetrics(freshness);
  const derived = deriveMarketingMetrics(totals);
  const currencyCode = selectMetricCurrencyCode(freshness);
  return [
    metric(
      'spend',
      'Spend',
      money(totals.cost, currencyCode),
      totals.cost,
      'Paid provider cost',
      statusForMetric(totals.cost),
      currencyCode,
    ),
    metric(
      'conversions',
      'Conversions',
      number(totals.conversions),
      totals.conversions,
      'Provider-reported conversions',
      statusForMetric(totals.conversions),
    ),
    metric(
      'cpa',
      'CPA',
      money(derived.cpa, currencyCode),
      derived.cpa,
      'Cost per provider conversion',
      derived.cpa === undefined ? 'missing' : 'ready',
      currencyCode,
    ),
    metric(
      'roas',
      'ROAS',
      ratio(derived.roas),
      derived.roas,
      'Revenue or value over spend',
      derived.roas === undefined ? 'missing' : 'ready',
    ),
    metric(
      'ctr',
      'CTR',
      percent(derived.ctr),
      derived.ctr,
      'Clicks divided by impressions',
      derived.ctr === undefined ? 'missing' : 'ready',
    ),
    metric(
      'traffic',
      'Clicks',
      number(totals.clicks),
      totals.clicks,
      'Paid/organic click volume',
      statusForMetric(totals.clicks),
    ),
  ];
}

function selectMetricCurrencyCode(freshness: MarketingConsoleFreshnessCell[]): string | undefined {
  const currencies = [
    ...new Set(
      selectMetricFreshnessCells(freshness)
        .map((cell) => cell.currencyCode)
        .filter((currency): currency is string => currency !== undefined),
    ),
  ];
  return currencies.length === 1 ? currencies[0] : undefined;
}

function metric(
  id: string,
  label: string,
  value: string,
  numericValue: number | undefined,
  helper: string,
  status: MarketingConsoleStatus,
  currencyCode?: string,
): MarketingConsoleMetric {
  return {
    id,
    label,
    value,
    ...(numericValue !== undefined ? { numericValue } : {}),
    ...(currencyCode ? { currencyCode } : {}),
    helper,
    status,
  };
}

function statusForMetric(value: number | undefined): MarketingConsoleStatus {
  return value === undefined ? 'missing' : value === 0 ? 'warn' : 'ready';
}

function buildTrends(freshness: MarketingConsoleFreshnessCell[]): {
  spend: MarketingConsoleTrendPoint[];
  conversions: MarketingConsoleTrendPoint[];
  cpa: MarketingConsoleTrendPoint[];
} {
  const rows = freshness
    .map((cell) => {
      const metrics = readMetricsFromFreshnessCell(cell);
      const label = cell.reportType
        ? reportLabel(cell.provider, cell.reportType)
        : providerLabel(cell.provider);
      const cost = metrics.cost ?? 0;
      const conversions = metrics.conversions ?? 0;
      return {
        label,
        cost,
        conversions,
        cpa: conversions > 0 ? cost / conversions : 0,
        currencyCode: cell.currencyCode,
      };
    })
    .slice(0, 8);
  return {
    spend: rows.map((row) => ({
      label: row.label,
      value: row.cost,
      ...(row.currencyCode ? { currencyCode: row.currencyCode } : {}),
    })),
    conversions: rows.map((row) => ({ label: row.label, value: row.conversions })),
    cpa: rows.map((row) => ({ label: row.label, value: row.cpa })),
  };
}

function buildReadiness(
  statusesByCapability: MarketingConsoleReadinessStatuses,
  currentStage: string,
  nextAction: string,
): MarketingConsoleState['readiness'] {
  const statuses = Object.values(statusesByCapability);
  const readyCount = statuses.filter((status) => status === 'ready').length;
  const score = Math.round((readyCount / statuses.length) * 100);
  const blocked = statuses.some((status) => status === 'blocked');
  return {
    status: blocked ? 'blocked' : score >= 75 ? 'ready' : 'warn',
    score,
    label: blocked ? `Needs attention: ${readinessStageLabel(currentStage)}` : `${score}% ready`,
    nextWorkflowStep: nextAction,
  };
}

function readinessStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    local: 'local pack',
    deployedDomain: 'deployed domain',
    providerAuth: 'provider login',
    providerDiscovery: 'provider identifiers',
    proofReady: 'proof evidence',
  };
  return labels[stage] ?? stage;
}

function buildActions(input: {
  setupNext?: string;
  proofNext: string;
  marketingNext: string;
  analyticsNext: string;
  adsNext: string;
  researchNext: string;
  scheduleNext?: string;
}): MarketingConsoleActionItem[] {
  return [
    action(
      'connections',
      'Connection next step',
      friendlyActionMessage(input.setupNext ?? 'Setup lifecycle is complete.'),
      'connections',
      'warn',
    ),
    action(
      'access',
      'Access next step',
      friendlyActionMessage(input.proofNext),
      'connections',
      'warn',
    ),
    action(
      'reports',
      'Report freshness',
      friendlyActionMessage(input.marketingNext),
      'reports',
      'warn',
    ),
    action(
      'analytics',
      'Analytics next step',
      friendlyActionMessage(input.analyticsNext),
      'analytics',
      'info',
    ),
    action(
      'advertising',
      'Advertising next step',
      friendlyActionMessage(input.adsNext),
      'advertising',
      'warn',
    ),
    action('seo-research', 'Research next step', input.researchNext, 'seo', 'info'),
    ...(input.scheduleNext
      ? [
          action(
            'automations',
            'Automation next step',
            friendlyActionMessage(input.scheduleNext),
            'automations',
            'info',
          ),
        ]
      : []),
  ].filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.message === item.message) === index,
  );
}

function friendlyActionMessage(message: string): string {
  if (message.includes('Refresh googleAds')) {
    return 'Refresh paid reporting evidence after the Google Ads account is ready; keep live changes blocked until proof exists.';
  }
  if (message.includes('Refresh ga4')) {
    return 'Refresh GA4 evidence after Google analytics login is complete.';
  }
  if (message.includes('Refresh searchConsole')) {
    return 'Refresh Search Console evidence after Google login is complete.';
  }
  if (message.includes('GOOGLE_CONNECTION_REQUIRED') && message.includes('analytics')) {
    return 'Complete Google analytics login for GA4, then pull fresh analytics reports.';
  }
  if (message.includes('GOOGLE_CONNECTION_REQUIRED') && message.includes('search-console')) {
    return 'Complete Google Search Console login, then pull fresh organic search reports.';
  }
  if (message.includes('marketing pull-api') && message.includes('googleAds')) {
    return 'Pull a narrow Google Ads campaign report when the ads account is ready; keep optimization read-only until proof exists.';
  }
  if (message.includes('marketing pull-api') && message.includes('ga4')) {
    return 'Pull fresh GA4 reports so analytics cards can show real traffic and conversion trends.';
  }
  if (message.includes('marketing pull-api') && message.includes('searchConsole')) {
    return 'Pull Search Console query/page evidence so SEO decisions are based on verified search data.';
  }
  if (message.includes('metaAds')) {
    return 'Meta Ads is planned for a later proof pass; connect account and pixel details before Meta reporting or campaigns.';
  }
  if (message.includes('provider scopes and rate limits')) {
    return 'Record provider scopes and rate-limit notes before enabling scheduled pulls.';
  }
  if (message.includes('Google Ads and Meta Ads')) {
    return 'Pull read-only paid reports after the paid accounts are ready; keep live optimization blocked until proof exists.';
  }
  return message
    .replace(/`([^`]+)`/g, '$1')
    .replace(/unisane (?:growth|provider) [^.,]+/g, 'the matching Unisane command');
}

function action(
  id: string,
  title: string,
  message: string,
  lane: string,
  severity: MarketingConsoleActionItem['severity'],
): MarketingConsoleActionItem {
  return {
    id,
    title,
    message,
    lane,
    severity,
    command: commandFromMessage(message),
  };
}

function commandFromMessage(message: string): string | undefined {
  const match = message.match(/`([^`]+)`/);
  return match?.[1];
}

function selectNextAction(actions: MarketingConsoleActionItem[]): string {
  return (
    actions.find((actionItem) => actionItem.severity === 'critical')?.message ??
    actions[0]?.message ??
    'Review the dashboard and refresh missing evidence.'
  );
}

function collectReceipts(
  cwd: string,
  environment: string,
  now: Date,
): MarketingConsoleReceiptEvent[] {
  const receiptsRoot = path.join(cwd, '.unisane', 'marketing', environment, 'receipts');
  if (!existsSync(receiptsRoot)) return [];
  return readdirSync(receiptsRoot)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const filePath = path.join(receiptsRoot, name);
      const stats = statSync(filePath);
      const parsed = safeReadJson(filePath);
      const kind = typeof parsed?.kind === 'string' ? parsed.kind : 'receipt';
      const status = typeof parsed?.status === 'string' ? parsed.status : 'missing';
      return {
        id: name,
        lane: kind.includes('ads') ? 'ads' : kind.includes('gtm') ? 'gtm' : 'marketing',
        action: kind.replace('unisane.marketing.', ''),
        status: toConsoleStatus(status),
        timestamp:
          typeof parsed?.generatedAt === 'string' ? parsed.generatedAt : stats.mtime.toISOString(),
        path: filePath,
        message:
          typeof parsed?.nextWorkflowStep === 'string'
            ? parsed.nextWorkflowStep
            : `${name} updated ${Math.max(0, Math.round((now.getTime() - stats.mtimeMs) / 86_400_000))} days ago.`,
      } satisfies MarketingConsoleReceiptEvent;
    })
    .sort((left, right) => (right.timestamp ?? '').localeCompare(left.timestamp ?? ''))
    .slice(0, 20);
}

function collectGtmArtifactLinks(
  cwd: string,
  appId: string,
  environment: string,
): MarketingConsoleArtifactLink[] {
  const root = path.join(cwd, '.unisane', 'gtm', appId, environment);
  const latestSnapshot = latestJsonArtifact(path.join(root, 'snapshots'));
  const latestPlan = latestJsonArtifact(path.join(root, 'plans'));
  const latestApply = latestJsonArtifact(path.join(root, 'receipts'));
  const latestPreview = latestJsonArtifact(path.join(root, 'previews'));
  const latestVersion = latestJsonArtifact(path.join(root, 'versions'));
  const latestPublish = latestJsonArtifact(path.join(root, 'publishes'));
  const latestRollback = latestJsonArtifact(path.join(root, 'rollbacks'));
  return [
    gtmArtifact('gtm.snapshot.latest', 'Latest GTM snapshot', latestSnapshot, 'ready'),
    gtmArtifact('gtm.plan.latest', 'Latest GTM plan', latestPlan, statusForGtmPlan(latestPlan)),
    gtmArtifact('gtm.apply.latest', 'Latest GTM apply receipt', latestApply, 'ready'),
    gtmArtifact(
      'gtm.preview.latest',
      'Latest GTM preview receipt',
      latestPreview,
      statusForGtmPreview(latestPreview),
    ),
    gtmArtifact('gtm.version.latest', 'Latest GTM version receipt', latestVersion, 'ready'),
    gtmArtifact('gtm.publish.latest', 'Latest GTM publish receipt', latestPublish, 'ready'),
    gtmArtifact('gtm.rollback.latest', 'Latest GTM rollback receipt', latestRollback, 'ready'),
  ].filter((artifact): artifact is MarketingConsoleArtifactLink => artifact !== undefined);
}

function collectGtmIdentity(
  cwd: string,
  appId: string,
  environment: string,
): MarketingConsoleState['gtm'] | undefined {
  const root = path.join(cwd, '.unisane', 'gtm', appId, environment);
  const candidates = [
    latestJsonArtifact(path.join(root, 'previews')),
    latestJsonArtifact(path.join(root, 'receipts')),
    latestJsonArtifact(path.join(root, 'plans')),
    latestJsonArtifact(path.join(root, 'snapshots')),
  ].filter((artifact): artifact is LocalJsonArtifact => artifact !== undefined);
  const identity: NonNullable<MarketingConsoleState['gtm']> = {};
  for (const artifact of candidates) {
    assignGtmIdentityString(identity, 'accountId', artifact.parsed?.accountId);
    assignGtmIdentityString(identity, 'containerId', artifact.parsed?.containerId);
    assignGtmIdentityString(identity, 'containerPath', artifact.parsed?.containerPath);
    assignGtmIdentityString(identity, 'workspacePath', artifact.parsed?.workspacePath);
    const containerVersion = objectField(artifact.parsed, 'containerVersion');
    const container = objectField(containerVersion, 'container');
    assignGtmIdentityString(identity, 'publicId', container?.publicId);
    if (!identity.workspaceId && identity.workspacePath) {
      const match = identity.workspacePath.match(/\/workspaces\/([^/]+)$/);
      if (match?.[1]) identity.workspaceId = match[1];
    }
  }
  return Object.keys(identity).length > 0 ? identity : undefined;
}

function assignGtmIdentityString(
  target: NonNullable<MarketingConsoleState['gtm']>,
  key: keyof NonNullable<MarketingConsoleState['gtm']>,
  value: unknown,
): void {
  if (!target[key] && typeof value === 'string' && value.length > 0) target[key] = value;
}

function objectField(
  record: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = record?.[key];
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function gtmArtifact(
  id: string,
  label: string,
  artifact: LocalJsonArtifact | undefined,
  status: MarketingConsoleStatus,
): MarketingConsoleArtifactLink | undefined {
  if (!artifact) return undefined;
  return {
    id,
    label,
    lane: 'gtm',
    path: artifact.filePath,
    status,
  };
}

function collectGtmReceiptEvents(
  cwd: string,
  appId: string,
  environment: string,
  now: Date,
): MarketingConsoleReceiptEvent[] {
  const root = path.join(cwd, '.unisane', 'gtm', appId, environment);
  const families: Array<{ directory: string; action: string }> = [
    { directory: 'receipts', action: 'gtm.apply' },
    { directory: 'previews', action: 'gtm.preview' },
    { directory: 'versions', action: 'gtm.version' },
    { directory: 'publishes', action: 'gtm.publish' },
    { directory: 'rollbacks', action: 'gtm.rollback' },
  ];
  return families
    .flatMap(({ directory, action }) =>
      collectJsonArtifacts(path.join(root, directory)).map((artifact) =>
        gtmReceiptEvent(artifact, action, now),
      ),
    )
    .sort((left, right) => (right.timestamp ?? '').localeCompare(left.timestamp ?? ''))
    .slice(0, 20);
}

function gtmReceiptEvent(
  artifact: LocalJsonArtifact,
  action: string,
  now: Date,
): MarketingConsoleReceiptEvent {
  const parsedStatus = typeof artifact.parsed?.status === 'string' ? artifact.parsed.status : '';
  const status =
    action === 'gtm.preview'
      ? statusForGtmPreview(artifact)
      : parsedStatus
        ? toConsoleStatus(parsedStatus)
        : 'ready';
  return {
    id: artifact.fileName,
    lane: 'gtm',
    action,
    status,
    timestamp: timestampFromGtmArtifact(artifact),
    path: artifact.filePath,
    message: messageForGtmReceipt(artifact, action, now),
  };
}

function messageForGtmReceipt(artifact: LocalJsonArtifact, action: string, now: Date): string {
  if (action === 'gtm.apply') {
    const operationCount = numberField(artifact.parsed, 'operationCount');
    return operationCount === 0
      ? 'GTM workspace apply receipt recorded with no remote changes.'
      : `Applied ${operationCount ?? 'recorded'} GTM workspace operation(s).`;
  }
  if (action === 'gtm.preview') {
    return statusForGtmPreview(artifact) === 'ready'
      ? 'GTM quick preview passed without compiler errors.'
      : 'GTM quick preview reported a compiler error.';
  }
  if (action === 'gtm.version') return 'GTM container version receipt is available.';
  if (action === 'gtm.publish') return 'GTM publish receipt is available.';
  if (action === 'gtm.rollback') return 'GTM rollback receipt is available.';
  return `${artifact.fileName} updated ${ageDays(now, artifact.mtimeMs)} days ago.`;
}

function deriveGtmRouteStatus(artifacts: MarketingConsoleArtifactLink[]): MarketingConsoleStatus {
  const latestPlan = artifacts.find((artifact) => artifact.id === 'gtm.plan.latest');
  const latestApply = artifacts.find((artifact) => artifact.id === 'gtm.apply.latest');
  const latestPreview = artifacts.find((artifact) => artifact.id === 'gtm.preview.latest');
  if (!latestPlan && !latestApply && !latestPreview) return 'warn';
  if (latestPreview?.status === 'blocked') return 'blocked';
  if (latestPlan?.status === 'ready' && latestPreview?.status === 'ready') return 'ready';
  return 'warn';
}

function statusForGtmPlan(artifact: LocalJsonArtifact | undefined): MarketingConsoleStatus {
  if (!artifact) return 'missing';
  const validation = artifact.parsed?.validation;
  if (typeof validation === 'object' && validation !== null) {
    const ok = (validation as { ok?: unknown }).ok;
    if (ok === false) return 'blocked';
  }
  const operationCount = numberField(artifact.parsed, 'operationCount');
  return operationCount === 0 ? 'ready' : 'warn';
}

function statusForGtmPreview(artifact: LocalJsonArtifact | undefined): MarketingConsoleStatus {
  if (!artifact) return 'missing';
  return artifact.parsed?.compilerError === true ? 'blocked' : 'ready';
}

function collectJsonArtifacts(directory: string): LocalJsonArtifact[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const filePath = path.join(directory, fileName);
      const stats = statSync(filePath);
      return {
        filePath,
        fileName,
        parsed: safeReadJson(filePath),
        mtimeMs: stats.mtimeMs,
        timestamp: stats.mtime.toISOString(),
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
}

function latestJsonArtifact(directory: string): LocalJsonArtifact | undefined {
  return collectJsonArtifacts(directory)[0];
}

function numberField(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function timestampFromGtmArtifact(artifact: LocalJsonArtifact): string {
  const fields = [
    'generatedAt',
    'appliedAt',
    'previewedAt',
    'versionedAt',
    'publishedAt',
    'rolledBackAt',
  ];
  for (const field of fields) {
    const value = artifact.parsed?.[field];
    if (typeof value === 'string') return value;
  }
  return artifact.timestamp;
}

function ageDays(now: Date, mtimeMs: number): number {
  return Math.max(0, Math.round((now.getTime() - mtimeMs) / 86_400_000));
}

function safeReadJson(filePath: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function readAdsAuditSummary(cwd: string): MarketingAdsAuditReport | undefined {
  const auditPath = path.join(cwd, '.unisane', 'marketing', 'ads', 'audit', 'latest.json');
  if (!existsSync(auditPath)) return undefined;
  const parsed = safeReadJson(auditPath);
  if (
    parsed?.kind !== 'unisane.marketing.ads.audit' ||
    !Array.isArray(parsed.sections) ||
    !Array.isArray(parsed.actions)
  ) {
    return undefined;
  }
  return parsed as MarketingAdsAuditReport;
}

function buildArtifactLinks(
  freshness: MarketingConsoleFreshnessCell[],
  receipts: MarketingConsoleReceiptEvent[],
  gtmArtifacts: MarketingConsoleArtifactLink[],
  latestPlanPath?: string,
  adsAudit?: MarketingAdsAuditReport,
): MarketingConsoleArtifactLink[] {
  const providerArtifacts = freshness
    .filter((cell) => cell.path)
    .map((cell) => ({
      id: `freshness.${cell.id}`,
      label: cell.label,
      lane: 'reports',
      path: cell.path ?? '',
      status: cell.status,
    }));
  const receiptArtifacts = receipts.map((receipt) => ({
    id: `receipt.${receipt.id}`,
    label: receipt.action,
    lane: receipt.lane,
    path: receipt.path,
    status: receipt.status,
  }));
  return [
    ...providerArtifacts,
    ...gtmArtifacts,
    ...receiptArtifacts,
    ...(latestPlanPath
      ? [
          {
            id: 'ads.latestPlan',
            label: 'Latest ads plan',
            lane: 'ads',
            path: latestPlanPath,
            status: 'ready' as const,
          },
        ]
      : []),
    ...(adsAudit
      ? [
          {
            id: 'ads.audit',
            label: 'Latest ads audit',
            lane: 'ads',
            path: path.join(adsAudit.cwd, '.unisane', 'marketing', 'ads', 'audit', 'latest.json'),
            status: adsAudit.ok ? ('ready' as const) : ('warn' as const),
          },
        ]
      : []),
  ];
}

function buildResearchArtifactLinks(
  files: Array<{ path: string; title: string }>,
): MarketingConsoleArtifactLink[] {
  return files.map((file, index) => ({
    id: `research.${index + 1}`,
    label: file.title,
    lane: 'research',
    path: file.path,
    status: 'ready' as const,
  }));
}

function readScheduleSummary(
  cwd: string,
  environment: string,
): MarketingConsoleState['schedule'] | undefined {
  const schedulePath = path.join(
    cwd,
    '.unisane',
    'marketing',
    environment,
    'schedules',
    'reporting-plan.json',
  );
  if (!existsSync(schedulePath)) return undefined;
  const parsed = safeReadJson(schedulePath);
  const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];
  const readyJobs = jobs.filter(
    (job) =>
      typeof job === 'object' && job !== null && (job as { status?: string }).status === 'ready',
  ).length;
  const blockedJobs = jobs.length - readyJobs;
  return {
    path: schedulePath,
    status: readyJobs > 0 && blockedJobs === 0 ? 'ready' : blockedJobs > 0 ? 'blocked' : 'missing',
    readyJobs,
    blockedJobs,
    jobCount: jobs.length,
    nextWorkflowStep:
      typeof parsed?.nextWorkflowStep === 'string' ? parsed.nextWorkflowStep : undefined,
  };
}

function inferDateWindow(
  statuses: MarketingProviderReportStatus[],
): MarketingConsoleState['dateWindow'] {
  const windows = statuses.map((status) => status.window).filter(Boolean);
  const latest = windows[0];
  if (!latest) return { label: 'No report window yet' };
  return {
    label: `${latest.startDate} to ${latest.endDate}`,
    startDate: latest.startDate,
    endDate: latest.endDate,
  };
}

function number(value: number | undefined): string {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function money(value: number | undefined, currencyCode?: string): string {
  if (value === undefined) return '-';
  const formatted = currencyCode
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: value >= 100 ? 0 : 2,
      }).format(value)
    : new Intl.NumberFormat('en-US', {
        maximumFractionDigits: value >= 100 ? 0 : 2,
      }).format(value);
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
}

function percent(value: number | undefined): string {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

function ratio(value: number | undefined): string {
  if (value === undefined) return '-';
  return `${value.toFixed(2)}x`;
}
