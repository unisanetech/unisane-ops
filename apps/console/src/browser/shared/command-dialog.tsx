import { useState } from 'react';
import type { MarketingConsoleConnectionAction } from '@unisane/growth/console';
import { Button } from '@unisane/ui/button';
import { Dialog } from '@unisane/ui/dialog';
import { Typography } from '@unisane/ui/typography';

type CopyState = 'idle' | 'copied' | 'failed';

export function CommandDialog({
  action,
  onClose,
}: {
  action: MarketingConsoleConnectionAction;
  onClose: () => void;
}) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(action.command);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <Dialog
      open
      title={action.label}
      description={action.description}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copyCommand}>
            {copyState === 'copied' ? 'Copy again' : 'Copy command'}
          </Button>
        </>
      }
    >
      <pre
        aria-label="Command to run"
        tabIndex={0}
        className="bg-inverse-surface text-inverse-on-surface focus-visible:outline-primary overflow-x-auto rounded-sm p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <code>{action.command}</code>
      </pre>
      <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
        Run this command in the project terminal. The command still enforces its own safety rules.
      </Typography>
      {copyState !== 'idle' ? (
        <Typography
          role={copyState === 'failed' ? 'alert' : 'status'}
          aria-live={copyState === 'failed' ? 'assertive' : 'polite'}
          variant="bodySmall"
          className={`mt-3 ${copyState === 'failed' ? 'text-error' : 'text-success'}`}
        >
          {copyState === 'copied'
            ? 'Command copied. No action has been run.'
            : 'Copy was blocked. Select and copy the command manually.'}
        </Typography>
      ) : null}
    </Dialog>
  );
}
