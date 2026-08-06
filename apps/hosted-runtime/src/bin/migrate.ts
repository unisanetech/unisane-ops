#!/usr/bin/env node
import { Pool } from 'pg';
import {
  assertPostgresHostedReadSchema,
  configurePostgresHostedReadRuntimeRoles,
  migratePostgresHostedReadPersistence,
} from '@unisane/ops-hosted-postgresql';
import { readHostedMigrationProcessConfig } from '../config.js';

async function main(): Promise<void> {
  const config = readHostedMigrationProcessConfig(process.env);
  const pool = new Pool({ connectionString: config.OPS_HOSTED_POSTGRES_URL });
  try {
    await migratePostgresHostedReadPersistence(pool);
    if (
      config.OPS_HOSTED_GATEWAY_DB_ROLE &&
      config.OPS_HOSTED_WORKER_DB_ROLE &&
      config.OPS_HOSTED_SCHEDULER_DB_ROLE
    ) {
      await configurePostgresHostedReadRuntimeRoles(pool, {
        gatewayRole: config.OPS_HOSTED_GATEWAY_DB_ROLE,
        workerRole: config.OPS_HOSTED_WORKER_DB_ROLE,
        schedulerRole: config.OPS_HOSTED_SCHEDULER_DB_ROLE,
      });
    }
    await assertPostgresHostedReadSchema(pool);
    process.stdout.write(`${JSON.stringify({ kind: 'schema.ready', role: 'migration' })}\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ kind: 'role.fatal', role: 'migration', code: error instanceof Error ? error.name : 'unknown-error' })}\n`,
  );
  process.exitCode = 1;
});
