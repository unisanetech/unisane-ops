import { useMemo } from 'react';
import type { MarketingConsoleAnalyticsRow } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { formatNumber } from '../../lib/format.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import { DataTablePrimaryText } from '../../shared/data-table-content.js';
import { formatMoney } from '../channels/shared.js';

export function AnalyticsDataTable({
  rows,
  firstColumn,
}: {
  rows: MarketingConsoleAnalyticsRow[];
  firstColumn: string;
}) {
  const columns = useMemo<Column<MarketingConsoleAnalyticsRow>[]>(
    () => [
      {
        key: 'label',
        header: firstColumn,
        width: 340,
        minWidth: 240,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.label}</DataTablePrimaryText>,
      },
      optionalMetric('sessions', 'Sessions', (row) => row.sessions),
      optionalMetric('visitors', 'Visitors', (row) => row.visitors),
      optionalMetric('conversions', 'Conversions', (row) => row.conversions, 600, 2),
      {
        key: 'revenue',
        header: 'Revenue',
        width: 150,
        minWidth: 132,
        align: 'end',
        sortable: true,
        minVisibleWidth: 760,
        responsivePriority: 3,
        render: (row) =>
          row.revenue === undefined ? 'Not available' : formatMoney(row.revenue, row.currencyCode),
      },
    ],
    [firstColumn],
  );
  return (
    <ConsoleDataTable
      tableId={`ops-analytics-${firstColumn.toLowerCase().replaceAll(' ', '-')}`}
      data={rows}
      columns={columns}
      emptyMessage="No analytics rows were recorded"
      emptyIcon="analytics"
    />
  );
}

function optionalMetric(
  key: string,
  header: string,
  value: (row: MarketingConsoleAnalyticsRow) => number | undefined,
  minVisibleWidth?: number,
  responsivePriority: 1 | 2 | 3 | 4 | 5 = 1,
): Column<MarketingConsoleAnalyticsRow> {
  return {
    key,
    header,
    width: 132,
    minWidth: 116,
    align: 'end',
    sortable: true,
    minVisibleWidth,
    responsivePriority,
    render: (row) => {
      const result = value(row);
      return result === undefined ? 'Not available' : formatNumber(result);
    },
  };
}
