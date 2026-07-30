import type { GrowthCapability } from '../config.js';
import type { GrowthConnectionsContext } from '../cli/project-context.js';
import type { MarketingEvidenceProviderStatus } from '../marketing/reports/evidence-status.js';
import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionAction,
  MarketingConsoleConnectionService,
  MarketingConsoleConnectionState,
  MarketingConsoleFreshnessCell,
} from './contracts.js';

type GoogleService = 'search-console' | 'analytics' | 'tag-manager' | 'ads';

const googleServices: Array<{
  id: GoogleService;
  capability: GrowthCapability;
  label: string;
  purpose: string;
  evidenceProvider: 'searchConsole' | 'ga4' | 'gtm' | 'googleAds';
}> = [
  {
    id: 'search-console',
    capability: 'seo',
    label: 'Search Console',
    purpose: 'Understand how your site appears in Google Search.',
    evidenceProvider: 'searchConsole',
  },
  {
    id: 'analytics',
    capability: 'analytics',
    label: 'Google Analytics',
    purpose: 'Understand visitors, traffic, and conversions.',
    evidenceProvider: 'ga4',
  },
  {
    id: 'tag-manager',
    capability: 'tag-manager',
    label: 'Tag Manager',
    purpose: 'Verify and manage measurement without duplicating tags.',
    evidenceProvider: 'gtm',
  },
  {
    id: 'ads',
    capability: 'advertising',
    label: 'Google Ads',
    purpose: 'Review advertising performance and conversion signals.',
    evidenceProvider: 'googleAds',
  },
];

const statePriority: MarketingConsoleConnectionState[] = [
  'expired-access',
  'failed',
  'partial-permission',
  'needs-resource',
  'delayed',
  'syncing',
  'not-connected',
  'current',
];

function action(
  id: string,
  label: string,
  description: string,
  command: string,
): MarketingConsoleConnectionAction {
  return { id, label, description, command };
}

function humanize(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(state: MarketingConsoleConnectionState): string {
  const labels: Record<MarketingConsoleConnectionState, string> = {
    current: 'Working',
    'not-connected': 'Not connected',
    syncing: 'Getting first data',
    delayed: 'Data delayed',
    'needs-resource': 'Choose a resource',
    'partial-permission': 'Needs more access',
    'expired-access': 'Access expired',
    failed: 'Needs attention',
  };
  return labels[state];
}

function selectedResource(
  connection: NonNullable<GrowthConnectionsContext['providers'][number]['connection']>,
  service: GoogleService,
) {
  return connection.resources.find(
    (resource) => resource.service === service && resource.state === 'selected',
  );
}

function serviceProjection(args: {
  service: (typeof googleServices)[number];
  environmentId: string;
  connection?: GrowthConnectionsContext['providers'][number]['connection'];
  evidence?: MarketingEvidenceProviderStatus;
  freshness: MarketingConsoleFreshnessCell[];
}): MarketingConsoleConnectionService {
  const baseCommand = `unisane connect google --environment ${args.environmentId}`;
  if (!args.connection) {
    const state = 'not-connected';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Connect Google to request access',
      dataLabel: 'No data is available yet',
      issue: `${args.service.label} is not connected for this environment.`,
      action: action(
        `google.${args.service.id}.connect`,
        'Connect Google',
        `Connect Google and enable ${args.service.label}.`,
        baseCommand,
      ),
    };
  }
  const reconnectCommand = `${baseCommand} --connection ${args.connection.id}`;
  if (args.connection.credentialState === 'expired') {
    const state = 'expired-access';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Google access has expired',
      dataLabel: 'Existing historical data remains available',
      lastCheckedAt: args.connection.lastVerifiedAt ?? args.connection.updatedAt,
      issue: 'Reconnect the same Google account to restore access.',
      action: action(
        `google.${args.service.id}.reconnect`,
        'Reconnect Google',
        `Restore access for ${args.service.label}.`,
        reconnectCommand,
      ),
    };
  }
  if (
    args.connection.credentialState === 'revoked' ||
    args.connection.credentialState === 'missing'
  ) {
    const state = 'failed';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Google access is unavailable',
      dataLabel: 'Existing historical data remains available',
      lastCheckedAt: args.connection.lastVerifiedAt ?? args.connection.updatedAt,
      issue: 'Reconnect Google before new data can be collected.',
      action: action(
        `google.${args.service.id}.reconnect`,
        'Reconnect Google',
        `Restore access for ${args.service.label}.`,
        reconnectCommand,
      ),
    };
  }
  const grant = args.connection.grants.find((item) => item.service === args.service.id);
  if (!grant || grant.state !== 'granted') {
    const state = 'partial-permission';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel:
        grant?.state === 'partial'
          ? 'Some required access is missing'
          : 'Required access is missing',
      dataLabel: 'Working Google services are not affected',
      lastCheckedAt: grant?.observedAt ?? args.connection.lastVerifiedAt,
      issue: `Grant only the additional access required for ${args.service.label}.`,
      action: action(
        `google.${args.service.id}.grant`,
        'Review access',
        `Request the additional access required for ${args.service.label}.`,
        `${reconnectCommand} --service ${args.service.id}`,
      ),
    };
  }
  const resource = selectedResource(args.connection, args.service.id);
  if (!resource) {
    const state = 'needs-resource';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Access granted',
      dataLabel: 'Choose the site, property, container, or account to use',
      lastCheckedAt: grant.observedAt,
      issue: `${args.service.label} needs one selected resource for this environment.`,
      action: action(
        `google.${args.service.id}.resource`,
        'Choose resource',
        `Discover and choose the ${args.service.label} resource for this environment.`,
        `${reconnectCommand} --service ${args.service.id}`,
      ),
    };
  }
  const readyFreshness = args.freshness.find(
    (cell) => cell.provider === args.service.evidenceProvider && cell.status === 'ready',
  );
  if (args.evidence?.evidenceStatus === 'pass' || readyFreshness) {
    const state = 'current';
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Access granted',
      resource: {
        type: humanize(resource.resourceType),
        label: resource.displayName,
      },
      dataLabel: 'Latest usable data is current',
      lastCheckedAt: args.connection.lastVerifiedAt ?? resource.observedAt,
    };
  }
  const hasOlderData = args.evidence?.reportFamilies.some((family) => Boolean(family.path));
  const state = hasOlderData ? 'delayed' : 'syncing';
  return {
    id: args.service.id,
    label: args.service.label,
    purpose: args.service.purpose,
    state,
    statusLabel: statusLabel(state),
    accessLabel: 'Access granted',
    resource: {
      type: humanize(resource.resourceType),
      label: resource.displayName,
    },
    dataLabel: hasOlderData
      ? 'Older data remains available while the latest update is delayed'
      : 'Waiting for the first usable data',
    lastCheckedAt: args.connection.lastVerifiedAt ?? resource.observedAt,
    ...(args.evidence?.evidenceMessage ? { issue: args.evidence.evidenceMessage } : {}),
    ...(args.evidence?.evidenceCommands[0]
      ? {
          action: action(
            `google.${args.service.id}.refresh`,
            'Refresh data',
            `Request the latest ${args.service.label} data.`,
            args.evidence.evidenceCommands[0].command,
          ),
        }
      : {}),
  };
}

function overallState(
  connected: boolean,
  services: MarketingConsoleConnectionService[],
): MarketingConsoleConnectionState {
  if (!connected) return 'not-connected';
  return (
    statePriority.find((state) => services.some((service) => service.state === state)) ?? 'current'
  );
}

export function buildMarketingConsoleConnections(args: {
  context: GrowthConnectionsContext;
  capabilities: readonly GrowthCapability[];
  evidence: readonly MarketingEvidenceProviderStatus[];
  freshness: MarketingConsoleFreshnessCell[];
}): MarketingConsoleConnection[] {
  return args.context.providers
    .filter((provider) => provider.provider === 'google' && provider.available)
    .map((provider) => {
      const connection = provider.connection;
      const services = googleServices
        .filter((service) => args.capabilities.includes(service.capability))
        .map((service) =>
          serviceProjection({
            service,
            environmentId: args.context.environmentId,
            connection,
            evidence: args.evidence.find(
              (providerEvidence) => providerEvidence.provider === service.evidenceProvider,
            ),
            freshness: args.freshness,
          }),
        );
      const connected = Boolean(connection);
      const state = overallState(connected, services);
      const primaryAction = !connected
        ? action(
            'google.connect',
            'Continue with Google',
            'Connect one Google account and request only the access needed by selected outcomes.',
            `unisane connect google --environment ${args.context.environmentId}`,
          )
        : services.find((service) => service.state === state)?.action;
      const workingCount = services.filter((service) => service.state === 'current').length;
      const summary =
        state === 'current'
          ? `${workingCount} selected Google service${workingCount === 1 ? ' is' : 's are'} working.`
          : connected
            ? `${workingCount} of ${services.length} selected Google services are working.`
            : 'Connect Google to enable the selected growth outcomes.';
      return {
        provider: provider.provider,
        label: 'Google',
        available: provider.available,
        connected,
        state,
        statusLabel: statusLabel(state),
        summary,
        ...(connection
          ? {
              connectionId: connection.id,
              identityLabel: connection.identity ?? connection.displayName,
              lastCheckedAt: connection.lastVerifiedAt ?? connection.updatedAt,
            }
          : {}),
        services,
        ...(primaryAction ? { primaryAction } : {}),
        disconnect: {
          title: 'Disconnect Google from this workspace?',
          ...(connection
            ? {
                command: `unisane disconnect google --environment ${args.context.environmentId} --connection ${connection.id} --yes`,
              }
            : {}),
          consequences: [
            'New reports and scheduled data updates from Google will stop.',
            'Automations that depend on this connection will pause.',
            'Managed tags, Analytics properties, and advertising campaigns in Google will not be changed.',
          ],
          historicalDataRemains: true,
          providerResourcesUnchanged: true,
        },
      };
    });
}
