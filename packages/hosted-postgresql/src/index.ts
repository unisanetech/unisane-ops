import { createHash, randomUUID } from 'node:crypto';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import {
  hostedCredentialRecordSchema,
  hostedCredentialVersionSchema,
  type HostedCredentialBundle,
  type HostedCredentialRecord,
  type HostedCredentialStore,
  type HostedCredentialVersion,
} from '@unisane/ops-engine/hosted/credentials';
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
import {
  createHostedReadSchedule,
  createHostedReadScheduleMaterialization,
  hostedReadScheduleSchema,
  type HostedReadSchedule,
  type HostedReadScheduleClaim,
  type HostedReadScheduleStore,
} from '@unisane/ops-engine/hosted/scheduler';
import type { Pool, PoolClient, QueryResultRow } from 'pg';

export {
  assertPostgresHostedReadSchema,
  configurePostgresHostedReadRuntimeRoles,
  hostedReadPostgresMigrations,
  migratePostgresHostedReadPersistence,
  type HostedReadPostgresMigration,
  type HostedReadPostgresRuntimeRoles,
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

interface HostedReadScheduleRow extends QueryResultRow {
  schedule_id: string;
  revision: number;
  enabled: boolean;
  evidence_revision: string;
  action_json: unknown;
  cadence_ms: number;
  next_due_at: Date | string;
  lease_owner: string | null;
  fencing_token: string | null;
  lease_expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface HostedCredentialRow extends QueryResultRow {
  credential_id: string;
  scope_id: string;
  project_id: string;
  connection_id: string;
  provider: string;
  secret_kind: string;
  key_id: string;
  revision: number;
  active_version: number | null;
  state: string;
  metadata_json: unknown;
  created_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
}

interface HostedCredentialVersionRow extends QueryResultRow {
  credential_id: string;
  version: number;
  algorithm: string;
  key_id: string;
  wrapped_data_key: string;
  nonce: string;
  ciphertext: string;
  created_at: Date | string;
}

class ScheduleMaterializationConflict extends Error {}

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

function rowToSchedule(row: HostedReadScheduleRow): HostedReadSchedule {
  const expiresAt = timestamp(row.lease_expires_at);
  return hostedReadScheduleSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-read-schedule',
    scheduleId: row.schedule_id,
    revision: Number(row.revision),
    enabled: row.enabled,
    evidenceRevision: row.evidence_revision,
    action: row.action_json,
    cadence: { kind: 'interval', milliseconds: Number(row.cadence_ms) },
    nextDueAt: timestamp(row.next_due_at),
    lease:
      row.lease_owner && row.fencing_token && expiresAt
        ? { owner: row.lease_owner, fencingToken: row.fencing_token, expiresAt }
        : null,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  });
}

function rowToCredential(row: HostedCredentialRow): HostedCredentialRecord {
  return hostedCredentialRecordSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-credential',
    credentialId: row.credential_id,
    scopeId: row.scope_id,
    projectId: row.project_id,
    connectionId: row.connection_id,
    provider: row.provider,
    secretKind: row.secret_kind,
    keyId: row.key_id,
    revision: Number(row.revision),
    activeVersion: row.active_version === null ? null : Number(row.active_version),
    state: row.state,
    metadata: row.metadata_json,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
    revokedAt: timestamp(row.revoked_at),
  });
}

function rowToCredentialVersion(row: HostedCredentialVersionRow): HostedCredentialVersion {
  return hostedCredentialVersionSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-credential-version',
    credentialId: row.credential_id,
    version: Number(row.version),
    envelope: {
      algorithm: row.algorithm,
      keyId: row.key_id,
      wrappedDataKey: row.wrapped_data_key,
      nonce: row.nonce,
      ciphertext: row.ciphertext,
    },
    createdAt: timestamp(row.created_at),
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

function canonicalMetadata(value: Record<string, string>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
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

async function admitBundle(client: PoolClient, bundle: HostedReadAdmissionBundle) {
  const requestJson = json(bundle.job.request);
  const requestDigest = digest(requestJson);
  const inserted = await client.query<{ job_id: string }>(
    `INSERT INTO ops_hosted_read_job
      (job_id, revision, phase, request_json, request_digest, result_json, failure_json,
       lease_owner, fencing_token, lease_expires_at, created_at, updated_at,
       scope_id, project_id, principal_id)
     VALUES ($1, $2, $3, $4::jsonb, $5, NULL, NULL, NULL, NULL, NULL, $6, $7, $8, $9, $10)
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
      bundle.job.request.action.context.scopeId,
      bundle.job.request.action.context.projectId,
      bundle.job.request.action.context.principal.id,
    ],
  );
  if (!inserted.rowCount) {
    const existingDigest = await client.query<{ request_digest: string }>(
      'SELECT request_digest FROM ops_hosted_read_job WHERE job_id = $1',
      [bundle.job.jobId],
    );
    if (existingDigest.rows[0]?.request_digest !== requestDigest)
      return { status: 'conflict' } as const;
    const existing = await getJob(client, bundle.job.jobId);
    if (!existing) throw safeStateError();
    return { status: 'existing', job: existing } as const;
  }
  await insertDispatch(client, bundle.dispatch);
  await insertAudit(client, bundle.audit);
  return { status: 'stored', job: bundle.job } as const;
}

export class PostgresHostedReadJobStore implements HostedReadJobStore {
  readonly durability = 'durable' as const;
  readonly atomic = true as const;

  constructor(private readonly pool: HostedReadPostgresPool) {}

  async admit(bundle: HostedReadAdmissionBundle) {
    return transaction(this.pool, (client) => admitBundle(client, bundle));
  }

  async get(jobId: string): Promise<HostedReadJob | null> {
    return getJob(this.pool, jobId);
  }

  async getAuthorized(input: {
    jobId: string;
    principalId: string;
    allowedScopeIds: readonly string[];
    allowedProjectIds: readonly string[];
  }): Promise<HostedReadJob | null> {
    const result = await this.pool.query<HostedReadJobRow>(
      `SELECT *
       FROM ops_hosted_read_job
       WHERE job_id = $1
         AND principal_id = $2
         AND scope_id = ANY($3::text[])
         AND project_id = ANY($4::text[])`,
      [input.jobId, input.principalId, input.allowedScopeIds, input.allowedProjectIds],
    );
    return result.rows[0] ? rowToJob(result.rows[0]) : null;
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

export class PostgresHostedReadScheduleStore implements HostedReadScheduleStore {
  readonly durability = 'durable' as const;
  readonly atomicMaterialization = true as const;

  constructor(private readonly pool: HostedReadPostgresPool) {}

  async save(schedule: HostedReadSchedule): Promise<'stored' | 'existing' | 'conflict'> {
    const parsed = createHostedReadSchedule(schedule);
    const inserted = await this.pool.query(
      `INSERT INTO ops_hosted_read_schedule
        (schedule_id, revision, enabled, evidence_revision, action_json, cadence_ms,
         next_due_at, lease_owner, fencing_token, lease_expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NULL, NULL, NULL, $8, $9)
       ON CONFLICT (schedule_id) DO NOTHING`,
      [
        parsed.scheduleId,
        parsed.revision,
        parsed.enabled,
        parsed.evidenceRevision,
        json(parsed.action),
        parsed.cadence.milliseconds,
        parsed.nextDueAt,
        parsed.createdAt,
        parsed.updatedAt,
      ],
    );
    if (inserted.rowCount === 1) return 'stored';
    const current = await this.pool.query<HostedReadScheduleRow>(
      'SELECT * FROM ops_hosted_read_schedule WHERE schedule_id = $1',
      [parsed.scheduleId],
    );
    return current.rows[0] &&
      JSON.stringify(rowToSchedule(current.rows[0])) === JSON.stringify(parsed)
      ? 'existing'
      : 'conflict';
  }

  async claimDue(input: {
    owner: string;
    now: string;
    expiresAt: string;
  }): Promise<HostedReadScheduleClaim | null> {
    return transaction(this.pool, async (client) => {
      const fencingToken = `${input.owner}.${randomUUID()}`;
      const result = await client.query<HostedReadScheduleRow>(
        `WITH due AS (
           SELECT schedule_id
           FROM ops_hosted_read_schedule
           WHERE enabled AND next_due_at <= $1
             AND (lease_expires_at IS NULL OR lease_expires_at <= $1)
           ORDER BY next_due_at, schedule_id
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE ops_hosted_read_schedule AS schedule
         SET lease_owner = $2, fencing_token = $3, lease_expires_at = $4, updated_at = $1
         FROM due
         WHERE schedule.schedule_id = due.schedule_id
         RETURNING schedule.*`,
        [input.now, input.owner, fencingToken, input.expiresAt],
      );
      const row = result.rows[0];
      if (!row) return null;
      const schedule = rowToSchedule(row);
      return {
        schedule,
        occurrenceId: `${schedule.scheduleId}.${Date.parse(schedule.nextDueAt)}`,
        dueAt: schedule.nextDueAt,
        fencingToken,
      };
    });
  }

  async materialize(input: {
    claim: HostedReadScheduleClaim;
    materializedAt: string;
  }): Promise<ReturnType<typeof createHostedReadScheduleMaterialization> | 'conflict'> {
    try {
      return await transaction(this.pool, async (client) => {
        const current = await client.query<HostedReadScheduleRow>(
          `SELECT * FROM ops_hosted_read_schedule
         WHERE schedule_id = $1 AND revision = $2 AND fencing_token = $3
         FOR UPDATE`,
          [
            input.claim.schedule.scheduleId,
            input.claim.schedule.revision,
            input.claim.fencingToken,
          ],
        );
        const row = current.rows[0];
        if (!row || timestamp(row.next_due_at) !== input.claim.dueAt) return 'conflict';
        const materialized = createHostedReadScheduleMaterialization(
          rowToSchedule(row),
          input.claim.dueAt,
        );
        const jobId = `read.${materialized.occurrenceId}`;
        const job = hostedReadJobSchema.parse({
          schemaVersion: 1,
          kind: 'ops.hosted-read-job',
          jobId,
          revision: 1,
          phase: 'queued',
          request: materialized.request,
          result: null,
          failure: null,
          lease: null,
          createdAt: input.materializedAt,
          updatedAt: input.materializedAt,
        });
        const admitted = await admitBundle(client, {
          job,
          dispatch: { id: `${jobId}.dispatch.1`, jobId, availableAt: input.materializedAt },
          audit: {
            id: `${jobId}.admitted.1`,
            kind: 'admitted',
            jobId,
            principalId: job.request.action.context.principal.id,
            scopeId: job.request.action.context.scopeId,
            actionId: job.request.action.actionId,
            occurredAt: input.materializedAt,
          },
        });
        if (admitted.status !== 'stored') throw new ScheduleMaterializationConflict();
        await client.query(
          `INSERT INTO ops_hosted_read_schedule_occurrence
          (occurrence_id, schedule_id, due_at, job_id, materialized_at)
         VALUES ($1, $2, $3, $4, $5)`,
          [
            materialized.occurrenceId,
            materialized.scheduleId,
            materialized.dueAt,
            jobId,
            input.materializedAt,
          ],
        );
        const advanced = await client.query(
          `UPDATE ops_hosted_read_schedule
         SET revision = revision + 1, next_due_at = $1, lease_owner = NULL,
             fencing_token = NULL, lease_expires_at = NULL, updated_at = $2
         WHERE schedule_id = $3 AND revision = $4 AND fencing_token = $5`,
          [
            materialized.nextDueAt,
            input.materializedAt,
            materialized.scheduleId,
            input.claim.schedule.revision,
            input.claim.fencingToken,
          ],
        );
        if (advanced.rowCount !== 1) throw new ScheduleMaterializationConflict();
        return materialized;
      });
    } catch (error) {
      if (error instanceof ScheduleMaterializationConflict) return 'conflict';
      throw error;
    }
  }

  async recoverExpired(input: { now: string; limit: number }): Promise<number> {
    const result = await this.pool.query(
      `WITH expired AS (
         SELECT schedule_id FROM ops_hosted_read_schedule
         WHERE lease_expires_at <= $1
         ORDER BY lease_expires_at, schedule_id
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       UPDATE ops_hosted_read_schedule AS schedule
       SET lease_owner = NULL, fencing_token = NULL, lease_expires_at = NULL, updated_at = $1
       FROM expired
       WHERE schedule.schedule_id = expired.schedule_id AND schedule.lease_expires_at <= $1`,
      [input.now, input.limit],
    );
    return result.rowCount ?? 0;
  }
}

async function insertCredentialVersion(
  client: PoolClient,
  version: HostedCredentialVersion,
): Promise<void> {
  await client.query(
    `INSERT INTO ops_hosted_credential_version
      (credential_id, version, algorithm, key_id, wrapped_data_key, nonce, ciphertext, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      version.credentialId,
      version.version,
      version.envelope.algorithm,
      version.envelope.keyId,
      version.envelope.wrappedDataKey,
      version.envelope.nonce,
      version.envelope.ciphertext,
      version.createdAt,
    ],
  );
}

export class PostgresHostedCredentialStore implements HostedCredentialStore {
  readonly durability = 'durable' as const;
  readonly atomicLifecycle = true as const;

  constructor(private readonly pool: HostedReadPostgresPool) {}

  async create(bundle: HostedCredentialBundle): Promise<'stored' | 'conflict'> {
    const record = hostedCredentialRecordSchema.parse(bundle.record);
    const version = hostedCredentialVersionSchema.parse(bundle.version);
    if (
      record.revision !== 1 ||
      record.activeVersion !== 1 ||
      record.state !== 'active' ||
      version.credentialId !== record.credentialId ||
      version.version !== 1 ||
      version.envelope.keyId !== record.keyId
    ) {
      throw safeStateError();
    }
    return transaction(this.pool, async (client) => {
      const inserted = await client.query(
        `INSERT INTO ops_hosted_credential
          (credential_id, scope_id, project_id, connection_id, provider, secret_kind,
           key_id, revision, active_version, state, metadata_json, created_at, updated_at,
           revoked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, NULL)
         ON CONFLICT DO NOTHING`,
        [
          record.credentialId,
          record.scopeId,
          record.projectId,
          record.connectionId,
          record.provider,
          record.secretKind,
          record.keyId,
          record.revision,
          record.activeVersion,
          record.state,
          json(record.metadata),
          record.createdAt,
          record.updatedAt,
        ],
      );
      if (inserted.rowCount !== 1) return 'conflict';
      await insertCredentialVersion(client, version);
      return 'stored';
    });
  }

  async rotate(input: {
    record: HostedCredentialRecord;
    version: HostedCredentialVersion;
    expectedRevision: number;
  }): Promise<'stored' | 'not-found' | 'conflict'> {
    const record = hostedCredentialRecordSchema.parse(input.record);
    const version = hostedCredentialVersionSchema.parse(input.version);
    return transaction(this.pool, async (client) => {
      const currentResult = await client.query<HostedCredentialRow>(
        `SELECT * FROM ops_hosted_credential
         WHERE credential_id = $1 AND scope_id = $2 AND project_id = $3
         FOR UPDATE`,
        [record.credentialId, record.scopeId, record.projectId],
      );
      const currentRow = currentResult.rows[0];
      if (!currentRow) return 'not-found';
      const current = rowToCredential(currentRow);
      if (
        current.revision !== input.expectedRevision ||
        current.state !== 'active' ||
        record.revision !== current.revision + 1 ||
        record.activeVersion !== (current.activeVersion ?? 0) + 1 ||
        version.version !== record.activeVersion ||
        version.credentialId !== record.credentialId ||
        version.envelope.keyId !== record.keyId ||
        record.connectionId !== current.connectionId ||
        record.provider !== current.provider ||
        record.secretKind !== current.secretKind ||
        canonicalMetadata(record.metadata) !== canonicalMetadata(current.metadata) ||
        record.createdAt !== current.createdAt
      ) {
        return 'conflict';
      }
      await insertCredentialVersion(client, version);
      const updated = await client.query(
        `UPDATE ops_hosted_credential
         SET key_id = $1, revision = $2, active_version = $3, updated_at = $4
         WHERE credential_id = $5 AND revision = $6 AND state = 'active'`,
        [
          record.keyId,
          record.revision,
          record.activeVersion,
          record.updatedAt,
          record.credentialId,
          input.expectedRevision,
        ],
      );
      return updated.rowCount === 1 ? 'stored' : 'conflict';
    });
  }

  async revoke(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    expectedRevision: number;
    revokedAt: string;
  }): Promise<HostedCredentialRecord | 'not-found' | 'conflict'> {
    return transaction(this.pool, async (client) => {
      const currentResult = await client.query<HostedCredentialRow>(
        `SELECT * FROM ops_hosted_credential
         WHERE credential_id = $1 AND scope_id = $2 AND project_id = $3
         FOR UPDATE`,
        [input.credentialId, input.scopeId, input.projectId],
      );
      const row = currentResult.rows[0];
      if (!row) return 'not-found';
      const current = rowToCredential(row);
      if (current.revision !== input.expectedRevision || current.state !== 'active') {
        return 'conflict';
      }
      const updated = await client.query<HostedCredentialRow>(
        `UPDATE ops_hosted_credential
         SET revision = revision + 1, state = 'revoked', active_version = NULL,
             updated_at = $1, revoked_at = $1
         WHERE credential_id = $2 AND revision = $3 AND state = 'active'
         RETURNING *`,
        [input.revokedAt, input.credentialId, input.expectedRevision],
      );
      return updated.rows[0] ? rowToCredential(updated.rows[0]) : 'conflict';
    });
  }

  async getActiveVersion(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    version: number;
  }): Promise<HostedCredentialBundle | null> {
    const result = await this.pool.query<HostedCredentialRow & HostedCredentialVersionRow>(
      `SELECT credential.*, version.algorithm, version.key_id AS version_key_id,
              version.wrapped_data_key, version.nonce, version.ciphertext,
              version.created_at AS version_created_at, version.version
       FROM ops_hosted_credential AS credential
       JOIN ops_hosted_credential_version AS version
         ON version.credential_id = credential.credential_id
        AND version.version = credential.active_version
       WHERE credential.credential_id = $1
         AND credential.scope_id = $2
         AND credential.project_id = $3
         AND credential.state = 'active'
         AND credential.active_version = $4`,
      [input.credentialId, input.scopeId, input.projectId, input.version],
    );
    const row = result.rows[0] as
      | (HostedCredentialRow & {
          version: number;
          algorithm: string;
          version_key_id: string;
          wrapped_data_key: string;
          nonce: string;
          ciphertext: string;
          version_created_at: Date | string;
        })
      | undefined;
    if (!row) return null;
    return {
      record: rowToCredential(row),
      version: rowToCredentialVersion({
        credential_id: row.credential_id,
        version: row.version,
        algorithm: row.algorithm,
        key_id: row.version_key_id,
        wrapped_data_key: row.wrapped_data_key,
        nonce: row.nonce,
        ciphertext: row.ciphertext,
        created_at: row.version_created_at,
      }),
    };
  }
}

export function createPostgresHostedReadPersistence(pool: HostedReadPostgresPool): {
  store: PostgresHostedReadJobStore;
  results: HostedReadResultStore;
  dispatch: HostedReadDispatchStore;
  schedules: PostgresHostedReadScheduleStore;
  credentials: PostgresHostedCredentialStore;
} {
  return {
    store: new PostgresHostedReadJobStore(pool),
    results: new PostgresHostedReadResultStore(pool),
    dispatch: new PostgresHostedReadDispatchStore(pool),
    schedules: new PostgresHostedReadScheduleStore(pool),
    credentials: new PostgresHostedCredentialStore(pool),
  };
}
