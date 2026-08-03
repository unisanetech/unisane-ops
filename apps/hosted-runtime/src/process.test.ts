import { describe, expect, it, vi } from 'vitest';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import type { HostedReadDispatchStore } from '@unisane/ops-hosted-postgresql';
import { readHostedGatewayProcessConfig, readHostedWorkerProcessConfig } from './config.js';
import { createHostedGatewayProcess } from './gateway-process.js';
import type { HostedRoleEvent } from './observability.js';
import { createHostedWorkerProcess } from './worker-process.js';

function dispatchStore(overrides: Partial<HostedReadDispatchStore> = {}): HostedReadDispatchStore {
  return {
    claimAvailable: vi.fn(async () => null),
    acknowledge: vi.fn(async () => 'stored' as const),
    release: vi.fn(async () => 'stored' as const),
    fail: vi.fn(async () => 'stored' as const),
    listExpiredJobIds: vi.fn(async () => []),
    ...overrides,
  };
}

describe('hosted process configuration', () => {
  it('validates each role only when configuration is read', () => {
    expect(
      readHostedGatewayProcessConfig({
        OPS_HOSTED_ROLE: 'gateway',
        OPS_HOSTED_POSTGRES_URL: 'postgresql://example.invalid/ops',
      }),
    ).toMatchObject({ OPS_HOSTED_ROLE: 'gateway' });
    expect(
      readHostedWorkerProcessConfig({
        OPS_HOSTED_ROLE: 'worker',
        OPS_HOSTED_POSTGRES_URL: 'postgresql://example.invalid/ops',
        OPS_HOSTED_WORKER_ID: 'worker.1',
      }),
    ).toMatchObject({
      OPS_HOSTED_ROLE: 'worker',
      OPS_HOSTED_POLL_MS: 1_000,
      OPS_HOSTED_LEASE_MS: 30_000,
    });
    expect(() => readHostedWorkerProcessConfig({ OPS_HOSTED_ROLE: 'worker' })).toThrow();
  });
});

describe('hosted gateway process', () => {
  it('probes readiness, delegates transport, and clears readiness on shutdown', async () => {
    const events: HostedRoleEvent[] = [];
    const transport = { serve: vi.fn(async () => {}) };
    const process = createHostedGatewayProcess({
      gateway: { admit: vi.fn() },
      transport,
      probe: vi.fn(async () => {}),
      observer: {
        emit(event) {
          events.push(event);
        },
      },
      now: () => new Date('2026-08-03T10:00:00.000Z'),
    });

    expect(process.health()).toEqual({ role: 'gateway', ready: false });
    await process.run(new AbortController().signal);
    expect(transport.serve).toHaveBeenCalledTimes(1);
    expect(process.health()).toEqual({ role: 'gateway', ready: false });
    expect(events.map((event) => event.kind)).toEqual(['role.ready', 'role.stopped']);
  });
});

describe('hosted worker process', () => {
  it('recovers expired work and acknowledges one terminal dispatch', async () => {
    const events: HostedRoleEvent[] = [];
    const acknowledge = vi.fn(async () => 'stored' as const);
    const dispatch = dispatchStore({
      listExpiredJobIds: vi.fn(async () => ['read.expired']),
      claimAvailable: vi.fn(async () => ({
        id: 'dispatch.1',
        jobId: 'read.current',
        claimToken: 'worker.1.claim',
      })),
      acknowledge,
    });
    const recover = vi.fn(async () => ({ phase: 'queued' as const }));
    const execute = vi.fn(async () => ({ phase: 'succeeded' as const }));
    const process = createHostedWorkerProcess({
      owner: 'worker.1',
      pollMs: 1_000,
      dispatchLeaseMs: 30_000,
      retryMs: 5_000,
      recoveryLimit: 100,
      worker: { recover, execute } as never,
      dispatch,
      probe: vi.fn(async () => {}),
      observer: {
        emit(event) {
          events.push(event);
        },
      },
      now: () => new Date('2026-08-03T10:00:00.000Z'),
    });

    await expect(process.workOnce()).resolves.toBe(true);
    expect(recover).toHaveBeenCalledWith('read.expired');
    expect(execute).toHaveBeenCalledWith('read.current');
    expect(acknowledge).toHaveBeenCalledWith({
      id: 'dispatch.1',
      claimToken: 'worker.1.claim',
      completedAt: '2026-08-03T10:00:00.000Z',
    });
    expect(events.map((event) => event.kind)).toEqual([
      'job.recovered',
      'job.started',
      'job.completed',
    ]);
  });

  it('releases retryable failures and terminally records non-retryable dispatch failures', async () => {
    const release = vi.fn(async () => 'stored' as const);
    const fail = vi.fn(async () => 'stored' as const);
    const dispatch = dispatchStore({
      claimAvailable: vi
        .fn()
        .mockResolvedValueOnce({ id: 'dispatch.retry', jobId: 'read.retry', claimToken: 'retry' })
        .mockResolvedValueOnce({
          id: 'dispatch.reject',
          jobId: 'read.reject',
          claimToken: 'reject',
        }),
      release,
      fail,
    });
    const execute = vi
      .fn()
      .mockRejectedValueOnce(
        new OpsActionExecutionError('temporary-failure', 'Temporary failure.', true),
      )
      .mockRejectedValueOnce(
        new OpsActionExecutionError('invalid-dispatch', 'Invalid dispatch.', false),
      );
    const process = createHostedWorkerProcess({
      owner: 'worker.1',
      pollMs: 1_000,
      dispatchLeaseMs: 30_000,
      retryMs: 5_000,
      recoveryLimit: 100,
      worker: { recover: vi.fn(), execute } as never,
      dispatch,
      probe: vi.fn(async () => {}),
      now: () => new Date('2026-08-03T10:00:00.000Z'),
    });

    await process.workOnce();
    await process.workOnce();
    expect(release).toHaveBeenCalledWith({
      id: 'dispatch.retry',
      claimToken: 'retry',
      availableAt: '2026-08-03T10:00:05.000Z',
    });
    expect(fail).toHaveBeenCalledWith({
      id: 'dispatch.reject',
      claimToken: 'reject',
      failedAt: '2026-08-03T10:00:00.000Z',
      code: 'invalid-dispatch',
    });
  });

  it('stops a bounded polling loop through AbortSignal', async () => {
    const controller = new AbortController();
    const delay = vi.fn(async (_milliseconds: number, signal: AbortSignal) => {
      controller.abort();
      expect(signal).toBe(controller.signal);
    });
    const process = createHostedWorkerProcess({
      owner: 'worker.1',
      pollMs: 1_000,
      dispatchLeaseMs: 30_000,
      retryMs: 5_000,
      recoveryLimit: 100,
      worker: { recover: vi.fn(), execute: vi.fn() } as never,
      dispatch: dispatchStore(),
      probe: vi.fn(async () => {}),
      delay,
    });

    await process.run(controller.signal);
    expect(delay).toHaveBeenCalledTimes(1);
    expect(process.health()).toEqual({ role: 'worker', ready: false });
  });
});
