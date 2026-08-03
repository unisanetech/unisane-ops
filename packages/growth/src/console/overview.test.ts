import { describe, expect, it } from 'vitest';
import type {
  MarketingConsoleConnection,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
} from './contracts.js';
import { buildMarketingConsoleOverview } from './overview.js';
import type { GrowthHealthReviewOutput } from '../actions/health-review.js';

function healthReview(
  status: GrowthHealthReviewOutput['status'],
  headline: string,
): GrowthHealthReviewOutput {
  return {
    status,
    workflow: {
      presentation: {
        headline,
        whyItMatters: `${headline} explanation`,
        nextStep: { label: 'Review evidence', reason: 'Review the primary finding.' },
      },
    },
  } as unknown as GrowthHealthReviewOutput;
}

function metric(
  id: string,
  label: string,
  numericValue: number,
  sourceLabel: string,
): MarketingConsoleMetric {
  return {
    id,
    label,
    value: String(numericValue),
    numericValue,
    definition: `${label} definition.`,
    sourceLabel,
    freshnessLabel: '4 days old',
    comparisonLabel: 'Previous-period comparison is not available yet.',
    status: 'warn',
  };
}

function freshness(
  provider: MarketingConsoleFreshnessCell['provider'],
  status: MarketingConsoleFreshnessCell['status'],
  ageDays?: number,
): MarketingConsoleFreshnessCell {
  return {
    id: `${provider}.summary`,
    provider,
    status,
    label: String(provider),
    message: status === 'ready' ? 'Current data.' : 'Data needs an update.',
    ...(ageDays !== undefined ? { ageDays, path: `/evidence/${provider}.json` } : {}),
  };
}

describe('Growth console Overview projection', () => {
  it('keeps historical metrics honest when Google is not connected', () => {
    const result = buildMarketingConsoleOverview({
      healthReview: healthReview('blocked', 'Growth guidance is blocked for now.'),
      connections: [
        {
          provider: 'google',
          label: 'Google',
          available: true,
          required: true,
          connected: false,
          state: 'not-connected',
          statusLabel: 'Not connected',
          summary: 'Connect Google.',
          services: [],
          disconnect: {
            title: 'Disconnect Google?',
            consequences: [],
            historicalDataRemains: true,
            providerResourcesUnchanged: true,
          },
        },
      ],
      freshness: [freshness('searchConsole', 'warn', 4)],
      metrics: [
        metric('organic-impressions', 'Search views', 120, 'Search Console'),
        metric('organic-clicks', 'Organic clicks', 8, 'Search Console'),
      ],
      receipts: [
        {
          id: 'ads-change.json',
          lane: 'ads',
          action: 'ads.google-ads-india-targeting-restore-receipt',
          status: 'ready',
          timestamp: '2026-07-29T00:00:00.000Z',
          path: '/private/evidence/ads-change.json',
          message: 'ads-change.json updated.',
        },
      ],
      capabilities: ['seo'],
    });

    expect(result.overview).toEqual(
      expect.objectContaining({
        status: 'blocked',
        headline: 'Growth guidance is blocked for now.',
        metricIds: ['organic-clicks'],
        funnel: expect.objectContaining({
          title: 'Search journey',
          sourceLabel: 'Search Console',
        }),
        capabilitySummaries: [
          expect.objectContaining({
            id: 'seo',
            statusLabel: 'Historical data',
          }),
        ],
        recentOutcomes: [
          {
            id: 'ads-change.json',
            title: 'Advertising targeting restored',
            summary: 'The change completed successfully.',
            status: 'ready',
            timestamp: '2026-07-29T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(result.priorities).toEqual([
      expect.objectContaining({
        id: 'connect-google',
        action: { label: 'Review connection', path: '/connections' },
      }),
    ]);
  });

  it('keeps capability priorities contextual and ignores unimplemented providers', () => {
    const connection: MarketingConsoleConnection = {
      provider: 'google',
      label: 'Google',
      available: true,
      required: true,
      connected: true,
      state: 'partial-permission',
      statusLabel: 'Needs more access',
      summary: 'Analytics works; Search Console needs access.',
      connectionId: 'google-primary',
      services: [
        {
          id: 'search-console',
          label: 'Search Console',
          purpose: 'Search results.',
          state: 'partial-permission',
          statusLabel: 'Needs more access',
          accessLabel: 'Required access is missing',
          accessLevelLabel: 'Read-only provider access',
          dataLabel: 'Working Google services are not affected',
          dataCoverageLabel: 'Search Console reports',
          issue: 'Grant only the additional Search Console access.',
          lastCheckedAt: '2026-07-30T00:00:00.000Z',
        },
        {
          id: 'analytics',
          label: 'Google Analytics',
          purpose: 'Visitor results.',
          state: 'current',
          statusLabel: 'Working',
          accessLabel: 'Access granted',
          accessLevelLabel: 'Read-only provider access',
          dataLabel: 'Latest usable data is current',
          dataCoverageLabel: 'Analytics reports',
          lastCheckedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
      disconnect: {
        title: 'Disconnect Google?',
        consequences: [],
        historicalDataRemains: true,
        providerResourcesUnchanged: true,
      },
    };

    const result = buildMarketingConsoleOverview({
      healthReview: healthReview('attention', 'Some Growth evidence needs attention.'),
      connections: [connection],
      freshness: [
        freshness('searchConsole', 'warn', 4),
        freshness('ga4', 'ready', 0),
        freshness('metaAds', 'missing'),
      ],
      metrics: [
        metric('sessions', 'Sessions', 240, 'Google Analytics'),
        metric('analytics-conversions', 'Analytics conversions', 12, 'Google Analytics'),
        metric('conversions', 'Conversions', 12, 'Google Analytics'),
      ],
      receipts: [],
      capabilities: ['seo', 'analytics'],
    });

    expect(result.overview).toEqual(
      expect.objectContaining({
        status: 'warn',
        headline: 'Some Growth evidence needs attention.',
        funnel: expect.objectContaining({ title: 'Visitor journey' }),
      }),
    );
    expect(result.priorities).toEqual([
      expect.objectContaining({
        lane: 'seo',
        title: 'Search Console needs attention',
        action: {
          label: 'Review Search Console',
          path: '/connections/google/access',
        },
      }),
    ]);
    expect(JSON.stringify(result)).not.toMatch(/Meta|readiness|report family/i);
    expect(result.overview.capabilitySummaries).toContainEqual(
      expect.objectContaining({
        id: 'analytics',
        status: 'ready',
        statusLabel: 'Current',
      }),
    );
  });
});
