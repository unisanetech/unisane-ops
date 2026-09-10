import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { MarketingProviderReportType } from '../schema/report.js';

export type FetchLike = typeof fetch;

export type ProviderApiPullOptions = {
  accountId?: string;
  connection?: string;
  environment?: string;
  startDate: string;
  endDate: string;
  timeZone?: string;
  apiVersion?: string;
  maxPages?: number;
  pageSize?: number;
  reportType?: string;
};

export type ProviderApiPullContext = {
  config: MarketingExecutionContext;
  options: ProviderApiPullOptions;
  credentials?: {
    accountId?: string;
    accessToken?: string;
    developerToken?: string;
    loginCustomerId?: string;
  };
  env: Record<string, string | undefined>;
  fetch: FetchLike;
};

export type ProviderApiPullInputFormat = 'google-ads' | 'meta-ads' | 'ga4' | 'search-console';

export type ProviderApiPullPayload<InputFormat extends ProviderApiPullInputFormat> = {
  value: unknown;
  accountId: string;
  inputFormat: InputFormat;
  reportType?: MarketingProviderReportType;
};

export type MarketingProviderApiPullDriver = (
  input: ProviderApiPullContext,
) => Promise<ProviderApiPullPayload<ProviderApiPullInputFormat>>;
