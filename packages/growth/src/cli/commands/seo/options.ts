export type SeoCliOptions = {
  cwd?: string;
  platform?: string;
  force?: boolean;
  dryRun?: boolean;
  json?: boolean;
};

export type SeoDoctorCliOptions = SeoCliOptions & {
  maxArtifactAgeHours?: string;
};

export type SeoAdsPlanCliOptions = SeoCliOptions & {
  opportunities?: string;
  out?: string;
  status?: string;
  maxKeywordsPerAdGroup?: string;
};

export type SeoKeywordExpandCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  pattern?: string;
};

export type SeoKeywordImportMetricsCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  country?: string;
  language?: string;
  provider?: string;
};

export type SeoKeywordFetchGoogleAdsCliOptions = SeoCliOptions & {
  candidates?: string;
  seedFile?: string;
  keywords?: string;
  pageUrl?: string;
  out?: string;
  country?: string;
  language?: string;
  languageId?: string;
  locationIds?: string;
  currencyCode?: string;
  clusterId?: string;
  campaignIntent?: string;
  requireTermGroups?: string;
  excludeTerms?: string;
  pageSize?: string;
  connection?: string;
  environment?: string;
};

export type SeoKeywordClusterCliOptions = SeoCliOptions & {
  candidates?: string;
  metrics?: string;
  out?: string;
  pageType?: string;
};

export type SeoCompetitorImportCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  market?: string;
  source?: string;
};

export type SeoCompetitorFetchCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  market?: string;
  timeoutMs?: string;
  userAgent?: string;
  maxPages?: string;
};

export type SeoCompetitorReportCliOptions = SeoCliOptions & {
  competitors?: string;
  out?: string;
};

export type SeoOpportunityPlanCliOptions = SeoCliOptions & {
  clusters?: string;
  out?: string;
  basePath?: string;
  ctaLabel?: string;
  ctaTarget?: string;
};

export type SeoOpportunityStatusCliOptions = SeoCliOptions & {
  opportunities?: string;
  out?: string;
  id?: string;
  slug?: string;
  routePath?: string;
  status?: string;
};

export type SeoOpportunityPrepareCliOptions = SeoCliOptions & {
  opportunities?: string;
  outDir?: string;
  id?: string;
  environment?: string;
  market?: string;
  maxAgeDays?: string;
  audience?: 'content-team' | 'coding-agent';
  notBeforeDays?: string;
  expiresDays?: string;
};

export type SeoPublicationRecordCliOptions = SeoCliOptions & {
  packet?: string;
  out?: string;
  publishedUrl?: string;
  publishedAt?: string;
  recordedBy?: string;
  confirmReviewed?: boolean;
  environment?: string;
};

export type SeoPublicationVerifyCliOptions = SeoCliOptions & {
  publication?: string;
  out?: string;
  environment?: string;
  maxAgeDays?: string;
};

export type SeoBriefGenerateCliOptions = SeoCliOptions & {
  opportunities?: string;
  outDir?: string;
  status?: 'all' | 'candidate' | 'approved' | 'rejected' | 'built';
};

export type SeoInternalLinksPlanCliOptions = SeoCliOptions & {
  opportunities?: string;
  out?: string;
  hubLabel?: string;
  maxRelated?: string;
  includeConversionLinks?: boolean;
};

export type SeoPerformanceImportCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  property?: string;
  startDate?: string;
  endDate?: string;
  dataKind?: 'live' | 'sample';
  freshnessHours?: string;
};

export type SeoPerformanceFetchSearchConsoleCliOptions = SeoCliOptions & {
  out?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string;
  rowLimit?: string;
  startRow?: string;
  maxRows?: string;
  searchType?: string;
  dataState?: string;
  connection?: string;
  environment?: string;
};

export type SeoPerformanceFetchGa4CliOptions = SeoCliOptions & {
  out?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string;
  metrics?: string;
  limit?: string;
  offset?: string;
  maxRows?: string;
  connection?: string;
  environment?: string;
};

export type SeoPerformanceReportCliOptions = SeoCliOptions & {
  searchConsole?: string;
  ga4?: string;
  opportunities?: string;
  out?: string;
};

export type SeoTrendImportCliOptions = SeoCliOptions & {
  input?: string;
  out?: string;
  provider?: 'google-trends' | 'manual-import' | 'csv-import';
  country?: string;
  language?: string;
  dateRange?: string;
};

export type SeoReportGenerateCliOptions = SeoCliOptions & {
  opportunities?: string;
  internalLinks?: string;
  out?: string;
};

export type SeoSiteCrawlCliOptions = SeoCliOptions & {
  site?: string;
  out?: string;
  previous?: string;
  incremental?: boolean;
  sitemaps?: boolean;
  userAgent?: string;
  maxPages?: string;
  maxDepth?: string;
  maxSitemaps?: string;
  maxDiscoveredUrls?: string;
  maxResponseBytes?: string;
  timeoutMs?: string;
  freshnessHours?: string;
};

export type SeoSiteRenderCliOptions = SeoCliOptions & {
  crawl?: string;
  out?: string;
  url?: string[];
  maxPages?: string;
  timeoutMs?: string;
  settleMs?: string;
  minStaticWordCount?: string;
  freshnessHours?: string;
  browserChannel?: string;
  browserExecutable?: string;
};

export type SeoSiteConfigureCliOptions = SeoCliOptions & {
  site?: string;
  market?: string[];
  confirmOwnership?: boolean;
  searchConsoleProperty?: string;
  ga4Property?: string;
  maxPages?: string;
  maxDepth?: string;
  maxSitemaps?: string;
  maxDiscoveredUrls?: string;
  maxResponseBytes?: string;
  timeoutMs?: string;
  freshnessHours?: string;
  sitemaps?: boolean;
};

export type SeoPagesInventoryCliOptions = SeoCliOptions & {
  crawl?: string;
  render?: string;
  searchConsole?: string;
  ga4?: string;
  out?: string;
};
