import type { MarketingConsoleState } from '@unisane/growth/console';

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
  return `<!doctype html>
<html lang="en" class="light" data-theme-mode="light" data-density="standard" data-radius="standard" data-action-shape="standard" data-contrast="standard" data-elevation="flat">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Console - ${escapeHtml(state.appId)}</title>
${unisaneUiStylesheet}    <meta name="color-scheme" content="light" />
    <style>${marketingConsoleCss}</style>
  </head>
  <body>
    <div id="app"></div>
    <script id="marketing-console-state" type="application/json">${serializeInlineJson(state)}</script>
    <script>${marketingConsoleJs}</script>
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

export const marketingConsoleCss = `
:root {
  color-scheme: light;
  --mc-page-gutter: 24px;
  --mc-sidebar-width: 232px;
  --mc-sidebar-rail-width: 84px;
  --mc-inspector-width: 328px;
}
* { box-sizing: border-box; }
html, body, #app {
  height: 100%;
}
body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-on-surface);
  font-family: var(--font-sans);
  overflow: hidden;
}
button, input { font: inherit; }
.shell {
  height: 100dvh;
  min-height: 0;
  display: grid;
  grid-template-columns: var(--mc-sidebar-width) minmax(0, 1fr);
  background: var(--color-surface-container-low);
  overflow: hidden;
}
.shell.sidebar-collapsed {
  grid-template-columns: var(--mc-sidebar-rail-width) minmax(0, 1fr);
}
.sidebar {
  min-width: 0;
  background: var(--color-surface-container-low);
  padding: 10px;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: width var(--duration-medium) var(--ease-standard), transform var(--duration-medium) var(--ease-standard);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 6px 6px 14px 8px;
}
.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  font-size: var(--type-label-large-size);
  line-height: var(--type-label-large-line);
  font-weight: var(--type-label-large-weight);
  letter-spacing: var(--type-label-large-tracking);
}
.brand-text {
  min-width: 0;
  flex: 1;
}
.brand h1 {
  margin: 0;
  font-size: var(--type-title-medium-size);
  line-height: var(--type-title-medium-line);
  font-weight: var(--type-title-medium-weight);
  letter-spacing: var(--type-title-medium-tracking);
}
.brand p {
  margin: 6px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.shell.sidebar-collapsed .brand-text,
.shell.sidebar-collapsed .nav-label {
  display: none;
}
.shell.sidebar-collapsed .brand {
  justify-content: center;
  flex-direction: row;
  gap: 0;
  padding-inline: 0;
}
.shell.sidebar-collapsed .brand-mark {
  width: 40px;
  height: 40px;
}
.shell.sidebar-collapsed .nav a {
  justify-content: center;
  min-height: 44px;
  padding: 9px;
}
.shell.sidebar-collapsed .nav-icon {
  display: grid;
  margin: 0;
}
.nav {
  display: grid;
  gap: 2px;
  padding: 6px 0 8px;
  overflow-y: auto;
  min-height: 0;
}
.nav a {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  text-decoration: none;
  font-size: var(--type-label-large-size);
  line-height: var(--type-label-large-line);
  font-weight: var(--type-label-large-weight);
  letter-spacing: var(--type-label-large-tracking);
  transition: background var(--duration-short) var(--ease-standard), color var(--duration-short) var(--ease-standard);
}
.nav-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: transparent;
  color: var(--color-on-surface-variant);
}
.nav-symbol {
  width: 19px;
  height: 19px;
  display: block;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nav-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav a.active {
  background: var(--color-surface);
  color: var(--color-on-primary-container);
}
.nav a.active .nav-icon {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}
.nav a:hover { background: color-mix(in srgb, var(--color-surface) 66%, transparent); }
.icon-button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-on-surface-variant);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--duration-short) var(--ease-standard), color var(--duration-short) var(--ease-standard);
}
.icon-button:hover {
  background: var(--color-state-hover);
  color: var(--color-on-surface);
}
.icon-button .icon {
  display: block;
  position: relative;
  width: 18px;
  height: 18px;
}
.icon.sidebar-panel::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-color: currentColor;
  border-style: solid;
  border-width: 1.5px;
  border-radius: 3px;
}
.icon.sidebar-panel::after {
  content: '';
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 7px;
  width: 1.5px;
  border-radius: var(--radius-full);
  background: currentColor;
}
.icon.close::before,
.icon.close::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 3px;
  width: 12px;
  height: 2px;
  border-radius: var(--radius-full);
  background: currentColor;
}
.icon.close::before { transform: rotate(45deg); }
.icon.close::after { transform: rotate(-45deg); }
.icon.menu::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 4px;
  width: 12px;
  height: 2px;
  border-radius: var(--radius-full);
  background: currentColor;
  box-shadow: 0 5px 0 currentColor, 0 10px 0 currentColor;
}
.icon.panel::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
}
.icon.panel::after {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  right: 6px;
  width: 1.5px;
  border-radius: var(--radius-full);
  background: currentColor;
}
.topbar {
  min-height: 76px;
  background: var(--color-surface);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px var(--mc-page-gutter);
  border-bottom: 1px solid var(--color-outline-subtle);
  flex: 0 0 auto;
}
.topbar-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-title {
  min-width: 0;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.mobile-menu-button {
  display: none;
}
.sidebar-toggle-button {
  display: inline-grid;
  flex: 0 0 auto;
}
.topbar h2 {
  margin: 0;
  font-size: var(--type-title-large-size);
  line-height: var(--type-title-large-line);
  font-weight: var(--type-title-large-weight);
  letter-spacing: var(--type-title-large-tracking);
}
.topbar p {
  margin: 4px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.workspace {
  min-width: 0;
  min-height: 0;
  margin: 8px 8px 8px 0;
  background: var(--color-surface);
  border: 1px solid var(--color-outline-soft);
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--mc-inspector-width);
}
.shell.inspector-closed .workspace {
  grid-template-columns: minmax(0, 1fr) 0;
}
.main {
  min-width: 0;
  min-height: 0;
  margin: 0;
  background: var(--color-surface);
  border: 0;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.content {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px var(--mc-page-gutter) 40px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  flex: 1 1 auto;
}
.inspector {
  min-width: 0;
  background: var(--color-surface);
  border: 0;
  border-left: 1px solid var(--color-outline-subtle);
  border-radius: 0;
  margin: 0;
  padding: 16px;
  height: 100%;
  overflow: auto;
  transition: transform var(--duration-medium) var(--ease-standard), opacity var(--duration-medium) var(--ease-standard);
}
.shell.inspector-closed .inspector {
  transform: translateX(18px);
  opacity: 0;
  pointer-events: none;
}
.inspector-shell-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.inspector-shell-title {
  min-width: 0;
}
.inspector-shell-title h3 {
  margin: 0;
  font-size: var(--type-title-medium-size);
  line-height: var(--type-title-medium-line);
  font-weight: var(--type-title-medium-weight);
  letter-spacing: var(--type-title-medium-tracking);
}
.inspector-shell-title p {
  margin: 4px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.sidebar-backdrop,
.inspector-backdrop {
  display: none;
}
.page-grid {
  display: grid;
  gap: 18px;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.card-header {
  padding: 17px 18px 8px;
}
.card-header h3 {
  margin: 0;
  font-size: var(--type-title-medium-size);
  line-height: var(--type-title-medium-line);
  font-weight: var(--type-title-medium-weight);
  letter-spacing: var(--type-title-medium-tracking);
}
.card-header p {
  margin: 5px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.card-body { padding: 16px; }
.section-block {
  background: transparent;
  border: 0;
  min-width: 0;
}
.section-header {
  padding: 2px 2px 14px;
}
.section-header h3 {
  margin: 0;
  font-size: var(--type-title-medium-size);
  line-height: var(--type-title-medium-line);
  font-weight: var(--type-title-medium-weight);
  letter-spacing: var(--type-title-medium-tracking);
}
.section-header p {
  margin: 6px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.section-body {
  min-width: 0;
}
.metric {
  padding: 14px;
  background: var(--color-surface-container-low);
  border: 0;
  min-width: 0;
}
.metric .label {
  color: var(--color-on-surface-variant);
  font-size: var(--type-label-medium-size);
  line-height: var(--type-label-medium-line);
  font-weight: var(--type-label-medium-weight);
  letter-spacing: var(--type-label-medium-tracking);
}
.metric .value {
  margin-top: 8px;
  font-size: var(--type-headline-small-size);
  line-height: var(--type-headline-small-line);
  font-weight: var(--type-headline-small-weight);
  letter-spacing: var(--type-headline-small-tracking);
}
.metric .helper {
  margin-top: 9px;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--type-label-small-size);
  line-height: var(--type-label-small-line);
  font-weight: var(--type-label-small-weight);
  letter-spacing: var(--type-label-small-tracking);
  text-transform: uppercase;
  white-space: nowrap;
}
.pill.ready { color: var(--color-on-success-container); background: var(--color-success-container); }
.pill.warn { color: var(--color-on-warning-container); background: var(--color-warning-container); }
.pill.blocked { color: var(--color-on-error-container); background: var(--color-error-container); }
.pill.missing { color: var(--color-on-info-container); background: var(--color-info-container); }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 18px;
  align-items: stretch;
}
.score {
  display: grid;
  align-items: center;
  justify-items: center;
  padding: 18px;
}
.score-ring {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(var(--color-primary) calc(var(--score) * 1%), var(--color-surface-container-high) 0);
}
.score-ring span {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--color-surface);
  display: grid;
  place-items: center;
  font-size: var(--type-headline-medium-size);
  line-height: var(--type-headline-medium-line);
  font-weight: var(--type-headline-medium-weight);
  letter-spacing: var(--type-headline-medium-tracking);
}
.chart {
  width: 100%;
  height: 220px;
}
.bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) 74px;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-outline-subtle) 72%, transparent);
}
.bar-row:last-child { border-bottom: 0; }
.bar-label {
  color: var(--color-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--type-label-medium-size);
  line-height: var(--type-label-medium-line);
  font-weight: var(--type-label-medium-weight);
  letter-spacing: var(--type-label-medium-tracking);
}
.bar-track { height: 8px; border-radius: var(--radius-full); background: var(--color-surface-container-high); overflow: hidden; }
.bar-fill { height: 100%; border-radius: var(--radius-full); background: var(--color-primary); }
.bar-value {
  text-align: right;
  color: var(--color-on-surface-variant);
  font-size: var(--type-label-medium-size);
  line-height: var(--type-label-medium-line);
  font-weight: var(--type-label-medium-weight);
  letter-spacing: var(--type-label-medium-tracking);
}
.matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.matrix-cell {
  border: 0;
  border-radius: var(--radius-sm);
  padding: 16px;
  background: var(--color-surface-container-low);
  min-width: 0;
}
.matrix-cell h4 {
  margin: 0;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.matrix-cell p {
  margin: 10px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
  overflow-wrap: anywhere;
}
.list { display: grid; gap: 9px; }
.item {
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
  padding: 13px;
  min-width: 0;
}
.item-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.item h4 {
  margin: 0;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.item p {
  margin: 7px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
  overflow-wrap: anywhere;
}
.command {
  margin-top: 9px;
  padding: 8px;
  border-radius: 6px;
  background: var(--color-inverse-surface, #111827);
  color: var(--color-inverse-on-surface, #f8fafc);
  font-size: var(--type-label-small-size);
  line-height: var(--type-label-small-line);
  font-weight: var(--type-label-small-weight);
  letter-spacing: var(--type-label-small-tracking);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-lowest);
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  border-bottom: 1px solid color-mix(in srgb, var(--color-outline-subtle) 70%, transparent);
  padding: 10px 8px;
  text-align: left;
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.table th {
  color: var(--color-on-surface-variant);
  font-size: var(--type-label-medium-size);
  line-height: var(--type-label-medium-line);
  font-weight: var(--type-label-medium-weight);
  letter-spacing: var(--type-label-medium-tracking);
}
.table-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--type-label-medium-weight);
}
.table-link:hover {
  text-decoration: underline;
}
.path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--type-label-small-size);
  line-height: var(--type-label-small-line);
  font-weight: var(--type-label-small-weight);
  letter-spacing: var(--type-label-small-tracking);
  color: var(--color-on-surface-variant);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  overflow-wrap: anywhere;
}
.empty {
  border: 0;
  border-radius: var(--radius-sm);
  padding: 18px;
  background: var(--color-surface-container-low);
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-medium-size);
  line-height: var(--type-body-medium-line);
  font-weight: var(--type-body-medium-weight);
  letter-spacing: var(--type-body-medium-tracking);
}
.inspector-note {
  margin: 12px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.pane-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin: 0 0 14px;
  padding: 3px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
}
.pane-tab {
  min-height: 30px;
  border: 0;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  font-size: var(--type-label-small-size);
  line-height: var(--type-label-small-line);
  font-weight: var(--type-label-small-weight);
  letter-spacing: var(--type-label-small-tracking);
}
.pane-tab.active {
  background: var(--color-surface);
  color: var(--color-on-surface);
}
.research-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 14px;
}
.research-nav a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-lowest);
  text-decoration: none;
  font-size: var(--type-label-small-size);
  line-height: var(--type-label-small-line);
  font-weight: var(--type-label-small-weight);
  letter-spacing: var(--type-label-small-tracking);
}
.research-nav a.active {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}
.evidence-list {
  display: grid;
  gap: 8px;
}
.evidence-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
}
.evidence-row h4 {
  margin: 0;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.evidence-row p {
  margin: 4px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.assistant-thread {
  display: grid;
  gap: 10px;
}
.assistant-message {
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
  padding: 12px;
}
.assistant-message h4 {
  margin: 0 0 6px;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.assistant-message p {
  margin: 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.workflow-step {
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
  min-width: 0;
}
.workflow-step h4 {
  margin: 10px 0 6px;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.workflow-step p {
  margin: 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.command-cta {
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
  padding: 14px;
  min-width: 0;
}
.command-cta h4 {
  margin: 0 0 6px;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.command-cta p {
  margin: 0 0 10px;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.status-card,
.decision-card {
  min-width: 0;
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
}
.status-card-head,
.decision-card-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}
.status-card h4,
.decision-card h4 {
  margin: 0;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.status-card p,
.decision-card p {
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
  overflow-wrap: anywhere;
}
.decision-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.decision-card.strong {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}
.decision-card.strong p {
  color: var(--color-on-primary-container);
}
.empty-state {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-container-low);
}
.empty-state h4 {
  margin: 0;
  font-size: var(--type-title-small-size);
  line-height: var(--type-title-small-line);
  font-weight: var(--type-title-small-weight);
  letter-spacing: var(--type-title-small-tracking);
}
.empty-state p {
  margin: 0;
  color: var(--color-on-surface-variant);
  font-size: var(--type-body-small-size);
  line-height: var(--type-body-small-line);
  font-weight: var(--type-body-small-weight);
  letter-spacing: var(--type-body-small-tracking);
}
.compact-table .table th,
.compact-table .table td {
  white-space: nowrap;
}
.compact-table .table td:first-child,
.compact-table .table th:first-child {
  white-space: normal;
}
@media (max-width: 1120px) {
  .shell,
  .shell.sidebar-collapsed,
  .shell.inspector-closed,
  .shell.sidebar-collapsed.inspector-closed {
    grid-template-columns: var(--mc-sidebar-width) minmax(0, 1fr);
  }
  .workspace {
    margin-right: 8px;
    border-radius: 10px;
    grid-template-columns: minmax(0, 1fr);
  }
  .inspector {
    position: fixed;
    z-index: 40;
    right: 8px;
    top: 0;
    width: min(380px, calc(100vw - 24px));
    height: calc(100dvh - 16px);
    margin: 8px;
    border: 1px solid var(--color-outline-soft);
    border-radius: 10px;
  }
  .shell.inspector-closed .inspector {
    transform: translateX(calc(100% + 16px));
  }
  .inspector-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 35;
    background: color-mix(in srgb, var(--color-scrim, #000) 22%, transparent);
  }
  .shell.inspector-closed .inspector-backdrop {
    display: none;
  }
  .metrics { grid-template-columns: repeat(3, minmax(130px, 1fr)); }
}
@media (max-width: 760px) {
  :root { --mc-page-gutter: 16px; }
  .shell,
  .shell.sidebar-collapsed,
  .shell.inspector-closed,
  .shell.sidebar-collapsed.inspector-closed {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar {
    position: fixed;
    z-index: 50;
    inset: 0 auto 0 0;
    width: min(288px, calc(100vw - 40px));
    transform: translateX(-100%);
    border-right: 1px solid var(--color-outline-soft);
  }
  .shell.mobile-nav-open .sidebar {
    transform: translateX(0);
  }
  .shell.sidebar-collapsed .brand-text,
  .shell.sidebar-collapsed .nav-label {
    display: block;
  }
  .shell.sidebar-collapsed .brand {
    justify-content: flex-start;
    flex-direction: row;
    gap: 10px;
    padding: 6px 8px 14px;
  }
  .shell.sidebar-collapsed .nav a {
    justify-content: flex-start;
    min-height: 38px;
    padding: 8px 12px;
  }
  .shell.sidebar-collapsed .nav-icon {
    display: grid;
  }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: color-mix(in srgb, var(--color-scrim, #000) 28%, transparent);
  }
  .shell:not(.mobile-nav-open) .sidebar-backdrop {
    display: none;
  }
  .mobile-menu-button {
    display: inline-grid;
  }
  .sidebar-toggle-button {
    display: none;
  }
  .workspace {
    margin: 0;
    border: 0;
    border-radius: 0;
  }
  .main { height: 100dvh; }
  .topbar {
    min-height: 64px;
    align-items: center;
  }
  .topbar-main {
    flex: 1;
  }
  .topbar p {
    display: none;
  }
  .content { padding: 16px; }
  .inspector {
    inset: 0;
    width: 100vw;
    height: 100dvh;
    margin: 0;
    border: 0;
    border-radius: 0;
  }
  .hero, .grid-2, .grid-3, .metrics { grid-template-columns: 1fr; }
  .workflow-grid { grid-template-columns: 1fr; }
}
`;

export const marketingConsoleJs = `
const state = JSON.parse(document.getElementById('marketing-console-state').textContent);
const app = document.getElementById('app');
const routes = new Map(state.routes.map((route) => [route.id, route]));
const shellPrefs = {
  sidebarCollapsed: readStoredFlag('marketing-console-sidebar-collapsed', false),
  inspectorOpen: !isCompactViewport(),
  mobileNavOpen: false,
  inspectorMode: 'inspector',
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function readStoredFlag(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value === '1';
  } catch {
    return fallback;
  }
}
function storeFlag(key, value) {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    void key;
  }
}
function isCompactViewport() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1120px)').matches;
}
function routeId() {
  const raw = location.hash.replace(/^#\\/?/, '') || 'overview';
  const base = raw.split('/')[0] || 'overview';
  return routes.has(base) ? base : 'overview';
}
function routeParts() {
  const raw = location.hash.replace(/^#\\/?/, '') || 'overview';
  return raw.split('/').filter(Boolean);
}
function pill(status, label = status) {
  return '<span class="pill ' + esc(status) + '">' + esc(label) + '</span>';
}
function providerLabel(provider) {
  return ({
    googleAds: 'Google Ads',
    metaAds: 'Meta Ads',
    ga4: 'GA4',
    searchConsole: 'Search Console',
    confirmedConversions: 'Confirmed conversions',
    strategyMap: 'Strategy map',
    gtm: 'GTM',
  })[provider] ?? String(provider ?? '');
}
function reportTypeLabel(reportType) {
  return ({
    campaign: 'campaign',
    keyword: 'keyword',
    conversion: 'conversion',
    adSet: 'ad set',
    ad: 'ad',
    creative: 'creative',
    landingPage: 'landing page',
    channel: 'channel',
    sourceMedium: 'source / medium',
    queryPage: 'query/page',
    page: 'page',
    query: 'query',
  })[reportType] ?? String(reportType ?? '');
}
function reportPullCommand(provider, reportType) {
  return 'unisane growth marketing pull-api --provider ' + provider + ' --report ' + reportType + ' --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>';
}
function gtmValidateCommand() {
  return 'unisane growth gtm validate --manifest <path> --app ' + state.appId + ' --env ' + state.environment;
}
function routeIcon(routeIdValue) {
  const paths = {
    overview: '<rect x="4" y="4" width="6" height="6" rx="1.5"></rect><rect x="14" y="4" width="6" height="6" rx="1.5"></rect><rect x="4" y="14" width="6" height="6" rx="1.5"></rect><rect x="14" y="14" width="6" height="6" rx="1.5"></rect>',
    setup: '<path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle>',
    proof: '<path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3z"></path><path d="M8.5 12l2.2 2.2 4.8-5"></path>',
    performance: '<path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M7 15l3.5-3.5 3 2.5L19 8"></path>',
    ads: '<path d="M5 11v4a2 2 0 0 0 2 2h2l2 3v-3h1l7 3V6l-7 3H7a2 2 0 0 0-2 2z"></path><path d="M19 9v8"></path>',
    seo: '<circle cx="10.5" cy="10.5" r="5.5"></circle><path d="M15 15l5 5"></path><path d="M8.5 10.8l1.5 1.5 3-3.5"></path>',
    research: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z"></path><path d="M8 7h8"></path><path d="M8 11h7"></path><path d="M8 15h5"></path>',
    analytics: '<path d="M5 19V9"></path><path d="M12 19V5"></path><path d="M19 19v-7"></path><path d="M3.5 19h17"></path>',
    gtm: '<path d="M4 5h16v5H4z"></path><path d="M7 10v9"></path><path d="M17 10v9"></path><path d="M4 19h16"></path>',
    recommendations: '<path d="M9 18h6"></path><path d="M10 21h4"></path><path d="M8 13a6 6 0 1 1 8 0c-1.2 1-1.5 2-1.5 3h-5c0-1-.3-2-1.5-3z"></path>',
    receipts: '<path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z"></path><path d="M9 8h6"></path><path d="M9 12h6"></path><path d="M9 16h4"></path>',
    schedule: '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M4 10h16"></path><path d="M8 14h3"></path><path d="M14 14h2"></path>',
  };
  return '<svg class="nav-symbol" viewBox="0 0 24 24" aria-hidden="true">' + (paths[routeIdValue] ?? paths.overview) + '</svg>';
}
function card(title, description, body) {
  return '<section class="section-block"><div class="section-header"><h3>' + esc(title) + '</h3><p>' + esc(description) + '</p></div><div class="section-body">' + body + '</div></section>';
}
function empty(text) {
  return '<div class="empty">' + esc(text) + '</div>';
}
function metricCard(metric) {
  return '<div class="card metric"><div class="label">' + esc(metric.label) + '</div><div class="value">' + esc(metric.value) + '</div><div class="helper">' + esc(metric.helper ?? '') + '</div></div>';
}
function metricById(id) {
  return state.metrics.find((metric) => metric.id === id);
}
function metricCards(ids) {
  return ids.map((id) => metricById(id)).filter(Boolean).map(metricCard).join('');
}
function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}
function statusCard(title, status, message, detail) {
  return '<article class="status-card"><div class="status-card-head"><h4>' + esc(title) + '</h4>' + pill(status) + '</div><p>' + esc(message) + '</p>' + (detail ? '<p class="path">' + esc(detail) + '</p>' : '') + '</article>';
}
function providerState(provider) {
  return proofProvider(provider)?.state ?? (provider === 'gtm' || provider === 'confirmedConversions' ? 'configured' : 'planned');
}
function providerPhase(provider) {
  return providerState(provider) === 'configured' ? 'Active now' : providerState(provider) === 'disabled' ? 'Off' : 'Planned later';
}
function friendlyProofMessage(provider, item) {
  if (providerState(provider) === 'planned' && item?.evidenceStatus !== 'pass') {
    if (provider === 'metaAds') return 'Planned later. Connect Meta account, pixel, Page, and Instagram actor before Meta campaigns.';
    if (provider === 'googleAds') return 'Planned for ads launch. Add account, developer token, conversions, and reports before optimization.';
    return providerLabel(provider) + ' is planned for a later proof pass.';
  }
  if (item?.evidenceStatus === 'pass') {
    if (provider === 'confirmedConversions') return 'Confirmed product conversion data is fresh enough for provider reconciliation.';
    return item.evidenceMessage;
  }
  if (provider === 'ga4') return 'GA4 is configured. Pull fresh landing page, channel, and source/medium reports before using analytics trends.';
  if (provider === 'searchConsole') return 'Search Console is configured. Pull query/page, page, and query reports before SEO decisions.';
  if (provider === 'confirmedConversions') return 'Refresh confirmed product conversions so provider data can be reconciled with real business outcomes.';
  return item?.evidenceMessage ?? providerLabel(provider) + ' proof has not run yet.';
}
function decisionCard(title, status, message, strong = false) {
  return '<article class="decision-card ' + (strong ? 'strong' : '') + '"><div class="decision-card-head"><h4>' + esc(title) + '</h4>' + pill(status) + '</div><p>' + esc(message) + '</p></article>';
}
function emptyState(title, message, command) {
  return '<div class="empty-state"><h4>' + esc(title) + '</h4><p>' + esc(message) + '</p>' + (command ? '<div class="command">' + esc(command) + '</div>' : '') + '</div>';
}
function providerFreshness(provider) {
  return state.freshness.filter((cell) => cell.provider === provider);
}
function providerReadySummary(cells) {
  return countByStatus(cells, 'ready') + '/' + cells.length + ' ready';
}
function proofProvider(provider) {
  return (state.reports.proof.providers ?? []).find((item) => item.provider === provider);
}
function proofStatusCard(provider, title = provider) {
  const item = proofProvider(provider);
  const status = item?.evidenceStatus === 'pass' ? 'ready' : item?.evidenceStatus === 'error' ? 'blocked' : 'warn';
  return statusCard(title, status, friendlyProofMessage(provider, item), providerPhase(provider) + ' · ' + (item?.reportFamilies ?? []).length + ' report families');
}
function safeActionCard(title, actions) {
  const action = actions[0];
  return '<div class="command-cta"><h4>' + esc(title) + '</h4><p>' + esc(action?.message ?? state.readiness.nextWorkflowStep) + '</p></div>';
}
function preLiveChecklist() {
  const stages = state.reports.setup.stages ?? [];
  const stageCard = (title, match, fallback) => {
    const stage = stages.find((item) => item.title === match);
    const status = stage?.status === 'pass' ? 'ready' : stage?.status === 'blocked' ? 'blocked' : 'warn';
    return statusCard(title, status, stage?.message ?? fallback);
  };
  return '<div class="status-grid">' + [
    stageCard('Deployed domain', 'Deployed Domain', 'Deploy the app and set the production public base URL before real provider proof.'),
    stageCard('Google OAuth', 'Provider Login', 'Create or connect local Google OAuth profile before Google providers.'),
    statusCard('Meta Ads', proofProvider('metaAds')?.evidenceStatus === 'pass' ? 'ready' : 'warn', friendlyProofMessage('metaAds', proofProvider('metaAds')), providerPhase('metaAds')),
    stageCard('Provider discovery', 'Provider Discovery', 'Discover provider account/property IDs before proof.'),
    proofStatusCard('gtm', 'GTM manifest'),
    proofStatusCard('searchConsole', 'Search Console'),
    proofStatusCard('ga4', 'GA4'),
    proofStatusCard('googleAds', 'Google Ads'),
    proofStatusCard('confirmedConversions', 'Confirmed conversions'),
    statusCard('Mutation policy', 'warn', 'Live ads and GTM changes must stay behind dry-run, receipts, exact confirmations, and production confirmation.'),
  ].join('') + '</div>';
}
function actionList(items) {
  if (!items.length) return empty('No actions need attention.');
  return '<div class="list">' + items.map((item) => '<article class="item"><div class="item-head"><h4>' + esc(item.title) + '</h4>' + pill(item.severity === 'critical' ? 'blocked' : item.severity === 'warn' ? 'warn' : 'ready', item.severity) + '</div><p>' + esc(item.message) + '</p></article>').join('') + '</div>';
}
function matrix(cells) {
  if (!cells.length) return empty('No freshness artifacts yet.');
  return '<div class="matrix">' + cells.map((cell) => '<div class="matrix-cell"><div class="item-head"><h4>' + esc(cell.label) + '</h4>' + pill(cell.status) + '</div><p>' + esc(cell.message) + '</p><p>' + esc(cell.recordCount ?? '-') + ' records' + (cell.ageDays !== undefined ? ' · ' + esc(cell.ageDays) + 'd old' : '') + '</p></div>').join('') + '</div>';
}
function barList(rows, metricKey = 'cost') {
  if (!rows.length) return empty('No comparison data yet.');
  const values = rows.map((row) => Number(row.metrics?.[metricKey] ?? 0));
  const max = Math.max(...values, 1);
  return rows.map((row) => {
    const value = Number(row.metrics?.[metricKey] ?? 0);
    const width = Math.max(2, (value / max) * 100);
    return '<div class="bar-row"><div class="bar-label">' + esc(row.label) + '</div><div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div><div class="bar-value">' + esc(formatCompact(value)) + '</div></div>';
  }).join('');
}
function comparisonTable(rows) {
  if (!rows.length) return emptyState('No comparable report rows yet', 'Pull provider reports before using this area for performance decisions.');
  return '<div class="table-scroll compact-table"><table class="table"><thead><tr><th>Source</th><th>Cost</th><th>Clicks</th><th>Conversions</th><th>CPA</th><th>ROAS</th></tr></thead><tbody>' + rows.map((row) => '<tr><td>' + esc(row.label) + '</td><td>' + esc(moneyValue(row.metrics?.cost, row.currencyCode)) + '</td><td>' + esc(formatNumber(row.metrics?.clicks)) + '</td><td>' + esc(formatNumber(row.metrics?.conversions)) + '</td><td>' + esc(moneyValue(row.derived?.cpa, row.currencyCode)) + '</td><td>' + esc(ratioValue(row.derived?.roas)) + '</td></tr>').join('') + '</tbody></table></div>';
}
function primaryComparisonRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.provider ?? row.id;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((group) => {
    const provider = group[0]?.provider;
    const priority = provider === 'googleAds'
      ? ['campaign', 'account', 'adGroup', 'keyword', 'conversion']
      : provider === 'metaAds'
        ? ['campaign', 'adSet', 'ad', 'event']
        : ['campaign', 'channel', 'sourceMedium', 'queryPage', 'query', 'page'];
    for (const reportType of priority) {
      const match = group.find((row) => row.reportType === reportType);
      if (match) return match;
    }
    return group[0];
  }).filter(Boolean);
}
function organicQueryTable(rows) {
  if (!rows.length) return emptyState('No organic query rows yet', 'Pull Search Console query/page evidence to show keyword, landing page, click, impression, CTR, and position rows.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Query</th><th>Landing page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg. position</th></tr></thead><tbody>' + rows.map((row) => '<tr><td>' + esc(row.query) + '</td><td class="path" title="' + esc(row.pageUrl ?? 'All pages') + '">' + esc(row.pageUrl ?? 'All pages') + '</td><td>' + esc(formatNumber(row.clicks)) + '</td><td>' + esc(formatNumber(row.impressions)) + '</td><td>' + esc(percentValue(row.ctr)) + '</td><td>' + esc(decimalValue(row.position)) + '</td></tr>').join('') + '</tbody></table></div>';
}
function keywordPlannerTable(summary, options = {}) {
  const sourceRows = options.full ? (summary?.keywords ?? summary?.topKeywords ?? []) : (summary?.topKeywords ?? []);
  const rows = options.limit ? sourceRows.slice(0, options.limit) : sourceRows;
  if (!rows.length) return emptyState('No Keyword Planner evidence yet', 'Fetch Google Ads keyword ideas to show search volume, competition, and top-of-page bid evidence.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Keyword</th><th>Market</th><th>Avg. monthly searches</th><th>Competition</th><th>Index</th><th>' + esc(bidColumnLabel('Low bid', summary?.currencyCode)) + '</th><th>' + esc(bidColumnLabel('High bid', summary?.currencyCode)) + '</th></tr></thead><tbody>' + rows.map((row) => '<tr><td>' + esc(row.term) + '</td><td>' + esc(keywordMarket(row)) + '</td><td>' + esc(formatNumber(row.avgMonthlySearches)) + '</td><td>' + esc(row.competition ?? '-') + '</td><td>' + esc(formatNumber(row.competitionIndex)) + '</td><td>' + esc(microsMoney(row.lowTopOfPageBidMicros, row.currencyCode ?? summary?.currencyCode)) + '</td><td>' + esc(microsMoney(row.highTopOfPageBidMicros, row.currencyCode ?? summary?.currencyCode)) + '</td></tr>').join('') + '</tbody></table></div>';
}
function keywordMarketSummaryTable(summary) {
  const markets = summary?.markets ?? [];
  if (!markets.length) return emptyState('No market split yet', 'Fetch more than one market or rebuild the dashboard after Keyword Planner pulls.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Market</th><th>Currency</th><th>Keywords</th><th>Known monthly searches</th><th>Avg. competition index</th><th>Top keyword</th></tr></thead><tbody>' + markets.map((market) => '<tr><td>' + esc(market.market) + '</td><td>' + esc(market.currencyCode ?? summary?.currencyCode ?? 'account currency') + '</td><td>' + esc(formatNumber(market.metricCount)) + '</td><td>' + esc(formatNumber(market.totalKnownVolume)) + '</td><td>' + esc(formatNumber(market.averageCompetitionIndex)) + '</td><td>' + esc(market.topKeywords?.[0]?.term ?? '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function keywordMarketSections(summary) {
  const markets = summary?.markets ?? [];
  if (!markets.length) return emptyState('No per-market keyword tables yet', 'Market tables appear after Keyword Planner evidence is fetched and aggregated.');
  return markets.map((market) => card('Keyword Planner · ' + market.market, formatNumber(market.metricCount) + ' keywords · ' + formatNumber(market.totalKnownVolume) + ' known monthly searches · avg competition ' + formatNumber(market.averageCompetitionIndex) + ' · bids in ' + (market.currencyCode ?? summary?.currencyCode ?? 'account currency'), keywordPlannerRowsTable(market.topKeywords ?? [], market.currencyCode ?? summary?.currencyCode))).join('');
}
function keywordEvidenceTabs(active = 'matrix') {
  const tabs = [
    ['clusters', '#/research/evidence', 'Clusters'],
    ['matrix', '#/research/evidence/matrix', 'Keyword matrix'],
    ['markets', '#/research/evidence/markets', 'Markets'],
    ['raw', '#/research/evidence/raw', 'Raw rows'],
  ];
  return '<nav class="research-nav" aria-label="Keyword evidence views">' + tabs.map(([id, href, label]) => '<a class="' + (active === id ? 'active' : '') + '" href="' + href + '">' + esc(label) + '</a>').join('') + '</nav>';
}
function keywordClusterTable(summary) {
  const clusters = summary?.clusters ?? [];
  if (!clusters.length) return emptyState('No keyword clusters yet', 'Fetch Keyword Planner metrics and rebuild the dashboard to classify keywords into planning clusters.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Cluster</th><th>Total volume</th><th>Best market</th><th>Avg. competition</th><th>Top keyword</th><th>Recommended use</th></tr></thead><tbody>' + clusters.map((cluster) => '<tr><td><strong>' + esc(cluster.label) + '</strong><p>' + esc(cluster.intent) + '</p></td><td>' + esc(formatNumber(cluster.totalKnownVolume)) + '</td><td>' + esc(cluster.bestMarket ? cluster.bestMarket + ' · ' + formatNumber(cluster.bestMarketVolume) : '-') + '</td><td>' + esc(formatNumber(cluster.averageCompetitionIndex)) + '</td><td>' + esc(cluster.topKeywords?.[0]?.term ?? '-') + '</td><td>' + esc(cluster.recommendedUse) + '</td></tr>').join('') + '</tbody></table></div>';
}
function keywordClusterSections(summary) {
  const clusters = summary?.clusters ?? [];
  if (!clusters.length) return '';
  return clusters.slice(0, 6).map((cluster) => card(cluster.label, formatNumber(cluster.totalKnownVolume) + ' known monthly searches · best market ' + (cluster.bestMarket ? cluster.bestMarket + ' ' + formatNumber(cluster.bestMarketVolume) : '-') + ' · ' + cluster.recommendedUse, keywordMatrixRowsTable(cluster.topKeywords ?? [], summary?.markets ?? []))).join('');
}
function keywordMatrixTable(summary) {
  const rows = summary?.matrix ?? [];
  const markets = (summary?.markets ?? []).map((market) => market.market);
  if (!rows.length || !markets.length) return emptyState('No keyword matrix yet', 'Fetch Keyword Planner metrics for one or more markets, then rebuild the dashboard.');
  return keywordMatrixRowsTable(rows, summary.markets);
}
function keywordMatrixRowsTable(rows, marketsInput) {
  const markets = (marketsInput ?? []).map((market) => market.market);
  if (!rows.length || !markets.length) return empty('No matrix rows available.');
  const marketHeaders = markets.map((market) => '<th>' + esc(market + ' volume') + '</th><th>' + esc(market + ' comp') + '</th>').join('');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Keyword</th><th>Total volume</th><th>Best market</th><th>Markets</th>' + marketHeaders + '</tr></thead><tbody>' + rows.map((row) => '<tr><td>' + esc(row.term) + '</td><td>' + esc(formatNumber(row.totalKnownVolume)) + '</td><td>' + esc(row.bestMarket ? row.bestMarket + ' · ' + formatNumber(row.bestMarketVolume) : '-') + '</td><td>' + esc(formatNumber(row.marketCount)) + '</td>' + markets.map((market) => keywordMatrixMarketCells(row.markets?.[market])).join('') + '</tr>').join('') + '</tbody></table></div>';
}
function keywordMatrixMarketCells(market) {
  if (!market) return '<td>-</td><td>-</td>';
  const competition = market.competition ? market.competition + ' ' + formatNumber(market.competitionIndex) : formatNumber(market.competitionIndex);
  return '<td>' + esc(formatNumber(market.avgMonthlySearches)) + '</td><td>' + esc(competition) + '</td>';
}
function keywordPlannerRowsTable(rows, currencyCode) {
  if (!rows.length) return empty('No keyword rows in this market.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Keyword</th><th>Avg. monthly searches</th><th>Competition</th><th>Index</th><th>' + esc(bidColumnLabel('Low bid', currencyCode)) + '</th><th>' + esc(bidColumnLabel('High bid', currencyCode)) + '</th></tr></thead><tbody>' + rows.map((row) => '<tr><td>' + esc(row.term) + '</td><td>' + esc(formatNumber(row.avgMonthlySearches)) + '</td><td>' + esc(row.competition ?? '-') + '</td><td>' + esc(formatNumber(row.competitionIndex)) + '</td><td>' + esc(microsMoney(row.lowTopOfPageBidMicros, row.currencyCode ?? currencyCode)) + '</td><td>' + esc(microsMoney(row.highTopOfPageBidMicros, row.currencyCode ?? currencyCode)) + '</td></tr>').join('') + '</tbody></table></div>';
}
function keywordMarket(row) {
  if (!row.country && !row.language) return '-';
  return [row.country, row.language].filter(Boolean).join(' / ');
}
function formatNumber(value) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
function bidColumnLabel(label, currencyCode) {
  return label + ' (' + (currencyCode ?? 'account currency') + ')';
}
function microsMoney(value, currencyCode) {
  if (value === undefined) return '-';
  const accountCurrencyValue = value / 1000000;
  if (!currencyCode) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: accountCurrencyValue >= 100 ? 0 : 2 }).format(accountCurrencyValue);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: accountCurrencyValue >= 100 ? 0 : 2 }).format(accountCurrencyValue);
}
function moneyValue(value, currencyCode) {
  if (value === undefined) return '-';
  const formatted = currencyCode
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value)
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
  return currencyCode ? formatted + ' ' + currencyCode : formatted;
}
function ratioValue(value) {
  if (value === undefined) return '-';
  return value.toFixed(2) + 'x';
}
function percentValue(value) {
  if (value === undefined) return '-';
  return value.toFixed(1) + '%';
}
function decimalValue(value) {
  if (value === undefined) return '-';
  return value.toFixed(1);
}
function formatCompact(value) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
function lineChart(points) {
  if (!points.length) return empty('No trend data yet.');
  const width = 720;
  const height = 220;
  const values = points.map((point) => Number(point.value || 0));
  if (values.every((value) => value === 0)) return emptyState('No measurable trend yet', 'Charts appear after fresh provider reports include non-zero metrics for this window.');
  const max = Math.max(...values, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - 30 - ((Number(point.value || 0) / max) * (height - 58));
    return [x, y];
  });
  const d = coords.map((coord, index) => (index === 0 ? 'M' : 'L') + coord[0].toFixed(1) + ' ' + coord[1].toFixed(1)).join(' ');
  return '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img"><line x1="0" x2="' + width + '" y1="' + (height - 30) + '" y2="' + (height - 30) + '" stroke="var(--color-outline-subtle)"/><path d="' + d + '" fill="none" stroke="var(--color-primary)" stroke-width="3"/>' + coords.map((coord) => '<circle cx="' + coord[0].toFixed(1) + '" cy="' + coord[1].toFixed(1) + '" r="4" fill="var(--color-primary)"/>').join('') + '</svg>';
}
function receiptTimeline(showPath = true) {
  const receipts = state.receipts;
  if (!receipts.length) return empty('No receipts have been written yet.');
  return '<div class="list">' + receipts.slice(0, 10).map((receipt) => '<article class="item"><div class="item-head"><h4>' + esc(receipt.action) + '</h4>' + pill(receipt.status) + '</div><p>' + esc(receipt.timestamp ?? '') + ' · ' + esc(receipt.message) + '</p>' + (showPath ? '<p class="path">' + esc(receipt.path) + '</p>' : '') + '</article>').join('') + '</div>';
}
function artifactTable(items = state.artifacts) {
  if (!items.length) return empty('No linked artifacts yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Artifact</th><th>Lane</th><th>Status</th><th>Path</th></tr></thead><tbody>' + items.map((item) => '<tr><td>' + esc(item.label) + '</td><td>' + esc(item.lane) + '</td><td>' + pill(item.status) + '</td><td class="path" title="' + esc(item.path) + '">' + esc(item.path) + '</td></tr>').join('') + '</tbody></table></div>';
}
function evidenceList(items = state.artifacts) {
  if (!items.length) return empty('No linked artifacts yet.');
  return '<div class="evidence-list">' + items.slice(0, 10).map((item) => '<article class="evidence-row"><div><h4>' + esc(item.label) + '</h4><p>' + esc(item.lane) + ' · ' + esc(item.path) + '</p></div>' + pill(item.status) + '</article>').join('') + '</div>';
}
function researchNav(active = 'overview') {
  const tabs = [
    ['overview', '#/research', 'Overview'],
    ['records', '#/research/records', 'Records'],
    ['competitors', '#/research/competitors', 'Competitors'],
    ['faqs', '#/research/faqs', 'FAQs'],
    ['intelligence', '#/research/intelligence', 'SEO intelligence'],
    ['opportunities', '#/research/opportunities', 'Opportunities'],
    ['actions', '#/research/actions', 'Actions'],
    ['decisions', '#/research/decisions', 'Decisions'],
    ['evidence', '#/research/evidence', 'Evidence'],
  ];
  return '<nav class="research-nav" aria-label="Research views">' + tabs.map(([id, href, label]) => '<a class="' + (active === id ? 'active' : '') + '" href="' + href + '">' + esc(label) + '</a>').join('') + '</nav>';
}
function researchRecordById(id) {
  const records = state.reports.researchStatus.records ?? state.reports.researchStatus.topPriorities ?? [];
  return records.find((record) => record.id === id);
}
function researchRecordTable(records) {
  if (!records || records.length === 0) return empty('No research records yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Record</th><th>Kind</th><th>Priority</th><th>Status</th><th>Keywords</th><th>Actions</th></tr></thead><tbody>' + records.map((record) => '<tr><td><a class="table-link" href="#/research/record/' + encodeURIComponent(record.id) + '">' + esc(record.title) + '</a><p>' + esc(record.summary) + '</p></td><td>' + esc(record.kind) + '</td><td>' + pill(record.priority ?? 'p1') + '</td><td>' + pill(record.status ?? 'active') + '</td><td>' + esc((record.keywords ?? []).slice(0, 5).join(', ') || '-') + '</td><td>' + esc((record.nextActions ?? []).filter((item) => item.status !== 'done').length) + '</td></tr>').join('') + '</tbody></table></div>';
}
function researchOpportunityTable(items) {
  if (!items || items.length === 0) return empty('No page opportunities captured yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Opportunity</th><th>Route</th><th>Keyword</th><th>Priority</th><th>Status</th><th>Why</th></tr></thead><tbody>' + items.map((item) => '<tr><td>' + esc(item.title) + '</td><td class="path">' + esc(item.routePath ?? '-') + '</td><td>' + esc(item.primaryKeyword ?? '-') + '</td><td>' + pill(item.priority) + '</td><td>' + pill(item.status ?? 'planned') + '</td><td>' + esc(item.rationale) + '</td></tr>').join('') + '</tbody></table></div>';
}
function researchActionTable(items) {
  if (!items || items.length === 0) return empty('No open research actions.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Action</th><th>Priority</th><th>Status</th><th>Owner</th><th>Summary</th></tr></thead><tbody>' + items.map((item) => '<tr><td>' + esc(item.title) + '</td><td>' + pill(item.priority ?? 'p1') + '</td><td>' + pill(item.status ?? 'todo') + '</td><td>' + esc(item.owner ?? '-') + '</td><td>' + esc(item.summary) + '</td></tr>').join('') + '</tbody></table></div>';
}
function researchDecisionTable(items) {
  if (!items || items.length === 0) return empty('No decisions captured yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Decision</th><th>Priority</th><th>Status</th><th>Routes</th><th>Rationale</th></tr></thead><tbody>' + items.map((item) => '<tr><td>' + esc(item.decision) + '</td><td>' + (item.priority ? pill(item.priority) : '-') + '</td><td>' + pill(item.status ?? 'decided') + '</td><td class="path">' + esc((item.routes ?? []).map((route) => route.path).join(', ') || '-') + '</td><td>' + esc(item.rationale) + '</td></tr>').join('') + '</tbody></table></div>';
}
function researchEvidenceTable(files) {
  if (!files || files.length === 0) return empty('No research evidence files.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>File</th><th>Records</th><th>Captured</th><th>Updated</th><th>Source</th></tr></thead><tbody>' + files.map((file) => '<tr><td class="path" title="' + esc(file.path) + '">' + esc(file.path) + '</td><td>' + esc(file.recordCount) + '</td><td>' + esc(file.capturedAt) + '</td><td>' + esc(formatTimestamp(file.updatedAt)) + '</td><td>' + esc(file.source) + '</td></tr>').join('') + '</tbody></table></div>';
}
function competitorDomainTable(summary) {
  const domains = summary?.domains ?? [];
  if (!domains.length) return emptyState('No competitor domains yet', 'Add competitor research JSON under docs/seo/keyword-research/competitors and rebuild the console.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Domain</th><th>Pages</th><th>Keywords</th><th>Best position</th><th>Page types</th><th>Winning patterns</th><th>Opportunities</th></tr></thead><tbody>' + domains.map((domain) => '<tr><td>' + esc(domain.domain) + '</td><td>' + esc(formatNumber(domain.pageCount)) + '</td><td>' + esc(formatNumber(domain.keywordCount)) + '</td><td>' + esc(formatNumber(domain.bestPosition)) + '</td><td>' + esc((domain.pageTypes ?? []).join(', ') || '-') + '</td><td>' + esc((domain.topPatterns ?? []).slice(0, 5).join(', ') || '-') + '</td><td>' + esc((domain.opportunities ?? []).slice(0, 3).join(' · ') || '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function competitorPageTable(summary) {
  const pages = summary?.pages ?? [];
  if (!pages.length) return empty('No competitor pages captured yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Competitor page</th><th>Keyword</th><th>Position</th><th>Type</th><th>Patterns</th><th>Gaps</th><th>Opportunities</th></tr></thead><tbody>' + pages.map((page) => '<tr><td><strong>' + esc(page.competitor) + '</strong><p class="path" title="' + esc(page.url) + '">' + esc(page.url) + '</p></td><td>' + esc(page.keyword ?? '-') + '</td><td>' + esc(formatNumber(page.position)) + '</td><td>' + esc(page.pageType ?? '-') + '</td><td>' + esc((page.patterns ?? []).slice(0, 5).join(', ') || '-') + '</td><td>' + esc((page.gaps ?? []).slice(0, 3).join(' · ') || '-') + '</td><td>' + esc((page.opportunities ?? []).slice(0, 3).join(' · ') || '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function competitorOpportunityList(summary) {
  const opportunities = summary?.opportunities ?? [];
  if (!opportunities.length) return empty('No competitor opportunities captured yet.');
  return '<div class="list">' + opportunities.map((item) => '<article class="item"><p>' + esc(item) + '</p></article>').join('') + '</div>';
}
function faqPageSummaryTable(summary) {
  const pages = summary?.pages ?? [];
  if (!pages.length) return emptyState('No FAQ page map yet', 'Add FAQ research JSON under docs/seo/keyword-research/faqs and rebuild the console.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Page</th><th>Role</th><th>Questions</th><th>Approved</th><th>Needs proof</th><th>Markets</th><th>Evidence</th><th>Known volume</th><th>Clusters</th><th>Top question</th></tr></thead><tbody>' + pages.map((page) => '<tr><td class="path">' + esc(page.routePath) + '</td><td>' + esc(page.pageRole ?? '-') + '</td><td>' + esc(formatNumber(page.questionCount)) + '</td><td>' + esc(formatNumber(page.approvedCount)) + '</td><td>' + esc(formatNumber(page.needsProofCount)) + '</td><td>' + esc(formatNumber(page.marketCount)) + '</td><td>' + esc(formatNumber(page.evidenceSourceCount)) + '</td><td>' + esc(formatNumber(page.totalKnownVolume)) + '</td><td>' + esc((page.clusters ?? []).join(', ') || '-') + '</td><td>' + esc(page.topQuestion ?? '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function faqQuestionTable(summary) {
  const questions = summary?.questions ?? [];
  if (!questions.length) return empty('No FAQ questions captured yet.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Question</th><th>Page</th><th>Priority</th><th>Status</th><th>Proof</th><th>Volume</th><th>Markets</th><th>Evidence</th><th>Answer intent</th><th>Internal links</th></tr></thead><tbody>' + questions.map((question) => '<tr><td><strong>' + esc(question.question) + '</strong><p>' + esc(question.recommendedAnswer) + '</p></td><td class="path">' + esc(question.routePath) + '</td><td>' + pill(question.priority) + '</td><td>' + pill(question.status) + '</td><td>' + pill(question.proofStatus) + '</td><td>' + esc(formatNumber(question.avgMonthlySearches)) + '</td><td>' + esc(question.bestMarket ?? formatNumber(question.marketCount)) + '</td><td>' + esc((question.evidenceSources ?? []).join(', ') || '-') + '</td><td>' + esc(question.answerIntent) + '</td><td>' + esc((question.internalLinks ?? []).map((link) => link.path).join(', ') || '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function faqTopQuestionList(summary) {
  const questions = summary?.topQuestions ?? [];
  if (!questions.length) return empty('No prioritized FAQ questions yet.');
  return '<div class="list">' + questions.slice(0, 8).map((question) => '<article class="item"><div class="item-head"><h4>' + esc(question.question) + '</h4>' + pill(question.proofStatus, question.priority) + '</div><p>' + esc(question.answerIntent) + '</p><p class="path">' + esc(question.routePath) + (question.avgMonthlySearches !== undefined ? ' · ' + esc(formatNumber(question.avgMonthlySearches)) + ' known searches' : '') + (question.evidenceSources?.length ? ' · ' + esc(question.evidenceSources.join(', ')) : '') + '</p></article>').join('') + '</div>';
}
function faqQualityPanel(summary) {
  if (!summary?.questionCount) return emptyState('No FAQ quality score yet', 'Add FAQ research JSON under docs/seo/keyword-research/faqs and rebuild the console.');
  const warnings = summary.warnings ?? [];
  const cards = [
    decisionCard('Quality score', summary.qualityScore >= 80 ? 'ready' : 'warn', summary.qualityScore + '/100 across proof, evidence mix, market coverage, page ownership, answers, and internal links.', summary.qualityScore >= 80),
    decisionCard('Evidence mix', summary.evidenceSourceCount >= 2 ? 'ready' : 'warn', formatNumber(summary.evidenceSourceCount) + ' source type(s), ' + formatNumber(summary.marketCount) + ' market(s).'),
    decisionCard('Proof gaps', summary.needsProofCount === 0 ? 'ready' : 'warn', formatNumber(summary.needsProofCount) + ' question(s) still need stronger proof.'),
    decisionCard('Cannibalization', summary.routeConflictCount === 0 && summary.duplicateQuestionCount === 0 ? 'ready' : 'warn', formatNumber(summary.routeConflictCount) + ' route conflict(s), ' + formatNumber(summary.duplicateQuestionCount) + ' duplicate question(s).'),
  ].join('');
  return '<div class="page-grid compact">' + '<div class="decision-grid">' + cards + '</div>' + (warnings.length ? '<div class="list">' + warnings.map((warning) => '<article class="item"><div class="item-head"><h4>' + esc(warning.title) + '</h4>' + pill(warning.severity) + '</div><p>' + esc(warning.message) + '</p>' + (warning.routePath ? '<p class="path">' + esc(warning.routePath) + '</p>' : '') + '</article>').join('') + '</div>' : empty('No FAQ quality warnings.')) + '</div>';
}
function seoIntelligenceQualityPanel(summary) {
  if (!summary) return emptyState('No SEO intelligence yet', 'Add SERP, metadata, and page-audit JSON under docs/seo/keyword-research and rebuild the console.');
  const warnings = summary.warnings ?? [];
  const cards = [
    decisionCard('SEO intelligence score', summary.score >= 80 ? 'ready' : 'warn', summary.score + '/100 across SERP intent, metadata experiments, and page audits.', summary.score >= 80),
    decisionCard('SERP snapshots', summary.serp?.status ?? 'missing', formatNumber(summary.serp?.snapshotCount) + ' keyword/country snapshot(s), ' + formatNumber(summary.serp?.countryCount) + ' market(s).'),
    decisionCard('Metadata tests', summary.metadata?.status ?? 'missing', formatNumber(summary.metadata?.experimentCount) + ' experiment(s), ' + formatNumber(summary.metadata?.readyCount) + ' ready.'),
    decisionCard('Page audits', summary.pageAudits?.status ?? 'missing', formatNumber(summary.pageAudits?.pageCount) + ' page(s), average score ' + formatNumber(summary.pageAudits?.averageScore) + '.'),
  ].join('');
  return '<div class="page-grid compact">' + '<div class="decision-grid">' + cards + '</div>' + (warnings.length ? '<div class="list">' + warnings.map((warning) => '<article class="item"><div class="item-head"><h4>' + esc(warning.title) + '</h4>' + pill(warning.severity) + '</div><p>' + esc(warning.message) + '</p></article>').join('') + '</div>' : empty('No SEO intelligence warnings.')) + '</div>';
}
function serpSnapshotTable(summary) {
  const rows = summary?.serp?.snapshots ?? [];
  if (!rows.length) return emptyState('No SERP snapshots yet', 'Add country-specific SERP intent snapshots under docs/seo/keyword-research/serp.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Keyword</th><th>Market</th><th>Intent</th><th>Page owner</th><th>Top domains</th><th>PAA</th><th>Opportunities</th></tr></thead><tbody>' + rows.map((row) => '<tr><td><strong>' + esc(row.keyword) + '</strong><p>' + esc(formatTimestamp(row.capturedAt)) + '</p></td><td>' + esc(row.country + ' / ' + row.language) + '</td><td>' + esc(row.intent) + '</td><td class="path">' + esc(row.routePath ?? '-') + '</td><td>' + esc((row.topDomains ?? []).slice(0, 6).join(', ') || '-') + '</td><td>' + esc((row.peopleAlsoAsk ?? []).slice(0, 3).join(' · ') || '-') + '</td><td>' + esc((row.opportunities ?? []).slice(0, 3).join(' · ') || '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function metadataExperimentTable(summary) {
  const rows = summary?.metadata?.experiments ?? [];
  if (!rows.length) return emptyState('No metadata experiments yet', 'Add title and description test plans under docs/seo/keyword-research/metadata.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Page</th><th>Priority</th><th>Status</th><th>Keyword</th><th>Current</th><th>Proposed</th><th>Rationale</th><th>Expected impact</th></tr></thead><tbody>' + rows.map((row) => '<tr><td class="path">' + esc(row.routePath) + '</td><td>' + pill(row.priority) + '</td><td>' + pill(row.status) + '</td><td>' + esc(row.primaryKeyword) + '</td><td><strong>' + esc(row.currentTitle ?? '-') + '</strong><p>' + esc(row.currentDescription ?? '-') + '</p></td><td><strong>' + esc(row.proposedTitle) + '</strong><p>' + esc(row.proposedDescription) + '</p></td><td>' + esc(row.rationale) + '</td><td>' + esc(row.expectedImpact) + '</td></tr>').join('') + '</tbody></table></div>';
}
function pageAuditTable(summary) {
  const rows = summary?.pageAudits?.audits ?? [];
  if (!rows.length) return emptyState('No page audits yet', 'Add rendered-page SEO audits under docs/seo/keyword-research/page-audits.');
  return '<div class="table-scroll"><table class="table"><thead><tr><th>Page</th><th>Status</th><th>Score</th><th>Keyword</th><th>Intent</th><th>Missing</th><th>Warnings</th><th>Recommendations</th></tr></thead><tbody>' + rows.map((row) => '<tr><td class="path">' + esc(row.routePath) + '</td><td>' + pill(row.status) + '</td><td>' + esc(formatNumber(row.score)) + '</td><td>' + esc(row.primaryKeyword ?? '-') + '</td><td>' + esc(row.intent ?? '-') + '</td><td>' + esc((row.missing ?? []).slice(0, 4).join(' · ') || '-') + '</td><td>' + esc((row.warnings ?? []).slice(0, 4).join(' · ') || '-') + '</td><td>' + esc((row.recommendations ?? []).slice(0, 4).join(' · ') || '-') + '</td></tr>').join('') + '</tbody></table></div>';
}
function routeArtifacts(id) {
  if (id === 'ads') {
    return state.artifacts.filter((item) => item.id.includes('googleAds') || item.id.includes('metaAds'));
  }
  if (id === 'analytics') {
    return state.artifacts.filter((item) => item.id.includes('ga4') || item.id.includes('searchConsole'));
  }
  if (id === 'seo') {
    return state.artifacts.filter((item) => item.id.includes('searchConsole'));
  }
  if (id === 'research') {
    return state.artifacts.filter((item) => item.lane === 'research');
  }
  if (id === 'gtm') {
    return state.artifacts.filter((item) => item.lane === 'gtm');
  }
  if (id === 'receipts') {
    return state.artifacts.filter((item) => item.id.startsWith('receipt.'));
  }
  return state.artifacts.slice(0, 8);
}
function routeActions(id) {
  const laneMap = {
    setup: 'setup',
    proof: 'proof',
    schedule: 'proof',
    ads: 'ads',
    analytics: 'analytics',
    research: 'research',
    recommendations: 'reports',
  };
  const lane = laneMap[id];
  const filtered = lane ? state.actions.filter((item) => item.lane === lane) : [];
  return filtered.length ? filtered : state.actions.slice(0, 3);
}
function overview() {
  return '<div class="page-grid"><div class="hero"><section class="section-block"><div class="section-header"><h3>Marketing readiness</h3><p>' + esc(state.readiness.nextWorkflowStep) + '</p></div><div class="section-body"><div class="metrics">' + state.metrics.map(metricCard).join('') + '</div></div></section><section class="card score"><div class="score-ring" style="--score:' + Number(state.readiness.score) + '"><span>' + Number(state.readiness.score) + '%</span></div><p>' + pill(state.readiness.status) + '</p></section></div>' + card('Spend trend', 'Provider cost after fresh reports exist.', lineChart(state.trends.spend)) + '<div class="grid-2">' + card('Next actions', 'What to do next without touching live campaigns.', actionList(state.actions.slice(0, 5))) + card('Data freshness', 'Which evidence is ready now, and which providers are planned later.', matrix(state.freshness.slice(0, 8))) + '</div></div>';
}
function performance() {
  const hasComparableRows = state.comparisons.channels.length > 0;
  const freshnessReady = countByStatus(state.freshness, 'ready');
  return '<div class="page-grid"><div class="metrics">' + metricCards(['spend', 'conversions', 'cpa', 'roas', 'ctr', 'traffic']) + '</div><div class="decision-grid">' + [
    decisionCard('Data coverage', freshnessReady > 0 ? 'ready' : 'missing', freshnessReady + '/' + state.freshness.length + ' report families are fresh enough for decisions.', freshnessReady > 0),
    decisionCard('Decision mode', hasComparableRows ? 'ready' : 'missing', hasComparableRows ? 'Compare rows by spend, conversion, CPA, and ROAS before changing budget.' : 'No performance rows yet. Pull provider reports before optimizing.'),
    decisionCard('Optimization safety', state.receipts.length > 0 ? 'ready' : 'warn', state.receipts.length > 0 ? 'Recent receipts exist for auditability.' : 'Keep this page read-only until plan/diff/dry-run receipts exist.'),
  ].join('') + '</div><div class="grid-2">' + card('Spend trend', 'Cost movement once provider reports include measurable spend.', lineChart(state.trends.spend)) + card('Conversion trend', 'Conversion movement once provider reports include conversion metrics.', lineChart(state.trends.conversions)) + '</div>' + card('Performance decision table', 'Use this table for provider/channel/campaign comparisons before strategy changes.', comparisonTable(state.comparisons.channels)) + '</div>';
}
function setup() {
  const stages = state.reports.setup.stages ?? [];
  const readyStages = stages.filter((stage) => stage.status === 'pass').length;
  const blockedStages = stages.filter((stage) => stage.status === 'blocked').length;
  const proofPending = !state.reports.proof.readyForScheduledPulls;
  return '<div class="page-grid"><div class="metrics">' + [
    metricCard({ label: 'Setup stages', value: readyStages + '/' + stages.length, helper: 'Passed setup checks', status: blockedStages > 0 ? 'blocked' : readyStages === stages.length ? 'ready' : 'warn' }),
    metricCard({ label: 'Proof', value: state.reports.proof.readyForScheduledPulls ? 'Ready' : 'Pending', helper: 'Scheduled pulls gate', status: proofPending ? 'warn' : 'ready' }),
    metricCard({ label: 'Provider pulls', value: String(countByStatus(state.freshness, 'ready')), helper: 'Fresh report families', status: countByStatus(state.freshness, 'ready') > 0 ? 'ready' : 'missing' }),
  ].join('') + '</div>' + card('Setup lifecycle', 'Local pack, deployed domain, provider login, selected identifiers, and read-only proof.', '<div class="list">' + stages.map((stage) => '<article class="item"><div class="item-head"><h4>' + esc(stage.title) + '</h4>' + pill(stage.status === 'pass' ? 'ready' : stage.status === 'blocked' ? 'blocked' : 'warn', stage.status) + '</div><p>' + esc(stage.message) + '</p></article>').join('') + '</div>') + card('Pre-live checklist', 'Checks that keep reporting and future live changes controlled.', preLiveChecklist()) + card('Next setup action', 'Smallest safe step from setup lifecycle.', safeActionCard('Next setup step', state.actions.filter((item) => item.lane === 'setup'))) + '</div>';
}
function proof() {
  const providers = state.reports.proof.providers ?? [];
  return '<div class="page-grid">' + card('Proof providers', 'Configured providers are required now; planned providers stay visible for later.', '<div class="matrix">' + providers.map((provider) => '<div class="matrix-cell"><div class="item-head"><h4>' + esc(providerLabel(provider.provider)) + '</h4>' + pill(provider.evidenceStatus === 'pass' ? 'ready' : provider.evidenceStatus === 'error' ? 'blocked' : 'warn', providerPhase(provider.provider)) + '</div><p>' + esc(friendlyProofMessage(provider.provider, provider)) + '</p><p>' + esc((provider.reportFamilies ?? []).length) + ' report families</p></div>').join('') + '</div>') + card('Proof next action', 'Smallest read-only evidence step before scheduled reporting.', actionList(state.actions.filter((item) => item.lane === 'proof'))) + '</div>';
}
function latestReceiptForLane(lane) {
  return state.receipts.filter((receipt) => receipt.lane === lane)[0];
}
function friendlyReceiptAction(action) {
  return String(action ?? 'receipt')
    .replace(/^ads\\./, '')
    .replace(/^gtm\\./, '')
    .replace(/[-_.]+/g, ' ')
    .replace(/\\b\\w/g, (char) => char.toUpperCase());
}
function adsIssueCards(args) {
  const cards = [];
  if (!args.latestAdsReceipt) {
    cards.push(decisionCard('Latest live action', 'missing', 'No ads mutation receipt is linked to this dashboard snapshot.'));
  }
  if (!args.planArtifact) {
    cards.push(decisionCard('Plan link', 'warn', 'The latest ads plan is not linked in this dashboard snapshot. Rebuild evidence before the next change.'));
  }
  if (args.paidReady < args.paidTotal) {
    cards.push(decisionCard('Evidence refresh', 'warn', args.paidReady + '/' + args.paidTotal + ' paid report families are fresh. Pull missing reports before optimization.'));
  }
  if (!args.audit?.ok) {
    cards.push(decisionCard('Optimization review', args.audit ? 'warn' : 'missing', args.audit ? 'Audit score ' + args.audit.score + '. Review warnings before changing bids or creative.' : 'Run the ads audit before making the next campaign change.'));
  }
  if (proofProvider('confirmedConversions')?.evidenceStatus !== 'pass') {
    cards.push(decisionCard('Business conversion proof', 'warn', 'Refresh confirmed product conversions before treating provider conversions as business truth.'));
  }
  return cards.length ? cards.join('') : decisionCard('No urgent blockers', 'ready', 'The dashboard has no immediate ads blockers from the current local evidence.', true);
}
function ads() {
  const ads = state.reports.adsStatus;
  const audit = state.reports.adsAudit;
  const paidFreshness = state.freshness.filter((cell) => cell.provider === 'googleAds' || cell.provider === 'metaAds');
  const paidRows = primaryComparisonRows(state.comparisons.channels.filter((row) => row.provider === 'googleAds' || row.provider === 'metaAds'));
  const auditActions = (audit?.actions ?? []).slice(0, 8).map((action) => ({ id: action.id, title: action.title, message: action.rationale, lane: 'ads', severity: action.severity === 'critical' || action.severity === 'high' ? 'critical' : action.severity === 'medium' ? 'warn' : 'info', command: action.command }));
  const adsActions = auditActions.length ? auditActions : state.actions.filter((item) => item.lane === 'ads');
  const adsReceipts = state.receipts.filter((receipt) => receipt.lane === 'ads');
  const planArtifact = state.artifacts.find((artifact) => artifact.id === 'ads.latestPlan');
  const auditStatus = audit ? (audit.ok ? 'ready' : 'warn') : 'missing';
  const paidReady = countByStatus(paidFreshness, 'ready');
  const paidTotal = paidFreshness.length;
  const latestAdsReceipt = latestReceiptForLane('ads');
  const latestActionStatus = latestAdsReceipt ? latestAdsReceipt.status : 'missing';
  const latestActionMessage = latestAdsReceipt
    ? friendlyReceiptAction(latestAdsReceipt.action) + (latestAdsReceipt.timestamp ? ' · ' + formatTimestamp(latestAdsReceipt.timestamp) : '')
    : 'No live ads receipt in the current dashboard snapshot.';
  const googleProvider = (ads.providers ?? []).find((provider) => provider.provider === 'googleAds');
  const googleStatus = googleProvider?.state === 'ready' || googleProvider?.state === 'configured'
    ? googleProvider.accountIdSet ? 'ready' : 'warn'
    : googleProvider?.state === 'disabled' ? 'blocked' : 'warn';
  const googleMessage = googleProvider?.accountIdSet
    ? 'Google Ads account is selected for this environment.'
    : 'Google Ads account selection is not confirmed in this snapshot.';
  const conversionFreshness = paidFreshness.find((cell) => cell.provider === 'googleAds' && cell.reportType === 'conversion');
  const campaignFreshness = paidFreshness.find((cell) => cell.provider === 'googleAds' && cell.reportType === 'campaign');
  const auctionFreshness = paidFreshness.find((cell) => cell.provider === 'googleAds' && cell.reportType === 'auctionInsight');
  const auditSections = audit ? '<div class="decision-grid">' + audit.sections.map((section) => decisionCard(section.label, section.status === 'pass' ? 'ready' : section.status === 'error' ? 'blocked' : 'warn', section.summary)).join('') + '</div>' : empty('Run ads audit to generate the detailed checklist.');
  const providerCards = (ads.providers ?? []).map((provider) => {
    const providerStatus = provider.state === 'ready' ? 'ready' : provider.state === 'disabled' ? 'blocked' : 'warn';
    const providerMessage = provider.state === 'ready'
      ? 'Account is ready for read-only report pulls.'
      : provider.state === 'planned'
        ? 'Planned later. Keep this provider read-only until account, tracking, and proof are ready.'
        : provider.state === 'disabled'
          ? 'Provider is disabled for this app.'
          : 'Provider setup still needs attention before reporting.';
    return statusCard(providerLabel(provider.provider), providerStatus, providerMessage, provider.accountIdEnv ? 'Account env configured' : 'No account selected yet');
  }).join('');
  const safetyCards = [
    decisionCard('Latest audit', auditStatus, audit ? 'Ads audit score ' + audit.score + '. ' + audit.nextWorkflowStep : 'Run ads audit before changing campaign settings.'),
    decisionCard('Latest plan', planArtifact ? 'ready' : 'missing', planArtifact ? 'A latest ads plan artifact is linked.' : 'Create a plan before diff, dry-run, or live mutation.'),
    decisionCard('Mutation receipts', adsReceipts.length > 0 ? 'ready' : 'missing', adsReceipts.length > 0 ? adsReceipts.length + ' ads receipt(s) available.' : 'No ads mutation receipt exists yet. Keep live changes blocked.'),
    decisionCard('Report evidence', countByStatus(paidFreshness, 'ready') > 0 ? 'ready' : 'missing', providerReadySummary(paidFreshness) + ' paid report families are ready.'),
    decisionCard('Live mutation guard', 'blocked', 'Live changes require dry-run receipt, approval ref, exact account, production, and operation confirmations.'),
  ].join('');
  return '<div class="page-grid"><div class="metrics">' + metricCards(['spend', 'conversions', 'cpa', 'roas']) + metricCard({ label: 'Evidence', value: providerReadySummary(paidFreshness), helper: 'Paid reports refreshed', status: paidReady > 0 ? 'ready' : 'missing' }) + '</div>' + card('Campaign control', 'The few signals to check before spending or changing bids.', '<div class="decision-grid">' + [
    decisionCard('Latest live action', latestActionStatus, latestActionMessage, Boolean(latestAdsReceipt)),
    decisionCard('Google Ads account', googleStatus, googleMessage),
    decisionCard('Campaign report', campaignFreshness?.status ?? 'missing', campaignFreshness?.message ?? 'Pull Google Ads campaign evidence after live changes.'),
    decisionCard('Conversion report', conversionFreshness?.status ?? 'missing', conversionFreshness?.message ?? 'Pull Google Ads conversion evidence before judging CPA.'),
  ].join('') + '</div>') + card('Needs attention', 'Only the gaps that can affect spend, measurement, or the next optimization.', '<div class="decision-grid">' + adsIssueCards({ latestAdsReceipt, planArtifact, paidReady, paidTotal, audit }) + '</div>') + card('Spend and conversions', paidRows.length ? 'Provider rows for the current date window.' : 'No spend yet. This is normal immediately after launch.', comparisonTable(paidRows)) + card('Measurement and assets', 'Tracking, conversion truth, assets, and competitive evidence that affect optimization quality.', '<div class="status-grid">' + [
    statusCard('GTM', proofProvider('gtm')?.evidenceStatus === 'pass' ? 'ready' : 'warn', friendlyProofMessage('gtm', proofProvider('gtm')), providerPhase('gtm')),
    statusCard('GA4', proofProvider('ga4')?.evidenceStatus === 'pass' ? 'ready' : 'warn', friendlyProofMessage('ga4', proofProvider('ga4')), providerPhase('ga4')),
    statusCard('Business conversions', proofProvider('confirmedConversions')?.evidenceStatus === 'pass' ? 'ready' : 'warn', friendlyProofMessage('confirmedConversions', proofProvider('confirmedConversions')), providerPhase('confirmedConversions')),
    statusCard('Auction insights', auctionFreshness?.status ?? 'missing', auctionFreshness?.message ?? 'Pull auction insights after traffic exists.'),
  ].join('') + '</div>') + card('Detailed audit', 'Secondary checklist for search terms, negatives, competitors, and creative readiness.', auditSections) + card('Advanced safety', 'Controls for future live changes. These are not campaign health warnings.', '<div class="decision-grid">' + safetyCards + '</div>') + card('Next action', 'Smallest useful step from current evidence.', safeActionCard('Refresh paid evidence', adsActions)) + '</div>';
}
function analytics() {
  const analyticsFreshness = state.freshness.filter((cell) => cell.provider === 'ga4' || cell.provider === 'searchConsole');
  const analyticsActions = state.actions.filter((item) => item.lane === 'analytics');
  return '<div class="page-grid"><div class="metrics">' + metricCards(['conversions', 'traffic', 'ctr']) + metricCard({ label: 'GA4 reports', value: providerReadySummary(providerFreshness('ga4')), helper: 'Landing page/channel/source-medium', status: countByStatus(providerFreshness('ga4'), 'ready') > 0 ? 'ready' : 'missing' }) + metricCard({ label: 'Search Console', value: providerReadySummary(providerFreshness('searchConsole')), helper: 'Query/page organic evidence', status: countByStatus(providerFreshness('searchConsole'), 'ready') > 0 ? 'ready' : 'missing' }) + '</div><div class="grid-2">' + card('Measurement trust', 'Check whether analytics data is safe enough to drive decisions.', '<div class="status-grid">' + [proofStatusCard('ga4', 'GA4 proof'), proofStatusCard('searchConsole', 'Search Console proof'), proofStatusCard('confirmedConversions', 'Confirmed conversions')].join('') + '</div>') + card('Attribution alignment', 'Ads, SEO, and product conversions should reconcile before optimization.', '<div class="decision-grid">' + [
    decisionCard('Provider data', countByStatus(analyticsFreshness, 'ready') > 0 ? 'ready' : 'missing', providerReadySummary(analyticsFreshness) + ' analytics report families are fresh.'),
    decisionCard('Conversion truth', proofProvider('confirmedConversions')?.evidenceStatus === 'pass' ? 'ready' : 'warn', friendlyProofMessage('confirmedConversions', proofProvider('confirmedConversions'))),
  ].join('') + '</div>') + '</div>' + card('Analytics evidence', 'GA4 and Search Console report families used by the dashboard.', matrix(analyticsFreshness)) + card('Next analytics action', 'Smallest step to improve measurement trust.', safeActionCard('Refresh analytics evidence', analyticsActions)) + '</div>';
}
function seo() {
  const searchFreshness = providerFreshness('searchConsole');
  const seoEvidence = state.artifacts.filter((item) => item.id.includes('searchConsole'));
  const queryCell = searchFreshness.find((cell) => cell.reportType === 'query');
  const pageCell = searchFreshness.find((cell) => cell.reportType === 'page');
  const queryPageCell = searchFreshness.find((cell) => cell.reportType === 'queryPage');
  return '<div class="page-grid"><div class="metrics">' + metricCards(['traffic', 'ctr']) + metricCard({ label: 'Organic evidence', value: providerReadySummary(searchFreshness), helper: 'Search Console report families', status: countByStatus(searchFreshness, 'ready') > 0 ? 'ready' : 'missing' }) + metricCard({ label: 'Linked evidence', value: String(seoEvidence.length), helper: 'Search Console files available', status: seoEvidence.length > 0 ? 'ready' : 'missing' }) + '</div><div class="grid-2">' + card('Organic decision map', 'Use this to decide whether the next SEO move is query, page, or content work.', '<div class="decision-grid">' + [
    decisionCard('Query demand', queryCell?.status ?? 'missing', queryCell?.message ?? 'No query report has been pulled.'),
    decisionCard('Page performance', pageCell?.status ?? 'missing', pageCell?.message ?? 'No page report has been pulled.'),
    decisionCard('Query-page match', queryPageCell?.status ?? 'missing', queryPageCell?.message ?? 'No query/page report has been pulled.'),
  ].join('') + '</div>') + card('Content opportunity workflow', 'Organic recommendations need fresh query/page evidence before planning.', '<div class="status-grid">' + [proofStatusCard('searchConsole', 'Search Console proof'), statusCard('Competitor research', seoEvidence.length > 0 ? 'ready' : 'missing', seoEvidence.length > 0 ? 'Search Console evidence is available for SEO analysis.' : 'Run Search Console or competitor research before opportunity planning.'), statusCard('Internal links', countByStatus(searchFreshness, 'ready') > 0 ? 'warn' : 'missing', countByStatus(searchFreshness, 'ready') > 0 ? 'Ready for opportunity planning.' : 'Waiting on organic evidence.')].join('') + '</div>') + '</div>' + card('Organic queries', 'Top Search Console query and landing-page rows for SEO decisions.', organicQueryTable(state.seo?.rows ?? [])) + card('Organic evidence', 'Search Console freshness by organic report family.', matrix(searchFreshness)) + card('Next SEO pull', 'Smallest data step for organic analysis.', emptyState('Pull Search Console query/page evidence', 'This creates the organic evidence used for page/query decisions and recommendations.')) + '</div>';
}
function researchRecordList(records) {
  if (!records || records.length === 0) return empty('No research records yet.');
  return '<div class="list">' + records.map((record) => '<article class="item"><div class="item-head"><h4>' + esc(record.title) + '</h4>' + pill(record.status ?? 'ready', record.priority ?? 'p1') + '</div><p>' + esc(record.summary) + '</p>' + (record.keywords?.length ? '<p class="path">Keywords: ' + esc(record.keywords.slice(0, 8).join(', ')) + '</p>' : '') + '</article>').join('') + '</div>';
}
function researchOpportunityList(items) {
  if (!items || items.length === 0) return empty('No page opportunities captured yet.');
  return '<div class="list">' + items.map((item) => '<article class="item"><div class="item-head"><h4>' + esc(item.title) + '</h4>' + pill(item.status ?? 'planned', item.priority) + '</div><p>' + esc(item.rationale) + '</p>' + (item.routePath ? '<p class="path">' + esc(item.routePath) + (item.primaryKeyword ? ' · ' + esc(item.primaryKeyword) : '') + '</p>' : '') + '</article>').join('') + '</div>';
}
function researchDecisionList(items) {
  if (!items || items.length === 0) return empty('No decisions captured yet.');
  return '<div class="list">' + items.map((item) => '<article class="item"><div class="item-head"><h4>' + esc(item.decision) + '</h4>' + pill(item.status ?? 'decided') + '</div><p>' + esc(item.rationale) + '</p></article>').join('') + '</div>';
}
function researchActionList(items) {
  if (!items || items.length === 0) return empty('No open research actions.');
  return '<div class="list">' + items.map((item) => '<article class="item"><div class="item-head"><h4>' + esc(item.title) + '</h4>' + pill(item.status ?? 'todo', item.priority ?? 'p1') + '</div><p>' + esc(item.summary) + '</p></article>').join('') + '</div>';
}
function research() {
  const researchStatus = state.reports.researchStatus;
  const keywordResearch = state.keywordResearch ?? { status: 'missing', metricCount: 0, totalKnownVolume: 0, keywords: [], matrix: [], clusters: [], markets: [], topKeywords: [] };
  const competitorResearch = state.competitorResearch ?? { status: 'missing', sourceCount: 0, pageCount: 0, domainCount: 0, keywordCount: 0, domains: [], pages: [], opportunities: [] };
  const faqResearch = state.faqResearch ?? { status: 'missing', sourceCount: 0, questionCount: 0, pageCount: 0, approvedCount: 0, highPriorityCount: 0, totalKnownVolume: 0, qualityScore: 0, evidenceSourceCount: 0, marketCount: 0, needsProofCount: 0, duplicateQuestionCount: 0, routeConflictCount: 0, warnings: [], pages: [], questions: [], topQuestions: [] };
  const seoIntelligence = state.seoIntelligence ?? { status: 'missing', score: 0, serp: { status: 'missing', sourceCount: 0, snapshotCount: 0, countryCount: 0, keywordCount: 0, snapshots: [] }, metadata: { status: 'missing', sourceCount: 0, experimentCount: 0, readyCount: 0, experiments: [] }, pageAudits: { status: 'missing', sourceCount: 0, pageCount: 0, averageScore: 0, blockedCount: 0, warningCount: 0, audits: [] }, warnings: [] };
  const parts = routeParts();
  const view = parts[1] ?? 'overview';
  const detailId = parts[2] ? decodeURIComponent(parts[2]) : '';
  const status = researchStatus.errors.length > 0 ? 'blocked' : researchStatus.recordCount > 0 ? 'ready' : 'missing';
  const baseMetrics = '<div class="metrics">' + [
    metricCard({ label: 'Research records', value: String(researchStatus.recordCount), helper: 'Structured context files', status }),
    metricCard({ label: 'Decisions', value: String(researchStatus.decisionCount), helper: 'Accepted, rejected, or delayed calls', status: researchStatus.decisionCount > 0 ? 'ready' : 'missing' }),
    metricCard({ label: 'Page opportunities', value: String(researchStatus.opportunityCount), helper: 'Routes and landing-page ideas', status: researchStatus.opportunityCount > 0 ? 'ready' : 'missing' }),
    metricCard({ label: 'Keyword Planner', value: formatNumber(keywordResearch.metricCount), helper: formatNumber(keywordResearch.totalKnownVolume) + ' known monthly searches' + (keywordResearch.sourceCount ? ' · ' + keywordResearch.sourceCount + ' files' : ''), status: keywordResearch.status }),
    metricCard({ label: 'Competitors', value: formatNumber(competitorResearch.domainCount), helper: formatNumber(competitorResearch.pageCount) + ' pages · ' + formatNumber(competitorResearch.keywordCount) + ' keywords', status: competitorResearch.status }),
    metricCard({ label: 'FAQs', value: formatNumber(faqResearch.questionCount), helper: formatNumber(faqResearch.pageCount) + ' pages · ' + formatNumber(faqResearch.totalKnownVolume) + ' known searches', status: faqResearch.status }),
    metricCard({ label: 'SEO intelligence', value: formatNumber(seoIntelligence.score) + '/100', helper: formatNumber(seoIntelligence.serp.snapshotCount) + ' SERP · ' + formatNumber(seoIntelligence.metadata.experimentCount) + ' metadata · ' + formatNumber(seoIntelligence.pageAudits.pageCount) + ' audits', status: seoIntelligence.status }),
    metricCard({ label: 'Open actions', value: String(researchStatus.nextActionCount), helper: 'Follow-ups from research', status: researchStatus.nextActionCount > 0 ? 'warn' : 'ready' }),
  ].join('') + '</div>';
  if (view === 'record') {
    const record = researchRecordById(detailId);
    if (!record) {
      return '<div class="page-grid">' + researchNav('records') + emptyState('Research record not found', 'Return to the records table and choose an available research record.') + '</div>';
    }
    return '<div class="page-grid">' + researchNav('records') + '<div class="grid-2">' + card(record.title, record.kind + ' · ' + record.priority + ' · ' + record.status, '<p>' + esc(record.summary) + '</p>' + (record.keywords?.length ? '<p class="path">Keywords: ' + esc(record.keywords.join(', ')) + '</p>' : '') + (record.competitors?.length ? '<p class="path">Competitors: ' + esc(record.competitors.join(', ')) + '</p>' : '')) + card('Findings', 'Key points captured from this research record.', record.findings?.length ? '<div class="list">' + record.findings.map((finding) => '<article class="item"><p>' + esc(finding) + '</p></article>').join('') + '</div>' : empty('No findings captured.')) + '</div>' + card('Opportunities in this record', 'Route and page candidates from this research item.', researchOpportunityTable(record.opportunities ?? [])) + card('Decisions in this record', 'Accepted, rejected, or delayed calls tied to this research item.', researchDecisionTable([...(record.decisions ?? []), ...(record.rejectedIdeas ?? [])])) + card('Actions in this record', 'Follow-up work from this research item.', researchActionTable(record.nextActions ?? [])) + '</div>';
  }
  if (view === 'records') {
    return '<div class="page-grid">' + researchNav('records') + baseMetrics + card('Research records table', 'All structured records currently available to the dashboard.', researchRecordTable(researchStatus.records ?? researchStatus.topPriorities)) + '</div>';
  }
  if (view === 'opportunities') {
    return '<div class="page-grid">' + researchNav('opportunities') + card('Page opportunities table', 'Build candidates that can move into SEO opportunities or landing-page work.', researchOpportunityTable(researchStatus.opportunities)) + '</div>';
  }
  if (view === 'competitors') {
    return '<div class="page-grid">' + researchNav('competitors') + baseMetrics + '<div class="grid-2">' + card('Competitor opportunities', 'Page, copy, and product gaps we can use without copying competitor pages.', competitorOpportunityList(competitorResearch)) + card('Competitor evidence files', competitorResearch.path ? 'Latest competitor artifact: ' + competitorResearch.path : 'No competitor artifact has been loaded yet.', competitorResearch.sourceCount ? '<div class="status-grid">' + [
      statusCard('Files', competitorResearch.status, formatNumber(competitorResearch.sourceCount) + ' competitor artifact(s).'),
      statusCard('Domains', competitorResearch.domainCount > 0 ? 'ready' : 'missing', formatNumber(competitorResearch.domainCount) + ' competitor domain(s).'),
      statusCard('Pages', competitorResearch.pageCount > 0 ? 'ready' : 'missing', formatNumber(competitorResearch.pageCount) + ' competitor page(s).'),
    ].join('') + '</div>' : empty('No competitor evidence files yet.')) + '</div>' + card('Domain summary', 'Which competitors own visible page patterns and where TrueResume can differentiate.', competitorDomainTable(competitorResearch)) + card('Competitor pages', 'SERP and manual competitor page notes normalized for homepage, CV, and SEO planning.', competitorPageTable(competitorResearch)) + '</div>';
  }
  if (view === 'faqs') {
    return '<div class="page-grid">' + researchNav('faqs') + baseMetrics + '<div class="grid-2">' + card('Priority FAQ questions', 'Use these for homepage, CV, ATS, and template page FAQ blocks after matching page intent.', faqTopQuestionList(faqResearch)) + card('FAQ evidence files', faqResearch.path ? 'Latest FAQ artifact: ' + faqResearch.path : 'No FAQ artifact has been loaded yet.', faqResearch.sourceCount ? '<div class="status-grid">' + [
      statusCard('Files', faqResearch.status, formatNumber(faqResearch.sourceCount) + ' FAQ artifact(s).'),
      statusCard('Pages', faqResearch.pageCount > 0 ? 'ready' : 'missing', formatNumber(faqResearch.pageCount) + ' page(s) mapped.'),
      statusCard('Approved', faqResearch.approvedCount > 0 ? 'ready' : 'warn', formatNumber(faqResearch.approvedCount) + ' approved question(s).'),
      statusCard('Quality', faqResearch.qualityScore >= 80 ? 'ready' : 'warn', formatNumber(faqResearch.qualityScore) + '/100 FAQ quality score.'),
    ].join('') + '</div>' : empty('No FAQ evidence files yet.')) + '</div>' + card('FAQ quality gates', 'Search-volume proof, evidence mix, market coverage, duplicate detection, and page ownership checks.', faqQualityPanel(faqResearch)) + card('FAQ page map', 'Which pages own which questions so FAQ blocks do not duplicate or cannibalize each other.', faqPageSummaryTable(faqResearch)) + card('FAQ question table', 'Question intent, priority, answer guidance, search evidence, and internal links.', faqQuestionTable(faqResearch)) + '</div>';
  }
  if (view === 'intelligence') {
    return '<div class="page-grid">' + researchNav('intelligence') + baseMetrics + card('SEO intelligence gates', 'SERP intent snapshots, metadata experiments, and rendered-page audits that decide what to optimize next.', seoIntelligenceQualityPanel(seoIntelligence)) + card('SERP intent snapshots', 'Country-specific Google result patterns and competitor domains for deciding page type and content angle.', serpSnapshotTable(seoIntelligence)) + card('Metadata experiments', 'Title and description candidates to test against Search Console CTR and position.', metadataExperimentTable(seoIntelligence)) + card('Page audit queue', 'Research-versus-page checks for missing intent, schema, FAQ, internal links, and trust signals.', pageAuditTable(seoIntelligence)) + '</div>';
  }
  if (view === 'actions') {
    return '<div class="page-grid">' + researchNav('actions') + card('Research action table', 'Open follow-ups from competitor research, keyword research, and page planning.', researchActionTable(researchStatus.nextActions)) + '</div>';
  }
  if (view === 'decisions') {
    return '<div class="page-grid">' + researchNav('decisions') + card('Decision table', 'Accepted, rejected, or delayed calls so future discussions do not restart from zero.', researchDecisionTable([...(researchStatus.decisions ?? []), ...(researchStatus.rejectedIdeas ?? [])])) + '</div>';
  }
  if (view === 'evidence') {
    const evidenceView = parts[2] ?? 'clusters';
    if (evidenceView === 'markets') {
      return '<div class="page-grid">' + researchNav('evidence') + keywordEvidenceTabs('markets') + baseMetrics + card('Market summary', 'Compare markets before choosing SEO pages, paid campaigns, bids, and landing-page language.', keywordMarketSummaryTable(keywordResearch)) + keywordMarketSections(keywordResearch) + card('Research evidence files', 'Structured memory artifacts used by this dashboard.', researchEvidenceTable(researchStatus.files)) + '</div>';
    }
    if (evidenceView === 'raw') {
      return '<div class="page-grid">' + researchNav('evidence') + keywordEvidenceTabs('raw') + baseMetrics + card('Full Keyword Planner table', keywordResearch.path ? 'All aggregated Google Ads keyword-volume rows from ' + (keywordResearch.sourceCount ?? 1) + ' metric file(s).' : 'No Google Ads keyword-volume metric file has been fetched yet.', keywordPlannerTable(keywordResearch, { full: true })) + card('Research evidence files', 'Structured memory artifacts used by this dashboard.', researchEvidenceTable(researchStatus.files)) + '</div>';
    }
    if (evidenceView === 'matrix') {
      return '<div class="page-grid">' + researchNav('evidence') + keywordEvidenceTabs('matrix') + baseMetrics + card('Keyword market matrix', 'One row per keyword, with market-specific volume and competition side by side. Use this after choosing a cluster.', keywordMatrixTable(keywordResearch)) + card('Market summary', 'Compare market totals before choosing campaigns and page language.', keywordMarketSummaryTable(keywordResearch)) + card('Research evidence files', 'Structured memory artifacts used by this dashboard.', researchEvidenceTable(researchStatus.files)) + '</div>';
    }
    return '<div class="page-grid">' + researchNav('evidence') + keywordEvidenceTabs('clusters') + baseMetrics + card('Keyword clusters', 'Planning-first grouping for SEO pages, ad groups, landing-page copy, and LLM recommendations. Start here before looking at raw keywords.', keywordClusterTable(keywordResearch)) + keywordClusterSections(keywordResearch) + card('Market summary', 'Use this to decide which cluster deserves which market-specific campaign or page.', keywordMarketSummaryTable(keywordResearch)) + '</div>';
  }
  return '<div class="page-grid">' + researchNav('overview') + baseMetrics + '<div class="grid-2">' + card('What we know', 'Important findings from research sessions, not raw transcripts.', researchRecordList(researchStatus.topPriorities)) + card('Keyword Planner evidence', keywordResearch.path ? 'Search volume, competition, and bid evidence from Google Ads.' : 'Fetch Google Ads keyword-volume evidence before choosing paid/SEO expansion.', keywordPlannerTable(keywordResearch)) + '</div><div class="grid-2">' + card('Next research actions', 'Smallest useful planning moves from the current memory.', researchActionList(researchStatus.nextActions.slice(0, 8))) + card('Top page opportunities', 'Build candidates that can move into SEO opportunities or landing-page work.', researchOpportunityList(researchStatus.opportunities.slice(0, 8))) + '</div><div class="grid-2">' + card('Decisions and rejected ideas', 'Why we chose or delayed pages, so future chats do not restart from zero.', researchDecisionList([...(researchStatus.decisions ?? []), ...(researchStatus.rejectedIdeas ?? [])].slice(0, 8))) + card('Research evidence files', 'Structured memory artifacts used by this dashboard.', researchEvidenceTable(researchStatus.files)) + '</div></div>';
}
function gtmArtifact(id) {
  return state.artifacts.find((item) => item.id === id);
}
function gtmStatusModel() {
  const artifacts = state.artifacts.filter((item) => item.lane === 'gtm');
  const receipts = state.receipts.filter((receipt) => receipt.lane === 'gtm');
  const proof = proofProvider('gtm');
  const manifestStatus = proof?.evidenceStatus === 'pass' ? 'ready' : proof?.evidenceStatus === 'error' ? 'blocked' : 'warn';
  const latestPlan = gtmArtifact('gtm.plan.latest');
  const latestApply = gtmArtifact('gtm.apply.latest');
  const latestPreview = gtmArtifact('gtm.preview.latest');
  const latestVersion = gtmArtifact('gtm.version.latest');
  const latestPublish = gtmArtifact('gtm.publish.latest');
  const latestRollback = gtmArtifact('gtm.rollback.latest');
  const zeroDrift = latestPlan?.status === 'ready';
  const previewReady = latestPreview?.status === 'ready';
  const versionReady = Boolean(latestVersion);
  const publishReady = Boolean(latestPublish);
  const nextTitle = !latestPlan ? 'Create GTM plan' : !zeroDrift ? 'Apply reviewed plan' : !previewReady ? 'Run GTM preview' : !versionReady ? 'Create reviewed version' : !publishReady ? 'Publish with approval' : 'Monitor live tracking';
  const workspaceId = state.gtm?.workspaceId ?? '<workspace-id>';
  const previewReceipt = latestPreview?.path ?? '<preview-receipt>';
  const versionReceipt = latestVersion?.path ?? '<version-receipt>';
  const nextCommand = !latestPlan
    ? 'unisane growth gtm plan --app ' + state.appId + ' --env ' + state.environment
    : !zeroDrift
      ? 'unisane growth gtm apply --app ' + state.appId + ' --env ' + state.environment + ' --yes'
      : !previewReady
        ? 'unisane growth gtm preview --app ' + state.appId + ' --env ' + state.environment
        : !versionReady
          ? 'unisane growth gtm create-version --app ' + state.appId + ' --env ' + state.environment + ' --workspace-id ' + workspaceId + ' --preview-receipt ' + previewReceipt + ' --name <release-name> --yes'
          : !publishReady
            ? 'unisane growth gtm publish --app ' + state.appId + ' --env ' + state.environment + ' --version-receipt ' + versionReceipt + ' --production-confirm ' + state.appId + ':production:<version> --yes'
            : 'unisane growth marketing status --mode analytics';
  return {
    artifacts,
    receipts,
    proof,
    manifestStatus,
    latestPlan,
    latestApply,
    latestPreview,
    latestVersion,
    latestPublish,
    latestRollback,
    zeroDrift,
    previewReady,
    versionReady,
    publishReady,
    nextTitle,
    nextCommand,
  };
}
function identityValue(value) {
  return value || 'Not discovered yet';
}
function gtm() {
  const model = gtmStatusModel();
  const publishStatus = model.publishReady ? 'ready' : model.versionReady ? 'warn' : 'missing';
  return '<div class="page-grid"><div class="metrics">' + [
    metricCard({ label: 'Manifest', value: model.manifestStatus, helper: model.proof?.evidenceMessage ?? 'GTM proof has not run yet', status: model.manifestStatus }),
    metricCard({ label: 'Workspace', value: model.latestApply ? 'Applied' : 'Pending', helper: 'Latest GTM workspace apply evidence', status: model.latestApply ? 'ready' : 'missing' }),
    metricCard({ label: 'Drift', value: model.zeroDrift ? 'Zero' : model.latestPlan ? 'Needs apply' : 'Unknown', helper: 'Latest plan compared local manifest to remote workspace', status: model.zeroDrift ? 'ready' : model.latestPlan ? 'warn' : 'missing' }),
    metricCard({ label: 'Preview', value: model.previewReady ? 'Passed' : 'Missing', helper: 'Quick preview evidence', status: model.latestPreview?.status ?? 'missing' }),
    metricCard({ label: 'Publish', value: model.publishReady ? 'Published' : 'Pending', helper: 'Publish waits for version evidence and explicit production confirmation', status: publishStatus }),
  ].join('') + '</div><div class="grid-2">' + card('Container identity', 'Remote GTM account and workspace detected from latest receipts.', '<div class="status-grid">' + [
    statusCard('Public GTM ID', state.gtm?.publicId ? 'ready' : 'missing', identityValue(state.gtm?.publicId)),
    statusCard('Account', state.gtm?.accountId ? 'ready' : 'missing', identityValue(state.gtm?.accountId)),
    statusCard('Container', state.gtm?.containerId ? 'ready' : 'missing', identityValue(state.gtm?.containerId)),
    statusCard('Workspace', state.gtm?.workspaceId ? 'ready' : 'missing', identityValue(state.gtm?.workspaceId)),
  ].join('') + '</div>') + card('Workflow proof', 'Each step should have local evidence before the next mutation.', '<div class="status-grid">' + [
    statusCard('Snapshot pulled', model.latestPlan || model.latestApply || model.latestPreview ? 'ready' : 'missing', model.latestPlan ? 'Latest plan is linked.' : 'Pull and plan before remote changes.'),
    statusCard('Plan validated', model.latestPlan?.status ?? 'missing', model.zeroDrift ? 'Latest plan has zero operations; local manifest matches the remote workspace.' : model.latestPlan ? 'Latest plan still has operations to review/apply.' : 'No GTM plan evidence is linked.'),
    statusCard('Workspace applied', model.latestApply ? 'ready' : 'missing', model.latestApply ? 'Apply evidence is available.' : 'No apply evidence is linked.'),
    statusCard('Preview passed', model.latestPreview?.status ?? 'missing', model.previewReady ? 'Quick preview passed without compiler errors.' : 'Run preview after workspace is applied.'),
    statusCard('Version created', model.versionReady ? 'ready' : 'missing', model.versionReady ? 'Version evidence is available.' : 'Create version only after preview review.'),
    statusCard('Rollback source', model.latestRollback ? 'ready' : 'warn', model.latestRollback ? 'Rollback evidence exists.' : 'Normal rollback still requires reviewed version evidence; emergency rollback requires actor, reason, and reconciliation task.'),
  ].join('') + '</div>') + '</div>' + card('Publish safety', 'No publish should happen without reviewed proof and explicit confirmation.', '<div class="decision-grid">' + [
    decisionCard('Zero drift', model.zeroDrift ? 'ready' : 'warn', model.zeroDrift ? 'Local manifest and remote workspace match.' : 'Review/apply the latest plan before versioning.'),
    decisionCard('Preview evidence', model.previewReady ? 'ready' : 'missing', model.previewReady ? 'Preview evidence is available.' : 'Create preview evidence before versioning.'),
    decisionCard('Publish gate', model.publishReady ? 'ready' : 'warn', model.publishReady ? 'Publish evidence exists.' : 'Publishing remains pending until you explicitly approve the version evidence.'),
    decisionCard('Emergency rollback', 'warn', 'Allowed only with explicit emergency reason, actor, and reconciliation task.'),
  ].join('') + '</div>') + card('Provider tags in container', 'Current manifest intent for True Resume tracking.', '<div class="status-grid">' + [
    statusCard('GA4 measurement', 'ready', 'GA4 events are active through GTM for True Resume.'),
    statusCard('Google Ads conversions', 'warn', 'Placeholder tags stay paused/no-op until conversion IDs and labels are configured.'),
    statusCard('Meta pixel', 'warn', 'Placeholder tag stays paused/no-op until Pixel ID is configured.'),
    statusCard('Consent defaults', 'ready', 'Consent defaults fire before tracking tags.'),
  ].join('') + '</div>') + card('Next GTM action', 'Smallest safe next step from current local evidence.', emptyState(model.nextTitle, model.publishReady ? 'GTM is published; move to analytics verification and event QA.' : 'Keep the next mutation reviewed and do not publish without explicit approval.')) + '</div>';
}
function recommendations() {
  return '<div class="page-grid">' + card('Action queue', 'Recommendations and blockers from current evidence.', actionList(state.actions)) + card('Decision evidence', 'Decision and alert receipts when available.', receiptTimeline(false)) + '</div>';
}
function receipts() {
  return '<div class="page-grid">' + card('Receipt timeline', 'Audit evidence for dry-run, live apply, decision, publish, and rollback flows.', receiptTimeline()) + card('Receipt artifacts', 'Local receipt paths.', artifactTable(state.artifacts.filter((item) => item.id.startsWith('receipt.')))) + '</div>';
}
function schedule() {
  const schedule = state.schedule;
  if (schedule) {
    return '<div class="page-grid">' + card('Scheduled reporting plan', 'Read-only provider pull jobs generated after proof.', '<div class="metrics">' + [metricCard({label:'Jobs', value:String(schedule.jobCount), helper:'Total scheduled pulls', status:schedule.status}), metricCard({label:'Ready', value:String(schedule.readyJobs), helper:'Can run after proof', status:schedule.readyJobs ? 'ready' : 'missing'}), metricCard({label:'Blocked', value:String(schedule.blockedJobs), helper:'Needs proof/fix', status:schedule.blockedJobs ? 'blocked' : 'ready'})].join('') + '</div>') + card('Provider readiness', 'Reports that recurring pulls would refresh.', matrix(state.freshness.slice(0, 8))) + '</div>';
  }
  const steps = [
    { status: state.readiness.status === 'ready' ? 'ready' : 'blocked', title: 'Finish proof', message: 'Scheduled reporting should wait until real provider proof is available.' },
    { status: 'missing', title: 'Generate plan', message: 'Create a read-only pull schedule only after provider/report families are known.' },
    { status: 'missing', title: 'Review cadence', message: 'Keep first release low-cost: daily/weekly pulls only for reports that change decisions.' },
  ];
  return '<div class="page-grid"><div class="metrics">' + [
    metricCard({ label: 'Plan', value: 'Missing', helper: 'No schedule plan yet' }),
    metricCard({ label: 'Proof', value: state.readiness.status, helper: state.readiness.label }),
    metricCard({ label: 'Reports', value: String(state.freshness.filter((cell) => cell.status === 'ready').length), helper: 'Fresh provider evidence' }),
  ].join('') + '</div>' + card('Schedule workflow', 'Run reporting only after the proof gates are clear.', '<div class="workflow-grid">' + steps.map((step) => '<article class="workflow-step">' + pill(step.status) + '<h4>' + esc(step.title) + '</h4><p>' + esc(step.message) + '</p></article>').join('') + '</div>') + card('Next safe step', 'Smallest useful step before enabling recurring pulls.', '<div class="command-cta"><h4>Refresh proof evidence first</h4><p>' + esc(state.readiness.nextWorkflowStep) + '</p></div>') + '</div>';
}
const renderers = { overview, setup, proof, performance, ads, seo, research, analytics, gtm, recommendations, receipts, schedule };
function inspectorTabs() {
  const tabs = [
    ['inspector', 'Inspect'],
    ['evidence', 'Evidence'],
    ['assistant', 'Assist'],
  ];
  return '<div class="pane-tabs" role="tablist">' + tabs.map(([id, label]) => '<button class="pane-tab ' + (shellPrefs.inspectorMode === id ? 'active' : '') + '" type="button" data-action="set-inspector-mode" data-mode="' + esc(id) + '">' + esc(label) + '</button>').join('') + '</div>';
}
function assistantPanel(route, actions) {
  const firstAction = actions[0];
  return '<div class="assistant-thread"><article class="assistant-message"><h4>What matters now</h4><p>' + esc(route.summary) + '</p></article><article class="assistant-message"><h4>Suggested next move</h4><p>' + esc(firstAction?.message ?? state.readiness.nextWorkflowStep) + '</p>' + (firstAction?.command ? '<div class="command">' + esc(firstAction.command) + '</div>' : '') + '</article><article class="assistant-message"><h4>How I can help</h4><p>Ask for the next command, a blocker explanation, a provider report summary, or a safe dry-run plan from current local evidence.</p></article></div>';
}
function inspectorRouteBody(route, actions, artifacts) {
  if (route.id === 'setup') {
    const stages = state.reports.setup.stages ?? [];
    const stage = (title, match) => {
      const item = stages.find((candidate) => candidate.title === match);
      return statusCard(title, item?.status === 'pass' ? 'ready' : item?.status === 'blocked' ? 'blocked' : 'warn', item?.message ?? 'Not checked yet.');
    };
    return '<div class="card"><div class="card-body">' + pill(route.status) + '<p class="inspector-note">Finish login and proof gates before scheduled pulls or live changes.</p></div></div><div style="height:14px"></div>' + card('Pre-live focus', 'Only the critical live-use gates.', '<div class="status-grid">' + [
      stage('Domain', 'Deployed Domain'),
      stage('Google OAuth', 'Provider Login'),
      stage('Discovery', 'Provider Discovery'),
      statusCard('Mutation policy', 'warn', 'Dry-run, receipt, exact confirmations, and production confirmation stay required.'),
    ].join('') + '</div>') + '<div style="height:14px"></div>' + card('Next step', 'Smallest setup move.', safeActionCard('Resolve setup blocker', actions));
  }
  if (route.id === 'ads') {
    const paidFreshness = state.freshness.filter((cell) => cell.provider === 'googleAds' || cell.provider === 'metaAds');
    const latestAdsReceipt = latestReceiptForLane('ads');
    return card('Operator checklist', 'What to confirm before judging or changing the campaign.', '<div class="decision-grid">' + [
      decisionCard('Latest action', latestAdsReceipt ? latestAdsReceipt.status : 'missing', latestAdsReceipt ? friendlyReceiptAction(latestAdsReceipt.action) + (latestAdsReceipt.timestamp ? ' · ' + formatTimestamp(latestAdsReceipt.timestamp) : '') : 'No ads receipt is linked to this snapshot.'),
      decisionCard('Paid evidence', countByStatus(paidFreshness, 'ready') > 0 ? 'ready' : 'missing', providerReadySummary(paidFreshness) + ' paid report families are fresh.'),
      decisionCard('Future live changes', 'blocked', 'Plan, receipt, approval ref, exact confirmations, and executor gate are still required.'),
    ].join('') + '</div>') + '<div style="height:14px"></div>' + card('Next step', 'Smallest useful ads action.', safeActionCard('Refresh paid evidence', actions));
  }
  if (route.id === 'seo') {
    return card('Organic focus', 'SEO should start from Search Console query/page truth.', '<div class="status-grid">' + [statusCard('Search Console', countByStatus(providerFreshness('searchConsole'), 'ready') > 0 ? 'ready' : 'missing', providerReadySummary(providerFreshness('searchConsole')) + ' report families ready.'), statusCard('Next pull', 'missing', 'Create query/page evidence before planning organic changes.')].join('') + '</div>');
  }
  if (route.id === 'research') {
    const researchStatus = state.reports.researchStatus;
    return card('Research memory', 'Use this before deciding pages, keywords, ads, or landing-page copy.', '<div class="status-grid">' + [
      statusCard('Records', researchStatus.recordCount > 0 ? 'ready' : 'missing', researchStatus.recordCount + ' structured records.'),
      statusCard('Decisions', researchStatus.decisionCount > 0 ? 'ready' : 'missing', researchStatus.decisionCount + ' decisions captured.'),
      statusCard('Opportunities', researchStatus.opportunityCount > 0 ? 'ready' : 'missing', researchStatus.opportunityCount + ' opportunities captured.'),
      statusCard('Errors', researchStatus.errors.length > 0 ? 'blocked' : 'ready', researchStatus.errors.length > 0 ? 'Fix invalid research files.' : 'Research files parse cleanly.'),
    ].join('') + '</div>') + '<div style="height:14px"></div>' + card('Next step', 'Research workflow.', safeActionCard('Continue planning', actions));
  }
  if (route.id === 'analytics') {
    return card('Measurement trust', 'Use this before trusting ads or SEO decisions.', '<div class="status-grid">' + [proofStatusCard('ga4', 'GA4'), proofStatusCard('searchConsole', 'Search Console'), proofStatusCard('confirmedConversions', 'Confirmed conversions')].join('') + '</div>') + '<div style="height:14px"></div>' + card('Next step', 'Analytics evidence.', safeActionCard('Refresh analytics evidence', actions));
  }
  if (route.id === 'gtm') {
    const model = gtmStatusModel();
    return card('GTM next step', 'Current workspace proof and publish guard.', '<div class="decision-grid">' + [
      decisionCard('Zero drift', model.zeroDrift ? 'ready' : 'warn', model.zeroDrift ? 'Latest plan has zero operations.' : 'Plan/apply is still required before versioning.'),
      decisionCard('Preview evidence', model.previewReady ? 'ready' : 'missing', model.previewReady ? 'Quick preview passed.' : 'Run preview before create-version.'),
      decisionCard('Publish gate', model.publishReady ? 'ready' : 'warn', model.publishReady ? 'Publish evidence exists.' : 'Publish still requires version evidence and explicit production confirmation.'),
      decisionCard('Emergency rollback', 'warn', 'Allowed only with explicit emergency reason, actor, and reconciliation task.'),
    ].join('') + '</div>');
  }
  if (route.id === 'performance') {
    return card('Decision readiness', 'Performance is read-only until provider reports exist.', '<div class="decision-grid">' + [decisionCard('Data coverage', countByStatus(state.freshness, 'ready') > 0 ? 'ready' : 'missing', countByStatus(state.freshness, 'ready') + '/' + state.freshness.length + ' reports ready.'), decisionCard('Comparable rows', state.comparisons.channels.length > 0 ? 'ready' : 'missing', state.comparisons.channels.length > 0 ? 'Comparison rows available.' : 'Pull reports before optimizing.')].join('') + '</div>');
  }
  return '<div class="card"><div class="card-body">' + pill(route.status) + '<p class="inspector-note">' + esc(state.readiness.nextWorkflowStep) + '</p></div></div><div style="height:14px"></div>' + card('Next step', 'Contextual action queue.', actionList(actions));
}
function inspector() {
  const current = routes.get(routeId());
  const actions = routeActions(current.id);
  const artifacts = routeArtifacts(current.id);
  const modeBody = shellPrefs.inspectorMode === 'evidence'
    ? card('Evidence', 'Latest linked artifacts.', evidenceList(artifacts))
    : shellPrefs.inspectorMode === 'assistant'
      ? assistantPanel(current, actions)
      : inspectorRouteBody(current, actions, artifacts);
  return '<aside class="inspector" aria-label="Route inspector"><div class="inspector-shell-header"><div class="inspector-shell-title"><h3>' + esc(current.label) + '</h3><p>' + esc(current.summary) + '</p></div><button class="icon-button" type="button" data-action="toggle-inspector" aria-label="Close inspector"><span class="icon close"></span></button></div>' + inspectorTabs() + modeBody + '</aside>';
}
function nav() {
  const current = routeId();
  return state.routes.map((route) => '<a href="#/' + route.id + '" class="' + (route.id === current ? 'active' : '') + '" title="' + esc(route.label) + '"><span class="nav-icon">' + routeIcon(route.id) + '</span><span class="nav-label">' + esc(route.label) + '</span></a>').join('');
}
function shellClassName() {
  return [
    'shell',
    shellPrefs.sidebarCollapsed ? 'sidebar-collapsed' : '',
    shellPrefs.inspectorOpen ? '' : 'inspector-closed',
    shellPrefs.mobileNavOpen ? 'mobile-nav-open' : '',
  ].filter(Boolean).join(' ');
}
function shellControls() {
  return '<button class="icon-button sidebar-toggle-button" type="button" data-action="toggle-sidebar" aria-label="' + (shellPrefs.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar') + '"><span class="icon sidebar-panel"></span></button>';
}
function headerActions() {
  const currentRoute = routes.get(routeId());
  const status = currentRoute?.id === 'overview' ? state.readiness.status : currentRoute?.status ?? state.readiness.status;
  const label = currentRoute?.id === 'overview' ? state.readiness.label : (currentRoute?.label ?? 'Route') + ' ' + status;
  return '<div class="topbar-actions">' + pill(status, label) + '<button class="icon-button" type="button" data-action="toggle-inspector" aria-label="' + (shellPrefs.inspectorOpen ? 'Hide inspector' : 'Show inspector') + '"><span class="icon panel"></span></button></div>';
}
function bindShellControls() {
  app.querySelectorAll('[data-action="toggle-sidebar"]').forEach((button) => {
    button.addEventListener('click', () => {
      shellPrefs.sidebarCollapsed = !shellPrefs.sidebarCollapsed;
      storeFlag('marketing-console-sidebar-collapsed', shellPrefs.sidebarCollapsed);
      render();
    });
  });
  app.querySelectorAll('[data-action="toggle-inspector"]').forEach((button) => {
    button.addEventListener('click', () => {
      shellPrefs.inspectorOpen = !shellPrefs.inspectorOpen;
      render();
    });
  });
  app.querySelectorAll('[data-action="toggle-mobile-nav"]').forEach((button) => {
    button.addEventListener('click', () => {
      shellPrefs.mobileNavOpen = !shellPrefs.mobileNavOpen;
      render();
    });
  });
  app.querySelectorAll('[data-action="set-inspector-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      shellPrefs.inspectorMode = button.getAttribute('data-mode') || 'inspector';
      render();
    });
  });
  app.querySelectorAll('[data-action="close-mobile-nav"]').forEach((button) => {
    button.addEventListener('click', () => {
      shellPrefs.mobileNavOpen = false;
      render();
    });
  });
  app.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (shellPrefs.mobileNavOpen) {
        shellPrefs.mobileNavOpen = false;
      }
    });
  });
}
function render() {
  const current = routeId();
  const route = routes.get(current);
  app.innerHTML = '<div class="' + shellClassName() + '"><button class="sidebar-backdrop" type="button" data-action="close-mobile-nav" aria-label="Close navigation"></button><aside class="sidebar"><div class="brand"><span class="brand-mark">M</span><div class="brand-text"><h1>Marketing Console</h1><p>' + esc(state.platformId) + ' · ' + esc(state.environment) + '</p></div></div><nav class="nav">' + nav() + '</nav></aside><section class="workspace"><main class="main"><header class="topbar"><div class="topbar-main"><button class="icon-button mobile-menu-button" type="button" data-action="toggle-mobile-nav" aria-label="Open navigation"><span class="icon menu"></span></button>' + shellControls() + '<div class="topbar-title"><h2>' + esc(route.label) + '</h2><p>' + esc(state.appId) + ' · ' + esc(state.dateWindow.label) + ' · generated ' + esc(formatTimestamp(state.generatedAt)) + '</p></div></div>' + headerActions() + '</header><section class="content">' + (renderers[current] || overview)() + '</section></main><button class="inspector-backdrop" type="button" data-action="toggle-inspector" aria-label="Close inspector"></button>' + inspector() + '</section></div>';
  bindShellControls();
}
window.addEventListener('hashchange', render);
window.addEventListener('resize', () => {
  if (isCompactViewport() && shellPrefs.inspectorOpen) {
    shellPrefs.inspectorOpen = false;
    render();
  }
});
render();
`;
