import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { advertisingConnectionPath, advertisingView } from './view.js';

export function AdvertisingConversions({ state, route, navigate }: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  const measured = advertising.conversions.filter(
    (conversion) => conversion.conversions !== undefined,
  );
  const measuredOutcomeCount = measured.reduce(
    (total, conversion) => total + (conversion.conversions ?? 0),
    0,
  );
  return (
    <>
      <Summary
        headline={
          advertising.conversions.length
            ? `${advertising.conversions.length} conversion action${advertising.conversions.length === 1 ? '' : 's'} are configured.`
            : 'No advertising conversion evidence is available.'
        }
        detail={
          measured.length
            ? `${formatNumber(measuredOutcomeCount)} outcome${measuredOutcomeCount === 1 ? '' : 's'} were reported across ${measured.length} measured action${measured.length === 1 ? '' : 's'}. Configuration and outcomes remain separate.`
            : 'The current provider evidence confirms configuration but does not include outcome counts. A configured action is not proof of a conversion.'
        }
      />
      {advertising.conversions.length && measuredOutcomeCount === 0 ? (
        <ContentSection>
          <EmptyState
            title="No paid conversion outcome is recorded."
            description="Review tracking health before increasing spend. This preserves the difference between a configured action, a measured zero, and an outcome count that was not included."
            actionLabel="Review tracking health"
            onAction={() => navigate('/analytics/tracking-health')}
          />
        </ContentSection>
      ) : null}
      {advertising.conversions.length ? (
        <ContentSection
          title="Conversion actions"
          description="Each action shows whether this report includes measured outcomes."
        >
          <CardGrid minItemWidth="md">
            {advertising.conversions.map((conversion) => (
              <Card variant="outlined" padding="sm" key={conversion.id}>
                <Typography variant="cardTitle">{conversion.name}</Typography>
                {route.advertisingPlatform === 'all' ? (
                  <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                    {conversion.providerLabel}
                  </Typography>
                ) : null}
                <dl className="mt-4 grid gap-3 text-sm">
                  <Detail
                    label="Reported outcomes"
                    value={
                      conversion.conversions === undefined
                        ? 'Not included in this report'
                        : formatNumber(conversion.conversions)
                    }
                  />
                  <Detail
                    label="Reported value"
                    value={
                      conversion.conversionValue === undefined
                        ? 'Not included in this report'
                        : formatMoney(conversion.conversionValue, conversion.currencyCode)
                    }
                  />
                  <Detail label="Measurement" value={conversion.measurementLabel} />
                </dl>
              </Card>
            ))}
          </CardGrid>
        </ContentSection>
      ) : (
        <ContentSection>
          <EmptyState
            title="No conversion actions are available."
            description="Refresh the conversion report before evaluating which paid activity produces outcomes."
            actionLabel="Review connection"
            onAction={() => navigate(advertisingConnectionPath(route.advertisingPlatform))}
          />
        </ContentSection>
      )}
      <SourceSummaries sources={advertising.sources} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
