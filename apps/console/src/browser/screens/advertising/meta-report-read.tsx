import { MetaReportResult } from './meta-report-result.js';
import { growthReportEvidenceSchema } from '@unisane/growth/contracts';
import { MetaReportHistory } from './meta-report-history.js';
import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import { Typography } from '@unisane/ui/typography';
import {
  growthReportReadOutputSchema,
  type GrowthReportReadResult,
} from '@unisane/growth/contracts';
import { ContentSection } from '../../shared/content.js';

export function MetaReportRead({
  available,
  evidenceAvailable = false,
  projectId,
  environmentId,
}: {
  available: boolean;
  evidenceAvailable?: boolean;
  projectId: string;
  environmentId: string;
}) {
  const [result, setResult] = useState<GrowthReportReadResult>();
  const [savedAt, setSavedAt] = useState<string>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setResult(undefined);
    setSavedAt(undefined);
    const save = evidenceAvailable && form.get('save') === 'on';
    try {
      const response = await fetch(
        save ? '/api/console/meta/report/collect' : '/api/console/meta/report',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: form.get('startDate'),
            endDate: form.get('endDate'),
            reportType: form.get('reportType'),
          }),
        },
      );
      if (!response.ok)
        throw new Error('Report reading failed. Check connection access and dates, then retry.');
      const payload: unknown = await response.json();
      const raw =
        payload && typeof payload === 'object' && 'result' in payload ? payload.result : undefined;
      const evidence = save ? growthReportEvidenceSchema.parse(raw) : undefined;
      const value = growthReportReadOutputSchema.parse(evidence?.report ?? raw);
      setSavedAt(evidence?.savedAt);
      if (value.projectId !== projectId || value.environmentId !== environmentId)
        throw new Error('Report target mismatch.');
      setResult(value);
    } catch {
      setError('Report reading failed. Check connection access and dates, then retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <ContentSection
      title="Read a Meta report"
      description="Read the selected account without changing ads. Choose Save to retain the returned snapshot locally."
    >
      {!available ? (
        <Typography variant="bodyMedium">
          This console host has not supplied report reading.
        </Typography>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
          <label>
            Start date
            <input
              className="block rounded border p-2"
              name="startDate"
              type="date"
              required
              disabled={busy}
            />
          </label>
          <label>
            End date
            <input
              className="block rounded border p-2"
              name="endDate"
              type="date"
              required
              disabled={busy}
            />
          </label>
          <label>
            Report
            <select className="block rounded border p-2" name="reportType" disabled={busy}>
              <option value="campaign">Campaigns</option>
              <option value="account">Account</option>
              <option value="adSet">Ad sets</option>
              <option value="ad">Ads</option>
            </select>
          </label>
          {evidenceAvailable && (
            <label>
              <input type="checkbox" name="save" disabled={busy} /> Save report to history
            </label>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'Reading…' : 'Read report'}
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {result && <MetaReportResult result={result} savedAt={savedAt} />}
      {evidenceAvailable && (
        <MetaReportHistory projectId={projectId} environmentId={environmentId} />
      )}
    </ContentSection>
  );
}
