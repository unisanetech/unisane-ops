import type { MarketingConsoleState } from '@unisane/growth/console';
import { Button } from '@unisane/ui/button';
import { Dialog } from '@unisane/ui/dialog';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleOverlay } from '../contracts.js';
import { CommandDialog } from './command-dialog.js';

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
  return null;
}
