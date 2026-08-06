import type React from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Icon } from '@unisane/ui/icon';
import type { NavigationItem, NavigationLinkProps } from '@unisane/ui/navigation';
import { SupportingPaneLayout } from '@unisane/ui/canonical-layouts';
import {
  Sidebar,
  SidebarDrawer,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@unisane/ui/sidebar';
import { TopAppBar } from '@unisane/ui/top-app-bar';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleShellModel, ConsoleSupportingPane } from '../contracts.js';
import type { ConsoleRoute } from '../../routes.js';
import { humanize } from '../lib/format.js';

export function ConsoleShell({
  state,
  shell,
  route,
  navigate,
  primaryNavigation,
  supportingPane,
  onCloseSupportingPane,
  children,
}: {
  state: MarketingConsoleState;
  shell: ConsoleShellModel;
  route: ConsoleRoute;
  navigate: (path: string) => void;
  primaryNavigation?: React.ReactNode;
  supportingPane?: ConsoleSupportingPane;
  onCloseSupportingPane: () => void;
  children: React.ReactNode;
}) {
  const navigationItems = buildNavigation(shell);
  const activeNavigationId = activeItemId(route);
  const freshnessNeedsAttention = state.freshness.some((item) => item.status !== 'ready');
  return (
    <SidebarProvider
      items={navigationItems}
      value={activeNavigationId}
      mode="collapsible-drawer"
      behavior={{ mobile: 'overlay', tablet: 'inset', desktop: 'inset' }}
      defaultExpanded
      persist
      storageKey="unisane-ops-sidebar"
      drawerWidth={232}
      railWidth={80}
      mobileInsetOffset={0}
      onItemSelect={(item) => {
        if (item.href) navigate(item.href);
      }}
      renderLink={(item, props) => (
        <ConsoleNavigationLink item={item} props={props} navigate={navigate} />
      )}
    >
      <div className="bg-surface-container-low text-on-surface h-screen w-screen overflow-hidden">
        <a
          href="#main-content"
          className="bg-primary text-on-primary sr-only fixed top-3 left-3 z-50 rounded-sm px-4 py-2 focus:not-sr-only"
        >
          Skip to main content
        </a>
        <Sidebar className="relative h-full overflow-hidden">
          <SidebarDrawer
            aria-label="Primary navigation"
            header={<ProjectIdentity state={state} />}
            collapsedHeader={<CollapsedBrand state={state} />}
            overlayHeadline={humanize(state.platformId)}
          />
          <SidebarInset
            id="main-content"
            tabIndex={-1}
            className="bg-surface-container-low medium:py-3 medium:pr-3 mt-0 h-full min-w-0 overflow-hidden py-2 pr-2 pl-0"
          >
            <section className="border-outline-weak bg-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border shadow-none">
              <TopAppBar
                variant="small"
                className="z-40 shrink-0"
                title={topAppBarTitle(route)}
                titleVariant="titleMedium"
                titleClassName="text-on-surface"
                navigationIcon={<SidebarTrigger aria-label="Toggle navigation" />}
                actions={
                  <Button
                    variant={freshnessNeedsAttention ? 'tonal' : 'outlined'}
                    size="sm"
                    aria-label={
                      freshnessNeedsAttention ? 'Review data freshness' : 'Data is current'
                    }
                    onClick={() => navigate('/connections')}
                  >
                    {freshnessNeedsAttention ? 'Data freshness' : 'Data current'}
                  </Button>
                }
              />
              <SupportingPaneLayout
                isRoot
                open={Boolean(supportingPane)}
                onOpenChange={(open) => {
                  if (!open) onCloseSupportingPane();
                }}
                title={supportingPane?.title ?? 'Details'}
                subtitle={supportingPane?.subtitle}
                showCloseButtonOnDesktop
                mainScrollable={false}
                supportingScrollable={false}
                className={
                  supportingPane
                    ? 'ops-console-supporting-pane'
                    : 'ops-console-supporting-pane ops-console-supporting-pane--closed'
                }
                main={
                  <div className="flex h-full min-h-0 flex-col">
                    {primaryNavigation}
                    <div className="ops-console-scroll-region min-h-0 flex-1 overflow-y-auto">
                      {children}
                    </div>
                  </div>
                }
                supporting={supportingPane?.content ?? null}
              />
            </section>
          </SidebarInset>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}

function ProjectIdentity({ state }: { state: MarketingConsoleState }) {
  return (
    <div className="flex items-start gap-3 pt-1 pb-3">
      <BrandMark />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <Typography variant="titleMedium" className="truncate">
          {humanize(state.platformId)}
        </Typography>
        <Badge
          variant="tonal"
          color={state.environment.toLowerCase().includes('production') ? 'error' : 'info'}
          size="sm"
        >
          {state.environment}
        </Badge>
      </div>
    </div>
  );
}

function CollapsedBrand({ state }: { state: MarketingConsoleState }) {
  return (
    <div className="flex w-full justify-center pt-2 pb-3">
      <BrandMark accessibleLabel={humanize(state.platformId)} />
    </div>
  );
}

function BrandMark({ accessibleLabel }: { accessibleLabel?: string }) {
  return (
    <span
      className="bg-primary-container text-on-primary-container grid size-10 shrink-0 place-items-center rounded-md"
      aria-label={accessibleLabel}
      aria-hidden={accessibleLabel ? undefined : true}
    >
      <Icon symbol="monitoring" size="md" />
    </span>
  );
}

function ConsoleNavigationLink({
  item,
  props,
  navigate,
}: {
  item: NavigationItem;
  props: NavigationLinkProps;
  navigate: (path: string) => void;
}) {
  return (
    <a
      {...props}
      href={item.href ?? props.href}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented || !item.href) return;
        event.preventDefault();
        navigate(item.href);
      }}
    />
  );
}

function buildNavigation(shell: ConsoleShellModel): NavigationItem[] {
  const iconByPath: Record<string, string> = {
    '/overview': 'dashboard',
    '/seo/overview': 'search',
    '/advertising/all/overview': 'campaign',
    '/analytics/overview': 'analytics',
    '/experiments/overview': 'science',
    '/connections': 'link',
    '/activity': 'history',
  };
  const roots = shell.navigation.flatMap((group) =>
    group.items.map((item) => ({
      id: item.path,
      label: item.label,
      href: item.path,
      icon: iconByPath[item.path] ?? 'circle',
    })),
  );
  return [
    ...roots,
    { id: '/settings', label: 'Settings', href: '/settings', icon: 'settings' },
    { id: '/help', label: 'Help', href: '/help', icon: 'help' },
  ];
}

function activeItemId(route: ConsoleRoute): string {
  if (route.family === 'overview') return '/overview';
  if (route.family === 'connection-detail') return '/connections';
  if (route.family === 'settings') return '/settings';
  if (route.family === 'help') return '/help';
  if (route.family === 'advertising') return '/advertising/all/overview';
  return `/${route.family}${['seo', 'analytics', 'experiments'].includes(route.family) ? '/overview' : ''}`;
}

function topAppBarTitle(route: ConsoleRoute): string {
  const titles: Record<string, string> = {
    overview: 'Growth',
    seo: 'SEO',
    advertising: 'Advertising',
    analytics: 'Analytics',
    experiments: 'Experiments',
    connections: 'Manage',
    'connection-detail': 'Manage',
    activity: 'Manage',
    settings: 'Workspace',
    help: 'Workspace',
  };
  return titles[route.family] ?? route.title;
}
