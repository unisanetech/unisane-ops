#!/usr/bin/env node
import { Pool } from 'pg';
import {
  assertPostgresHostedReadSchema,
  createPostgresHostedReadPersistence,
} from '@unisane/ops-hosted-postgresql';
import { readHostedSchedulerProcessConfig } from '../config.js';
import { createHostedSchedulerProcess } from '../scheduler-process.js';
import { awaitRoleShutdown, createJsonLineObserver, processAbortSignal } from './shared.js';

async function main(): Promise<void> {
  const config = readHostedSchedulerProcessConfig(process.env);
  const pool = new Pool({ connectionString: config.OPS_HOSTED_POSTGRES_URL });
  const persistence = createPostgresHostedReadPersistence(pool);
  const role = createHostedSchedulerProcess({
    owner: config.OPS_HOSTED_SCHEDULER_ID,
    pollMs: config.OPS_HOSTED_POLL_MS,
    leaseMs: config.OPS_HOSTED_LEASE_MS,
    recoveryLimit: config.OPS_HOSTED_RECOVERY_LIMIT,
    schedules: persistence.schedules,
    probe: async () => assertPostgresHostedReadSchema(pool),
    observer: createJsonLineObserver(),
  });
  try {
    const signal = processAbortSignal();
    await awaitRoleShutdown(role.run(signal), signal, config.OPS_HOSTED_SHUTDOWN_MS);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ kind: 'role.fatal', role: 'scheduler', code: error instanceof Error ? error.name : 'unknown-error' })}\n`,
  );
  process.exitCode = 1;
});
