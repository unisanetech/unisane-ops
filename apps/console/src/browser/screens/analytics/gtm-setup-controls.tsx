import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import type { GtmTrackingSetupInput } from '@unisane/growth/gtm';
export function GtmSetupControls() {
  const [source, setSource] = useState('');
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <details className="mt-5 min-w-0">
      <summary>Generate tracking setup proposal</summary>
      <p className="my-3">
        Provide explicit event destinations, data-layer paths and consent defaults. The result is a
        separate manifest proposal; current configuration and provider accounts remain unchanged.
      </p>
      <form
        className="grid min-w-0 gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage('');
          setOutput('');
          try {
            const input = JSON.parse(source) as GtmTrackingSetupInput;
            const response = await fetch('/api/console/gtm/setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error ?? 'Check setup inputs.');
            setOutput(JSON.stringify(body.result, null, 2));
            setMessage(
              'Proposal generated. Review its required observations and diagnosis before merging into the canonical manifest.',
            );
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Setup generation failed.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Tracking setup JSON
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            rows={10}
            required
            disabled={busy}
            className="block w-full rounded border p-2 font-mono text-sm"
            placeholder="Use the explicit setup example in the GTM operator guide."
          />
        </label>
        <Button type="submit" disabled={busy}>
          Generate tracking proposal
        </Button>
      </form>
      {message && (
        <p role="status" className="mt-3 break-words">
          {message}
        </p>
      )}
      {output && (
        <details open className="mt-3 min-w-0">
          <summary>Manifest proposal and required observations</summary>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all">{output}</pre>
        </details>
      )}
    </details>
  );
}
