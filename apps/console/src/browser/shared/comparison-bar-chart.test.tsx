import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComparisonBarChart } from './comparison-bar-chart.js';

describe('ComparisonBarChart', () => {
  it('keeps exact values and context readable without relying on bar color', () => {
    const html = renderToStaticMarkup(
      <ComparisonBarChart
        title="Market demand"
        description="Recorded provider estimates."
        items={[
          {
            id: 'us-en',
            label: 'US / en',
            value: 200,
            valueLabel: '200',
            detail: '66.7% of recorded demand',
          },
          {
            id: 'in-en',
            label: 'IN / en',
            value: 100,
            valueLabel: '100',
            detail: '33.3% of recorded demand',
            tone: 'secondary',
          },
        ]}
        caption="Provider estimates are not observed outcomes."
      />,
    );
    expect(html).toContain('aria-labelledby');
    expect(html).toContain('US / en');
    expect(html).toContain('66.7% of recorded demand');
    expect(html).toContain('Provider estimates are not observed outcomes.');
    expect(html).toContain('width:100%');
    expect(html).toContain('width:50%');
    expect(html).toContain('min-width:2px');
    expect(html).toContain('tabular-nums');
    expect(html).toContain(
      'grid-template-columns:minmax(7.5rem, 0.9fr) minmax(3rem, 2fr) max-content',
    );
  });

  it('does not draw a minimum bar for a zero value', () => {
    const html = renderToStaticMarkup(
      <ComparisonBarChart
        title="Outcome comparison"
        items={[
          {
            id: 'canonical',
            label: 'Canonical outcome',
            value: 0,
            valueLabel: '0',
          },
        ]}
      />,
    );

    expect(html).toContain('width:0%');
    expect(html).not.toContain('min-width:2px');
  });
});
