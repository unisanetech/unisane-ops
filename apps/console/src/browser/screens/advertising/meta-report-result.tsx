import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { GrowthReportReadResult } from '@unisane/growth/contracts';
export function MetaReportResult({
  result,
  savedAt,
}: {
  result: GrowthReportReadResult;
  savedAt?: string;
}) {
  return (
    <div className="mt-4 grid gap-3" aria-live="polite">
      <Typography variant="panelTitle">{result.presentation.headline}</Typography>
      <Typography variant="bodyMedium">
        Account {result.accountId} · {result.startDate} to {result.endDate} · Captured{' '}
        {result.capturedAt}
      </Typography>
      <Typography variant="bodySmall">
        {savedAt
          ? `Saved locally at ${savedAt}. Provider action types remain separate from canonical orders. Account timezone and attribution settings are unverified.`
          : result.presentation.whyItMatters}
      </Typography>
      <Typography variant="bodyMedium">
        {result.partial ? 'Collection is partial.' : 'Requested pages completed.'} Showing{' '}
        {result.rows.length} of {result.observedRowCount} observed rows.{' '}
        {result.rowsTruncated ? 'More rows were collected than shown.' : ''}
      </Typography>
      {!result.rows.length && (
        <Typography variant="bodyMedium">
          No rows were returned for this request. This does not verify tracking.
        </Typography>
      )}
      {result.rows.map((row, index) => (
        <Card key={`${row.id}-${index}`} variant="outlined" padding="md">
          <Typography variant="panelTitle">
            {row.name ?? row.id} ({row.id})
          </Typography>
          <Typography variant="bodyMedium">
            Spend: {row.spend ?? 'Unavailable'} {row.currency ?? '(currency unavailable)'} ·
            Impressions: {row.impressions ?? 'Unavailable'} · Clicks: {row.clicks ?? 'Unavailable'}
          </Typography>
          {row.actions.map((action) => (
            <Typography key={action.type} variant="bodySmall">
              {action.type}: count {action.count ?? 'unavailable'}; value{' '}
              {action.value ?? 'unavailable'} {row.currency ?? ''}
            </Typography>
          ))}
        </Card>
      ))}
    </div>
  );
}
