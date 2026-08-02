import type { ReactNode } from 'react';
import { Badge } from '@unisane/ui/badge';
import { Typography } from '@unisane/ui/typography';

export function DataTablePrimaryText({ children }: { children: ReactNode }) {
  return <span className="block truncate font-semibold">{children}</span>;
}

export function DataTableWrappedText({ children }: { children: ReactNode }) {
  return <span className="block leading-relaxed break-words whitespace-normal">{children}</span>;
}

export function DataTableListPreview({
  items,
  visibleCount = 2,
}: {
  items: readonly string[];
  visibleCount?: number;
}) {
  if (!items.length) {
    return <span className="text-on-surface-variant">None recorded</span>;
  }
  const remaining = Math.max(items.length - visibleCount, 0);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 truncate">{items.slice(0, visibleCount).join(' · ')}</span>
      {remaining ? (
        <Badge variant="tonal" color="secondary" size="sm">
          +{remaining}
        </Badge>
      ) : null}
    </div>
  );
}

export function ExpandedDataTableRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="ops-expanded-detail">
      <header className="ops-expanded-detail__header">
        <Typography variant="titleMedium" component="h3" className="font-semibold">
          {title}
        </Typography>
        {description ? (
          <Typography variant="bodySmall" className="text-on-surface-variant mt-1 max-w-3xl">
            {description}
          </Typography>
        ) : null}
      </header>
      <div className="ops-expanded-detail__sections">{children}</div>
    </div>
  );
}

export function ExpandedDataSection({
  title,
  children,
  span = 'auto',
}: {
  title: string;
  children: ReactNode;
  span?: 'auto' | 'full';
}) {
  return (
    <section
      className="ops-expanded-detail__section"
      data-span={span === 'full' ? 'full' : undefined}
    >
      <Typography variant="labelLarge" component="h4" className="font-semibold">
        {title}
      </Typography>
      <div className="ops-expanded-detail__section-content text-body-small text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

export function ExpandedDataInlineList({
  items,
  emptyMessage = 'No supporting evidence was recorded.',
}: {
  items: readonly string[];
  emptyMessage?: string;
}) {
  if (!items.length) return <p>{emptyMessage}</p>;
  return <p className="ops-expanded-detail__inline-list">{items.join(', ')}</p>;
}

export function ExpandedDataList({
  items,
  emptyMessage = 'No supporting evidence was recorded.',
}: {
  items: readonly string[];
  emptyMessage?: string;
}) {
  if (!items.length) return <p>{emptyMessage}</p>;
  return (
    <ul className="ops-expanded-detail__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
