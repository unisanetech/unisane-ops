import type {
  MarketingConsoleAdvertisingEntity,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Typography } from '@unisane/ui/typography';
import { formatNumber, humanize } from '../../lib/format.js';
import { formatMoney, formatPercent } from '../channels/shared.js';
import {
  AdvertisingDetailFact,
  AdvertisingDetailMetric,
  AdvertisingDetailSection,
  AdvertisingPerformanceFunnel,
  AdvertisingSourceEvidence,
} from './detail-pane-primitives.js';
import { entityDeliveryColor, entityDeliveryLabel, entityTypeLabel } from './entity-presenters.js';

export function AdvertisingEntityDetailsPane({
  entity,
  source,
}: {
  entity: MarketingConsoleAdvertisingEntity;
  source?: MarketingConsoleSourceSummary;
}) {
  return (
    <section
      className="ops-advertising-detail-pane flex h-full min-h-0 flex-col"
      aria-label={`${entityTypeLabel(entity)} details`}
    >
      <div className="ops-advertising-detail-pane__body min-h-0 flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="tonal" color={entityDeliveryColor(entity.deliveryStatus)} size="sm">
              {entityDeliveryLabel(entity.deliveryStatus)}
            </Badge>
            <Badge variant="tonal" color="secondary" size="sm">
              {entityTypeLabel(entity)}
            </Badge>
            {entity.assetType ? (
              <Badge variant="tonal" color="secondary" size="sm">
                {humanize(entity.assetType.toLowerCase())}
              </Badge>
            ) : null}
          </div>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-3">
            Review the recorded delivery, performance, and provider evidence without leaving the
            console.
          </Typography>
        </div>

        <AdvertisingDetailSection title="Performance">
          <div className="ops-advertising-detail-pane__metrics">
            <AdvertisingDetailMetric
              label="Spend"
              value={formatMoney(entity.spend, entity.currencyCode)}
            />
            <AdvertisingDetailMetric label="Impressions" value={formatNumber(entity.impressions)} />
            <AdvertisingDetailMetric label="Clicks" value={formatNumber(entity.clicks)} />
            <AdvertisingDetailMetric label="Conversions" value={formatNumber(entity.conversions)} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <AdvertisingDetailFact label="Click-through rate" value={formatPercent(entity.ctr)} />
            <AdvertisingDetailFact
              label="Average click cost"
              value={
                entity.cpc === undefined
                  ? 'Not available'
                  : formatMoney(entity.cpc, entity.currencyCode)
              }
            />
            <AdvertisingDetailFact
              label="Cost per conversion"
              value={
                entity.cpa === undefined
                  ? 'Not available'
                  : formatMoney(entity.cpa, entity.currencyCode)
              }
            />
            <AdvertisingDetailFact
              label="Return on ad spend"
              value={entity.roas === undefined ? 'Not available' : `${entity.roas.toFixed(2)}×`}
            />
            <AdvertisingDetailFact
              label="Conversion value"
              value={formatMoney(entity.conversionValue, entity.currencyCode)}
            />
          </dl>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection
          title="Current-period funnel"
          description="This shows movement within the selected report, not change over time."
        >
          <AdvertisingPerformanceFunnel
            impressions={entity.impressions}
            clicks={entity.clicks}
            conversions={entity.conversions}
          />
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Placement context">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <AdvertisingDetailFact label="Campaign" value={entity.campaignName ?? 'Not captured'} />
            <AdvertisingDetailFact label="Ad set" value={entity.adSetName ?? 'Not captured'} />
          </dl>
        </AdvertisingDetailSection>

        {entity.level !== 'adSet' ? (
          <AdvertisingDetailSection title="Creative evidence">
            <dl className="grid gap-4">
              <AdvertisingDetailFact label="Headline" value={entity.headline ?? 'Not captured'} />
              <AdvertisingDetailFact label="Message" value={entity.body ?? 'Not captured'} />
              <AdvertisingDetailFact
                label="Destination"
                value={
                  entity.destinationUrl ? (
                    <span className="break-all">{entity.destinationUrl}</span>
                  ) : (
                    'Not captured'
                  )
                }
              />
            </dl>
          </AdvertisingDetailSection>
        ) : null}

        <AdvertisingDetailSection title="Reporting context">
          <AdvertisingSourceEvidence
            source={source}
            fallbackLabel={entity.providerLabel}
            fallbackDetail="Values come from the selected Meta advertising report."
          />
        </AdvertisingDetailSection>
      </div>
    </section>
  );
}
