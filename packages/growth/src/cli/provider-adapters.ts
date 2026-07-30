import type {
  MarketingAdsAssetProviderUploader,
  MarketingAdsLiveProviderExecutor,
  MarketingProviderApiPullDriver,
} from '../contracts.js';
import {
  executeGrowthProviderCommand,
  type GrowthProviderCommandOperation,
} from './provider-runtime.js';

function reportDriver(operation: GrowthProviderCommandOperation): MarketingProviderApiPullDriver {
  return (input) => executeGrowthProviderCommand(operation, input);
}

export const pullGoogleAdsReport = reportDriver('google.marketing.pull-report');
export const pullGa4Report = reportDriver('google.marketing.pull-ga4');
export const pullSearchConsoleReport = reportDriver('google.marketing.pull-search-console');
export const pullMetaAdsReport = reportDriver('meta.marketing.pull-report');

export const executeGoogleAdsLiveOperation: MarketingAdsLiveProviderExecutor = (input) =>
  executeGrowthProviderCommand('google.marketing.execute-live', input);

export const executeMetaAdsLiveOperation: MarketingAdsLiveProviderExecutor = (input) =>
  executeGrowthProviderCommand('meta.marketing.execute-live', input);

export const uploadMetaAdsAsset: MarketingAdsAssetProviderUploader = (input) =>
  executeGrowthProviderCommand('meta.marketing.upload-asset', input);

export type SearchConsoleDimension =
  | 'query'
  | 'page'
  | 'country'
  | 'device'
  | 'date'
  | 'searchAppearance';

export interface FetchGa4PerformanceFileResult {
  output: string;
  platformId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  recordCount: number;
  pageCount: number;
  dryRun: boolean;
}

export interface FetchSearchConsolePerformanceFileResult {
  output: string;
  platformId: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: SearchConsoleDimension[];
  startRow?: number;
  maxRows?: number;
  recordCount: number;
  pageCount: number;
  queryCount: number;
  dryRun: boolean;
}

export interface FetchGoogleAdsKeywordMetricsFileResult {
  output: string;
  candidates?: string;
  seedFile?: string;
  platformId: string;
  country: string;
  language: string;
  locationIds: string[];
  languageId: string;
  currencyCode?: string;
  runId?: string;
  metricCount: number;
  droppedMetricCount: number;
  requireTermGroups: string[][];
  excludeTerms: string[];
  dryRun: boolean;
}

export function fetchGa4PerformanceFile(input: unknown): Promise<FetchGa4PerformanceFileResult> {
  return executeGrowthProviderCommand('google.seo.fetch-ga4', input);
}

export function fetchSearchConsolePerformanceFile(
  input: unknown,
): Promise<FetchSearchConsolePerformanceFileResult> {
  return executeGrowthProviderCommand('google.seo.fetch-search-console', input);
}

export function fetchGoogleAdsKeywordMetricsFile(
  input: unknown,
): Promise<FetchGoogleAdsKeywordMetricsFileResult> {
  return executeGrowthProviderCommand('google.seo.fetch-keyword-metrics', input);
}
