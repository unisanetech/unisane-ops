import type { MarketingConsoleState } from '@unisane/growth/console';
import { CONSOLE_ROUTES, consoleNavigation } from './routes.js';

export type RenderMarketingConsoleHtmlOptions = {
  browserScriptHref?: string;
  browserStylesheetHref?: string;
};

export function renderMarketingConsoleHtml(
  state: MarketingConsoleState,
  options: RenderMarketingConsoleHtmlOptions = {},
): string {
  const shellModel = {
    routes: CONSOLE_ROUTES,
    navigation: consoleNavigation(state.capabilities),
  };
  const stylesheet = options.browserStylesheetHref
    ? `    <link rel="stylesheet" href="${escapeHtml(options.browserStylesheetHref)}" />\n`
    : '';
  const browserScript = options.browserScriptHref
    ? `    <script type="module" src="${escapeHtml(options.browserScriptHref)}"></script>\n`
    : '';
  return `<!doctype html>
<html lang="en" class="light" data-theme-mode="light" data-density="standard" data-radius="standard" data-action-shape="standard" data-contrast="standard" data-elevation="flat">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unisane Ops — ${escapeHtml(state.platformId)}</title>
${stylesheet}    <meta name="color-scheme" content="light" />
  </head>
  <body class="bg-surface text-on-surface">
    <div id="app">
      <p class="text-body-medium text-on-surface-variant">Loading Unisane Ops…</p>
    </div>
    <script id="unisane-ops-state" type="application/json">${serializeInlineJson(state)}</script>
    <script id="unisane-ops-shell" type="application/json">${serializeInlineJson(shellModel)}</script>
${browserScript}  </body>
</html>
`;
}

const serializeInlineJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
