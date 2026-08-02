import { useMemo } from 'react';
import type { MarketingConsoleSeoPage, MarketingConsoleSeoQuery } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { Badge } from '@unisane/ui/badge';
import { Typography } from '@unisane/ui/typography';
import { formatNumber } from '../../lib/format.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';

export function SeoPagesDataTable({ pages }: { pages: MarketingConsoleSeoPage[] }) {
  const columns = useMemo<Column<MarketingConsoleSeoPage>[]>(
    () => [
      {
        key: 'title',
        header: 'Page',
        width: 340,
        minWidth: 240,
        sortable: true,
        responsivePriority: 1,
        render: (page) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Typography variant="labelLarge" className="font-medium">
              {page.title}
            </Typography>
            <Typography variant="labelSmall" className="text-on-surface-variant truncate">
              {page.path}
            </Typography>
          </div>
        ),
        printValue: (page) => `${page.title} (${page.path})`,
      },
      metricColumn<MarketingConsoleSeoPage>('clicks', 'Clicks', (page) => page.clicks),
      metricColumn<MarketingConsoleSeoPage>(
        'searchViews',
        'Search views',
        (page) => page.searchViews,
      ),
      {
        key: 'clickThroughRate',
        header: 'CTR',
        width: 100,
        minWidth: 88,
        align: 'end',
        sortable: true,
        minVisibleWidth: 520,
        responsivePriority: 2,
        render: (page) =>
          page.clickThroughRate === undefined ? 'Not available' : `${page.clickThroughRate}%`,
      },
      {
        key: 'averagePosition',
        header: 'Avg. position',
        width: 132,
        minWidth: 116,
        align: 'end',
        sortable: true,
        minVisibleWidth: 660,
        responsivePriority: 3,
        render: (page) => page.averagePosition ?? 'Not available',
      },
      {
        key: 'status',
        header: 'Status',
        width: 136,
        minWidth: 120,
        sortable: true,
        responsivePriority: 1,
        render: (page) => (
          <Badge
            variant="tonal"
            color={page.status === 'Not indexed' ? 'error' : 'warning'}
            size="sm"
          >
            {page.status}
          </Badge>
        ),
        printValue: (page) => page.status,
      },
    ],
    [],
  );
  return (
    <ConsoleDataTable
      tableId="ops-seo-pages"
      data={pages}
      columns={columns}
      emptyMessage="No search pages match the current filters"
      emptyIcon="web"
    />
  );
}

export function SeoQueriesDataTable({ queries }: { queries: MarketingConsoleSeoQuery[] }) {
  const columns = useMemo<Column<MarketingConsoleSeoQuery>[]>(
    () => [
      {
        key: 'query',
        header: 'Search',
        width: 340,
        minWidth: 240,
        sortable: true,
        responsivePriority: 1,
        render: (query) => <Typography variant="labelLarge">{query.query}</Typography>,
      },
      metricColumn<MarketingConsoleSeoQuery>('clicks', 'Clicks', (query) => query.clicks),
      metricColumn<MarketingConsoleSeoQuery>(
        'searchViews',
        'Search views',
        (query) => query.searchViews,
      ),
      {
        key: 'clickThroughRate',
        header: 'CTR',
        width: 100,
        minWidth: 88,
        align: 'end',
        sortable: true,
        minVisibleWidth: 520,
        responsivePriority: 2,
        render: (query) =>
          query.clickThroughRate === undefined ? 'Not available' : `${query.clickThroughRate}%`,
      },
      {
        key: 'averagePosition',
        header: 'Avg. position',
        width: 132,
        minWidth: 116,
        align: 'end',
        sortable: true,
        minVisibleWidth: 660,
        responsivePriority: 3,
        render: (query) => query.averagePosition ?? 'Not available',
      },
      {
        key: 'bestPage',
        header: 'Best page',
        width: 300,
        minWidth: 220,
        minVisibleWidth: 820,
        responsivePriority: 4,
        render: (query) => query.bestPage?.title ?? 'Not available',
        printValue: (query) => query.bestPage?.title ?? 'Not available',
      },
    ],
    [],
  );
  return (
    <ConsoleDataTable
      tableId="ops-seo-queries"
      data={queries}
      columns={columns}
      emptyMessage="No search queries match the current filters"
      emptyIcon="search"
    />
  );
}

function metricColumn<T extends { id: string }>(
  key: string,
  header: string,
  value: (row: T) => number,
): Column<T> {
  return {
    key,
    header,
    width: 116,
    minWidth: 104,
    align: 'end',
    sortable: true,
    responsivePriority: 1,
    render: (row) => formatNumber(value(row)),
  };
}
