import { z } from 'zod';
import { opsMutationPlanSchema, opsMutationReceiptSchema } from '@unisane/ops-engine';
import { googleTagManagerDiagnosisInputSchema } from '../diagnosis.js';
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const id = z.string().regex(/^\d+$/);
const base = z.object({
  connectionId: z.string().min(1),
  manifest: googleTagManagerDiagnosisInputSchema.shape.manifest,
});
export const gtmReleaseParametersSchema = z.discriminatedUnion('kind', [
  base
    .extend({ kind: z.literal('version'), workspaceId: id, name: z.string().min(1).max(200) })
    .strict(),
  base.extend({ kind: z.literal('publish'), versionId: id }).strict(),
]);
export const gtmReleaseEvidenceSchema = z
  .object({
    contentDigest: hash,
    fingerprint: z.string().min(1).nullable(),
    liveRevision: hash.nullable(),
    versionId: id.nullable(),
  })
  .strict();
export const gtmReleaseReviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    parameters: gtmReleaseParametersSchema,
    evidence: gtmReleaseEvidenceSchema,
    plan: opsMutationPlanSchema,
    effects: z.array(z.string()),
    trackingVerified: z.literal(false),
  })
  .strict();
export const gtmReleaseRecoverySchema = z
  .object({
    runId: z.string(),
    projectId: z.string(),
    environmentId: z.string(),
    status: z.enum(['verified', 'not-matched', 'unavailable']),
    checkedAt: z.string().datetime(),
    versionId: id.nullable(),
    trackingVerified: z.literal(false),
    message: z.string(),
  })
  .strict();
export const gtmReleaseResultSchema = z
  .object({
    runId: z.string(),
    disposition: z.enum(['applied', 'outcome-unknown']),
    versionId: id.nullable(),
    receipt: opsMutationReceiptSchema,
  })
  .strict();
export const gtmReleaseAttemptSchema = z
  .object({
    review: gtmReleaseReviewSchema,
    notBefore: z.string().datetime(),
    receipt: opsMutationReceiptSchema.optional(),
    versionId: id.nullable(),
    verification: gtmReleaseRecoverySchema.optional(),
  })
  .strict();
export const gtmReleaseCommandSchema = z.discriminatedUnion('operation', [
  z
    .object({ operation: z.literal('preview'), connectionId: z.string().min(1), workspaceId: id })
    .strict(),
  z
    .object({
      operation: z.literal('plan-version'),
      connectionId: z.string().min(1),
      workspaceId: id,
      name: z.string().min(1).max(120),
    })
    .strict(),
  z
    .object({
      operation: z.literal('plan-publish'),
      connectionId: z.string().min(1),
      versionId: id,
    })
    .strict(),
  z.object({ operation: z.literal('review'), planHash: hash }).strict(),
  z.object({ operation: z.literal('approve'), planHash: hash, confirmPlanHash: hash }).strict(),
  z.object({ operation: z.literal('apply'), planHash: hash }).strict(),
  z
    .object({
      operation: z.literal('recover'),
      runId: z.string().regex(/^gtmrelease\.[a-f0-9]{64}$/),
    })
    .strict(),
]);
export type GtmReleaseParameters = z.infer<typeof gtmReleaseParametersSchema>;
export type GtmReleaseEvidence = z.infer<typeof gtmReleaseEvidenceSchema>;
export type GtmReleaseReview = z.infer<typeof gtmReleaseReviewSchema>;
export type GtmReleaseAttempt = z.infer<typeof gtmReleaseAttemptSchema>;
export type GtmReleaseCommand = z.infer<typeof gtmReleaseCommandSchema>;

export const gtmReleasePreviewSchema = z
  .object({
    projectId: z.string(),
    environmentId: z.string(),
    evidence: gtmReleaseEvidenceSchema,
    trackingVerified: z.literal(false),
  })
  .strict();
