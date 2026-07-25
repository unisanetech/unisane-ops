import { createHash } from 'node:crypto';
import { z } from 'zod';
import { assertOpsExecutionState, type OpsExecutionState } from './ports.js';

const isoTimestampSchema = z.string().datetime({ offset: true });
const nonEmptySchema = z.string().trim().min(1);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const opsMutationActionSchema = z
  .object({
    id: nonEmptySchema,
    type: z.enum(['create', 'update', 'delete', 'verify', 'no-op']),
    risk: z.enum(['low', 'medium', 'high']),
    resourceIdentity: nonEmptySchema,
    inputHash: sha256Schema,
  })
  .strict();
export type OpsMutationAction = z.infer<typeof opsMutationActionSchema>;

const opsMutationPlanPayloadSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.mutation-plan'),
    planId: nonEmptySchema,
    provider: nonEmptySchema,
    projectId: nonEmptySchema,
    environment: nonEmptySchema,
    targetIdentity: nonEmptySchema,
    commandVersion: nonEmptySchema,
    configHash: sha256Schema,
    inventoryHash: sha256Schema,
    generatedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
    actions: z.array(opsMutationActionSchema),
  })
  .strict();

export const opsMutationPlanSchema = opsMutationPlanPayloadSchema
  .extend({ planHash: sha256Schema })
  .strict();
export type OpsMutationPlan = z.infer<typeof opsMutationPlanSchema>;
export type OpsMutationPlanInput = z.input<typeof opsMutationPlanPayloadSchema>;

export const opsApprovalRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.approval'),
    approvalId: nonEmptySchema,
    planHash: sha256Schema,
    actor: nonEmptySchema,
    provider: nonEmptySchema,
    projectId: nonEmptySchema,
    environment: nonEmptySchema,
    targetIdentity: nonEmptySchema,
    approvedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();
export type OpsApprovalRecord = z.infer<typeof opsApprovalRecordSchema>;

export const opsLockLeaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.lock-lease'),
    lockId: nonEmptySchema,
    owner: nonEmptySchema,
    leaseToken: nonEmptySchema,
    fencingValue: z.number().int().nonnegative(),
    acquiredAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();
export type OpsLockLease = z.infer<typeof opsLockLeaseSchema>;

export const opsMutationReceiptSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.mutation-receipt'),
    receiptId: nonEmptySchema,
    planId: nonEmptySchema,
    planHash: sha256Schema,
    provider: nonEmptySchema,
    projectId: nonEmptySchema,
    environment: nonEmptySchema,
    targetIdentity: nonEmptySchema,
    actor: nonEmptySchema,
    approvalId: nonEmptySchema,
    lockId: nonEmptySchema,
    lockFencingValue: z.number().int().nonnegative(),
    startedAt: isoTimestampSchema,
    completedAt: isoTimestampSchema,
    status: z.enum(['succeeded', 'failed', 'partial']),
    results: z.array(
      z
        .object({
          actionId: nonEmptySchema,
          status: z.enum(['succeeded', 'failed', 'skipped']),
          outputHash: sha256Schema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();
export type OpsMutationReceipt = z.infer<typeof opsMutationReceiptSchema>;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
}

export function hashOpsValue(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

export function hashOpsMutationPlanPayload(input: OpsMutationPlanInput): string {
  return hashOpsValue(opsMutationPlanPayloadSchema.parse(input));
}

function mutationPlanPayload(plan: OpsMutationPlan): OpsMutationPlanInput {
  return opsMutationPlanPayloadSchema.parse(
    Object.fromEntries(Object.entries(plan).filter(([key]) => key !== 'planHash')),
  );
}

export function createOpsMutationPlan(input: OpsMutationPlanInput): OpsMutationPlan {
  const payload = opsMutationPlanPayloadSchema.parse(input);
  return opsMutationPlanSchema.parse({
    ...payload,
    planHash: hashOpsMutationPlanPayload(payload),
  });
}

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

export interface OpsMutationExpectation {
  provider: string;
  projectId: string;
  environment: string;
  targetIdentity: string;
  lockId: string;
}

export interface OpsMutationPreflightResult {
  plan: OpsMutationPlan;
  approval: OpsApprovalRecord;
  lease: OpsLockLease;
}

export async function assertOpsMutationPreflight(args: {
  plan: unknown;
  approval: unknown;
  lease: unknown;
  expectation: OpsMutationExpectation;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
  lockOwner: string;
  state: OpsExecutionState;
  priorReceipts?: readonly unknown[];
  now?: Date;
}): Promise<OpsMutationPreflightResult> {
  const parsedPlan = opsMutationPlanSchema.safeParse(args.plan);
  if (!parsedPlan.success) fail('OPS_PLAN_SCHEMA_INVALID', 'Mutation plan schema is invalid.');
  const plan = parsedPlan.data;
  const expectedHash = hashOpsMutationPlanPayload(mutationPlanPayload(plan));
  if (plan.planHash !== expectedHash) {
    fail('OPS_PLAN_HASH_MISMATCH', 'Mutation plan hash does not match its canonical payload.');
  }
  const now = args.now ?? new Date();
  const generatedAt = Date.parse(plan.generatedAt);
  const expiresAt = Date.parse(plan.expiresAt);
  if (generatedAt > now.getTime()) {
    fail('OPS_PLAN_FUTURE_TIMESTAMP', 'Mutation plan was generated in the future.');
  }
  if (expiresAt <= now.getTime()) fail('OPS_PLAN_STALE', 'Mutation plan is expired.');
  for (const key of ['provider', 'projectId', 'environment', 'targetIdentity'] as const) {
    if (plan[key] !== args.expectation[key]) {
      fail('OPS_PLAN_IDENTITY_MISMATCH', `Mutation plan ${key} does not match the target.`);
    }
  }

  const parsedApproval = opsApprovalRecordSchema.safeParse(args.approval);
  if (!parsedApproval.success) {
    fail('OPS_APPROVAL_SCHEMA_INVALID', 'Approval record schema is invalid.');
  }
  const approval = parsedApproval.data;
  if (
    approval.planHash !== plan.planHash ||
    approval.provider !== plan.provider ||
    approval.projectId !== plan.projectId ||
    approval.environment !== plan.environment ||
    approval.targetIdentity !== plan.targetIdentity
  ) {
    fail('OPS_APPROVAL_MISMATCH', 'Approval is not bound to this exact plan and target.');
  }
  if (Date.parse(approval.expiresAt) <= now.getTime()) {
    fail('OPS_APPROVAL_EXPIRED', 'Approval is expired.');
  }

  const parsedLease = opsLockLeaseSchema.safeParse(args.lease);
  if (!parsedLease.success) fail('OPS_LOCK_SCHEMA_INVALID', 'Lock lease schema is invalid.');
  const lease = parsedLease.data;
  if (lease.owner !== args.lockOwner) {
    fail('OPS_LOCK_OWNER_MISMATCH', 'Lock lease is owned by another actor.');
  }
  if (lease.lockId !== args.expectation.lockId) {
    fail('OPS_LOCK_IDENTITY_MISMATCH', 'Lock lease is not bound to this mutation target.');
  }
  if (Date.parse(lease.expiresAt) <= now.getTime()) {
    fail('OPS_LOCK_EXPIRED', 'Lock lease is expired.');
  }

  for (const receiptInput of args.priorReceipts ?? []) {
    const receipt = opsMutationReceiptSchema.safeParse(receiptInput);
    if (receipt.success && receipt.data.planHash === plan.planHash) {
      fail('OPS_RECEIPT_REPLAY', 'Mutation plan already has a receipt and cannot be replayed.');
    }
  }
  assertOpsExecutionState({
    actor: args.actor,
    production: args.production,
    multiProcess: args.multiProcess,
    state: args.state,
  });
  const storedApproval = await args.state.approvals.get(approval.approvalId);
  if (!storedApproval || hashOpsValue(storedApproval) !== hashOpsValue(approval)) {
    fail('OPS_APPROVAL_NOT_RECORDED', 'Approval is not present unchanged in the configured store.');
  }
  await args.state.locks.assertCurrent(lease, now.toISOString());
  if (await args.state.artifacts.hasReceiptForPlan(plan.planHash)) {
    fail(
      'OPS_RECEIPT_REPLAY',
      'Mutation plan already has a stored receipt and cannot be replayed.',
    );
  }
  return { plan, approval, lease };
}
