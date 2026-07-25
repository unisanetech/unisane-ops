export type * from './gtm/contracts.js';
export type * from './gtm/provider.js';
export * from './seo/contracts.js';
export type {
  FetchLike,
  MarketingProviderApiPullDriver,
  ProviderApiPullContext,
  ProviderApiPullInputFormat,
  ProviderApiPullOptions,
  ProviderApiPullPayload,
} from './marketing/providers/api-pull-types.js';
export type { MarketingConfig } from './marketing/schema/marketing-config.js';
export type {
  MarketingProviderReportType,
  MarketingReportProvider,
} from './marketing/schema/report.js';
export type {
  MarketingAdsLiveProviderExecutionOptions,
  MarketingAdsLiveProviderExecutionResult,
  MarketingAdsLiveProviderExecutor,
  MarketingAdsLiveProviderExecutors,
} from './marketing/ads/executors.js';
export type {
  MarketingAdsPlanArtifact,
  MarketingAdsPlanCandidate,
  MarketingAdsPlanProvider,
  MarketingGoogleAdsSearchBuildout,
  MarketingMetaAdsBuildout,
} from './marketing/schema/ads-plan.js';
export type { MarketingAdsApplyOperation } from './marketing/schema/ads-apply.js';
export type {
  MarketingAdsAssetProviderUploader,
  MarketingAdsAssetProviderUploaders,
  MarketingAdsAssetProviderUploadOperation,
  MarketingAdsAssetProviderUploadOptions,
  MarketingAdsAssetProviderUploadResult,
  MarketingAdsAssetProviderUploadSource,
} from './marketing/ads/assets.js';
export type { MarketingMetaAuthProfileStatus } from './marketing/auth/meta.js';
export type {
  MarketingGa4Discovery,
  MarketingGa4DiscoveryProperty,
  MarketingGoogleAdsDiscovery,
  MarketingGoogleDiscoveryAction,
  MarketingGoogleDiscoveryDriver,
  MarketingGoogleDiscoveryOptions,
  MarketingGoogleDiscoveryReport,
  MarketingGoogleDiscoveryStatus,
  MarketingGoogleDiscoveryWriteOptions,
  MarketingSearchConsoleDiscovery,
  MarketingSearchConsoleDiscoverySite,
} from './marketing/setup/google-discovery.js';
export type {
  MarketingMetaAdAccountDiscovery,
  MarketingMetaDiscoveryAccount,
  MarketingMetaDiscoveryAction,
  MarketingMetaDiscoveryDriver,
  MarketingMetaDiscoveryOptions,
  MarketingMetaDiscoveryPixel,
  MarketingMetaDiscoveryReport,
  MarketingMetaDiscoveryStatus,
  MarketingMetaDiscoveryWriteOptions,
  MarketingMetaPixelDiscovery,
} from './marketing/setup/meta-discovery.js';
