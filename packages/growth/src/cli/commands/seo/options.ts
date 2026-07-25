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
  authProfile?: string;
  accessTokenEnv?: string;
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
  dateRange?: string;
};

export type SeoPerformanceFetchSearchConsoleCliOptions = SeoCliOptions & {
  out?: string;
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string;
  rowLimit?: string;
  startRow?: string;
  maxRows?: string;
  searchType?: string;
  dataState?: string;
  authProfile?: string;
  accessTokenEnv?: string;
};

export type SeoPerformanceFetchGa4CliOptions = SeoCliOptions & {
  out?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string;
  metrics?: string;
  limit?: string;
  offset?: string;
  maxRows?: string;
  authProfile?: string;
  accessTokenEnv?: string;
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
