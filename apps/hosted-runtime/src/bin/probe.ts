#!/usr/bin/env node
import { Pool } from 'pg';
import { assertPostgresHostedReadSchema } from '@unisane/ops-hosted-postgresql';
import { readHostedMigrationProcessConfig } from '../config.js';

async function main(): Promise<void> {
  const config = readHostedMigrationProcessConfig(process.env);
  const pool = new Pool({ connectionString: config.OPS_HOSTED_POSTGRES_URL });
  try {
    await assertPostgresHostedReadSchema(pool);
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  process.exitCode = 1;
});
