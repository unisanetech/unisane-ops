import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatDateTime, outcomeStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { advertisingView } from './view.js';

export function AdvertisingChangeHistory({ state, route }: ConsoleScreenProps) {
  const changes = advertisingView(state, route).changeHistory;
  return (
    <>
      <Summary
        headline={
          changes.length
            ? `${changes.length} recent advertising change${changes.length === 1 ? '' : 's'} are recorded.`
            : 'No advertising changes are recorded yet.'
        }
        detail="This history describes completed outcomes without exposing receipt filenames or provider internals."
      />
      <ContentSection title="Recorded changes">
        {changes.length ? (
          <div className="grid gap-3">
            {changes.map((change) => (
              <Card key={change.id} variant="outlined" padding="sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Typography variant="labelLarge">{change.title}</Typography>
                    {route.advertisingPlatform === 'all' && change.providerLabel ? (
                      <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                        {change.providerLabel}
                      </Typography>
                    ) : null}
                    <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                      {change.summary}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Badge variant="tonal" color={statusColor(change.status)} size="sm">
                      {outcomeStatusLabel(change.status)}
                    </Badge>
                    {change.timestamp ? (
                      <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                        {formatDateTime(change.timestamp)}
                      </Typography>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No change history is available."
            description="Approved advertising changes will appear here with their recorded outcome."
          />
        )}
      </ContentSection>
    </>
  );
}
