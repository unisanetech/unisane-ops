#!/usr/bin/env node
import { Pool } from 'pg';
import {
  assertPostgresHostedReadSchema,
  createPostgresHostedReadPersistence,
} from '@unisane/ops-hosted-postgresql';
import { readHostedWorkerProcessConfig } from '../config.js';
import { createHostedWorkerProcess } from '../worker-process.js';
import { createHostedWorkerRole } from '../worker.js';
import {
  awaitRoleShutdown,
  createJsonLineObserver,
  loadHostedActions,
  processAbortSignal,
} from './shared.js';

async function main(): Promise<void> {
  const config = readHostedWorkerProcessConfig(process.env);
  const actions = await loadHostedActions(config.OPS_HOSTED_ACTION_MODULE);
  const pool = new Pool({ connectionString: config.OPS_HOSTED_POSTGRES_URL });
  const persistence = createPostgresHostedReadPersistence(pool);
  const worker = createHostedWorkerRole({
    owner: config.OPS_HOSTED_WORKER_ID,
    leaseMs: config.OPS_HOSTED_LEASE_MS,
    maximumResultBytes: config.OPS_HOSTED_MAXIMUM_RESULT_BYTES,
    store: persistence.store,
    results: persistence.results,
    actions,
  });
  const role = createHostedWorkerProcess({
    owner: config.OPS_HOSTED_WORKER_ID,
    pollMs: config.OPS_HOSTED_POLL_MS,
    dispatchLeaseMs: config.OPS_HOSTED_LEASE_MS,
    retryMs: config.OPS_HOSTED_RETRY_MS,
    recoveryLimit: config.OPS_HOSTED_RECOVERY_LIMIT,
    worker,
    dispatch: persistence.dispatch,
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
    `${JSON.stringify({ kind: 'role.fatal', role: 'worker', code: error instanceof Error ? error.name : 'unknown-error' })}\n`,
  );
  process.exitCode = 1;
});
