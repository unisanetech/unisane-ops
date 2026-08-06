export type HostedRoleEvent =
  | { kind: 'role.ready'; role: 'gateway' | 'worker' | 'scheduler'; occurredAt: string }
  | { kind: 'role.stopped'; role: 'gateway' | 'worker' | 'scheduler'; occurredAt: string }
  | {
      kind: 'role.failure';
      role: 'gateway' | 'worker' | 'scheduler';
      occurredAt: string;
      code: string;
    }
  | { kind: 'job.recovered'; role: 'worker'; occurredAt: string; jobId: string }
  | { kind: 'job.started'; role: 'worker'; occurredAt: string; jobId: string }
  | {
      kind: 'job.completed';
      role: 'worker';
      occurredAt: string;
      jobId: string;
      phase: 'succeeded' | 'failed';
    }
  | { kind: 'job.deferred'; role: 'worker'; occurredAt: string; jobId: string; code: string }
  | { kind: 'job.discarded'; role: 'worker'; occurredAt: string; jobId: string; code: string }
  | { kind: 'schedule.recovered'; role: 'scheduler'; occurredAt: string; count: number }
  | { kind: 'schedule.materialized'; role: 'scheduler'; occurredAt: string; occurrenceId: string };

export interface HostedRoleObserver {
  emit(event: HostedRoleEvent): void | Promise<void>;
}

export const silentHostedRoleObserver: HostedRoleObserver = {
  emit() {},
};
