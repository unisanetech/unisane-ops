import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalOpsMutationRunStore } from './local.js';
import { assertOpsMutationRunStore, type OpsMutationRun } from './runs.js';
import { InMemoryOpsMutationRunStore } from './testing.js';

function run(revision = 1, runId = 'run.campaign-42'): OpsMutationRun<{ safe: true }> {
  return {
    schemaVersion: 1,
    kind: 'ops.mutation-run',
    runId,
    revision,
    actionId: 'growth.ads.campaign.pause',
    actionSchemaVersion: 1,
    projectId: 'true-resume',
    environmentId: 'production',
    targetId: 'campaign-42',
    phase: revision === 1 ? 'planned' : 'approved',
    actionState: { safe: true },
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: `2026-08-03T10:0${revision}:00.000Z`,
  };
}

describe.each([
  ['memory', () => new InMemoryOpsMutationRunStore()],
  [
    'local',
    async () => {
      const directory = await mkdtemp(path.join(tmpdir(), 'ops-runs-'));
      return Object.assign(new LocalOpsMutationRunStore(directory), {
        cleanup: () => rm(directory, { recursive: true, force: true }),
      });
    },
  ],
] as const)('Ops mutation run store: %s', (_name, createStore) => {
  it('uses compare-and-set revisions and bounded context queries', async () => {
    const store = await createStore();
    try {
      expect(await store.compareAndSet(run(), null)).toBe('stored');
      expect(await store.compareAndSet(run(), null)).toBe('conflict');
      expect(await store.compareAndSet(run(2), 1)).toBe('stored');
      expect(await store.get('run.campaign-42')).toMatchObject({ revision: 2, phase: 'approved' });
      expect(
        await store.list({
          actionId: 'growth.ads.campaign.pause',
          projectId: 'true-resume',
          environmentId: 'production',
          limit: 1,
        }),
      ).toHaveLength(1);
      expect(
        await store.list({
          actionId: 'growth.ads.campaign.pause',
          projectId: 'other',
          environmentId: 'production',
        }),
      ).toEqual([]);
      await expect(store.compareAndSet(run(4), 2)).rejects.toThrow('OPS_RUN_REVISION_INVALID');
    } finally {
      await ('cleanup' in store ? store.cleanup() : undefined);
    }
  });
});

it('rejects local run state for production, automation, and multi-process execution', () => {
  const store = new InMemoryOpsMutationRunStore();
  expect(() =>
    assertOpsMutationRunStore({ store, actor: 'developer', production: true, multiProcess: false }),
  ).toThrow('OPS_RUN_STORE_DURABILITY_REQUIRED');
});
