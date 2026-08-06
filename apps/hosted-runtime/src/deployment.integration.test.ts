import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migratePostgresHostedReadPersistence } from '@unisane/ops-hosted-postgresql';

const sourceUrl = process.env.OPS_POSTGRES_TEST_URL;
const integration = sourceUrl ? describe : describe.skip;
const schema = `ops_deploy_${randomUUID().replaceAll('-', '')}`;
const admin = sourceUrl ? new Pool({ connectionString: sourceUrl }) : null;
let scopedUrl = '';

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address && typeof address === 'object' ? address.port : 0;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function start(entry: string, environment: Record<string, string>): ChildProcess {
  return spawn(process.execPath, [entry], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, ...environment },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function waitForLine(child: ChildProcess, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${value}`)), 10_000);
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8');
      if (output.includes(value)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once('exit', (code) => reject(new Error(`Hosted role exited early with ${code}`)));
  });
}

function stop(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => {
    child.once('exit', resolve);
    child.kill('SIGTERM');
  });
}

integration('hosted deployment artifacts', () => {
  beforeAll(async () => {
    if (!admin || !sourceUrl) return;
    await admin.query(`CREATE SCHEMA ${schema}`);
    const url = new URL(sourceUrl);
    url.searchParams.set('options', `-c search_path=${schema}`);
    scopedUrl = url.toString();
    const pool = new Pool({ connectionString: scopedUrl });
    await migratePostgresHostedReadPersistence(pool);
    await pool.end();
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  it('admits and executes through separate authenticated gateway and worker processes', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const key = await exportJWK(publicKey);
    key.kid = 'deployment-key';
    const jwksPort = await availablePort();
    const issuer = `http://127.0.0.1:${jwksPort}`;
    const jwksServer = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ keys: [key] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(jwksPort, '127.0.0.1', resolve));
    const gatewayPort = await availablePort();
    const root = fileURLToPath(new URL('..', import.meta.url));
    const gateway = start(`${root}/dist/bin/gateway.js`, {
      OPS_HOSTED_ROLE: 'gateway',
      OPS_HOSTED_POSTGRES_URL: scopedUrl,
      OPS_HOSTED_HTTP_HOST: '127.0.0.1',
      OPS_HOSTED_HTTP_PORT: String(gatewayPort),
      OPS_HOSTED_OIDC_ISSUER: issuer,
      OPS_HOSTED_OIDC_JWKS_URL: `${issuer}/jwks.json`,
    });
    const worker = start(`${root}/dist/bin/worker.js`, {
      OPS_HOSTED_ROLE: 'worker',
      OPS_HOSTED_POSTGRES_URL: scopedUrl,
      OPS_HOSTED_WORKER_ID: 'worker.deployment',
      OPS_HOSTED_ACTION_MODULE: `${root}/test-fixtures/hosted-actions.mjs`,
      OPS_HOSTED_POLL_MS: '20',
    });
    try {
      await Promise.all([waitForLine(gateway, 'role.ready'), waitForLine(worker, 'role.ready')]);
      const token = await new SignJWT({ scope_ids: ['workspace.acme'] })
        .setProtectedHeader({ alg: 'ES256', kid: key.kid })
        .setIssuer(issuer)
        .setAudience('unisane.ops')
        .setSubject('service.gateway')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
      const base = `http://127.0.0.1:${gatewayPort}`;
      const admission = await fetch(`${base}/internal/v1/read-actions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          schemaVersion: 1,
          audience: 'unisane.ops',
          evidenceRevision: 'evidence.deployment',
          action: {
            schemaVersion: 1,
            actionId: 'growth.health.review',
            actionSchemaVersion: 1,
            idempotencyKey: 'request.deployment',
            context: {
              requestId: 'request.deployment',
              scopeId: 'workspace.acme',
              projectId: 'project.acme',
              environmentId: 'production',
              principal: { kind: 'service', id: 'service.gateway' },
              requestedAt: new Date().toISOString(),
            },
            input: { project: 'acme' },
          },
        }),
      });
      expect(admission.status).toBe(202);
      const admitted = (await admission.json()) as { job: { jobId: string } };
      let phase = 'queued';
      for (
        let attempt = 0;
        attempt < 100 && phase !== 'succeeded' && phase !== 'failed';
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        const response = await fetch(`${base}/internal/v1/read-actions/${admitted.job.jobId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const state = (await response.json()) as { job: { phase: string } };
        phase = state.job.phase;
      }
      expect(phase).toBe('succeeded');
      await expect(Promise.all([stop(gateway), stop(worker)])).resolves.toEqual([0, 0]);
    } finally {
      if (gateway.exitCode === null) await stop(gateway);
      if (worker.exitCode === null) await stop(worker);
      await new Promise<void>((resolve, reject) =>
        jwksServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }, 20_000);
});
