export { buildMarketingConsoleApp, type BuildMarketingConsoleAppOptions } from './build.js';
export { renderMarketingConsoleHtml, type RenderMarketingConsoleHtmlOptions } from './app.js';
export { serveMarketingConsoleApp, type ServeMarketingConsoleAppOptions } from './serve.js';
export type { MarketingConsoleBuildResult, MarketingConsoleServeResult } from './contracts.js';
export {
  CONSOLE_ROUTES,
  FAMILY_TABS,
  consoleNavigation,
  resolveConsoleRoute,
  tabsForRoute,
  type ConsoleCapability,
  type ConsoleNavigationGroup,
  type ConsoleRoute,
} from './routes.js';
