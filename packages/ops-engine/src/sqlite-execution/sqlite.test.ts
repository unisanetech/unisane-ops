import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';
import { createSqliteOpsExecutionState } from './index.js';
import type { SqliteExecutionDatabase } from './database.js';
const roots: string[] = [];
const handles: DatabaseSync[] = [];
afterEach(() => {
  handles.splice(0).forEach((db) => {
    try {
      db.close();
    } catch {
      /* A test may already have closed its handle. */
    }
  });
  roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'ops-sqlite-'));
  roots.push(root);
  const file = path.join(root, 'state.sqlite');
  const open = () => {
    const db = new DatabaseSync(file);
    handles.push(db);
    return { db, ...createSqliteOpsExecutionState(db as unknown as SqliteExecutionDatabase) };
  };
  return { file, open };
}
const time = '2026-09-06T00:00:00Z';
it('rejects volatile databases and fences competing handles through expiry and renewal', async () => {
  const memory = new DatabaseSync(':memory:');
  expect(() => createSqliteOpsExecutionState(memory as unknown as SqliteExecutionDatabase)).toThrow(
    'OPS_SQLITE_DURABILITY_REQUIRED',
  );
  memory.close();
  const f = fixture();
  const a = f.open();
  const b = f.open();
  const first = await a.state.locks.acquire({
    lockId: 'container',
    owner: 'a',
    ttlMs: 1000,
    now: time,
  });
  expect(first).not.toBeNull();
  expect(
    await b.state.locks.acquire({ lockId: 'container', owner: 'b', ttlMs: 1000, now: time }),
  ).toBeNull();
  const next = await b.state.locks.acquire({
    lockId: 'container',
    owner: 'b',
    ttlMs: 1000,
    now: '2026-09-06T00:00:02Z',
  });
  expect(next!.fencingValue).toBeGreaterThan(first!.fencingValue);
  await expect(a.state.locks.release(first!)).rejects.toThrow('OWNER_MISMATCH');
  await expect(a.state.locks.renew(first!, 1000, '2026-09-06T00:00:02Z')).rejects.toThrow(
    'OWNER_MISMATCH',
  );
  await b.state.locks.release(next!);
  const again = await a.state.locks.acquire({
    lockId: 'container',
    owner: 'a',
    ttlMs: 1000,
    now: '2026-09-06T00:00:02Z',
  });
  expect(again!.fencingValue).toBeGreaterThan(next!.fencingValue);
});
it('persists CAS runs and refuses revision and identity races', async () => {
  const f = fixture();
  const a = f.open();
  const b = f.open();
  const run = {
    schemaVersion: 1 as const,
    kind: 'ops.mutation-run' as const,
    runId: 'run.test',
    revision: 1,
    actionId: 'growth.gtm.release',
    actionSchemaVersion: 1,
    projectId: 'shop',
    environmentId: 'test',
    targetId: 'container.test',
    phase: 'attention' as const,
    actionState: { started: true },
    createdAt: time,
    updatedAt: time,
  };
  expect(await a.runStore.compareAndSet(run, null)).toBe('stored');
  expect(await b.runStore.compareAndSet(run, null)).toBe('conflict');
  expect(await b.runStore.compareAndSet({ ...run, revision: 2 }, 1)).toBe('stored');
  expect(await a.runStore.compareAndSet({ ...run, revision: 2 }, 1)).toBe('conflict');
  await expect(
    a.runStore.compareAndSet({ ...run, revision: 3, projectId: 'foreign' }, 2),
  ).rejects.toThrow('IDENTITY_CHANGED');
  expect((await f.open().runStore.get(run.runId))?.revision).toBe(2);
  expect(
    await a.runStore.list({ actionId: run.actionId, projectId: 'foreign', environmentId: 'test' }),
  ).toEqual([]);
});
it('keeps plans and approvals immutable while allowing state pointers to advance', async () => {
  const { state } = fixture().open();
  const plan = {
    id: 'plan.test',
    kind: 'plan' as const,
    value: { revision: 1 },
    createdAt: time,
    expiresAt: null,
  };
  await state.artifacts.put(plan);
  await expect(state.artifacts.put({ ...plan, value: { revision: 2 } })).rejects.toThrow(
    'IMMUTABLE',
  );
  const approval = {
    schemaVersion: 1 as const,
    kind: 'ops.approval' as const,
    approvalId: 'approval.test',
    planHash: 'a'.repeat(64),
    actor: 'operator',
    provider: 'google-gtm',
    projectId: 'shop',
    environment: 'test',
    targetIdentity: 'container',
    approvedAt: time,
    expiresAt: '2026-09-06T01:00:00Z',
  };
  await state.approvals.put(approval);
  await state.approvals.put(approval);
  await expect(state.approvals.put({ ...approval, actor: 'agent' })).rejects.toThrow('IMMUTABLE');
  await state.artifacts.put({ ...plan, id: 'pointer', kind: 'state' });
  await state.artifacts.put({ ...plan, id: 'pointer', kind: 'state', value: { revision: 2 } });
  expect((await state.artifacts.get('pointer'))?.value).toEqual({ revision: 2 });
});
it('recovers a committed record after the writing process is killed without closing SQLite', async () => {
  const f = fixture();
  const moduleUrl = new URL('../../dist/index.js', import.meta.url).href;
  const source = `import {DatabaseSync} from 'node:sqlite';import {createSqliteOpsExecutionState} from ${JSON.stringify(moduleUrl)};const {state}=createSqliteOpsExecutionState(new DatabaseSync(${JSON.stringify(f.file)}));await state.artifacts.put({id:'started',kind:'state',value:{started:true},createdAt:${JSON.stringify(time)},expiresAt:null});process.kill(process.pid,'SIGKILL');`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    encoding: 'utf8',
  });
  expect(child.signal, child.stderr).toBe('SIGKILL');
  expect((await f.open().state.artifacts.get('started'))?.value).toEqual({ started: true });
});
