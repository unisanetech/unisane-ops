import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import {
  growthReportHistoryResultSchema,
  type GrowthReportHistoryResult,
} from '@unisane/growth/contracts';
import { MetaReportResult } from './meta-report-result.js';
export function MetaReportHistory({
  projectId,
  environmentId,
}: {
  projectId: string;
  environmentId: string;
}) {
  const [history, setHistory] = useState<GrowthReportHistoryResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load(evidenceId?: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/console/meta/report/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20, ...(evidenceId ? { evidenceId } : {}) }),
      });
      if (!response.ok) throw new Error();
      const raw: unknown = await response.json();
      const value = growthReportHistoryResultSchema.parse(
        raw && typeof raw === 'object' && 'result' in raw ? raw.result : undefined,
      );
      if (
        value.projectId !== projectId ||
        value.environmentId !== environmentId ||
        (value.selected &&
          (value.selected.report.projectId !== projectId ||
            value.selected.report.environmentId !== environmentId))
      )
        throw new Error();
      setHistory(value);
    } catch {
      setHistory(undefined);
      setError('Saved reports could not be loaded. Check the selected account and local evidence.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 grid gap-3">
      <h3>Saved report history</h3>
      <p>Snapshots remain separate. Reports with different windows are not added together.</p>
      <Button className="justify-self-start" disabled={busy} onClick={() => void load()}>
        {busy ? 'Loading…' : 'Refresh saved reports'}
      </Button>
      {error && <p role="alert">{error}</p>}
      {history && (
        <>
          <p>
            {history.entries.length} saved reports
            {history.truncated ? ' shown; more are available' : ''}.
          </p>
          {history.entries.map((entry) => (
            <div key={entry.evidenceId} className="rounded border p-3">
              <p>
                {entry.reportType}: {entry.startDate} to {entry.endDate}
              </p>
              <p>
                {entry.storedRowCount} stored rows · captured {entry.capturedAt}
                {entry.partial ? ' · partial collection' : ''}
                {entry.rowsTruncated ? ' · rows omitted' : ''}
              </p>
              <Button disabled={busy} onClick={() => void load(entry.evidenceId)}>
                Open saved report {entry.evidenceId.slice(0, 8)}
              </Button>
            </div>
          ))}
          {history.selected && (
            <MetaReportResult result={history.selected.report} savedAt={history.selected.savedAt} />
          )}
        </>
      )}
    </div>
  );
}
