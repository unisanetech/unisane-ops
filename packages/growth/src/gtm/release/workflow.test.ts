import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
import type { GoogleTagManagerProvider } from '../provider.js';
import type { GoogleTagManagerJsonObject } from '../contracts.js';
import { googleTagManagerVersionContentDigest } from '../evidence.js';
import { createGtmReleaseProviderBridge } from './adapter.js';
import { createGtmReleaseWorkflow } from './workflow.js';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'gtm-release-'));
  roots.push(root);
  let clock = new Date('2026-09-06T00:00:00Z');
  let content: GoogleTagManagerJsonObject = { accountId: '1', containerId: '2', tag: [] };
  const versions = new Map<string, GoogleTagManagerJsonObject>();
  let live: GoogleTagManagerJsonObject | null = null;
  let loseResponse = false;
  const manifest = {
    appId: 'shop',
    accountId: '1',
    containerId: '2',
    namespace: 'shop',
    environments: { test: { workspacePrefix: 'test' } },
  };
  const create = vi.fn(async (options) => {
    await options.beforeWrite();
    const version = {
      ...content,
      containerVersionId: '10',
      fingerprint: 'fp10',
      name: options.name,
    };
    versions.set('10', version);
    if (loseResponse) throw new Error('private-provider-token');
    return {
      appId: 'shop',
      environment: 'test',
      accountId: '1',
      containerId: '2',
      containerPath: 'accounts/1/containers/2',
      workspacePath: 'accounts/1/containers/2/workspaces/3',
      versionPath: 'accounts/1/containers/2/versions/10',
      versionId: '10',
      versionedAt: clock.toISOString(),
      compilerError: false,
      containerVersion: version,
      raw: {},
    };
  });
  const publish = vi.fn(async (options) => {
    await options.beforeWrite();
    live = versions.get(options.versionId)!;
    if (loseResponse) throw new Error('private-provider-token');
    return {
      appId: 'shop',
      environment: 'test',
      accountId: '1',
      containerId: '2',
      containerPath: 'accounts/1/containers/2',
      versionPath: `accounts/1/containers/2/versions/${options.versionId}`,
      versionId: options.versionId,
      publishedAt: clock.toISOString(),
      compilerError: false,
      containerVersion: live,
      raw: {},
    };
  });
  const provider = {
    preview: vi.fn(async () => ({
      appId: 'shop',
      environment: 'test',
      accountId: '1',
      containerId: '2',
      containerPath: 'accounts/1/containers/2',
      workspacePath: 'accounts/1/containers/2/workspaces/3',
      previewedAt: clock.toISOString(),
      contentDigest: googleTagManagerVersionContentDigest(content),
      compilerError: false,
      containerVersion: content,
      raw: {},
    })),
    createVersion: create,
    publish,
    readVersion: async (_a: string, _c: string, id: string) => {
      const v = versions.get(id);
      if (!v) throw new Error('missing');
      return v;
    },
    readLiveVersion: async () => live,
    listVersionHeaders: async () => [...versions.values()],
  } as unknown as GoogleTagManagerProvider;
  const deps = {
    ...createGtmReleaseProviderBridge(provider, 'test'),
    state: createLocalOpsExecutionState(root),
    runStore: new LocalOpsMutationRunStore(path.join(root, 'runs')),
    context: {
      requestId: 'test',
      scopeId: 'test',
      projectId: 'shop',
      environmentId: 'test',
      principal: { kind: 'user' as const, id: 'operator' },
      requestedAt: clock.toISOString(),
    },
    actor: 'developer' as const,
    production: false,
    multiProcess: false,
    lockOwner: 'fixture',
    mutationPolicy: 'approval-required' as const,
    now: () => clock,
  };
  return {
    deps,
    workflow: createGtmReleaseWorkflow(deps),
    parameters: {
      kind: 'version' as const,
      connectionId: 'google',
      workspaceId: '3',
      name: 'Purchase tracking',
      manifest,
    },
    create,
    publish,
    versions,
    lose: () => {
      loseResponse = true;
    },
    drift: () => {
      content = { ...content, tag: [{ tagId: '99' }] };
    },
    advance: () => {
      clock = new Date(clock.getTime() + 180000);
    },
    setLive: (v: GoogleTagManagerJsonObject) => {
      live = v;
    },
  };
}
it('requires exact human approval, records creation once and verifies a distinct version before publish', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  expect(review.effects.join(' ')).toContain('removes the source workspace');
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('GTM_APPROVAL_REQUIRED');
  await expect(f.workflow.approve(review.plan.planHash, 'b'.repeat(64))).rejects.toThrow(
    'GTM_APPROVAL_MISMATCH',
  );
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  const result = await f.workflow.apply(review.plan.planHash);
  expect(result.disposition).toBe('applied');
  expect((await f.workflow.recover(result.runId)).status).toBe('unavailable');
  f.advance();
  expect((await f.workflow.recover(result.runId)).status).toBe('verified');
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow();
  expect(f.create).toHaveBeenCalledTimes(1);
  const publication = await f.workflow.plan({
    kind: 'publish',
    connectionId: 'google',
    manifest: f.parameters.manifest,
    versionId: '10',
  });
  await f.workflow.approve(publication.plan.planHash, publication.plan.planHash);
  const published = await f.workflow.apply(publication.plan.planHash);
  f.advance();
  expect(await f.workflow.recover(published.runId)).toMatchObject({
    status: 'verified',
    versionId: '10',
    trackingVerified: false,
  });
});
it('rejects compiler drift before recording or issuing a write', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.drift();
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('GTM_REVIEW_DRIFT');
  expect(f.create).not.toHaveBeenCalled();
  expect(await f.deps.runStore.get(`gtmrelease.${review.plan.planHash}`)).toBeNull();
});
it('recovers lost creation responses by unique reviewed name and content, preserving partial receipt', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.lose();
  const result = await f.workflow.apply(review.plan.planHash);
  expect(result).toMatchObject({
    disposition: 'outcome-unknown',
    versionId: null,
    receipt: { status: 'partial' },
  });
  expect(JSON.stringify(result)).not.toContain('private-provider-token');
  const next = await f.workflow.plan(f.parameters);
  await f.workflow.approve(next.plan.planHash, next.plan.planHash);
  await expect(f.workflow.apply(next.plan.planHash)).rejects.toThrow('GTM_WORKSPACE_UNRECONCILED');
  f.advance();
  const resumed = createGtmReleaseWorkflow(f.deps);
  expect(await resumed.recover(result.runId)).toMatchObject({
    status: 'verified',
    versionId: '10',
  });
  expect((await f.deps.runStore.get(result.runId))?.actionState).toMatchObject({
    receipt: { status: 'partial' },
  });
  expect(f.create).toHaveBeenCalledTimes(1);
});
it('leaves ambiguous creation evidence unavailable and blocks further writes', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.lose();
  const result = await f.workflow.apply(review.plan.planHash);
  f.versions.set('11', { ...f.versions.get('10'), containerVersionId: '11' });
  f.advance();
  expect((await f.workflow.recover(result.runId)).status).toBe('unavailable');
});
it('rejects foreign recovery, automation approval and local production execution', async () => {
  const f = fixture();
  const review = await f.workflow.plan(f.parameters);
  const agent = createGtmReleaseWorkflow({
    ...f.deps,
    context: { ...f.deps.context, principal: { kind: 'agent', id: 'agent' } },
  });
  await expect(agent.approve(review.plan.planHash, review.plan.planHash)).rejects.toThrow(
    'GTM_HUMAN_APPROVAL_REQUIRED',
  );
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  await expect(
    createGtmReleaseWorkflow({ ...f.deps, production: true }).apply(review.plan.planHash),
  ).rejects.toThrow('DURABILITY_REQUIRED');
  const result = await f.workflow.apply(review.plan.planHash);
  f.advance();
  await expect(
    createGtmReleaseWorkflow({
      ...f.deps,
      context: { ...f.deps.context, projectId: 'other' },
    }).recover(result.runId),
  ).rejects.toThrow('GTM_ATTEMPT_TARGET_MISMATCH');
});

it('executes a human-approved production plan as an agent with durable SQLite state', async () => {
  const sqliteModuleName = 'node:sqlite';
  const { DatabaseSync } = (await import(sqliteModuleName)) as {
    DatabaseSync: new (
      file: string,
    ) => import('@unisane/ops-engine').SqliteExecutionDatabase & { close(): void };
  };
  const { createSqliteOpsExecutionState } = await import('@unisane/ops-engine');
  const f = fixture();
  const root = mkdtempSync(path.join(tmpdir(), 'gtm-production-'));
  roots.push(root);
  const database = new DatabaseSync(path.join(root, 'execution.sqlite'));
  try {
    const stores = createSqliteOpsExecutionState(
      database as unknown as import('@unisane/ops-engine').SqliteExecutionDatabase,
    );
    const human = createGtmReleaseWorkflow({
      ...f.deps,
      ...stores,
      production: true,
      multiProcess: true,
    });
    const review = await human.plan(f.parameters);
    await human.approve(review.plan.planHash, review.plan.planHash);
    const agent = createGtmReleaseWorkflow({
      ...f.deps,
      ...stores,
      production: true,
      multiProcess: true,
      actor: 'automation',
      context: { ...f.deps.context, principal: { kind: 'agent', id: 'marketing-agent' } },
    });
    const result = await agent.apply(review.plan.planHash);
    expect(result.disposition).toBe('applied');
    f.advance();
    expect((await agent.recover(result.runId)).status).toBe('verified');
  } finally {
    database.close();
  }
});

it('keeps publish-never policy in force and blocks changed live evidence', async () => {
  const f = fixture();
  f.versions.set('10', {
    accountId: '1',
    containerId: '2',
    containerVersionId: '10',
    fingerprint: 'fp10',
    tag: [],
  });
  const parameters = {
    kind: 'publish' as const,
    connectionId: 'google',
    versionId: '10',
    manifest: f.parameters.manifest,
  };
  await expect(
    f.workflow.plan({
      ...parameters,
      manifest: {
        ...parameters.manifest,
        environments: { test: { workspacePrefix: 'test', publishPolicy: 'never' } },
      },
    }),
  ).rejects.toThrow('GTM_PUBLISH_POLICY_BLOCKED');
  const review = await f.workflow.plan(parameters);
  await f.workflow.approve(review.plan.planHash, review.plan.planHash);
  f.setLive({
    accountId: '1',
    containerId: '2',
    containerVersionId: '9',
    fingerprint: 'fp9',
    tag: [],
  });
  await expect(f.workflow.apply(review.plan.planHash)).rejects.toThrow('GTM_REVIEW_DRIFT');
  expect(f.publish).not.toHaveBeenCalled();
});
