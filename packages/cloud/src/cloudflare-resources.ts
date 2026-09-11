import { z } from 'zod';
import { opsMutationPlanSchema, opsMutationReceiptSchema } from '@unisane/ops-engine';
import {
  cloudDnsAccountSchema,
  cloudDnsZoneConfigSchema,
  cloudDnsZoneSchema,
} from './contracts.js';

const nonEmpty = z.string().trim().min(1);
const stableId = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export type CloudflareMutationRisk = 'read_only' | 'low_risk_mutation' | 'high_risk_mutation';

export const cloudflareQueueConsumerPolicySchema = z.object({
  maxBatchSize: z.number().int().min(1).max(100).optional(),
  maxBatchTimeout: z.number().int().min(0).max(60).optional(),
  maxRetries: z.number().int().min(0).max(100).optional(),
  maxConcurrency: z.number().int().min(1).max(250).optional(),
}).strict();
export type CloudflareQueueConsumerPolicy = z.infer<typeof cloudflareQueueConsumerPolicySchema>;

export const cloudflareQueueConfigSchema = z
  .object({ name: nonEmpty, dlq: nonEmpty.optional(), consumer: cloudflareQueueConsumerPolicySchema.optional() })
  .strict();
export type CloudflareQueueConfig = z.infer<typeof cloudflareQueueConfigSchema>;

export const cloudflareWorkerRouteConfigSchema = z
  .object({ zone: stableId.optional(), pattern: nonEmpty })
  .strict();
export type CloudflareWorkerRouteConfig = z.infer<typeof cloudflareWorkerRouteConfigSchema>;

export const cloudflareWorkerScriptConfigSchema = z
  .object({
    path: nonEmpty,
    mainModule: nonEmpty.optional(),
    compatibilityDate: nonEmpty.optional(),
    compatibilityFlags: z.array(nonEmpty).optional(),
  })
  .strict();
export type CloudflareWorkerScriptConfig = z.infer<typeof cloudflareWorkerScriptConfigSchema>;

export const cloudflareWorkerConfigSchema = z
  .object({
    name: nonEmpty,
    script: cloudflareWorkerScriptConfigSchema.optional(),
    routes: z.array(cloudflareWorkerRouteConfigSchema).default([]),
    queues: z
      .object({
        producers: z.array(stableId).default([]),
        consumers: z.array(stableId).default([]),
      })
      .strict()
      .default({ producers: [], consumers: [] }),
    crons: z.array(nonEmpty).default([]),
    vars: z.record(z.string()).default({}),
    secrets: z.array(nonEmpty).default([]),
  })
  .strict();
export type CloudflareWorkerConfig = z.infer<typeof cloudflareWorkerConfigSchema>;

export const cloudflareResourceDesiredStateSchema = z
  .object({
    zones: z.record(stableId, cloudDnsZoneConfigSchema).default({}),
    queues: z.record(stableId, cloudflareQueueConfigSchema).default({}),
    workers: z.record(stableId, cloudflareWorkerConfigSchema).default({}),
  })
  .strict()
  .superRefine((desired, context) => {
    const queueNames = new Map<string, string>();
    for (const [queueKey, queue] of Object.entries(desired.queues)) {
      const owner = queueNames.get(queue.name.toLowerCase());
      if (owner) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queues', queueKey, 'name'],
          message: `Queue '${queueKey}' duplicates the name owned by '${owner}'.`,
        });
      }
      queueNames.set(queue.name.toLowerCase(), queueKey);
    }
    for (const [workerKey, worker] of Object.entries(desired.workers)) {
      for (const [routeIndex, route] of worker.routes.entries()) {
        if (route.zone && !desired.zones[route.zone]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['workers', workerKey, 'routes', routeIndex, 'zone'],
            message: `Worker '${workerKey}' references unknown zone '${route.zone}'.`,
          });
        }
      }
      for (const [kind, queueKeys] of Object.entries(worker.queues)) {
        for (const [queueIndex, queueKey] of queueKeys.entries()) {
          if (!desired.queues[queueKey]) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['workers', workerKey, 'queues', kind, queueIndex],
              message: `Worker '${workerKey}' references unknown queue '${queueKey}'.`,
            });
          }
        }
      }
    }
  });
export type CloudflareResourceDesiredState = z.infer<typeof cloudflareResourceDesiredStateSchema>;

export const cloudflareResolvedScriptSourceSchema = z
  .object({
    relativePath: nonEmpty,
    mainModule: nonEmpty,
    contentHash: sha256,
    compatibilityDate: nonEmpty.optional(),
    compatibilityFlags: z.array(nonEmpty).optional(),
  })
  .strict();
export type CloudflareResolvedScriptSource = z.infer<typeof cloudflareResolvedScriptSourceSchema>;

export const cloudflareResourceTargetSchema = z
  .object({
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    connectionId: stableId,
    provider: z.literal('cloudflare'),
    accountId: nonEmpty,
    production: z.boolean(),
    configPath: nonEmpty,
    desired: cloudflareResourceDesiredStateSchema,
    scriptSources: z.record(stableId, cloudflareResolvedScriptSourceSchema).default({}),
  })
  .strict();
export type CloudflareResourceTarget = z.infer<typeof cloudflareResourceTargetSchema>;

export const cloudflareQueueInventorySchema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    createdOn: z.string().nullable(),
    modifiedOn: z.string().nullable(),
    producersTotalCount: z.number().int().nonnegative().nullable(),
    consumersTotalCount: z.number().int().nonnegative().nullable(),
    consumers: z.array(z.object({
      id: nonEmpty,
      workerName: z.string().nullable(),
      deadLetterQueue: z.string().nullable(),
      maxBatchSize: z.number().nullable(),
      maxBatchTimeout: z.number().nullable(),
      maxRetries: z.number().nullable(),
      maxConcurrency: z.number().nullable(),
    }).strict()).optional(),
  })
  .strict();
export type CloudflareQueueInventory = z.infer<typeof cloudflareQueueInventorySchema>;

export const cloudflareWorkerInventorySchema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    createdOn: z.string().nullable(),
    modifiedOn: z.string().nullable(),
  })
  .strict();
export type CloudflareWorkerInventory = z.infer<typeof cloudflareWorkerInventorySchema>;

export const cloudflareWorkerRouteInventorySchema = z
  .object({
    id: nonEmpty,
    zoneId: nonEmpty,
    zoneName: nonEmpty,
    pattern: nonEmpty,
    script: z.string().nullable(),
  })
  .strict();
export type CloudflareWorkerRouteInventory = z.infer<typeof cloudflareWorkerRouteInventorySchema>;

export const cloudflareWorkerCronInventorySchema = z
  .object({
    scriptName: nonEmpty,
    cron: nonEmpty,
    createdOn: z.string().nullable(),
    modifiedOn: z.string().nullable(),
  })
  .strict();
export type CloudflareWorkerCronInventory = z.infer<typeof cloudflareWorkerCronInventorySchema>;

export const cloudflareResourceInventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.enum([
      'cloudflare.zone-inventory',
      'cloudflare.queue-inventory',
      'cloudflare.worker-inventory',
      'cloudflare.cron-inventory',
    ]),
    provider: z.literal('cloudflare'),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    connectionId: stableId,
    generatedAt: z.string().datetime({ offset: true }),
    account: z
      .object({
        configuredAccountId: nonEmpty,
        liveAccounts: z.array(cloudDnsAccountSchema),
      })
      .strict(),
    zones: z.array(cloudDnsZoneSchema),
    queues: z.array(cloudflareQueueInventorySchema),
    workers: z.array(cloudflareWorkerInventorySchema),
    workerRoutes: z.array(cloudflareWorkerRouteInventorySchema),
    workerCronTriggers: z.array(cloudflareWorkerCronInventorySchema),
    errors: z.array(z.object({ code: nonEmpty, message: nonEmpty }).strict()),
  })
  .strict();
export type CloudflareResourceInventory = z.infer<typeof cloudflareResourceInventorySchema>;
export type CloudflareResourceFocus = 'zones' | 'queues' | 'workers' | 'cron';

export const cloudflareQueuePlanOperationSchema = z
  .object({
    operationId: nonEmpty,
    action: z.enum(['create', 'no-op', 'blocked']),
    risk: z.enum(['read_only', 'low_risk_mutation', 'high_risk_mutation']),
    resourceType: z.literal('queue'),
    resourceKey: nonEmpty,
    queueId: z.string().nullable(),
    check: nonEmpty,
    message: nonEmpty,
    current: cloudflareQueueInventorySchema.nullable(),
    desired: z.object({ name: nonEmpty }).strict().nullable(),
    role: z.enum(['primary', 'dlq']),
    sourceKey: stableId,
  })
  .strict();
export type CloudflareQueuePlanOperation = z.infer<typeof cloudflareQueuePlanOperationSchema>;

export const cloudflareQueuePlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.queue-plan'),
    provider: z.literal('cloudflare'),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    connectionId: stableId,
    configPath: nonEmpty,
    generatedAt: z.string().datetime({ offset: true }),
    production: z.boolean(),
    accountId: nonEmpty,
    sourceInventoryHash: sha256,
    operations: z.array(cloudflareQueuePlanOperationSchema),
    safety: opsMutationPlanSchema,
    summary: z
      .object({
        create: z.number().int().nonnegative(),
        noOp: z.number().int().nonnegative(),
        blocked: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type CloudflareQueuePlan = z.infer<typeof cloudflareQueuePlanSchema>;

export const cloudflareWorkerResourceTypeSchema = z.enum([
  'worker-script',
  'worker-route',
  'worker-queue-binding',
  'worker-cron-trigger',
  'worker-var',
  'worker-secret',
]);
export type CloudflareWorkerResourceType = z.infer<typeof cloudflareWorkerResourceTypeSchema>;

export const cloudflareWorkerPlanOperationSchema = z
  .object({
    operationId: nonEmpty,
    action: z.enum(['planned', 'no-op', 'blocked']),
    risk: z.enum(['read_only', 'low_risk_mutation', 'high_risk_mutation']),
    resourceType: cloudflareWorkerResourceTypeSchema,
    resourceKey: nonEmpty,
    workerKey: stableId,
    workerName: nonEmpty,
    check: nonEmpty,
    message: nonEmpty,
    current: z.record(z.unknown()).nullable(),
    desired: z.record(z.unknown()).nullable(),
  })
  .strict();
export type CloudflareWorkerPlanOperation = z.infer<typeof cloudflareWorkerPlanOperationSchema>;

export const cloudflareWorkerPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.worker-plan'),
    provider: z.literal('cloudflare'),
    focus: z.enum(['workers', 'cron']),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    connectionId: stableId,
    configPath: nonEmpty,
    generatedAt: z.string().datetime({ offset: true }),
    production: z.boolean(),
    accountId: nonEmpty,
    sourceInventoryHash: sha256,
    operations: z.array(cloudflareWorkerPlanOperationSchema),
    safety: opsMutationPlanSchema,
    summary: z
      .object({
        planned: z.number().int().nonnegative(),
        noOp: z.number().int().nonnegative(),
        blocked: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type CloudflareWorkerPlan = z.infer<typeof cloudflareWorkerPlanSchema>;

export const cloudflareResourceApplyOperationResultSchema = z
  .object({
    operationId: nonEmpty,
    resourceKey: nonEmpty,
    resourceType: z.union([z.literal('queue'), cloudflareWorkerResourceTypeSchema]),
    action: z.enum(['create', 'update', 'put', 'skipped']),
    ok: z.boolean(),
    id: z.string().nullable(),
    error: z.string().nullable(),
  })
  .strict();
export type CloudflareResourceApplyOperationResult = z.infer<
  typeof cloudflareResourceApplyOperationResultSchema
>;

export const cloudflareResourceDriftReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.resource-drift'),
    provider: z.literal('cloudflare'),
    focus: z.enum(['queues', 'workers', 'cron']),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    generatedAt: z.string().datetime({ offset: true }),
    classification: z.enum(['none', 'configuration', 'remote', 'unknown']),
    differences: z.array(z.object({ resourceKey: nonEmpty, reason: nonEmpty }).strict()),
  })
  .strict();
export type CloudflareResourceDriftReport = z.infer<typeof cloudflareResourceDriftReportSchema>;

export const cloudflareResourceApplyReceiptSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.resource-apply-receipt'),
    provider: z.literal('cloudflare'),
    focus: z.enum(['queues', 'workers', 'cron']),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    generatedAt: z.string().datetime({ offset: true }),
    planHash: sha256,
    accountId: nonEmpty,
    production: z.boolean(),
    results: z.array(cloudflareResourceApplyOperationResultSchema),
    engineReceipt: opsMutationReceiptSchema,
    drift: cloudflareResourceDriftReportSchema,
  })
  .strict();
export type CloudflareResourceApplyReceipt = z.infer<typeof cloudflareResourceApplyReceiptSchema>;

const environmentVariableSchema = z
  .object({
    name: nonEmpty,
    value: z.string(),
    source: nonEmpty,
    target: z.enum(['local-ops', 'application-runtime', 'cloudflare-worker', 'provider-ref']),
    sensitive: z.boolean(),
  })
  .strict();

export const cloudflareEnvironmentReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.environment-report'),
    provider: z.literal('cloudflare'),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    generatedAt: z.string().datetime({ offset: true }),
    variables: z.array(environmentVariableSchema),
    notes: z.array(nonEmpty),
  })
  .strict();
export type CloudflareEnvironmentReport = z.infer<typeof cloudflareEnvironmentReportSchema>;

export const cloudflareReadinessReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('cloudflare.readiness-report'),
    provider: z.literal('cloudflare'),
    projectId: stableId,
    targetId: stableId,
    environment: stableId,
    generatedAt: z.string().datetime({ offset: true }),
    ok: z.boolean(),
    checks: z.array(
      z
        .object({
          id: nonEmpty,
          status: z.enum(['ok', 'warn', 'error']),
          message: nonEmpty,
        })
        .strict(),
    ),
    nextActions: z.array(nonEmpty),
  })
  .strict();
export type CloudflareReadinessReport = z.infer<typeof cloudflareReadinessReportSchema>;

export interface CloudflareReadProvider {
  listAccounts(): Promise<Array<{ id: string; name: string | null }>>;
  listZones(args: {
    accountId: string;
    name?: string;
  }): Promise<Array<z.infer<typeof cloudDnsZoneSchema>>>;
  listQueues(accountId: string): Promise<CloudflareQueueInventory[]>;
  listWorkers(accountId: string): Promise<CloudflareWorkerInventory[]>;
  listWorkerRoutes(zone: {
    zoneId: string;
    zoneName: string;
  }): Promise<CloudflareWorkerRouteInventory[]>;
  listWorkerCronTriggers(
    accountId: string,
    scriptName: string,
  ): Promise<CloudflareWorkerCronInventory[]>;
}

export interface CloudflareQueueDesired {
  name: string;
}
export interface CloudflareWorkerRouteDesired {
  pattern: string;
  script: string;
}
export interface CloudflareWorkerSettings {
  bindings: Record<string, unknown>[];
}
export interface CloudflareWorkerScriptDesired {
  mainModule: string;
  content: string;
  compatibilityDate?: string;
  compatibilityFlags?: string[];
  bindings?: Record<string, unknown>[];
}
export interface CloudflareWorkerSecretDesired {
  name: string;
  text: string;
}

export interface CloudflareMutationProvider extends CloudflareReadProvider {
  createQueue(accountId: string, queue: CloudflareQueueDesired): Promise<{ id: string | null }>;
  createWorkerRoute(
    zoneId: string,
    route: CloudflareWorkerRouteDesired,
  ): Promise<{ id: string | null }>;
  updateWorkerRoute(
    zoneId: string,
    routeId: string,
    route: CloudflareWorkerRouteDesired,
  ): Promise<{ id: string | null }>;
  listWorkerSettings(accountId: string, scriptName: string): Promise<CloudflareWorkerSettings>;
  updateWorkerSettings(
    accountId: string,
    scriptName: string,
    settings: CloudflareWorkerSettings,
  ): Promise<{ id: string | null }>;
  putWorkerScript(
    accountId: string,
    scriptName: string,
    script: CloudflareWorkerScriptDesired,
  ): Promise<{ id: string | null }>;
  putWorkerSecret(
    accountId: string,
    scriptName: string,
    secret: CloudflareWorkerSecretDesired,
  ): Promise<{ id: string | null }>;
  putWorkerCronTriggers(
    accountId: string,
    scriptName: string,
    crons: string[],
  ): Promise<{ id: string | null }>;
  createQueueConsumer(
    accountId: string,
    queueId: string,
    scriptName: string,
    policy?: CloudflareQueueConsumerPolicy & { deadLetterQueue?: string },
  ): Promise<{ id: string | null; action?: 'create' | 'update' }>;
}
