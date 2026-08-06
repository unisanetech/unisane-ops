import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import type { HostedReadAdmissionRequest, HostedReadJob } from '@unisane/ops-engine/hosted';
import { createHostedGatewayHttpTransport } from './gateway-http.js';

const request: HostedReadAdmissionRequest = {
  schemaVersion: 1,
  audience: 'unisane.ops',
  evidenceRevision: 'evidence.1',
  action: {
    schemaVersion: 1,
    actionId: 'growth.health.review',
    actionSchemaVersion: 1,
    idempotencyKey: 'request.1',
    context: {
      requestId: 'request.1',
      scopeId: 'workspace.acme',
      projectId: 'project.acme',
      environmentId: 'production',
      principal: { kind: 'service', id: 'service.gateway' },
      requestedAt: '2026-08-04T00:00:00.000Z',
    },
    input: {},
  },
};

const job: HostedReadJob = {
  schemaVersion: 1,
  kind: 'ops.hosted-read-job',
  jobId: 'read.request.1',
  revision: 1,
  phase: 'queued',
  request,
  result: null,
  failure: null,
  lease: null,
  createdAt: '2026-08-04T00:00:00.000Z',
  updatedAt: '2026-08-04T00:00:00.000Z',
};

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

describe('hosted gateway HTTP transport', () => {
  it('serves probes and authenticated bounded read-action admission', async () => {
    const port = await availablePort();
    const controller = new AbortController();
    const admit = vi.fn(async () => job);
    const get = vi.fn(async () => job);
    const transport = createHostedGatewayHttpTransport({
      host: '127.0.0.1',
      port,
      maximumBodyBytes: 10_000,
      readiness: () => true,
    });
    const running = transport.serve({ gateway: { admit, get }, signal: controller.signal });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const base = `http://127.0.0.1:${port}`;

    await expect(fetch(`${base}/live`).then((response) => response.status)).resolves.toBe(200);
    await expect(fetch(`${base}/ready`).then((response) => response.status)).resolves.toBe(200);
    await expect(
      fetch(`${base}/internal/v1/read-actions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      }).then((response) => response.status),
    ).resolves.toBe(401);
    await expect(
      fetch(`${base}/internal/v1/read-actions`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer signed-workload-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
      }).then((response) => response.status),
    ).resolves.toBe(202);
    expect(admit).toHaveBeenCalledWith({
      request,
      authentication: { scheme: 'bearer', token: 'signed-workload-token' },
    });
    await expect(
      fetch(`${base}/internal/v1/credentials/credential.google.primary`, {
        headers: { authorization: 'Bearer signed-workload-token' },
      }).then((response) => response.status),
    ).resolves.toBe(404);

    controller.abort();
    await running;
  });
});
