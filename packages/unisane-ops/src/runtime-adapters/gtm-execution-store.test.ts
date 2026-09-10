import { mkdtemp, rm, mkdir, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { openGtmExecutionStore } from './gtm-execution-store.js';
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function root() {
  const value = await mkdtemp(path.join(tmpdir(), 'gtm-host-store-'));
  roots.push(value);
  return value;
}
it('reopens durable records and prevents selecting local storage to bypass them', async () => {
  const project = await root();
  const first = await openGtmExecutionStore(project, 'sqlite');
  expect(first.state.artifacts.durability).toBe('durable');
  await first.state.artifacts.put({
    id: 'attempt',
    kind: 'state',
    value: { started: true },
    createdAt: new Date().toISOString(),
    expiresAt: null,
  });
  first.close();
  const next = await openGtmExecutionStore(project, 'sqlite');
  expect((await next.state.artifacts.get('attempt'))?.value).toEqual({ started: true });
  next.close();
  await expect(openGtmExecutionStore(project, 'local')).rejects.toThrow('BACKEND_MISMATCH');
});
it('refuses legacy records and symlinked state directories', async () => {
  const project = await root();
  const legacy = path.join(project, '.unisane/ops/gtm/execution');
  await mkdir(legacy, { recursive: true });
  await writeFile(path.join(legacy, 'pending.json'), '{}');
  await expect(openGtmExecutionStore(project, 'sqlite')).rejects.toThrow('MIGRATION_REQUIRED');
  const retained = await openGtmExecutionStore(project, 'local');
  retained.close();
  const other = await root();
  await symlink(project, path.join(other, '.unisane'));
  await expect(openGtmExecutionStore(other, 'sqlite')).rejects.toThrow('PATH_INVALID');
});
