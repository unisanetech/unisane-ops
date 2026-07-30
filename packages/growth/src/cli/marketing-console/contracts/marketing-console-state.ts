import type {
  MarketingAdsStatusReport,
  MarketingAdsAuditReport,
  MarketingEvidenceStatusReport,
  MarketingResearchStatusSummary,
  MarketingStatusReport,
} from '@unisane/growth/marketing';
import type {
  MarketingProviderReportType,
  MarketingReportMetrics,
  MarketingReportProvider,
} from '@unisane/growth/marketing';

export type MarketingConsoleStatus = 'ready' | 'warn' | 'blocked' | 'missing';

export type MarketingConsoleSetupStage = {
  id: 'local' | 'deployedDomain' | 'providerAuth' | 'providerDiscovery' | 'proofReady';
  status: 'pass' | 'current' | 'pending' | 'blocked';
  title: string;
  message: string;
  checks: Array<{ id: string; status: 'pass' | 'warn' | 'error'; message: string }>;
};

export type MarketingConsoleSetupProjection = {
  kind: 'unisane.marketing.console-setup-projection';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  cwd: string;
  configPath: string;
  appId: string;
  platformId: string;
  currentStage: MarketingConsoleSetupStage['id'];
  stages: MarketingConsoleSetupStage[];
  nextActions: Array<{ id: string; command?: string; message: string }>;
};

export type MarketingConsoleMetric = {
  id: string;
  label: string;
  value: string;
  numericValue?: number;
  currencyCode?: string;
  helper?: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleTrendPoint = {
  label: string;
  value: number;
  currencyCode?: string;
};

export type MarketingConsoleComparisonRow = {
  id: string;
  label: string;
  provider?: MarketingReportProvider;
  reportType?: MarketingProviderReportType;
  currencyCode?: string;
  metrics: MarketingReportMetrics;
  derived: {
    ctr?: number;
    cpc?: number;
    cpa?: number;
    roas?: number;
  };
};

export type MarketingConsoleSeoRow = {
  id: string;
  query: string;
  pageUrl?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export type MarketingConsoleKeywordMetricRow = {
  term: string;
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
};

export type MarketingConsoleKeywordMarketSummary = {
  market: string;
  country?: string;
  language?: string;
  currencyCode?: string;
  metricCount: number;
  totalKnownVolume: number;
  averageCompetitionIndex?: number;
  topKeywords: MarketingConsoleKeywordMetricRow[];
};

export type MarketingConsoleKeywordMatrixRow = {
  term: string;
  normalizedTerm: string;
  marketCount: number;
  totalKnownVolume: number;
  bestMarket?: string;
  bestMarketVolume?: number;
  markets: Record<
    string,
    {
      avgMonthlySearches?: number;
      competition?: string;
      competitionIndex?: number;
      lowTopOfPageBidMicros?: number;
      highTopOfPageBidMicros?: number;
      currencyCode?: string;
    }
  >;
};

export type MarketingConsoleKeywordClusterSummary = {
  id: string;
  label: string;
  intent: string;
  recommendedUse: string;
  metricCount: number;
  totalKnownVolume: number;
  averageCompetitionIndex?: number;
  bestMarket?: string;
  bestMarketVolume?: number;
  marketVolumes: Record<string, number>;
  topKeywords: MarketingConsoleKeywordMatrixRow[];
};

export type MarketingConsoleKeywordResearchSummary = {
  status: MarketingConsoleStatus;
  path?: string;
  provider?: string;
  country?: string;
  language?: string;
  currencyCode?: string;
  sourceCount?: number;
  runCount?: number;
  metricCount: number;
  totalKnownVolume: number;
  averageCompetitionIndex?: number;
  fetchedAt?: string;
  keywords: MarketingConsoleKeywordMetricRow[];
  matrix: MarketingConsoleKeywordMatrixRow[];
  clusters: MarketingConsoleKeywordClusterSummary[];
  markets: MarketingConsoleKeywordMarketSummary[];
  topKeywords: MarketingConsoleKeywordMetricRow[];
};

export type MarketingConsoleCompetitorPageRow = {
  id: string;
  competitor: string;
  domain: string;
  url: string;
  keyword?: string;
  position?: number;
  pageType?: string;
  market?: string;
  source?: string;
  patterns: string[];
  strengths: string[];
  gaps: string[];
  opportunities: string[];
  notes?: string;
};

export type MarketingConsoleCompetitorDomainSummary = {
  domain: string;
  pageCount: number;
  keywordCount: number;
  bestPosition?: number;
  pageTypes: string[];
  topPatterns: string[];
  opportunities: string[];
};

export type MarketingConsoleCompetitorResearchSummary = {
  status: MarketingConsoleStatus;
  path?: string;
  sourceCount: number;
  pageCount: number;
  domainCount: number;
  keywordCount: number;
  domains: MarketingConsoleCompetitorDomainSummary[];
  pages: MarketingConsoleCompetitorPageRow[];
  opportunities: string[];
};

export type MarketingConsoleFaqQuestionRow = {
  id: string;
  question: string;
  answerIntent: string;
  pageRole: string;
  routePath: string;
  clusterId?: string;
  priority: string;
  status: string;
  sourceTerms: string[];
  supportingKeywords: string[];
  avgMonthlySearches?: number;
  marketCount: number;
  bestMarket?: string;
  evidenceSourceCount: number;
  evidenceSources: string[];
  proofStatus: MarketingConsoleStatus;
  evidence: string[];
  recommendedAnswer: string;
  internalLinks: Array<{
    label: string;
    path: string;
  }>;
};

export type MarketingConsoleFaqPageSummary = {
  routePath: string;
  pageRole?: string;
  questionCount: number;
  approvedCount: number;
  needsProofCount: number;
  marketCount: number;
  evidenceSourceCount: number;
  totalKnownVolume: number;
  topQuestion?: string;
  clusters: string[];
};

export type MarketingConsoleFaqQualityWarning = {
  severity: MarketingConsoleStatus;
  title: string;
  message: string;
  routePath?: string;
};

export type MarketingConsoleFaqResearchSummary = {
  status: MarketingConsoleStatus;
  path?: string;
  sourceCount: number;
  questionCount: number;
  pageCount: number;
  approvedCount: number;
  highPriorityCount: number;
  totalKnownVolume: number;
  qualityScore: number;
  evidenceSourceCount: number;
  marketCount: number;
  needsProofCount: number;
  duplicateQuestionCount: number;
  routeConflictCount: number;
  warnings: MarketingConsoleFaqQualityWarning[];
  pages: MarketingConsoleFaqPageSummary[];
  questions: MarketingConsoleFaqQuestionRow[];
  topQuestions: MarketingConsoleFaqQuestionRow[];
};

export type MarketingConsoleSerpSnapshotRow = {
  id: string;
  keyword: string;
  country: string;
  language: string;
  intent: string;
  routePath?: string;
  capturedAt?: string;
  topDomains: string[];
  competitorCount: number;
  resultCount: number;
  peopleAlsoAsk: string[];
  opportunities: string[];
};

export type MarketingConsoleMetadataExperimentRow = {
  id: string;
  routePath: string;
  status: string;
  priority: string;
  primaryKeyword: string;
  currentTitle?: string;
  proposedTitle: string;
  currentDescription?: string;
  proposedDescription: string;
  rationale: string;
  expectedImpact: string;
};

export type MarketingConsolePageAuditRow = {
  id: string;
  routePath: string;
  status: MarketingConsoleStatus;
  score: number;
  primaryKeyword?: string;
  intent?: string;
  missing: string[];
  warnings: string[];
  recommendations: string[];
};

export type MarketingConsoleSeoIntelligenceSummary = {
  status: MarketingConsoleStatus;
  score: number;
  serp: {
    status: MarketingConsoleStatus;
    sourceCount: number;
    snapshotCount: number;
    countryCount: number;
    keywordCount: number;
    snapshots: MarketingConsoleSerpSnapshotRow[];
  };
  metadata: {
    status: MarketingConsoleStatus;
    sourceCount: number;
    experimentCount: number;
    readyCount: number;
    experiments: MarketingConsoleMetadataExperimentRow[];
  };
  pageAudits: {
    status: MarketingConsoleStatus;
    sourceCount: number;
    pageCount: number;
    averageScore: number;
    blockedCount: number;
    warningCount: number;
    audits: MarketingConsolePageAuditRow[];
  };
  warnings: MarketingConsoleFaqQualityWarning[];
};

export type MarketingConsoleFreshnessCell = {
  id: string;
  provider: MarketingReportProvider | 'confirmedConversions' | 'strategyMap';
  reportType?: MarketingProviderReportType;
  status: MarketingConsoleStatus;
  label: string;
  message: string;
  path?: string;
  ageDays?: number;
  recordCount?: number;
  currencyCode?: string;
};

export type MarketingConsoleActionItem = {
  id: string;
  title: string;
  message: string;
  lane: string;
  severity: 'info' | 'warn' | 'critical';
  command?: string;
};

export type MarketingConsoleReceiptEvent = {
  id: string;
  lane: string;
  action: string;
  status: MarketingConsoleStatus;
  timestamp?: string;
  path: string;
  message: string;
};

export type MarketingConsoleArtifactLink = {
  id: string;
  label: string;
  lane: string;
  path: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleRouteSummary = {
  id:
    | 'overview'
    | 'setup'
    | 'proof'
    | 'performance'
    | 'ads'
    | 'seo'
    | 'research'
    | 'analytics'
    | 'gtm'
    | 'recommendations'
    | 'receipts'
    | 'schedule';
  label: string;
  status: MarketingConsoleStatus;
  summary: string;
};

export type MarketingConsoleState = {
  kind: 'unisane.marketing.console-state';
  version: 1;
  generatedAt: string;
  workspaceRoot: string;
  outputDirectory: string;
  platformId: string;
  appId: string;
  environment: string;
  dateWindow: {
    label: string;
    startDate?: string;
    endDate?: string;
  };
  readiness: {
    status: MarketingConsoleStatus;
    score: number;
    label: string;
    nextWorkflowStep: string;
  };
  routes: MarketingConsoleRouteSummary[];
  metrics: MarketingConsoleMetric[];
  trends: {
    spend: MarketingConsoleTrendPoint[];
    conversions: MarketingConsoleTrendPoint[];
    cpa: MarketingConsoleTrendPoint[];
  };
  comparisons: {
    channels: MarketingConsoleComparisonRow[];
  };
  seo: {
    rows: MarketingConsoleSeoRow[];
  };
  keywordResearch: MarketingConsoleKeywordResearchSummary;
  competitorResearch: MarketingConsoleCompetitorResearchSummary;
  faqResearch: MarketingConsoleFaqResearchSummary;
  seoIntelligence: MarketingConsoleSeoIntelligenceSummary;
  freshness: MarketingConsoleFreshnessCell[];
  actions: MarketingConsoleActionItem[];
  receipts: MarketingConsoleReceiptEvent[];
  artifacts: MarketingConsoleArtifactLink[];
  reports: {
    setup: MarketingConsoleSetupProjection;
    proof: MarketingEvidenceStatusReport;
    marketingStatus: MarketingStatusReport;
    analyticsStatus: MarketingStatusReport;
    adsStatus: MarketingAdsStatusReport;
    adsAudit?: MarketingAdsAuditReport;
    researchStatus: MarketingResearchStatusSummary;
  };
  schedule?: {
    path: string;
    status: MarketingConsoleStatus;
    readyJobs: number;
    blockedJobs: number;
    jobCount: number;
    nextWorkflowStep?: string;
  };
  gtm?: {
    accountId?: string;
    containerId?: string;
    workspaceId?: string;
    publicId?: string;
    containerPath?: string;
    workspacePath?: string;
  };
};
