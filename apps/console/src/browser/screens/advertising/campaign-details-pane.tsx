import type { MarketingConsoleSourceSummary } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Typography } from '@unisane/ui/typography';
import { formatNumber, humanize } from '../../lib/format.js';
import { formatMoney, formatPercent } from '../channels/shared.js';
import {
  campaignCodeLabel,
  campaignDeliveryColor,
  campaignDeliveryDetail,
  campaignDeliveryLabel,
  campaignDeliveryValue,
  type AdvertisingCampaign,
} from './campaign-presenters.js';
import {
  AdvertisingDetailFact,
  AdvertisingDetailMetric,
  AdvertisingDetailSection,
  AdvertisingPerformanceFunnel,
  AdvertisingSourceEvidence,
} from './detail-pane-primitives.js';

function formatCampaignDate(value: string | undefined): string {
  if (!value) return 'Not captured';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function CampaignDetailsPane({
  campaign,
  source,
}: {
  campaign: AdvertisingCampaign;
  source?: MarketingConsoleSourceSummary;
}) {
  const delivery = campaignDeliveryValue(campaign);
  return (
    <section
      className="ops-advertising-detail-pane flex h-full min-h-0 flex-col"
      aria-label="Campaign details"
    >
      <div className="ops-advertising-detail-pane__body min-h-0 flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="tonal" color={campaignDeliveryColor(campaign)} size="sm">
              {campaignDeliveryLabel(delivery)}
            </Badge>
            {campaign.channelType ? (
              <Badge variant="tonal" color="secondary" size="sm">
                {humanize(campaign.channelType)}
              </Badge>
            ) : null}
          </div>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-3">
            {campaignDeliveryDetail(campaign)}
          </Typography>
        </div>

        <AdvertisingDetailSection title="Performance">
          <div className="ops-advertising-detail-pane__metrics">
            <AdvertisingDetailMetric
              label="Spend"
              value={formatMoney(campaign.spend, campaign.currencyCode)}
            />
            <AdvertisingDetailMetric
              label="Impressions"
              value={formatNumber(campaign.impressions)}
            />
            <AdvertisingDetailMetric label="Clicks" value={formatNumber(campaign.clicks)} />
            <AdvertisingDetailMetric
              label="Conversions"
              value={formatNumber(campaign.conversions)}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <AdvertisingDetailFact label="Click-through rate" value={formatPercent(campaign.ctr)} />
            <AdvertisingDetailFact
              label="Average click cost"
              value={
                campaign.cpc === undefined
                  ? 'Not available'
                  : formatMoney(campaign.cpc, campaign.currencyCode)
              }
            />
            <AdvertisingDetailFact
              label="Cost per conversion"
              value={
                campaign.cpa === undefined
                  ? 'Not available'
                  : formatMoney(campaign.cpa, campaign.currencyCode)
              }
            />
            <AdvertisingDetailFact
              label="Return on ad spend"
              value={campaign.roas === undefined ? 'Not available' : `${campaign.roas.toFixed(2)}×`}
            />
            <AdvertisingDetailFact
              label="Conversion value"
              value={formatMoney(campaign.conversionValue, campaign.currencyCode)}
            />
          </dl>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection
          title="Current-period funnel"
          description="This shows movement within the selected report, not change over time."
        >
          <AdvertisingPerformanceFunnel
            impressions={campaign.impressions}
            clicks={campaign.clicks}
            conversions={campaign.conversions}
          />
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Budget and bidding">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <AdvertisingDetailFact
              label="Daily budget"
              value={
                campaign.dailyBudget === undefined
                  ? 'Not captured'
                  : formatMoney(campaign.dailyBudget, campaign.currencyCode)
              }
            />
            <AdvertisingDetailFact
              label="Budget type"
              value={campaign.sharedBudget ? 'Shared budget' : 'Campaign budget'}
            />
            <AdvertisingDetailFact
              label="Bidding strategy"
              value={
                campaign.biddingStrategy
                  ? campaignCodeLabel(campaign.biddingStrategy)
                  : 'Not captured'
              }
            />
            <AdvertisingDetailFact
              label="Bidding status"
              value={
                campaign.biddingStrategyStatus
                  ? campaignCodeLabel(campaign.biddingStrategyStatus)
                  : 'Not captured'
              }
            />
          </dl>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Schedule">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <AdvertisingDetailFact label="Started" value={formatCampaignDate(campaign.startDate)} />
            <AdvertisingDetailFact label="Ends" value={formatCampaignDate(campaign.endDate)} />
          </dl>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Reporting context">
          <AdvertisingSourceEvidence
            source={source}
            fallbackLabel={campaign.providerLabel}
            fallbackDetail="Campaign values come from the selected provider report."
          />
        </AdvertisingDetailSection>
      </div>
    </section>
  );
}
