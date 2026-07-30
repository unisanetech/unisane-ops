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
.list { display: grid; gap: 10px; margin-top: 14px; }
.list-item { padding: 13px 0; border-top: 1px solid var(--color-outline-variant, #e1e1dc); }
.list-item:first-child { border-top: 0; padding-top: 0; }
.list-item strong { display: block; font-size: 13px; }
.list-item p { margin: 5px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 12px; line-height: 1.5; }
.empty-state { padding: 26px; border-radius: var(--radius-md, 12px); background: var(--color-surface-container-low, #f1f1ed); }
.empty-state strong { display: block; font-size: 14px; }
.empty-state p { margin: 7px 0 0; color: var(--color-on-surface-variant, #62655d); font-size: 13px; line-height: 1.55; }
.button-link { display: inline-flex; min-height: 40px; align-items: center; margin-top: 14px; padding: 8px 13px; border-radius: var(--radius-sm, 9px); background: var(--color-primary, #476242); color: var(--color-on-primary, #fff); text-decoration: none; font-size: 12px; font-weight: 700; }
.sidebar-backdrop { display: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1080px) {
  .card { grid-column: span 6; }
  .card.wide { grid-column: span 12; }
  .freshness-link span { display: none; }
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
  .grid { grid-template-columns: 1fr; }
  .card, .card.wide, .card.full { grid-column: auto; }
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
let collapsed = localStorage.getItem('unisane-ops-sidebar-collapsed') === 'true';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function humanize(value) {
  return String(value ?? '').replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  const unavailable = state.freshness.filter((item) => item.status !== 'ready').length;
  if (unavailable === 0) return { label: 'Data is current', attention: false };
  return { label: unavailable + ' source' + (unavailable === 1 ? '' : 's') + ' need attention', attention: true };
}
function meaningfulMetrics(route) {
  const ids = route.family === 'advertising'
    ? ['spend', 'conversions', 'cpa', 'roas']
    : route.family === 'analytics'
      ? ['sessions', 'users', 'conversions', 'revenue']
      : route.family === 'seo'
        ? ['organic-clicks', 'clicks', 'impressions', 'position']
        : ['organic-clicks', 'spend', 'conversions', 'revenue', 'clicks'];
  const metrics = ids.map((id) => state.metrics.find((item) => item.id === id)).filter(Boolean);
  return (metrics.length ? metrics : state.metrics).filter((item) => item.value && item.value !== '0').slice(0, 4);
}
function metricCards(route) {
  const metrics = meaningfulMetrics(route);
  if (!metrics.length) {
    return '<article class="card full"><div class="empty-state"><strong>Useful performance data is not available yet.</strong><p>Connect the relevant source or wait for its first successful update. The console will not display invented zero values.</p><a class="button-link" href="/connections" data-route-link>Review connections</a></div></article>';
  }
  return metrics.map((metric) => '<article class="card"><h2>' + esc(metric.label) + '</h2><div class="metric-value">' + esc(metric.value) + '</div><div class="metric-helper">' + esc(metric.helper || 'Current selected period') + '</div></article>').join('');
}
function priorityList() {
  const actions = state.actions.slice(0, 3);
  if (!actions.length) return '<div class="empty-state"><strong>No immediate priorities.</strong><p>The active workspace has no suggested action from current evidence.</p></div>';
  return '<div class="list">' + actions.map((item) => '<article class="list-item"><strong>' + esc(item.title) + '</strong><p>' + esc(item.message) + '</p></article>').join('') + '</div>';
}
function recentActivity() {
  const items = state.receipts.slice(0, 5);
  if (!items.length) return '<div class="empty-state"><strong>No activity yet.</strong><p>Changes, updates, approvals, and failures will appear here after they happen.</p></div>';
  return '<div class="list">' + items.map((item) => '<article class="list-item"><strong>' + esc(humanize(item.action)) + '</strong><p>' + esc(item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Time not available') + ' · ' + esc(humanize(item.status)) + '</p></article>').join('') + '</div>';
}
function pageBody(route) {
  if (route.family === 'connections') {
    return '<div class="grid"><article class="card wide"><h2>Your connections</h2><p>Provider accounts, access, resources, and updates will be managed from this one place.</p><div class="empty-state"><strong>Connection details are being prepared.</strong><p>The next slice replaces the former onboarding and access presentation with provider cards and guided connection management.</p></div></article><article class="card"><h2>Workspace state</h2><div class="metric-value">' + esc(state.readiness.label) + '</div><div class="metric-helper">' + esc(state.readiness.nextWorkflowStep) + '</div></article></div>';
  }
  if (route.family === 'connection-detail') {
    return '<div class="grid"><article class="card full"><div class="empty-state"><strong>This connection page is ready for provider details.</strong><p>Account identity, access, resources, data updates, and activity will land in the dedicated Connections slice.</p><a class="button-link" href="/connections" data-route-link>All connections</a></div></article></div>';
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
    return '<div class="grid"><article class="card wide"><h2>Start with what needs attention</h2><p>' + esc(state.readiness.nextWorkflowStep) + '</p><a class="button-link" href="/overview" data-route-link>Return to overview</a></article><article class="card"><h2>Technical details</h2><p>Use the structured CLI when you need exact identifiers, paths, or diagnostic records.</p></article></div>';
  }
  return '<div class="grid">' + metricCards(route) + '<article class="card wide"><h2>Priorities</h2><p>The most useful next actions from current evidence.</p>' + priorityList() + '</article><article class="card"><h2>Source and freshness</h2><p>' + esc(freshness().label) + '</p><a class="button-link" href="/connections" data-route-link>Review source</a></article></div>';
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
        '<main class="content"><header class="page-header"><div><p class="eyebrow">' + esc(route.family === 'overview' ? 'Workspace' : humanize(route.family)) + '</p><h1 tabindex="-1">' + esc(route.title) + '</h1><p class="page-description">' + esc(route.description) + '</p></div></header>' + pageTabs(route) + '<section class="summary"><h2>' + esc(route.family === 'overview' ? state.readiness.label : route.description) + '</h2><p>' + esc(route.family === 'overview' ? state.readiness.nextWorkflowStep : 'This page uses the active workspace and the latest usable data. Missing sources are explained rather than shown as zero.') + '</p></section>' + pageBody(route) + '</main>' +
      '</section>' +
    '</div>';
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
  document.body.classList.remove('nav-open');
  render();
  document.querySelector('h1')?.focus?.();
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
}
window.addEventListener('popstate', render);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileOpen) closeNavigation();
  if (event.key === 'Escape' && projectMenuOpen) {
    projectMenuOpen = false;
    render();
  }
});
render();
`;
