import { describe, expect, it } from 'vitest';
import { createGrowthConfigIntent } from '../config.js';
import {
  createGrowthHealthReviewExecutor,
  formatGrowthHealthReview,
  projectGrowthDataObservation,
} from './health-review-execution.js';

const now = new Date('2026-08-03T00:00:00.000Z');

function configuredGrowth() {
  const config = createGrowthConfigIntent({
    adoptionMode: 'adopt-existing',
    capabilities: ['seo'],
    environments: ['production'],
  });
  config.environments.production = {
    connections: { google: 'google-primary' },
    resources: [
      {
        provider: 'google',
        connection: 'google-primary',
        service: 'search-console',
        resourceType: 'site',
        resourceId: 'sc-domain:example.com',
      },
    ],
  };
  return config;
}

describe('Growth health review execution', () => {
  it('projects only provider evidence required by selected capabilities', () => {
    const observation = projectGrowthDataObservation({
      config: configuredGrowth(),
      environmentId: 'production',
      now,
      statuses: [
        {
          provider: 'searchConsole',
          reportType: 'page',
          status: 'fresh',
          path: '/evidence/search.json',
          exists: true,
          message: 'Fresh.',
          pulledAt: '2026-08-02T00:00:00.000Z',
        },
        {
          provider: 'metaAds',
          reportType: 'campaign',
          status: 'missing',
          path: '/evidence/meta.json',
          exists: false,
          message: 'Missing.',
        },
      ],
    });

    expect(observation).toMatchObject({
      state: 'ready',
      observedAt: '2026-08-02T00:00:00.000Z',
    });
  });

  it.each([
    ['ready', 'Growth evidence is ready to use.'],
    ['stale', 'Some Growth evidence needs attention.'],
    ['permission-blocked', 'Growth guidance is blocked for now.'],
  ] as const)('preserves the action-owned %s presentation', async (state, headline) => {
    const execute = createGrowthHealthReviewExecutor({ readProviderFreshness: () => [] });
    const output = await execute({
      cwd: '/workspace',
      config: configuredGrowth(),
      projectId: 'true-resume',
      environmentId: 'production',
      principal: { kind: 'agent', id: 'agent.test' },
      now,
      dataObservations: [
        {
          environmentId: 'production',
          state,
          observedAt: now.toISOString(),
          source: 'Test evidence',
          summary: `${state} evidence.`,
        },
      ],
    });

    expect(output.workflow.presentation.headline).toBe(headline);
    expect(formatGrowthHealthReview(output)).toContain(headline);
    expect(formatGrowthHealthReview(output)).toContain(
      `Next: ${output.workflow.presentation.nextStep.label}`,
    );
  });
});
