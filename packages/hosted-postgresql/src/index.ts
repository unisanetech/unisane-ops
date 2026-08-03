import { createHash, randomUUID } from 'node:crypto';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import {
  hostedReadJobSchema,
  type HostedReadAdmissionBundle,
  type HostedReadAuditFact,
  type HostedReadClaim,
  type HostedReadDispatchIntent,
  type HostedReadJob,
  type HostedReadJobStore,
  type HostedReadResultReference,
  type HostedReadResultStore,
} from '@unisane/ops-engine/hosted';
import type { Pool, PoolClient, QueryResultRow } from 'pg';

export {
  hostedReadPostgresMigrations,
  migratePostgresHostedReadPersistence,
  type HostedReadPostgresMigration,
} from './migrations.js';

interface HostedReadJobRow extends QueryResultRow {
  job_id: string;
  revision: number;
  phase: string;
  request_json: unknown;
  request_digest: string;
  result_json: unknown | null;
  failure_json: unknown | null;
  lease_owner: string | null;
  fencing_token: string | null;
  lease_expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface HostedReadDispatchRow extends QueryResultRow {
  id: string;
  job_id: string;
  claim_token: string;
}

export interface HostedReadDispatchClaim {
  id: string;
  jobId: string;
  claimToken: string;
}

export interface HostedReadDispatchStore {
  claimAvailable(input: {
    owner: string;
    now: string;
    expiresAt: string;
  }): Promise<HostedReadDispatchClaim | null>;
  acknowledge(input: {
    id: string;
    claimToken: string;
    completedAt: string;
  }): Promise<'stored' | 'conflict'>;
  release(input: {
    id: string;
    claimToken: string;
    availableAt: string;
  }): Promise<'stored' | 'conflict'>;
  fail(input: {
    id: string;
    claimToken: string;
    failedAt: string;
    code: string;
  }): Promise<'stored' | 'conflict'>;
  listExpiredJobIds(input: { now: string; limit: number }): Promise<readonly string[]>;
}

type HostedReadPostgresPool = Pick<Pool, 'connect' | 'query'>;

function safeStateError(): OpsActionExecutionError {
  return new OpsActionExecutionError('hosted-state-invalid', 'Stored hosted state is invalid.');
}

function timestamp(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw safeStateError();
  return date.toISOString();
}

function rowToJob(row: HostedReadJobRow): HostedReadJob {
  const leaseExpiresAt = timestamp(row.lease_expires_at);
  return hostedReadJobSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-read-job',
    jobId: row.job_id,
    revision: Number(row.revision),
    phase: row.phase,
    request: row.request_json,
    result: row.result_json,
    failure: row.failure_json,
    lease:
      row.lease_owner && row.fencing_token && leaseExpiresAt
        ? {
            owner: row.lease_owner,
            fencingToken: row.fencing_token,
            expiresAt: leaseExpiresAt,
          }
        : null,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  });
}

function json(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new OpsActionExecutionError(
      'invalid-action-result',
      'The hosted value is not serializable.',
    );
  }
  return serialized;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function transaction<T>(
  pool: HostedReadPostgresPool,
  operation: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertAudit(client: PoolClient, audit: HostedReadAuditFact): Promise<void> {
  await client.query(
    `INSERT INTO ops_hosted_read_audit
      (id, kind, job_id, principal_id, scope_id, action_id, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      audit.id,
      audit.kind,
      audit.jobId,
      audit.principalId,
      audit.scopeId,
      audit.actionId,
      audit.occurredAt,
    ],
  );
}

async function insertDispatch(
  client: PoolClient,
  dispatch: HostedReadDispatchIntent,
): Promise<void> {
  await client.query(
    `INSERT INTO ops_hosted_read_dispatch (id, job_id, available_at)
     VALUES ($1, $2, $3)`,
    [dispatch.id, dispatch.jobId, dispatch.availableAt],
  );
}

async function getJob(
  queryable: Pick<Pool | PoolClient, 'query'>,
  jobId: string,
): Promise<HostedReadJob | null> {
  const result = await queryable.query<HostedReadJobRow>(
    'SELECT * FROM ops_hosted_read_job WHERE job_id = $1',
    [jobId],
  );
  return result.rows[0] ? rowToJob(result.rows[0]) : null;
}

class PostgresHostedReadJobStore implements HostedReadJobStore {
  readonly durability = 'durable' as const;
  readonly atomic = true as const;

  constructor(private readonly pool: HostedReadPostgresPool) {}

  async admit(bundle: HostedReadAdmissionBundle) {
    return transaction(this.pool, async (client) => {
      const requestJson = json(bundle.job.request);
      const requestDigest = digest(requestJson);
      const inserted = await client.query<{ job_id: string }>(
        `INSERT INTO ops_hosted_read_job
          (job_id, revision, phase, request_json, request_digest, result_json, failure_json,
           lease_owner, fencing_token, lease_expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, NULL, NULL, NULL, NULL, NULL, $6, $7)
         ON CONFLICT (job_id) DO NOTHING
         RETURNING job_id`,
        [
          bundle.job.jobId,
          bundle.job.revision,
          bundle.job.phase,
          requestJson,
          requestDigest,
          bundle.job.createdAt,
          bundle.job.updatedAt,
        ],
      );
      if (!inserted.rowCount) {
        const existingDigest = await client.query<{ request_digest: string }>(
          'SELECT request_digest FROM ops_hosted_read_job WHERE job_id = $1',
          [bundle.job.jobId],
        );
        if (existingDigest.rows[0]?.request_digest !== requestDigest) {
          return { status: 'conflict' } as const;
        }
        const existing = await getJob(client, bundle.job.jobId);
        if (!existing) throw safeStateError();
        return { status: 'existing', job: existing } as const;
      }
      await insertDispatch(client, bundle.dispatch);
      await insertAudit(client, bundle.audit);
      return { status: 'stored', job: bundle.job } as const;
    });
  }

  async get(jobId: string): Promise<HostedReadJob | null> {
    return getJob(this.pool, jobId);
  }

  async claim(input: {
    jobId: string;
    expectedRevision: number;
    owner: string;
    now: string;
    expiresAt: string;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadClaim | 'conflict'> {
    return transaction(this.pool, async (client) => {
      const fencingToken = `${input.owner}.${input.expectedRevision + 1}.${randomUUID()}`;
      const updated = await client.query<HostedReadJobRow>(
        `UPDATE ops_hosted_read_job
         SET revision = revision + 1, phase = 'running', lease_owner = $1,
             fencing_token = $2, lease_expires_at = $3, updated_at = $4
         WHERE job_id = $5 AND revision = $6 AND phase = 'queued'
         RETURNING *`,
        [
          input.owner,
          fencingToken,
          input.expiresAt,
          input.now,
          input.jobId,
          input.expectedRevision,
        ],
      );
      const row = updated.rows[0];
      if (!row) return 'conflict';
      await insertAudit(client, input.audit);
      return { job: rowToJob(row), fencingToken };
    });
  }

  async complete(input: {
    job: HostedReadJob;
    expectedRevision: number;
    fencingToken: string;
    audit: HostedReadAuditFact;
  }): Promise<'stored' | 'conflict'> {
    return transaction(this.pool, async (client) => {
      const updated = await client.query(
        `UPDATE ops_hosted_read_job
         SET revision = $1, phase = $2, result_json = $3::jsonb, failure_json = $4::jsonb,
             lease_owner = NULL, fencing_token = NULL, lease_expires_at = NULL, updated_at = $5
         WHERE job_id = $6 AND revision = $7 AND fencing_token = $8 AND phase = 'running'`,
        [
          input.job.revision,
          input.job.phase,
          input.job.result ? json(input.job.result) : null,
          input.job.failure ? json(input.job.failure) : null,
          input.job.updatedAt,
          input.job.jobId,
          input.expectedRevision,
          input.fencingToken,
        ],
      );
      if (updated.rowCount !== 1) return 'conflict';
      await insertAudit(client, input.audit);
      return 'stored';
    });
  }

  async recover(input: {
    jobId: string;
    expectedRevision: number;
    now: string;
    dispatch: HostedReadDispatchIntent;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadJob | 'not-expired' | 'conflict'> {
    return transaction(this.pool, async (client) => {
      const currentResult = await client.query<HostedReadJobRow>(
        'SELECT * FROM ops_hosted_read_job WHERE job_id = $1 FOR UPDATE',
        [input.jobId],
      );
      const row = currentResult.rows[0];
      if (!row || Number(row.revision) !== input.expectedRevision || row.phase !== 'running') {
        return 'conflict';
      }
      const current = rowToJob(row);
      if (!current.lease || Date.parse(current.lease.expiresAt) > Date.parse(input.now)) {
        return 'not-expired';
      }
      const updated = await client.query<HostedReadJobRow>(
        `UPDATE ops_hosted_read_job
         SET revision = revision + 1, phase = 'queued', lease_owner = NULL,
             fencing_token = NULL, lease_expires_at = NULL, updated_at = $1
         WHERE job_id = $2 AND revision = $3 AND phase = 'running'
         RETURNING *`,
        [input.now, input.jobId, input.expectedRevision],
      );
      const recovered = updated.rows[0];
      if (!recovered) return 'conflict';
      await insertDispatch(client, input.dispatch);
      await insertAudit(client, input.audit);
      return rowToJob(recovered);
    });
  }
}

class PostgresHostedReadResultStore implements HostedReadResultStore {
  readonly durability = 'durable' as const;

  constructor(private readonly pool: HostedReadPostgresPool) {}

  async put(input: {
    jobId: string;
    actionId: string;
    value: unknown;
    byteLength: number;
  }): Promise<HostedReadResultReference> {
    const valueJson = json(input.value);
    const reference: HostedReadResultReference = {
      artifactId: `${input.jobId}.result`,
      byteLength: input.byteLength,
      digest: digest(valueJson),
    };
    return transaction(this.pool, async (client) => {
      const inserted = await client.query(
        `INSERT INTO ops_hosted_read_result
          (artifact_id, job_id, action_id, value_json, byte_length, digest)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)
         ON CONFLICT (artifact_id) DO NOTHING`,
        [
          reference.artifactId,
          input.jobId,
          input.actionId,
          valueJson,
          reference.byteLength,
          reference.digest,
        ],
      );
      if (inserted.rowCount === 1) return reference;
      const existing = await client.query<{ byte_length: number; digest: string }>(
        `SELECT byte_length, digest FROM ops_hosted_read_result WHERE artifact_id = $1`,
        [reference.artifactId],
      );
      const row = existing.rows[0];
      if (Number(row?.byte_length) !== reference.byteLength || row?.digest !== reference.digest) {
        throw new OpsActionExecutionError(
          'result-conflict',
          'The result identity is already bound to different content.',
        );
      }
      return reference;
    });
  }
}

class PostgresHostedReadDispatchStore implements HostedReadDispatchStore {
  constructor(private readonly pool: HostedReadPostgresPool) {}

  async claimAvailable(input: {
    owner: string;
    now: string;
    expiresAt: string;
  }): Promise<HostedReadDispatchClaim | null> {
    return transaction(this.pool, async (client) => {
      const claimToken = `${input.owner}.${randomUUID()}`;
      const claimed = await client.query<HostedReadDispatchRow>(
        `WITH available AS (
           SELECT id
           FROM ops_hosted_read_dispatch
           WHERE completed_at IS NULL
             AND available_at <= $1
             AND (claim_expires_at IS NULL OR claim_expires_at <= $1)
           ORDER BY available_at, id
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE ops_hosted_read_dispatch AS dispatch
         SET claim_owner = $2, claim_token = $3, claim_expires_at = $4
         FROM available
         WHERE dispatch.id = available.id
         RETURNING dispatch.id, dispatch.job_id, dispatch.claim_token`,
        [input.now, input.owner, claimToken, input.expiresAt],
      );
      const row = claimed.rows[0];
      return row ? { id: row.id, jobId: row.job_id, claimToken: row.claim_token } : null;
    });
  }

  async acknowledge(input: {
    id: string;
    claimToken: string;
    completedAt: string;
  }): Promise<'stored' | 'conflict'> {
    const result = await this.pool.query(
      `UPDATE ops_hosted_read_dispatch
       SET completed_at = $1, claim_owner = NULL, claim_token = NULL, claim_expires_at = NULL
       WHERE id = $2 AND claim_token = $3 AND completed_at IS NULL`,
      [input.completedAt, input.id, input.claimToken],
    );
    return result.rowCount === 1 ? 'stored' : 'conflict';
  }

  async release(input: {
    id: string;
    claimToken: string;
    availableAt: string;
  }): Promise<'stored' | 'conflict'> {
    const result = await this.pool.query(
      `UPDATE ops_hosted_read_dispatch
       SET available_at = $1, claim_owner = NULL, claim_token = NULL, claim_expires_at = NULL
       WHERE id = $2 AND claim_token = $3 AND completed_at IS NULL`,
      [input.availableAt, input.id, input.claimToken],
    );
    return result.rowCount === 1 ? 'stored' : 'conflict';
  }

  async fail(input: {
    id: string;
    claimToken: string;
    failedAt: string;
    code: string;
  }): Promise<'stored' | 'conflict'> {
    const result = await this.pool.query(
      `UPDATE ops_hosted_read_dispatch
       SET completed_at = $1, failure_code = $2,
           claim_owner = NULL, claim_token = NULL, claim_expires_at = NULL
       WHERE id = $3 AND claim_token = $4 AND completed_at IS NULL`,
      [input.failedAt, input.code, input.id, input.claimToken],
    );
    return result.rowCount === 1 ? 'stored' : 'conflict';
  }

  async listExpiredJobIds(input: { now: string; limit: number }): Promise<readonly string[]> {
    const result = await this.pool.query<{ job_id: string }>(
      `SELECT job_id
       FROM ops_hosted_read_job
       WHERE phase = 'running' AND lease_expires_at <= $1
       ORDER BY lease_expires_at, job_id
       LIMIT $2`,
      [input.now, input.limit],
    );
    return result.rows.map((row) => row.job_id);
  }
}

export function createPostgresHostedReadPersistence(pool: HostedReadPostgresPool): {
  store: HostedReadJobStore;
  results: HostedReadResultStore;
  dispatch: HostedReadDispatchStore;
} {
  return {
    store: new PostgresHostedReadJobStore(pool),
    results: new PostgresHostedReadResultStore(pool),
    dispatch: new PostgresHostedReadDispatchStore(pool),
  };
}
