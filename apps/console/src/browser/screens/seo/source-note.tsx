import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';

export function SeoSourceNote({ state }: { state: ConsoleScreenProps['state'] }) {
  return (
    <div className="border-outline-weak mt-3 border-t pt-3">
      <Typography variant="labelSmall" className="text-on-surface-variant">
        Source: {state.seo.sourceLabel} · {state.seo.freshnessLabel}
      </Typography>
    </div>
  );
}
