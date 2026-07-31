import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';

export function SeoSourceNote({ state }: { state: ConsoleScreenProps['state'] }) {
  return (
    <Card variant="low" padding="sm" className="mt-4">
      <Typography variant="bodySmall">
        {state.seo.sourceLabel} · {state.seo.freshnessLabel}
      </Typography>
      <Typography variant="bodySmall" className="text-on-surface-variant">
        {state.seo.comparisonLabel}
      </Typography>
    </Card>
  );
}
