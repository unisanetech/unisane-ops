import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleAnalytics } from './analytics.js';

const trackingAudit = {
  kind: 'unisane.growth.tracking-audit' as const,
  version: 1 as const,
  mode: 'audit-only' as const,
  generatedAt: '2026-07-31T00:00:00.000Z',
  ok: true,
  cwd: '/workspace',
  environment: 'production',
  scannedFileCount: 2,
  summary: {
    status: 'attention' as const,
    emitterCount: 1,
    findingCount: 1,
    errorCount: 0,
    warningCount: 1,
  },
  coverage: {
    expectedEventCount: 2,
    observedEventCount: 0,
    expectedConversionCount: 1,
    observedConversionCount: 0,
    observationCount: 0,
  },
  emitters: [
    {
      id: 'web-runtime' as const,
      label: 'Unisane Web Runtime',
      channels: ['browser' as const],
      detectedBy: ['source' as const],
      paths: ['/workspace/src/tracking.ts'],
      direct: false,
    },
  ],
  findings: [
    {
      id: 'observations.missing',
      category: 'missing-event' as const,
      severity: 'warning' as const,
      title: 'Observed browser and server evidence is not available',
      detail: 'Source checks only.',
    },
  ],
  readiness: {
    schemaVersion: 1 as const,
    code: 'growth.instrumentation.audit.partial',
    dimension: 'instrumentation' as const,
    state: 'partial' as const,
    severity: 'warning' as const,
    projectId: 'project',
    environmentId: 'production',
    summary: 'Observed tracking evidence is missing.',
    blocking: false,
    observedAt: '2026-07-31T00:00:00.000Z',
    evidence: [],
  },
  checks: [],
};

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
      trackingAudit,
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
