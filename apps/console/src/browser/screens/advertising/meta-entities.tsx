import type { MarketingConsoleAdvertisingEntity } from '@unisane/growth/console';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unisane/ui/table';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { TableFrame } from '../../shared/controls.js';
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
  return (
    <ContentSection title={title}>
      {entities.length ? (
        <TableFrame label={title}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Campaign</TableHead>
                {showCreative ? <TableHead>Creative evidence</TableHead> : null}
                <TableHead>Delivery</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Conversions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell>{entity.name}</TableCell>
                  <TableCell>{entity.campaignName ?? 'Not captured'}</TableCell>
                  {showCreative ? (
                    <TableCell>{entity.assetType ?? entity.headline ?? 'Not captured'}</TableCell>
                  ) : null}
                  <TableCell>{entity.deliveryStatus ?? 'Not captured'}</TableCell>
                  <TableCell>{formatMoney(entity.spend, entity.currencyCode)}</TableCell>
                  <TableCell>{formatNumber(entity.impressions)}</TableCell>
                  <TableCell>{formatNumber(entity.clicks)}</TableCell>
                  <TableCell>{formatNumber(entity.conversions)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </ContentSection>
  );
}
