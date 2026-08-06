import { useMemo, useState } from 'react';
import type { MarketingConsoleAdvertisingConversion } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { Badge } from '@unisane/ui/badge';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import { DataTablePrimaryText } from '../../shared/data-table-content.js';
import { formatMoney, SourceSummaries } from '../channels/shared.js';
import { advertisingConnectionPath, advertisingView } from './view.js';
import { ConversionDetailsPane } from './conversion-details-pane.js';
import { conversionMeasurementColor, conversionMeasurementLabel } from './conversion-presenters.js';

export function AdvertisingConversions({
  state,
  route,
  navigate,
  openSupportingPane,
}: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  const showProvider = route.advertisingPlatform === 'all';
  const [selectedConversionId, setSelectedConversionId] = useState<string>();
  const measured = advertising.conversions.filter(
    (conversion) => conversion.conversions !== undefined,
  );
  const measuredOutcomeCount = measured.reduce(
    (total, conversion) => total + (conversion.conversions ?? 0),
    0,
  );
  const columns = useMemo<Column<MarketingConsoleAdvertisingConversion>[]>(
    () => [
      {
        key: 'name',
        header: 'Conversion action',
        width: 320,
        minWidth: 240,
        sortable: true,
        responsivePriority: 1,
        render: (conversion) => <DataTablePrimaryText>{conversion.name}</DataTablePrimaryText>,
      },
      ...(showProvider
        ? [
            {
              key: 'providerLabel',
              header: 'Platform',
              width: 132,
              minWidth: 112,
              sortable: true,
              responsivePriority: 1 as const,
            },
          ]
        : []),
      {
        key: 'measurement',
        header: 'Measurement',
        width: 160,
        minWidth: 140,
        responsivePriority: 1,
        render: (conversion) => <ConversionStatus conversion={conversion} />,
      },
      {
        key: 'conversions',
        header: 'Reported outcomes',
        width: 156,
        minWidth: 136,
        align: 'end',
        sortable: true,
        responsivePriority: 1,
        render: (conversion) =>
          conversion.conversions === undefined
            ? 'Not included'
            : formatNumber(conversion.conversions),
      },
      {
        key: 'conversionValue',
        header: 'Reported value',
        width: 170,
        minWidth: 148,
        align: 'end',
        sortable: true,
        minVisibleWidth: 760,
        responsivePriority: 2,
        render: (conversion) =>
          conversion.conversionValue === undefined
            ? 'Not included'
            : formatMoney(conversion.conversionValue, conversion.currencyCode),
      },
    ],
    [showProvider],
  );
  const showConversionDetails = (conversion: MarketingConsoleAdvertisingConversion) => {
    const source = advertising.sources.find((item) => item.provider === conversion.provider);
    setSelectedConversionId(conversion.id);
    openSupportingPane({
      id: `advertising.conversion.${conversion.id}`,
      title: conversion.name,
      subtitle: `${conversion.providerLabel} · ${conversionMeasurementLabel(conversion)}`,
      content: <ConversionDetailsPane conversion={conversion} source={source} />,
      onClose: () => setSelectedConversionId(undefined),
    });
  };
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
          <DataState
            title="No paid conversion outcome is recorded."
            description="Tracking may be incomplete, or no paid outcome occurred. Review tracking before increasing spend."
            actionLabel="Review tracking health"
            onAction={() => navigate('/analytics/tracking-health')}
          />
        </ContentSection>
      ) : null}
      {advertising.conversions.length ? (
        <ContentSection
          title="Conversion actions"
          description="Compare configured actions with the outcomes included in this report. Select a row to review measurement and source evidence."
        >
          <ConsoleDataTable
            tableId={`ops-advertising-${route.advertisingPlatform}-conversions`}
            data={advertising.conversions}
            columns={columns}
            emptyMessage="No conversion actions were recorded"
            emptyIcon="conversion_path"
            activeRowId={selectedConversionId}
            callbacks={{ onRowClick: showConversionDetails }}
          />
        </ContentSection>
      ) : (
        <ContentSection>
          <DataState
            kind="stale"
            title="No conversion evidence is recorded for this period."
            description={
              state.dateWindow.message ??
              'Record the conversion report for this period before evaluating which paid activity produces outcomes.'
            }
            actionLabel="Review connection"
            onAction={() => navigate(advertisingConnectionPath(route.advertisingPlatform))}
          />
        </ContentSection>
      )}
      <SourceSummaries sources={advertising.sources} />
    </>
  );
}

function ConversionStatus({ conversion }: { conversion: MarketingConsoleAdvertisingConversion }) {
  return (
    <Badge variant="tonal" color={conversionMeasurementColor(conversion)} size="sm">
      {conversionMeasurementLabel(conversion)}
    </Badge>
  );
}
