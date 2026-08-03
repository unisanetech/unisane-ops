import { describe, expect, it } from 'vitest';
import { createOpsReadActionRequest } from '@unisane/ops-engine/actions';
import { createOpsReadActionRuntime } from '@unisane/ops-engine/execution';
import { InMemoryActionJobStore } from '@unisane/ops-engine/testing';
import { createGrowthConfigIntent } from '../config.js';
import { createGrowthHealthReviewAction, growthHealthReviewOutputSchema } from './health-review.js';

describe('growth health review action', () => {
  it('runs through the shared job contract with explicit project context and bounded evidence', async () => {
    const store = new InMemoryActionJobStore('durable');
    const config = createGrowthConfigIntent({
      adoptionMode: 'adopt-existing',
      capabilities: ['seo', 'analytics'],
      environments: ['production'],
    });
    const growthHealthReviewAction = createGrowthHealthReviewAction({
      loadConfig: () => config,
      now: () => new Date('2026-08-02T00:00:00.000Z'),
    });
    const runtime = createOpsReadActionRuntime({
      store,
      actions: [growthHealthReviewAction],
      now: () => new Date('2026-08-02T00:00:00.000Z'),
      createJobId: () => 'job.growth-health',
    });
    const admission = await runtime.admit(
      createOpsReadActionRequest({
        schemaVersion: 1,
        actionId: growthHealthReviewAction.id,
        actionSchemaVersion: growthHealthReviewAction.schemaVersion,
        idempotencyKey: 'growth-health.production',
        context: {
          requestId: 'request.growth-health',
          scopeId: 'scope.true-resume',
          projectId: 'true-resume',
          environmentId: 'production',
          principal: { kind: 'agent', id: 'agent.codex' },
          requestedAt: '2026-08-02T00:00:00.000Z',
        },
        input: {
          findingLimit: 2,
        },
      }),
    );
    const completed = await runtime.runNext('worker.growth');
    const output = growthHealthReviewOutputSchema.parse(completed?.result?.output);

    expect(admission.created).toBe(true);
    expect(completed?.status).toBe('succeeded');
    expect(output).toMatchObject({
      projectId: 'true-resume',
      environmentId: 'production',
      returnedFindingCount: 2,
      truncated: true,
    });
    expect(output.totalFindingCount).toBeGreaterThan(output.returnedFindingCount);
    expect(output.findings.every((finding) => finding.projectId === 'true-resume')).toBe(true);
    expect(
      output.findings.every(
        (finding) => finding.environmentId === undefined || finding.environmentId === 'production',
      ),
    ).toBe(true);
    expect(output.workflow).toMatchObject({
      run: {
        runId: 'workflow.request.growth-health',
        context: {
          scopeId: 'scope.true-resume',
          projectId: 'true-resume',
          environmentId: 'production',
        },
      },
      presentation: {
        nextStep: { deepLink: expect.stringMatching(/^\//) },
      },
    });
    expect(output.workflow.contextBrief.presentation).toEqual(output.workflow.presentation);
  });

  it('fails closed when the requested environment is not part of project intent', async () => {
    const store = new InMemoryActionJobStore('durable');
    const growthHealthReviewAction = createGrowthHealthReviewAction({
      loadConfig: () =>
        createGrowthConfigIntent({
          adoptionMode: 'audit-only',
          capabilities: ['seo'],
          environments: ['production'],
        }),
      now: () => new Date('2026-08-02T00:00:00.000Z'),
    });
    const runtime = createOpsReadActionRuntime({
      store,
      actions: [growthHealthReviewAction],
      now: () => new Date('2026-08-02T00:00:00.000Z'),
      createJobId: () => 'job.missing-environment',
    });
    const admission = await runtime.admit(
      createOpsReadActionRequest({
        schemaVersion: 1,
        actionId: growthHealthReviewAction.id,
        actionSchemaVersion: growthHealthReviewAction.schemaVersion,
        idempotencyKey: 'growth-health.staging',
        context: {
          requestId: 'request.missing-environment',
          scopeId: 'scope.true-resume',
          projectId: 'true-resume',
          environmentId: 'staging',
          principal: { kind: 'agent', id: 'agent.codex' },
          requestedAt: '2026-08-02T00:00:00.000Z',
        },
        input: {},
      }),
    );

    const failed = await runtime.runNext('worker.growth');

    expect(admission.job.request.input).toMatchObject({ findingLimit: 50 });
    expect(failed).toMatchObject({
      jobId: admission.job.jobId,
      status: 'failed',
      error: { code: 'growth.health.environment-missing', retryable: false },
    });
    expect(failed?.error?.message).toBe(
      'The requested Growth environment is not configured for this project.',
    );
  });
});
