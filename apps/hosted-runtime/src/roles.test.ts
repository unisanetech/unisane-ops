import { describe, expect, it, vi } from 'vitest';
import type {
  HostedReadAdmissionBundle,
  HostedReadJobStore,
  HostedReadResultStore,
} from '@unisane/ops-engine/hosted';
import { createHostedGatewayRole } from './gateway.js';
import { createHostedWorkerRole } from './worker.js';

const request = {
  schemaVersion: 1 as const,
  audience: 'unisane.ops' as const,
  evidenceRevision: 'evidence.1',
  action: {
    schemaVersion: 1 as const,
    actionId: 'growth.health.review',
    actionSchemaVersion: 1,
    idempotencyKey: 'request.1',
    context: {
      requestId: 'request.1',
      scopeId: 'workspace.acme',
      projectId: 'project.acme',
      environmentId: 'production',
      principal: { kind: 'user' as const, id: 'user.alice' },
      requestedAt: '2026-08-03T10:00:00.000Z',
    },
    input: {},
  },
};

describe('hosted runtime roles', () => {
  it('keeps authorization and admission in the gateway role', async () => {
    const admit = vi.fn(async (bundle: HostedReadAdmissionBundle) => ({
      status: 'stored' as const,
      job: bundle.job,
    }));
    const store = {
      durability: 'durable' as const,
      atomic: true as const,
      admit,
    } as unknown as HostedReadJobStore;
    const authorize = vi.fn(async () => ({
      authenticated: true as const,
      audience: 'unisane.ops' as const,
      principalId: 'user.alice',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.acme'],
    }));
    const gateway = createHostedGatewayRole({ store, identity: { authorize } });

    const authentication = { scheme: 'bearer' as const, token: 'identity-token' };
    await gateway.admit({ request, authentication });
    expect(authorize).toHaveBeenCalledWith(authentication);
    expect(admit).toHaveBeenCalledTimes(1);
  });

  it('rejects a project not carried by the verified workload identity', async () => {
    const admit = vi.fn();
    const store = {
      durability: 'durable' as const,
      atomic: true as const,
      admit,
    } as unknown as HostedReadJobStore;
    const authorize = vi.fn(async () => ({
      authenticated: true as const,
      audience: 'unisane.ops' as const,
      principalId: 'user.alice',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.other'],
    }));
    const gateway = createHostedGatewayRole({ store, identity: { authorize } });

    await expect(
      gateway.admit({
        request,
        authentication: { scheme: 'bearer', token: 'identity-token' },
      }),
    ).rejects.toMatchObject({ code: 'project-forbidden' });
    expect(admit).not.toHaveBeenCalled();
  });

  it('pushes the complete identity boundary into an authorization-aware store read', async () => {
    const getAuthorized = vi.fn(async () => null);
    const store = {
      durability: 'durable' as const,
      atomic: true as const,
      getAuthorized,
    } as unknown as HostedReadJobStore & { getAuthorized: typeof getAuthorized };
    const authorize = vi.fn(async () => ({
      authenticated: true as const,
      audience: 'unisane.ops' as const,
      principalId: 'user.alice',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.acme'],
    }));
    const gateway = createHostedGatewayRole({ store, identity: { authorize } });

    await expect(
      gateway.get({
        jobId: 'read.request.1',
        authentication: { scheme: 'bearer', token: 'identity-token' },
      }),
    ).resolves.toBeNull();
    expect(getAuthorized).toHaveBeenCalledWith({
      jobId: 'read.request.1',
      principalId: 'user.alice',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.acme'],
    });
  });

  it('constructs a worker role without gateway authorization authority', () => {
    const store = {
      durability: 'durable' as const,
      atomic: true as const,
    } as HostedReadJobStore;
    const results = { durability: 'durable' as const } as HostedReadResultStore;
    const worker = createHostedWorkerRole({
      owner: 'worker.1',
      leaseMs: 30_000,
      maximumResultBytes: 1_000,
      store,
      results,
      actions: [],
    });

    expect(worker).toEqual({ execute: expect.any(Function), recover: expect.any(Function) });
    expect(worker).not.toHaveProperty('admit');
  });
});
