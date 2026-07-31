import type { MarketingConsoleState } from '@unisane/growth/console';
import { ActionCluster } from '@unisane/ui/action-cluster';
import { Button } from '@unisane/ui/button';
import { Dialog } from '@unisane/ui/dialog';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleOverlay } from '../contracts.js';
import { CommandDialog } from './command-dialog.js';
import { MetricCard, MetricGrid } from './content.js';

export function ConsoleOverlayDialog({
  overlay,
  state,
  onClose,
  onReplace,
}: {
  overlay: ConsoleOverlay | undefined;
  state: MarketingConsoleState;
  onClose: () => void;
  onReplace: (overlay: ConsoleOverlay) => void;
}) {
  if (!overlay) return null;
  if (overlay.kind === 'command') {
    return <CommandDialog action={overlay.action} onClose={onClose} />;
  }
  if (overlay.kind === 'disconnect') {
    const connection = overlay.connection;
    return (
      <Dialog
        open
        role="alertdialog"
        title={connection.disconnect.title}
        description={`This action affects only ${state.platformId} · ${state.environment}.`}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        actions={
          <>
            <Button variant="text" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="tonal"
              disabled={!connection.disconnect.command}
              onClick={() => {
                if (!connection.disconnect.command) return;
                onReplace({
                  kind: 'command',
                  action: {
                    id: `disconnect.${connection.provider}`,
                    label: `Disconnect ${connection.label}`,
                    description: 'Run the confirmed disconnect command in the project terminal.',
                    command: connection.disconnect.command,
                  },
                });
              }}
            >
              Confirm and copy command
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          {connection.disconnect.consequences.map((item) => (
            <Typography variant="bodyMedium" key={item}>
              • {item}
            </Typography>
          ))}
        </div>
        <Typography variant="bodyMedium" className="mt-4">
          <strong>Historical data remains available.</strong> Provider-side resources are unchanged.
        </Typography>
      </Dialog>
    );
  }
  return <SeoDialog overlay={overlay} state={state} onClose={onClose} />;
}

function SeoDialog({
  overlay,
  state,
  onClose,
}: {
  overlay: Extract<ConsoleOverlay, { kind: 'seo' }>;
  state: MarketingConsoleState;
  onClose: () => void;
}) {
  const detail = overlay.detail;
  if (detail.kind === 'page') {
    const page = state.seo.pages.find((item) => item.id === detail.id);
    if (!page) return null;
    return (
      <Dialog
        open
        title={page.title}
        description={page.statusDetail}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        actions={<Button onClick={onClose}>Close</Button>}
      >
        <MetricGrid>
          <MetricCard label="Organic clicks" value={page.clicks} helper="Current period" />
          <MetricCard label="Search views" value={page.searchViews} helper="Current period" />
          <MetricCard
            label="Average position"
            value={page.averagePosition ?? 'Not available'}
            helper="Current period"
          />
        </MetricGrid>
      </Dialog>
    );
  }
  if (detail.kind === 'query') {
    const query = state.seo.queries.find((item) => item.id === detail.id);
    if (!query) return null;
    return (
      <Dialog
        open
        title={query.query}
        description="Previous-period data is unavailable, so the console does not claim a trend."
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        actions={<Button onClick={onClose}>Close</Button>}
      >
        <Typography variant="bodyMedium">
          <strong>Best page:</strong> {query.bestPage?.title ?? 'Not available'}
        </Typography>
      </Dialog>
    );
  }
  const opportunity = state.seo.opportunities.find((item) => item.id === detail.id);
  if (!opportunity) return null;
  return (
    <Dialog
      open
      title={opportunity.title}
      description={opportunity.reason}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      actions={
        <ActionCluster align="end">
          <Button onClick={onClose}>Close</Button>
        </ActionCluster>
      }
    >
      <Typography variant="bodyMedium">
        <strong>Expected outcome:</strong> {opportunity.expectedOutcome}
      </Typography>
      <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
        {opportunity.impactLabel} · {opportunity.confidenceLabel} · {opportunity.effortLabel}
      </Typography>
    </Dialog>
  );
}
