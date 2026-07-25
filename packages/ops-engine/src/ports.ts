import type { OpsApprovalRecord, OpsLockLease, OpsMutationReceipt } from './safety.js';

export type OpsStoreDurability = 'local' | 'durable';

export interface OpsStateCapability {
  durability: OpsStoreDurability;
}

export interface SecretReference {
  provider: string;
  profile: string;
  name: string;
}

export interface ResolvedSecret {
  value: string;
  expiresAt: string | null;
}

export interface SecretResolver {
  readonly writable: boolean;
  resolve(reference: SecretReference): Promise<ResolvedSecret | null>;
}

export interface SecretWriter extends SecretResolver {
  readonly writable: true;
  write(reference: SecretReference, value: string): Promise<void>;
  delete(reference: SecretReference): Promise<void>;
}

export type OpsArtifactKind = 'inventory' | 'plan' | 'report' | 'receipt' | 'drift' | 'state';

export interface OpsArtifactRecord<T = unknown> {
  id: string;
  kind: OpsArtifactKind;
  value: T;
  createdAt: string;
  expiresAt: string | null;
}

export interface ArtifactStore extends OpsStateCapability {
  put<T>(record: OpsArtifactRecord<T>): Promise<void>;
  get<T>(id: string): Promise<OpsArtifactRecord<T> | null>;
  hasReceiptForPlan(planHash: string): Promise<boolean>;
  recordReceipt(receipt: OpsMutationReceipt): Promise<void>;
}

export interface ApprovalStore extends OpsStateCapability {
  put(approval: OpsApprovalRecord): Promise<void>;
  get(approvalId: string): Promise<OpsApprovalRecord | null>;
}

export interface OpsLockRequest {
  lockId: string;
  owner: string;
  ttlMs: number;
  now: string;
}

export interface LockStore extends OpsStateCapability {
  readonly atomic: boolean;
  acquire(request: OpsLockRequest): Promise<OpsLockLease | null>;
  renew(lease: OpsLockLease, ttlMs: number, now: string): Promise<OpsLockLease>;
  release(lease: OpsLockLease): Promise<void>;
  assertCurrent(lease: OpsLockLease, now: string): Promise<void>;
}

export interface OpsExecutionState {
  artifacts: ArtifactStore;
  approvals: ApprovalStore;
  locks: LockStore;
}

export function assertOpsExecutionState(args: {
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  state: OpsExecutionState;
}): void {
  if (args.actor === 'developer' && !args.production && !args.multiProcess) return;
  if (
    args.state.artifacts.durability !== 'durable' ||
    args.state.approvals.durability !== 'durable' ||
    args.state.locks.durability !== 'durable' ||
    !args.state.locks.atomic
  ) {
    throw new Error(
      '[OPS_STATE_DURABILITY_REQUIRED] Automation, production, and multi-process mutation require durable artifact and approval stores plus an atomic durable lock store.',
    );
  }
}
