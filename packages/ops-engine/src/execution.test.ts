import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createOpsReadActionRequest, defineOpsReadAction } from './actions.js';
import { createOpsReadActionRuntime } from './execution.js';
import { InMemoryActionJobStore } from './testing.js';

const echoAction = defineOpsReadAction({
  id: 'test.echo.read',
  schemaVersion: 1,
  maximumEffect: 'offline',
  inputSchema: z.object({ value: z.string() }).strict(),
  outputSchema: z.object({ echoed: z.string() }).strict(),
  async execute(input) {
    return { echoed: input.value };
  },
});

function request(value = 'hello') {
  return createOpsReadActionRequest({
    schemaVersion: 1,
    actionId: echoAction.id,
    actionSchemaVersion: echoAction.schemaVersion,
    idempotencyKey: 'request.one',
    context: {
      requestId: 'request.one',
      scopeId: 'scope.one',
      projectId: 'project.one',
      environmentId: 'production',
      principal: { kind: 'agent', id: 'agent.codex' },
      requestedAt: '2026-08-02T00:00:00.000Z',
    },
    input: { value },
  });
}

function harness() {
  const store = new InMemoryActionJobStore('durable');
  let current = new Date('2026-08-02T00:00:00.000Z');
  let jobSequence = 0;
  const runtime = createOpsReadActionRuntime({
    store,
    actions: [echoAction],
    now: () => current,
    createJobId: () => {
      jobSequence += 1;
      return `job.${jobSequence}`;
    },
    leaseMs: 1_000,
  });
  return {
    store,
    runtime,
    advance(milliseconds: number) {
      current = new Date(current.getTime() + milliseconds);
    },
  };
}

describe('read action execution', () => {
  it('atomically reuses an admission and returns the terminal result with audit history', async () => {
    const { runtime } = harness();

    const first = await runtime.admit(request());
    const duplicate = await runtime.admit(request());
    const completed = await runtime.runNext('worker.one');

    expect(first.created).toBe(true);
    expect(duplicate).toMatchObject({ created: false, job: { jobId: first.job.jobId } });
    expect(completed).toMatchObject({
      jobId: first.job.jobId,
      status: 'succeeded',
      attemptCount: 1,
      result: { output: { echoed: 'hello' } },
    });
    expect(await runtime.get(first.job.jobId)).toEqual(completed);
    expect((await runtime.listAudit(first.job.jobId)).map((event) => event.type)).toEqual([
      'admitted',
      'admission-reused',
      'claimed',
      'succeeded',
    ]);
  });

  it('rejects reuse of an idempotency key with different input', async () => {
    const { runtime } = harness();
    await runtime.admit(request());

    await expect(runtime.admit(request('different'))).rejects.toThrow(
      '[OPS_ACTION_IDEMPOTENCY_CONFLICT]',
    );
  });

  it('recovers an expired worker claim and completes through a new worker', async () => {
    const { runtime, store, advance } = harness();
    const admitted = await runtime.admit(request());
    await store.claimNext({
      workerId: 'worker.crashed',
      now: '2026-08-02T00:00:00.000Z',
      leaseMs: 1_000,
    });

    advance(1_001);
    expect(await runtime.recoverExpired('service.recovery')).toBe(1);
    const completed = await runtime.runNext('worker.replacement');

    expect(completed).toMatchObject({
      jobId: admitted.job.jobId,
      status: 'succeeded',
      attemptCount: 2,
    });
    expect((await runtime.listAudit(admitted.job.jobId)).map((event) => event.type)).toContain(
      'requeued',
    );
  });

  it('cancels queued work before a worker can claim it', async () => {
    const { runtime } = harness();
    const admitted = await runtime.admit(request());

    const cancelled = await runtime.cancel(admitted.job.jobId, 'user.operator');

    expect(cancelled.status).toBe('cancelled');
    expect(await runtime.runNext('worker.one')).toBeNull();
  });

  it('rejects a local-only store for hosted execution', () => {
    expect(() =>
      createOpsReadActionRuntime({
        store: new InMemoryActionJobStore('local'),
        actions: [echoAction],
      }),
    ).toThrow('[OPS_ACTION_DURABLE_STORE_REQUIRED]');
  });
});
