import { describe, expect, it } from 'vitest';
import type { MarketingTrackingAuditReport } from '../marketing/index.js';
import { marketingExecutionContextSchema } from '../marketing/index.js';
import {
  createGrowthMeasurementAuditExecutor,
  formatGrowthMeasurementAudit,
  type GrowthMeasurementAuditExecutionDependencies,
} from './measurement-audit-execution.js';

const observedAt = '2026-08-03T00:00:00.000Z';
const config = marketingExecutionContextSchema.parse({
  version: 1,
  platformId: 'true-resume',
  appId: 'web',
  defaultEnvironment: 'production',
  environments: { production: { production: true } },
  paths: {
    gtmManifest: 'ops/growth/tag-manager.ts',
    webTrackingConfig: 'config/web-tracking.ts',
    webConversionsConfig: 'config/web-conversions.ts',
    trackingObservations: 'ops/growth/tracking-observations.json',
    eventRegistry: 'docs/marketing/events.json',
    conversionRegistry: 'docs/marketing/conversions.json',
    sourceRoots: ['src'],
    seoRoot: 'docs/seo',
    marketingRoot: 'docs/marketing',
    analyticsRoot: 'docs/analytics',
  },
  providers: {},
  attributionStore: {},
  requiredEnv: [],
});

function trackingAudit(status: 'ready' | 'attention' | 'blocked'): MarketingTrackingAuditReport {
  return {
    kind: 'unisane.growth.tracking-audit',
    version: 1,
    mode: 'audit-only',
    generatedAt: observedAt,
    ok: status !== 'blocked',
    cwd: '/workspace',
    environment: 'production',
    scannedFileCount: 4,
    observationArtifactPath: 'ops/growth/tracking-observations.json',
    summary: {
      status,
      emitterCount: 1,
      findingCount: status === 'ready' ? 0 : 1,
      errorCount: status === 'blocked' ? 1 : 0,
      warningCount: status === 'attention' ? 1 : 0,
    },
    coverage: {
      expectedEventCount: 1,
      observedEventCount: 1,
      expectedConversionCount: 1,
      observedConversionCount: 1,
      observationCount: 1,
      expectedDualDeliveryEventCount: 0,
      observedLogicalEventCount: 0,
      validDeduplicationPairCount: 0,
      deduplicationFailureCount: 0,
      browserDuplicateCount: 0,
      serverDuplicateCount: 0,
      stableServerRetryCount: 0,
      eventIdCollisionCount: 0,
      missingChannelCount: 0,
      pendingFreshnessCount: 0,
      staleEvidenceCount: 0,
      clockSkewCount: 0,
    },
    emitters: [],
    findings: [],
    readiness: {
      schemaVersion: 1,
      code: 'growth.instrumentation.audit.ready',
      dimension: 'instrumentation',
      state: status === 'ready' ? 'ready' : status === 'blocked' ? 'conflicted' : 'partial',
      severity: status === 'ready' ? 'info' : status === 'blocked' ? 'error' : 'warning',
      projectId: 'true-resume',
      environmentId: 'production',
      summary: 'Tracking audit result.',
      blocking: status === 'blocked',
      observedAt,
      evidence: [
        {
          kind: 'tracking-audit',
          source: 'ops/growth/tracking-observations.json',
          observedAt,
          freshness: 'fresh',
          summary: 'Recorded observations reconciled.',
        },
      ],
    },
    checks: [],
  };
}

function dependencies(
  status: 'ready' | 'attention' | 'blocked',
  confirmed = true,
): GrowthMeasurementAuditExecutionDependencies {
  return {
    auditTracking: () => trackingAudit(status),
    readConfirmedStatus: () => ({
      status: confirmed ? 'fresh' : 'missing',
      path: '/workspace/.cache/confirmed/latest.json',
      exists: confirmed,
      message: confirmed ? 'Fresh.' : 'Missing.',
      ...(confirmed
        ? {
            capturedAt: observedAt,
            pulledAt: observedAt,
            recordCount: 8,
            activeRecordCount: 8,
            revision: 1,
            sourceId: 'orders',
            window: {
              start: '2026-07-01T00:00:00.000Z',
              end: '2026-07-31T23:59:59.000Z',
              timeZone: 'Asia/Dhaka',
            },
          }
        : {}),
    }),
    readConfirmedArtifact: () =>
      confirmed
        ? {
            kind: 'unisane.growth.canonical-outcomes' as const,
            version: 2 as const,
            projectId: 'true-resume',
            environmentId: 'production',
            source: {
              id: 'orders',
              system: 'Order service',
              authority: 'business-system' as const,
            },
            ingestion: { transport: 'api' as const },
            revision: 1,
            capturedAt: observedAt,
            window: {
              start: '2026-07-01T00:00:00.000Z',
              end: '2026-07-31T23:59:59.000Z',
              timeZone: 'Asia/Dhaka',
            },
            partial: false,
            records: Array.from({ length: 8 }, (_, index) => ({
              outcomeReference: `sha256:${(index + 1).toString(16).padStart(64, '0')}`,
              correlationReference: `sha256:${(index + 1).toString(16).padStart(64, '0')}`,
              outcomeId: 'purchase',
              sourceEventId: 'purchase-confirmed',
              strategyObjectIds: [],
              revision: 1,
              status: 'confirmed' as const,
              finality: 'server-confirmed' as const,
              occurredAt: `2026-07-${(index + 1).toString().padStart(2, '0')}T12:00:00.000Z`,
              count: 1,
              value: 100,
              currency: 'BDT',
            })),
          }
        : undefined,
    readProviderStatus: ({ provider, reportType }) => ({
      provider,
      reportType,
      status: 'fresh',
      path: `/workspace/.cache/${provider}/latest.json`,
      exists: true,
      message: 'Fresh.',
      pulledAt: observedAt,
      recordCount: 1,
      window: { startDate: '2026-07-01', endDate: '2026-07-31' },
      metrics: { conversions: provider === 'googleAds' ? 10 : 6 },
      source: 'api',
    }),
  };
}

const options = {
  cwd: '/workspace',
  config,
  principal: { kind: 'user' as const, id: 'user.test' },
  now: new Date(observedAt),
  requestId: 'request.measurement-audit.test',
};

describe('measurement audit execution adapter', () => {
  it('maps recorded artifacts into the canonical action and preserves provider attribution', async () => {
    const output = await createGrowthMeasurementAuditExecutor(dependencies('ready'))(options);

    expect(output).toMatchObject({ status: 'ready', safeToScale: true });
    expect(output.canonicalOutcomes[0]).toMatchObject({
      count: 8,
      value: 800,
      currency: 'BDT',
      status: 'confirmed',
      finality: 'server-confirmed',
    });
    expect(output.attributionComparisons).toEqual([
      expect.objectContaining({ providerId: 'google-ads', attributedCount: 10 }),
      expect.objectContaining({ providerId: 'meta-ads', attributedCount: 6 }),
    ]);
    expect(formatGrowthMeasurementAudit(output)).toContain(output.workflow.presentation.headline);
  });

  it('returns the same blocked workflow projection when canonical truth is unavailable', async () => {
    const output = await createGrowthMeasurementAuditExecutor(dependencies('ready', false))(
      options,
    );

    expect(output).toMatchObject({ status: 'blocked', safeToScale: false });
    expect(output.workflow.presentation).toMatchObject({
      headline: 'Do not scale acquisition yet.',
      nextStep: { deepLink: '/analytics/tracking-health' },
    });
  });

  it('returns a blocked recovery result when tracking registries are not recorded yet', async () => {
    const missingRegistries = dependencies('ready', false);
    missingRegistries.auditTracking = () => {
      throw new Error(
        '[MARKETING_EVENT_REGISTRY_NOT_FOUND] Marketing registry artifact was not found.',
      );
    };

    const output = await createGrowthMeasurementAuditExecutor(missingRegistries)(options);

    expect(output).toMatchObject({ status: 'blocked', safeToScale: false });
    expect(output.trackingIntegrity).toMatchObject({
      status: 'blocked',
      freshness: 'unknown',
      provenance: 'Growth tracking registries',
    });
    expect(output.workflow.presentation).toMatchObject({
      headline: 'Do not scale acquisition yet.',
      nextStep: { deepLink: '/analytics/tracking-health' },
    });
  });

  it('does not hide unexpected tracking audit failures', async () => {
    const failingAudit = dependencies('ready');
    failingAudit.auditTracking = () => {
      throw new Error('Unexpected tracking reader failure.');
    };

    await expect(createGrowthMeasurementAuditExecutor(failingAudit)(options)).rejects.toThrow(
      'Unexpected tracking reader failure.',
    );
  });

  it('keeps tracking warnings as attention across structured and human output', async () => {
    const output = await createGrowthMeasurementAuditExecutor(dependencies('attention'))(options);
    const human = formatGrowthMeasurementAudit(output);

    expect(output).toMatchObject({ status: 'attention', safeToScale: false });
    expect(human).toContain(output.workflow.presentation.headline);
    expect(human).toContain(output.workflow.presentation.nextStep.reason);
  });
});
