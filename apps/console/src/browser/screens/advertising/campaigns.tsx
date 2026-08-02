import { useMemo, useState } from 'react';
import type { Column } from '@unisane/data-table';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';
import {
  DataTablePrimaryText,
  ExpandedDataSection,
  ExpandedDataTableRow,
} from '../../shared/data-table-content.js';
import { NarrativeDataTable } from '../../shared/narrative-data-table.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { advertisingConnectionPath, advertisingView } from './view.js';

export function AdvertisingCampaigns({ state, route, navigate }: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  const showProvider = route.advertisingPlatform === 'all';
  const [search, setSearch] = useState('');
  const [delivery, setDelivery] = useState('all');
  const [sort, setSort] = useState<CampaignSort>('spend');
  const deliveryOptions = useMemo(
    () =>
      [...new Set(advertising.campaigns.map((campaign) => campaignDeliveryValue(campaign)))].sort(),
    [advertising.campaigns],
  );
  const campaigns = useMemo(
    () =>
      advertising.campaigns
        .filter(
          (campaign) =>
            (delivery === 'all' || campaignDeliveryValue(campaign) === delivery) &&
            campaign.name.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((left, right) => compareCampaigns(left, right, sort)),
    [advertising.campaigns, delivery, search, sort],
  );
  const columns = useMemo<Column<Campaign>[]>(
    () => [
      {
        key: 'name',
        header: 'Campaign',
        width: 300,
        minWidth: 220,
        sortable: true,
        responsivePriority: 1,
        render: (campaign) => <DataTablePrimaryText>{campaign.name}</DataTablePrimaryText>,
      },
      ...(showProvider
        ? [
            {
              key: 'providerLabel',
              header: 'Platform',
              width: 124,
              minWidth: 112,
              sortable: true,
              responsivePriority: 1 as const,
            },
          ]
        : []),
      {
        key: 'deliveryStatus',
        header: 'Delivery',
        width: 142,
        minWidth: 124,
        sortable: true,
        responsivePriority: 1,
        render: (campaign) => campaignDeliveryLabel(campaignDeliveryValue(campaign)),
      },
      campaignMetric('spend', 'Spend', (campaign) =>
        formatMoney(campaign.spend, campaign.currencyCode),
      ),
      campaignMetric('impressions', 'Impressions', (campaign) =>
        formatNumber(campaign.impressions),
      ),
      campaignMetric('clicks', 'Clicks', (campaign) => formatNumber(campaign.clicks)),
      campaignMetric(
        'conversions',
        'Conversions',
        (campaign) => formatNumber(campaign.conversions),
        650,
        2,
      ),
      campaignMetric(
        'ctr',
        'CTR',
        (campaign) =>
          campaign.ctr === undefined ? 'Not available' : `${campaign.ctr.toFixed(1)}%`,
        820,
        3,
      ),
    ],
    [showProvider],
  );
  return (
    <>
      <Summary
        headline={advertising.headline}
        detail="Campaign rows retain the provider-reported zeroes while freshness explains whether they are current or historical."
      />
      {advertising.campaigns.length ? (
        <ContentSection>
          <FilterToolbar
            resultCount={campaigns.length}
            totalCount={advertising.campaigns.length}
            resultLabel="campaigns"
            isFiltered={Boolean(search.trim()) || delivery !== 'all'}
            onClear={() => {
              setSearch('');
              setDelivery('all');
            }}
          >
            <TextField
              label="Search campaigns"
              placeholder="Search campaign name"
              value={search}
              onValueChange={setSearch}
            />
            <SelectField
              label="Delivery"
              value={delivery}
              onValueChange={setDelivery}
              options={[
                { value: 'all', label: 'All delivery states' },
                ...deliveryOptions.map((value) => ({
                  value,
                  label: campaignDeliveryLabel(value),
                })),
              ]}
            />
            <SelectField
              label="Sort by"
              value={sort}
              onValueChange={(value) => setSort(value as CampaignSort)}
              options={[
                { value: 'spend', label: 'Spend' },
                { value: 'clicks', label: 'Clicks' },
                { value: 'conversions', label: 'Conversions' },
                { value: 'name', label: 'Campaign name' },
              ]}
            />
          </FilterToolbar>
        </ContentSection>
      ) : null}
      {campaigns.length ? (
        <ContentSection
          title="Campaign performance"
          description={`${campaigns.length} of ${advertising.campaigns.length} campaigns for ${state.dateWindow.label.toLowerCase()}.`}
        >
          <NarrativeDataTable
            tableId={`ops-advertising-${route.advertisingPlatform}-campaigns`}
            data={campaigns}
            columns={columns}
            emptyMessage="No advertising campaigns match the current filters"
            emptyIcon="campaign"
            renderExpandedRow={(campaign) => (
              <ExpandedDataTableRow
                title={campaign.name}
                description={`${campaign.providerLabel} · Complete delivery and bidding evidence.`}
              >
                <ExpandedDataSection title="Delivery context">
                  <CampaignDelivery campaign={campaign} />
                </ExpandedDataSection>
                <ExpandedDataSection title="Budget and cost">
                  <p>
                    Daily budget:{' '}
                    {campaign.dailyBudget === undefined
                      ? 'Not captured'
                      : `${formatMoney(campaign.dailyBudget, campaign.currencyCode)}${campaign.sharedBudget ? ' · Shared' : ''}`}
                  </p>
                  <p className="mt-2">
                    Average CPC:{' '}
                    {campaign.cpc === undefined
                      ? 'Not available'
                      : formatMoney(campaign.cpc, campaign.currencyCode)}
                  </p>
                </ExpandedDataSection>
                <ExpandedDataSection title="Bidding">
                  <p>
                    {campaign.biddingStrategy
                      ? campaignCodeLabel(campaign.biddingStrategy)
                      : 'Not captured'}
                  </p>
                  {campaign.biddingStrategyStatus ? (
                    <p className="mt-2">
                      Status: {campaignCodeLabel(campaign.biddingStrategyStatus)}
                    </p>
                  ) : null}
                </ExpandedDataSection>
              </ExpandedDataTableRow>
            )}
          />
        </ContentSection>
      ) : (
        <ContentSection>
          <DataState
            kind={advertising.campaigns.length ? 'empty' : 'stale'}
            title={
              advertising.campaigns.length
                ? 'No campaign matches these filters.'
                : 'No campaign rows are available.'
            }
            description={
              advertising.campaigns.length
                ? 'Clear the search or choose a different delivery state.'
                : `Connect ${advertising.label === 'All advertising' ? 'an advertising platform' : advertising.label} and refresh campaign reports before comparing performance.`
            }
            {...(!advertising.campaigns.length
              ? {
                  actionLabel: 'Review connection',
                  onAction: () => navigate(advertisingConnectionPath(route.advertisingPlatform)),
                }
              : {})}
          />
        </ContentSection>
      )}
      <SourceSummaries sources={advertising.sources} />
    </>
  );
}

type Campaign = ConsoleScreenProps['state']['advertising']['combined']['campaigns'][number];
type CampaignSort = 'spend' | 'clicks' | 'conversions' | 'name';

function campaignDeliveryValue(campaign: Campaign): string {
  return campaign.deliveryStatus ?? campaign.primaryStatus ?? campaign.servingStatus ?? 'unknown';
}

function campaignCodeLabel(value: string): string {
  const label = value.toLowerCase().replace(/[-_.]+/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function campaignDeliveryLabel(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'ENABLED' || normalized === 'ELIGIBLE') {
    return 'Active';
  }
  if (normalized === 'PAUSED') return 'Paused';
  if (normalized === 'SERVING') return 'Serving';
  if (normalized === 'NOT_SERVING') return 'Not serving';
  if (normalized === 'LIMITED') return 'Limited';
  if (normalized === 'REMOVED') return 'Removed';
  if (normalized === 'ENDED') return 'Ended';
  if (normalized === 'PENDING') return 'Scheduled';
  if (normalized === 'UNKNOWN') return 'Status unavailable';
  return campaignCodeLabel(value);
}

function campaignReasonLabel(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'HAS_ADS_DISAPPROVED') return 'Some ads are disapproved';
  if (normalized === 'BUDGET_CONSTRAINED' || normalized === 'LIMITED_BY_BUDGET') {
    return 'Limited by budget';
  }
  const label = campaignCodeLabel(value).replace(/^Campaign /, '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function campaignDeliveryDetail(campaign: Campaign): string {
  const delivery = campaignDeliveryValue(campaign).toUpperCase();
  const supportingStates = [campaign.primaryStatus, campaign.servingStatus]
    .filter((value): value is string => Boolean(value))
    .filter((value) => value.toUpperCase() !== delivery && value.toUpperCase() !== 'UNKNOWN')
    .filter(
      (value) =>
        !(
          delivery === 'PAUSED' && ['SERVING', 'ENABLED', 'ELIGIBLE'].includes(value.toUpperCase())
        ),
    )
    .map(campaignDeliveryLabel);
  const reasons = campaign.primaryStatusReasons
    .filter((reason) => reason.toUpperCase() !== 'UNKNOWN')
    .filter((reason) => !(delivery === 'PAUSED' && reason.toUpperCase() === 'CAMPAIGN_PAUSED'))
    .map(campaignReasonLabel);
  const deliveryContext =
    delivery === 'PAUSED' ? ['Not serving until the campaign is enabled'] : [];
  const details = [...new Set([...deliveryContext, ...supportingStates, ...reasons])];
  if (details.length) return details.join(' · ');
  if (delivery === 'ACTIVE' || delivery === 'ENABLED' || delivery === 'ELIGIBLE') {
    return 'Available to serve';
  }
  if (delivery === 'REMOVED') return 'No longer available for delivery';
  return `${campaign.providerLabel} did not report an additional delivery reason`;
}

function compareCampaigns(left: Campaign, right: Campaign, sort: CampaignSort): number {
  if (sort === 'name') return left.name.localeCompare(right.name);
  if (sort === 'clicks') return right.clicks - left.clicks;
  if (sort === 'conversions') return right.conversions - left.conversions;
  return right.spend - left.spend;
}

function CampaignDelivery({ campaign }: { campaign: Campaign }) {
  if (!campaign.deliveryStatus && !campaign.primaryStatus && !campaign.servingStatus) {
    return (
      <div className="grid gap-1">
        <Typography variant="labelMedium">Not captured</Typography>
        <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
          Refresh campaign data
        </Typography>
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      <Typography variant="labelMedium">
        {campaignDeliveryLabel(campaignDeliveryValue(campaign))}
      </Typography>
      <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
        {campaignDeliveryDetail(campaign)}
      </Typography>
    </div>
  );
}

function campaignMetric(
  key: string,
  header: string,
  render: (campaign: Campaign) => string,
  minVisibleWidth?: number,
  responsivePriority: 1 | 2 | 3 | 4 | 5 = 1,
): Column<Campaign> {
  return {
    key,
    header,
    width: 126,
    minWidth: 110,
    align: 'end',
    sortable: true,
    minVisibleWidth,
    responsivePriority,
    render,
  };
}
