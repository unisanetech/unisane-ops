export { marketingDoctor } from './doctor/run.js';
export { marketingAudit } from './audit/run.js';
export { marketingAlertAcknowledge } from './alerts/acknowledge.js';
export {
  deleteMarketingGoogleAuthProfile,
  getMarketingGoogleAuthStatus,
  loginMarketingGoogleAuthCommand,
  logoutMarketingGoogleAuthCommand,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_AUTH_SCOPES,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  refreshMarketingGoogleAccessToken,
  resolveMarketingGoogleAccessToken,
  saveMarketingGoogleAuthProfile,
  statusMarketingGoogleAuthCommand,
  tokenMarketingGoogleAuthCommand,
  type MarketingGoogleAccessTokenResult,
  type MarketingGoogleAuthCliOptions,
  type MarketingGoogleAuthRuntimeOptions,
  type MarketingGoogleAuthStatus,
} from './auth/google.js';
export {
  deleteMarketingMetaAuthProfile,
  getMarketingMetaAuthStatus,
  logoutMarketingMetaAuthCommand,
  resolveMarketingMetaAccessToken,
  saveMarketingMetaAuthCommand,
  saveMarketingMetaAuthProfile,
  statusMarketingMetaAuthCommand,
  tokenMarketingMetaAuthCommand,
  type MarketingMetaAuthCliOptions,
  type MarketingMetaAuthRuntimeOptions,
} from './auth/meta.js';
export { marketingConversionPull } from './conversion-pull/run.js';
export { marketingExperimentDecide } from './experiments/decide.js';
export { marketingPull } from './pull/run.js';
export { marketingPullApi } from './pull-api/run.js';
export { marketingProofSetup } from './proof/setup.js';
export { marketingProofStatus } from './proof/status.js';
export { marketingRecommend } from './recommend/run.js';
export { marketingRecommendDecision } from './recommend/decision.js';
export { marketingResearchStatus } from './research/status.js';
export { marketingReport } from './report/run.js';
export { marketingScheduleReporting } from './schedule/reporting.js';
export { marketingSetupDiscoverGoogle } from './setup/discover-google.js';
export { marketingSetupDiscoverMeta } from './setup/discover-meta.js';
export { marketingSetupGuide } from './setup/guide.js';
export { marketingSetupPrelive } from './setup/prelive.js';
export { marketingSetupStatus } from './setup/status.js';
export { marketingStatus } from './status/run.js';
export { marketingStrategyPull } from './strategy-pull/run.js';
export { marketingValidate } from './validate/run.js';
export type { MarketingCliOptions } from './options.js';
