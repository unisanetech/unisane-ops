import { createHash } from 'node:crypto';
import { OpsActionExecutionError } from './actions.js';
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
} from './hosted-read.js';

interface SqliteRunResult {
  changes: number | bigint;
}

interface SqliteStatement {
  run(...parameters: unknown[]): SqliteRunResult;
  get(...parameters: unknown[]): unknown;
}

export interface HostedReadSqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

interface SqliteRow {
  [key: string]: unknown;
}

function asRow(input: unknown): SqliteRow | null {
  return input && typeof input === 'object' ? (input as SqliteRow) : null;
}

function stringColumn(row: SqliteRow, name: string): string {
  const value = row[name];
  if (typeof value !== 'string') {
    throw new OpsActionExecutionError('hosted-state-invalid', 'Stored hosted state is invalid.');
  }
  return value;
}

function nullableStringColumn(row: SqliteRow, name: string): string | null {
  const value = row[name];
  if (value === null) return null;
  return stringColumn(row, name);
}

function numberColumn(row: SqliteRow, name: string): number {
  const value = row[name];
  if (typeof value !== 'number' && typeof value !== 'bigint') {
    throw new OpsActionExecutionError('hosted-state-invalid', 'Stored hosted state is invalid.');
  }
  return Number(value);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new OpsActionExecutionError('hosted-state-invalid', 'Stored hosted state is invalid.');
  }
}

function rowToJob(row: SqliteRow): HostedReadJob {
  const result = nullableStringColumn(row, 'result_json');
  const failure = nullableStringColumn(row, 'failure_json');
  const leaseOwner = nullableStringColumn(row, 'lease_owner');
  const fencingToken = nullableStringColumn(row, 'fencing_token');
  const leaseExpiresAt = nullableStringColumn(row, 'lease_expires_at');
  return hostedReadJobSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-read-job',
    jobId: stringColumn(row, 'job_id'),
    revision: numberColumn(row, 'revision'),
    phase: stringColumn(row, 'phase'),
    request: parseJson(stringColumn(row, 'request_json')),
    result: result ? parseJson(result) : null,
    failure: failure ? parseJson(failure) : null,
    lease:
      leaseOwner && fencingToken && leaseExpiresAt
        ? { owner: leaseOwner, fencingToken, expiresAt: leaseExpiresAt }
        : null,
    createdAt: stringColumn(row, 'created_at'),
    updatedAt: stringColumn(row, 'updated_at'),
  });
}

function withTransaction<T>(database: HostedReadSqliteDatabase, operation: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function insertAudit(database: HostedReadSqliteDatabase, audit: HostedReadAuditFact): void {
  database
    .prepare(
      `INSERT INTO hosted_read_audit
        (id, kind, job_id, principal_id, scope_id, action_id, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      audit.id,
      audit.kind,
      audit.jobId,
      audit.principalId,
      audit.scopeId,
      audit.actionId,
      audit.occurredAt,
    );
}

function insertDispatch(
  database: HostedReadSqliteDatabase,
  dispatch: HostedReadDispatchIntent,
): void {
  database
    .prepare(
      `INSERT INTO hosted_read_dispatch (id, job_id, available_at)
       VALUES (?, ?, ?)`,
    )
    .run(dispatch.id, dispatch.jobId, dispatch.availableAt);
}

function getJob(database: HostedReadSqliteDatabase, jobId: string): HostedReadJob | null {
  const row = asRow(database.prepare('SELECT * FROM hosted_read_job WHERE job_id = ?').get(jobId));
  return row ? rowToJob(row) : null;
}

function initialize(database: HostedReadSqliteDatabase): void {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS hosted_read_job (
      job_id TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      phase TEXT NOT NULL,
      request_json TEXT NOT NULL,
      result_json TEXT,
      failure_json TEXT,
      lease_owner TEXT,
      fencing_token TEXT,
      lease_expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hosted_read_dispatch (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES hosted_read_job(job_id),
      available_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hosted_read_audit (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      job_id TEXT NOT NULL REFERENCES hosted_read_job(job_id),
      principal_id TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hosted_read_result (
      artifact_id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES hosted_read_job(job_id),
      action_id TEXT NOT NULL,
      value_json TEXT NOT NULL,
      byte_length INTEGER NOT NULL,
      digest TEXT NOT NULL
    );
  `);
}

class SqliteHostedReadJobStore implements HostedReadJobStore {
  readonly durability = 'durable' as const;
  readonly atomic = true as const;

  constructor(private readonly database: HostedReadSqliteDatabase) {}

  async admit(bundle: HostedReadAdmissionBundle) {
    return withTransaction(this.database, () => {
      const existing = getJob(this.database, bundle.job.jobId);
      if (existing) {
        return JSON.stringify(existing.request) === JSON.stringify(bundle.job.request)
          ? ({ status: 'existing', job: existing } as const)
          : ({ status: 'conflict' } as const);
      }
      this.database
        .prepare(
          `INSERT INTO hosted_read_job
            (job_id, revision, phase, request_json, result_json, failure_json,
             lease_owner, fencing_token, lease_expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
        )
        .run(
          bundle.job.jobId,
          bundle.job.revision,
          bundle.job.phase,
          JSON.stringify(bundle.job.request),
          bundle.job.createdAt,
          bundle.job.updatedAt,
        );
      insertDispatch(this.database, bundle.dispatch);
      insertAudit(this.database, bundle.audit);
      return { status: 'stored', job: bundle.job } as const;
    });
  }

  async get(jobId: string) {
    return getJob(this.database, jobId);
  }

  async claim(input: {
    jobId: string;
    expectedRevision: number;
    owner: string;
    now: string;
    expiresAt: string;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadClaim | 'conflict'> {
    return withTransaction(this.database, () => {
      const fencingToken = `${input.owner}.${input.expectedRevision + 1}`;
      const update = this.database
        .prepare(
          `UPDATE hosted_read_job
           SET revision = revision + 1, phase = 'running', lease_owner = ?,
               fencing_token = ?, lease_expires_at = ?, updated_at = ?
           WHERE job_id = ? AND revision = ? AND phase = 'queued'`,
        )
        .run(
          input.owner,
          fencingToken,
          input.expiresAt,
          input.now,
          input.jobId,
          input.expectedRevision,
        );
      if (Number(update.changes) !== 1) return 'conflict' as const;
      insertAudit(this.database, input.audit);
      const job = getJob(this.database, input.jobId);
      if (!job)
        throw new OpsActionExecutionError(
          'hosted-state-invalid',
          'Stored hosted state is invalid.',
        );
      return { job, fencingToken };
    });
  }

  async complete(input: {
    job: HostedReadJob;
    expectedRevision: number;
    fencingToken: string;
    audit: HostedReadAuditFact;
  }) {
    return withTransaction(this.database, () => {
      const update = this.database
        .prepare(
          `UPDATE hosted_read_job
           SET revision = ?, phase = ?, result_json = ?, failure_json = ?,
               lease_owner = NULL, fencing_token = NULL, lease_expires_at = NULL,
               updated_at = ?
           WHERE job_id = ? AND revision = ? AND fencing_token = ? AND phase = 'running'`,
        )
        .run(
          input.job.revision,
          input.job.phase,
          input.job.result ? JSON.stringify(input.job.result) : null,
          input.job.failure ? JSON.stringify(input.job.failure) : null,
          input.job.updatedAt,
          input.job.jobId,
          input.expectedRevision,
          input.fencingToken,
        );
      if (Number(update.changes) !== 1) return 'conflict' as const;
      insertAudit(this.database, input.audit);
      return 'stored' as const;
    });
  }

  async recover(input: {
    jobId: string;
    expectedRevision: number;
    now: string;
    dispatch: HostedReadDispatchIntent;
    audit: HostedReadAuditFact;
  }) {
    return withTransaction(this.database, () => {
      const current = getJob(this.database, input.jobId);
      if (!current || current.revision !== input.expectedRevision || current.phase !== 'running') {
        return 'conflict' as const;
      }
      if (!current.lease || Date.parse(current.lease.expiresAt) > Date.parse(input.now)) {
        return 'not-expired' as const;
      }
      const update = this.database
        .prepare(
          `UPDATE hosted_read_job
           SET revision = revision + 1, phase = 'queued', lease_owner = NULL,
               fencing_token = NULL, lease_expires_at = NULL, updated_at = ?
           WHERE job_id = ? AND revision = ? AND phase = 'running'`,
        )
        .run(input.now, input.jobId, input.expectedRevision);
      if (Number(update.changes) !== 1) return 'conflict' as const;
      insertDispatch(this.database, input.dispatch);
      insertAudit(this.database, input.audit);
      const recovered = getJob(this.database, input.jobId);
      if (!recovered) {
        throw new OpsActionExecutionError(
          'hosted-state-invalid',
          'Stored hosted state is invalid.',
        );
      }
      return recovered;
    });
  }
}

class SqliteHostedReadResultStore implements HostedReadResultStore {
  readonly durability = 'durable' as const;

  constructor(private readonly database: HostedReadSqliteDatabase) {}

  async put(input: { jobId: string; actionId: string; value: unknown; byteLength: number }) {
    const valueJson = JSON.stringify(input.value);
    if (valueJson === undefined) {
      throw new OpsActionExecutionError(
        'invalid-action-result',
        'The action result is not serializable.',
      );
    }
    const reference: HostedReadResultReference = {
      artifactId: `${input.jobId}.result`,
      byteLength: input.byteLength,
      digest: createHash('sha256').update(valueJson).digest('hex'),
    };
    return withTransaction(this.database, () => {
      const existing = asRow(
        this.database
          .prepare('SELECT byte_length, digest FROM hosted_read_result WHERE artifact_id = ?')
          .get(reference.artifactId),
      );
      if (existing) {
        if (
          numberColumn(existing, 'byte_length') !== reference.byteLength ||
          stringColumn(existing, 'digest') !== reference.digest
        ) {
          throw new OpsActionExecutionError(
            'result-conflict',
            'The result identity is already bound to different content.',
          );
        }
        return reference;
      }
      this.database
        .prepare(
          `INSERT INTO hosted_read_result
            (artifact_id, job_id, action_id, value_json, byte_length, digest)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          reference.artifactId,
          input.jobId,
          input.actionId,
          valueJson,
          reference.byteLength,
          reference.digest,
        );
      return reference;
    });
  }
}

export function createSqliteHostedReadPersistence(database: HostedReadSqliteDatabase): {
  store: HostedReadJobStore;
  results: HostedReadResultStore;
} {
  initialize(database);
  return {
    store: new SqliteHostedReadJobStore(database),
    results: new SqliteHostedReadResultStore(database),
  };
}
