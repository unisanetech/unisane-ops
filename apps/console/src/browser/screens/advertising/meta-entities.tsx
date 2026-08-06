import { useMemo, useState } from 'react';
import type {
  MarketingConsoleAdvertisingEntity,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { Badge } from '@unisane/ui/badge';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber, humanize } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import { DataTablePrimaryText, DataTableWrappedText } from '../../shared/data-table-content.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { AdvertisingEntityDetailsPane } from './entity-details-pane.js';
import { entityDeliveryColor, entityDeliveryLabel, entityTypeLabel } from './entity-presenters.js';
import { advertisingView } from './view.js';

export function MetaAdSets(props: ConsoleScreenProps) {
  const view = advertisingView(props.state, props.route);
  const entityPane = useAdvertisingEntityPane(props.openSupportingPane, view.sources[0]);
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
      emptyTitle="No Meta ad-set evidence is recorded for this period."
      emptyDescription={
        props.state.dateWindow.message ??
        'Record Meta Ads ad-set evidence for this period before comparing delivery.'
      }
      selectedEntityId={entityPane.selectedEntityId}
      onSelectEntity={entityPane.openEntity}
    />
  );
}

export function MetaAdsAndCreatives(props: ConsoleScreenProps) {
  const view = advertisingView(props.state, props.route);
  const entityPane = useAdvertisingEntityPane(props.openSupportingPane, view.sources[0]);
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
        emptyTitle="No Meta ad evidence is recorded for this period."
        emptyDescription={
          props.state.dateWindow.message ??
          'Record the Meta ad report for this period before comparing delivery.'
        }
        selectedEntityId={entityPane.selectedEntityId}
        onSelectEntity={entityPane.openEntity}
      />
      <EntitySection
        entities={view.creatives}
        title="Creatives"
        emptyTitle="No Meta creative evidence is recorded for this period."
        emptyDescription={
          props.state.dateWindow.message ??
          'Record the Meta creative report for this period before reviewing message and destination evidence.'
        }
        showCreative
        selectedEntityId={entityPane.selectedEntityId}
        onSelectEntity={entityPane.openEntity}
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
  selectedEntityId,
  onSelectEntity,
}: {
  entities: MarketingConsoleAdvertisingEntity[];
  sources: ConsoleScreenProps['state']['advertising']['combined']['sources'];
  headline: string;
  detail: string;
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  selectedEntityId?: string;
  onSelectEntity: (entity: MarketingConsoleAdvertisingEntity) => void;
}) {
  return (
    <>
      <Summary headline={headline} detail={detail} />
      <EntitySection
        entities={entities}
        title={sectionTitle}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        selectedEntityId={selectedEntityId}
        onSelectEntity={onSelectEntity}
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
  selectedEntityId,
  onSelectEntity,
}: {
  entities: MarketingConsoleAdvertisingEntity[];
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  showCreative?: boolean;
  selectedEntityId?: string;
  onSelectEntity: (entity: MarketingConsoleAdvertisingEntity) => void;
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
        width: 220,
        minWidth: 180,
        sortable: true,
        minVisibleWidth: showCreative ? 1180 : undefined,
        responsivePriority: showCreative ? 3 : 1,
        render: (entity) => entity.campaignName ?? 'Not captured',
      },
      ...(showCreative
        ? [
            {
              key: 'creativeEvidence',
              header: 'Creative evidence',
              width: 240,
              minWidth: 190,
              responsivePriority: 1 as const,
              render: (entity: MarketingConsoleAdvertisingEntity) => (
                <DataTableWrappedText>
                  {entity.assetType
                    ? humanize(entity.assetType.toLowerCase())
                    : (entity.headline ?? 'Not captured')}
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
        render: (entity) => (
          <Badge variant="tonal" color={entityDeliveryColor(entity.deliveryStatus)} size="sm">
            {entityDeliveryLabel(entity.deliveryStatus)}
          </Badge>
        ),
      },
      entityMetric('spend', 'Spend', (entity) => formatMoney(entity.spend, entity.currencyCode)),
      entityMetric(
        'impressions',
        'Impressions',
        (entity) => formatNumber(entity.impressions),
        showCreative ? 1180 : 940,
        2,
      ),
      entityMetric(
        'clicks',
        'Clicks',
        (entity) => formatNumber(entity.clicks),
        showCreative ? 1320 : 1080,
        3,
      ),
      entityMetric(
        'conversions',
        'Conversions',
        (entity) => formatNumber(entity.conversions),
        1220,
        4,
      ),
    ],
    [showCreative],
  );
  return (
    <ContentSection
      title={title}
      description={
        entities.length
          ? `Select a row to review complete ${entitySectionItemLabel(title)} details.`
          : undefined
      }
    >
      {entities.length ? (
        <ConsoleDataTable
          tableId={`ops-meta-${title.toLowerCase().replaceAll(' ', '-')}`}
          data={entities}
          columns={columns}
          emptyMessage={`No ${title.toLowerCase()} were recorded`}
          emptyIcon="ads_click"
          activeRowId={selectedEntityId}
          callbacks={{ onRowClick: onSelectEntity }}
        />
      ) : (
        <DataState title={emptyTitle} description={emptyDescription} />
      )}
    </ContentSection>
  );
}

function entitySectionItemLabel(title: string): string {
  if (title === 'Ad-set performance') return 'ad-set';
  if (title === 'Ads') return 'ad';
  if (title === 'Creatives') return 'creative';
  return title.toLowerCase();
}

function useAdvertisingEntityPane(
  openSupportingPane: ConsoleScreenProps['openSupportingPane'],
  source: MarketingConsoleSourceSummary | undefined,
) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  const openEntity = (entity: MarketingConsoleAdvertisingEntity) => {
    setSelectedEntityId(entity.id);
    openSupportingPane({
      id: `advertising.entity.${entity.id}`,
      title: entity.name,
      subtitle: `${entityTypeLabel(entity)} · ${entityDeliveryLabel(entity.deliveryStatus)}`,
      content: <AdvertisingEntityDetailsPane entity={entity} source={source} />,
      onClose: () => setSelectedEntityId(undefined),
    });
  };
  return { selectedEntityId, openEntity };
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
