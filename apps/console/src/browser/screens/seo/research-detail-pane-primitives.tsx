import type { ReactNode } from 'react';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';

export function ResearchDetailPane({
  ariaLabel,
  badges,
  summary,
  children,
}: {
  ariaLabel: string;
  badges: ReactNode;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section
      className="ops-research-detail-pane flex h-full min-h-0 flex-col"
      aria-label={ariaLabel}
    >
      <div className="ops-research-detail-pane__body min-h-0 flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-3">
            {summary}
          </Typography>
        </div>
        {children}
      </div>
    </section>
  );
}

export function ResearchDetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="ops-research-detail-pane__section px-5 py-5">
      <Typography variant="titleMedium" component="h3" className="font-semibold">
        {title}
      </Typography>
      {description ? (
        <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
          {description}
        </Typography>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ResearchDetailMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card variant="outlined" padding="sm" className="min-w-0">
      <Typography variant="labelSmall" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="titleMedium" className="mt-1 font-semibold break-words tabular-nums">
        {value}
      </Typography>
      {note ? (
        <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
          {note}
        </Typography>
      ) : null}
    </Card>
  );
}

export function ResearchDetailFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-on-surface-variant text-label-small">{label}</dt>
      <dd className="text-body-medium mt-1 break-words">{value}</dd>
    </div>
  );
}

export function ResearchInlineList({
  items,
  emptyMessage,
}: {
  items: string[];
  emptyMessage: string;
}) {
  return (
    <Typography variant="bodyMedium" className="text-on-surface-variant">
      {items.length ? items.join(', ') : emptyMessage}
    </Typography>
  );
}

export function ResearchBulletList({
  items,
  emptyMessage,
}: {
  items: string[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return (
      <Typography variant="bodyMedium" className="text-on-surface-variant">
        {emptyMessage}
      </Typography>
    );
  }
  return (
    <ul className="text-on-surface-variant text-body-medium grid list-disc gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
