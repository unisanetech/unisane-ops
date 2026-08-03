import type { Pool, PoolClient } from 'pg';

export interface HostedReadPostgresMigration {
  id: string;
  sql: string;
}

export const hostedReadPostgresMigrations: readonly HostedReadPostgresMigration[] = [
  {
    id: '001-hosted-read-spine',
    sql: `
      CREATE TABLE ops_hosted_read_job (
        job_id text PRIMARY KEY,
        revision integer NOT NULL CHECK (revision > 0),
        phase text NOT NULL CHECK (phase IN ('queued', 'running', 'succeeded', 'failed')),
        request_json jsonb NOT NULL,
        request_digest text NOT NULL,
        result_json jsonb,
        failure_json jsonb,
        lease_owner text,
        fencing_token text,
        lease_expires_at timestamptz,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        CHECK (
          (lease_owner IS NULL AND fencing_token IS NULL AND lease_expires_at IS NULL)
          OR
          (lease_owner IS NOT NULL AND fencing_token IS NOT NULL AND lease_expires_at IS NOT NULL)
        )
      );

      CREATE TABLE ops_hosted_read_dispatch (
        id text PRIMARY KEY,
        job_id text NOT NULL REFERENCES ops_hosted_read_job(job_id),
        available_at timestamptz NOT NULL,
        claim_owner text,
        claim_token text,
        claim_expires_at timestamptz,
        completed_at timestamptz,
        failure_code text,
        CHECK (
          (claim_owner IS NULL AND claim_token IS NULL AND claim_expires_at IS NULL)
          OR
          (claim_owner IS NOT NULL AND claim_token IS NOT NULL AND claim_expires_at IS NOT NULL)
        )
      );

      CREATE INDEX ops_hosted_read_dispatch_available_idx
        ON ops_hosted_read_dispatch (available_at, id)
        WHERE completed_at IS NULL;

      CREATE TABLE ops_hosted_read_audit (
        id text PRIMARY KEY,
        kind text NOT NULL CHECK (kind IN ('admitted', 'started', 'recovered', 'succeeded', 'failed')),
        job_id text NOT NULL REFERENCES ops_hosted_read_job(job_id),
        principal_id text NOT NULL,
        scope_id text NOT NULL,
        action_id text NOT NULL,
        occurred_at timestamptz NOT NULL
      );

      CREATE INDEX ops_hosted_read_audit_job_idx
        ON ops_hosted_read_audit (job_id, occurred_at, id);

      CREATE TABLE ops_hosted_read_result (
        artifact_id text PRIMARY KEY,
        job_id text NOT NULL REFERENCES ops_hosted_read_job(job_id),
        action_id text NOT NULL,
        value_json jsonb NOT NULL,
        byte_length integer NOT NULL CHECK (byte_length >= 0),
        digest text NOT NULL
      );
    `,
  },
];

async function migrate(client: PoolClient): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock($1)', [1_920_817_341]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ops_hosted_schema_migration (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
      )
    `);
    for (const migration of hostedReadPostgresMigrations) {
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM ops_hosted_schema_migration WHERE id = $1',
        [migration.id],
      );
      if (existing.rowCount) continue;
      await client.query(migration.sql);
      await client.query('INSERT INTO ops_hosted_schema_migration (id) VALUES ($1)', [
        migration.id,
      ]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function migratePostgresHostedReadPersistence(
  pool: Pick<Pool, 'connect'>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await migrate(client);
  } finally {
    client.release();
  }
}
