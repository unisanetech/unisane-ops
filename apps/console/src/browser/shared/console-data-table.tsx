import type { DataTableProps } from '@unisane/data-table';
import { DataTable } from '@unisane/data-table';

type ConsoleDataTableProps<T extends { id: string }> = Pick<
  DataTableProps<T>,
  | 'tableId'
  | 'data'
  | 'columns'
  | 'emptyMessage'
  | 'emptyIcon'
  | 'renderExpandedRow'
  | 'expandedRow'
  | 'getRowCanExpand'
  | 'callbacks'
  | 'rowClassName'
  | 'className'
  | 'layout'
> & {
  features?: DataTableProps<T>['features'];
  pagination?: DataTableProps<T>['pagination'];
  styling?: DataTableProps<T>['styling'];
};

export function ConsoleDataTable<T extends { id: string }>({
  features,
  pagination,
  styling,
  ...props
}: ConsoleDataTableProps<T>) {
  return (
    <DataTable
      {...props}
      preset="dashboard"
      features={{
        selection: false,
        search: false,
        columnResize: false,
        columnPinning: false,
        columnReorder: false,
        columnVisibility: false,
        ...features,
      }}
      styling={{
        variant: 'grid',
        density: 'compact',
        columnDividers: true,
        ...styling,
      }}
      layout={{ verticalScroll: 'page', stickyHeader: true, ...props.layout }}
      pagination={{ mode: 'none', ...pagination }}
      virtualization={{ rows: false, columns: false }}
      enableFeedback={false}
    />
  );
}
