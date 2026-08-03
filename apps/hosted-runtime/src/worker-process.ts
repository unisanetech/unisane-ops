import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import type { HostedReadDispatchStore } from '@unisane/ops-hosted-postgresql';
import type { HostedWorkerRole } from './worker.js';
import { silentHostedRoleObserver, type HostedRoleObserver } from './observability.js';

function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export function createHostedWorkerProcess(input: {
  owner: string;
  pollMs: number;
  dispatchLeaseMs: number;
  retryMs: number;
  recoveryLimit: number;
  worker: HostedWorkerRole;
  dispatch: HostedReadDispatchStore;
  probe(): Promise<void>;
  observer?: HostedRoleObserver;
  now?: () => Date;
  delay?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}) {
  const observer = input.observer ?? silentHostedRoleObserver;
  const now = input.now ?? (() => new Date());
  const delay = input.delay ?? abortableDelay;
  let ready = false;

  async function recoverExpired(): Promise<void> {
    const occurredAt = now().toISOString();
    const jobIds = await input.dispatch.listExpiredJobIds({
      now: occurredAt,
      limit: input.recoveryLimit,
    });
    for (const jobId of jobIds) {
      await input.worker.recover(jobId);
      await observer.emit({ kind: 'job.recovered', role: 'worker', occurredAt, jobId });
    }
  }

  async function workOnce(): Promise<boolean> {
    await recoverExpired();
    const claimedAt = now();
    const dispatch = await input.dispatch.claimAvailable({
      owner: input.owner,
      now: claimedAt.toISOString(),
      expiresAt: new Date(claimedAt.getTime() + input.dispatchLeaseMs).toISOString(),
    });
    if (!dispatch) return false;
    await observer.emit({
      kind: 'job.started',
      role: 'worker',
      occurredAt: claimedAt.toISOString(),
      jobId: dispatch.jobId,
    });
    try {
      const job = await input.worker.execute(dispatch.jobId);
      const completedAt = now().toISOString();
      const acknowledged = await input.dispatch.acknowledge({
        id: dispatch.id,
        claimToken: dispatch.claimToken,
        completedAt,
      });
      if (acknowledged === 'conflict') {
        throw new OpsActionExecutionError(
          'dispatch-acknowledgement-conflict',
          'The dispatch lease changed before acknowledgement.',
          true,
        );
      }
      if (job.phase !== 'succeeded' && job.phase !== 'failed') {
        throw new OpsActionExecutionError(
          'job-not-terminal',
          'The worker returned before the job was terminal.',
          true,
        );
      }
      await observer.emit({
        kind: 'job.completed',
        role: 'worker',
        occurredAt: completedAt,
        jobId: dispatch.jobId,
        phase: job.phase,
      });
    } catch (error) {
      const occurredAt = now().toISOString();
      const code = error instanceof OpsActionExecutionError ? error.code : 'worker-failed';
      if (error instanceof OpsActionExecutionError && !error.retryable) {
        await input.dispatch.fail({
          id: dispatch.id,
          claimToken: dispatch.claimToken,
          failedAt: occurredAt,
          code,
        });
        await observer.emit({
          kind: 'job.discarded',
          role: 'worker',
          occurredAt,
          jobId: dispatch.jobId,
          code,
        });
      } else {
        await input.dispatch.release({
          id: dispatch.id,
          claimToken: dispatch.claimToken,
          availableAt: new Date(Date.parse(occurredAt) + input.retryMs).toISOString(),
        });
        await observer.emit({
          kind: 'job.deferred',
          role: 'worker',
          occurredAt,
          jobId: dispatch.jobId,
          code,
        });
      }
    }
    return true;
  }

  return {
    health() {
      return { role: 'worker' as const, ready };
    },
    workOnce,
    async run(signal: AbortSignal): Promise<void> {
      try {
        await input.probe();
        ready = true;
        await observer.emit({
          kind: 'role.ready',
          role: 'worker',
          occurredAt: now().toISOString(),
        });
        while (!signal.aborted) {
          if (!(await workOnce())) await delay(input.pollMs, signal);
        }
      } catch (error) {
        ready = false;
        await observer.emit({
          kind: 'role.failure',
          role: 'worker',
          occurredAt: now().toISOString(),
          code: error instanceof Error ? error.name : 'unknown-error',
        });
        throw error;
      } finally {
        ready = false;
        await observer.emit({
          kind: 'role.stopped',
          role: 'worker',
          occurredAt: now().toISOString(),
        });
      }
    },
  };
}
