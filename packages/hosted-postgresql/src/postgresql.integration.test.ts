import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineOpsReadAction } from '@unisane/ops-engine/actions';
import {
  admitHostedReadAction,
  createHostedReadWorker,
  type HostedReadAdmissionRequest,
  type HostedReadAuthorization,
  type HostedReadClaim,
} from '@unisane/ops-engine/hosted';
import {
  createHostedCredential,
  createHostedWorkerCredentialResolver,
  revokeHostedCredential,
  rotateHostedCredential,
  type HostedCredentialEnvelopeCipher,
} from '@unisane/ops-engine/hosted/credentials';
import { createHostedReadSchedule } from '@unisane/ops-engine/hosted/scheduler';
import { createPostgresHostedReadPersistence } from './index.js';
import { migratePostgresHostedReadPersistence } from './migrations.js';

const connectionString = process.env.OPS_POSTGRES_TEST_URL;
const integration = connectionString ? describe : describe.skip;
const schema = `ops_test_${randomUUID().replaceAll('-', '')}`;
const admin = connectionString ? new Pool({ connectionString }) : null;
const gatewayPool = connectionString
  ? new Pool({ connectionString, options: `-c search_path=${schema}` })
  : null;
const workerPool = connectionString
  ? new Pool({ connectionString, options: `-c search_path=${schema}` })
  : null;

const authorization: HostedReadAuthorization = {
  authenticated: true,
  audience: 'unisane.ops',
  principalId: 'user.alice',
  allowedScopeIds: ['workspace.acme'],
};

function credentialCipher(): HostedCredentialEnvelopeCipher {
  const values = new Map<string, { plaintext: Uint8Array; aad: Uint8Array }>();
  return {
    async encrypt({ keyId, plaintext, additionalAuthenticatedData }) {
      const ciphertext = Buffer.from(`integration-${values.size + 1}`).toString('base64url');
      values.set(ciphertext, {
        plaintext: new Uint8Array(plaintext),
        aad: new Uint8Array(additionalAuthenticatedData),
      });
      return {
        algorithm: 'test-envelope-v1',
        keyId,
        wrappedDataKey: Buffer.from('wrapped-key').toString('base64url'),
        nonce: Buffer.from(`nonce-${values.size}`).toString('base64url'),
        ciphertext,
      };
    },
    async decrypt({ envelope, additionalAuthenticatedData }) {
      const value = values.get(envelope.ciphertext);
      if (
        !value ||
        Buffer.compare(Buffer.from(value.aad), Buffer.from(additionalAuthenticatedData)) !== 0
      ) {
        throw new Error('authenticated data mismatch');
      }
      return new Uint8Array(value.plaintext);
    },
  };
}

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

async function count(pool: Pool, table: string): Promise<number> {
  const result = await pool.query<{ value: string }>(`SELECT COUNT(*) AS value FROM ${table}`);
  return Number(result.rows[0]?.value);
}

integration('PostgreSQL hosted read persistence', () => {
  beforeAll(async () => {
    if (!admin || !gatewayPool || !workerPool) return;
    await admin.query(`CREATE SCHEMA ${schema}`);
    await migratePostgresHostedReadPersistence(gatewayPool);
    await migratePostgresHostedReadPersistence(workerPool);
  });

  afterAll(async () => {
    if (!admin || !gatewayPool || !workerPool) return;
    await gatewayPool.end();
    await workerPool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  it('preserves admission, dispatch, execution, recovery, and fencing across pools', async () => {
    if (!gatewayPool || !workerPool) throw new Error('PostgreSQL test pool is unavailable.');
    const gateway = createPostgresHostedReadPersistence(gatewayPool);
    const workerPersistence = createPostgresHostedReadPersistence(workerPool);
    const admitted = await admitHostedReadAction({
      request: request(),
      authorization,
      store: gateway.store,
      now: new Date('2026-08-03T10:00:00.000Z'),
    });
    await expect(
      admitHostedReadAction({ request: request(), authorization, store: gateway.store }),
    ).resolves.toEqual(admitted);
    const conflictingRequest = request();
    conflictingRequest.evidenceRevision = 'evidence.13';
    await expect(
      admitHostedReadAction({
        request: conflictingRequest,
        authorization,
        store: gateway.store,
      }),
    ).rejects.toMatchObject({ code: 'idempotency-conflict' });
    expect(await count(gatewayPool, 'ops_hosted_read_job')).toBe(1);
    expect(await count(gatewayPool, 'ops_hosted_read_dispatch')).toBe(1);
    expect(await count(gatewayPool, 'ops_hosted_read_audit')).toBe(1);

    const dispatchClaims = await Promise.all([
      workerPersistence.dispatch.claimAvailable({
        owner: 'worker.1',
        now: '2026-08-03T10:01:00.000Z',
        expiresAt: '2026-08-03T10:01:30.000Z',
      }),
      gateway.dispatch.claimAvailable({
        owner: 'worker.2',
        now: '2026-08-03T10:01:00.000Z',
        expiresAt: '2026-08-03T10:01:30.000Z',
      }),
    ]);
    expect(dispatchClaims.filter(Boolean)).toHaveLength(1);
    const dispatch = dispatchClaims.find((claim) => claim !== null) ?? null;
    expect(dispatch?.jobId).toBe(admitted.jobId);
    const execute = vi.fn(async (input: { project: string }) => ({
      status: 'healthy' as const,
      project: input.project,
    }));
    const worker = createHostedReadWorker({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store: workerPersistence.store,
      results: workerPersistence.results,
      actions: [
        defineOpsReadAction({
          id: 'growth.health.review',
          schemaVersion: 1,
          maximumEffect: 'offline',
          inputSchema: z.object({ project: z.string() }).strict(),
          outputSchema: z.object({ status: z.literal('healthy'), project: z.string() }).strict(),
          execute,
        }),
      ],
      now: () => new Date('2026-08-03T10:01:01.000Z'),
    });
    expect((await worker.execute(admitted.jobId)).phase).toBe('succeeded');
    expect(dispatch).not.toBeNull();
    await expect(
      workerPersistence.dispatch.acknowledge({
        id: dispatch?.id ?? '',
        claimToken: dispatch?.claimToken ?? '',
        completedAt: '2026-08-03T10:01:02.000Z',
      }),
    ).resolves.toBe('stored');
    expect((await gateway.store.get(admitted.jobId))?.phase).toBe('succeeded');
    expect(await count(gatewayPool, 'ops_hosted_read_result')).toBe(1);
    expect(await count(gatewayPool, 'ops_hosted_read_audit')).toBe(3);
    expect(execute).toHaveBeenCalledTimes(1);

    const secondRequest = request();
    secondRequest.action.idempotencyKey = 'request.health.2';
    secondRequest.action.context.requestId = 'request.health.2';
    const second = await admitHostedReadAction({
      request: secondRequest,
      authorization,
      store: gateway.store,
      now: new Date('2026-08-03T10:02:00.000Z'),
    });
    const claimed = await gateway.store.claim({
      jobId: second.jobId,
      expectedRevision: second.revision,
      owner: 'worker.stale',
      now: '2026-08-03T10:02:01.000Z',
      expiresAt: '2026-08-03T10:02:02.000Z',
      audit: {
        id: 'audit.started.stale',
        kind: 'started',
        jobId: second.jobId,
        principalId: 'user.alice',
        scopeId: 'workspace.acme',
        actionId: 'growth.health.review',
        occurredAt: '2026-08-03T10:02:01.000Z',
      },
    });
    expect(claimed).not.toBe('conflict');
    const recoveryWorker = createHostedReadWorker({
      owner: 'worker.recovery',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store: workerPersistence.store,
      results: workerPersistence.results,
      actions: [],
      now: () => new Date('2026-08-03T10:02:03.000Z'),
    });
    await expect(recoveryWorker.recover(second.jobId)).resolves.toMatchObject({
      phase: 'queued',
      revision: 3,
    });
    const stale = claimed as HostedReadClaim;
    await expect(
      gateway.store.complete({
        job: {
          ...stale.job,
          revision: stale.job.revision + 1,
          phase: 'failed',
          failure: { code: 'stale-worker', message: 'Stale worker.', retryable: false },
          lease: null,
        },
        expectedRevision: stale.job.revision,
        fencingToken: stale.fencingToken,
        audit: {
          id: 'audit.failed.stale',
          kind: 'failed',
          jobId: second.jobId,
          principalId: 'user.alice',
          scopeId: 'workspace.acme',
          actionId: 'growth.health.review',
          occurredAt: '2026-08-03T10:02:04.000Z',
        },
      }),
    ).resolves.toBe('conflict');
    await expect(
      workerPersistence.dispatch.listExpiredJobIds({
        now: '2026-08-03T10:02:05.000Z',
        limit: 10,
      }),
    ).resolves.toEqual([]);
  });

  it('fences due schedules, materializes one canonical occurrence, and recovers interruption', async () => {
    if (!gatewayPool || !workerPool) throw new Error('PostgreSQL test pool is unavailable.');
    const first = createPostgresHostedReadPersistence(gatewayPool).schedules;
    const second = createPostgresHostedReadPersistence(workerPool).schedules;
    const base = createHostedReadSchedule({
      schemaVersion: 1,
      kind: 'ops.hosted-read-schedule',
      scheduleId: 'schedule.health.hourly',
      revision: 1,
      enabled: true,
      evidenceRevision: 'evidence.42',
      action: {
        schemaVersion: 1,
        actionId: 'growth.health.review',
        actionSchemaVersion: 1,
        context: {
          scopeId: 'workspace.acme',
          projectId: 'project.acme',
          environmentId: 'production',
          principal: { kind: 'service', id: 'scheduler.acme' },
        },
        input: { project: 'acme' },
      },
      cadence: { kind: 'interval', milliseconds: 86_400_000 },
      nextDueAt: '2026-08-04T00:00:00.000Z',
      lease: null,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
    });
    await expect(first.save(base)).resolves.toBe('stored');
    const claims = await Promise.all([
      first.claimDue({
        owner: 'scheduler.1',
        now: '2026-08-04T00:00:00.000Z',
        expiresAt: '2026-08-04T00:00:30.000Z',
      }),
      second.claimDue({
        owner: 'scheduler.2',
        now: '2026-08-04T00:00:00.000Z',
        expiresAt: '2026-08-04T00:00:30.000Z',
      }),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    const claim = claims.find(Boolean);
    if (!claim) throw new Error('Schedule claim is unavailable.');
    await expect(
      first.materialize({ claim, materializedAt: '2026-08-04T00:00:01.000Z' }),
    ).resolves.toMatchObject({ occurrenceId: 'schedule.health.hourly.1785801600000' });
    expect(await count(gatewayPool, 'ops_hosted_read_schedule_occurrence')).toBe(1);

    const interrupted = createHostedReadSchedule({
      ...base,
      scheduleId: 'schedule.measurement.daily',
      nextDueAt: '2026-08-04T02:00:00.000Z',
    });
    await first.save(interrupted);
    const stale = await first.claimDue({
      owner: 'scheduler.stale',
      now: '2026-08-04T02:00:00.000Z',
      expiresAt: '2026-08-04T02:00:01.000Z',
    });
    expect(stale).not.toBeNull();
    await expect(
      second.recoverExpired({ now: '2026-08-04T02:00:02.000Z', limit: 10 }),
    ).resolves.toBe(1);
    const recovered = await second.claimDue({
      owner: 'scheduler.recovery',
      now: '2026-08-04T02:00:02.000Z',
      expiresAt: '2026-08-04T02:00:32.000Z',
    });
    expect(recovered?.fencingToken).not.toBe(stale?.fencingToken);
    if (!stale || !recovered) throw new Error('Recovery schedule claim is unavailable.');
    await expect(
      first.materialize({ claim: stale, materializedAt: '2026-08-04T02:00:03.000Z' }),
    ).resolves.toBe('conflict');
    await expect(
      second.materialize({ claim: recovered, materializedAt: '2026-08-04T02:00:03.000Z' }),
    ).resolves.toMatchObject({ scheduleId: interrupted.scheduleId });
  });

  it('atomically rotates and revokes encrypted provider credentials with exact project binding', async () => {
    if (!gatewayPool || !workerPool) throw new Error('PostgreSQL test pool is unavailable.');
    const gateway = createPostgresHostedReadPersistence(gatewayPool).credentials;
    const workerStore = createPostgresHostedReadPersistence(workerPool).credentials;
    const cipher = credentialCipher();
    const context = {
      scopeId: 'workspace.acme',
      projectId: 'project.acme',
      connectionId: 'connection.google',
      provider: 'google',
      secretKind: 'oauth-refresh',
    };
    const created = await createHostedCredential({
      credentialId: 'credential.google.primary',
      ...context,
      keyId: 'kms.primary',
      metadata: { accountLabel: 'Primary Google account' },
      plaintext: Buffer.from('first-provider-secret'),
      cipher,
      store: gateway,
      now: new Date('2026-08-04T03:00:00.000Z'),
    });
    const persisted = await gatewayPool.query<{ value: string }>(
      `SELECT row_to_json(credential)::text || row_to_json(credential_version)::text AS value
       FROM ops_hosted_credential AS credential
       JOIN ops_hosted_credential_version AS credential_version USING (credential_id)`,
    );
    expect(persisted.rows[0]?.value).not.toContain('first-provider-secret');

    const resolver = createHostedWorkerCredentialResolver({
      workerId: 'worker.primary',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.acme'],
      store: workerStore,
      cipher,
    });
    await expect(
      resolver.withCredential({
        reference: { credentialId: created.credentialId, version: 1 },
        context,
        use: async (value) => Buffer.from(value).toString() === 'first-provider-secret',
      }),
    ).resolves.toBe(true);
    await expect(
      resolver.withCredential({
        reference: { credentialId: created.credentialId, version: 1 },
        context: { ...context, projectId: 'project.other' },
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-scope-forbidden' });

    const rotationResults = await Promise.allSettled([
      rotateHostedCredential({
        current: created,
        plaintext: Buffer.from('second-provider-secret'),
        keyId: 'kms.rotated',
        cipher,
        store: gateway,
        now: new Date('2026-08-04T04:00:00.000Z'),
      }),
      rotateHostedCredential({
        current: created,
        plaintext: Buffer.from('conflicting-provider-secret'),
        keyId: 'kms.rotated',
        cipher,
        store: gateway,
        now: new Date('2026-08-04T04:00:00.000Z'),
      }),
    ]);
    expect(rotationResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rotatedIndex = rotationResults.findIndex((result) => result.status === 'fulfilled');
    const rotatedResult = rotationResults[rotatedIndex];
    if (!rotatedResult || rotatedResult.status !== 'fulfilled') {
      throw new Error('Credential rotation did not complete.');
    }
    const rotated = rotatedResult.value;
    await expect(
      resolver.withCredential({
        reference: { credentialId: created.credentialId, version: 1 },
        context,
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-unavailable' });
    await expect(
      resolver.withCredential({
        reference: { credentialId: rotated.credentialId, version: 2 },
        context,
        use: async (value) =>
          Buffer.from(value).toString() ===
          (rotatedIndex === 0 ? 'second-provider-secret' : 'conflicting-provider-secret'),
      }),
    ).resolves.toBe(true);

    await revokeHostedCredential({
      current: rotated,
      store: gateway,
      now: new Date('2026-08-04T05:00:00.000Z'),
    });
    await expect(
      resolver.withCredential({
        reference: { credentialId: rotated.credentialId, version: 2 },
        context,
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-unavailable' });
  });
});
