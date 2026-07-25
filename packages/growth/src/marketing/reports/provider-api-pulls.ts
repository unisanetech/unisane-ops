import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  marketingProviderReportArtifactSchema,
  marketingProviderReportTypeSchema,
  marketingReportProviderSchema,
} from '../schema/report.js';
import { parseMarketingReportWindow } from './date-window.js';
import { normalizeMarketingProviderReportInput } from './normalize-provider-input.js';
import {
  cacheMarketingProviderReportArtifact,
  type MarketingProviderCacheWriteResult,
} from './provider-cache.js';
import type {
  FetchLike,
  MarketingProviderApiPullDriver,
  ProviderApiPullOptions,
} from '../providers/api-pull-types.js';

export type MarketingProviderApiPullOptions = ProviderApiPullOptions & {
  cwd?: string;
  provider: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  driver?: MarketingProviderApiPullDriver;
  now?: Date;
};

export type MarketingProviderApiPullResult = MarketingProviderCacheWriteResult;

export async function writeMarketingProviderApiReportPull(
  config: MarketingConfig,
  options: MarketingProviderApiPullOptions,
): Promise<MarketingProviderApiPullResult> {
  const provider = marketingReportProviderSchema.parse(options.provider);
  const reportType = options.reportType
    ? marketingProviderReportTypeSchema.parse(options.reportType)
    : undefined;
  const window = parseMarketingReportWindow(options);
  const env = options.env ?? process.env;
  const fetcher = options.fetch ?? fetch;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const context = {
    config,
    options: {
      ...options,
      ...window,
      reportType,
    },
    env,
    fetch: fetcher,
  };
  const driver = options.driver;
  if (!driver) {
    throw new Error(
      `[MARKETING_PROVIDER_DRIVER_REQUIRED] ${provider} API pulls require an injected provider driver.`,
    );
  }
  const pulled = await driver(context);
  const artifact = marketingProviderReportArtifactSchema.parse(
    normalizeMarketingProviderReportInput({
      config,
      provider,
      value: pulled.value,
      inputFormat: pulled.inputFormat,
      source: 'api',
      reportType: pulled.reportType,
      accountId: pulled.accountId,
      startDate: window.startDate,
      endDate: window.endDate,
      timeZone: window.timeZone,
      now: options.now ?? new Date(),
    }),
  );
  return cacheMarketingProviderReportArtifact(cwd, artifact);
}
