import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleAnalytics } from './analytics.js';

describe('Growth console Analytics projection', () => {
  it('does not turn an empty provider report into zero traffic', () => {
    const result = buildMarketingConsoleAnalytics({
      metrics: [
        {
          id: 'sessions',
          label: 'Sessions',
          value: 'Not available',
          definition: 'Measured visits.',
          sourceLabel: 'Google Analytics',
          freshnessLabel: '56 days old',
          comparisonLabel: 'Previous-period comparison is not available yet.',
          status: 'missing',
        },
      ],
      traffic: [],
      visitors: [],
      conversions: [],
      freshness: [
        {
          id: 'ga4.channel',
          provider: 'ga4',
          reportType: 'channel',
          label: 'GA4 channels',
          status: 'warn',
          message: 'Refresh Analytics.',
          ageDays: 56,
          recordCount: 0,
        },
      ],
      connections: [],
      tagManager: {
        status: 'warn',
        headline: 'Review Tag Manager changes against the current workspace.',
        detail: 'The project manifest remains the source of truth.',
        checks: [],
        actions: [],
        technical: {},
      },
    });

    expect(result).toMatchObject({
      source: {
        available: false,
        freshnessLabel: 'No rows in latest report',
      },
      headline: 'Analytics does not have usable visitor data yet.',
      traffic: [],
      visitors: [],
      conversions: [],
    });
    expect(result.detail).toMatch(/not treated as zero traffic/i);
    expect(result.trackingHealth.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'analytics-reports',
          detail: expect.stringMatching(/not confirmed zero traffic/i),
        }),
      ]),
    );
  });
});
