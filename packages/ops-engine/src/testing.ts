import type {
  ApprovalStore,
  ArtifactStore,
  LockStore,
  OpsArtifactRecord,
  OpsLockRequest,
  OpsStoreDurability,
} from './ports.js';
import type { OpsApprovalRecord, OpsLockLease, OpsMutationReceipt } from './safety.js';

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
