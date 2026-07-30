export type ConsoleCapability =
  | 'seo'
  | 'analytics'
  | 'tag-manager'
  | 'advertising'
  | 'experiments'
  | 'recommendations';

export type ConsoleRoute = {
  id: string;
  path: string;
  family: string;
  label: string;
  title: string;
  description: string;
  timeAnalysis: boolean;
};

export type ConsoleNavigationItem = {
  label: string;
  path: string;
  icon:
    | 'overview'
    | 'seo'
    | 'advertising'
    | 'analytics'
    | 'experiments'
    | 'connections'
    | 'activity';
};

export type ConsoleNavigationGroup = {
  label?: 'Channels' | 'Manage';
  items: ConsoleNavigationItem[];
};

const route = (
  id: string,
  path: string,
  family: string,
  label: string,
  title: string,
  description: string,
  timeAnalysis = false,
): ConsoleRoute => ({ id, path, family, label, title, description, timeAnalysis });

export const CONSOLE_ROUTES: readonly ConsoleRoute[] = [
  route(
    'overview',
    '/overview',
    'overview',
    'Overview',
    'Growth overview',
    'See what changed, what needs attention, and the most useful next step.',
    true,
  ),
  route(
    'seo.overview',
    '/seo/overview',
    'seo',
    'Overview',
    'SEO overview',
    'Understand search performance and the best opportunities to improve.',
    true,
  ),
  route(
    'seo.opportunities',
    '/seo/opportunities',
    'seo',
    'Opportunities',
    'SEO opportunities',
    'Review the search improvements most likely to produce a useful outcome.',
    true,
  ),
  route(
    'seo.pages',
    '/seo/pages',
    'seo',
    'Pages',
    'Search pages',
    'Compare page search performance and find pages that need attention.',
    true,
  ),
  route(
    'seo.queries',
    '/seo/queries',
    'seo',
    'Queries',
    'Search queries',
    'Understand what people search for and where the site currently appears.',
    true,
  ),
  route(
    'seo.site-health',
    '/seo/site-health',
    'seo',
    'Site health',
    'Search site health',
    'Find problems that may prevent important pages from appearing in search.',
  ),
  route(
    'seo.research',
    '/seo/research',
    'seo',
    'Research',
    'Keyword research',
    'Find and prioritize keywords using measured demand, markets, intent, questions, competitors, and search-result evidence.',
    true,
  ),
  route(
    'advertising.overview',
    '/advertising/overview',
    'advertising',
    'Overview',
    'Advertising overview',
    'Understand paid performance, current risks, and the next useful action.',
    true,
  ),
  route(
    'advertising.campaigns',
    '/advertising/campaigns',
    'advertising',
    'Campaigns',
    'Advertising campaigns',
    'Compare campaign outcomes without exposing raw provider records.',
    true,
  ),
  route(
    'advertising.conversions',
    '/advertising/conversions',
    'advertising',
    'Conversions',
    'Advertising conversions',
    'Understand which paid activity is producing confirmed outcomes.',
    true,
  ),
  route(
    'advertising.recommendations',
    '/advertising/recommendations',
    'advertising',
    'Recommendations',
    'Advertising recommendations',
    'Review prioritized improvements with evidence, effort, and risk.',
    true,
  ),
  route(
    'advertising.change-history',
    '/advertising/change-history',
    'advertising',
    'Change history',
    'Advertising change history',
    'See the changes that affected paid performance and their outcomes.',
    true,
  ),
  route(
    'analytics.overview',
    '/analytics/overview',
    'analytics',
    'Overview',
    'Analytics overview',
    'Understand visitors, traffic, conversions, and data freshness.',
    true,
  ),
  route(
    'analytics.traffic',
    '/analytics/traffic',
    'analytics',
    'Traffic',
    'Traffic',
    'Compare the channels bringing people to the active site.',
    true,
  ),
  route(
    'analytics.visitors',
    '/analytics/visitors',
    'analytics',
    'Visitors',
    'Visitors',
    'Understand who is visiting and how engagement is changing.',
    true,
  ),
  route(
    'analytics.conversions',
    '/analytics/conversions',
    'analytics',
    'Conversions',
    'Analytics conversions',
    'See which journeys are producing confirmed outcomes.',
    true,
  ),
  route(
    'analytics.tracking-health',
    '/analytics/tracking-health',
    'analytics',
    'Tracking health',
    'Tracking health',
    'Find measurement problems that may make reports incomplete or misleading.',
  ),
  route(
    'experiments.overview',
    '/experiments/overview',
    'experiments',
    'Overview',
    'Experiments overview',
    'Understand active learning, recent outcomes, and the next question to test.',
    true,
  ),
  route(
    'experiments.running',
    '/experiments/running',
    'experiments',
    'Running',
    'Running experiments',
    'Monitor experiments that are currently collecting evidence.',
    true,
  ),
  route(
    'experiments.results',
    '/experiments/results',
    'experiments',
    'Results',
    'Experiment results',
    'Review completed experiments and the decisions they support.',
    true,
  ),
  route(
    'experiments.ideas',
    '/experiments/ideas',
    'experiments',
    'Ideas',
    'Experiment ideas',
    'Review testable ideas before deciding what to run.',
  ),
  route(
    'connections',
    '/connections',
    'connections',
    'Connections',
    'Connections',
    'Manage provider accounts, access, selected resources, and data freshness.',
  ),
  route(
    'activity',
    '/activity',
    'activity',
    'Activity',
    'Activity',
    'Review changes, syncs, approvals, and failures in plain language.',
    true,
  ),
  route(
    'settings',
    '/settings',
    'settings',
    'Settings',
    'Settings',
    'Manage local console preferences for the active workspace.',
  ),
  route(
    'settings.automations',
    '/settings/automations',
    'settings',
    'Automations',
    'Automations',
    'Manage recurring work, timing, and blocked dependencies.',
  ),
  route(
    'help',
    '/help',
    'help',
    'Help',
    'Help',
    'Learn what the current page means and how to take the next safe step.',
  ),
];

export const FAMILY_TABS = Object.freeze({
  seo: CONSOLE_ROUTES.filter((item) => item.family === 'seo'),
  advertising: CONSOLE_ROUTES.filter((item) => item.family === 'advertising'),
  analytics: CONSOLE_ROUTES.filter((item) => item.family === 'analytics'),
  experiments: CONSOLE_ROUTES.filter((item) => item.family === 'experiments'),
  settings: CONSOLE_ROUTES.filter((item) => item.family === 'settings'),
});

export function consoleNavigation(
  capabilities: readonly ConsoleCapability[],
): readonly ConsoleNavigationGroup[] {
  const experimentsSelected = capabilities.includes('experiments');
  return [
    {
      items: [{ label: 'Overview', path: '/overview', icon: 'overview' }],
    },
    {
      label: 'Channels',
      items: [
        { label: 'SEO', path: '/seo/overview', icon: 'seo' },
        { label: 'Advertising', path: '/advertising/overview', icon: 'advertising' },
        { label: 'Analytics', path: '/analytics/overview', icon: 'analytics' },
        ...(experimentsSelected
          ? [{ label: 'Experiments', path: '/experiments/overview', icon: 'experiments' as const }]
          : []),
      ],
    },
    {
      label: 'Manage',
      items: [
        { label: 'Connections', path: '/connections', icon: 'connections' },
        { label: 'Activity', path: '/activity', icon: 'activity' },
      ],
    },
  ];
}

function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] || '/overview';
  const normalized = `/${path.replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '/overview' : normalized;
}

function connectionRoute(pathname: string): ConsoleRoute | undefined {
  const match = pathname.match(
    /^\/connections\/([^/]+)(?:\/(overview|access|resources|data-sync|activity))?$/,
  );
  if (!match) return undefined;
  const provider = decodeURIComponent(match[1] ?? '');
  const tab = match[2] ?? 'overview';
  const labels: Record<string, string> = {
    overview: 'Overview',
    access: 'Access',
    resources: 'Resources',
    'data-sync': 'Data sync',
    activity: 'Activity',
  };
  return route(
    `connections.provider.${tab}`,
    `/connections/${encodeURIComponent(provider)}/${tab}`,
    'connection-detail',
    labels[tab] ?? 'Overview',
    `${humanize(provider)} connection`,
    'Manage this provider account, its access, selected resources, and data freshness.',
  );
}

export function resolveConsoleRoute(
  pathname: string,
  capabilities: readonly ConsoleCapability[],
): ConsoleRoute {
  const normalized = normalizePath(pathname);
  const providerRoute = connectionRoute(normalized);
  if (providerRoute) return providerRoute;
  const matched = CONSOLE_ROUTES.find((item) => item.path === normalized);
  if (!matched) return CONSOLE_ROUTES[0]!;
  if (matched.family === 'experiments' && !capabilities.includes('experiments')) {
    return CONSOLE_ROUTES[0]!;
  }
  return matched;
}

export function tabsForRoute(routeValue: ConsoleRoute): readonly ConsoleRoute[] {
  if (routeValue.family === 'connection-detail') {
    const provider = routeValue.path.split('/')[2] ?? 'provider';
    return ['overview', 'access', 'resources', 'data-sync', 'activity']
      .map((tab) => connectionRoute(`/connections/${provider}/${tab}`))
      .filter((item): item is ConsoleRoute => Boolean(item));
  }
  return FAMILY_TABS[routeValue.family as keyof typeof FAMILY_TABS] ?? [];
}

function humanize(value: string): string {
  return value.replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
