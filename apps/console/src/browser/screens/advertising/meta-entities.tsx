import { useMemo } from 'react';
import type { MarketingConsoleAdvertisingEntity } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import { DataTablePrimaryText, DataTableWrappedText } from '../../shared/data-table-content.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { advertisingView } from './view.js';

export function MetaAdSets(props: ConsoleScreenProps) {
  const view = advertisingView(props.state, props.route);
  return (
    <EntityPage
      entities={view.adSets}
      sources={view.sources}
      headline={
        view.adSets.length
          ? `${view.adSets.length} Meta ad set${view.adSets.length === 1 ? ' is' : 's are'} available to compare.`
          : 'No Meta ad-set evidence is available.'
      }
      detail="Ad-set evidence connects audience-level delivery and spend to the campaigns above it."
      sectionTitle="Ad-set performance"
      emptyTitle="No Meta ad sets are available."
      emptyDescription="Connect Meta Ads or load explicitly labelled sample evidence before comparing ad sets."
    />
  );
}

export function MetaAdsAndCreatives(props: ConsoleScreenProps) {
  const view = advertisingView(props.state, props.route);
  return (
    <>
      <Summary
        headline={
          view.ads.length || view.creatives.length
            ? `${view.ads.length} ad${view.ads.length === 1 ? '' : 's'} and ${view.creatives.length} creative${view.creatives.length === 1 ? '' : 's'} are available.`
            : 'No Meta ad or creative evidence is available.'
        }
        detail="Delivery evidence and creative content stay separate so performance does not hide what people actually saw."
      />
      <EntitySection
        entities={view.ads}
        title="Ads"
        emptyTitle="No Meta ads are available."
        emptyDescription="Refresh the Meta ad report before comparing delivery."
      />
      <EntitySection
        entities={view.creatives}
        title="Creatives"
        emptyTitle="No Meta creatives are available."
        emptyDescription="Refresh the Meta creative report before reviewing message and destination evidence."
        showCreative
      />
      <SourceSummaries sources={view.sources} />
    </>
  );
}

function EntityPage({
  entities,
  sources,
  headline,
  detail,
  sectionTitle,
  emptyTitle,
  emptyDescription,
}: {
  entities: MarketingConsoleAdvertisingEntity[];
  sources: ConsoleScreenProps['state']['advertising']['combined']['sources'];
  headline: string;
  detail: string;
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <>
      <Summary headline={headline} detail={detail} />
      <EntitySection
        entities={entities}
        title={sectionTitle}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <SourceSummaries sources={sources} />
    </>
  );
}

function EntitySection({
  entities,
  title,
  emptyTitle,
  emptyDescription,
  showCreative = false,
}: {
  entities: MarketingConsoleAdvertisingEntity[];
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  showCreative?: boolean;
}) {
  const columns = useMemo<Column<MarketingConsoleAdvertisingEntity>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: 280,
        minWidth: 220,
        sortable: true,
        responsivePriority: 1,
        render: (entity) => <DataTablePrimaryText>{entity.name}</DataTablePrimaryText>,
      },
      {
        key: 'campaignName',
        header: 'Campaign',
        width: 240,
        minWidth: 190,
        sortable: true,
        responsivePriority: 1,
        render: (entity) => entity.campaignName ?? 'Not captured',
      },
      ...(showCreative
        ? [
            {
              key: 'creativeEvidence',
              header: 'Creative evidence',
              width: 280,
              minWidth: 220,
              minVisibleWidth: 820,
              responsivePriority: 4 as const,
              render: (entity: MarketingConsoleAdvertisingEntity) => (
                <DataTableWrappedText>
                  {entity.assetType ?? entity.headline ?? 'Not captured'}
                </DataTableWrappedText>
              ),
            },
          ]
        : []),
      {
        key: 'deliveryStatus',
        header: 'Delivery',
        width: 132,
        minWidth: 116,
        sortable: true,
        responsivePriority: 1,
        render: (entity) => entity.deliveryStatus ?? 'Not captured',
      },
      entityMetric('spend', 'Spend', (entity) => formatMoney(entity.spend, entity.currencyCode)),
      entityMetric('impressions', 'Impressions', (entity) => formatNumber(entity.impressions)),
      entityMetric('clicks', 'Clicks', (entity) => formatNumber(entity.clicks), 650, 2),
      entityMetric(
        'conversions',
        'Conversions',
        (entity) => formatNumber(entity.conversions),
        760,
        3,
      ),
    ],
    [showCreative],
  );
  return (
    <ContentSection title={title}>
      {entities.length ? (
        <ConsoleDataTable
          tableId={`ops-meta-${title.toLowerCase().replaceAll(' ', '-')}`}
          data={entities}
          columns={columns}
          emptyMessage={`No ${title.toLowerCase()} were recorded`}
          emptyIcon="ads_click"
        />
      ) : (
        <DataState title={emptyTitle} description={emptyDescription} />
      )}
    </ContentSection>
  );
}

function entityMetric(
  key: string,
  header: string,
  render: (entity: MarketingConsoleAdvertisingEntity) => string,
  minVisibleWidth?: number,
  responsivePriority: 1 | 2 | 3 | 4 | 5 = 1,
): Column<MarketingConsoleAdvertisingEntity> {
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
