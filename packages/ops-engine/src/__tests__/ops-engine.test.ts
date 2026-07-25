import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assessControlPlaneArtifactFreshness,
  createControlPlaneInventoryArtifact,
  createOpsMutationPlan,
  hashOpsValue,
  providerArtifactRelativePath,
  publicControlPlaneEnvEntry,
  redactControlPlaneObject,
  resolveControlPlaneProviderContext,
  assertOpsMutationPreflight,
  suiteArtifactRelativePath,
  type OpsApprovalRecord,
  type OpsExecutionState,
  type OpsLockLease,
  type OpsMutationPlan,
  type OpsMutationReceipt,
} from '../index.js';
import {
  createLocalOpsExecutionState,
  LocalApprovalStore,
  LocalArtifactStore,
  LocalLockStore,
  writeControlPlaneJsonArtifact,
} from '../local.js';
import { InMemoryApprovalStore, InMemoryArtifactStore, InMemoryLockStore } from '../testing.js';

const NOW = new Date('2026-07-24T10:00:00.000Z');
const HASH = hashOpsValue({ fixture: true });
const expectation = {
  provider: 'cloudflare',
  projectId: 'project_site',
  environment: 'prod',
  targetIdentity: 'account:acct_1:zone:zone_1',
  lockId: 'cloudflare:acct_1:zone_1',
};

function plan(): OpsMutationPlan {
  return createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId: 'plan_1',
    provider: expectation.provider,
    projectId: expectation.projectId,
    environment: expectation.environment,
    targetIdentity: expectation.targetIdentity,
    commandVersion: '0.1.0',
    configHash: HASH,
    inventoryHash: HASH,
    generatedAt: '2026-07-24T09:55:00.000Z',
    expiresAt: '2026-07-24T10:05:00.000Z',
    actions: [
      {
        id: 'dns_1',
        type: 'update',
        risk: 'medium',
        resourceIdentity: 'dns:example.com:A',
        inputHash: HASH,
      },
    ],
  });
}

function approval(value: OpsMutationPlan = plan()): OpsApprovalRecord {
  return {
    schemaVersion: 1,
    kind: 'ops.approval',
    approvalId: 'approval_1',
    planHash: value.planHash,
    actor: 'developer@example.test',
    provider: expectation.provider,
    projectId: expectation.projectId,
    environment: expectation.environment,
    targetIdentity: expectation.targetIdentity,
    approvedAt: '2026-07-24T09:56:00.000Z',
    expiresAt: '2026-07-24T10:04:00.000Z',
  };
}

function lease(): OpsLockLease {
  return {
    schemaVersion: 1,
    kind: 'ops.lock-lease',
    lockId: expectation.lockId,
    owner: 'worker_1',
    leaseToken: 'lease_1',
    fencingValue: 3,
    acquiredAt: '2026-07-24T09:59:00.000Z',
    expiresAt: '2026-07-24T10:01:00.000Z',
  };
}

function state(durability: 'local' | 'durable' = 'local'): OpsExecutionState {
  return {
    artifacts: new InMemoryArtifactStore(durability),
    approvals: new InMemoryApprovalStore(durability),
    locks: new InMemoryLockStore(durability, true),
  };
}

function preparedState(
  _mutationPlan: OpsMutationPlan,
  approvalRecord: OpsApprovalRecord,
  lockLease: OpsLockLease,
  durability: 'local' | 'durable' = 'local',
): OpsExecutionState {
  const configured = state(durability);
  (configured.approvals as InMemoryApprovalStore).records.set(
    approvalRecord.approvalId,
    approvalRecord,
  );
  (configured.locks as InMemoryLockStore).leases.set(lockLease.lockId, lockLease);
  return configured;
}

function preflight(overrides: Partial<Parameters<typeof assertOpsMutationPreflight>[0]> = {}) {
  const mutationPlan = plan();
  const approvalRecord = approval(mutationPlan);
  const lockLease = lease();
  return assertOpsMutationPreflight({
    plan: mutationPlan,
    approval: approvalRecord,
    lease: lockLease,
    expectation,
    actor: 'developer',
    production: false,
    multiProcess: false,
    lockOwner: 'worker_1',
    state: preparedState(mutationPlan, approvalRecord, lockLease),
    now: NOW,
    ...overrides,
  });
}

describe('@unisane/ops-engine', () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  it('preserves artifact paths, local writes, context, inventory, freshness, and redaction', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-ops-engine-'));
    tempDirs.push(cwd);
    expect(
      providerArtifactRelativePath({
        provider: 'google',
        environment: 'prod',
        lane: 'plans',
        family: 'apis',
        filename: 'enable.json',
      }),
    ).toBe('.unisane/provider/google/prod/plans/apis/enable.json');
    expect(
      suiteArtifactRelativePath({
        suite: 'marketing',
        environment: 'prod',
        lane: 'proof',
        filename: 'status.json',
      }),
    ).toBe('.unisane/marketing/prod/proof/status.json');
    const artifact = writeControlPlaneJsonArtifact({
      cwd,
      defaultRelativePath: '.unisane/provider/aws/dev/inventory/s3.json',
      value: { ok: true },
    });
    expect(existsSync(artifact.path)).toBe(true);
    expect(JSON.parse(readFileSync(artifact.path, 'utf8'))).toEqual({ ok: true });
    expect(() =>
      writeControlPlaneJsonArtifact({
        cwd,
        outputPath: '../outside.json',
        defaultRelativePath: 'unused.json',
        value: {},
      }),
    ).toThrow('[CONTROL_PLANE_ARTIFACT_PATH_OUTSIDE_CWD]');
    const context = resolveControlPlaneProviderContext({
      cwd,
      provider: 'google',
      appId: 'site',
      now: NOW,
    });
    expect(
      createControlPlaneInventoryArtifact({
        provider: context.provider,
        appId: context.appId,
        environment: context.environment,
        resources: [{ id: 'property' }],
      }).resources,
    ).toHaveLength(1);
    expect(
      assessControlPlaneArtifactFreshness({
        generatedAt: '2026-07-24T09:00:00.000Z',
        maxAgeMs: 1000,
        now: NOW,
      }).status,
    ).toBe('stale');
    expect(redactControlPlaneObject({ accessToken: 'secret', nested: { normal: 'ok' } })).toEqual({
      accessToken: '<REDACTED>',
      nested: { normal: 'ok' },
    });
    expect(
      publicControlPlaneEnvEntry({
        name: 'SECRET',
        kind: 'bootstrap-local-secret',
        required: true,
        secret: true,
        value: 'configured',
        description: 'secret',
        example: '<SECRET>',
      }).example,
    ).toBeNull();
  });

  it('accepts a fresh hash-bound plan, identity, recorded approval, and current lock', async () => {
    await expect(preflight()).resolves.toEqual(
      expect.objectContaining({ plan: expect.objectContaining({ planId: 'plan_1' }) }),
    );
  });

  it('rejects invalid schema and plan hash mismatch', async () => {
    await expect(preflight({ plan: { schemaVersion: 2 } })).rejects.toThrow(
      '[OPS_PLAN_SCHEMA_INVALID]',
    );
    await expect(preflight({ plan: { ...plan(), planHash: '0'.repeat(64) } })).rejects.toThrow(
      '[OPS_PLAN_HASH_MISMATCH]',
    );
  });

  it('rejects stale plans and exact identity mismatch', async () => {
    await expect(preflight({ now: new Date('2026-07-24T10:06:00.000Z') })).rejects.toThrow(
      '[OPS_PLAN_STALE]',
    );
    await expect(
      preflight({ expectation: { ...expectation, targetIdentity: 'account:other' } }),
    ).rejects.toThrow('[OPS_PLAN_IDENTITY_MISMATCH]');
  });

  it('rejects missing, mismatched, expired, and unrecorded approval records', async () => {
    await expect(preflight({ approval: null })).rejects.toThrow('[OPS_APPROVAL_SCHEMA_INVALID]');
    await expect(
      preflight({ approval: { ...approval(), planHash: '0'.repeat(64) } }),
    ).rejects.toThrow('[OPS_APPROVAL_MISMATCH]');
    await expect(
      preflight({ approval: { ...approval(), expiresAt: '2026-07-24T09:59:00.000Z' } }),
    ).rejects.toThrow('[OPS_APPROVAL_EXPIRED]');
    await expect(preflight({ state: state() })).rejects.toThrow('[OPS_APPROVAL_NOT_RECORDED]');
  });

  it('rejects missing, expired, wrong-owner, and wrong-target locks', async () => {
    await expect(preflight({ lease: null })).rejects.toThrow('[OPS_LOCK_SCHEMA_INVALID]');
    await expect(preflight({ lease: { ...lease(), owner: 'other' } })).rejects.toThrow(
      '[OPS_LOCK_OWNER_MISMATCH]',
    );
    await expect(
      preflight({ lease: { ...lease(), expiresAt: '2026-07-24T09:59:00.000Z' } }),
    ).rejects.toThrow('[OPS_LOCK_EXPIRED]');
    await expect(
      preflight({ expectation: { ...expectation, lockId: 'cloudflare:other' } }),
    ).rejects.toThrow('[OPS_LOCK_IDENTITY_MISMATCH]');
  });

  it('rejects supplied or durably stored receipt replay for an already consumed plan', async () => {
    const mutationPlan = plan();
    const receipt: OpsMutationReceipt = {
      schemaVersion: 1,
      kind: 'ops.mutation-receipt',
      receiptId: 'receipt_1',
      planId: mutationPlan.planId,
      planHash: mutationPlan.planHash,
      provider: expectation.provider,
      projectId: expectation.projectId,
      environment: expectation.environment,
      targetIdentity: expectation.targetIdentity,
      actor: 'developer@example.test',
      approvalId: 'approval_1',
      lockId: lease().lockId,
      lockFencingValue: lease().fencingValue,
      startedAt: '2026-07-24T09:59:30.000Z',
      completedAt: '2026-07-24T09:59:40.000Z',
      status: 'succeeded',
      results: [{ actionId: 'dns_1', status: 'succeeded', outputHash: HASH }],
    };
    await expect(
      preflight({
        plan: mutationPlan,
        approval: approval(mutationPlan),
        priorReceipts: [receipt],
      }),
    ).rejects.toThrow('[OPS_RECEIPT_REPLAY]');
    const approvalRecord = approval(mutationPlan);
    const lockLease = lease();
    const storedState = preparedState(mutationPlan, approvalRecord, lockLease);
    await storedState.artifacts.recordReceipt(receipt);
    await expect(
      preflight({
        plan: mutationPlan,
        approval: approvalRecord,
        lease: lockLease,
        state: storedState,
      }),
    ).rejects.toThrow('[OPS_RECEIPT_REPLAY]');
  });

  it('requires durable artifact, approval, and atomic lock state for automation', async () => {
    const mutationPlan = plan();
    const approvalRecord = approval(mutationPlan);
    const lockLease = lease();
    await expect(
      preflight({
        actor: 'automation',
        state: preparedState(mutationPlan, approvalRecord, lockLease, 'local'),
      }),
    ).rejects.toThrow('[OPS_STATE_DURABILITY_REQUIRED]');
    await expect(
      preflight({
        actor: 'automation',
        state: preparedState(mutationPlan, approvalRecord, lockLease, 'durable'),
      }),
    ).resolves.toBeDefined();
    await expect(
      preflight({
        production: true,
        state: preparedState(mutationPlan, approvalRecord, lockLease, 'local'),
      }),
    ).rejects.toThrow('[OPS_STATE_DURABILITY_REQUIRED]');
    await expect(
      preflight({
        multiProcess: true,
        state: preparedState(mutationPlan, approvalRecord, lockLease, 'local'),
      }),
    ).rejects.toThrow('[OPS_STATE_DURABILITY_REQUIRED]');
  });

  it('enforces lock expiry, renewal, owner release, reacquisition, and fencing', async () => {
    const locks = new InMemoryLockStore('local', true);
    const first = await locks.acquire({
      lockId: 'target',
      owner: 'one',
      ttlMs: 1000,
      now: '2026-07-24T10:00:00.000Z',
    });
    expect(first).not.toBeNull();
    expect(
      await locks.acquire({
        lockId: 'target',
        owner: 'two',
        ttlMs: 1000,
        now: '2026-07-24T10:00:00.500Z',
      }),
    ).toBeNull();
    const renewed = await locks.renew(first!, 1000, '2026-07-24T10:00:00.500Z');
    await expect(locks.release({ ...renewed, owner: 'two' })).rejects.toThrow(
      '[OPS_LOCK_OWNER_MISMATCH]',
    );
    await locks.release(renewed);
    const second = await locks.acquire({
      lockId: 'target',
      owner: 'two',
      ttlMs: 1000,
      now: '2026-07-24T10:00:01.000Z',
    });
    expect(second!.fencingValue).toBeGreaterThan(first!.fencingValue);
    await expect(locks.assertCurrent(first!, '2026-07-24T10:00:01.100Z')).rejects.toThrow(
      '[OPS_LOCK_OWNER_MISMATCH]',
    );
  });

  it('persists local approvals, receipts, and atomic single-host leases', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-ops-local-state-'));
    tempDirs.push(cwd);
    const localState = createLocalOpsExecutionState(cwd);
    expect(localState.artifacts).toBeInstanceOf(LocalArtifactStore);
    expect(localState.approvals).toBeInstanceOf(LocalApprovalStore);
    expect(localState.locks).toBeInstanceOf(LocalLockStore);
    const mutationPlan = plan();
    const approvalRecord = approval(mutationPlan);
    await localState.approvals.put(approvalRecord);
    await expect(localState.approvals.get(approvalRecord.approvalId)).resolves.toEqual(
      approvalRecord,
    );
    const first = await localState.locks.acquire({
      lockId: expectation.lockId,
      owner: 'local-owner',
      ttlMs: 60_000,
      now: NOW.toISOString(),
    });
    expect(first).not.toBeNull();
    await expect(
      localState.locks.acquire({
        lockId: expectation.lockId,
        owner: 'other-owner',
        ttlMs: 60_000,
        now: NOW.toISOString(),
      }),
    ).resolves.toBeNull();
    const receipt: OpsMutationReceipt = {
      schemaVersion: 1,
      kind: 'ops.mutation-receipt',
      receiptId: 'local-receipt',
      planId: mutationPlan.planId,
      planHash: mutationPlan.planHash,
      provider: expectation.provider,
      projectId: expectation.projectId,
      environment: expectation.environment,
      targetIdentity: expectation.targetIdentity,
      actor: 'developer@example.test',
      approvalId: approvalRecord.approvalId,
      lockId: first!.lockId,
      lockFencingValue: first!.fencingValue,
      startedAt: NOW.toISOString(),
      completedAt: NOW.toISOString(),
      status: 'succeeded',
      results: [{ actionId: 'dns_1', status: 'succeeded', outputHash: HASH }],
    };
    await localState.artifacts.recordReceipt(receipt);
    await expect(localState.artifacts.hasReceiptForPlan(mutationPlan.planHash)).resolves.toBe(true);
    await expect(localState.artifacts.recordReceipt(receipt)).rejects.toThrow(
      '[OPS_RECEIPT_REPLAY]',
    );
    await localState.locks.release(first!);
    const second = await localState.locks.acquire({
      lockId: expectation.lockId,
      owner: 'next-owner',
      ttlMs: 60_000,
      now: NOW.toISOString(),
    });
    expect(second!.fencingValue).toBeGreaterThan(first!.fencingValue);
  });
});
