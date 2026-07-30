import type { MarketingConsoleState } from '@unisane/growth/console';
import { CONSOLE_ROUTES, consoleNavigation } from './routes.js';

export type RenderMarketingConsoleHtmlOptions = {
  unisaneUiStylesheetHref?: string;
};

export function renderMarketingConsoleHtml(
  state: MarketingConsoleState,
  options: RenderMarketingConsoleHtmlOptions = {},
): string {
  const unisaneUiStylesheet = options.unisaneUiStylesheetHref
    ? `    <link rel="stylesheet" href="${escapeHtml(options.unisaneUiStylesheetHref)}" />\n`
    : '';
  const shellModel = {
    routes: CONSOLE_ROUTES,
    navigation: consoleNavigation(state.capabilities),
  };
  return `<!doctype html>
<html lang="en" class="light" data-theme-mode="light" data-density="standard" data-radius="standard" data-action-shape="standard" data-contrast="standard" data-elevation="flat">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unisane Ops — ${escapeHtml(state.platformId)}</title>
${unisaneUiStylesheet}    <meta name="color-scheme" content="light" />
    <style>${consoleCss}</style>
  </head>
  <body>
    <div id="app"></div>
    <script id="unisane-ops-state" type="application/json">${serializeInlineJson(state)}</script>
    <script id="unisane-ops-shell" type="application/json">${serializeInlineJson(shellModel)}</script>
    <script>${consoleRuntimeJs}</script>
  </body>
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

export const consoleCss = `
:root {
  color-scheme: light;
  --ops-sidebar: 256px;
  --ops-sidebar-rail: 80px;
  --ops-gutter: clamp(18px, 3vw, 36px);
}
* { box-sizing: border-box; }
html, body, #app { min-height: 100%; }
body {
  margin: 0;
  background: var(--color-background, #f7f7f4);
  color: var(--color-on-surface, #20211f);
  font-family: var(--font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
}
button, input, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
.shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: var(--ops-sidebar) minmax(0, 1fr);
}
.shell.is-collapsed { grid-template-columns: var(--ops-sidebar-rail) minmax(0, 1fr); }
.sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 12px;
  background: var(--color-surface-container-low, #f0f0ec);
  border-right: 1px solid var(--color-outline-variant, #deded8);
  overflow: hidden;
  z-index: 30;
}
.brand {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 8px 12px;
}
.brand-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--radius-md, 12px);
  background: var(--color-primary-container, #dce6d7);
  color: var(--color-on-primary-container, #263622);
  font-weight: 800;
}
.brand-copy { min-width: 0; }
.brand-copy strong, .brand-copy span { display: block; }
.brand-copy strong { font-size: 15px; }
.brand-copy span { margin-top: 2px; color: var(--color-on-surface-variant, #666960); font-size: 12px; }
.project-context {
  position: relative;
  margin: 4px 0 12px;
}
.project-button {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-md, 12px);
  background: var(--color-surface, #fff);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.project-avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 9px;
  background: var(--color-secondary-container, #e6e9e0);
  font-size: 13px;
  font-weight: 750;
}
.project-copy { min-width: 0; flex: 1; }
.project-copy strong, .project-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.project-copy strong { font-size: 13px; }
.project-copy span { margin-top: 3px; color: var(--color-on-surface-variant, #686b63); font-size: 11px; }
.environment {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--color-surface-container, #e9e9e4);
  color: var(--color-on-surface-variant, #5e6159);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.environment.production { background: #fbe5df; color: #8a2f20; }
.project-menu {
  position: absolute;
  inset: calc(100% + 6px) 0 auto;
  padding: 8px;
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-md, 12px);
  background: var(--color-surface, #fff);
  box-shadow: 0 14px 36px rgb(30 35 28 / 14%);
  z-index: 40;
}
.project-menu[hidden] { display: none; }
.project-menu p { margin: 0; padding: 8px; color: var(--color-on-surface-variant, #64675f); font-size: 12px; }
.nav-scroll { min-height: 0; flex: 1; overflow-y: auto; }
.nav-group + .nav-group { margin-top: 16px; }
.nav-heading {
  margin: 0 10px 5px;
  color: var(--color-on-surface-variant, #73766e);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.nav-link {
  position: relative;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 11px;
  border-radius: var(--radius-sm, 9px);
  color: var(--color-on-surface, #272824);
  text-decoration: none;
  font-size: 13px;
  font-weight: 620;
}
.nav-link:hover { background: var(--color-state-hover, rgb(30 35 28 / 6%)); }
.nav-link.active {
  background: var(--color-primary-container, #dce6d7);
  color: var(--color-on-primary-container, #263622);
}
.nav-link.active::before {
  content: "";
  position: absolute;
  inset: 10px auto 10px -4px;
  width: 3px;
  border-radius: 3px;
  background: currentColor;
}
.nav-icon { width: 21px; height: 21px; flex: 0 0 auto; }
.nav-icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.sidebar-footer { padding-top: 10px; border-top: 1px solid var(--color-outline-variant, #d7d8d1); }
.user-context {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm, 9px);
  color: var(--color-on-surface-variant, #62655d);
  font-size: 12px;
}
.user-dot { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--color-surface-container, #e5e6e0); font-weight: 750; }
.shell.is-collapsed .brand-copy,
.shell.is-collapsed .project-copy,
.shell.is-collapsed .project-button .environment,
.shell.is-collapsed .nav-heading,
.shell.is-collapsed .nav-label,
.shell.is-collapsed .user-copy { display: none; }
.shell.is-collapsed .brand,
.shell.is-collapsed .project-button,
.shell.is-collapsed .nav-link,
.shell.is-collapsed .user-context { justify-content: center; padding-inline: 8px; }
.shell.is-collapsed .project-menu { display: none; }
.workspace { min-width: 0; }
.topbar {
  min-height: 72px;
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px var(--ops-gutter);
  background: color-mix(in srgb, var(--color-background, #f7f7f4) 92%, transparent);
  border-bottom: 1px solid var(--color-outline-variant, #deded8);
  backdrop-filter: blur(14px);
}
.topbar-start, .topbar-actions { display: flex; align-items: center; gap: 10px; min-width: 0; }
.topbar-title { min-width: 0; }
.topbar-title strong, .topbar-title span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-title strong { font-size: 14px; }
.topbar-title span { margin-top: 3px; color: var(--color-on-surface-variant, #666960); font-size: 11px; }
.icon-button, .filter-button, .freshness-link {
  min-height: 40px;
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-sm, 9px);
  background: var(--color-surface, #fff);
  color: inherit;
}
.icon-button { width: 40px; display: inline-grid; place-items: center; cursor: pointer; }
.filter-button, .freshness-link { display: inline-flex; align-items: center; gap: 6px; padding: 8px 11px; font-size: 12px; text-decoration: none; }
.freshness-link.attention { color: #8a2f20; border-color: #e4b8ac; background: #fff8f5; }
.mobile-menu { display: none; }
.content { width: min(1440px, 100%); margin: 0 auto; padding: 32px var(--ops-gutter) 72px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.eyebrow { margin: 0 0 8px; color: var(--color-primary, #476242); font-size: 11px; font-weight: 760; letter-spacing: .09em; text-transform: uppercase; }
.page-header h1 { margin: 0; font-size: clamp(28px, 4vw, 42px); line-height: 1.08; letter-spacing: -.035em; }
.page-description { max-width: 720px; margin: 12px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 15px; line-height: 1.6; }
.tabs { display: flex; gap: 4px; margin: 26px 0 0; padding-bottom: 1px; border-bottom: 1px solid var(--color-outline-variant, #d7d8d1); overflow-x: auto; }
.tab {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 9px 13px;
  border-bottom: 2px solid transparent;
  color: var(--color-on-surface-variant, #60635b);
  text-decoration: none;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 650;
}
.tab.active { border-bottom-color: var(--color-primary, #476242); color: var(--color-on-surface, #20211f); }
.summary {
  margin-top: 28px;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-lg, 16px);
  background: var(--color-surface, #fff);
}
.summary h2 { max-width: 760px; margin: 0; font-size: clamp(20px, 2.5vw, 28px); line-height: 1.28; letter-spacing: -.02em; }
.summary p { max-width: 760px; margin: 10px 0 0; color: var(--color-on-surface-variant, #62655d); line-height: 1.6; }
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.card {
  grid-column: span 4;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-lg, 16px);
  background: var(--color-surface, #fff);
}
.card.wide { grid-column: span 8; }
.card.full { grid-column: 1 / -1; }
.card h2, .card h3 { margin: 0; font-size: 15px; }
.card > p { margin: 7px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 13px; line-height: 1.55; }
.metric-value { margin-top: 18px; font-size: 28px; font-weight: 760; letter-spacing: -.025em; }
.metric-helper { margin-top: 6px; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.metric-context { display: grid; gap: 4px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--color-outline-variant, #e1e1dc); color: var(--color-on-surface-variant, #62655d); font-size: 11px; line-height: 1.45; }
.list { display: grid; gap: 10px; margin-top: 14px; }
.list-item { padding: 13px 0; border-top: 1px solid var(--color-outline-variant, #e1e1dc); }
.list-item:first-child { border-top: 0; padding-top: 0; }
.list-item strong { display: block; font-size: 13px; }
.list-item p { margin: 5px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; line-height: 1.5; }
.empty-state { padding: 26px; border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f1f1ed); }
.empty-state strong { display: block; font-size: 14px; }
.empty-state p { margin: 7px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 13px; line-height: 1.55; }
.button-link { display: inline-flex; min-height: 40px; align-items: center; margin-top: 14px; padding: 8px 13px; border-radius: var(--radius-sm, 9px); background: var(--color-primary, #476242); color: var(--color-on-primary, #fff); text-decoration: none; font-size: 12px; font-weight: 700; }
.button-link { border: 0; cursor: pointer; }
.button-link.secondary { background: var(--color-surface-container, #ecece7); color: var(--color-on-surface, #20211f); }
.button-link.danger { background: #972f23; color: #fff; }
.button-link:disabled { opacity: .55; cursor: wait; }
.page-action { margin-top: 0; }
.context-line { margin: 8px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.attention-panel { margin-top: 24px; padding: 18px 20px; border: 1px solid #e4b8ac; border-radius: var(--radius-lg, 16px); background: #fff8f5; }
.attention-panel strong { display: block; font-size: 14px; }
.attention-panel p { margin: 7px 0 0; color: #75453b; font-size: 13px; line-height: 1.55; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 30px 0 12px; }
.section-heading h2 { margin: 0; font-size: 20px; }
.section-heading p { margin: 5px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 13px; }
.priority-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.priority-card { display: flex; min-width: 0; flex-direction: column; padding: 16px; border: 1px solid var(--color-outline-variant, #deded8); border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f7f7f3); }
.priority-card h3 { margin: 0; font-size: 14px; line-height: 1.4; }
.priority-card > p { margin: 7px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; line-height: 1.5; }
.priority-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.meta-pill { padding: 4px 7px; border-radius: 999px; background: var(--color-surface-container, #e9e9e4); color: var(--color-on-surface-variant, #555950); font-size: 10px; font-weight: 680; }
.priority-card .button-link { align-self: flex-start; margin-top: auto; transform: translateY(12px); }
.funnel { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 16px; padding: 0; list-style: none; }
.funnel-stage { position: relative; min-width: 0; padding: 15px; border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f1f1ed); }
.funnel-stage strong, .funnel-stage span { display: block; }
.funnel-stage strong { margin-top: 6px; font-size: 22px; }
.funnel-stage span { color: var(--color-on-surface-variant, #62655d); font-size: 11px; }
.capability-card { display: flex; flex-direction: column; }
.capability-card .status-pill { align-self: flex-start; margin-top: 14px; }
.capability-card .button-link { align-self: flex-start; margin-top: auto; transform: translateY(10px); }
.analysis-controls { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin: 18px 0 12px; }
.analysis-control { display: grid; gap: 5px; min-width: min(240px, 100%); color: var(--color-on-surface-variant, #62655d); font-size: 11px; font-weight: 650; }
.analysis-control input, .analysis-control select {
  min-height: 40px;
  width: 100%;
  border: 1px solid var(--color-outline-variant, #d7d8d1);
  border-radius: var(--radius-sm, 9px);
  padding: 8px 11px;
  background: var(--color-surface, #fff);
  color: var(--color-on-surface, #20211f);
  font: inherit;
  font-size: 13px;
}
.table-shell { overflow-x: auto; border: 1px solid var(--color-outline-variant, #d7d8d1); border-radius: var(--radius-lg, 16px); background: var(--color-surface, #fff); }
.analysis-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.analysis-table th, .analysis-table td { padding: 12px 14px; border-bottom: 1px solid var(--color-outline-variant, #e4e4de); text-align: left; vertical-align: top; }
.analysis-table th { position: sticky; top: 0; background: var(--color-surface-container-low, #f5f5f1); color: var(--color-on-surface-variant, #62655d); font-size: 11px; white-space: nowrap; }
.analysis-table tbody tr:last-child td { border-bottom: 0; }
.analysis-table [data-sort] { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
.row-button { border: 0; padding: 0; background: transparent; color: var(--color-primary, #476242); font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
.row-subtitle { display: block; max-width: 340px; margin-top: 4px; overflow: hidden; color: var(--color-on-surface-variant, #62655d); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.source-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 20px; padding: 14px 16px; border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f1f1ed); color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.summary-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.summary-strip.research-summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-stat { padding: 15px; border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f1f1ed); }
.summary-stat strong, .summary-stat span { display: block; }
.summary-stat strong { margin-top: 5px; font-size: 20px; }
.summary-stat span { color: var(--color-on-surface-variant, #62655d); font-size: 11px; }
.health-group { margin-top: 12px; padding: 0 16px; border: 1px solid var(--color-outline-variant, #deded8); border-radius: var(--radius-md, 12px); background: var(--color-surface, #fff); }
.health-group summary { padding: 15px 0; cursor: pointer; font-size: 13px; font-weight: 720; }
.health-group .list { margin: 0; padding-bottom: 14px; }
.view-switcher { display: flex; flex-wrap: wrap; gap: 6px; margin: 18px 0 12px; }
.view-switcher button { min-height: 36px; border: 1px solid var(--color-outline-variant, #d7d8d1); border-radius: 999px; padding: 7px 12px; background: var(--color-surface, #fff); color: inherit; font-size: 12px; cursor: pointer; }
.view-switcher button.active { border-color: var(--color-primary, #476242); background: var(--color-primary-container, #dce6d7); font-weight: 700; }
.research-intro { margin-top: 18px; padding: 18px 20px; border: 1px solid var(--color-outline-variant, #deded8); border-radius: var(--radius-lg, 16px); background: var(--color-surface, #fff); }
.research-intro h2 { margin: 0; font-size: 18px; }
.research-intro p { max-width: 860px; margin: 7px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 13px; line-height: 1.55; }
.research-toolbar { display: grid; grid-template-columns: minmax(240px, 2fr) repeat(3, minmax(150px, 1fr)); gap: 12px; margin: 18px 0 12px; }
.research-toolbar .analysis-control { min-width: 0; }
.research-result-line, .pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.research-result-line { margin: 12px 2px; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.pagination { margin-top: 12px; }
.pagination p { margin: 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.pagination-actions { display: flex; gap: 8px; }
.pagination button { min-height: 36px; padding: 7px 12px; border: 1px solid var(--color-outline-variant, #d7d8d1); border-radius: var(--radius-sm, 9px); background: var(--color-surface, #fff); color: inherit; cursor: pointer; }
.pagination button:disabled { opacity: .45; cursor: default; }
.table-section + .table-section { margin-top: 28px; }
.table-section > h2 { margin: 0 0 5px; font-size: 18px; }
.table-section > p { margin: 0 0 12px; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.number-cell { white-space: nowrap; font-variant-numeric: tabular-nums; }
.market-volume { display: block; font-weight: 700; }
.market-competition { display: block; margin-top: 3px; color: var(--color-on-surface-variant, #62655d); font-size: 10px; }
.research-note { padding: 12px 14px; border-radius: var(--radius-sm, 9px); background: var(--color-surface-container-low, #f1f1ed); color: var(--color-on-surface-variant, #62655d); font-size: 12px; line-height: 1.5; }
.research-list { margin: 0; padding-left: 18px; }
.research-list li + li { margin-top: 7px; }
.topic-card { display: grid; gap: 7px; }
.topic-card dl { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; margin: 10px 0 0; font-size: 11px; }
.topic-card dt { color: var(--color-on-surface-variant, #62655d); }
.topic-card dd { margin: 0; }
.connection-card { padding: 0; overflow: hidden; }
.connection-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 20px; }
.connection-identity { display: flex; gap: 13px; min-width: 0; }
.provider-mark { width: 42px; height: 42px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 12px; background: #f1f2ed; font-size: 18px; font-weight: 800; }
.connection-identity h2 { margin: 1px 0 0; font-size: 17px; }
.connection-identity p { margin: 5px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.status-pill { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 4px 9px; border-radius: 999px; background: #edf3ea; color: #385234; font-size: 11px; font-weight: 720; white-space: nowrap; }
.status-pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.status-pill.attention { background: #fff0eb; color: #8a2f20; }
.status-pill.waiting { background: #fff7df; color: #765b13; }
.service-list { border-top: 1px solid var(--color-outline-variant, #e1e1dc); }
.service-row { display: grid; grid-template-columns: minmax(150px, 1.25fr) minmax(150px, 1.2fr) minmax(170px, 1.4fr) auto; align-items: center; gap: 16px; padding: 15px 20px; border-top: 1px solid var(--color-outline-variant, #e8e8e3); }
.service-row:first-child { border-top: 0; }
.service-name strong, .service-name span { display: block; }
.service-name strong { font-size: 13px; }
.service-name span, .service-detail { margin-top: 3px; color: var(--color-on-surface-variant, #62655d); font-size: 11px; line-height: 1.45; }
.connection-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 20px; border-top: 1px solid var(--color-outline-variant, #e1e1dc); background: var(--color-surface-container-low, #f5f5f1); }
.connection-footer p { margin: 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; }
.connection-footer .button-link { margin-top: 0; }
.command-panel { margin-top: 14px; padding: 12px; border-radius: var(--radius-sm, 9px); background: #20241f; color: #f7f7f3; }
.command-panel code { display: block; overflow-wrap: anywhere; font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; }
.command-panel .button-link { margin-top: 10px; background: #f7f7f3; color: #20241f; }
.detail-stack { display: grid; gap: 12px; margin-top: 16px; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 15px 0; border-top: 1px solid var(--color-outline-variant, #e1e1dc); }
.detail-row:first-child { border-top: 0; padding-top: 0; }
.detail-row strong { font-size: 13px; }
.detail-row p { margin: 4px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; line-height: 1.5; }
.danger-zone { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e3c0b8; }
.danger-zone h3 { color: #8a2f20; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 20px; background: rgb(20 24 20 / 52%); }
.dialog { width: min(560px, 100%); max-height: min(720px, calc(100dvh - 40px)); overflow: auto; padding: 24px; border: 1px solid var(--color-outline-variant, #d7d8d1); border-radius: var(--radius-lg, 16px); background: var(--color-surface, #fff); box-shadow: 0 22px 60px rgb(20 24 20 / 24%); }
.dialog h2 { margin: 0; font-size: 22px; }
.dialog > p, .dialog li { color: var(--color-on-surface-variant, #62655d); font-size: 13px; line-height: 1.55; }
.dialog ul { padding-left: 20px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.dialog-actions .button-link { margin-top: 0; }
.toast { position: fixed; inset: auto 20px 20px auto; z-index: 100; max-width: min(440px, calc(100vw - 40px)); padding: 12px 15px; border-radius: var(--radius-sm, 9px); background: #20241f; color: #fff; font-size: 12px; box-shadow: 0 12px 36px rgb(20 24 20 / 22%); }
.sidebar-backdrop { display: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1080px) {
  .card { grid-column: span 6; }
  .card.wide { grid-column: span 12; }
  .priority-grid { grid-template-columns: 1fr; }
  .summary-strip, .summary-strip.research-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .research-toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .freshness-link span:not(:first-child) { display: none; }
}
@media (max-width: 760px) {
  body.nav-open { overflow: hidden; }
  .shell, .shell.is-collapsed { display: block; }
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(88vw, 300px);
    transform: translateX(-105%);
    transition: transform 180ms ease;
    box-shadow: 14px 0 36px rgb(25 30 24 / 20%);
  }
  .shell.mobile-open .sidebar { transform: translateX(0); }
  .shell.is-collapsed .brand-copy,
  .shell.is-collapsed .project-copy,
  .shell.is-collapsed .project-button .environment,
  .shell.is-collapsed .nav-heading,
  .shell.is-collapsed .nav-label,
  .shell.is-collapsed .user-copy { display: block; }
  .shell.is-collapsed .brand,
  .shell.is-collapsed .project-button,
  .shell.is-collapsed .nav-link,
  .shell.is-collapsed .user-context { justify-content: flex-start; padding-inline: 10px; }
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    display: block;
    border: 0;
    background: rgb(20 24 20 / 42%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
    z-index: 25;
  }
  .shell.mobile-open .sidebar-backdrop { opacity: 1; pointer-events: auto; }
  .mobile-menu { display: inline-grid; }
  .desktop-collapse { display: none; }
  .topbar { padding-inline: 14px; }
  .filter-button { display: none; }
  .content { padding: 24px 16px 56px; }
  .page-header { display: block; }
  .page-header .page-action { margin-top: 16px; }
  .grid { grid-template-columns: 1fr; }
  .card, .card.wide, .card.full { grid-column: auto; }
  .analysis-table, .analysis-table tbody, .analysis-table tr, .analysis-table td { display: block; width: 100%; }
  .analysis-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .analysis-table tr { padding: 12px 14px; border-bottom: 1px solid var(--color-outline-variant, #e4e4de); }
  .analysis-table tbody tr:last-child { border-bottom: 0; }
  .analysis-table td { display: grid; grid-template-columns: minmax(88px, .7fr) minmax(0, 1.3fr); gap: 12px; padding: 7px 0; border: 0; }
  .analysis-table td::before { content: attr(data-label); color: var(--color-on-surface-variant, #62655d); font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .summary-strip, .summary-strip.research-summary, .research-toolbar { grid-template-columns: 1fr; }
  .research-result-line, .pagination { align-items: flex-start; flex-direction: column; }
  .service-row { grid-template-columns: 1fr; gap: 9px; }
  .connection-header, .connection-footer, .detail-row { align-items: flex-start; flex-direction: column; }
  .dialog-actions { flex-direction: column-reverse; }
  .dialog-actions .button-link { justify-content: center; width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
`;

export const consoleRuntimeJs = String.raw`
const state = JSON.parse(document.getElementById('unisane-ops-state').textContent);
const shellModel = JSON.parse(document.getElementById('unisane-ops-shell').textContent);
const app = document.getElementById('app');
const routeByPath = new Map(shellModel.routes.map((item) => [item.path, item]));
const familyTabs = new Map();
for (const item of shellModel.routes) {
  if (!familyTabs.has(item.family)) familyTabs.set(item.family, []);
  familyTabs.get(item.family).push(item);
}
let mobileOpen = false;
let projectMenuOpen = false;
let restoreFocusTo = null;
let commandAction = null;
let disconnectProvider = null;
let seoDetail = null;
let seoSearch = '';
let seoStatus = 'all';
let seoSort = { pages: 'clicks', queries: 'clicks' };
let seoResearchView = 'keywords';
let researchMarket = 'all';
let researchCluster = 'all';
let researchSort = 'volume';
let researchPage = 1;
const researchPageSize = 50;
let dialogTrigger = null;
let notice = '';
let collapsed = localStorage.getItem('unisane-ops-sidebar-collapsed') === 'true';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function humanize(value) {
  return String(value ?? '').replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}
function formatCompactNumber(value) {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value ?? 0));
}
function normalizePath(value) {
  const path = String(value || '/overview').split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  return path ? '/' + path : '/overview';
}
function providerRoute(pathname) {
  const match = pathname.match(/^\/connections\/([^/]+)(?:\/(overview|access|resources|data-sync|activity))?$/);
  if (!match) return null;
  const provider = decodeURIComponent(match[1]);
  const tab = match[2] || 'overview';
  const labels = { overview: 'Overview', access: 'Access', resources: 'Resources', 'data-sync': 'Data sync', activity: 'Activity' };
  return {
    id: 'connections.provider.' + tab,
    path: '/connections/' + encodeURIComponent(provider) + '/' + tab,
    family: 'connection-detail',
    label: labels[tab],
    title: humanize(provider) + ' connection',
    description: 'Manage this provider account, its access, selected resources, and data freshness.',
    timeAnalysis: false,
  };
}
function currentRoute() {
  const pathname = normalizePath(location.pathname);
  const provider = providerRoute(pathname);
  if (provider) return provider;
  const route = routeByPath.get(pathname);
  if (!route) return routeByPath.get('/overview');
  if (route.family === 'experiments' && !state.capabilities.includes('experiments')) return routeByPath.get('/overview');
  return route;
}
function tabsFor(route) {
  if (route.family !== 'connection-detail') return familyTabs.get(route.family) || [];
  const provider = route.path.split('/')[2];
  return ['overview', 'access', 'resources', 'data-sync', 'activity'].map((tab) => providerRoute('/connections/' + provider + '/' + tab));
}
function activeNav(item, route) {
  if (item.path === '/overview') return route.family === 'overview';
  const family = item.path.split('/')[1];
  return route.family === family || (family === 'connections' && route.family === 'connection-detail');
}
function icon(name) {
  const paths = {
    overview: '<rect x="4" y="4" width="6" height="6"></rect><rect x="14" y="4" width="6" height="6"></rect><rect x="4" y="14" width="6" height="6"></rect><rect x="14" y="14" width="6" height="6"></rect>',
    seo: '<circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path><path d="M8 11h6M11 8v6"></path>',
    advertising: '<path d="M4 13V9l12-5v14L4 13Z"></path><path d="M8 14v5h4v-3"></path><path d="M19 8v6"></path>',
    analytics: '<path d="M4 19V10"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M22 19H2"></path>',
    experiments: '<path d="M9 3h6"></path><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"></path><path d="M8 15h8"></path>',
    connections: '<path d="M9 12a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6L9.8 5.2"></path><path d="M15 12a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1.2-1.2"></path>',
    activity: '<path d="M4 12h3l2-5 4 10 2-5h5"></path>',
  };
  return '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + (paths[name] || paths.overview) + '</svg></span>';
}
function routeLink(path, label, className, active) {
  return '<a href="' + esc(path) + '" data-route-link class="' + className + (active ? ' active' : '') + '"' + (active ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
}
function navigation(route) {
  return shellModel.navigation.map((group) => {
    const heading = group.label ? '<p class="nav-heading">' + esc(group.label) + '</p>' : '';
    const links = group.items.map((item) => {
      const active = activeNav(item, route);
      return '<a href="' + esc(item.path) + '" data-route-link class="nav-link' + (active ? ' active' : '') + '" title="' + esc(item.label) + '"' + (active ? ' aria-current="page"' : '') + '>' + icon(item.icon) + '<span class="nav-label">' + esc(item.label) + '</span></a>';
    }).join('');
    return '<section class="nav-group">' + heading + links + '</section>';
  }).join('');
}
function footerNavigation(route) {
  const help = routeLink('/help', 'Help', 'nav-link', route.family === 'help');
  const settings = routeLink('/settings', 'Settings', 'nav-link', route.family === 'settings');
  return help.replace('>Help<', '>' + icon('activity') + '<span class="nav-label">Help</span><') +
    settings.replace('>Settings<', '>' + icon('overview') + '<span class="nav-label">Settings</span><');
}
function pageTabs(route) {
  const tabs = tabsFor(route);
  if (tabs.length < 2) return '';
  return '<nav class="tabs" aria-label="' + esc(route.title) + ' pages">' +
    tabs.map((tab) => routeLink(tab.path, tab.label, 'tab', tab.id === route.id)).join('') +
    '</nav>';
}
function freshness() {
  const serviceIssues = state.connections
    .filter((connection) => connection.connected)
    .flatMap((connection) => connection.services)
    .filter((service) => service.state !== 'current');
  if (serviceIssues.length > 0) {
    return { label: serviceIssues.length + ' service' + (serviceIssues.length === 1 ? '' : 's') + ' need attention', attention: true };
  }
  const unavailable = new Set(state.freshness.filter((item) => item.status !== 'ready').map((item) => item.provider)).size;
  if (unavailable === 0) return { label: 'Data is current', attention: false };
  return { label: unavailable + ' source' + (unavailable === 1 ? '' : 's') + ' need an update', attention: true };
}
function meaningfulMetrics(route) {
  const ids = route.family === 'overview'
    ? state.overview.metricIds
    : route.family === 'advertising'
      ? ['spend', 'paid-conversions', 'cpa', 'roas']
    : route.family === 'analytics'
      ? ['sessions', 'users', 'analytics-conversions', 'revenue']
      : route.family === 'seo'
        ? ['organic-clicks', 'organic-impressions']
        : [];
  const metrics = ids.map((id) => state.metrics.find((item) => item.id === id)).filter(Boolean);
  return metrics.filter((item) => item.numericValue !== undefined && item.numericValue > 0).slice(0, 4);
}
function metricCards(route) {
  const metrics = meaningfulMetrics(route);
  if (!metrics.length) {
    return '<article class="card full"><div class="empty-state"><strong>Useful performance data is not available yet.</strong><p>Connect the relevant source or wait for its first successful update. The console will not display invented zero values.</p><a class="button-link" href="/connections" data-route-link>Review connections</a></div></article>';
  }
  return metrics.map((metric) =>
    '<article class="card"><h2>' + esc(metric.label) + '</h2><div class="metric-value">' + esc(metric.value) + '</div><div class="metric-helper">' + esc(metric.definition) + '</div><div class="metric-context"><span>' + esc(metric.sourceLabel + ' · ' + metric.freshnessLabel) + '</span><span>' + esc(metric.comparisonLabel) + '</span></div></article>'
  ).join('');
}
function contextualPriorities(route) {
  const priorities = state.priorities
    .filter((priority) => route.family === 'overview' || priority.lane === route.family || priority.lane === 'overview')
    .slice(0, 3);
  if (!priorities.length) return '<div class="empty-state"><strong>No immediate priorities.</strong><p>The latest usable evidence does not require an action right now.</p></div>';
  return '<div class="priority-grid">' + priorities.map((item) =>
    '<article class="priority-card"><h3>' + esc(item.title) + '</h3><p><strong>Expected outcome:</strong> ' + esc(item.expectedOutcome) + '</p><p>' + esc(item.reason) + '</p><p><strong>Evidence:</strong> ' + esc(item.evidence) + '</p><div class="priority-meta"><span class="meta-pill">' + esc(item.priorityLabel) + '</span><span class="meta-pill">' + esc(item.confidenceLabel) + '</span><span class="meta-pill">' + esc(item.effortLabel) + '</span></div><p>' + esc(item.freshnessLabel + ' · ' + item.riskLabel) + '</p><a class="button-link" href="' + esc(item.action.path) + '" data-route-link>' + esc(item.action.label) + '</a></article>'
  ).join('') + '</div>';
}
function recentActivity(limit = 5) {
  const items = state.receipts.slice(0, limit);
  if (!items.length) return '<div class="empty-state"><strong>No activity yet.</strong><p>Changes, updates, approvals, and failures will appear here after they happen.</p></div>';
  return '<div class="list">' + items.map((item) => '<article class="list-item"><strong>' + esc(humanize(item.action)) + '</strong><p>' + esc(item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Time not available') + ' · ' + esc(humanize(item.status)) + '</p></article>').join('') + '</div>';
}
function recentOverviewOutcomes() {
  const items = state.overview.recentOutcomes;
  if (!items.length) return '<div class="empty-state"><strong>No recent changes yet.</strong><p>Completed changes and their outcomes will appear here after they happen.</p></div>';
  return '<div class="list">' + items.map((item) =>
    '<article class="list-item"><strong>' + esc(item.title) + '</strong><p>' + esc(item.summary) + '</p><p>' + esc(item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Time not available') + ' · ' + esc(humanize(item.status)) + '</p></article>'
  ).join('') + '</div>';
}
function overviewFunnel() {
  const funnel = state.overview.funnel;
  if (!funnel) return '';
  return '<section><div class="section-heading"><div><h2>' + esc(funnel.title) + '</h2><p>' + esc(funnel.summary + ' Source: ' + funnel.sourceLabel + '.') + '</p></div></div><article class="card full"><ol class="funnel" aria-label="' + esc(funnel.title) + '">' + funnel.stages.map((stage) =>
    '<li class="funnel-stage"><span>' + esc(stage.label) + '</span><strong>' + esc(stage.valueLabel) + '</strong></li>'
  ).join('') + '</ol></article></section>';
}
function capabilitySummaries() {
  return '<section><div class="section-heading"><div><h2>Channel summaries</h2><p>Open a channel to understand its results and priorities.</p></div></div><div class="grid">' + state.overview.capabilitySummaries.map((capability) =>
    '<article class="card capability-card"><h2>' + esc(capability.label) + '</h2>' + statusPill(capability.status === 'ready' ? 'current' : capability.status === 'blocked' ? 'failed' : 'delayed', capability.statusLabel) + '<p>' + esc(capability.summary) + '</p><a class="button-link secondary" href="' + esc(capability.path) + '" data-route-link>Open ' + esc(capability.label) + '</a></article>'
  ).join('') + '</div></section>';
}
function overviewPage(route) {
  const metrics = meaningfulMetrics(route);
  const performance = metrics.length
    ? '<section><div class="section-heading"><div><h2>Key results</h2><p>Only usable business metrics are shown, with their source and freshness.</p></div></div><div class="grid">' + metricCards(route) + '</div></section>'
    : '<section><div class="section-heading"><div><h2>Key results</h2></div></div><article class="card full"><div class="empty-state"><strong>No usable business metrics yet.</strong><p>Connect the relevant Google services or wait for the first successful update. Zeroes and empty charts are not used as placeholders.</p><a class="button-link" href="/connections" data-route-link>Review connections</a></div></article></section>';
  return '<section><div class="section-heading"><div><h2>Priorities</h2><p>Up to three actions selected from current workspace evidence.</p></div></div>' + contextualPriorities(route) + '</section>' +
    performance +
    overviewFunnel() +
    '<section><div class="section-heading"><div><h2>Recent changes and outcomes</h2><p>Readable results from recent workspace activity.</p></div><a href="/activity" data-route-link>View all activity</a></div><article class="card full">' + recentOverviewOutcomes() + '</article></section>' +
    capabilitySummaries();
}
function seoMetricCards() {
  const metrics = state.seo.overview.metrics;
  if (!metrics.length) {
    return '<article class="card full"><div class="empty-state"><strong>No usable search metrics yet.</strong><p>Connect Search Console or wait for its first successful update. Empty metrics are not displayed as zero.</p><a class="button-link" href="/connections" data-route-link>Review connection</a></div></article>';
  }
  return metrics.map((metric) =>
    '<article class="card"><h2>' + esc(metric.label) + '</h2><div class="metric-value">' + esc(metric.value) + '</div><div class="metric-helper">' + esc(metric.definition) + '</div><div class="metric-context"><span>' + esc(metric.sourceLabel + ' · ' + metric.freshnessLabel) + '</span><span>' + esc(metric.comparisonLabel) + '</span></div></article>'
  ).join('');
}
function seoSourceFooter() {
  return '<footer class="source-footer"><span><strong>Source:</strong> ' + esc(state.seo.sourceLabel) + '</span><span><strong>Latest usable data:</strong> ' + esc(state.seo.freshnessLabel) + '</span><span>' + esc(state.seo.comparisonLabel) + '</span></footer>';
}
function seoOpportunityCards(items, emptyTitle) {
  if (!items.length) {
    return '<div class="empty-state"><strong>' + esc(emptyTitle || 'No supported opportunity yet.') + '</strong><p>An opportunity appears only when available evidence supports a useful action.</p></div>';
  }
  return '<div class="priority-grid">' + items.map((item) =>
    '<article class="priority-card" data-seo-search-value="' + esc(item.title + ' ' + item.reason + ' ' + item.kind) + '" data-seo-status="' + esc(item.kind) + '"><h3>' + esc(item.title) + '</h3><p><strong>Expected outcome:</strong> ' + esc(item.expectedOutcome) + '</p><p>' + esc(item.reason) + '</p><p><strong>Affected:</strong> ' + esc(item.affectedLabel) + '</p><div class="priority-meta"><span class="meta-pill">' + esc(humanize(item.kind)) + '</span><span class="meta-pill">' + esc(item.confidenceLabel) + '</span><span class="meta-pill">' + esc(item.effortLabel) + '</span></div><p>' + esc(item.impactLabel + ' · ' + item.freshnessLabel) + '</p><button class="button-link" type="button" data-action="inspect-seo" data-seo-kind="opportunity" data-seo-id="' + esc(item.id) + '">Review opportunity</button></article>'
  ).join('') + '</div>';
}
function seoPagePreview() {
  const pages = state.seo.overview.pagePreview;
  if (!pages.length) return '';
  return '<section><div class="section-heading"><div><h2>Pages with search visibility</h2><p>Current-period evidence only; growth and decline need a previous-period comparison.</p></div><a href="/seo/pages" data-route-link>View all pages</a></div><article class="card full"><div class="list">' + pages.map((page) =>
    '<article class="list-item"><button class="row-button" type="button" data-action="inspect-seo" data-seo-kind="page" data-seo-id="' + esc(page.id) + '">' + esc(page.title) + '</button><p>' + esc(page.clicks + ' organic clicks · ' + page.searchViews + ' search views · ' + (page.averagePosition === undefined ? 'position unavailable' : 'average position ' + page.averagePosition)) + '</p></article>'
  ).join('') + '</div></article></section>';
}
function seoOverviewPage() {
  return '<section><div class="section-heading"><div><h2>Search performance</h2><p>Current results from Google Search Console with honest comparison limits.</p></div></div><div class="grid">' + seoMetricCards() + '</div></section>' +
    '<section><div class="section-heading"><div><h2>Best opportunities</h2><p>Up to three deterministic improvements supported by current search evidence.</p></div><a href="/seo/opportunities" data-route-link>View all opportunities</a></div>' + seoOpportunityCards(state.seo.overview.opportunities, 'No current search opportunity is supported yet.') + '</section>' +
    seoPagePreview() +
    seoSourceFooter();
}
function opportunitySummary() {
  const counts = { 'high-impact': 0, 'quick-win': 0, problem: 0 };
  state.seo.opportunities.forEach((item) => { counts[item.kind] += 1; });
  return '<div class="summary-strip"><article class="summary-stat"><span>High impact</span><strong>' + counts['high-impact'] + '</strong></article><article class="summary-stat"><span>Quick wins</span><strong>' + counts['quick-win'] + '</strong></article><article class="summary-stat"><span>Problems</span><strong>' + counts.problem + '</strong></article></div>';
}
function seoOpportunitiesPage() {
  return opportunitySummary() +
    '<div class="analysis-controls"><label class="analysis-control">Search opportunities<input type="search" value="' + esc(seoSearch) + '" data-seo-filter placeholder="Search outcome or evidence"></label><label class="analysis-control">Type<select data-seo-status-filter><option value="all"' + (seoStatus === 'all' ? ' selected' : '') + '>All types</option><option value="high-impact"' + (seoStatus === 'high-impact' ? ' selected' : '') + '>High impact</option><option value="quick-win"' + (seoStatus === 'quick-win' ? ' selected' : '') + '>Quick wins</option><option value="problem"' + (seoStatus === 'problem' ? ' selected' : '') + '>Problems</option></select></label></div>' +
    seoOpportunityCards(state.seo.opportunities, 'No ranked search opportunity is supported yet.') +
    seoSourceFooter();
}
function sortedSeoPages() {
  const rows = [...state.seo.pages];
  const key = seoSort.pages;
  if (key === 'views') rows.sort((left, right) => right.searchViews - left.searchViews);
  else if (key === 'position') rows.sort((left, right) => (left.averagePosition ?? Number.MAX_SAFE_INTEGER) - (right.averagePosition ?? Number.MAX_SAFE_INTEGER));
  else rows.sort((left, right) => right.clicks - left.clicks || right.searchViews - left.searchViews);
  return rows;
}
function seoPagesPage() {
  const pages = sortedSeoPages();
  if (!pages.length) return '<div class="grid"><article class="card full"><div class="empty-state"><strong>No page-level search data is available.</strong><p>Search Console must provide query and page evidence before this table appears.</p><a class="button-link" href="/connections" data-route-link>Review connection</a></div></article></div>' + seoSourceFooter();
  return '<div class="analysis-controls"><label class="analysis-control">Search pages<input type="search" value="' + esc(seoSearch) + '" data-seo-filter placeholder="Search page title or URL"></label><label class="analysis-control">Status<select data-seo-status-filter><option value="all"' + (seoStatus === 'all' ? ' selected' : '') + '>All statuses</option><option value="Review"' + (seoStatus === 'Review' ? ' selected' : '') + '>Review</option><option value="Not indexed"' + (seoStatus === 'Not indexed' ? ' selected' : '') + '>Not indexed</option></select></label></div>' +
    '<div class="table-shell"><table class="analysis-table"><thead><tr><th>Page</th><th><button type="button" data-sort="pages:clicks">Clicks</button></th><th>Change</th><th><button type="button" data-sort="pages:views">Search views</button></th><th><button type="button" data-sort="pages:position">Average position</button></th><th>Status</th></tr></thead><tbody>' + pages.map((page) =>
      '<tr data-seo-search-value="' + esc(page.title + ' ' + page.path) + '" data-seo-status="' + esc(page.status) + '"><td data-label="Page"><button class="row-button" type="button" data-action="inspect-seo" data-seo-kind="page" data-seo-id="' + esc(page.id) + '">' + esc(page.title) + '</button><span class="row-subtitle">' + esc(page.path) + '</span></td><td data-label="Clicks">' + esc(page.clicks) + '</td><td data-label="Change">' + esc(page.changeLabel) + '</td><td data-label="Search views">' + esc(page.searchViews) + '</td><td data-label="Average position">' + esc(page.averagePosition ?? 'Not available') + '</td><td data-label="Status">' + esc(page.status) + (page.indexingWarning ? '<span class="row-subtitle">' + esc(page.indexingWarning) + '</span>' : '') + '</td></tr>'
    ).join('') + '</tbody></table></div>' + seoSourceFooter();
}
function sortedSeoQueries() {
  const rows = [...state.seo.queries];
  const key = seoSort.queries;
  if (key === 'views') rows.sort((left, right) => right.searchViews - left.searchViews);
  else if (key === 'position') rows.sort((left, right) => (left.averagePosition ?? Number.MAX_SAFE_INTEGER) - (right.averagePosition ?? Number.MAX_SAFE_INTEGER));
  else rows.sort((left, right) => right.clicks - left.clicks || right.searchViews - left.searchViews);
  return rows;
}
function seoQueriesPage() {
  const queries = sortedSeoQueries();
  if (!queries.length) return '<div class="grid"><article class="card full"><div class="empty-state"><strong>No search query data is available.</strong><p>Search Console must provide query evidence before this table appears.</p><a class="button-link" href="/connections" data-route-link>Review connection</a></div></article></div>' + seoSourceFooter();
  return '<div class="analysis-controls"><label class="analysis-control">Search queries<input type="search" value="' + esc(seoSearch) + '" data-seo-filter placeholder="Search query text"></label></div>' +
    '<div class="table-shell"><table class="analysis-table"><thead><tr><th>Search</th><th><button type="button" data-sort="queries:clicks">Clicks</button></th><th>Change</th><th><button type="button" data-sort="queries:views">Search views</button></th><th><button type="button" data-sort="queries:position">Average position</button></th><th>Best page</th></tr></thead><tbody>' + queries.map((query) =>
      '<tr data-seo-search-value="' + esc(query.query + ' ' + (query.bestPage?.title || '')) + '" data-seo-status="all"><td data-label="Search"><button class="row-button" type="button" data-action="inspect-seo" data-seo-kind="query" data-seo-id="' + esc(query.id) + '">' + esc(query.query) + '</button></td><td data-label="Clicks">' + esc(query.clicks) + '</td><td data-label="Change">' + esc(query.changeLabel) + '</td><td data-label="Search views">' + esc(query.searchViews) + '</td><td data-label="Average position">' + esc(query.averagePosition ?? 'Not available') + '</td><td data-label="Best page">' + esc(query.bestPage?.title || 'Not available') + '</td></tr>'
    ).join('') + '</tbody></table></div>' + seoSourceFooter();
}
function seoSiteHealthPage() {
  const health = state.seo.siteHealth;
  if (!health.available) return '<div class="grid"><article class="card full"><div class="empty-state"><strong>' + esc(health.headline) + '</strong><p>' + esc(health.detail) + '</p></div></article></div>';
  const groups = health.groups.map((group) =>
    '<details class="health-group"' + (group.issues.length ? ' open' : '') + '><summary>' + esc(group.label + ' · ' + group.issues.length) + '</summary>' + (group.issues.length ? '<div class="list">' + group.issues.map((issue) =>
      '<article class="list-item"><strong>' + esc(issue.title) + '</strong><p>' + esc(issue.impact + ' Affected: ' + issue.affectedLabel + '.') + '</p><p>' + esc(issue.confidenceLabel + ' · ' + issue.firstSeenLabel + ' · ' + issue.lastCheckedLabel) + '</p><a class="button-link secondary" href="/seo/pages" data-route-link>' + esc(issue.actionLabel) + '</a></article>'
    ).join('') + '</div>' : '<div class="empty-state"><strong>No issue reported in this group.</strong></div>') + '</details>'
  ).join('');
  return '<section class="summary"><h2>' + esc(health.headline) + '</h2><p>' + esc(health.detail) + '</p></section>' + groups + seoSourceFooter();
}
function researchViewButton(id, label) {
  return '<button type="button" data-research-view="' + id + '" class="' + (seoResearchView === id ? 'active' : '') + '"' + (seoResearchView === id ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + label + '</button>';
}
function researchSummary() {
  const keywords = state.keywordResearch;
  return '<div class="summary-strip research-summary">' +
    '<article class="summary-stat"><span>Researched keywords</span><strong>' + formatNumber(keywords.matrix.length) + '</strong></article>' +
    '<article class="summary-stat"><span>Measured monthly demand</span><strong>' + formatCompactNumber(keywords.totalKnownVolume) + '</strong></article>' +
    '<article class="summary-stat"><span>Keyword clusters</span><strong>' + formatNumber(keywords.clusters.length) + '</strong></article>' +
    '<article class="summary-stat"><span>Markets compared</span><strong>' + formatNumber(keywords.markets.length) + '</strong></article>' +
  '</div>';
}
function researchMarketOptions() {
  return '<option value="all"' + (researchMarket === 'all' ? ' selected' : '') + '>All markets</option>' +
    state.keywordResearch.markets.map((item) => '<option value="' + esc(item.market) + '"' + (researchMarket === item.market ? ' selected' : '') + '>' + esc(item.market) + '</option>').join('');
}
function researchClusterOptions() {
  return '<option value="all"' + (researchCluster === 'all' ? ' selected' : '') + '>All clusters</option>' +
    state.keywordResearch.clusters.map((item) => '<option value="' + esc(item.id) + '"' + (researchCluster === item.id ? ' selected' : '') + '>' + esc(item.label) + '</option>').join('');
}
function keywordCompetition(row) {
  const markets = researchMarket === 'all'
    ? Object.values(row.markets)
    : row.markets[researchMarket] ? [row.markets[researchMarket]] : [];
  const values = markets.map((item) => item.competitionIndex).filter((value) => typeof value === 'number');
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : undefined;
}
function filteredResearchKeywords() {
  const search = seoSearch.trim().toLowerCase();
  const rows = state.keywordResearch.matrix.filter((row) =>
    (!search || (row.term + ' ' + row.clusterLabel).toLowerCase().includes(search)) &&
    (researchCluster === 'all' || row.clusterId === researchCluster) &&
    (researchMarket === 'all' || Boolean(row.markets[researchMarket]))
  );
  if (researchSort === 'keyword') rows.sort((left, right) => left.term.localeCompare(right.term));
  else if (researchSort === 'competition') rows.sort((left, right) => (keywordCompetition(right) ?? -1) - (keywordCompetition(left) ?? -1) || right.totalKnownVolume - left.totalKnownVolume);
  else if (researchSort === 'markets') rows.sort((left, right) => right.marketCount - left.marketCount || right.totalKnownVolume - left.totalKnownVolume);
  else rows.sort((left, right) => right.totalKnownVolume - left.totalKnownVolume || left.term.localeCompare(right.term));
  return rows;
}
function keywordMarketCell(row, market) {
  const metrics = row.markets[market];
  if (!metrics) return '<span class="market-competition">No data</span>';
  return '<span class="market-volume">' + formatNumber(metrics.avgMonthlySearches ?? 0) + '</span><span class="market-competition">' + esc(metrics.competition ? humanize(metrics.competition) : 'Competition unavailable') + (metrics.competitionIndex === undefined ? '' : ' · ' + metrics.competitionIndex) + '</span>';
}
function researchKeywordsView() {
  const research = state.keywordResearch;
  if (!research.matrix.length) return '<div class="empty-state"><strong>No keyword demand research yet.</strong><p>Import country- and language-specific keyword evidence to compare demand, competition, clusters, and markets.</p></div>';
  const rows = filteredResearchKeywords();
  const pageCount = Math.max(1, Math.ceil(rows.length / researchPageSize));
  researchPage = Math.min(researchPage, pageCount);
  const start = (researchPage - 1) * researchPageSize;
  const visible = rows.slice(start, start + researchPageSize);
  const marketHeaders = research.markets.map((item) => '<th>' + esc(item.market) + '<span class="row-subtitle">volume · competition</span></th>').join('');
  const marketCells = (row) => research.markets.map((item) => '<td data-label="' + esc(item.market) + '" class="number-cell">' + keywordMarketCell(row, item.market) + '</td>').join('');
  return '<div class="research-toolbar">' +
    '<label class="analysis-control">Search keywords<input type="search" value="' + esc(seoSearch) + '" data-research-search placeholder="Search keyword or cluster"></label>' +
    '<label class="analysis-control">Market<select data-research-market>' + researchMarketOptions() + '</select></label>' +
    '<label class="analysis-control">Cluster<select data-research-cluster>' + researchClusterOptions() + '</select></label>' +
    '<label class="analysis-control">Sort by<select data-research-sort><option value="volume"' + (researchSort === 'volume' ? ' selected' : '') + '>Demand</option><option value="competition"' + (researchSort === 'competition' ? ' selected' : '') + '>Competition</option><option value="markets"' + (researchSort === 'markets' ? ' selected' : '') + '>Market coverage</option><option value="keyword"' + (researchSort === 'keyword' ? ' selected' : '') + '>Keyword A–Z</option></select></label>' +
  '</div>' +
  '<div class="research-result-line"><span>Showing ' + (rows.length ? formatNumber(start + 1) + '–' + formatNumber(start + visible.length) : '0') + ' of ' + formatNumber(rows.length) + ' matching keywords</span><span>Volumes are provider estimates, not guaranteed traffic.</span></div>' +
  (visible.length ? '<div class="table-shell"><table class="analysis-table"><thead><tr><th>Keyword</th><th>Cluster</th><th>Total demand</th><th>Best market</th><th>Markets</th><th>Competition</th>' + marketHeaders + '</tr></thead><tbody>' + visible.map((row) =>
    '<tr><td data-label="Keyword"><strong>' + esc(row.term) + '</strong></td><td data-label="Cluster">' + esc(row.clusterLabel) + '</td><td data-label="Total demand" class="number-cell">' + formatNumber(row.totalKnownVolume) + '</td><td data-label="Best market">' + esc(row.bestMarket || 'Not available') + '<span class="row-subtitle">' + (row.bestMarketVolume === undefined ? '' : formatNumber(row.bestMarketVolume) + ' monthly') + '</span></td><td data-label="Markets">' + formatNumber(row.marketCount) + '</td><td data-label="Competition">' + esc(keywordCompetition(row) ?? 'Not available') + '</td>' + marketCells(row) + '</tr>'
  ).join('') + '</tbody></table></div>' : '<div class="empty-state"><strong>No keywords match these filters.</strong><p>Try another market, cluster, or keyword.</p></div>') +
  '<div class="pagination"><p>Page ' + researchPage + ' of ' + pageCount + '</p><div class="pagination-actions"><button type="button" data-research-page="' + (researchPage - 1) + '"' + (researchPage <= 1 ? ' disabled' : '') + '>Previous</button><button type="button" data-research-page="' + (researchPage + 1) + '"' + (researchPage >= pageCount ? ' disabled' : '') + '>Next</button></div></div>';
}
function researchClustersView() {
  const clusters = state.keywordResearch.clusters;
  if (!clusters.length) return '<div class="empty-state"><strong>No keyword clusters yet.</strong><p>Clusters appear after keyword research can be grouped by user intent.</p></div>';
  return '<div class="table-section"><h2>Target by user intent</h2><p>Use clusters to decide which pages, product messages, or campaigns deserve focused treatment.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Cluster</th><th>Keywords</th><th>Measured demand</th><th>Best market</th><th>Competition</th><th>Leading keywords</th><th>Recommended use</th></tr></thead><tbody>' + clusters.map((cluster) =>
    '<tr><td data-label="Cluster"><strong>' + esc(cluster.label) + '</strong><span class="row-subtitle">' + esc(cluster.intent) + '</span></td><td data-label="Keywords">' + formatNumber(cluster.metricCount) + '</td><td data-label="Measured demand" class="number-cell">' + formatNumber(cluster.totalKnownVolume) + '</td><td data-label="Best market">' + esc(cluster.bestMarket || 'Not available') + '<span class="row-subtitle">' + (cluster.bestMarketVolume === undefined ? '' : formatNumber(cluster.bestMarketVolume) + ' monthly') + '</span></td><td data-label="Competition">' + esc(cluster.averageCompetitionIndex ?? 'Not available') + '</td><td data-label="Leading keywords">' + esc(cluster.topKeywords.slice(0, 4).map((item) => item.term).join(', ')) + '</td><td data-label="Recommended use">' + esc(cluster.recommendedUse) + '</td></tr>'
  ).join('') + '</tbody></table></div></div>';
}
function researchMarketsView() {
  const markets = state.keywordResearch.markets;
  if (!markets.length) return '<div class="empty-state"><strong>No market comparison yet.</strong><p>Add region-specific research to understand where demand and competition differ.</p></div>';
  return '<div class="table-section"><h2>Market comparison</h2><p>Compare demand before reusing the same keyword and content strategy in every country.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Market</th><th>Keyword measurements</th><th>Measured demand</th><th>Average competition</th><th>Leading keywords</th></tr></thead><tbody>' + markets.map((market) =>
    '<tr><td data-label="Market"><strong>' + esc(market.market) + '</strong><span class="row-subtitle">' + esc(market.currencyCode || 'Currency unavailable') + '</span></td><td data-label="Keyword measurements">' + formatNumber(market.metricCount) + '</td><td data-label="Measured demand" class="number-cell">' + formatNumber(market.totalKnownVolume) + '</td><td data-label="Average competition">' + esc(market.averageCompetitionIndex ?? 'Not available') + '</td><td data-label="Leading keywords">' + esc(market.topKeywords.slice(0, 6).map((item) => item.term + ' (' + formatNumber(item.avgMonthlySearches ?? 0) + ')').join(', ')) + '</td></tr>'
  ).join('') + '</tbody></table></div></div>';
}
function researchQuestionsView() {
  const research = state.faqResearch;
  if (!research.questions.length) return '<div class="empty-state"><strong>No researched questions yet.</strong><p>Questions appear when FAQ research records the user need, target page, demand, and evidence.</p></div>';
  return '<div class="summary-strip research-summary"><article class="summary-stat"><span>Researched questions</span><strong>' + formatNumber(research.questionCount) + '</strong></article><article class="summary-stat"><span>Approved</span><strong>' + formatNumber(research.approvedCount) + '</strong></article><article class="summary-stat"><span>Questions needing proof</span><strong>' + formatNumber(research.needsProofCount) + '</strong></article><article class="summary-stat"><span>Research quality</span><strong>' + formatNumber(research.qualityScore) + '/100</strong></article></div>' +
  '<div class="table-section"><h2>Question and FAQ plan</h2><p>Demand alone is not enough: every question keeps its page role, evidence, and answer intent.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Question</th><th>Target page</th><th>Priority</th><th>Measured demand</th><th>Markets</th><th>Proof</th><th>Answer intent</th></tr></thead><tbody>' + research.questions.map((item) =>
    '<tr><td data-label="Question"><strong>' + esc(item.question) + '</strong><span class="row-subtitle">' + esc(item.clusterId ? humanize(item.clusterId) : 'Unclustered') + '</span></td><td data-label="Target page">' + esc(item.routePath) + '<span class="row-subtitle">' + esc(humanize(item.pageRole)) + '</span></td><td data-label="Priority">' + esc(item.priority.toUpperCase()) + '<span class="row-subtitle">' + esc(humanize(item.status)) + '</span></td><td data-label="Measured demand" class="number-cell">' + (item.avgMonthlySearches === undefined ? 'Not available' : formatNumber(item.avgMonthlySearches)) + '</td><td data-label="Markets">' + formatNumber(item.marketCount) + '<span class="row-subtitle">' + esc(item.bestMarket || 'Not available') + '</span></td><td data-label="Proof">' + esc(humanize(item.proofStatus)) + '<span class="row-subtitle">' + esc(item.evidenceSources.join(', ') || 'No evidence source') + '</span></td><td data-label="Answer intent">' + esc(item.answerIntent) + '</td></tr>'
  ).join('') + '</tbody></table></div></div>';
}
function researchCompetitorsView() {
  const research = state.competitorResearch;
  if (!research.domains.length && !research.pages.length) return '<div class="empty-state"><strong>No competitor research yet.</strong><p>Add evidence-backed competitor pages to compare positioning, content patterns, and gaps.</p></div>';
  const opportunities = research.opportunities.length ? '<div class="table-section"><h2>Positioning gaps</h2><ul class="research-list">' + research.opportunities.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul></div>' : '';
  return '<div class="summary-strip"><article class="summary-stat"><span>Competitor domains</span><strong>' + formatNumber(research.domainCount) + '</strong></article><article class="summary-stat"><span>Pages reviewed</span><strong>' + formatNumber(research.pageCount) + '</strong></article><article class="summary-stat"><span>Keywords observed</span><strong>' + formatNumber(research.keywordCount) + '</strong></article></div>' +
  '<div class="table-section"><h2>Competitor landscape</h2><p>Patterns and gaps are drawn from recorded pages, not assumed from brand reputation.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Domain</th><th>Pages</th><th>Keywords</th><th>Best observed position</th><th>Content patterns</th><th>Opportunities</th></tr></thead><tbody>' + research.domains.map((item) =>
    '<tr><td data-label="Domain"><strong>' + esc(item.domain) + '</strong></td><td data-label="Pages">' + formatNumber(item.pageCount) + '</td><td data-label="Keywords">' + formatNumber(item.keywordCount) + '</td><td data-label="Best observed position">' + esc(item.bestPosition ?? 'Not available') + '</td><td data-label="Content patterns">' + esc(item.topPatterns.join(', ') || 'Not recorded') + '</td><td data-label="Opportunities">' + esc(item.opportunities.join(' ') || 'Not recorded') + '</td></tr>'
  ).join('') + '</tbody></table></div></div>' +
  '<div class="table-section"><h2>Pages reviewed</h2><div class="table-shell"><table class="analysis-table"><thead><tr><th>Competitor page</th><th>Keyword</th><th>Position</th><th>Page type</th><th>Strengths</th><th>Gaps</th></tr></thead><tbody>' + research.pages.map((item) =>
    '<tr><td data-label="Competitor page"><strong>' + esc(item.competitor) + '</strong><span class="row-subtitle">' + esc(item.domain) + '</span></td><td data-label="Keyword">' + esc(item.keyword || 'Not recorded') + '</td><td data-label="Position">' + esc(item.position ?? 'Not available') + '</td><td data-label="Page type">' + esc(item.pageType ? humanize(item.pageType) : 'Not recorded') + '</td><td data-label="Strengths">' + esc(item.strengths.join(' ') || 'Not recorded') + '</td><td data-label="Gaps">' + esc(item.gaps.join(' ') || 'Not recorded') + '</td></tr>'
  ).join('') + '</tbody></table></div></div>' + opportunities;
}
function researchSerpView() {
  const intelligence = state.seoIntelligence;
  const serp = intelligence.serp.snapshots;
  const experiments = intelligence.metadata.experiments;
  const audits = intelligence.pageAudits.audits;
  if (!serp.length && !experiments.length && !audits.length) return '<div class="empty-state"><strong>No SERP or experiment research yet.</strong><p>Add search-result snapshots, metadata hypotheses, or page audits before using this evidence view.</p></div>';
  const serpTable = serp.length ? '<div class="table-section"><h2>Search-result snapshots</h2><p>Recorded result landscapes help validate intent and competitor assumptions.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Keyword</th><th>Market</th><th>Intent</th><th>Top domains</th><th>People also ask</th><th>Opportunities</th></tr></thead><tbody>' + serp.map((item) =>
    '<tr><td data-label="Keyword"><strong>' + esc(item.keyword) + '</strong></td><td data-label="Market">' + esc(item.country + ' / ' + item.language) + '</td><td data-label="Intent">' + esc(item.intent) + '</td><td data-label="Top domains">' + esc(item.topDomains.join(', ') || 'Not recorded') + '</td><td data-label="People also ask">' + esc(item.peopleAlsoAsk.join(' · ') || 'Not recorded') + '</td><td data-label="Opportunities">' + esc(item.opportunities.join(' ') || 'Not recorded') + '</td></tr>'
  ).join('') + '</tbody></table></div></div>' : '';
  const experimentTable = experiments.length ? '<div class="table-section"><h2>Metadata experiments</h2><p>Proposed titles and descriptions remain hypotheses until implemented and measured.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Page</th><th>Primary keyword</th><th>Priority</th><th>Proposed title</th><th>Rationale</th><th>Expected impact</th></tr></thead><tbody>' + experiments.map((item) =>
    '<tr><td data-label="Page"><strong>' + esc(item.routePath) + '</strong><span class="row-subtitle">' + esc(humanize(item.status)) + '</span></td><td data-label="Primary keyword">' + esc(item.primaryKeyword) + '</td><td data-label="Priority">' + esc(item.priority.toUpperCase()) + '</td><td data-label="Proposed title">' + esc(item.proposedTitle) + '</td><td data-label="Rationale">' + esc(item.rationale) + '</td><td data-label="Expected impact">' + esc(item.expectedImpact) + '</td></tr>'
  ).join('') + '</tbody></table></div></div>' : '';
  const auditTable = audits.length ? '<div class="table-section"><h2>Page research audits</h2><p>Audits identify missing research alignment; they do not replace live search performance.</p><div class="table-shell"><table class="analysis-table"><thead><tr><th>Page</th><th>Score</th><th>Primary keyword</th><th>Intent</th><th>Missing</th><th>Recommendations</th></tr></thead><tbody>' + audits.map((item) =>
    '<tr><td data-label="Page"><strong>' + esc(item.routePath) + '</strong><span class="row-subtitle">' + esc(humanize(item.status)) + '</span></td><td data-label="Score">' + formatNumber(item.score) + '/100</td><td data-label="Primary keyword">' + esc(item.primaryKeyword || 'Not set') + '</td><td data-label="Intent">' + esc(item.intent || 'Not set') + '</td><td data-label="Missing">' + esc(item.missing.join(', ') || 'Nothing recorded') + '</td><td data-label="Recommendations">' + esc(item.recommendations.join(' ') || 'None recorded') + '</td></tr>'
  ).join('') + '</tbody></table></div></div>' : '';
  return serpTable + experimentTable + auditTable;
}
function seoResearchResults() {
  if (seoResearchView === 'clusters') return researchClustersView();
  if (seoResearchView === 'markets') return researchMarketsView();
  if (seoResearchView === 'questions') return researchQuestionsView();
  if (seoResearchView === 'competitors') return researchCompetitorsView();
  if (seoResearchView === 'serp') return researchSerpView();
  return researchKeywordsView();
}
function seoResearchPage() {
  const research = state.keywordResearch;
  return '<section class="research-intro"><h2>Plan what to target next</h2><p>Start with independent keyword, market, question, competitor, and search-result research. Search Console visibility helps validate current performance, but it does not define the research opportunity.</p></section>' +
    researchSummary() +
    '<div class="view-switcher" aria-label="Research views">' +
      researchViewButton('keywords', 'Keywords') +
      researchViewButton('clusters', 'Clusters') +
      researchViewButton('markets', 'Markets') +
      researchViewButton('questions', 'Questions') +
      researchViewButton('competitors', 'Competitors & gaps') +
      researchViewButton('serp', 'SERP & experiments') +
    '</div>' +
    seoResearchResults() +
    '<footer class="source-footer"><span><strong>Research source:</strong> ' + esc(research.provider || 'Project research evidence') + '</span><span><strong>Latest keyword evidence:</strong> ' + esc(formatTime(research.fetchedAt)) + '</span><span>Demand figures are estimates; use Search Console separately to measure actual visibility.</span></footer>';
}
function seoPage(route) {
  if (route.id === 'seo.overview') return seoOverviewPage();
  if (route.id === 'seo.opportunities') return seoOpportunitiesPage();
  if (route.id === 'seo.pages') return seoPagesPage();
  if (route.id === 'seo.queries') return seoQueriesPage();
  if (route.id === 'seo.site-health') return seoSiteHealthPage();
  return seoResearchPage();
}
function formatTime(value) {
  if (!value) return 'Not checked yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Time not available' : parsed.toLocaleString();
}
function connectionByProvider(provider) {
  return state.connections.find((connection) => connection.provider === provider);
}
function statusClass(connectionState) {
  if (connectionState === 'current') return '';
  if (connectionState === 'syncing' || connectionState === 'delayed' || connectionState === 'needs-resource') return ' waiting';
  return ' attention';
}
function statusPill(connectionState, label) {
  return '<span class="status-pill' + statusClass(connectionState) + '">' + esc(label) + '</span>';
}
function commandButton(action, className) {
  if (!action?.command) return '';
  return '<button class="button-link' + (className ? ' ' + className : '') + '" type="button" data-action="show-command" data-command-id="' + esc(action.id) + '">' + esc(action.label) + '</button>';
}
function serviceRows(connection) {
  return '<div class="service-list">' + connection.services.map((service) =>
    '<article class="service-row">' +
      '<div class="service-name"><strong>' + esc(service.label) + '</strong><span>' + esc(service.purpose) + '</span></div>' +
      '<div>' + statusPill(service.state, service.statusLabel) + '<div class="service-detail">' + esc(service.accessLabel) + '</div></div>' +
      '<div class="service-detail"><strong>' + esc(service.resource?.label || 'No resource selected') + '</strong><br>' + esc(service.dataLabel) + '</div>' +
      '<div>' + (service.action ? commandButton(service.action, 'secondary') : '') + '</div>' +
    '</article>'
  ).join('') + '</div>';
}
function connectionCard(connection) {
  const managePath = '/connections/' + encodeURIComponent(connection.provider) + '/overview';
  return '<article class="card full connection-card">' +
    '<div class="connection-header"><div class="connection-identity"><span class="provider-mark" aria-hidden="true">G</span><div><h2>' + esc(connection.label) + '</h2><p>' + esc(connection.identityLabel || 'No account connected') + '</p></div></div>' + statusPill(connection.state, connection.statusLabel) + '</div>' +
    serviceRows(connection) +
    '<div class="connection-footer"><p>' + esc(connection.summary) + ' Last checked: ' + esc(formatTime(connection.lastCheckedAt)) + '.</p><a class="button-link" href="' + esc(managePath) + '" data-route-link>Manage ' + esc(connection.label) + ' connection</a></div>' +
  '</article>';
}
function onboardingCard(connection) {
  return '<article class="card full connection-card">' +
    '<div class="connection-header"><div class="connection-identity"><span class="provider-mark" aria-hidden="true">G</span><div><h2>Continue with Google</h2><p>One account can enable the Google services selected for this workspace.</p></div></div>' + statusPill('not-connected', 'Available') + '</div>' +
    '<div class="service-list">' + connection.services.map((service) =>
      '<article class="service-row"><div class="service-name"><strong>' + esc(service.label) + '</strong><span>' + esc(service.purpose) + '</span></div><div class="service-detail">Access is requested only for this selected outcome.</div><div class="service-detail">You choose a recognizable resource after sign-in when needed.</div><div></div></article>'
    ).join('') + '</div>' +
    '<div class="connection-footer"><p>Signing in does not publish tags, change campaigns, or spend money.</p>' + commandButton(connection.primaryAction) + '</div>' +
  '</article>';
}
function connectionActivity(connection, limit) {
  const entries = connection.services
    .filter((service) => service.lastCheckedAt)
    .sort((left, right) => Date.parse(right.lastCheckedAt) - Date.parse(left.lastCheckedAt))
    .slice(0, limit);
  if (!entries.length) return '<div class="empty-state"><strong>No connection activity yet.</strong><p>Connection checks and data updates will appear after Google is connected.</p></div>';
  return '<div class="list">' + entries.map((service) =>
    '<article class="list-item"><strong>' + esc(service.label + ' · ' + service.statusLabel) + '</strong><p>' + esc(formatTime(service.lastCheckedAt)) + ' · ' + esc(service.dataLabel) + '</p></article>'
  ).join('') + '</div>';
}
function connectionsIndex() {
  const connected = state.connections.filter((connection) => connection.connected);
  const available = state.connections.filter((connection) => connection.available && !connection.connected);
  const issue = connected
    .flatMap((connection) => connection.services.map((service) => ({ connection, service })))
    .find((item) => item.service.state !== 'current');
  const attention = issue
    ? '<section class="attention-panel"><strong>' + esc(issue.service.label + ' needs attention') + '</strong><p>' + esc(issue.service.issue || issue.service.dataLabel) + '</p>' + (issue.service.action ? commandButton(issue.service.action) : '') + '</section>'
    : '';
  const connectedSection = '<section><div class="section-heading"><div><h2>Your connections</h2><p>Accounts, selected resources, access, and the latest usable data.</p></div></div><div class="grid">' +
    (connected.length ? connected.map(connectionCard).join('') : '<article class="card full"><div class="empty-state"><strong>No provider is connected yet.</strong><p>Start with one available connection below. Unisane requests only the access needed for selected outcomes.</p></div></article>') +
    '</div></section>';
  const availableSection = '<section><div class="section-heading"><div><h2>Available connections</h2><p>Only complete and selectable provider flows appear here.</p></div></div><div class="grid">' +
    (available.length ? available.map(onboardingCard).join('') : '<article class="card full"><div class="empty-state"><strong>No additional connection is available.</strong><p>All currently supported providers are already connected.</p></div></article>') +
    '</div></section>';
  const activitySource = connected[0] ?? available[0];
  const activity = '<section><div class="section-heading"><div><h2>Connection activity</h2><p>Recent checks and data availability for this workspace.</p></div><a href="/activity" data-route-link>View all activity</a></div><article class="card full">' + (activitySource ? connectionActivity(activitySource, 4) : '') + '</article></section>';
  return attention + connectedSection + availableSection + activity;
}
function connectionOverview(connection) {
  return '<div class="grid"><article class="card wide"><h2>Connection summary</h2><p>' + esc(connection.summary) + '</p><div class="detail-stack">' +
    '<div class="detail-row"><div><strong>Connected account</strong><p>The Google identity used for this workspace.</p></div><div>' + esc(connection.identityLabel || 'Not available') + '</div></div>' +
    '<div class="detail-row"><div><strong>Project and environment</strong><p>Every connection action stays scoped to this context.</p></div><div>' + esc(humanize(state.platformId) + ' · ' + humanize(state.environment)) + '</div></div>' +
    '<div class="detail-row"><div><strong>Last verified</strong><p>The latest local connection check.</p></div><div>' + esc(formatTime(connection.lastCheckedAt)) + '</div></div>' +
  '</div>' + (connection.primaryAction ? commandButton(connection.primaryAction) : '') + '</article><article class="card"><h2>Selected services</h2><p>Each service keeps its own access, resource, and data state.</p><div class="metric-value">' + esc(String(connection.services.filter((service) => service.state === 'current').length)) + ' / ' + esc(String(connection.services.length)) + '</div><div class="metric-helper">services working</div></article><article class="card full connection-card"><div class="connection-header"><div><h2>Service health</h2><p>One issue never marks the other Google services as disconnected.</p></div>' + statusPill(connection.state, connection.statusLabel) + '</div>' + serviceRows(connection) + '</article><article class="card full"><div class="danger-zone"><h3>Disconnect Google</h3><p>Disconnecting stops future updates and dependent automations. Existing historical data remains, and provider-side tags or campaigns are not changed.</p><button class="button-link danger" type="button" data-action="show-disconnect" data-provider="' + esc(connection.provider) + '">Disconnect Google</button></div></article></div>';
}
function connectionAccess(connection) {
  return '<div class="grid"><article class="card full"><h2>Access by service</h2><p>Google access is evaluated independently. Adding a capability later requests only its additional access.</p><div class="detail-stack">' + connection.services.map((service) =>
    '<div class="detail-row"><div><strong>' + esc(service.label) + '</strong><p>' + esc(service.accessLabel) + '</p></div><div>' + statusPill(service.state, service.statusLabel) + (service.state === 'partial-permission' && service.action ? commandButton(service.action, 'secondary') : '') + '</div></div>'
  ).join('') + '</div></article></div>';
}
function connectionResources(connection) {
  return '<div class="grid"><article class="card full"><h2>Selected resources</h2><p>These are the recognizable sites, properties, containers, and accounts used in ' + esc(humanize(state.environment)) + '.</p><div class="detail-stack">' + connection.services.map((service) =>
    '<div class="detail-row"><div><strong>' + esc(service.label) + '</strong><p>' + esc(service.resource ? service.resource.type : 'No resource selected') + '</p></div><div><strong>' + esc(service.resource?.label || 'Selection required') + '</strong>' + (service.state === 'needs-resource' && service.action ? commandButton(service.action, 'secondary') : '') + '</div></div>'
  ).join('') + '</div></article></div>';
}
function connectionSync(connection) {
  return '<div class="grid"><article class="card full"><h2>Data availability</h2><p>Each service reports whether its latest usable data is current, warming up, or delayed.</p><div class="detail-stack">' + connection.services.map((service) =>
    '<div class="detail-row"><div><strong>' + esc(service.label) + '</strong><p>' + esc(service.dataLabel) + '</p></div><div>' + statusPill(service.state, service.statusLabel) + '<p>' + esc(formatTime(service.lastCheckedAt)) + '</p>' + ((service.state === 'syncing' || service.state === 'delayed' || service.state === 'failed') && service.action ? commandButton(service.action, 'secondary') : '') + '</div></div>'
  ).join('') + '</div></article></div>';
}
function connectionDetail(route) {
  const provider = route.path.split('/')[2];
  const connection = connectionByProvider(provider);
  if (!connection?.connected) {
    return '<div class="grid"><article class="card full"><div class="empty-state"><strong>This provider is not connected.</strong><p>Return to Connections to start the supported guided flow.</p><a class="button-link" href="/connections" data-route-link>All connections</a></div></article></div>';
  }
  const tab = route.id.split('.').pop();
  if (tab === 'access') return connectionAccess(connection);
  if (tab === 'resources') return connectionResources(connection);
  if (tab === 'data-sync') return connectionSync(connection);
  if (tab === 'activity') return '<div class="grid"><article class="card full"><h2>Connection activity</h2><p>Recent service checks and data availability. Technical identifiers stay out of the ordinary view.</p>' + connectionActivity(connection, 20) + '</article></div>';
  return connectionOverview(connection);
}
function pageHeaderAction(route) {
  if (route.family !== 'connections') return '';
  const available = state.connections.find((connection) => connection.available && !connection.connected);
  return available?.primaryAction ? commandButton(available.primaryAction, 'page-action') : '';
}
function pageSummary(route) {
  if (route.family === 'connections') return '';
  if (route.family === 'overview') {
    return '<section class="summary"><h2>' + esc(state.overview.headline) + '</h2><p>' + esc(state.overview.detail) + '</p></section>';
  }
  if (route.family === 'seo') {
    if (route.id === 'seo.overview') return '<section class="summary"><h2>' + esc(state.seo.overview.headline) + '</h2><p>' + esc(state.seo.overview.detail) + '</p></section>';
    if (route.id === 'seo.opportunities') return '<section class="summary"><h2>' + esc(state.seo.opportunities.length ? state.seo.opportunities.length + ' search improvements are supported by available evidence.' : 'No search improvement is supported by available evidence yet.') + '</h2><p>Every item is ranked from recorded page, query, or site-health evidence—not an unexplained model opinion.</p></section>';
    if (route.id === 'seo.pages') return '<section class="summary"><h2>' + esc(state.seo.pages.length ? state.seo.pages.length + ' pages have current search evidence.' : 'No page-level search evidence is available yet.') + '</h2><p>' + esc(state.seo.comparisonLabel + ' Pages are not labeled growing or declining without it.') + '</p></section>';
    if (route.id === 'seo.queries') return '<section class="summary"><h2>' + esc(state.seo.queries.length ? state.seo.queries.length + ' searches are visible in the available data.' : 'No search query evidence is available yet.') + '</h2><p>' + esc(state.seo.comparisonLabel + ' The console does not claim a demand or ranking cause without comparison evidence.') + '</p></section>';
    if (route.id === 'seo.site-health') return '';
    return '<section class="summary"><h2>' + esc(state.keywordResearch.matrix.length ? formatNumber(state.keywordResearch.matrix.length) + ' researched keywords are ready to compare and prioritize.' : 'No keyword research is available yet.') + '</h2><p>Use measured demand, market differences, intent clusters, questions, competitor gaps, and SERP evidence to decide what to target next.</p></section>';
  }
  if (route.family === 'connection-detail') {
    const connection = connectionByProvider(route.path.split('/')[2]);
    if (!connection?.connected) return '';
    const issue = connection.services.find((service) => service.state !== 'current');
    return '<section class="summary"><h2>' + esc(issue ? issue.label + ' needs attention' : connection.label + ' is working') + '</h2><p>' + esc(issue?.issue || connection.summary) + '</p></section>';
  }
  return '<section class="summary"><h2>' + esc(route.description) + '</h2><p>This page uses the active workspace and the latest usable data. Missing sources are explained rather than shown as zero.</p></section>';
}
function dialogs() {
  if (disconnectProvider) {
    const connection = connectionByProvider(disconnectProvider);
    if (!connection?.disconnect.command) return '';
    return '<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="disconnect-title"><h2 id="disconnect-title">' + esc(connection.disconnect.title) + '</h2><p>This action affects only ' + esc(humanize(state.platformId) + ' · ' + humanize(state.environment)) + '.</p><ul>' + connection.disconnect.consequences.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul><p><strong>Historical data remains available.</strong> Google-side tags, properties, and campaigns are left unchanged.</p><div class="dialog-actions"><button class="button-link secondary" type="button" data-action="close-dialog">Cancel</button><button class="button-link danger" type="button" data-action="confirm-disconnect">Confirm and copy command</button></div></section></div>';
  }
  if (commandAction) {
    return '<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="command-title"><h2 id="command-title">' + esc(commandAction.label) + '</h2><p>' + esc(commandAction.description) + '</p><div class="command-panel"><code>' + esc(commandAction.command) + '</code></div><p>Run this command in the project terminal. The command will still enforce its own confirmation and safety rules.</p><div class="dialog-actions"><button class="button-link secondary" type="button" data-action="close-dialog">Cancel</button><button class="button-link" type="button" data-action="copy-command">Copy command</button></div></section></div>';
  }
  if (seoDetail) {
    const kind = seoDetail.kind;
    const id = seoDetail.id;
    if (kind === 'page') {
      const page = state.seo.pages.find((item) => item.id === id);
      if (!page) return '';
      return '<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="seo-detail-title"><h2 id="seo-detail-title">' + esc(page.title) + '</h2><p>' + esc(page.statusDetail) + '</p><div class="summary-strip"><article class="summary-stat"><span>Organic clicks</span><strong>' + esc(page.clicks) + '</strong></article><article class="summary-stat"><span>Search views</span><strong>' + esc(page.searchViews) + '</strong></article><article class="summary-stat"><span>Average position</span><strong>' + esc(page.averagePosition ?? 'Not available') + '</strong></article></div><h3>Top searches</h3>' + (page.topQueries.length ? '<ul>' + page.topQueries.map((query) => '<li>' + esc(query) + '</li>').join('') + '</ul>' : '<p>No page-specific search is available.</p>') + (page.indexingWarning ? '<p><strong>Indexing warning:</strong> ' + esc(page.indexingWarning) + '</p>' : '') + '<p><strong>Next step:</strong> Review the page and its leading searches before creating an improvement plan.</p><details><summary>Technical details</summary><p>' + esc(page.fullUrl) + '</p><p>Click-through rate: ' + esc(page.clickThroughRate === undefined ? 'Not available' : page.clickThroughRate + '%') + '</p></details><div class="dialog-actions"><button class="button-link secondary" type="button" data-action="close-dialog">Close</button><a class="button-link" href="/seo/opportunities" data-route-link>Create improvement plan</a></div></section></div>';
    }
    if (kind === 'query') {
      const query = state.seo.queries.find((item) => item.id === id);
      if (!query) return '';
      return '<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="seo-detail-title"><h2 id="seo-detail-title">' + esc(query.query) + '</h2><p>Previous-period data is unavailable, so the console cannot claim whether demand, ranking, or click-through caused a change.</p><div class="summary-strip"><article class="summary-stat"><span>Organic clicks</span><strong>' + esc(query.clicks) + '</strong></article><article class="summary-stat"><span>Search views</span><strong>' + esc(query.searchViews) + '</strong></article><article class="summary-stat"><span>Average position</span><strong>' + esc(query.averagePosition ?? 'Not available') + '</strong></article></div><p><strong>Best page:</strong> ' + esc(query.bestPage?.title || 'Not available') + '</p><p><strong>Evidence:</strong> ' + esc(state.seo.sourceLabel + ' · ' + state.seo.freshnessLabel) + '</p><p><strong>Next step:</strong> Review the best page before changing content or targeting.</p><div class="dialog-actions"><button class="button-link secondary" type="button" data-action="close-dialog">Close</button><a class="button-link" href="/seo/pages" data-route-link>Review pages</a></div></section></div>';
    }
    const opportunity = state.seo.opportunities.find((item) => item.id === id);
    if (!opportunity) return '';
    return '<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="seo-detail-title"><h2 id="seo-detail-title">' + esc(opportunity.title) + '</h2><p><strong>Expected outcome:</strong> ' + esc(opportunity.expectedOutcome) + '</p><p>' + esc(opportunity.reason) + '</p><p><strong>Affected:</strong> ' + esc(opportunity.affectedLabel) + '</p><p><strong>Evidence:</strong> ' + esc(opportunity.evidence) + '</p><p>' + esc(opportunity.impactLabel + ' · ' + opportunity.confidenceLabel + ' · ' + opportunity.effortLabel + ' · ' + opportunity.freshnessLabel) + '</p><div class="dialog-actions"><button class="button-link secondary" type="button" data-action="close-dialog">Close</button><a class="button-link" href="' + esc(opportunity.action.path) + '" data-route-link>' + esc(opportunity.action.label) + '</a></div></section></div>';
  }
  return '';
}
function pageBody(route) {
  if (route.family === 'overview') {
    return overviewPage(route);
  }
  if (route.family === 'connections') {
    return connectionsIndex();
  }
  if (route.family === 'connection-detail') {
    return connectionDetail(route);
  }
  if (route.family === 'seo') {
    return seoPage(route);
  }
  if (route.family === 'activity') {
    return '<div class="grid"><article class="card wide"><h2>Recent activity</h2><p>Readable workspace outcomes from the latest local evidence.</p>' + recentActivity() + '</article><article class="card"><h2>What appears here</h2><p>Changes, data updates, errors, and approvals. Technical identifiers stay inside details.</p></article></div>';
  }
  if (route.id === 'settings.automations') {
    return '<div class="grid"><article class="card full"><div class="empty-state"><strong>No automation is ready to manage here yet.</strong><p>Recurring work will show its purpose, timing, last success, next run, and any dependency that needs attention.</p></div></article></div>';
  }
  if (route.family === 'settings') {
    return '<div class="grid"><article class="card"><h2>Navigation</h2><p>Your desktop sidebar preference is stored in this browser.</p></article><article class="card"><h2>Workspace</h2><p>' + esc(humanize(state.platformId)) + ' · ' + esc(humanize(state.environment)) + '</p></article></div>';
  }
  if (route.family === 'help') {
    return '<div class="grid"><article class="card wide"><h2>Start with what needs attention</h2><p>' + esc(state.priorities[0]?.expectedOutcome || state.overview.detail) + '</p><a class="button-link" href="/overview" data-route-link>Return to overview</a></article><article class="card"><h2>Technical details</h2><p>Use the structured CLI when you need exact identifiers, paths, or diagnostic records.</p></article></div>';
  }
  return '<div class="grid">' + metricCards(route) + '<article class="card full"><h2>Priorities</h2><p>The most useful actions for this channel.</p>' + contextualPriorities(route) + '</article><article class="card"><h2>Source and freshness</h2><p>' + esc(freshness().label) + '</p><a class="button-link" href="/connections" data-route-link>Review source</a></article></div>';
}
function render() {
  const route = currentRoute();
  if (normalizePath(location.pathname) !== route.path && route.family !== 'connection-detail') {
    history.replaceState({}, '', route.path);
  }
  const fresh = freshness();
  const production = String(state.environment).toLowerCase().includes('production');
  const timeControls = route.timeAnalysis
    ? '<button class="filter-button" type="button" aria-label="Date range">' + esc(state.dateWindow.label) + '</button><button class="filter-button" type="button" aria-label="Comparison period">Compare: previous period</button>'
    : '';
  const projectInitial = humanize(state.platformId).slice(0, 1) || 'U';
  app.innerHTML =
    '<div class="shell' + (collapsed ? ' is-collapsed' : '') + (mobileOpen ? ' mobile-open' : '') + '">' +
      '<button class="sidebar-backdrop" type="button" data-action="close-navigation" aria-label="Close navigation"></button>' +
      '<aside class="sidebar" aria-label="Primary navigation">' +
        '<div class="brand"><span class="brand-mark">U</span><div class="brand-copy"><strong>Unisane Ops</strong><span>Growth workspace</span></div></div>' +
        '<div class="project-context"><button class="project-button" type="button" data-action="toggle-project-menu" aria-haspopup="listbox" aria-expanded="' + String(projectMenuOpen) + '"><span class="project-avatar">' + esc(projectInitial) + '</span><span class="project-copy"><strong>' + esc(humanize(state.platformId)) + '</strong><span>' + esc(humanize(state.appId)) + '</span></span><span class="environment' + (production ? ' production' : '') + '">' + esc(state.environment) + '</span></button><div class="project-menu" role="listbox"' + (projectMenuOpen ? '' : ' hidden') + '><p><strong>' + esc(humanize(state.platformId)) + '</strong><br>' + esc(humanize(state.appId)) + '<br>' + esc(humanize(state.environment)) + '</p></div></div>' +
        '<nav class="nav-scroll">' + navigation(route) + '</nav>' +
        '<div class="sidebar-footer"><nav>' + footerNavigation(route) + '</nav><div class="user-context"><span class="user-dot">L</span><span class="user-copy">Local workspace</span></div></div>' +
      '</aside>' +
      '<section class="workspace">' +
        '<header class="topbar"><div class="topbar-start"><button class="icon-button mobile-menu" type="button" data-action="open-navigation" aria-label="Open navigation">☰</button><button class="icon-button desktop-collapse" type="button" data-action="toggle-collapse" aria-label="' + (collapsed ? 'Expand navigation' : 'Collapse navigation') + '">' + (collapsed ? '→' : '←') + '</button><div class="topbar-title"><strong>' + esc(route.title) + '</strong><span>' + esc(state.dateWindow.label) + '</span></div></div><div class="topbar-actions">' + timeControls + '<a class="freshness-link' + (fresh.attention ? ' attention' : '') + '" href="/connections" data-route-link aria-label="' + esc(fresh.label) + '"><span aria-hidden="true">↻</span><span>' + esc(fresh.label) + '</span></a></div></header>' +
        '<main class="content"><header class="page-header"><div><p class="eyebrow">' + esc(route.family === 'overview' ? 'Workspace' : humanize(route.family)) + '</p><h1 tabindex="-1">' + esc(route.title) + '</h1><p class="page-description">' + esc(route.description) + '</p><p class="context-line">' + esc(humanize(state.platformId) + ' · ' + humanize(state.environment)) + '</p></div>' + pageHeaderAction(route) + '</header>' + pageTabs(route) + pageSummary(route) + pageBody(route) + '</main>' +
      '</section>' +
    '</div>' + dialogs() + (notice ? '<div class="toast" role="status" aria-live="polite">' + esc(notice) + '</div>' : '');
  bind();
}
function closeNavigation() {
  mobileOpen = false;
  document.body.classList.remove('nav-open');
  render();
  if (restoreFocusTo) {
    restoreFocusTo.focus();
    restoreFocusTo = null;
  }
}
function navigate(path) {
  history.pushState({}, '', path);
  mobileOpen = false;
  projectMenuOpen = false;
  seoSearch = '';
  seoStatus = 'all';
  researchMarket = 'all';
  researchCluster = 'all';
  researchSort = 'volume';
  researchPage = 1;
  seoDetail = null;
  dialogTrigger = null;
  document.body.classList.remove('nav-open');
  render();
  document.querySelector('h1')?.focus?.();
}
function findConnectionAction(id) {
  for (const connection of state.connections) {
    if (connection.primaryAction?.id === id) return connection.primaryAction;
    const serviceAction = connection.services.find((service) => service.action?.id === id)?.action;
    if (serviceAction) return serviceAction;
  }
  return null;
}
function closeDialog() {
  const trigger = dialogTrigger;
  commandAction = null;
  disconnectProvider = null;
  seoDetail = null;
  dialogTrigger = null;
  render();
  if (trigger?.type === 'command') {
    app.querySelector('[data-command-id="' + trigger.id + '"]')?.focus();
  } else if (trigger?.type === 'disconnect') {
    app.querySelector('[data-action="show-disconnect"][data-provider="' + trigger.provider + '"]')?.focus();
  } else if (trigger?.type === 'seo') {
    app.querySelector('[data-action="inspect-seo"][data-seo-id="' + trigger.id + '"]')?.focus();
  } else {
    app.querySelector('h1')?.focus();
  }
}
async function copyCommand(command, message) {
  try {
    await navigator.clipboard.writeText(command);
    notice = message;
  } catch {
    notice = 'Copy was unavailable. Select the command shown and copy it manually.';
  }
  commandAction = null;
  disconnectProvider = null;
  seoDetail = null;
  dialogTrigger = null;
  render();
  app.querySelector('h1')?.focus();
}
function bind() {
  app.querySelectorAll('[data-route-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(link.getAttribute('href'));
    });
  });
  app.querySelector('[data-action="toggle-collapse"]')?.addEventListener('click', () => {
    collapsed = !collapsed;
    localStorage.setItem('unisane-ops-sidebar-collapsed', String(collapsed));
    render();
  });
  app.querySelector('[data-action="open-navigation"]')?.addEventListener('click', (event) => {
    restoreFocusTo = event.currentTarget;
    mobileOpen = true;
    document.body.classList.add('nav-open');
    render();
    app.querySelector('.sidebar .nav-link')?.focus();
  });
  app.querySelector('[data-action="close-navigation"]')?.addEventListener('click', closeNavigation);
  app.querySelector('[data-action="toggle-project-menu"]')?.addEventListener('click', () => {
    projectMenuOpen = !projectMenuOpen;
    render();
  });
  app.querySelectorAll('[data-action="show-command"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-command-id');
      const action = findConnectionAction(id);
      if (!action) return;
      dialogTrigger = { type: 'command', id };
      commandAction = action;
      notice = '';
      render();
      app.querySelector('.dialog button')?.focus();
    });
  });
  app.querySelectorAll('[data-action="inspect-seo"]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.getAttribute('data-seo-kind');
      const id = button.getAttribute('data-seo-id');
      if (!kind || !id) return;
      dialogTrigger = { type: 'seo', id };
      seoDetail = { kind, id };
      render();
      app.querySelector('.dialog button')?.focus();
    });
  });
  app.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const [collection, key] = String(button.getAttribute('data-sort')).split(':');
      if (!collection || !key) return;
      seoSort[collection] = key;
      render();
    });
  });
  app.querySelectorAll('[data-research-view]').forEach((button) => {
    button.addEventListener('click', () => {
      seoResearchView = button.getAttribute('data-research-view') || 'keywords';
      seoSearch = '';
      researchPage = 1;
      render();
    });
  });
  app.querySelector('[data-research-search]')?.addEventListener('input', (event) => {
    seoSearch = event.currentTarget.value;
    researchPage = 1;
    const cursor = event.currentTarget.selectionStart;
    render();
    const input = app.querySelector('[data-research-search]');
    input?.focus();
    if (cursor !== null) input?.setSelectionRange(cursor, cursor);
  });
  app.querySelector('[data-research-market]')?.addEventListener('change', (event) => {
    researchMarket = event.currentTarget.value;
    researchPage = 1;
    render();
  });
  app.querySelector('[data-research-cluster]')?.addEventListener('change', (event) => {
    researchCluster = event.currentTarget.value;
    researchPage = 1;
    render();
  });
  app.querySelector('[data-research-sort]')?.addEventListener('change', (event) => {
    researchSort = event.currentTarget.value;
    researchPage = 1;
    render();
  });
  app.querySelectorAll('[data-research-page]').forEach((button) => {
    button.addEventListener('click', () => {
      researchPage = Number(button.getAttribute('data-research-page')) || 1;
      render();
      app.querySelector('.research-result-line')?.scrollIntoView({ block: 'start' });
    });
  });
  const applySeoFilters = () => {
    const search = seoSearch.trim().toLowerCase();
    app.querySelectorAll('[data-seo-search-value]').forEach((item) => {
      const matchesSearch = !search || String(item.getAttribute('data-seo-search-value')).toLowerCase().includes(search);
      const status = item.getAttribute('data-seo-status');
      const matchesStatus = seoStatus === 'all' || status === seoStatus;
      item.hidden = !(matchesSearch && matchesStatus);
    });
  };
  app.querySelector('[data-seo-filter]')?.addEventListener('input', (event) => {
    seoSearch = event.currentTarget.value;
    applySeoFilters();
  });
  app.querySelector('[data-seo-status-filter]')?.addEventListener('change', (event) => {
    seoStatus = event.currentTarget.value;
    applySeoFilters();
  });
  applySeoFilters();
  app.querySelector('[data-action="show-disconnect"]')?.addEventListener('click', (event) => {
    const provider = event.currentTarget.getAttribute('data-provider');
    if (!provider) return;
    dialogTrigger = { type: 'disconnect', provider };
    disconnectProvider = provider;
    notice = '';
    render();
    app.querySelector('.dialog button')?.focus();
  });
  app.querySelectorAll('[data-action="close-dialog"]').forEach((control) => {
    control.addEventListener('click', (event) => {
      if (control.classList.contains('dialog-backdrop') && event.target !== control) return;
      closeDialog();
    });
  });
  app.querySelector('[data-action="copy-command"]')?.addEventListener('click', () => {
    if (commandAction) void copyCommand(commandAction.command, 'Command copied. Run it in the project terminal when ready.');
  });
  app.querySelector('[data-action="confirm-disconnect"]')?.addEventListener('click', () => {
    const connection = disconnectProvider ? connectionByProvider(disconnectProvider) : null;
    if (connection?.disconnect.command) {
      void copyCommand(connection.disconnect.command, 'Disconnect command copied. Run it in the project terminal to complete the confirmed action.');
    }
  });
}
window.addEventListener('popstate', render);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && (commandAction || disconnectProvider || seoDetail)) {
    closeDialog();
    return;
  }
  if (event.key === 'Escape' && mobileOpen) closeNavigation();
  if (event.key === 'Escape' && projectMenuOpen) {
    projectMenuOpen = false;
    render();
  }
});
render();
`;
