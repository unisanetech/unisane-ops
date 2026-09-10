import { z } from 'zod';
import type { ApprovalStore, ArtifactStore, OpsArtifactRecord } from '../ports.js';
import { hashOpsValue, opsApprovalRecordSchema, opsMutationReceiptSchema } from '../safety.js';
import { encode, rowJson, transaction, type SqliteExecutionDatabase } from './database.js';
const artifactSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['inventory', 'plan', 'report', 'receipt', 'drift', 'state']),
    value: z.unknown(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
  })
  .strict();
export function createSqliteRecordStores(db: SqliteExecutionDatabase): {
  artifacts: ArtifactStore;
  approvals: ApprovalStore;
} {
  return {
    artifacts: {
      durability: 'durable',
      async put<T>(input: OpsArtifactRecord<T>) {
        const record = artifactSchema.parse(input);
        if (record.kind === 'receipt')
          throw new Error('[OPS_RECEIPT_WRITE_REQUIRED] Use immutable receipt storage.');
        transaction(db, () => {
          const previous = rowJson(
            db.prepare('SELECT payload FROM ops_artifacts WHERE id = ?').get(record.id),
          );
          if (previous) {
            const existing = artifactSchema.parse(previous);
            if (
              existing.kind !== record.kind ||
              (existing.kind === 'plan' && hashOpsValue(existing) !== hashOpsValue(record))
            )
              throw new Error('[OPS_ARTIFACT_IMMUTABLE] Stored plan cannot be changed.');
          }
          db.prepare(
            'INSERT INTO ops_artifacts VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
          ).run(record.id, encode(record));
        });
      },
      async get<T>(id: string) {
        const value = rowJson(db.prepare('SELECT payload FROM ops_artifacts WHERE id = ?').get(id));
        return value === null ? null : (artifactSchema.parse(value) as OpsArtifactRecord<T>);
      },
      async hasReceiptForPlan(planHash: string) {
        return !!db.prepare('SELECT plan_hash FROM ops_receipts WHERE plan_hash = ?').get(planHash);
      },
      async recordReceipt(input) {
        const receipt = opsMutationReceiptSchema.parse(input);
        const result = db
          .prepare('INSERT OR IGNORE INTO ops_receipts VALUES (?,?)')
          .run(receipt.planHash, encode(receipt));
        if (Number(result.changes) !== 1)
          throw new Error('[OPS_RECEIPT_REPLAY] Receipt already exists for this plan.');
      },
    },
    approvals: {
      durability: 'durable',
      async put(input) {
        const approval = opsApprovalRecordSchema.parse(input);
        transaction(db, () => {
          const previous = rowJson(
            db.prepare('SELECT payload FROM ops_approvals WHERE id = ?').get(approval.approvalId),
          );
          if (previous) {
            if (hashOpsValue(opsApprovalRecordSchema.parse(previous)) !== hashOpsValue(approval))
              throw new Error('[OPS_APPROVAL_IMMUTABLE] Approval cannot be overwritten.');
            return;
          }
          db.prepare('INSERT INTO ops_approvals VALUES (?,?)').run(
            approval.approvalId,
            encode(approval),
          );
        });
      },
      async get(id) {
        const value = rowJson(db.prepare('SELECT payload FROM ops_approvals WHERE id = ?').get(id));
        return value === null ? null : opsApprovalRecordSchema.parse(value);
      },
    },
  };
}
