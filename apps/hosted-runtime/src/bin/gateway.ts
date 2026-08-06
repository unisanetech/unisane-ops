#!/usr/bin/env node
import { Pool } from 'pg';
import {
  assertPostgresHostedReadSchema,
  createPostgresHostedReadPersistence,
} from '@unisane/ops-hosted-postgresql';
import { readHostedGatewayProcessConfig } from '../config.js';
import { createHostedGatewayRole } from '../gateway.js';
import { createHostedGatewayHttpTransport } from '../gateway-http.js';
import { createHostedGatewayProcess } from '../gateway-process.js';
import { createRemoteOidcWorkloadIdentityAuthorizer } from '../identity.js';
import { createJsonLineObserver, awaitRoleShutdown, processAbortSignal } from './shared.js';

async function main(): Promise<void> {
  const config = readHostedGatewayProcessConfig(process.env);
  const pool = new Pool({ connectionString: config.OPS_HOSTED_POSTGRES_URL });
  const persistence = createPostgresHostedReadPersistence(pool);
  const identity = createRemoteOidcWorkloadIdentityAuthorizer({
    issuer: config.OPS_HOSTED_OIDC_ISSUER,
    audience: 'unisane.ops',
    jwksUrl: config.OPS_HOSTED_OIDC_JWKS_URL,
  });
  const gateway = createHostedGatewayRole({ store: persistence.store, identity });
  let ready = false;
  const transport = createHostedGatewayHttpTransport({
    host: config.OPS_HOSTED_HTTP_HOST,
    port: config.OPS_HOSTED_HTTP_PORT,
    maximumBodyBytes: config.OPS_HOSTED_HTTP_BODY_BYTES,
    readiness: () => ready,
  });
  const role = createHostedGatewayProcess({
    gateway,
    transport,
    probe: async () => assertPostgresHostedReadSchema(pool),
    observer: createJsonLineObserver(),
  });
  const signal = processAbortSignal();
  const running = role.run(signal);
  const readiness = setInterval(() => {
    ready = role.health().ready;
  }, 50);
  try {
    await awaitRoleShutdown(running, signal, config.OPS_HOSTED_SHUTDOWN_MS);
  } finally {
    clearInterval(readiness);
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ kind: 'role.fatal', role: 'gateway', code: error instanceof Error ? error.name : 'unknown-error' })}\n`,
  );
  process.exitCode = 1;
});
