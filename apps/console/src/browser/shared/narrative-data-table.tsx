import type { ReactNode } from 'react';
import type { Column } from '@unisane/data-table';
import { ConsoleDataTable } from './console-data-table.js';

export function NarrativeDataTable<T extends { id: string }>({
  tableId,
  data,
  columns,
  emptyMessage,
  emptyIcon,
  renderExpandedRow,
  getRowCanExpand,
}: {
  tableId: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  emptyIcon: string;
  renderExpandedRow: (row: T) => ReactNode;
  getRowCanExpand?: (row: T) => boolean;
}) {
  return (
    <ConsoleDataTable
      tableId={tableId}
      data={data}
      columns={columns}
      features={{ rowExpansion: true }}
      expandedRow={{ presentation: 'bare' }}
      renderExpandedRow={renderExpandedRow}
      getRowCanExpand={getRowCanExpand ?? (() => true)}
      emptyMessage={emptyMessage}
      emptyIcon={emptyIcon}
    />
  );
}
