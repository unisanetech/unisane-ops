import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatDateTime, outcomeStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { advertisingView } from './view.js';

export function AdvertisingChangeHistory({ state, route }: ConsoleScreenProps) {
  const changes = advertisingView(state, route).changeHistory;
  if (!changes.length) {
    return (
      <ContentSection>
        <DataState
          title="No advertising changes were recorded in this period."
          description="Choose another reporting period. Future approved changes will appear with when they happened and whether the result was verified."
        />
      </ContentSection>
    );
  }
  return (
    <>
      <Summary
        headline={`${changes.length} recent advertising change${changes.length === 1 ? '' : 's'} ${changes.length === 1 ? 'is' : 'are'} recorded.`}
        detail="Review completed advertising changes and whether each result was verified."
      />
      <ContentSection title="Recorded changes">
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
      </ContentSection>
    </>
  );
}
