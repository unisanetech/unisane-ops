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
  {
    id: '002-hosted-read-identity-boundary',
    sql: `
      ALTER TABLE ops_hosted_read_job
        ADD COLUMN scope_id text,
        ADD COLUMN project_id text,
        ADD COLUMN principal_id text;

      UPDATE ops_hosted_read_job
      SET scope_id = request_json #>> '{action,context,scopeId}',
          project_id = request_json #>> '{action,context,projectId}',
          principal_id = request_json #>> '{action,context,principal,id}';

      ALTER TABLE ops_hosted_read_job
        ALTER COLUMN scope_id SET NOT NULL,
        ALTER COLUMN project_id SET NOT NULL,
        ALTER COLUMN principal_id SET NOT NULL;

      CREATE INDEX ops_hosted_read_job_authorized_idx
        ON ops_hosted_read_job (job_id, principal_id, scope_id, project_id);
    `,
  },
  {
    id: '003-hosted-read-scheduler',
    sql: `
      CREATE TABLE ops_hosted_read_schedule (
        schedule_id text PRIMARY KEY,
        revision integer NOT NULL CHECK (revision > 0),
        enabled boolean NOT NULL,
        evidence_revision text NOT NULL,
        action_json jsonb NOT NULL,
        cadence_ms integer NOT NULL CHECK (cadence_ms >= 60000),
        next_due_at timestamptz NOT NULL,
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

      CREATE INDEX ops_hosted_read_schedule_due_idx
        ON ops_hosted_read_schedule (next_due_at, schedule_id)
        WHERE enabled;

      CREATE TABLE ops_hosted_read_schedule_occurrence (
        occurrence_id text PRIMARY KEY,
        schedule_id text NOT NULL REFERENCES ops_hosted_read_schedule(schedule_id),
        due_at timestamptz NOT NULL,
        job_id text NOT NULL UNIQUE REFERENCES ops_hosted_read_job(job_id),
        materialized_at timestamptz NOT NULL,
        UNIQUE (schedule_id, due_at)
      );
    `,
  },
  {
    id: '004-hosted-credential-custody',
    sql: `
      CREATE TABLE ops_hosted_credential (
        credential_id text PRIMARY KEY,
        scope_id text NOT NULL,
        project_id text NOT NULL,
        connection_id text NOT NULL,
        provider text NOT NULL,
        secret_kind text NOT NULL,
        key_id text NOT NULL,
        revision integer NOT NULL CHECK (revision > 0),
        active_version integer CHECK (active_version > 0),
        state text NOT NULL CHECK (state IN ('active', 'revoked')),
        metadata_json jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        revoked_at timestamptz,
        UNIQUE (scope_id, project_id, connection_id, provider, secret_kind),
        CHECK (
          (state = 'active' AND active_version IS NOT NULL AND revoked_at IS NULL)
          OR
          (state = 'revoked' AND active_version IS NULL AND revoked_at IS NOT NULL)
        )
      );

      CREATE INDEX ops_hosted_credential_worker_lookup_idx
        ON ops_hosted_credential
        (credential_id, scope_id, project_id, active_version)
        WHERE state = 'active';

      CREATE TABLE ops_hosted_credential_version (
        credential_id text NOT NULL REFERENCES ops_hosted_credential(credential_id),
        version integer NOT NULL CHECK (version > 0),
        algorithm text NOT NULL,
        key_id text NOT NULL,
        wrapped_data_key text NOT NULL,
        nonce text NOT NULL,
        ciphertext text NOT NULL,
        created_at timestamptz NOT NULL,
        PRIMARY KEY (credential_id, version)
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

export async function assertPostgresHostedReadSchema(pool: Pick<Pool, 'query'>): Promise<void> {
  const result = await pool.query<{ id: string }>(
    'SELECT id FROM ops_hosted_schema_migration ORDER BY id',
  );
  const expected = hostedReadPostgresMigrations.map((migration) => migration.id);
  const actual = result.rows.map((row) => row.id);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Hosted PostgreSQL schema revision is not compatible with this runtime.');
  }
}

export interface HostedReadPostgresRuntimeRoles {
  gatewayRole: string;
  workerRole: string;
  schedulerRole: string;
}

function roleIdentifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(value)) {
    throw new Error('Hosted PostgreSQL role name is invalid.');
  }
  return `"${value}"`;
}

export async function configurePostgresHostedReadRuntimeRoles(
  pool: Pick<Pool, 'connect'>,
  roles: HostedReadPostgresRuntimeRoles,
): Promise<void> {
  if (
    roles.gatewayRole === roles.workerRole ||
    roles.schedulerRole === roles.gatewayRole ||
    roles.schedulerRole === roles.workerRole
  ) {
    throw new Error('Hosted PostgreSQL runtime roles must be distinct.');
  }
  const gateway = roleIdentifier(roles.gatewayRole);
  const worker = roleIdentifier(roles.workerRole);
  const scheduler = roleIdentifier(roles.schedulerRole);
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    const available = await client.query<{ rolname: string }>(
      'SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])',
      [[roles.gatewayRole, roles.workerRole, roles.schedulerRole]],
    );
    if (available.rowCount !== 3) {
      throw new Error('Hosted PostgreSQL runtime roles must be provisioned before grants.');
    }
    await client.query('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC');
    await client.query(`GRANT USAGE ON SCHEMA public TO ${gateway}, ${worker}, ${scheduler}`);
    await client.query(
      `GRANT SELECT, INSERT ON ops_hosted_read_job TO ${gateway};
       GRANT INSERT ON ops_hosted_read_dispatch, ops_hosted_read_audit TO ${gateway};
       GRANT SELECT, INSERT, UPDATE ON ops_hosted_credential TO ${gateway};
       GRANT INSERT ON ops_hosted_credential_version TO ${gateway};`,
    );
    await client.query(
      `GRANT SELECT, UPDATE ON ops_hosted_read_job, ops_hosted_read_dispatch TO ${worker};
       GRANT SELECT, INSERT ON ops_hosted_read_result TO ${worker};
       GRANT INSERT ON ops_hosted_read_audit TO ${worker};
       GRANT SELECT ON ops_hosted_credential, ops_hosted_credential_version TO ${worker};`,
    );
    await client.query(
      `GRANT SELECT, INSERT, UPDATE ON ops_hosted_read_schedule TO ${scheduler};
       GRANT SELECT, INSERT ON ops_hosted_read_schedule_occurrence TO ${scheduler};
       GRANT SELECT, INSERT ON ops_hosted_read_job TO ${scheduler};
       GRANT INSERT ON ops_hosted_read_dispatch, ops_hosted_read_audit TO ${scheduler};`,
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
