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

function accessLevelLabel(service: GoogleService, scopes: readonly string[] | undefined): string {
  if (!scopes?.length) return 'Provider permission details were not recorded';
  if (service === 'ads') {
    return 'Advertising account access; provider changes still require explicit approval';
  }
  return 'Read-only provider access';
}

function serviceFreshness(
  service: (typeof googleServices)[number],
  freshness: readonly MarketingConsoleFreshnessCell[],
): MarketingConsoleFreshnessCell[] {
  return freshness.filter((cell) => cell.provider === service.evidenceProvider);
}

function dataCoverageLabel(cells: readonly MarketingConsoleFreshnessCell[]): string {
  const friendlyLabels: Record<string, string> = {
    'Search Console query/page': 'search queries and landing pages',
    'Search Console page': 'indexed pages',
    'Search Console query': 'search queries',
    'GA4 landing page': 'landing pages',
    'GA4 channel': 'traffic channels',
    'GA4 source / medium': 'acquisition sources',
    'Google Ads campaign': 'campaigns',
    'Google Ads keyword': 'keywords',
    'Google Ads conversion': 'conversion actions',
  };
  const labelSet = new Set(
    cells.filter((cell) => cell.path).map((cell) => friendlyLabels[cell.label] ?? cell.label),
  );
  if (labelSet.has('search queries and landing pages')) {
    labelSet.delete('search queries');
    labelSet.delete('landing pages');
  }
  const labels = [...labelSet];
  if (!labels.length) return 'No usable data update has been recorded';
  if (labels.length <= 3) return `Includes ${labels.join(', ')}`;
  return `Includes ${labels.slice(0, 3).join(', ')}, and ${labels.length - 3} more data updates`;
}

function latestPulledAt(cells: readonly MarketingConsoleFreshnessCell[]): string | undefined {
  return cells
    .map((cell) => cell.pulledAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}

function serviceProjection(args: {
  service: (typeof googleServices)[number];
  environmentId: string;
  connection?: GrowthConnectionsContext['providers'][number]['connection'];
  evidence?: MarketingEvidenceProviderStatus;
  freshness: MarketingConsoleFreshnessCell[];
}): MarketingConsoleConnectionService {
  const baseCommand = `unisane connect google --environment ${args.environmentId}`;
  const cells = serviceFreshness(args.service, args.freshness);
  const coverageLabel = dataCoverageLabel(cells);
  const dataUpdatedAt = latestPulledAt(cells);
  if (!args.connection) {
    const state = 'not-connected';
    const connectAction = action(
      `google.${args.service.id}.connect`,
      'Connect Google',
      `Connect Google and enable ${args.service.label}.`,
      baseCommand,
    );
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Connect Google to request access',
      accessLevelLabel: 'No provider permission has been granted',
      dataLabel: 'No data is available yet',
      dataCoverageLabel: coverageLabel,
      issue: `${args.service.label} is not connected for this environment.`,
      primaryAction: connectAction,
      accessAction: connectAction,
    };
  }
  const reconnectCommand = `${baseCommand} --connection ${args.connection.id}`;
  const serviceCommand = `${reconnectCommand} --service ${args.service.id}`;
  const grant = args.connection.grants.find((item) => item.service === args.service.id);
  const reviewAccessAction = action(
    `google.${args.service.id}.access`,
    'Review access',
    `Review the Google access used by ${args.service.label}.`,
    serviceCommand,
  );
  const chooseResourceAction = action(
    `google.${args.service.id}.resource`,
    'Change resource',
    `Discover and choose the ${args.service.label} resource for this environment.`,
    serviceCommand,
  );
  const refreshAction = args.evidence?.evidenceCommands[0]
    ? action(
        `google.${args.service.id}.refresh`,
        'Refresh data',
        `Request the latest ${args.service.label} data.`,
        args.evidence.evidenceCommands[0].command,
      )
    : undefined;
  if (args.connection.credentialState === 'expired') {
    const state = 'expired-access';
    const reconnectAction = action(
      `google.${args.service.id}.reconnect`,
      'Reconnect Google',
      `Restore access for ${args.service.label}.`,
      reconnectCommand,
    );
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Google access has expired',
      accessLevelLabel: accessLevelLabel(args.service.id, grant?.scopes),
      ...(grant?.observedAt ? { accessVerifiedAt: grant.observedAt } : {}),
      ...(grant?.expiresAt ? { accessExpiresAt: grant.expiresAt } : {}),
      dataLabel: 'Existing historical data remains available',
      ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
      dataCoverageLabel: coverageLabel,
      lastCheckedAt: args.connection.lastVerifiedAt ?? args.connection.updatedAt,
      issue: 'Reconnect the same Google account to restore access.',
      primaryAction: reconnectAction,
      accessAction: reconnectAction,
    };
  }
  if (
    args.connection.credentialState === 'revoked' ||
    args.connection.credentialState === 'missing'
  ) {
    const state = 'failed';
    const reconnectAction = action(
      `google.${args.service.id}.reconnect`,
      'Reconnect Google',
      `Restore access for ${args.service.label}.`,
      reconnectCommand,
    );
    return {
      id: args.service.id,
      label: args.service.label,
      purpose: args.service.purpose,
      state,
      statusLabel: statusLabel(state),
      accessLabel: 'Google access is unavailable',
      accessLevelLabel: accessLevelLabel(args.service.id, grant?.scopes),
      ...(grant?.observedAt ? { accessVerifiedAt: grant.observedAt } : {}),
      dataLabel: 'Existing historical data remains available',
      ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
      dataCoverageLabel: coverageLabel,
      lastCheckedAt: args.connection.lastVerifiedAt ?? args.connection.updatedAt,
      issue: 'Reconnect Google before new data can be collected.',
      primaryAction: reconnectAction,
      accessAction: reconnectAction,
    };
  }
  if (!grant || grant.state !== 'granted') {
    const state = 'partial-permission';
    const grantAction = action(
      `google.${args.service.id}.grant`,
      'Review access',
      `Request the additional access required for ${args.service.label}.`,
      serviceCommand,
    );
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
      accessLevelLabel: accessLevelLabel(args.service.id, grant?.scopes),
      ...(grant?.observedAt ? { accessVerifiedAt: grant.observedAt } : {}),
      ...(grant?.expiresAt ? { accessExpiresAt: grant.expiresAt } : {}),
      dataLabel: 'Working Google services are not affected',
      ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
      dataCoverageLabel: coverageLabel,
      lastCheckedAt: grant?.observedAt ?? args.connection.lastVerifiedAt,
      issue: `Grant only the additional access required for ${args.service.label}.`,
      primaryAction: grantAction,
      accessAction: grantAction,
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
      accessLevelLabel: accessLevelLabel(args.service.id, grant.scopes),
      accessVerifiedAt: grant.observedAt,
      ...(grant.expiresAt ? { accessExpiresAt: grant.expiresAt } : {}),
      dataLabel: 'Choose the site, property, container, or account to use',
      ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
      dataCoverageLabel: coverageLabel,
      lastCheckedAt: grant.observedAt,
      issue: `${args.service.label} needs one selected resource for this environment.`,
      primaryAction: chooseResourceAction,
      accessAction: reviewAccessAction,
      resourceAction: chooseResourceAction,
      ...(refreshAction ? { syncAction: refreshAction } : {}),
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
      accessLevelLabel: accessLevelLabel(args.service.id, grant.scopes),
      accessVerifiedAt: grant.observedAt,
      ...(grant.expiresAt ? { accessExpiresAt: grant.expiresAt } : {}),
      resource: {
        type: humanize(resource.resourceType),
        label: resource.displayName,
        identifier: resource.resourceId,
        selectedAt: resource.observedAt,
      },
      dataLabel: 'Latest usable data is current',
      ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
      dataCoverageLabel: coverageLabel,
      lastCheckedAt: args.connection.lastVerifiedAt ?? resource.observedAt,
      accessAction: reviewAccessAction,
      resourceAction: chooseResourceAction,
      ...(refreshAction ? { syncAction: refreshAction } : {}),
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
    accessLevelLabel: accessLevelLabel(args.service.id, grant.scopes),
    accessVerifiedAt: grant.observedAt,
    ...(grant.expiresAt ? { accessExpiresAt: grant.expiresAt } : {}),
    resource: {
      type: humanize(resource.resourceType),
      label: resource.displayName,
      identifier: resource.resourceId,
      selectedAt: resource.observedAt,
    },
    dataLabel: hasOlderData
      ? 'Older data remains available while the latest update is delayed'
      : 'Waiting for the first usable data',
    ...(dataUpdatedAt ? { dataUpdatedAt } : {}),
    dataCoverageLabel: coverageLabel,
    lastCheckedAt: args.connection.lastVerifiedAt ?? resource.observedAt,
    ...(args.evidence?.evidenceMessage ? { issue: args.evidence.evidenceMessage } : {}),
    ...(refreshAction ? { primaryAction: refreshAction, syncAction: refreshAction } : {}),
    accessAction: reviewAccessAction,
    resourceAction: chooseResourceAction,
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
  const googleConnections = args.context.providers
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
        : services.find((service) => service.state === state)?.primaryAction;
      const workingCount = services.filter((service) => service.state === 'current').length;
      const identityLabel =
        connection?.identity ??
        (connection?.displayName.trim().toLowerCase() === 'google'
          ? undefined
          : connection?.displayName);
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
        required: true,
        connected,
        state,
        statusLabel: statusLabel(state),
        summary,
        ...(connection
          ? {
              connectionId: connection.id,
              ...(identityLabel ? { identityLabel } : {}),
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
  const metaProvider = args.context.providers.find(
    (provider) => provider.provider === 'meta' && provider.available,
  );
  if (!metaProvider || !args.capabilities.includes('advertising')) return googleConnections;
  const metaFreshness = args.freshness.filter((cell) => cell.provider === 'metaAds');
  const sampleEvidence = metaFreshness.some(
    (cell) => cell.sourceKind === 'fixture' && cell.status === 'ready',
  );
  const connected = Boolean(metaProvider.connection);
  const currentEvidence = metaFreshness.some((cell) => cell.status === 'ready');
  const state: MarketingConsoleConnectionState = connected
    ? currentEvidence
      ? 'current'
      : 'delayed'
    : 'not-connected';
  const service: MarketingConsoleConnectionService = {
    id: 'ads',
    label: 'Meta Ads',
    purpose: 'Review Facebook and Instagram advertising performance.',
    state,
    statusLabel: statusLabel(state),
    accessLabel: connected ? 'Meta advertising access is recorded' : 'No Meta account is connected',
    accessLevelLabel: connected
      ? 'Advertising account access'
      : 'No provider permission has been granted',
    dataLabel: sampleEvidence
      ? 'Sample reports are available for interface validation'
      : currentEvidence
        ? 'Meta advertising reports are available'
        : 'No usable Meta advertising data is available',
    dataCoverageLabel: dataCoverageLabel(metaFreshness),
    ...(latestPulledAt(metaFreshness) ? { dataUpdatedAt: latestPulledAt(metaFreshness) } : {}),
  };
  const metaConnection: MarketingConsoleConnection = {
    provider: 'meta',
    label: 'Meta',
    available: true,
    required: false,
    connected,
    state,
    statusLabel: statusLabel(state),
    summary: connected
      ? currentEvidence
        ? 'Meta Ads is connected and has usable advertising evidence.'
        : 'Meta Ads is connected but its reports need an update.'
      : sampleEvidence
        ? 'No Meta account is connected. Sample advertising evidence is available for interface validation.'
        : 'No Meta account is connected to this workspace.',
    ...(metaProvider.connection
      ? {
          connectionId: metaProvider.connection.id,
          ...(metaProvider.connection.identity
            ? { identityLabel: metaProvider.connection.identity }
            : {}),
          lastCheckedAt:
            metaProvider.connection.lastVerifiedAt ?? metaProvider.connection.updatedAt,
        }
      : {}),
    services: [service],
    disconnect: {
      title: 'Disconnect Meta from this workspace?',
      consequences: [
        'New Meta advertising reports and scheduled updates will stop.',
        'Historical reports will remain available.',
        'Meta campaigns, Pages, Instagram accounts, and datasets will not be changed.',
      ],
      historicalDataRemains: true,
      providerResourcesUnchanged: true,
    },
  };
  return [...googleConnections, metaConnection];
}
