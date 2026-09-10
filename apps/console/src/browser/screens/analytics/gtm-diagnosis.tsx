import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import type { GoogleTagManagerDiagnosisResult } from '@unisane/growth/gtm';
export function GtmDiagnosis() {
  const [result, setResult] = useState<GoogleTagManagerDiagnosisResult>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(undefined);
    setError('');
    try {
      const body = String(new FormData(event.currentTarget).get('evidence') ?? '');
      if (new TextEncoder().encode(body).length > 1024 * 1024) throw new Error();
      JSON.parse(body);
      const response = await fetch('/api/console/gtm/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { result: GoogleTagManagerDiagnosisResult };
      setResult(payload.result);
    } catch {
      setError(
        'Check the manifest, app/environment and snapshot. Diagnosis could not be completed.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 grid gap-3">
      <details>
        <summary>Diagnose local GTM evidence</summary>
        <form onSubmit={(event) => void submit(event)} className="mt-3 grid gap-3">
          <label>
            GTM evidence JSON
            <textarea
              name="evidence"
              required
              rows={8}
              className="block w-full rounded border p-3"
              disabled={busy}
            />
          </label>
          <p>
            Supply projectId, manifest, environment and an optional normalized snapshot. Evidence is
            inspected locally and is not saved or applied.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? 'Diagnosing…' : 'Diagnose GTM'}
          </Button>
        </form>
      </details>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div aria-live="polite" className="grid gap-3">
          <p>
            {result.containerPath} · {result.evidence} · Tracking unverified
          </p>
          {result.issues.map((issue, index) => (
            <p key={index}>
              {issue.severity} · {issue.code}: {issue.message}
            </p>
          ))}
          <p>
            {result.operations.length} proposed operations. Create and review an exact change plan
            before applying.
          </p>
          <ul>
            {result.operations.map((operation, index) => (
              <li key={index}>
                {operation.type} · {operation.kind}: {operation.slug}
              </li>
            ))}
          </ul>
          {result.verificationGaps.map((gap) => (
            <p key={gap}>{gap}</p>
          ))}
        </div>
      )}
    </div>
  );
}
