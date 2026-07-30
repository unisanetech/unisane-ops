import { describe, expect, it } from 'vitest';
import { createGrowthConfigIntent } from '../config.js';
import { buildGrowthConfigReadiness } from '../readiness.js';

const observedAt = '2026-07-30T00:00:00.000Z';

describe('Growth readiness', () => {
  it('keeps connection, resource, instrumentation, data, and mutation dimensions independent', () => {
    const findings = buildGrowthConfigReadiness({
      projectId: 'product-site',
      config: createGrowthConfigIntent({
        adoptionMode: 'adopt-existing',
        capabilities: ['analytics', 'tag-manager'],
        environments: ['production'],
        runtimeIntegration: 'tag-manager',
      }),
      observedAt,
    });

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'growth.connection.google.missing',
          dimension: 'connection',
          blocking: true,
        }),
        expect.objectContaining({
          code: 'growth.resource.google.analytics.missing',
          dimension: 'resource',
        }),
        expect.objectContaining({
          code: 'growth.instrumentation.tag-manager',
          dimension: 'instrumentation',
          state: 'no-signal',
        }),
        expect.objectContaining({
          code: 'growth.data.no-signal',
          dimension: 'data',
          state: 'no-signal',
        }),
        expect.objectContaining({
          code: 'growth.mutation.disabled',
          dimension: 'mutation',
        }),
      ]),
    );
  });

  it.each([
    ['warming', 'warming'],
    ['ready', 'ready'],
    ['stale', 'stale'],
    ['delayed', 'delayed'],
  ] as const)('projects %s evidence without collapsing it to config state', (state, expected) => {
    const findings = buildGrowthConfigReadiness({
      projectId: 'product-site',
      config: createGrowthConfigIntent({
        adoptionMode: 'adopt-existing',
        capabilities: ['analytics'],
        environments: ['production'],
      }),
      observedAt,
      dataObservations: [
        {
          environmentId: 'production',
          state,
          observedAt,
          source: 'analytics-report',
          summary: `Analytics evidence is ${state}.`,
        },
      ],
    });

    expect(findings.find((finding) => finding.dimension === 'data')).toEqual(
      expect.objectContaining({
        code: `growth.data.${state}`,
        state: expected,
        summary: `Analytics evidence is ${state}.`,
      }),
    );
  });
});
