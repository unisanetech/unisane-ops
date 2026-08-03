import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineOpsReadAction } from './actions.js';
import {
  admitHostedReadAction,
  createHostedReadWorker,
  type HostedReadAdmissionBundle,
  type HostedReadAuditFact,
  type HostedReadClaim,
  type HostedReadDispatchIntent,
  type HostedReadJob,
  type HostedReadJobStore,
  type HostedReadResultStore,
} from './hosted-read.js';

class MemoryHostedReadStore implements HostedReadJobStore {
  readonly durability = 'durable' as const;
  readonly atomic = true as const;
  readonly audits: HostedReadAuditFact[] = [];
  readonly dispatches: HostedReadDispatchIntent[] = [];
  private readonly jobs = new Map<string, HostedReadJob>();

  async admit(bundle: HostedReadAdmissionBundle) {
    const existing = this.jobs.get(bundle.job.jobId);
    if (existing) {
      return JSON.stringify(existing.request) === JSON.stringify(bundle.job.request)
        ? ({ status: 'existing', job: existing } as const)
        : ({ status: 'conflict' } as const);
    }
    this.jobs.set(bundle.job.jobId, bundle.job);
    this.dispatches.push(bundle.dispatch);
    this.audits.push(bundle.audit);
    return { status: 'stored', job: bundle.job } as const;
  }

  async get(jobId: string) {
    return this.jobs.get(jobId) ?? null;
  }

  async claim(input: {
    jobId: string;
    expectedRevision: number;
    owner: string;
    now: string;
    expiresAt: string;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadClaim | 'conflict'> {
    const job = this.jobs.get(input.jobId);
    if (!job || job.revision !== input.expectedRevision || job.phase !== 'queued')
      return 'conflict';
    const claimed: HostedReadJob = {
      ...job,
      revision: job.revision + 1,
      phase: 'running',
      lease: {
        owner: input.owner,
        fencingToken: `${input.owner}.${job.revision + 1}`,
        expiresAt: input.expiresAt,
      },
      updatedAt: input.now,
    };
    this.jobs.set(job.jobId, claimed);
    this.audits.push(input.audit);
    return { job: claimed, fencingToken: claimed.lease!.fencingToken };
  }

  async complete(input: {
    job: HostedReadJob;
    expectedRevision: number;
    fencingToken: string;
    audit: HostedReadAuditFact;
  }) {
    const current = this.jobs.get(input.job.jobId);
    if (
      !current ||
      current.revision !== input.expectedRevision ||
      current.lease?.fencingToken !== input.fencingToken
    ) {
      return 'conflict' as const;
    }
    this.jobs.set(input.job.jobId, input.job);
    this.audits.push(input.audit);
    return 'stored' as const;
  }

  async recover(input: {
    jobId: string;
    expectedRevision: number;
    now: string;
    dispatch: HostedReadDispatchIntent;
    audit: HostedReadAuditFact;
  }) {
    const current = this.jobs.get(input.jobId);
    if (!current || current.revision !== input.expectedRevision || current.phase !== 'running') {
      return 'conflict' as const;
    }
    if (!current.lease || Date.parse(current.lease.expiresAt) > Date.parse(input.now)) {
      return 'not-expired' as const;
    }
    const recovered: HostedReadJob = {
      ...current,
      revision: current.revision + 1,
      phase: 'queued',
      lease: null,
      updatedAt: input.now,
    };
    this.jobs.set(input.jobId, recovered);
    this.dispatches.push(input.dispatch);
    this.audits.push(input.audit);
    return recovered;
  }
}

const resultStore: HostedReadResultStore = {
  durability: 'durable',
  async put(input) {
    const serialized = JSON.stringify(input.value);
    return {
      artifactId: `${input.jobId}.result`,
      byteLength: input.byteLength,
      digest: createHash('sha256').update(serialized).digest('hex'),
    };
  },
};

function request(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1 as const,
    audience: 'unisane.ops' as const,
    evidenceRevision: 'evidence.12',
    action: {
      schemaVersion: 1 as const,
      actionId: 'growth.health.review',
      actionSchemaVersion: 1,
      idempotencyKey: 'request.health.1',
      context: {
        requestId: 'request.health.1',
        scopeId: 'workspace.acme',
        projectId: 'project.acme',
        environmentId: 'production',
        principal: { kind: 'user' as const, id: 'user.alice' },
        requestedAt: '2026-08-03T10:00:00.000Z',
      },
      input: { project: 'acme' },
    },
    ...overrides,
  };
}

const authorization = {
  authenticated: true as const,
  audience: 'unisane.ops' as const,
  principalId: 'user.alice',
  allowedScopeIds: ['workspace.acme'],
};

describe('hosted read action spine', () => {
  it('atomically admits one scope-bound request and reuses an exact duplicate', async () => {
    const store = new MemoryHostedReadStore();
    const first = await admitHostedReadAction({ request: request(), authorization, store });
    const second = await admitHostedReadAction({ request: request(), authorization, store });

    expect(second).toEqual(first);
    expect(store.dispatches).toHaveLength(1);
    expect(store.audits.map((audit) => audit.kind)).toEqual(['admitted']);
  });

  it('rejects wrong audience, scope, principal, credential material, and conflicting identity', async () => {
    const store = new MemoryHostedReadStore();
    await expect(
      admitHostedReadAction({
        request: request(),
        authorization: { ...authorization, audience: 'unisane.ops' },
        store,
      }),
    ).resolves.toBeDefined();
    await expect(
      admitHostedReadAction({
        request: request({ audience: 'other.product' }),
        authorization,
        store: new MemoryHostedReadStore(),
      }),
    ).rejects.toThrow();
    await expect(
      admitHostedReadAction({
        request: request(),
        authorization: { ...authorization, allowedScopeIds: ['workspace.other'] },
        store: new MemoryHostedReadStore(),
      }),
    ).rejects.toMatchObject({ code: 'scope-forbidden' });
    await expect(
      admitHostedReadAction({
        request: request(),
        authorization: { ...authorization, principalId: 'user.other' },
        store: new MemoryHostedReadStore(),
      }),
    ).rejects.toMatchObject({ code: 'principal-mismatch' });
    await expect(
      admitHostedReadAction({
        request: request({ action: { ...request().action, input: { accessToken: 'forbidden' } } }),
        authorization,
        store: new MemoryHostedReadStore(),
      }),
    ).rejects.toMatchObject({ code: 'credential-material-forbidden' });

    await expect(
      admitHostedReadAction({
        request: request({
          action: { ...request().action, actionId: 'growth.measurement.audit' },
        }),
        authorization,
        store,
      }),
    ).rejects.toMatchObject({ code: 'idempotency-conflict' });
  });

  it('claims, executes, stores a bounded result reference, and makes completion idempotent', async () => {
    const store = new MemoryHostedReadStore();
    const execute = vi.fn(async (input: { project: string }) => ({ status: 'healthy', ...input }));
    const action = defineOpsReadAction({
      id: 'growth.health.review',
      schemaVersion: 1,
      maximumEffect: 'offline',
      inputSchema: z.object({ project: z.string() }).strict(),
      outputSchema: z.object({ status: z.literal('healthy'), project: z.string() }).strict(),
      execute,
    });
    const admitted = await admitHostedReadAction({ request: request(), authorization, store });
    const worker = createHostedReadWorker({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store,
      results: resultStore,
      actions: [action],
      now: () => new Date('2026-08-03T10:01:00.000Z'),
    });

    const completed = await worker.execute(admitted.jobId);
    expect(completed.phase).toBe('succeeded');
    expect(completed.result?.artifactId).toBe(`${admitted.jobId}.result`);
    await expect(worker.execute(admitted.jobId)).resolves.toEqual(completed);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(store.audits.map((audit) => audit.kind)).toEqual(['admitted', 'started', 'succeeded']);
  });

  it('persists bounded failures and rejects oversized output', async () => {
    const store = new MemoryHostedReadStore();
    const action = defineOpsReadAction({
      id: 'growth.health.review',
      schemaVersion: 1,
      maximumEffect: 'offline',
      inputSchema: z.object({ project: z.string() }).strict(),
      outputSchema: z.object({ detail: z.string() }).strict(),
      execute: async () => ({ detail: 'x'.repeat(200) }),
    });
    const admitted = await admitHostedReadAction({ request: request(), authorization, store });
    const worker = createHostedReadWorker({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 50,
      store,
      results: resultStore,
      actions: [action],
    });

    const completed = await worker.execute(admitted.jobId);
    expect(completed.phase).toBe('failed');
    expect(completed.failure).toEqual({
      code: 'result-too-large',
      message: 'The action result exceeds the hosted result limit.',
      retryable: false,
    });
  });

  it('recovers only an expired running lease and denies stale completion fencing', async () => {
    const store = new MemoryHostedReadStore();
    const admitted = await admitHostedReadAction({ request: request(), authorization, store });
    const claimed = await store.claim({
      jobId: admitted.jobId,
      expectedRevision: admitted.revision,
      owner: 'worker.1',
      now: '2026-08-03T10:00:01.000Z',
      expiresAt: '2026-08-03T10:00:02.000Z',
      audit: {
        id: 'audit.started.1',
        kind: 'started',
        jobId: admitted.jobId,
        principalId: 'user.alice',
        scopeId: 'workspace.acme',
        actionId: 'growth.health.review',
        occurredAt: '2026-08-03T10:00:01.000Z',
      },
    });
    expect(claimed).not.toBe('conflict');
    const worker = createHostedReadWorker({
      owner: 'worker.2',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store,
      results: resultStore,
      actions: [],
      now: () => new Date('2026-08-03T10:00:03.000Z'),
    });

    const recovered = await worker.recover(admitted.jobId);
    expect(recovered.phase).toBe('queued');
    expect(recovered.revision).toBe(3);
    const staleClaim = claimed as HostedReadClaim;
    await expect(
      store.complete({
        job: { ...staleClaim.job, phase: 'failed', lease: null },
        expectedRevision: staleClaim.job.revision,
        fencingToken: staleClaim.fencingToken,
        audit: store.audits[0]!,
      }),
    ).resolves.toBe('conflict');
  });

  it('returns a safe failure for unexpected executor errors', async () => {
    const store = new MemoryHostedReadStore();
    const action = defineOpsReadAction({
      id: 'growth.health.review',
      schemaVersion: 1,
      maximumEffect: 'offline',
      inputSchema: z.object({ project: z.string() }).strict(),
      outputSchema: z.object({ status: z.string() }).strict(),
      execute: async () => {
        throw new Error('provider response contained a secret');
      },
    });
    const admitted = await admitHostedReadAction({ request: request(), authorization, store });
    const worker = createHostedReadWorker({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store,
      results: resultStore,
      actions: [action],
    });

    const completed = await worker.execute(admitted.jobId);
    expect(completed.failure).toEqual({
      code: 'action-failed',
      message: 'The action could not be completed.',
      retryable: false,
    });
    expect(completed.failure?.message).not.toContain('secret');
  });
});
