import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionService,
} from '@unisane/growth/console';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../contracts.js';
import { ContentSection, StatusBadge } from '../shared/content.js';
import { ConnectionDetailScreen } from './connections/connection-detail.js';

export function ConnectionsScreen(props: ConsoleScreenProps) {
  if (props.route.family === 'connection-detail') {
    return <ConnectionDetailScreen {...props} />;
  }
  return (
    <ContentSection>
      <div className="grid gap-4">
        {props.state.connections.map((connection) => (
          <ConnectionCard connection={connection} {...props} key={connection.provider} />
        ))}
      </div>
    </ContentSection>
  );
}

function ConnectionCard({
  connection,
  navigate,
  openOverlay,
}: ConsoleScreenProps & { connection: MarketingConsoleConnection }) {
  return (
    <Card variant="outlined" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="panelTitle">{connection.label}</Typography>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
            {connection.summary}
          </Typography>
        </div>
        <StatusBadge status={connection.state} label={connection.statusLabel} />
      </div>
      {connection.connected ? (
        <div className="border-outline-subtle mt-5 grid gap-4 border-t pt-4">
          {connection.services.map((service) => (
            <ServiceRow service={service} key={service.id} />
          ))}
        </div>
      ) : null}
      <div className="mt-5">
        {connection.connected ? (
          <Button
            variant="outlined"
            size="sm"
            onClick={() => navigate(`/connections/${connection.provider}/overview`)}
          >
            Manage connection
          </Button>
        ) : connection.primaryAction ? (
          <Button
            size="sm"
            onClick={() => openOverlay({ kind: 'command', action: connection.primaryAction! })}
          >
            {connection.primaryAction.label}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function ServiceRow({ service }: { service: MarketingConsoleConnectionService }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Typography variant="labelLarge">{service.label}</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          {service.purpose}
        </Typography>
      </div>
      <StatusBadge status={service.state} label={service.statusLabel} />
    </div>
  );
}
