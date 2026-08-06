export {
  executeMarketingHistoryBackfill,
  planMarketingHistoryBackfill,
  type MarketingHistoryBackfillPlan,
  type MarketingHistoryBackfillResult,
  type MarketingHistoryBackfillTarget,
  type MarketingHistoryBackfillWindow,
} from './backfill.js';
export {
  ensureMarketingHistoryCatalog,
  MARKETING_HISTORY_CATALOG_PATH,
  readMarketingHistoryCatalog,
  rebuildMarketingHistoryCatalog,
  recordMarketingHistoryArtifact,
  type RecordMarketingHistoryResult,
} from './catalog.js';
export {
  discardMarketingFixtureEvidence,
  type DiscardMarketingFixtureEvidenceOptions,
  type DiscardMarketingFixtureEvidenceResult,
} from './discard-fixture-evidence.js';
export {
  DEFAULT_MARKETING_HISTORY_RETENTION_POLICY,
  marketingHistoryCatalogSchema,
  marketingHistoryMetricSchema,
  marketingHistoryObservationSchema,
  marketingHistoryRetentionPolicySchema,
  type MarketingHistoryCatalog,
  type MarketingHistoryCoverage,
  type MarketingHistoryMetric,
  type MarketingHistoryObservation,
  type MarketingHistoryPeriodComparison,
  type MarketingHistoryPoint,
  type MarketingHistoryQuery,
  type MarketingHistoryQueryResult,
  type MarketingHistoryReportWindow,
  type MarketingHistoryReportWindowResult,
  type MarketingHistoryRetentionPolicy,
} from './contracts.js';
export {
  compareLatestMarketingHistoryPeriods,
  queryMarketingHistory,
  queryMarketingHistoryCatalog,
} from './query.js';
export { readMarketingHistoryReportWindow } from './report-window.js';
