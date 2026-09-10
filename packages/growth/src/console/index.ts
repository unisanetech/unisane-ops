import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { loadMarketingExecutionContext } from '../cli/project-context.js';
import { runWithGrowthProviderRuntime } from '../cli/provider-runtime.js';

export {
  buildMarketingConsoleState,
  type BuildMarketingConsoleStateOptions,
} from './build-state.js';
export { buildMarketingConsoleConnections } from './connections.js';
export { buildMarketingConsoleOverview } from './overview.js';
export { buildMarketingConsoleSeo } from './seo.js';
export { buildMarketingConsoleAdvertising } from './advertising.js';
export { buildMarketingConsoleAnalytics } from './analytics.js';
export { buildMarketingConsoleExperiments } from './experiments.js';
export { buildMarketingConsoleActivity } from './activity.js';
export { buildMarketingConsoleAutomations } from './automations.js';
export {
  buildMarketingConsoleRecommendations,
  recommendationPriorities,
} from './recommendations.js';
export { buildMarketingConsoleTagManager } from './tag-manager.js';
export { resolveGrowthConsoleAuthContext } from './auth-context.js';
export {
  createGrowthConsoleCampaignPauseApprovalController,
  type GrowthConsoleCampaignPauseApprovalController,
} from './campaign-pause-approval.js';
export type {
  MarketingConsoleArtifactLink,
  MarketingConsoleAdvertising,
  MarketingConsoleCampaignPauseReview,
  MarketingConsoleAdvertisingCampaign,
  MarketingConsoleAdvertisingChange,
  MarketingConsoleAdvertisingConversion,
  MarketingConsoleAdvertisingEntity,
  MarketingConsoleAdvertisingView,
  MarketingConsoleAnalytics,
  MarketingConsoleAnalyticsRow,
  MarketingConsoleActivity,
  MarketingConsoleActivityCategory,
  MarketingConsoleActivityItem,
  MarketingConsoleAutomation,
  MarketingConsoleAutomations,
  MarketingConsoleComparisonRow,
  MarketingConsoleConnection,
  MarketingConsoleConnectionAction,
  MarketingConsoleConnectionService,
  MarketingConsoleConnectionState,
  MarketingConsoleFreshnessCell,
  MarketingConsoleExperiments,
  MarketingConsoleExperimentIdea,
  MarketingConsoleMetric,
  MarketingConsoleOverview,
  MarketingConsolePriority,
  MarketingConsolePriorityLane,
  MarketingConsoleRecommendation,
  MarketingConsoleRecommendations,
  MarketingConsoleSeo,
  MarketingConsoleSeoHealthIssue,
  MarketingConsoleSeoMetric,
  MarketingConsoleSeoOpportunity,
  MarketingConsoleSeoPage,
  MarketingConsoleSeoQuery,
  MarketingConsoleSeoResearchIdea,
  MarketingConsoleState,
  MarketingConsoleStatus,
  MarketingConsoleTagManager,
  MarketingConsoleTemporalQuery,
  MarketingConsoleSourceSummary,
  MarketingConsoleTrackingCheck,
  MarketingConsoleTrackingAudit,
  MarketingConsoleTrackingEmitter,
  MarketingConsoleTrackingFinding,
  MarketingConsoleTrendPoint,
} from './contracts.js';

export function runWithGrowthConsoleRuntime<T>(
  runtime: PackCommandRuntime,
  cwd: string,
  run: () => T,
): T {
  return runWithGrowthProviderRuntime(runtime, cwd, run);
}

export const loadGrowthConsoleExecutionContext = loadMarketingExecutionContext;
export * from './capability-review.js';
