import { useMemo, useState } from 'react';
import type { Column } from '@unisane/data-table';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import { DataTablePrimaryText } from '../../shared/data-table-content.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { advertisingConnectionPath, advertisingView } from './view.js';
import { CampaignPauseReviewPanel, selectCampaignPauseReviews } from './campaign-pause-review.js';
import { CampaignDetailsPane } from './campaign-details-pane.js';
import {
  campaignDeliveryLabel,
  campaignDeliveryValue,
  type AdvertisingCampaign,
} from './campaign-presenters.js';

export function AdvertisingCampaigns({
  state,
  route,
  navigate,
  openSupportingPane,
}: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  const showProvider = route.advertisingPlatform === 'all';
  const [search, setSearch] = useState('');
  const [delivery, setDelivery] = useState('all');
  const [sort, setSort] = useState<CampaignSort>('spend');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
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
  const pauseReviews = selectCampaignPauseReviews(
    state.advertising.campaignPauseReviews,
    route.advertisingPlatform,
    advertising.campaigns,
  );
  const showCampaignDetails = (campaign: AdvertisingCampaign) => {
    const source = advertising.sources.find((item) => item.provider === campaign.provider);
    setSelectedCampaignId(campaign.id);
    openSupportingPane({
      id: `advertising.campaign.${campaign.id}`,
      title: campaign.name,
      subtitle: `${campaign.providerLabel} · ${campaignDeliveryLabel(campaignDeliveryValue(campaign))}`,
      content: <CampaignDetailsPane campaign={campaign} source={source} />,
      onClose: () => setSelectedCampaignId(undefined),
    });
  };
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
        detail="Compare campaign results for the selected period. Source freshness below shows whether each platform's data is current."
      />
      {pauseReviews.length ? (
        <ContentSection
          title="Campaign change reviews"
          description="Review the exact target, evidence, approval, provider receipt, and verification result. This view cannot apply changes."
        >
          <div className="grid gap-4">
            {pauseReviews.map((review) => (
              <CampaignPauseReviewPanel
                key={review.action.planHash}
                review={review}
                approvalAvailable={state.advertising.campaignPauseApprovalAvailable}
              />
            ))}
          </div>
        </ContentSection>
      ) : null}
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
          description={`${campaigns.length} of ${advertising.campaigns.length} campaigns for ${state.dateWindow.label.toLowerCase()}. Select a row to review complete campaign details.`}
        >
          <ConsoleDataTable
            tableId={`ops-advertising-${route.advertisingPlatform}-campaigns`}
            data={campaigns}
            columns={columns}
            emptyMessage="No advertising campaigns match the current filters"
            emptyIcon="campaign"
            activeRowId={selectedCampaignId}
            callbacks={{ onRowClick: showCampaignDetails }}
          />
        </ContentSection>
      ) : (
        <ContentSection>
          <DataState
            kind={advertising.campaigns.length ? 'empty' : 'stale'}
            title={
              advertising.campaigns.length
                ? 'No campaign matches these filters.'
                : 'No campaign evidence is recorded for this period.'
            }
            description={
              advertising.campaigns.length
                ? 'Clear the search or choose a different delivery state.'
                : (state.dateWindow.message ??
                  `Connect ${advertising.label === 'All advertising' ? 'an advertising platform' : advertising.label} and record campaign reports for this period before comparing performance.`)
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

type Campaign = AdvertisingCampaign;
type CampaignSort = 'spend' | 'clicks' | 'conversions' | 'name';

function compareCampaigns(left: Campaign, right: Campaign, sort: CampaignSort): number {
  if (sort === 'name') return left.name.localeCompare(right.name);
  if (sort === 'clicks') return right.clicks - left.clicks;
  if (sort === 'conversions') return right.conversions - left.conversions;
  return right.spend - left.spend;
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
