import type {
  MarketingAdsAuditReport,
  MarketingAdsStatusReport,
  MarketingEvidenceStatusReport,
  MarketingResearchStatusSummary,
  MarketingStatusReport,
} from '@unisane/growth/marketing';
import type { GrowthCapability } from '../config.js';
import type {
  MarketingProviderReportType,
  MarketingReportMetrics,
  MarketingReportProvider,
  MarketingReportSource,
} from '@unisane/growth/marketing';

export type MarketingConsoleStatus = 'ready' | 'warn' | 'blocked' | 'missing';

export type MarketingConsoleConnectionState =
  | 'current'
  | 'not-connected'
  | 'syncing'
  | 'delayed'
  | 'needs-resource'
  | 'partial-permission'
  | 'expired-access'
  | 'failed';

export type MarketingConsoleConnectionAction = {
  id: string;
  label: string;
  description: string;
  command: string;
};

export type MarketingConsoleConnectionService = {
  id: string;
  label: string;
  purpose: string;
  state: MarketingConsoleConnectionState;
  statusLabel: string;
  accessLabel: string;
  accessLevelLabel: string;
  accessVerifiedAt?: string;
  accessExpiresAt?: string;
  resource?: {
    type: string;
    label: string;
    identifier: string;
    selectedAt: string;
  };
  dataLabel: string;
  dataUpdatedAt?: string;
  dataCoverageLabel: string;
  lastCheckedAt?: string;
  issue?: string;
  primaryAction?: MarketingConsoleConnectionAction;
  accessAction?: MarketingConsoleConnectionAction;
  resourceAction?: MarketingConsoleConnectionAction;
  syncAction?: MarketingConsoleConnectionAction;
};

export type MarketingConsoleConnection = {
  provider: string;
  label: string;
  available: boolean;
  required: boolean;
  connected: boolean;
  state: MarketingConsoleConnectionState;
  statusLabel: string;
  summary: string;
  connectionId?: string;
  identityLabel?: string;
  lastCheckedAt?: string;
  services: MarketingConsoleConnectionService[];
  primaryAction?: MarketingConsoleConnectionAction;
  disconnect: {
    title: string;
    command?: string;
    consequences: string[];
    historicalDataRemains: boolean;
    providerResourcesUnchanged: boolean;
  };
};

export type MarketingConsoleMetric = {
  id: string;
  label: string;
  value: string;
  numericValue?: number;
  currencyCode?: string;
  definition: string;
  sourceLabel: string;
  freshnessLabel: string;
  comparisonLabel: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleTrendPoint = {
  label: string;
  value: number;
  currencyCode?: string;
};

export type MarketingConsolePriorityLane =
  | 'overview'
  | 'seo'
  | 'advertising'
  | 'analytics'
  | 'experiments';

export type MarketingConsolePriority = {
  id: string;
  lane: MarketingConsolePriorityLane;
  title: string;
  expectedOutcome: string;
  reason: string;
  evidence: string;
  confidenceLabel: string;
  freshnessLabel: string;
  effortLabel: string;
  priorityLabel: string;
  riskLabel: string;
  action: {
    label: string;
    path: string;
  };
};

export type MarketingConsoleOverview = {
  status: MarketingConsoleStatus;
  headline: string;
  detail: string;
  metricIds: string[];
  recentOutcomes: Array<{
    id: string;
    title: string;
    summary: string;
    status: MarketingConsoleStatus;
    timestamp?: string;
  }>;
  funnel?: {
    title: string;
    summary: string;
    sourceLabel: string;
    stages: Array<{
      id: string;
      label: string;
      value: number;
      valueLabel: string;
    }>;
  };
  capabilitySummaries: Array<{
    id: 'seo' | 'advertising' | 'analytics' | 'experiments';
    label: string;
    status: MarketingConsoleStatus;
    statusLabel: string;
    summary: string;
    path: string;
  }>;
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

export type MarketingConsoleSourceSummary = {
  provider?: MarketingReportProvider;
  sourceKind?: MarketingReportSource;
  status: MarketingConsoleStatus;
  label: string;
  freshnessLabel: string;
  detail: string;
  available: boolean;
};

export type MarketingConsoleAdvertisingCampaign = {
  id: string;
  provider: 'googleAds' | 'metaAds';
  providerLabel: string;
  name: string;
  deliveryStatus?: string;
  primaryStatus?: string;
  primaryStatusReasons: string[];
  servingStatus?: string;
  channelType?: string;
  dailyBudget?: number;
  budgetStatus?: string;
  sharedBudget?: boolean;
  biddingStrategy?: string;
  biddingStrategyStatus?: string;
  startDate?: string;
  endDate?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  currencyCode?: string;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roas?: number;
};

export type MarketingConsoleAdvertisingConversion = {
  id: string;
  provider: 'googleAds' | 'metaAds';
  providerLabel: string;
  name: string;
  conversions?: number;
  conversionValue?: number;
  currencyCode?: string;
  measurementLabel: string;
};

export type MarketingConsoleRecommendation = {
  id: string;
  lane: MarketingConsolePriorityLane;
  provider?: MarketingReportProvider;
  actionType:
    | 'fix_tracking'
    | 'refresh_provider_data'
    | 'investigate_conversion_mismatch'
    | 'pause_or_reduce_spend'
    | 'decrease_budget'
    | 'run_experiment'
    | 'hold_scaling';
  severity: 'info' | 'warn' | 'high' | 'critical';
  title: string;
  expectedOutcome: string;
  rationale: string;
  evidenceLabel: string;
  confidenceLabel: string;
  freshnessLabel: string;
  effortLabel: string;
  riskLabel: string;
  approvalLabel: string;
  decision: 'pending' | 'accepted' | 'dismissed';
  decisionLabel: string;
  primaryAction: {
    label: string;
    path: string;
  };
  acceptAction?: MarketingConsoleConnectionAction;
  dismissAction?: MarketingConsoleConnectionAction;
  technical: {
    owner: string;
    source: string;
    alertIds: string[];
    experimentIds: string[];
  };
};

export type MarketingConsoleRecommendations = {
  status: MarketingConsoleStatus;
  headline: string;
  summary: string;
  generatedAt?: string;
  items: MarketingConsoleRecommendation[];
};

export type MarketingConsoleAdvertisingChange = {
  id: string;
  provider?: 'googleAds' | 'metaAds';
  providerLabel?: string;
  title: string;
  summary: string;
  status: MarketingConsoleStatus;
  timestamp?: string;
};

export type MarketingConsoleAdvertisingEntity = {
  id: string;
  provider: 'metaAds';
  providerLabel: 'Meta Ads';
  level: 'adSet' | 'ad' | 'creative';
  name: string;
  campaignName?: string;
  adSetName?: string;
  deliveryStatus?: string;
  assetType?: string;
  headline?: string;
  body?: string;
  destinationUrl?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  currencyCode?: string;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roas?: number;
};

export type MarketingConsoleAdvertisingView = {
  scope: 'all' | 'googleAds' | 'metaAds';
  label: string;
  sources: MarketingConsoleSourceSummary[];
  headline: string;
  detail: string;
  metrics: MarketingConsoleMetric[];
  campaigns: MarketingConsoleAdvertisingCampaign[];
  conversions: MarketingConsoleAdvertisingConversion[];
  changeHistory: MarketingConsoleAdvertisingChange[];
  adSets: MarketingConsoleAdvertisingEntity[];
  ads: MarketingConsoleAdvertisingEntity[];
  creatives: MarketingConsoleAdvertisingEntity[];
};

export type MarketingConsoleAdvertising = {
  combined: MarketingConsoleAdvertisingView;
  providers: Array<
    MarketingConsoleAdvertisingView & {
      scope: 'googleAds' | 'metaAds';
    }
  >;
  auditSections: Array<{
    id: string;
    label: string;
    status: MarketingConsoleStatus;
    summary: string;
  }>;
};

export type MarketingConsoleAnalyticsRow = {
  id: string;
  label: string;
  sessions?: number;
  visitors?: number;
  conversions?: number;
  revenue?: number;
  currencyCode?: string;
};

export type MarketingConsoleTrackingCheck = {
  id: string;
  label: string;
  status: MarketingConsoleStatus;
  detail: string;
};

export type MarketingConsoleTrackingEmitter = {
  id: string;
  label: string;
  status: MarketingConsoleStatus;
  detail: string;
};

export type MarketingConsoleTrackingFinding = {
  id: string;
  category: string;
  status: MarketingConsoleStatus;
  title: string;
  detail: string;
};

export type MarketingConsoleTrackingAudit = {
  mode: 'audit-only';
  generatedAt: string;
  status: MarketingConsoleStatus;
  evidenceLabel: string;
  expectedEventCount: number;
  observedEventCount: number;
  expectedConversionCount: number;
  observedConversionCount: number;
  emitters: MarketingConsoleTrackingEmitter[];
  findings: MarketingConsoleTrackingFinding[];
};

export type MarketingConsoleTagManager = {
  status: MarketingConsoleStatus;
  headline: string;
  detail: string;
  resourceCount?: number;
  pendingChangeCount?: number;
  lastSyncedAt?: string;
  lastPreviewAt?: string;
  lastPublishedAt?: string;
  checks: MarketingConsoleTrackingCheck[];
  actions: MarketingConsoleConnectionAction[];
  technical: {
    accountId?: string;
    containerId?: string;
    workspaceId?: string;
    publicId?: string;
    containerPath?: string;
    workspacePath?: string;
    snapshotPath?: string;
    planPath?: string;
    previewPath?: string;
    publishPath?: string;
  };
};

export type MarketingConsoleAnalytics = {
  source: MarketingConsoleSourceSummary;
  headline: string;
  detail: string;
  metrics: MarketingConsoleMetric[];
  traffic: MarketingConsoleAnalyticsRow[];
  visitors: MarketingConsoleAnalyticsRow[];
  conversions: MarketingConsoleAnalyticsRow[];
  trackingHealth: {
    status: MarketingConsoleStatus;
    headline: string;
    detail: string;
    checks: MarketingConsoleTrackingCheck[];
    audit: MarketingConsoleTrackingAudit;
  };
};

export type MarketingConsoleExperimentIdea = {
  id: string;
  title: string;
  target: string;
  priority: string;
  rationale: string;
  expectedImpact: string;
  kind: 'metadata';
};

export type MarketingConsoleExperiments = {
  status: MarketingConsoleStatus;
  headline: string;
  detail: string;
  running: [];
  results: [];
  ideas: MarketingConsoleExperimentIdea[];
};

export type MarketingConsoleSeoMetric = {
  id: string;
  label: string;
  value: string;
  definition: string;
  sourceLabel: string;
  freshnessLabel: string;
  comparisonLabel: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleSeoOpportunity = {
  id: string;
  kind: 'high-impact' | 'quick-win' | 'problem';
  title: string;
  expectedOutcome: string;
  reason: string;
  affectedLabel: string;
  impactLabel: string;
  confidenceLabel: string;
  effortLabel: string;
  freshnessLabel: string;
  evidence: string;
  action: {
    label: string;
    path: string;
  };
};

export type MarketingConsoleSeoPage = {
  id: string;
  title: string;
  path: string;
  fullUrl: string;
  clicks: number;
  searchViews: number;
  averagePosition?: number;
  clickThroughRate?: number;
  changeLabel: string;
  status: 'Review' | 'Not indexed';
  statusDetail: string;
  indexingWarning?: string;
  topQueries: string[];
};

export type MarketingConsoleSeoQuery = {
  id: string;
  query: string;
  clicks: number;
  searchViews: number;
  averagePosition?: number;
  clickThroughRate?: number;
  changeLabel: string;
  bestPage?: {
    title: string;
    path: string;
  };
};

export type MarketingConsoleSeoHealthIssue = {
  id: string;
  title: string;
  impact: string;
  affectedLabel: string;
  confidenceLabel: string;
  firstSeenLabel: string;
  lastCheckedLabel: string;
  actionLabel: string;
  path: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleSeoResearchIdea = {
  id: string;
  topic: string;
  estimatedMonthlySearches?: number;
  demandLabel: string;
  interestLabel: string;
  visibilityLabel: string;
  difficultyLabel: 'Low' | 'Medium' | 'High' | 'Not available';
  intentLabel: 'Learn' | 'Compare' | 'Buy';
  currentPosition?: number;
  country?: string;
  language?: string;
};

export type MarketingConsoleSeo = {
  sourceLabel: string;
  freshnessLabel: string;
  comparisonAvailable: boolean;
  comparisonLabel: string;
  overview: {
    status: MarketingConsoleStatus;
    headline: string;
    detail: string;
    metrics: MarketingConsoleSeoMetric[];
    opportunities: MarketingConsoleSeoOpportunity[];
    pagePreview: MarketingConsoleSeoPage[];
  };
  opportunities: MarketingConsoleSeoOpportunity[];
  pages: MarketingConsoleSeoPage[];
  queries: MarketingConsoleSeoQuery[];
  siteHealth: {
    available: boolean;
    status: MarketingConsoleStatus;
    headline: string;
    detail: string;
    groups: Array<{
      id: 'indexing' | 'crawling' | 'sitemaps' | 'structured-data' | 'links';
      label: string;
      issues: MarketingConsoleSeoHealthIssue[];
    }>;
  };
  research: {
    available: boolean;
    contextLabel: string;
    demandExplanation: string;
    keywordIdeas: MarketingConsoleSeoResearchIdea[];
    questions: Array<{
      id: string;
      question: string;
      demandLabel: string;
      intentLabel: string;
      visibilityLabel: string;
    }>;
    contentGaps: Array<{
      id: string;
      title: string;
      reason: string;
      actionLabel: string;
    }>;
  };
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
  clusterId: string;
  clusterLabel: string;
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
  pulledAt?: string;
  ageDays?: number;
  recordCount?: number;
  currencyCode?: string;
  sourceKind?: MarketingReportSource;
};

export type MarketingConsoleReceiptEvent = {
  id: string;
  lane: string;
  action: string;
  status: MarketingConsoleStatus;
  timestamp?: string;
  path: string;
  message: string;
  actorLabel?: string;
  approvalLabel?: string;
  providerLabel?: string;
  resourceLabel?: string;
  previousValue?: string;
  newValue?: string;
};

export type MarketingConsoleActivityCategory = 'changes' | 'syncs' | 'errors' | 'approvals';

export type MarketingConsoleActivityItem = {
  id: string;
  category: MarketingConsoleActivityCategory;
  title: string;
  summary: string;
  status: MarketingConsoleStatus;
  providerLabel: string;
  resourceLabel: string;
  actorLabel: string;
  approvalLabel: string;
  occurredAt?: string;
  previousValue?: string;
  newValue?: string;
  technical: {
    action: string;
    sourcePath: string;
    rawTimestamp?: string;
  };
};

export type MarketingConsoleActivity = {
  status: MarketingConsoleStatus;
  headline: string;
  summary: string;
  items: MarketingConsoleActivityItem[];
};

export type MarketingConsoleAutomation = {
  id: string;
  name: string;
  purpose: string;
  providerLabel: string;
  status: MarketingConsoleStatus;
  statusLabel: string;
  frequencyLabel: string;
  timezoneLabel: string;
  lastSuccessAt?: string;
  lastSuccessLabel: string;
  nextRunLabel: string;
  issue?: string;
  runNow: MarketingConsoleConnectionAction;
  edit: MarketingConsoleConnectionAction;
  technical: {
    reportType: MarketingProviderReportType;
    schedulePath?: string;
  };
};

export type MarketingConsoleAutomations = {
  status: MarketingConsoleStatus;
  headline: string;
  summary: string;
  sharedIssue?: string;
  items: MarketingConsoleAutomation[];
};

export type MarketingConsoleArtifactLink = {
  id: string;
  label: string;
  lane: string;
  path: string;
  status: MarketingConsoleStatus;
};

export type MarketingConsoleState = {
  kind: 'unisane.growth.console-state';
  version: 1;
  generatedAt: string;
  workspaceRoot: string;
  platformId: string;
  appId: string;
  environment: string;
  capabilities: GrowthCapability[];
  connections: MarketingConsoleConnection[];
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
  metrics: MarketingConsoleMetric[];
  overview: MarketingConsoleOverview;
  priorities: MarketingConsolePriority[];
  trends: {
    spend: MarketingConsoleTrendPoint[];
    conversions: MarketingConsoleTrendPoint[];
    cpa: MarketingConsoleTrendPoint[];
  };
  comparisons: {
    channels: MarketingConsoleComparisonRow[];
  };
  advertising: MarketingConsoleAdvertising;
  recommendations: MarketingConsoleRecommendations;
  analytics: MarketingConsoleAnalytics;
  experiments: MarketingConsoleExperiments;
  seo: MarketingConsoleSeo;
  keywordResearch: MarketingConsoleKeywordResearchSummary;
  competitorResearch: MarketingConsoleCompetitorResearchSummary;
  faqResearch: MarketingConsoleFaqResearchSummary;
  seoIntelligence: MarketingConsoleSeoIntelligenceSummary;
  freshness: MarketingConsoleFreshnessCell[];
  activity: MarketingConsoleActivity;
  automations: MarketingConsoleAutomations;
  tagManager: MarketingConsoleTagManager;
  artifacts: MarketingConsoleArtifactLink[];
  reports: {
    proof: MarketingEvidenceStatusReport;
    marketingStatus: MarketingStatusReport;
    analyticsStatus: MarketingStatusReport;
    adsStatus: MarketingAdsStatusReport;
    adsAudit?: MarketingAdsAuditReport;
    researchStatus: MarketingResearchStatusSummary;
  };
};
