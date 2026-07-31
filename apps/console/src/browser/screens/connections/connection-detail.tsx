import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionService,
} from '@unisane/growth/console';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatDateTime } from '../../lib/format.js';
import { ActivityItemCard } from '../../shared/activity-item-card.js';
import {
  ContentSection,
  EmptyState,
  MetricCard,
  MetricGrid,
  StatusBadge,
} from '../../shared/content.js';

export function ConnectionDetailScreen(props: ConsoleScreenProps) {
  const provider = props.route.path.split('/')[2] ?? '';
  const connection = props.state.connections.find((item) => item.provider === provider);
  if (!connection?.connected) {
    return (
      <ContentSection>
        <EmptyState
          title="This provider is not connected."
          description="Return to Connections to start the supported guided flow."
          actionLabel="All connections"
          onAction={() => props.navigate('/connections')}
        />
      </ContentSection>
    );
  }
  const tab = props.route.id.split('.').pop();
  if (tab === 'access') return <ConnectionAccess connection={connection} {...props} />;
  if (tab === 'resources') return <ConnectionResources connection={connection} {...props} />;
  if (tab === 'data-sync') return <ConnectionDataSync connection={connection} {...props} />;
  if (tab === 'activity') return <ConnectionActivity connection={connection} {...props} />;
  return <ConnectionOverview connection={connection} {...props} />;
}

function ConnectionOverview({
  connection,
  openOverlay,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  const workingCount = connection.services.filter((service) => service.state === 'current').length;
  return (
    <>
      <ContentSection>
        <MetricGrid>
          <MetricCard
            label="Connection"
            value={connection.statusLabel}
            helper={connection.summary}
          />
          <MetricCard
            label={`${connection.label} account`}
            value={connection.identityLabel ?? 'Identity not recorded'}
            helper="The account used for this workspace."
          />
          <MetricCard
            label="Selected services"
            value={`${workingCount} / ${connection.services.length}`}
            helper="Services currently providing usable data."
          />
        </MetricGrid>
      </ContentSection>
      <ContentSection
        title="Service health"
        description={
          connection.lastCheckedAt
            ? `Connection verified ${formatDateTime(connection.lastCheckedAt)}.`
            : 'Each provider service is evaluated independently.'
        }
      >
        <Card variant="outlined" padding="md">
          <div className="grid gap-4">
            {connection.services.map((service) => (
              <ServiceHeading service={service} key={service.id} />
            ))}
          </div>
        </Card>
      </ContentSection>
      <ContentSection>
        <Card variant="outlined" padding="md">
          <Typography variant="panelTitle" className="text-error">
            Disconnect {connection.label}
          </Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
            Future updates stop. Historical data and provider-side resources remain.
          </Typography>
          <Button
            className="mt-5"
            variant="tonal"
            onClick={() => openOverlay({ kind: 'disconnect', connection })}
          >
            Disconnect
          </Button>
        </Card>
      </ContentSection>
    </>
  );
}

function ConnectionAccess({
  connection,
  openOverlay,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  return (
    <ContentSection
      title="Access by service"
      description={
        connection.identityLabel
          ? `Signed in as ${connection.identityLabel}. Each service keeps its own access state.`
          : `The ${connection.label} account identity was not recorded. Each service still keeps its own access state.`
      }
    >
      <div className="grid gap-3">
        {connection.services.map((service) => (
          <Card variant="outlined" padding="sm" key={service.id}>
            <ServiceHeading service={service} />
            <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
              {service.accessLabel}
            </Typography>
            <Typography variant="labelMedium" className="mt-2">
              {service.accessLevelLabel}
            </Typography>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Detail
                label="Last verified"
                value={
                  service.accessVerifiedAt
                    ? formatDateTime(service.accessVerifiedAt)
                    : 'Not verified yet'
                }
              />
              <Detail
                label="Expires"
                value={
                  service.accessExpiresAt
                    ? formatDateTime(service.accessExpiresAt)
                    : 'No expiry was reported'
                }
              />
            </dl>
            {service.accessAction ? (
              <Button
                className="mt-4"
                variant="tonal"
                size="sm"
                onClick={() => openOverlay({ kind: 'command', action: service.accessAction! })}
              >
                {service.accessAction.label}
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </ContentSection>
  );
}

function ConnectionResources({
  connection,
  openOverlay,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  return (
    <ContentSection
      title="Selected resources"
      description={`These are the exact ${connection.label} resources whose data appears in this workspace.`}
    >
      <div className="grid gap-3">
        {connection.services.map((service) => (
          <Card variant="outlined" padding="sm" key={service.id}>
            <ServiceHeading service={service} />
            {service.resource ? (
              <>
                <Typography variant="labelMedium" className="mt-3">
                  {service.resource.type}: {service.resource.label}
                </Typography>
                {service.resource.identifier ? (
                  <Typography
                    variant="bodySmall"
                    className="text-on-surface-variant mt-1 break-all"
                  >
                    Provider identifier: {service.resource.identifier}
                  </Typography>
                ) : null}
                <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                  Selected {formatDateTime(service.resource.selectedAt)}
                </Typography>
              </>
            ) : (
              <Typography variant="bodySmall" className="text-warning mt-3">
                No resource is selected for this service.
              </Typography>
            )}
            {service.resourceAction ? (
              <Button
                className="mt-4"
                variant="tonal"
                size="sm"
                onClick={() => openOverlay({ kind: 'command', action: service.resourceAction! })}
              >
                {service.resource ? 'Change resource' : 'Choose resource'}
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </ContentSection>
  );
}

function ConnectionDataSync({
  connection,
  openOverlay,
  navigate,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  return (
    <>
      <ContentSection
        title="Data updates"
        description="See when each service last produced usable data and request an update when the provider supports it."
      >
        <div className="grid gap-3">
          {connection.services.map((service) => (
            <Card variant="outlined" padding="sm" key={service.id}>
              <ServiceHeading service={service} />
              <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
                {service.dataLabel}
              </Typography>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail
                  label="Latest usable update"
                  value={
                    service.dataUpdatedAt
                      ? formatDateTime(service.dataUpdatedAt)
                      : 'No usable update recorded'
                  }
                />
                <Detail label="Coverage" value={service.dataCoverageLabel} />
              </dl>
              {service.issue ? (
                <Typography variant="bodySmall" className="text-warning mt-3">
                  {service.issue}
                </Typography>
              ) : null}
              {service.syncAction ? (
                <Button
                  className="mt-4"
                  variant="tonal"
                  size="sm"
                  onClick={() => openOverlay({ kind: 'command', action: service.syncAction! })}
                >
                  {service.syncAction.label}
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      </ContentSection>
      <ContentSection>
        <EmptyState
          title="Need recurring updates?"
          description="Automations controls the reporting jobs selected for this workspace."
          actionLabel="Review automations"
          onAction={() => navigate('/settings/automations')}
        />
      </ContentSection>
    </>
  );
}

function ConnectionActivity({
  connection,
  state,
  navigate,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  const providerLabels = new Set([
    connection.label,
    ...connection.services.map((service) => service.label),
  ]);
  const items = state.activity.items
    .filter((item) => providerLabels.has(item.providerLabel))
    .slice(0, 10);
  return (
    <ContentSection
      title="Connection activity"
      description={`Recent provider updates, access failures, and managed changes for this ${connection.label} connection.`}
    >
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <ActivityItemCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No connection activity is recorded yet."
          description="Provider updates and connection failures will appear here after they occur."
          actionLabel="Open all activity"
          onAction={() => navigate('/activity')}
        />
      )}
    </ContentSection>
  );
}

function ServiceHeading({ service }: { service: MarketingConsoleConnectionService }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Typography variant="labelLarge">{service.label}</Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
          {service.purpose}
        </Typography>
      </div>
      <StatusBadge status={service.state} label={service.statusLabel} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-on-surface-variant">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
