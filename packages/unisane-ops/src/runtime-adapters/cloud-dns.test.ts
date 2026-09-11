import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { createCanonicalPackRuntime } from './cloud-dns.js';
import type { CloudflareResourceRuntimeBinding } from '@unisane/cloud/runtime';

it('opens durable Cloudflare production state and retains records across CLI bindings', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cloudflare-host-state-'));
  vi.stubEnv('CLOUDFLARE_TEST_TOKEN', 'synthetic-token');
  const config = {
    project: { id: 'synthetic' }, environments: { production: { production: true } },
    execution: { cloud: { backend: 'sqlite' } },
    connections: { cloudflare: { provider: 'cloudflare', accountId: 'synthetic-account', credential: { source: 'env', name: 'CLOUDFLARE_TEST_TOKEN' } } },
    targets: { async: { provider: 'cloudflare', connection: 'cloudflare', environments: { production: { queues: { jobs: { name: 'synthetic-jobs' } } } } } },
  };
  await writeFile(path.join(root, 'unisane.config.ts'), `export default {}; export const ops = ${JSON.stringify(config)};`);
  try {
    const runtime = createCanonicalPackRuntime();
    const request = { command: 'apply', focus: 'queues', cwd: root, target: 'async', environment: 'production' };
    const first = await runtime.resolveBinding('cloud.resource.cloudflare', request) as CloudflareResourceRuntimeBinding;
    try {
      expect(first.state?.artifacts.durability).toBe('durable');
      expect(first.state?.locks.durability).toBe('durable');
      await first.state!.artifacts.put({ id: 'synthetic-attempt', kind: 'state', value: { reviewed: true }, createdAt: new Date().toISOString(), expiresAt: null });
    } finally { first.close?.(); }
    const next = await runtime.resolveBinding('cloud.resource.cloudflare', request) as CloudflareResourceRuntimeBinding;
    try { expect((await next.state!.artifacts.get('synthetic-attempt'))?.value).toEqual({ reviewed: true }); }
    finally { next.close?.(); }
  } finally {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  }
});
