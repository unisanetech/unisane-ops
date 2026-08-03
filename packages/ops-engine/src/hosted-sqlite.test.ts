import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineOpsReadAction } from './actions.js';
import {
  admitHostedReadAction,
  createHostedReadWorker,
  type HostedReadAdmissionRequest,
  type HostedReadAuthorization,
  type HostedReadClaim,
} from './hosted-read.js';
import {
  createSqliteHostedReadPersistence,
  type HostedReadSqliteDatabase,
} from './hosted-sqlite.js';

interface TestDatabase extends HostedReadSqliteDatabase {
  close(): void;
}

interface TestDatabaseConstructor {
  new (path: string): TestDatabase;
}

const sqliteModuleName = 'node:sqlite';
const sqliteModule = (await import(sqliteModuleName)) as unknown as {
  DatabaseSync: TestDatabaseConstructor;
};

const authorization: HostedReadAuthorization = {
  authenticated: true,
  audience: 'unisane.ops',
  principalId: 'user.alice',
  allowedScopeIds: ['workspace.acme'],
};

function request(): HostedReadAdmissionRequest {
  return {
    schemaVersion: 1,
    audience: 'unisane.ops',
    evidenceRevision: 'evidence.12',
    action: {
      schemaVersion: 1,
      actionId: 'growth.health.review',
      actionSchemaVersion: 1,
      idempotencyKey: 'request.health.1',
      context: {
        requestId: 'request.health.1',
        scopeId: 'workspace.acme',
        projectId: 'project.acme',
        environmentId: 'production',
        principal: { kind: 'user', id: 'user.alice' },
        requestedAt: '2026-08-03T10:00:00.000Z',
      },
      input: { project: 'acme' },
    },
  };
}

function databasePath(): string {
  return path.join(tmpdir(), `unisane-hosted-read-${randomUUID()}.sqlite`);
}

function scalar(database: TestDatabase, sql: string): number {
  const row = database.prepare(sql).get();
  if (!row || typeof row !== 'object' || !('value' in row)) throw new Error('Missing scalar');
  const value = row.value;
  if (typeof value !== 'number' && typeof value !== 'bigint') throw new Error('Invalid scalar');
  return Number(value);
}

describe('SQLite hosted read persistence', () => {
  it('persists one atomic admission across connections and executes in a separate worker role', async () => {
    const file = databasePath();
    const gatewayDatabase = new sqliteModule.DatabaseSync(file);
    const gateway = createSqliteHostedReadPersistence(gatewayDatabase);
    const admitted = await admitHostedReadAction({
      request: request(),
      authorization,
      store: gateway.store,
      now: new Date('2026-08-03T10:00:00.000Z'),
    });

    const duplicateDatabase = new sqliteModule.DatabaseSync(file);
    const duplicateGateway = createSqliteHostedReadPersistence(duplicateDatabase);
    await expect(
      admitHostedReadAction({
        request: request(),
        authorization,
        store: duplicateGateway.store,
      }),
    ).resolves.toEqual(admitted);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_job')).toBe(1);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_dispatch')).toBe(1);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_audit')).toBe(1);

    const execute = vi.fn(async (input: { project: string }) => ({
      status: 'healthy' as const,
      project: input.project,
    }));
    const action = defineOpsReadAction({
      id: 'growth.health.review',
      schemaVersion: 1,
      maximumEffect: 'offline',
      inputSchema: z.object({ project: z.string() }).strict(),
      outputSchema: z.object({ status: z.literal('healthy'), project: z.string() }).strict(),
      execute,
    });
    const workerDatabase = new sqliteModule.DatabaseSync(file);
    const workerPersistence = createSqliteHostedReadPersistence(workerDatabase);
    const worker = createHostedReadWorker({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store: workerPersistence.store,
      results: workerPersistence.results,
      actions: [action],
      now: () => new Date('2026-08-03T10:01:00.000Z'),
    });
    const completed = await worker.execute(admitted.jobId);

    expect(completed.phase).toBe('succeeded');
    expect((await gateway.store.get(admitted.jobId))?.phase).toBe('succeeded');
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_result')).toBe(1);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_audit')).toBe(3);
    await expect(worker.execute(admitted.jobId)).resolves.toEqual(completed);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_audit')).toBe(3);

    workerDatabase.close();
    duplicateDatabase.close();
    gatewayDatabase.close();
  });

  it('recovers an expired lease after restart and fences the stale worker', async () => {
    const file = databasePath();
    const gatewayDatabase = new sqliteModule.DatabaseSync(file);
    const gateway = createSqliteHostedReadPersistence(gatewayDatabase);
    const admitted = await admitHostedReadAction({
      request: request(),
      authorization,
      store: gateway.store,
      now: new Date('2026-08-03T10:00:00.000Z'),
    });
    const staleDatabase = new sqliteModule.DatabaseSync(file);
    const stalePersistence = createSqliteHostedReadPersistence(staleDatabase);
    const claimed = await stalePersistence.store.claim({
      jobId: admitted.jobId,
      expectedRevision: admitted.revision,
      owner: 'worker.stale',
      now: '2026-08-03T10:00:01.000Z',
      expiresAt: '2026-08-03T10:00:02.000Z',
      audit: {
        id: 'audit.started.stale',
        kind: 'started',
        jobId: admitted.jobId,
        principalId: 'user.alice',
        scopeId: 'workspace.acme',
        actionId: 'growth.health.review',
        occurredAt: '2026-08-03T10:00:01.000Z',
      },
    });
    expect(claimed).not.toBe('conflict');

    const recoveryDatabase = new sqliteModule.DatabaseSync(file);
    const recoveryPersistence = createSqliteHostedReadPersistence(recoveryDatabase);
    const recoveryWorker = createHostedReadWorker({
      owner: 'worker.recovery',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store: recoveryPersistence.store,
      results: recoveryPersistence.results,
      actions: [],
      now: () => new Date('2026-08-03T10:00:03.000Z'),
    });
    const recovered = await recoveryWorker.recover(admitted.jobId);
    expect(recovered.phase).toBe('queued');
    expect(recovered.revision).toBe(3);

    const staleClaim = claimed as HostedReadClaim;
    await expect(
      stalePersistence.store.complete({
        job: {
          ...staleClaim.job,
          revision: staleClaim.job.revision + 1,
          phase: 'failed',
          failure: { code: 'stale-worker', message: 'Stale worker.', retryable: false },
          lease: null,
        },
        expectedRevision: staleClaim.job.revision,
        fencingToken: staleClaim.fencingToken,
        audit: {
          id: 'audit.failed.stale',
          kind: 'failed',
          jobId: admitted.jobId,
          principalId: 'user.alice',
          scopeId: 'workspace.acme',
          actionId: 'growth.health.review',
          occurredAt: '2026-08-03T10:00:04.000Z',
        },
      }),
    ).resolves.toBe('conflict');
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_dispatch')).toBe(2);
    expect(scalar(gatewayDatabase, 'SELECT COUNT(*) AS value FROM hosted_read_audit')).toBe(3);

    recoveryDatabase.close();
    staleDatabase.close();
    gatewayDatabase.close();
  });
});
