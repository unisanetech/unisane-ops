import { describe, expect, it } from 'vitest';
import { createOpsReadActionRequest } from '@unisane/ops-engine/actions';
import { createOpsReadActionRuntime } from '@unisane/ops-engine/execution';
import { InMemoryActionJobStore } from '@unisane/ops-engine/testing';
import type { MarketingTrackingAuditReport } from '../marketing/tracking/audit-types.js';
import type {
  CanonicalOutcome,
  ProviderAttributedConversion,
} from '../playbooks/measurement-audit.js';
import {
  createGrowthMeasurementAuditAction,
  growthMeasurementAuditOutputSchema,
} from './measurement-audit.js';

const observedAt = '2026-08-03T00:00:00.000Z';
const period = { start: '2026-07-01T00:00:00.000Z', end: '2026-07-31T23:59:59.000Z' };

function trackingAudit(status: 'ready' | 'attention' | 'blocked'): MarketingTrackingAuditReport {
  const errorCount = status === 'blocked' ? 1 : 0;
  const warningCount = status === 'attention' ? 1 : 0;
  return {
    kind: 'unisane.growth.tracking-audit',
    version: 1,
    mode: 'audit-only',
    generatedAt: observedAt,
    ok: status !== 'blocked',
    cwd: '/workspace',
    environment: 'production',
    scannedFileCount: 10,
    observationArtifactPath: 'artifacts/tracking-observations.json',
    summary: {
      status,
      emitterCount: 1,
      findingCount: errorCount + warningCount,
      errorCount,
      warningCount,
    },
    coverage: {
      expectedEventCount: 2,
      observedEventCount: 2,
      expectedConversionCount: 1,
      observedConversionCount: 1,
      observationCount: 3,
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
          source: 'artifacts/tracking-observations.json',
          observedAt,
          freshness: 'fresh',
          summary: 'Tracking observations reconciled.',
        },
      ],
    },
    checks: [],
  };
}

function canonical(freshness: CanonicalOutcome['freshness'] = 'fresh'): CanonicalOutcome {
  return {
    outcomeId: 'purchase',
    label: 'Completed purchases',
    count: 10,
    source: 'Order service',
    observedAt,
    freshness,
  };
}

function attribution(index = 1): ProviderAttributedConversion {
  return {
    providerId: `provider-${index}`,
    outcomeId: 'purchase',
    attributedCount: 10 + index,
    source: `Provider ${index} report`,
    observedAt,
    freshness: 'fresh',
  };
}

function request(action: { id: string; schemaVersion: number }, comparisonLimit = 20) {
  return createOpsReadActionRequest({
    schemaVersion: 1,
    actionId: action.id,
    actionSchemaVersion: action.schemaVersion,
    idempotencyKey: 'measurement-audit.production',
    context: {
      requestId: 'request.measurement-audit',
      scopeId: 'scope.true-resume',
      projectId: 'true-resume',
      environmentId: 'production',
      principal: { kind: 'agent', id: 'agent.codex' },
      requestedAt: observedAt,
    },
    input: { period, comparisonLimit },
  });
}

async function execute(input: {
  trackingStatus: 'ready' | 'attention' | 'blocked';
  canonicalOutcomes?: CanonicalOutcome[];
  attributions?: ProviderAttributedConversion[];
  comparisonLimit?: number;
}) {
  const action = createGrowthMeasurementAuditAction({
    loadTrackingAudit: () => trackingAudit(input.trackingStatus),
    loadCanonicalOutcomes: () => input.canonicalOutcomes ?? [canonical()],
    loadProviderAttributions: () => input.attributions ?? [attribution()],
    now: () => new Date(observedAt),
  });
  const runtime = createOpsReadActionRuntime({
    store: new InMemoryActionJobStore('durable'),
    actions: [action],
    now: () => new Date(observedAt),
    createJobId: () => 'job.measurement-audit',
  });
  await runtime.admit(request(action, input.comparisonLimit));
  const completed = await runtime.runNext('worker.growth');
  return growthMeasurementAuditOutputSchema.parse(completed?.result?.output);
}

describe('measurement audit action', () => {
  it('allows guidance only when canonical outcomes and tracking integrity are ready', async () => {
    const output = await execute({ trackingStatus: 'ready' });

    expect(output).toMatchObject({ status: 'ready', safeToScale: true });
    expect(output.canonicalOutcomes[0]).toMatchObject({ count: 10, source: 'Order service' });
    expect(output.attributionComparisons[0]).toMatchObject({
      attributedCount: 11,
      canonicalCount: 10,
      comparison: 'different',
    });
    expect(output.workflow.contextBrief.presentation).toEqual(output.workflow.presentation);
  });

  it('blocks scaling when canonical truth is missing', async () => {
    const output = await execute({ trackingStatus: 'ready', canonicalOutcomes: [] });

    expect(output).toMatchObject({ status: 'blocked', safeToScale: false });
    expect(output.limitations).toContain('No canonical outcome is recorded for this period.');
    expect(output.workflow.presentation).toMatchObject({
      headline: 'Do not scale acquisition yet.',
      nextStep: { deepLink: '/analytics/tracking-health' },
    });
  });

  it('blocks scaling when the canonical tracking audit reports errors', async () => {
    const output = await execute({ trackingStatus: 'blocked' });

    expect(output).toMatchObject({
      status: 'blocked',
      safeToScale: false,
      trackingIntegrity: { status: 'blocked', errorCount: 1 },
    });
  });

  it('blocks when tracking evidence belongs to another environment', async () => {
    const action = createGrowthMeasurementAuditAction({
      loadTrackingAudit: () => ({ ...trackingAudit('ready'), environment: 'staging' }),
      loadCanonicalOutcomes: () => [canonical()],
      loadProviderAttributions: () => [attribution()],
      now: () => new Date(observedAt),
    });
    const runtime = createOpsReadActionRuntime({
      store: new InMemoryActionJobStore('durable'),
      actions: [action],
      now: () => new Date(observedAt),
      createJobId: () => 'job.environment-mismatch',
    });
    await runtime.admit(request(action));
    const completed = await runtime.runNext('worker.growth');
    const output = growthMeasurementAuditOutputSchema.parse(completed?.result?.output);

    expect(output).toMatchObject({ status: 'blocked', safeToScale: false });
    expect(output.limitations).toContain('The tracking audit belongs to a different environment.');
  });

  it('marks stale canonical evidence as attention', async () => {
    const output = await execute({
      trackingStatus: 'ready',
      canonicalOutcomes: [canonical('stale')],
    });

    expect(output).toMatchObject({ status: 'attention', safeToScale: false });
    expect(output.limitations).toContain('Some canonical outcome evidence is stale.');
  });

  it('bounds provider comparisons without hiding the total count', async () => {
    const output = await execute({
      trackingStatus: 'ready',
      attributions: Array.from({ length: 25 }, (_, index) => attribution(index + 1)),
      comparisonLimit: 3,
    });

    expect(output).toMatchObject({ totalAttributionCount: 25, truncated: true });
    expect(output.attributionComparisons).toHaveLength(3);
  });
});
