export type ConsoleCapability =
  | 'seo'
  | 'analytics'
  | 'tag-manager'
  | 'advertising'
  | 'experiments'
  | 'recommendations';

export type AdvertisingPlatform = 'all' | 'googleAds' | 'metaAds';
export type ConsoleTemporalMode =
  | 'performance-range'
  | 'event-range'
  | 'snapshot'
  | 'evidence-context'
  | 'current';

export type ConsoleRoute = {
  id: string;
  path: string;
  family: string;
  label: string;
  title: string;
  description: string;
  temporalMode: ConsoleTemporalMode;
  advertisingPlatform?: AdvertisingPlatform;
  advertisingSection?: AdvertisingSection;
};

export type AdvertisingSection =
  | 'overview'
  | 'campaigns'
  | 'ad-sets'
  | 'ads-creatives'
  | 'conversions'
  | 'recommendations'
  | 'change-history';

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
  temporalMode: ConsoleTemporalMode = 'current',
): ConsoleRoute => ({ id, path, family, label, title, description, temporalMode });

const advertisingPlatformPaths: Record<AdvertisingPlatform, string> = {
  all: 'all',
  googleAds: 'google',
  metaAds: 'meta',
};

const advertisingPlatformLabels: Record<AdvertisingPlatform, string> = {
  all: 'All advertising',
  googleAds: 'Google Ads',
  metaAds: 'Meta Ads',
};

const advertisingRoute = (
  platform: AdvertisingPlatform,
  section: AdvertisingSection,
  label: string,
  title: string,
  description: string,
  temporalMode: ConsoleTemporalMode = section === 'recommendations'
    ? 'evidence-context'
    : section === 'change-history'
      ? 'event-range'
      : 'performance-range',
): ConsoleRoute => ({
  ...route(
    `advertising.${platform}.${section}`,
    `/advertising/${advertisingPlatformPaths[platform]}/${section}`,
    'advertising',
    label,
    title,
    description,
    temporalMode,
  ),
  advertisingPlatform: platform,
  advertisingSection: section,
});

const advertisingRoutes = (platform: AdvertisingPlatform): readonly ConsoleRoute[] => [
  advertisingRoute(
    platform,
    'overview',
    'Overview',
    `${advertisingPlatformLabels[platform]} overview`,
    'Understand paid performance, current risks, and the next useful action.',
  ),
  advertisingRoute(
    platform,
    'campaigns',
    'Campaigns',
    `${advertisingPlatformLabels[platform]} campaigns`,
    'Compare delivery, budgets, and outcomes across campaigns.',
  ),
  ...(platform === 'metaAds'
    ? [
        advertisingRoute(
          platform,
          'ad-sets',
          'Ad sets',
          'Meta Ads ad sets',
          'Compare Meta audience, delivery, spend, and outcomes at ad-set level.',
        ),
        advertisingRoute(
          platform,
          'ads-creatives',
          'Ads & creatives',
          'Meta Ads and creatives',
          'Review Meta ads, creative assets, delivery, and performance evidence.',
        ),
      ]
    : []),
  advertisingRoute(
    platform,
    'conversions',
    'Conversions',
    `${advertisingPlatformLabels[platform]} conversions`,
    'Understand which paid activity is producing provider-attributed outcomes.',
  ),
  advertisingRoute(
    platform,
    'recommendations',
    'Recommendations',
    `${advertisingPlatformLabels[platform]} recommendations`,
    'Review prioritized improvements with evidence, effort, and risk.',
  ),
  advertisingRoute(
    platform,
    'change-history',
    'Change history',
    `${advertisingPlatformLabels[platform]} change history`,
    'See the changes that affected paid performance and their outcomes.',
  ),
];

export const CONSOLE_ROUTES: readonly ConsoleRoute[] = [
  route(
    'overview',
    '/overview',
    'overview',
    'Overview',
    'Growth overview',
    'See what changed, what needs attention, and the most useful next step.',
    'performance-range',
  ),
  route(
    'seo.overview',
    '/seo/overview',
    'seo',
    'Overview',
    'SEO overview',
    'Understand search performance and the best opportunities to improve.',
    'performance-range',
  ),
  route(
    'seo.opportunities',
    '/seo/opportunities',
    'seo',
    'Opportunities',
    'SEO opportunities',
    'Review the search improvements most likely to produce a useful outcome.',
    'evidence-context',
  ),
  route(
    'seo.pages',
    '/seo/pages',
    'seo',
    'Pages',
    'Search pages',
    'Compare page search performance and find pages that need attention.',
    'performance-range',
  ),
  route(
    'seo.queries',
    '/seo/queries',
    'seo',
    'Queries',
    'Search queries',
    'Understand what people search for and where the site currently appears.',
    'performance-range',
  ),
  route(
    'seo.site-health',
    '/seo/site-health',
    'seo',
    'Site health',
    'Search site health',
    'Find problems that may prevent important pages from appearing in search.',
    'snapshot',
  ),
  route(
    'seo.research',
    '/seo/research',
    'seo',
    'Research',
    'Keyword research',
    'Find and prioritize keywords using provider-estimated demand, markets, intent, questions, competitors, and search-result evidence.',
    'snapshot',
  ),
  ...advertisingRoutes('all'),
  ...advertisingRoutes('googleAds'),
  ...advertisingRoutes('metaAds'),
  route(
    'analytics.overview',
    '/analytics/overview',
    'analytics',
    'Overview',
    'Analytics overview',
    'Understand visitors, traffic, conversions, and data freshness.',
    'performance-range',
  ),
  route(
    'analytics.traffic',
    '/analytics/traffic',
    'analytics',
    'Traffic',
    'Traffic',
    'Compare the channels bringing people to the active site.',
    'performance-range',
  ),
  route(
    'analytics.visitors',
    '/analytics/visitors',
    'analytics',
    'Visitors',
    'Visitors',
    'See where measured visitors begin and which landing pages bring them into the site.',
    'performance-range',
  ),
  route(
    'analytics.conversions',
    '/analytics/conversions',
    'analytics',
    'Conversions',
    'Analytics conversions',
    'See whether measured journeys produce outcomes and repair measurement when they do not.',
    'performance-range',
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
    'current',
  ),
  route(
    'experiments.running',
    '/experiments/running',
    'experiments',
    'Running',
    'Running experiments',
    'Monitor experiments that are currently collecting evidence.',
    'current',
  ),
  route(
    'experiments.results',
    '/experiments/results',
    'experiments',
    'Results',
    'Experiment results',
    'Review completed experiments and the decisions they support.',
    'event-range',
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
    'event-range',
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
        { label: 'Advertising', path: '/advertising/all/overview', icon: 'advertising' },
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
    'data-sync': 'Data updates',
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
  if (routeValue.family === 'advertising') {
    return CONSOLE_ROUTES.filter(
      (item) =>
        item.family === 'advertising' &&
        item.advertisingPlatform === routeValue.advertisingPlatform,
    );
  }
  return FAMILY_TABS[routeValue.family as keyof typeof FAMILY_TABS] ?? [];
}

export function advertisingPlatformRoutes(routeValue: ConsoleRoute): readonly ConsoleRoute[] {
  if (
    routeValue.family !== 'advertising' ||
    !routeValue.advertisingPlatform ||
    !routeValue.advertisingSection
  ) {
    return [];
  }
  return (['all', 'googleAds', 'metaAds'] as const).map((platform) => {
    const supportsSection =
      platform === 'metaAds' ||
      (routeValue.advertisingSection !== 'ad-sets' &&
        routeValue.advertisingSection !== 'ads-creatives');
    const section = supportsSection ? routeValue.advertisingSection! : 'overview';
    return CONSOLE_ROUTES.find(
      (item) => item.advertisingPlatform === platform && item.advertisingSection === section,
    )!;
  });
}

export function advertisingPlatformLabel(platform: AdvertisingPlatform): string {
  return advertisingPlatformLabels[platform];
}

function humanize(value: string): string {
  return value.replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
