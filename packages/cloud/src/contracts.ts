import { hashOpsValue, opsMutationPlanSchema, type OpsMutationPlan } from '@unisane/ops-engine';
import { z } from 'zod';

const nonEmptySchema = z.string().trim().min(1);
const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const cloudDnsZoneConfigSchema = z
  .object({
    name: nonEmptySchema,
    zoneId: nonEmptySchema.optional(),
  })
  .strict();
export type CloudDnsZoneConfig = z.infer<typeof cloudDnsZoneConfigSchema>;

export const cloudDnsRecordConfigSchema = z
  .object({
    zone: stableIdSchema.optional(),
    type: nonEmptySchema,
    name: nonEmptySchema,
    content: nonEmptySchema.optional(),
    values: z.array(nonEmptySchema).min(1).optional(),
    ttl: z.number().int().positive().optional(),
    proxied: z.boolean().optional(),
    comment: nonEmptySchema.optional(),
    priority: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((record, context) => {
    if (!record.content && !record.values) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'DNS record must declare content or values.',
      });
    }
  });
export type CloudDnsRecordConfig = z.infer<typeof cloudDnsRecordConfigSchema>;

export const cloudDnsDesiredStateSchema = z
  .object({
    zones: z
      .record(stableIdSchema, cloudDnsZoneConfigSchema)
      .refine((zones) => Object.keys(zones).length > 0, 'At least one DNS zone is required.'),
    records: z.record(stableIdSchema, cloudDnsRecordConfigSchema).default({}),
  })
  .strict()
  .superRefine((state, context) => {
    for (const [recordId, record] of Object.entries(state.records)) {
      if (record.zone && !state.zones[record.zone]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', recordId, 'zone'],
          message: `DNS record '${recordId}' references unknown zone '${record.zone}'.`,
        });
      }
      if (!record.zone && Object.keys(state.zones).length !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', recordId, 'zone'],
          message: `DNS record '${recordId}' must select a zone when the target has multiple zones.`,
        });
      }
    }
  });
export type CloudDnsDesiredState = z.infer<typeof cloudDnsDesiredStateSchema>;

export const cloudDnsTargetContextSchema = z
  .object({
    projectId: stableIdSchema,
    targetId: stableIdSchema,
    environment: stableIdSchema,
    connectionId: stableIdSchema,
    provider: z.literal('cloudflare'),
    accountId: nonEmptySchema,
    production: z.boolean(),
    configPath: nonEmptySchema,
    desired: cloudDnsDesiredStateSchema,
  })
  .strict();
export type CloudDnsTargetContext = z.infer<typeof cloudDnsTargetContextSchema>;

export const cloudDnsAccountSchema = z
  .object({
    id: nonEmptySchema,
    name: z.string().nullable(),
  })
  .strict();
export type CloudDnsAccount = z.infer<typeof cloudDnsAccountSchema>;

export const cloudDnsZoneSchema = z
  .object({
    key: stableIdSchema.nullable(),
    id: nonEmptySchema,
    name: nonEmptySchema,
    status: z.string().nullable(),
    accountId: z.string().nullable(),
    accountName: z.string().nullable(),
    configured: z.boolean(),
  })
  .strict();
export type CloudDnsZone = z.infer<typeof cloudDnsZoneSchema>;

export const cloudDnsRecordSchema = z
  .object({
    id: nonEmptySchema,
    zoneId: nonEmptySchema,
    zoneName: nonEmptySchema,
    type: nonEmptySchema,
    name: nonEmptySchema,
    content: z.string(),
    ttl: z.number().int().positive().nullable(),
    proxied: z.boolean().nullable(),
    comment: z.string().nullable(),
    priority: z.number().int().nullable(),
  })
  .strict();
export type CloudDnsRecord = z.infer<typeof cloudDnsRecordSchema>;

export const cloudDnsDesiredRecordSchema = z
  .object({
    type: nonEmptySchema,
    name: nonEmptySchema,
    content: z.string(),
    ttl: z.number().int().positive(),
    proxied: z.boolean().optional(),
    comment: z.string().optional(),
    priority: z.number().int().optional(),
  })
  .strict();
export type CloudDnsDesiredRecord = z.infer<typeof cloudDnsDesiredRecordSchema>;

export const cloudDnsInventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloud.dns-inventory'),
    provider: z.literal('cloudflare'),
    projectId: stableIdSchema,
    targetId: stableIdSchema,
    environment: stableIdSchema,
    connectionId: stableIdSchema,
    generatedAt: z.string().datetime({ offset: true }),
    account: z
      .object({
        configuredAccountId: nonEmptySchema,
        liveAccounts: z.array(cloudDnsAccountSchema),
      })
      .strict(),
    zones: z.array(cloudDnsZoneSchema),
    records: z.array(cloudDnsRecordSchema),
    errors: z.array(
      z
        .object({
          code: nonEmptySchema,
          message: nonEmptySchema,
        })
        .strict(),
    ),
  })
  .strict();
export type CloudDnsInventory = z.infer<typeof cloudDnsInventorySchema>;

export const cloudDnsImportProposalSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloud.dns-import-proposal'),
    provider: z.literal('cloudflare'),
    projectId: stableIdSchema,
    targetId: stableIdSchema,
    environment: stableIdSchema,
    connectionId: stableIdSchema,
    generatedAt: z.string().datetime({ offset: true }),
    sourceInventoryHash: sha256Schema,
    selectedZoneIds: z.array(nonEmptySchema).min(1),
    desired: cloudDnsDesiredStateSchema,
    summary: z
      .object({
        zones: z.number().int().positive(),
        records: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type CloudDnsImportProposal = z.infer<typeof cloudDnsImportProposalSchema>;

export const cloudDnsPlanOperationSchema = z
  .object({
    operationId: nonEmptySchema,
    action: z.enum(['create', 'update', 'no-op', 'blocked']),
    risk: z.enum(['read_only', 'low_risk_mutation', 'high_risk_mutation', 'dangerous']),
    resourceType: z.literal('dns-record'),
    resourceKey: nonEmptySchema,
    zoneKey: z.string().nullable(),
    zoneId: z.string().nullable(),
    recordId: z.string().nullable(),
    check: nonEmptySchema,
    message: nonEmptySchema,
    current: cloudDnsRecordSchema.nullable(),
    desired: cloudDnsDesiredRecordSchema.nullable(),
  })
  .strict();
export type CloudDnsPlanOperation = z.infer<typeof cloudDnsPlanOperationSchema>;

export const cloudDnsMutationPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloud.dns-plan'),
    provider: z.literal('cloudflare'),
    projectId: stableIdSchema,
    targetId: stableIdSchema,
    environment: stableIdSchema,
    connectionId: stableIdSchema,
    configPath: nonEmptySchema,
    generatedAt: z.string().datetime({ offset: true }),
    production: z.boolean(),
    accountId: nonEmptySchema,
    operations: z.array(cloudDnsPlanOperationSchema),
    summary: z
      .object({
        create: z.number().int().nonnegative(),
        update: z.number().int().nonnegative(),
        noOp: z.number().int().nonnegative(),
        blocked: z.number().int().nonnegative(),
      })
      .strict(),
    safety: opsMutationPlanSchema,
  })
  .strict();
export type CloudDnsMutationPlan = z.infer<typeof cloudDnsMutationPlanSchema>;

export const cloudDnsApplyOperationResultSchema = z
  .object({
    resourceKey: nonEmptySchema,
    action: z.enum(['create', 'update', 'skipped']),
    ok: z.boolean(),
    id: z.string().nullable(),
    error: z.string().nullable(),
  })
  .strict();
export type CloudDnsApplyOperationResult = z.infer<typeof cloudDnsApplyOperationResultSchema>;

export const cloudDnsDriftClassificationSchema = z.enum([
  'none',
  'configuration',
  'remote',
  'unknown',
]);
export type CloudDnsDriftClassification = z.infer<typeof cloudDnsDriftClassificationSchema>;

export const cloudDnsDriftReportSchema = z
  .object({
    kind: z.literal('cloud.dns-drift'),
    provider: z.literal('cloudflare'),
    projectId: stableIdSchema,
    targetId: stableIdSchema,
    environment: stableIdSchema,
    generatedAt: z.string().datetime({ offset: true }),
    classification: cloudDnsDriftClassificationSchema,
    differences: z.array(
      z
        .object({
          resourceKey: nonEmptySchema,
          reason: nonEmptySchema,
        })
        .strict(),
    ),
  })
  .strict();
export type CloudDnsDriftReport = z.infer<typeof cloudDnsDriftReportSchema>;

export interface CloudDnsProvider {
  listAccounts(): Promise<CloudDnsAccount[]>;
  listZones(args: { accountId: string; name?: string }): Promise<CloudDnsZone[]>;
  listDnsRecords(zone: { zoneId: string; zoneName: string }): Promise<CloudDnsRecord[]>;
  createDnsRecord(zoneId: string, record: CloudDnsDesiredRecord): Promise<{ id: string | null }>;
  updateDnsRecord(
    zoneId: string,
    recordId: string,
    record: CloudDnsDesiredRecord,
  ): Promise<{ id: string | null }>;
}

export function hashCloudDnsOperationInput(
  operation: Pick<
    CloudDnsPlanOperation,
    'action' | 'zoneId' | 'recordId' | 'desired' | 'resourceKey'
  >,
): string {
  return hashOpsValue({
    action: operation.action,
    zoneId: operation.zoneId,
    recordId: operation.recordId,
    desired: operation.desired,
    resourceKey: operation.resourceKey,
  });
}

function assertPlanBinding(plan: CloudDnsMutationPlan): void {
  if (
    plan.safety.projectId !== plan.projectId ||
    plan.safety.environment !== plan.environment ||
    !plan.safety.targetIdentity.includes(`target:${plan.targetId}`)
  ) {
    throw new Error('[CLOUD_DNS_PLAN_CONTEXT_MISMATCH] DNS plan context is not safety-bound.');
  }
  if (plan.safety.actions.length !== plan.operations.length) {
    throw new Error(
      '[CLOUD_DNS_PLAN_SAFETY_MISMATCH] DNS operations do not match the safety action count.',
    );
  }
  for (const operation of plan.operations) {
    const action = plan.safety.actions.find((candidate) => candidate.id === operation.operationId);
    if (
      !action ||
      action.resourceIdentity !== operation.resourceKey ||
      action.inputHash !== hashCloudDnsOperationInput(operation)
    ) {
      throw new Error(
        `[CLOUD_DNS_PLAN_SAFETY_MISMATCH] DNS operation '${operation.operationId}' is not bound to the safety plan.`,
      );
    }
  }
}

export function parseCloudDnsInventory(input: unknown): CloudDnsInventory {
  return cloudDnsInventorySchema.parse(input);
}

export function parseCloudDnsImportProposal(input: unknown): CloudDnsImportProposal {
  return cloudDnsImportProposalSchema.parse(input);
}

export function parseCloudDnsMutationPlan(input: unknown): CloudDnsMutationPlan {
  const plan = cloudDnsMutationPlanSchema.parse(input);
  assertPlanBinding(plan);
  return plan;
}

export function bindCloudDnsSafetyPlan(args: {
  operations: readonly CloudDnsPlanOperation[];
  safety: OpsMutationPlan;
}): OpsMutationPlan {
  for (const operation of args.operations) {
    const action = args.safety.actions.find((candidate) => candidate.id === operation.operationId);
    if (
      !action ||
      action.resourceIdentity !== operation.resourceKey ||
      action.inputHash !== hashCloudDnsOperationInput(operation)
    ) {
      throw new Error(
        `[CLOUD_DNS_PLAN_SAFETY_MISMATCH] DNS operation '${operation.operationId}' is not bound to the safety plan.`,
      );
    }
  }
  return args.safety;
}
