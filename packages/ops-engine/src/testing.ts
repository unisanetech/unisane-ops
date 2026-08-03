import type {
  ApprovalStore,
  ArtifactStore,
  LockStore,
  OpsArtifactRecord,
  OpsLockRequest,
  OpsStoreDurability,
} from './ports.js';
import type { OpsApprovalRecord, OpsLockLease, OpsMutationReceipt } from './safety.js';
import type {
  OpsActionAdmission,
  OpsActionAuditEvent,
  OpsActionJob,
  OpsActionJobError,
  OpsActionJobStore,
  OpsActionSnapshot,
} from './execution.js';
import type { OpsReadActionRequest, OpsReadActionResult } from './actions.js';
import {
  opsMutationRunQuerySchema,
  parseOpsMutationRun,
  type OpsMutationRun,
  type OpsMutationRunQuery,
  type OpsMutationRunStore,
} from './runs.js';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryArtifactStore implements ArtifactStore {
  readonly records = new Map<string, OpsArtifactRecord>();
  readonly receipts = new Map<string, OpsMutationReceipt>();
  constructor(readonly durability: OpsStoreDurability = 'local') {}

  async put<T>(record: OpsArtifactRecord<T>): Promise<void> {
    this.records.set(record.id, record as OpsArtifactRecord);
  }

  async get<T>(id: string): Promise<OpsArtifactRecord<T> | null> {
    return (this.records.get(id) as OpsArtifactRecord<T> | undefined) ?? null;
  }

  async hasReceiptForPlan(planHash: string): Promise<boolean> {
    return this.receipts.has(planHash);
  }

  async recordReceipt(receipt: OpsMutationReceipt): Promise<void> {
    if (this.receipts.has(receipt.planHash)) {
      throw new Error('[OPS_RECEIPT_REPLAY] A receipt already exists for this plan.');
    }
    this.receipts.set(receipt.planHash, receipt);
  }
}

export class InMemoryApprovalStore implements ApprovalStore {
  readonly records = new Map<string, OpsApprovalRecord>();
  constructor(readonly durability: OpsStoreDurability = 'local') {}

  async put(approval: OpsApprovalRecord): Promise<void> {
    this.records.set(approval.approvalId, approval);
  }

  async get(approvalId: string): Promise<OpsApprovalRecord | null> {
    return this.records.get(approvalId) ?? null;
  }
}

export class InMemoryOpsMutationRunStore implements OpsMutationRunStore {
  readonly records = new Map<string, OpsMutationRun>();

  constructor(
    readonly durability: OpsStoreDurability = 'local',
    readonly atomic = true,
  ) {}

  async get<TActionState = unknown>(runId: string): Promise<OpsMutationRun<TActionState> | null> {
    const run = this.records.get(runId);
    return run ? (clone(run) as OpsMutationRun<TActionState>) : null;
  }

  async list<TActionState = unknown>(
    queryInput: OpsMutationRunQuery,
  ): Promise<Array<OpsMutationRun<TActionState>>> {
    const query = opsMutationRunQuerySchema.parse(queryInput);
    return [...this.records.values()]
      .filter(
        (run) =>
          run.actionId === query.actionId &&
          run.projectId === query.projectId &&
          run.environmentId === query.environmentId,
      )
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
          left.runId.localeCompare(right.runId),
      )
      .slice(0, query.limit)
      .map((run) => clone(run) as OpsMutationRun<TActionState>);
  }

  async compareAndSet<TActionState>(
    runInput: OpsMutationRun<TActionState>,
    expectedRevision: number | null,
  ): Promise<'stored' | 'conflict'> {
    const run = parseOpsMutationRun<TActionState>(runInput);
    if (run.revision !== (expectedRevision ?? 0) + 1) {
      throw new Error('[OPS_RUN_REVISION_INVALID] Mutation run revision must advance by one.');
    }
    const current = this.records.get(run.runId);
    if ((current?.revision ?? null) !== expectedRevision) return 'conflict';
    this.records.set(run.runId, clone(run));
    return 'stored';
  }
}

export class InMemoryLockStore implements LockStore {
  readonly leases = new Map<string, OpsLockLease>();
  private fencingValue = 0;

  constructor(
    readonly durability: OpsStoreDurability = 'local',
    readonly atomic = true,
  ) {}

  async acquire(request: OpsLockRequest): Promise<OpsLockLease | null> {
    const current = this.leases.get(request.lockId);
    if (current && Date.parse(current.expiresAt) > Date.parse(request.now)) return null;
    this.fencingValue += 1;
    const lease: OpsLockLease = {
      schemaVersion: 1,
      kind: 'ops.lock-lease',
      lockId: request.lockId,
      owner: request.owner,
      leaseToken: `${request.lockId}:${request.owner}:${this.fencingValue}`,
      fencingValue: this.fencingValue,
      acquiredAt: request.now,
      expiresAt: new Date(Date.parse(request.now) + request.ttlMs).toISOString(),
    };
    this.leases.set(request.lockId, lease);
    return lease;
  }

  async renew(lease: OpsLockLease, ttlMs: number, now: string): Promise<OpsLockLease> {
    await this.assertCurrent(lease, now);
    const renewed = {
      ...lease,
      expiresAt: new Date(Date.parse(now) + ttlMs).toISOString(),
    };
    this.leases.set(lease.lockId, renewed);
    return renewed;
  }

  async release(lease: OpsLockLease): Promise<void> {
    const current = this.leases.get(lease.lockId);
    if (!current || current.leaseToken !== lease.leaseToken || current.owner !== lease.owner) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Only the current lock owner may release.');
    }
    this.leases.delete(lease.lockId);
  }

  async assertCurrent(lease: OpsLockLease, now: string): Promise<void> {
    const current = this.leases.get(lease.lockId);
    if (
      !current ||
      current.leaseToken !== lease.leaseToken ||
      current.owner !== lease.owner ||
      current.fencingValue !== lease.fencingValue
    ) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership has changed.');
    }
    if (Date.parse(current.expiresAt) <= Date.parse(now)) {
      throw new Error('[OPS_LOCK_EXPIRED] Lock lease is expired.');
    }
  }
}

export class InMemoryActionJobStore implements OpsActionJobStore {
  readonly jobs = new Map<string, OpsActionJob>();
  readonly audit = new Map<string, OpsActionAuditEvent[]>();
  private readonly idempotency = new Map<string, string>();
  private sequence = 0;

  constructor(readonly durability: OpsStoreDurability = 'local') {}

  private idempotencyIdentity(request: OpsReadActionRequest): string {
    return [
      request.context.scopeId,
      request.context.projectId,
      request.actionId,
      request.idempotencyKey,
    ].join(':');
  }

  private append(
    job: OpsActionJob,
    type: OpsActionAuditEvent['type'],
    actorId: string,
    occurredAt: string,
  ): void {
    this.sequence += 1;
    const event: OpsActionAuditEvent = {
      schemaVersion: 1,
      kind: 'ops.action-audit-event',
      eventId: `event.${this.sequence}`,
      jobId: job.jobId,
      type,
      actorId,
      occurredAt,
      revision: job.revision,
    };
    this.audit.set(job.jobId, [...(this.audit.get(job.jobId) ?? []), event]);
  }

  private current(jobId: string): OpsActionJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('[OPS_ACTION_JOB_NOT_FOUND] Action job was not found.');
    return job;
  }

  private assertClaim(job: OpsActionJob, claimToken: string): void {
    if (job.claimToken !== claimToken || !['running', 'cancel-requested'].includes(job.status)) {
      throw new Error('[OPS_ACTION_JOB_CLAIM_MISMATCH] The worker does not own this job claim.');
    }
  }

  async admit(input: {
    jobId: string;
    action: OpsActionSnapshot;
    request: OpsReadActionRequest;
    requestHash: string;
    now: string;
  }): Promise<OpsActionAdmission> {
    const identity = this.idempotencyIdentity(input.request);
    const existingId = this.idempotency.get(identity);
    if (existingId) {
      const existing = this.current(existingId);
      if (existing.requestHash !== input.requestHash) {
        throw new Error(
          '[OPS_ACTION_IDEMPOTENCY_CONFLICT] The idempotency key has different input.',
        );
      }
      this.append(existing, 'admission-reused', input.request.context.principal.id, input.now);
      return { job: clone(existing), created: false };
    }
    if (this.jobs.has(input.jobId)) {
      throw new Error('[OPS_ACTION_JOB_ID_CONFLICT] Action job ids must be unique.');
    }
    const job: OpsActionJob = {
      schemaVersion: 1,
      kind: 'ops.action-job',
      jobId: input.jobId,
      requestHash: input.requestHash,
      action: clone(input.action),
      request: clone(input.request),
      status: 'queued',
      revision: 0,
      attemptCount: 0,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.jobs.set(job.jobId, job);
    this.idempotency.set(identity, job.jobId);
    this.append(job, 'admitted', input.request.context.principal.id, input.now);
    return { job: clone(job), created: true };
  }

  async claimNext(input: {
    workerId: string;
    now: string;
    leaseMs: number;
  }): Promise<OpsActionJob | null> {
    const job = [...this.jobs.values()].find((candidate) => candidate.status === 'queued');
    if (!job) return null;
    this.sequence += 1;
    const claimed: OpsActionJob = {
      ...job,
      status: 'running',
      revision: job.revision + 1,
      attemptCount: job.attemptCount + 1,
      claimedBy: input.workerId,
      claimToken: `claim.${this.sequence}`,
      leaseExpiresAt: new Date(Date.parse(input.now) + input.leaseMs).toISOString(),
      updatedAt: input.now,
    };
    this.jobs.set(claimed.jobId, claimed);
    this.append(claimed, 'claimed', input.workerId, input.now);
    return clone(claimed);
  }

  async complete(input: {
    jobId: string;
    claimToken: string;
    result: OpsReadActionResult;
    now: string;
  }): Promise<OpsActionJob> {
    const job = this.current(input.jobId);
    this.assertClaim(job, input.claimToken);
    const cancelled = job.status === 'cancel-requested';
    const completed: OpsActionJob = {
      ...job,
      status: cancelled ? 'cancelled' : 'succeeded',
      revision: job.revision + 1,
      updatedAt: input.now,
      ...(cancelled ? {} : { result: clone(input.result) }),
    };
    delete completed.claimedBy;
    delete completed.claimToken;
    delete completed.leaseExpiresAt;
    this.jobs.set(completed.jobId, completed);
    this.append(completed, cancelled ? 'cancelled' : 'succeeded', job.claimedBy!, input.now);
    return clone(completed);
  }

  async fail(input: {
    jobId: string;
    claimToken: string;
    error: OpsActionJobError;
    now: string;
  }): Promise<OpsActionJob> {
    const job = this.current(input.jobId);
    this.assertClaim(job, input.claimToken);
    const cancelled = job.status === 'cancel-requested';
    const failed: OpsActionJob = {
      ...job,
      status: cancelled ? 'cancelled' : 'failed',
      revision: job.revision + 1,
      updatedAt: input.now,
      ...(cancelled ? {} : { error: clone(input.error) }),
    };
    delete failed.claimedBy;
    delete failed.claimToken;
    delete failed.leaseExpiresAt;
    this.jobs.set(failed.jobId, failed);
    this.append(failed, cancelled ? 'cancelled' : 'failed', job.claimedBy!, input.now);
    return clone(failed);
  }

  async requestCancellation(input: {
    jobId: string;
    actorId: string;
    now: string;
  }): Promise<OpsActionJob> {
    const job = this.current(input.jobId);
    if (['succeeded', 'failed', 'cancelled'].includes(job.status)) return clone(job);
    const queued = job.status === 'queued';
    const next: OpsActionJob = {
      ...job,
      status: queued ? 'cancelled' : 'cancel-requested',
      revision: job.revision + 1,
      cancellationRequestedAt: input.now,
      updatedAt: input.now,
    };
    this.jobs.set(next.jobId, next);
    this.append(next, queued ? 'cancelled' : 'cancellation-requested', input.actorId, input.now);
    return clone(next);
  }

  async recoverExpired(input: { now: string; actorId: string }): Promise<number> {
    let recovered = 0;
    for (const job of this.jobs.values()) {
      if (
        !['running', 'cancel-requested'].includes(job.status) ||
        !job.leaseExpiresAt ||
        Date.parse(job.leaseExpiresAt) > Date.parse(input.now)
      ) {
        continue;
      }
      const cancelled = job.status === 'cancel-requested';
      const next: OpsActionJob = {
        ...job,
        status: cancelled ? 'cancelled' : 'queued',
        revision: job.revision + 1,
        updatedAt: input.now,
      };
      delete next.claimedBy;
      delete next.claimToken;
      delete next.leaseExpiresAt;
      this.jobs.set(next.jobId, next);
      this.append(next, cancelled ? 'cancelled' : 'requeued', input.actorId, input.now);
      recovered += 1;
    }
    return recovered;
  }

  async get(jobId: string): Promise<OpsActionJob | null> {
    const job = this.jobs.get(jobId);
    return job ? clone(job) : null;
  }

  async listAudit(jobId: string): Promise<readonly OpsActionAuditEvent[]> {
    return clone(this.audit.get(jobId) ?? []);
  }
}
