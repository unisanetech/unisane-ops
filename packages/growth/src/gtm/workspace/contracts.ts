import { z } from 'zod';
import {
  opsApprovalRecordSchema,
  opsLockLeaseSchema,
  opsMutationPlanSchema,
  opsMutationReceiptSchema,
} from '@unisane/ops-engine';
import { googleTagManagerDiagnosisInputSchema } from '../diagnosis.js';
export const GTM_WORKSPACE_ACTION = 'growth.gtm.workspace.apply';
const id = z.string().regex(/^[a-zA-Z0-9_-]+$/);
export const gtmWorkspaceParametersSchema = z
  .object({
    connectionId: z.string().min(1),
    workspaceId: id,
    manifest: googleTagManagerDiagnosisInputSchema.shape.manifest,
  })
  .strict();
export const gtmWorkspaceSnapshotSchema =
  googleTagManagerDiagnosisInputSchema.shape.snapshot.unwrap();
export const gtmWorkspaceChangesSchema = z
  .object({
    containerPath: z.string(),
    operations: z
      .array(
        z
          .object({
            type: z.enum([
              'create_resource',
              'update_resource',
              'pause_tag',
              'retain_unmanaged_resource',
            ]),
            kind: z.enum(['folder', 'built_in_variable', 'variable', 'trigger', 'tag']),
            slug: z.string().min(1),
            remoteId: z.string().optional(),
            fingerprint: z.string().optional(),
            before: z.unknown().optional(),
            after: z.unknown().optional(),
          })
          .strict(),
      )
      .max(10000),
  })
  .strict();
export const gtmWorkspaceReviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    parameters: gtmWorkspaceParametersSchema,
    plan: opsMutationPlanSchema,
    snapshot: gtmWorkspaceSnapshotSchema,
    changes: gtmWorkspaceChangesSchema,
  })
  .strict();
export const gtmWorkspacePlanInputSchema = gtmWorkspaceParametersSchema
  .extend({
    snapshot: gtmWorkspaceSnapshotSchema,
    generatedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();
export const gtmWorkspaceApplyInputSchema = z
  .object({
    review: gtmWorkspaceReviewSchema,
    approval: opsApprovalRecordSchema,
    lease: opsLockLeaseSchema,
  })
  .strict();
export const gtmWorkspaceApplyResultSchema = z
  .object({
    runId: z.string(),
    disposition: z.enum(['applied', 'outcome-unknown']),
    receipt: opsMutationReceiptSchema,
  })
  .strict();
export const gtmWorkspaceRecoveryInputSchema = z
  .object({ runId: z.string().regex(/^gtm\.[a-f0-9]{64}$/) })
  .strict();
export const gtmWorkspaceRecoveryResultSchema = z
  .object({
    runId: z.string(),
    projectId: z.string(),
    environmentId: z.string(),
    workspacePath: z.string(),
    checkedAt: z.string().datetime(),
    status: z.enum(['verified', 'not-matched', 'unavailable']),
    remainingOperations: gtmWorkspaceChangesSchema.shape.operations,
    trackingVerified: z.literal(false),
    message: z.string(),
  })
  .strict();
export const gtmWorkspaceAttemptSchema = z
  .object({
    review: gtmWorkspaceReviewSchema,
    status: z.enum(['started', 'completed', 'uncertain']),
    notBefore: z.string().datetime(),
    receipt: opsMutationReceiptSchema.optional(),
    verification: gtmWorkspaceRecoveryResultSchema.optional(),
  })
  .strict();
export type GtmWorkspaceParameters = z.infer<typeof gtmWorkspaceParametersSchema>;
export type GtmWorkspaceReview = z.infer<typeof gtmWorkspaceReviewSchema>;
export type GtmWorkspaceAttempt = z.infer<typeof gtmWorkspaceAttemptSchema>;

export const gtmWorkspaceCommandSchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('plan'),
      connectionId: z.string().min(1),
      workspaceId: z.string().regex(/^\d+$/),
    })
    .strict(),
  z
    .object({ operation: z.literal('review'), planHash: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict(),
  z
    .object({
      operation: z.literal('approve'),
      planHash: z.string().regex(/^[a-f0-9]{64}$/),
      confirmPlanHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({ operation: z.literal('apply'), planHash: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict(),
  z
    .object({ operation: z.literal('recover'), runId: z.string().regex(/^gtm\.[a-f0-9]{64}$/) })
    .strict(),
]);
export type GtmWorkspaceCommand = z.infer<typeof gtmWorkspaceCommandSchema>;
