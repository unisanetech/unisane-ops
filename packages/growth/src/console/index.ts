import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { loadMarketingExecutionContext } from '../cli/project-context.js';
import { runWithGrowthProviderRuntime } from '../cli/provider-runtime.js';

export {
  buildMarketingConsoleState,
  type BuildMarketingConsoleStateOptions,
} from './build-state.js';
export { resolveGrowthConsoleAuthContext } from './auth-context.js';
export type {
  MarketingConsoleActionItem,
  MarketingConsoleArtifactLink,
  MarketingConsoleComparisonRow,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleReceiptEvent,
  MarketingConsoleState,
  MarketingConsoleStatus,
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
