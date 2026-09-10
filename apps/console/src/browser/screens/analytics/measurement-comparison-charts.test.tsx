import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MeasurementOutcomeComparisons } from './measurement-comparison-charts.js';

describe('MeasurementOutcomeComparisons', () => {
  it('keeps canonical and provider-attributed outcomes visibly distinct', () => {
    const html = renderToStaticMarkup(
      <MeasurementOutcomeComparisons
        audit={{
          canonicalOutcomes: [
            {
              projectId: 'store',
              environmentId: 'production',
              sourceId: 'order-service',
              revision: 1,
              status: 'confirmed',
              finality: 'server-confirmed',
              window: {
                start: '2026-08-04T00:00:00Z',
                end: '2026-08-05T00:00:00Z',
                timeZone: 'UTC',
              },
              outcomeId: 'purchase',
              label: 'Completed purchases',
              count: 8,
              source: 'Order service',
              observedAt: '2026-08-05T00:00:00.000Z',
              freshness: 'fresh',
            },
          ],
          attributionComparisons: [
            {
              providerId: 'google-ads',
              outcomeId: 'purchase',
              canonicalCount: 8,
              attributedCount: 11,
              difference: 3,
              comparison: 'different',
              explanation: 'Attribution differs from the canonical outcome.',
              source: 'Google Ads',
              observedAt: '2026-08-05T00:00:00.000Z',
              freshness: 'fresh',
            },
          ],
        }}
      />,
    );
    expect(html).toContain('Completed purchases');
    expect(html).toContain('Canonical outcome');
    expect(html).toContain('Google Ads attributed');
    expect(html).toContain('canonical outcome remains authoritative');
  });
});
