import { useId } from 'react';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';

export type ComparisonBarTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'info'
  | 'warning'
  | 'success';

export type ComparisonBarItem = {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  detail?: string;
  tone?: ComparisonBarTone;
};

export function ComparisonBarChart({
  title,
  description,
  items,
  caption,
  compact = false,
}: {
  title: string;
  description?: string;
  items: ComparisonBarItem[];
  caption?: string;
  compact?: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const maximum = Math.max(...items.map((item) => item.value), 0);

  if (!items.length) return null;

  return (
    <Card variant="outlined" padding={compact ? 'sm' : 'md'}>
      <figure aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
        <figcaption className="grid gap-1">
          <Typography id={titleId} variant="titleMedium" className="font-semibold tracking-tight">
            {title}
          </Typography>
          {description ? (
            <Typography
              id={descriptionId}
              variant="bodySmall"
              className="text-on-surface-variant max-w-3xl leading-relaxed"
            >
              {description}
            </Typography>
          ) : null}
        </figcaption>

        <ol className={compact ? 'mt-4 grid gap-4' : 'mt-5 grid gap-5'}>
          {items.map((item) => {
            const width = maximum > 0 ? (item.value / maximum) * 100 : 0;
            return (
              <li
                key={item.id}
                className="grid items-center gap-x-4 gap-y-1.5"
                style={{
                  gridTemplateColumns: 'minmax(7.5rem, 0.9fr) minmax(3rem, 2fr) max-content',
                }}
              >
                <Typography
                  variant="labelLarge"
                  className="min-w-0 leading-snug font-medium break-words"
                  style={{ gridColumn: 1, gridRow: 1 }}
                >
                  {item.label}
                </Typography>
                <div
                  className="bg-surface-container-highest h-1.5 overflow-hidden rounded-full"
                  aria-hidden="true"
                  style={{ gridColumn: 2, gridRow: 1 }}
                >
                  <div
                    className={`${barToneClass(item.tone)} h-full rounded-full`}
                    style={{
                      width: `${width}%`,
                      minWidth: item.value > 0 ? '2px' : undefined,
                    }}
                  />
                </div>
                <Typography
                  variant="labelLarge"
                  className="min-w-16 text-right font-semibold tracking-tight tabular-nums"
                  style={{ gridColumn: 3, gridRow: 1 }}
                >
                  {item.valueLabel}
                </Typography>
                {item.detail ? (
                  <Typography
                    variant="bodySmall"
                    className="text-on-surface-variant leading-relaxed"
                    style={{ gridColumn: '2 / -1', gridRow: 2 }}
                  >
                    {item.detail}
                  </Typography>
                ) : null}
              </li>
            );
          })}
        </ol>

        {caption ? (
          <Typography
            variant="labelSmall"
            className="border-outline-weak text-on-surface-variant mt-4 border-t pt-3 leading-relaxed"
          >
            {caption}
          </Typography>
        ) : null}
      </figure>
    </Card>
  );
}

function barToneClass(tone: ComparisonBarTone = 'primary'): string {
  return {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    info: 'bg-info',
    warning: 'bg-warning',
    success: 'bg-success',
  }[tone];
}
