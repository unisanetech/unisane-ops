import { describe, expect, it, vi } from 'vitest';
import {
  InMemoryApprovalStore,
  InMemoryArtifactStore,
  InMemoryLockStore,
} from '@unisane/ops-engine/testing';
import { applyCloudflareQueuePlan } from '../cloudflare-resource-apply.js';
import {
  collectCloudflareResourceInventory,
  createCloudflareEnvironmentReport,
  createCloudflareQueuePlan,
  createCloudflareReadinessReport,
  createCloudflareWorkerPlan,
} from '../cloudflare-resource-workflow.js';
import type {
  CloudflareMutationProvider,
  CloudflareReadProvider,
  CloudflareResourceTarget,
} from '../cloudflare-resources.js';

const target: CloudflareResourceTarget = {
  projectId: 'sample-project',
  targetId: 'website',
  environment: 'dev',
  connectionId: 'edge',
  provider: 'cloudflare',
  accountId: 'account_1',
  production: false,
  configPath: '/project/unisane.config.ts',
  desired: {
    zones: { site: { name: 'example.test', zoneId: 'zone_1' } },
    queues: { jobs: { name: 'sample-jobs', dlq: 'sample-jobs-dlq' } },
    workers: {
      async: {
        name: 'sample-async',
        script: { path: 'workers/async.js', mainModule: 'async.js' },
        routes: [{ zone: 'site', pattern: 'async.example.test/*' }],
        queues: { producers: ['jobs'], consumers: ['jobs'] },
        crons: ['*/10 * * * *'],
        vars: { MODE: 'async' },
        secrets: ['ASYNC_SECRET'],
      },
    },
  },
  scriptSources: {
    async: {
      relativePath: 'workers/async.js',
      mainModule: 'async.js',
      contentHash: 'a'.repeat(64),
    },
  },
};

function provider(): CloudflareReadProvider {
  return {
    listAccounts: vi.fn(async () => [{ id: 'account_1', name: 'Example' }]),
    listZones: vi.fn(async () => [
      {
        key: null,
        id: 'zone_1',
        name: 'example.test',
        status: 'active',
        accountId: 'account_1',
        accountName: 'Example',
        configured: false,
      },
    ]),
    listQueues: vi.fn(async () => [
      {
        id: 'queue_1',
        name: 'sample-jobs',
        createdOn: null,
        modifiedOn: null,
        producersTotalCount: 1,
        consumersTotalCount: 1,
      },
    ]),
    listWorkers: vi.fn(async () => [
      {
        id: 'sample-async',
        name: 'sample-async',
        createdOn: null,
        modifiedOn: null,
      },
    ]),
    listWorkerRoutes: vi.fn(async () => [
      {
        id: 'route_1',
        zoneId: 'zone_1',
        zoneName: 'example.test',
        pattern: 'async.example.test/*',
        script: 'sample-async',
      },
    ]),
    listWorkerCronTriggers: vi.fn(async () => []),
  };
}

function mutationProvider(): CloudflareMutationProvider {
  return {
    ...provider(),
    createQueue: vi.fn(async (_accountId, queue) => ({ id: `created-${queue.name}` })),
    createWorkerRoute: vi.fn(async () => ({ id: 'route-created' })),
    updateWorkerRoute: vi.fn(async () => ({ id: 'route-updated' })),
    listWorkerSettings: vi.fn(async () => ({ bindings: [] })),
    updateWorkerSettings: vi.fn(async () => ({ id: 'worker-updated' })),
    putWorkerScript: vi.fn(async () => ({ id: 'worker-script' })),
    putWorkerSecret: vi.fn(async () => ({ id: 'worker-secret' })),
    putWorkerCronTriggers: vi.fn(async () => ({ id: 'worker-cron' })),
    createQueueConsumer: vi.fn(async () => ({ id: 'queue-consumer' })),
  };
}

describe('@unisane/cloud Cloudflare resources', () => {
  it('collects normalized Worker inventory and plans every supported resource offline', async () => {
    const inventory = await collectCloudflareResourceInventory({
      target,
      provider: provider(),
      focus: 'workers',
      generatedAt: '2026-07-25T10:00:00.000Z',
    });
    const queuePlan = createCloudflareQueuePlan({
      target,
      inventory,
      generatedAt: '2026-07-25T10:01:00.000Z',
    });
    const workerPlan = createCloudflareWorkerPlan({
      target,
      inventory,
      focus: 'workers',
      generatedAt: '2026-07-25T10:02:00.000Z',
    });

    expect(inventory.kind).toBe('cloudflare.worker-inventory');
    expect(inventory.queues).toHaveLength(1);
    expect(queuePlan.summary).toEqual({ create: 1, noOp: 1, blocked: 0 });
    expect(workerPlan.summary.blocked).toBe(0);
    expect(new Set(workerPlan.operations.map((operation) => operation.resourceType))).toEqual(
      new Set([
        'worker-script',
        'worker-route',
        'worker-queue-binding',
        'worker-cron-trigger',
        'worker-var',
        'worker-secret',
      ]),
    );
    expect(JSON.stringify(workerPlan)).not.toContain('export default');
    expect(JSON.stringify(workerPlan)).not.toContain('secret-value');
  });

  it('keeps readiness and environment output offline and redacted', () => {
    const readiness = createCloudflareReadinessReport({
      target,
      generatedAt: '2026-07-25T10:00:00.000Z',
    });
    const environment = createCloudflareEnvironmentReport({
      target,
      generatedAt: '2026-07-25T10:00:00.000Z',
    });

    expect(readiness.ok).toBe(true);
    expect(environment.variables.find((variable) => variable.name === 'ASYNC_SECRET')).toEqual(
      expect.objectContaining({ value: '<SECRET>', sensitive: true }),
    );
    expect(JSON.stringify(environment)).not.toContain('secret-value');
  });

  it('blocks a configured Worker script when its reviewed source is unavailable', () => {
    const plan = createCloudflareWorkerPlan({
      target: { ...target, scriptSources: {} },
      inventory: {
        schemaVersion: 1,
        kind: 'cloudflare.worker-inventory',
        provider: 'cloudflare',
        projectId: target.projectId,
        targetId: target.targetId,
        environment: target.environment,
        connectionId: target.connectionId,
        generatedAt: '2026-07-25T10:00:00.000Z',
        account: {
          configuredAccountId: target.accountId,
          liveAccounts: [],
        },
        zones: [],
        queues: [],
        workers: [],
        workerRoutes: [],
        workerCronTriggers: [],
        errors: [],
      },
      focus: 'workers',
    });

    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'blocked',
        check: 'workers.script.source.readable',
      }),
    );
  });

  it('applies a reviewed Queue plan through approval, lock, receipt, and drift safety', async () => {
    const now = new Date();
    const mutation = mutationProvider();
    const inventory = await collectCloudflareResourceInventory({
      target,
      provider: mutation,
      focus: 'queues',
      generatedAt: now.toISOString(),
    });
    const plan = createCloudflareQueuePlan({
      target,
      inventory,
      generatedAt: now.toISOString(),
    });
    const writeJson = vi.fn(() => ({
      path: '/project/.unisane/cloudflare/receipt.json',
      relativePath: '.unisane/cloudflare/receipt.json',
    }));
    const artifacts = new InMemoryArtifactStore();
    const report = await applyCloudflareQueuePlan({
      binding: {
        target,
        provider: mutation,
        artifacts: {
          readJson: vi.fn(),
          writeJson,
        },
        state: {
          artifacts,
          approvals: new InMemoryApprovalStore(),
          locks: new InMemoryLockStore(),
        },
        actor: 'developer',
        actorId: 'test-developer',
        multiProcess: false,
        now,
      },
      planInput: plan,
      accountConfirm: target.accountId,
      yes: true,
    });

    expect(report.ok).toBe(true);
    expect(mutation.createQueue).toHaveBeenCalledOnce();
    expect(artifacts.receipts.has(plan.safety.planHash)).toBe(true);
    expect(report.receipt.engineReceipt.status).toBe('succeeded');
    expect(writeJson).toHaveBeenCalledWith(
      expect.objectContaining({ class: 'receipt', focus: 'queues' }),
    );
  });

  it('rejects a plan whose operations were changed after review', async () => {
    const now = new Date();
    const mutation = mutationProvider();
    const inventory = await collectCloudflareResourceInventory({
      target,
      provider: mutation,
      focus: 'queues',
      generatedAt: now.toISOString(),
    });
    const plan = createCloudflareQueuePlan({
      target,
      inventory,
      generatedAt: now.toISOString(),
    });
    const tampered = {
      ...plan,
      operations: plan.operations.map((operation, index) =>
        index === 0 ? { ...operation, message: 'Changed after review.' } : operation,
      ),
    };

    await expect(
      applyCloudflareQueuePlan({
        binding: {
          target,
          provider: mutation,
          artifacts: {
            readJson: vi.fn(),
            writeJson: vi.fn(() => ({ path: '/tmp/receipt.json', relativePath: 'receipt.json' })),
          },
          state: {
            artifacts: new InMemoryArtifactStore(),
            approvals: new InMemoryApprovalStore(),
            locks: new InMemoryLockStore(),
          },
          actor: 'developer',
          multiProcess: false,
          now,
        },
        planInput: tampered,
        accountConfirm: target.accountId,
        yes: true,
      }),
    ).rejects.toThrow('CLOUDFLARE_RESOURCE_PLAN_ACTIONS_MISMATCH');
    expect(mutation.createQueue).not.toHaveBeenCalled();
  });
});
