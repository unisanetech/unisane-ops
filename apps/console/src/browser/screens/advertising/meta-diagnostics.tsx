import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import {
  metaDiagnosticImportResultSchema,
  metaDiagnosticReviewResultSchema,
  type MetaDiagnosticReviewResult,
} from '@unisane/growth/contracts';
import { ContentSection } from '../../shared/content.js';
export function MetaDiagnostics({
  available,
  projectId,
  environmentId,
}: {
  available: boolean;
  projectId: string;
  environmentId: string;
}) {
  const [result, setResult] = useState<MetaDiagnosticReviewResult>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>, mode: 'import' | 'review') {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setResult(undefined);
    const form = new FormData(event.currentTarget);
    try {
      const body =
        mode === 'import'
          ? String(form.get('observation') ?? '')
          : JSON.stringify({
              ...(form.get('eventName') ? { eventName: form.get('eventName') } : {}),
              limit: 10,
            });
      if (new TextEncoder().encode(body).length > 256 * 1024) throw new Error();
      JSON.parse(body);
      const response = await fetch(`/api/console/meta/diagnostics/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) throw new Error();
      const raw: unknown = await response.json();
      const payload = raw && typeof raw === 'object' && 'result' in raw ? raw.result : undefined;
      if (mode === 'import') {
        const value = metaDiagnosticImportResultSchema.parse(payload);
        if (value.projectId !== projectId || value.environmentId !== environmentId)
          throw new Error();
        setMessage(
          `Imported ${value.eventCount} events. Evidence ${value.evidenceId}. Review the imported events below; live delivery remains unverified.`,
        );
      } else {
        const value = metaDiagnosticReviewResultSchema.parse(payload);
        if (value.projectId !== projectId || value.environmentId !== environmentId)
          throw new Error();
        setResult(value);
      }
    } catch {
      setMessage(
        'The diagnostic request failed. Check the JSON format, selected dataset, and local evidence.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ContentSection
      title="Meta event issues"
      description="Investigate imported Events Manager evidence. This does not fetch live diagnostics or verify a repair."
    >
      {!available ? (
        <p>This host does not supply diagnostic import and review.</p>
      ) : (
        <div className="grid gap-4">
          <details>
            <summary>Import diagnostic evidence</summary>
            <form onSubmit={(event) => void submit(event, 'import')} className="mt-3 grid gap-3">
              <label>
                Diagnostic observation JSON
                <textarea
                  name="observation"
                  required
                  disabled={busy}
                  rows={8}
                  className="block w-full rounded border p-3"
                />
              </label>
              <p>
                Include the selected project, environment, connection, dataset and source reference.
                Do not include customer data or credentials.
              </p>
              <Button className="justify-self-start" type="submit" disabled={busy}>
                Import evidence locally
              </Button>
            </form>
          </details>
          <form
            onSubmit={(event) => void submit(event, 'review')}
            className="flex flex-wrap items-end gap-3"
          >
            <label>
              Event name (optional)
              <input
                name="eventName"
                disabled={busy}
                className="block rounded border p-2"
                placeholder="Purchase"
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? 'Working…' : 'Review imported events'}
            </Button>
          </form>
        </div>
      )}
      {message && (
        <p role="status" className="mt-3 break-words">
          {message}
        </p>
      )}
      {result && <MetaDiagnosticResult result={result} />}
    </ContentSection>
  );
}
export function MetaDiagnosticResult({ result }: { result: MetaDiagnosticReviewResult }) {
  return (
    <div className="mt-4 grid gap-3" aria-live="polite">
      <Typography variant="bodyMedium">{result.message}</Typography>
      <p>
        Dataset {result.datasetId} · Evidence {result.freshness} · {result.completeness}
      </p>
      {result.source && (
        <p className="break-words">
          Source: {result.source.reference} · Captured {result.capturedAt} ·{' '}
          {result.window?.startDate} to {result.window?.endDate}
        </p>
      )}
      <p>
        {result.matchedEventCount} matching events{result.truncated ? ' · results truncated' : ''}
      </p>
      {result.events.map((event) => (
        <Card key={event.name} padding="md" variant="outlined">
          <Typography variant="panelTitle">{event.name}</Typography>
          <p>
            Activity: {event.activity} · Total: {event.total ?? 'Unknown'} · Last received:{' '}
            {event.lastReceivedAt ?? 'Unknown'}
          </p>
          <p>
            Reported match quality:{' '}
            {event.matchQuality === undefined ? 'Unavailable' : `${event.matchQuality}/10`} ·
            Channels: {event.channels.join(', ') || 'Unknown'}
          </p>
          {event.issues.length === 0 && (
            <p>No issues were included for this event. This does not verify event health.</p>
          )}
          {event.issues.map((issue) => (
            <div key={issue.code} className="mt-3">
              <p>
                {issue.severity} · {issue.code} · {issue.state}
              </p>
              <p>{issue.explanation}</p>
            </div>
          ))}
        </Card>
      ))}
      {result.handoffs.map((item) => (
        <Card key={`${item.eventName}:${item.issueCode}`} padding="md" variant="outlined">
          <Typography variant="panelTitle">
            Repair handoff: {item.eventName} / {item.issueCode}
          </Typography>
          <p>
            Owner: {item.owner} · {item.basis} · Unverified
          </p>
          <p>{item.proposal}</p>
          <p>Review supporting delivery evidence before applying any change.</p>
        </Card>
      ))}
    </div>
  );
}
