import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { metaDiagnosticReviewResultSchema } from '@unisane/growth/contracts';
import { MetaDiagnosticResult } from './meta-diagnostics.js';
it('renders unknown scores, actual zero totals, stale evidence and escaped issue text', () => {
  const result = metaDiagnosticReviewResultSchema.parse({
    schemaVersion: 1,
    actionId: 'growth.meta.diagnostics.review',
    projectId: 'p',
    environmentId: 'test',
    connectionId: 'meta',
    datasetId: '123',
    freshness: 'stale',
    completeness: 'partial',
    verifiedLive: false,
    matchedEventCount: 1,
    truncated: false,
    events: [
      {
        name: 'Purchase',
        activity: 'active',
        total: 0,
        channels: ['server'],
        issues: [
          {
            code: 'currency',
            severity: 'error',
            state: 'active',
            explanation: '<script>unsafe</script>',
          },
        ],
      },
    ],
    handoffs: [],
    message: 'Imported evidence; live delivery is unverified.',
  });
  const html = renderToStaticMarkup(<MetaDiagnosticResult result={result} />);
  expect(html).toContain('Total: 0');
  expect(html).toContain('Reported match quality: Unavailable');
  expect(html).toContain('Evidence stale');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
});
