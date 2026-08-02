import type React from 'react';
import { Button } from '@unisane/ui/button';
import { Icon } from '@unisane/ui/icon';
import { Typography } from '@unisane/ui/typography';

export function FilterToolbar({
  children,
  resultCount,
  totalCount,
  resultLabel = 'results',
  isFiltered = false,
  onClear,
}: {
  children: React.ReactNode;
  resultCount?: number;
  totalCount?: number;
  resultLabel?: string;
  isFiltered?: boolean;
  onClear?: () => void;
}) {
  const resultText =
    resultCount === undefined
      ? undefined
      : totalCount !== undefined && isFiltered
        ? `${resultCount} of ${totalCount} ${resultLabel}`
        : `${resultCount} ${resultLabel}`;
  return (
    <div>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-end gap-3">
        {children}
      </div>
      {resultText || (isFiltered && onClear) ? (
        <div className="mt-2.5 flex min-h-8 flex-wrap items-center justify-between gap-2">
          {resultText ? (
            <Typography variant="labelMedium" className="text-on-surface-variant">
              {resultText}
            </Typography>
          ) : (
            <span />
          )}
          {isFiltered && onClear ? (
            <Button
              variant="text"
              size="sm"
              leadingIcon={<Icon symbol="filter_alt_off" />}
              onClick={onClear}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
