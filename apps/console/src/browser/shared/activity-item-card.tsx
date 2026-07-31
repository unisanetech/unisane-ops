import type { MarketingConsoleActivityItem } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatDateTime, humanize, statusColor } from '../lib/format.js';

export function ActivityItemCard({ item }: { item: MarketingConsoleActivityItem }) {
  return (
    <Card variant="outlined" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="tonal" color={statusColor(item.status)} size="sm">
              {humanize(item.category)}
            </Badge>
            <Typography variant="labelSmall" className="text-on-surface-variant">
              {item.providerLabel} · {item.resourceLabel}
            </Typography>
          </div>
          <Typography variant="cardTitle" className="mt-3">
            {item.title}
          </Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
            {item.summary}
          </Typography>
          {item.previousValue || item.newValue ? (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {item.previousValue ? (
                <div>
                  <dt className="text-on-surface-variant">Before</dt>
                  <dd>{item.previousValue}</dd>
                </div>
              ) : null}
              {item.newValue ? (
                <div>
                  <dt className="text-on-surface-variant">After</dt>
                  <dd>{item.newValue}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
            Actor: {item.actorLabel} · Approval: {item.approvalLabel}
          </Typography>
        </div>
        {item.occurredAt ? (
          <time dateTime={item.occurredAt}>
            <Typography component="span" variant="labelSmall" className="text-on-surface-variant">
              {formatDateTime(item.occurredAt)}
            </Typography>
          </time>
        ) : null}
      </div>
      <details className="border-outline-subtle mt-4 border-t pt-3">
        <summary className="text-primary cursor-pointer text-sm font-medium">
          View technical details
        </summary>
        <div className="mt-3 grid gap-1">
          <Typography variant="bodySmall">
            <strong>Action:</strong> {item.technical.action}
          </Typography>
          <Typography variant="bodySmall" className="break-all">
            <strong>Evidence:</strong> {item.technical.sourcePath}
          </Typography>
          {item.technical.rawTimestamp ? (
            <Typography variant="bodySmall">
              <strong>Recorded timestamp:</strong> {item.technical.rawTimestamp}
            </Typography>
          ) : null}
        </div>
      </details>
    </Card>
  );
}
