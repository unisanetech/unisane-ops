export {
  buildMarketingConsoleState,
  type BuildMarketingConsoleStateOptions,
} from './application/build-console-state/build-console-state.service.js';
export {
  buildMarketingConsoleApp,
  type BuildMarketingConsoleAppOptions,
} from './application/build-console-app/build-console-app.service.js';
export {
  serveMarketingConsoleApp,
  type ServeMarketingConsoleAppOptions,
} from './application/serve-console-app/serve-console-app.service.js';
export type {
  MarketingConsoleBuildResult,
  MarketingConsoleServeResult,
} from './contracts/marketing-console-app.js';
export type {
  MarketingConsoleActionItem,
  MarketingConsoleArtifactLink,
  MarketingConsoleComparisonRow,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleReceiptEvent,
  MarketingConsoleRouteSummary,
  MarketingConsoleState,
  MarketingConsoleStatus,
  MarketingConsoleTrendPoint,
} from './contracts/marketing-console-state.js';
