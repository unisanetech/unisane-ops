import type { HostedReadScheduleStore } from '@unisane/ops-engine/hosted/scheduler';
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

export function createHostedSchedulerProcess(input: {
  owner: string;
  pollMs: number;
  leaseMs: number;
  recoveryLimit: number;
  schedules: HostedReadScheduleStore;
  probe(): Promise<void>;
  observer?: HostedRoleObserver;
  now?: () => Date;
  delay?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}) {
  const observer = input.observer ?? silentHostedRoleObserver;
  const now = input.now ?? (() => new Date());
  const delay = input.delay ?? abortableDelay;
  let ready = false;

  async function workOnce(): Promise<boolean> {
    const claimedAt = now();
    const recovered = await input.schedules.recoverExpired({
      now: claimedAt.toISOString(),
      limit: input.recoveryLimit,
    });
    if (recovered > 0) {
      await observer.emit({
        kind: 'schedule.recovered',
        role: 'scheduler',
        occurredAt: claimedAt.toISOString(),
        count: recovered,
      });
    }
    const claim = await input.schedules.claimDue({
      owner: input.owner,
      now: claimedAt.toISOString(),
      expiresAt: new Date(claimedAt.getTime() + input.leaseMs).toISOString(),
    });
    if (!claim) return false;
    const materializedAt = now().toISOString();
    const result = await input.schedules.materialize({ claim, materializedAt });
    if (result === 'conflict') throw new Error('Hosted schedule changed before materialization.');
    await observer.emit({
      kind: 'schedule.materialized',
      role: 'scheduler',
      occurredAt: materializedAt,
      occurrenceId: result.occurrenceId,
    });
    return true;
  }

  return {
    health: () => ({ role: 'scheduler' as const, ready }),
    workOnce,
    async run(signal: AbortSignal): Promise<void> {
      try {
        await input.probe();
        ready = true;
        await observer.emit({
          kind: 'role.ready',
          role: 'scheduler',
          occurredAt: now().toISOString(),
        });
        while (!signal.aborted) if (!(await workOnce())) await delay(input.pollMs, signal);
      } catch (error) {
        ready = false;
        await observer.emit({
          kind: 'role.failure',
          role: 'scheduler',
          occurredAt: now().toISOString(),
          code: error instanceof Error ? error.name : 'unknown-error',
        });
        throw error;
      } finally {
        ready = false;
        await observer.emit({
          kind: 'role.stopped',
          role: 'scheduler',
          occurredAt: now().toISOString(),
        });
      }
    },
  };
}
