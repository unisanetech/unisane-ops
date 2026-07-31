import type { GrowthCapability } from '../config.js';
import type {
  MarketingConsoleConnection,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleOverview,
  MarketingConsolePriority,
  MarketingConsolePriorityLane,
  MarketingConsoleReceiptEvent,
  MarketingConsoleStatus,
} from './contracts.js';
import { activitySummaryForStatus, activityTitleForReceipt } from './activity.js';

const capabilityDefinitions = [
  {
    id: 'seo',
    label: 'SEO',
    service: 'search-console',
    provider: 'searchConsole',
    path: '/seo/overview',
  },
  {
    id: 'advertising',
    label: 'Advertising',
    service: 'ads',
    provider: 'googleAds',
    path: '/advertising/all/overview',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    service: 'analytics',
    provider: 'ga4',
    path: '/analytics/overview',
  },
  {
    id: 'experiments',
    label: 'Experiments',
    service: undefined,
    provider: undefined,
    path: '/experiments/overview',
  },
] as const;

const overviewMetricOrder = ['organic-clicks', 'sessions', 'spend', 'conversions'];

function buildRecentOutcomes(
  receipts: readonly MarketingConsoleReceiptEvent[],
): MarketingConsoleOverview['recentOutcomes'] {
  return receipts.slice(0, 3).map((receipt) => ({
    id: receipt.id,
    title: activityTitleForReceipt(receipt),
    summary: activitySummaryForStatus(receipt.status),
    status: receipt.status,
    ...(receipt.timestamp ? { timestamp: receipt.timestamp } : {}),
  }));
}

function serviceLane(serviceId: string): MarketingConsolePriorityLane {
  if (serviceId === 'search-console') return 'seo';
  if (serviceId === 'ads') return 'advertising';
  if (serviceId === 'analytics' || serviceId === 'tag-manager') return 'analytics';
  return 'overview';
}

function serviceDetailPath(provider: string, serviceState: string): string {
  if (serviceState === 'partial-permission' || serviceState === 'expired-access') {
    return `/connections/${provider}/access`;
  }
  if (serviceState === 'needs-resource') return `/connections/${provider}/resources`;
  if (serviceState === 'syncing' || serviceState === 'delayed' || serviceState === 'failed') {
    return `/connections/${provider}/data-sync`;
  }
  return `/connections/${provider}/overview`;
}

function observedLabel(value: string | undefined): string {
  if (!value) return 'Not checked yet';
  return `Checked ${value.slice(0, 10)}`;
}

function buildPriorities(args: {
  connections: readonly MarketingConsoleConnection[];
  freshness: readonly MarketingConsoleFreshnessCell[];
  capabilities: readonly GrowthCapability[];
  recommendationPriorities?: readonly MarketingConsolePriority[];
}): MarketingConsolePriority[] {
  const connected = args.connections.filter((connection) => connection.connected);
  if (connected.length === 0) {
    return [
      {
        id: 'connect-google',
        lane: 'overview',
        title: 'Connect Google',
        expectedOutcome: 'Start receiving trusted search, analytics, tag, and advertising results.',
        reason: 'This workspace has no active provider connection.',
        evidence: 'No Google account is selected for the current environment.',
        confidenceLabel: 'High confidence',
        freshnessLabel: 'Connection checked now',
        effortLabel: 'Low effort',
        priorityLabel: 'High priority',
        riskLabel: 'Nothing is published or spent without a later explicit action.',
        action: {
          label: 'Review connection',
          path: '/connections',
        },
      },
    ];
  }

  const priorities: MarketingConsolePriority[] = [];
  for (const connection of connected) {
    for (const service of connection.services) {
      if (service.state === 'current') continue;
      priorities.push({
        id: `${connection.provider}.${service.id}.${service.state}`,
        lane: serviceLane(service.id),
        title: `${service.label} needs attention`,
        expectedOutcome:
          service.state === 'syncing'
            ? `Make the first usable ${service.label} data available.`
            : `Restore reliable ${service.label} updates without affecting working Google services.`,
        reason: service.issue ?? service.dataLabel,
        evidence: `${service.statusLabel}. ${service.accessLabel}.`,
        confidenceLabel: 'High confidence',
        freshnessLabel: observedLabel(service.lastCheckedAt ?? connection.lastCheckedAt),
        effortLabel: service.state === 'failed' ? 'Medium effort' : 'Low effort',
        priorityLabel:
          service.state === 'failed' || service.state === 'expired-access'
            ? 'High priority'
            : 'Medium priority',
        riskLabel: 'Only this service is affected; working services remain available.',
        action: {
          label: service.primaryAction?.label ?? `Review ${service.label}`,
          path: serviceDetailPath(connection.provider, service.state),
        },
      });
    }
  }

  for (const capability of capabilityDefinitions) {
    if (
      capability.id === 'experiments' ||
      !args.capabilities.includes(capability.id as GrowthCapability) ||
      priorities.some((priority) => priority.lane === capability.id)
    ) {
      continue;
    }
    const relevant = args.freshness.filter((cell) => cell.provider === capability.provider);
    const stale = relevant.find((cell) => cell.status !== 'ready');
    if (!stale) continue;
    priorities.push({
      id: `${capability.id}.data-update`,
      lane: capability.id,
      title: `Update ${capability.label.toLowerCase()} data`,
      expectedOutcome: `Base the next ${capability.label.toLowerCase()} decision on current evidence.`,
      reason: stale.message,
      evidence:
        stale.ageDays === undefined
          ? `${capability.label} data is not available yet.`
          : `The latest usable ${capability.label.toLowerCase()} data is ${stale.ageDays} days old.`,
      confidenceLabel: stale.path ? 'High confidence' : 'Medium confidence',
      freshnessLabel:
        stale.ageDays === undefined ? 'No usable update yet' : `${stale.ageDays} days old`,
      effortLabel: 'Low effort',
      priorityLabel: stale.status === 'blocked' ? 'High priority' : 'Medium priority',
      riskLabel: 'This is a read-only data update.',
      action: {
        label: 'Review data sync',
        path: '/connections/google/data-sync',
      },
    });
  }

  const recommendationPriorities = args.recommendationPriorities ?? [];
  const seen = new Set<string>();
  return [...recommendationPriorities, ...priorities]
    .filter((priority) => {
      if (seen.has(priority.id)) return false;
      seen.add(priority.id);
      return true;
    })
    .slice(0, 6);
}

function metricKnown(metric: MarketingConsoleMetric | undefined): boolean {
  return Boolean(metric && metric.numericValue !== undefined);
}

function buildFunnel(
  metrics: readonly MarketingConsoleMetric[],
): MarketingConsoleOverview['funnel'] {
  const byId = new Map(metrics.map((metric) => [metric.id, metric]));
  const candidates = [
    {
      title: 'Advertising journey',
      summary: 'How paid visibility moved toward a reported conversion.',
      sourceLabel: 'Google Ads',
      ids: ['paid-impressions', 'paid-clicks', 'paid-conversions'],
      labels: ['Impressions', 'Clicks', 'Conversions'],
    },
    {
      title: 'Search journey',
      summary: 'How organic search visibility turned into visits.',
      sourceLabel: 'Search Console',
      ids: ['organic-impressions', 'organic-clicks'],
      labels: ['Search views', 'Organic clicks'],
    },
    {
      title: 'Visitor journey',
      summary: 'How measured visits moved toward a reported conversion.',
      sourceLabel: 'Google Analytics',
      ids: ['sessions', 'analytics-conversions'],
      labels: ['Sessions', 'Conversions'],
    },
  ];
  for (const candidate of candidates) {
    const stages = candidate.ids
      .map((id, index) => {
        const metric = byId.get(id);
        if (!metricKnown(metric)) return undefined;
        return {
          id,
          label: candidate.labels[index] ?? metric!.label,
          value: metric!.numericValue!,
          valueLabel: metric!.value,
        };
      })
      .filter(
        (
          stage,
        ): stage is {
          id: string;
          label: string;
          value: number;
          valueLabel: string;
        } => Boolean(stage),
      );
    if (stages.length >= 2) {
      return {
        title: candidate.title,
        summary: candidate.summary,
        sourceLabel: candidate.sourceLabel,
        stages,
      };
    }
  }
  return undefined;
}

function capabilityStatus(args: {
  capability: (typeof capabilityDefinitions)[number];
  connection?: MarketingConsoleConnection;
  freshness: readonly MarketingConsoleFreshnessCell[];
  metrics: readonly MarketingConsoleMetric[];
}): {
  status: MarketingConsoleStatus;
  statusLabel: string;
  summary: string;
} {
  if (args.capability.id === 'experiments') {
    return {
      status: 'missing',
      statusLabel: 'No results yet',
      summary: 'Experiment results will appear after the first test is measured.',
    };
  }
  const service = args.connection?.services.find((item) => item.id === args.capability.service);
  const hasHistoricalData = args.metrics.some(
    (metric) =>
      metricKnown(metric) &&
      ((args.capability.id === 'seo' && metric.id.startsWith('organic-')) ||
        (args.capability.id === 'advertising' &&
          ['spend', 'paid-clicks', 'paid-conversions', 'roas'].includes(metric.id)) ||
        (args.capability.id === 'analytics' &&
          ['sessions', 'users', 'analytics-conversions', 'revenue'].includes(metric.id))),
  );
  if (!service || service.state === 'not-connected') {
    return {
      status: hasHistoricalData ? 'warn' : 'blocked',
      statusLabel: hasHistoricalData ? 'Historical data' : 'Not connected',
      summary: hasHistoricalData
        ? 'Historical results remain available, but new updates require Google.'
        : `Connect Google to start receiving ${args.capability.label.toLowerCase()} results.`,
    };
  }
  if (service.state !== 'current') {
    return {
      status: service.state === 'failed' || service.state === 'expired-access' ? 'blocked' : 'warn',
      statusLabel: service.statusLabel,
      summary: service.issue ?? service.dataLabel,
    };
  }
  const relevant = args.freshness.filter((cell) => cell.provider === args.capability.provider);
  if (relevant.some((cell) => cell.status === 'ready')) {
    return {
      status: 'ready',
      statusLabel: 'Current',
      summary: `${args.capability.label} has current usable data.`,
    };
  }
  return {
    status: 'warn',
    statusLabel: hasHistoricalData ? 'Update needed' : 'Waiting for data',
    summary: hasHistoricalData
      ? `Historical ${args.capability.label.toLowerCase()} results are available and need an update.`
      : `The first usable ${args.capability.label.toLowerCase()} data has not arrived yet.`,
  };
}

export function buildMarketingConsoleOverview(args: {
  connections: readonly MarketingConsoleConnection[];
  freshness: readonly MarketingConsoleFreshnessCell[];
  metrics: readonly MarketingConsoleMetric[];
  receipts: readonly MarketingConsoleReceiptEvent[];
  capabilities: readonly GrowthCapability[];
  recommendationPriorities?: readonly MarketingConsolePriority[];
}): {
  overview: MarketingConsoleOverview;
  priorities: MarketingConsolePriority[];
} {
  const priorities = buildPriorities(args);
  const connected = args.connections.some((connection) => connection.connected);
  const metricIds = overviewMetricOrder.filter((id) =>
    metricKnown(args.metrics.find((metric) => metric.id === id)),
  );
  const hasHistoricalData = metricIds.length > 0;
  const connectionIssue = args.connections
    .flatMap((connection) => connection.services)
    .find((service) => service.state !== 'current');
  const staleSources = new Set(
    args.freshness
      .filter(
        (cell) =>
          ['searchConsole', 'googleAds', 'ga4'].includes(cell.provider) && cell.status !== 'ready',
      )
      .map((cell) => cell.provider),
  ).size;

  let status: MarketingConsoleStatus;
  let headline: string;
  let detail: string;
  if (!connected && hasHistoricalData) {
    status = 'warn';
    headline = 'Historical growth results are available, but Google is not connected.';
    detail =
      'You can review the retained results below. Connect Google before treating them as current or expecting new updates.';
  } else if (!connected) {
    status = 'blocked';
    headline = 'Connect Google to start seeing trusted growth results.';
    detail =
      'The console will show real search, visitor, measurement, and advertising outcomes after the selected services begin providing data.';
  } else if (connectionIssue) {
    status =
      connectionIssue.state === 'failed' || connectionIssue.state === 'expired-access'
        ? 'blocked'
        : 'warn';
    headline = `${connectionIssue.label} needs attention, while working services remain available.`;
    detail =
      connectionIssue.issue ??
      'Review the affected Google service without interrupting the services that are still working.';
  } else if (staleSources > 0 && hasHistoricalData) {
    status = 'warn';
    headline = 'Your growth results are available, but some sources need an update.';
    detail = `${staleSources} source${staleSources === 1 ? '' : 's'} should be refreshed before the next decision.`;
  } else if (hasHistoricalData) {
    status = 'ready';
    headline = 'Your latest growth results are ready to review.';
    detail = 'Start with the priorities and capability summaries below.';
  } else {
    status = 'warn';
    headline = 'Your sources are connected and the first results are still arriving.';
    detail = 'No metric or chart is shown until usable source data exists.';
  }

  const connection = args.connections.find((item) => item.provider === 'google');
  const capabilitySummaries = capabilityDefinitions
    .filter((capability) => args.capabilities.includes(capability.id as GrowthCapability))
    .map((capability) => ({
      id: capability.id,
      label: capability.label,
      path: capability.path,
      ...capabilityStatus({
        capability,
        connection,
        freshness: args.freshness,
        metrics: args.metrics,
      }),
    }));
  const funnel = buildFunnel(args.metrics);

  return {
    priorities,
    overview: {
      status,
      headline,
      detail,
      metricIds,
      recentOutcomes: buildRecentOutcomes(args.receipts),
      ...(funnel ? { funnel } : {}),
      capabilitySummaries,
    },
  };
}
