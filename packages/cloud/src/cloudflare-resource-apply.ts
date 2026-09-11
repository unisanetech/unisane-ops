import { cloudflareQueueConsumerPolicySchema } from './cloudflare-resources.js';
import { createHash, randomUUID } from 'node:crypto';
import {
  assertOpsMutationPreflight,
  hashOpsValue,
  opsMutationReceiptSchema,
  type OpsApprovalRecord,
  type OpsLockLease,
  type OpsMutationReceipt,
} from '@unisane/ops-engine';
import {
  collectCloudflareResourceInventory,
  createCloudflareQueuePlan,
} from './cloudflare-resource-workflow.js';
import {
  cloudflareQueuePlanSchema,
  cloudflareResourceApplyReceiptSchema,
  cloudflareResourceDriftReportSchema,
  cloudflareWorkerPlanSchema,
  type CloudflareMutationProvider,
  type CloudflareQueuePlan,
  type CloudflareQueuePlanOperation,
  type CloudflareResourceApplyOperationResult,
  type CloudflareResourceApplyReceipt,
  type CloudflareResourceDriftReport,
  type CloudflareResourceTarget,
  type CloudflareWorkerPlan,
  type CloudflareWorkerPlanOperation,
  type CloudflareWorkerSettings,
} from './cloudflare-resources.js';
import {
  requireCloudflareMutationProvider,
  requireCloudflareResourceExecutionState,
  requireCloudflareResourceSecrets,
  requireCloudflareResourceSources,
  type CloudDnsArtifactRef,
  type CloudflareResourceRuntimeBinding,
} from './runtime.js';

type ResourceFocus = 'queues' | 'workers' | 'cron';
type ResourcePlan = CloudflareQueuePlan | CloudflareWorkerPlan;
type ResourceOperation = CloudflareQueuePlanOperation | CloudflareWorkerPlanOperation;

export interface CloudflareResourceApplyReport {
  ok: boolean;
  receipt: CloudflareResourceApplyReceipt;
  drift: CloudflareResourceDriftReport;
  artifact: CloudDnsArtifactRef;
}

function desiredString(operation: CloudflareWorkerPlanOperation, key: string): string | null {
  const value = operation.desired?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function desiredStringArray(
  operation: CloudflareWorkerPlanOperation,
  key: string,
): string[] | undefined {
  const value = operation.desired?.[key];
  if (!Array.isArray(value)) return undefined;
  const entries = value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
  );
  return entries.length > 0 ? entries : undefined;
}

function currentId(operation: CloudflareWorkerPlanOperation): string | null {
  const desiredId = desiredString(operation, 'routeId') ?? desiredString(operation, 'queueId');
  if (desiredId) return desiredId;
  const value = operation.current?.id;
  return typeof value === 'string' && value.trim() ? value : null;
}

function bindingName(binding: Record<string, unknown>): string | null {
  return typeof binding.name === 'string' && binding.name.trim() ? binding.name : null;
}

function upsertBinding(
  settings: CloudflareWorkerSettings,
  binding: Record<string, unknown>,
): CloudflareWorkerSettings {
  const name = bindingName(binding);
  if (!name) return settings;
  return {
    bindings: [
      ...settings.bindings.filter((candidate) => bindingName(candidate) !== name),
      binding,
    ],
  };
}

function assertPlanContext(target: CloudflareResourceTarget, plan: ResourcePlan): void {
  if (
    plan.provider !== target.provider ||
    plan.projectId !== target.projectId ||
    plan.targetId !== target.targetId ||
    plan.environment !== target.environment ||
    plan.connectionId !== target.connectionId ||
    plan.accountId !== target.accountId ||
    plan.production !== target.production ||
    plan.safety.configHash !== hashOpsValue(target)
  ) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_PLAN_CONTEXT_MISMATCH] Plan does not match the selected target context.',
    );
  }
  if (plan.safety.inventoryHash !== plan.sourceInventoryHash) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_PLAN_INVENTORY_HASH_MISMATCH] Plan safety does not match its source inventory.',
    );
  }
  if (plan.safety.actions.length !== plan.operations.length) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_PLAN_ACTIONS_MISMATCH] Plan operations do not match reviewed safety actions.',
    );
  }
  for (const [index, operation] of plan.operations.entries()) {
    const reviewed = plan.safety.actions[index];
    if (
      !reviewed ||
      reviewed.id !== operation.operationId ||
      reviewed.resourceIdentity !== operation.resourceKey ||
      reviewed.inputHash !== hashOpsValue(operation) ||
      reviewed.type !== expectedSafetyType(operation) ||
      reviewed.risk !== expectedSafetyRisk(operation)
    ) {
      throw new Error(
        `[CLOUDFLARE_RESOURCE_PLAN_ACTIONS_MISMATCH] Operation '${operation.operationId}' does not match its reviewed safety action.`,
      );
    }
  }
  const blocked = plan.operations.find((operation) => operation.action === 'blocked');
  if (blocked) {
    throw new Error(
      `[CLOUDFLARE_RESOURCE_APPLY_BLOCKED_PLAN] Plan contains blocked operation '${blocked.resourceKey}'.`,
    );
  }
}

function expectedSafetyRisk(operation: ResourceOperation): 'low' | 'medium' | 'high' {
  return operation.risk === 'high_risk_mutation'
    ? 'high'
    : operation.risk === 'low_risk_mutation'
      ? 'medium'
      : 'low';
}

function expectedSafetyType(
  operation: ResourceOperation,
): 'create' | 'update' | 'verify' | 'no-op' {
  if (operation.action === 'no-op') return 'no-op';
  if (operation.action === 'blocked') return 'verify';
  if (operation.resourceType === 'queue') return 'create';
  return operation.current ? 'update' : 'create';
}

function requireConfirmation(args: {
  plan: ResourcePlan;
  focus: ResourceFocus;
  accountConfirm?: string;
  productionConfirm?: string;
  yes?: boolean;
}): void {
  if (!args.yes) {
    throw new Error(
      `[CLOUDFLARE_${args.focus.toUpperCase()}_APPLY_CONFIRMATION_REQUIRED] Pass --yes to apply the reviewed plan.`,
    );
  }
  if (args.accountConfirm !== args.plan.accountId) {
    throw new Error(
      `[CLOUDFLARE_ACCOUNT_CONFIRM_MISMATCH] Pass --account-confirm ${args.plan.accountId} to apply this plan.`,
    );
  }
  if (args.plan.production) {
    const expected = `${args.plan.environment}:${args.plan.accountId}:cloudflare-${args.focus}-apply`;
    if (args.productionConfirm !== expected) {
      throw new Error(
        `[CLOUDFLARE_PRODUCTION_CONFIRMATION_REQUIRED] Production ${args.focus} apply requires --production-confirm ${expected}.`,
      );
    }
  }
}

function createApproval(args: {
  plan: ResourcePlan;
  actorId: string;
  now: Date;
}): OpsApprovalRecord {
  return {
    schemaVersion: 1,
    kind: 'ops.approval',
    approvalId: `approval-${args.plan.safety.planHash}`,
    planHash: args.plan.safety.planHash,
    actor: args.actorId,
    provider: args.plan.safety.provider,
    projectId: args.plan.safety.projectId,
    environment: args.plan.safety.environment,
    targetIdentity: args.plan.safety.targetIdentity,
    approvedAt: args.now.toISOString(),
    expiresAt: new Date(
      Math.min(Date.parse(args.plan.safety.expiresAt), args.now.getTime() + 5 * 60_000),
    ).toISOString(),
  };
}

function result(args: {
  operationId: string;
  resourceKey: string;
  resourceType: CloudflareResourceApplyOperationResult['resourceType'];
  action: CloudflareResourceApplyOperationResult['action'];
  ok: boolean;
  id?: string | null;
  error?: string | null;
}): CloudflareResourceApplyOperationResult {
  return {
    operationId: args.operationId,
    resourceKey: args.resourceKey,
    resourceType: args.resourceType,
    action: args.action,
    ok: args.ok,
    id: args.id ?? null,
    error: args.error ?? null,
  };
}

async function applyQueueOperation(args: {
  provider: CloudflareMutationProvider;
  accountId: string;
  operation: CloudflareQueuePlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  if (args.operation.action === 'no-op') {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: 'queue',
      action: 'skipped',
      ok: true,
      id: args.operation.queueId,
    });
  }
  if (args.operation.action !== 'create' || !args.operation.desired) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: 'queue',
      action: 'skipped',
      ok: false,
      error: 'Queue operation is not executable.',
    });
  }
  try {
    await args.beforeEffect();
    const created = await args.provider.createQueue(args.accountId, args.operation.desired);
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: 'queue',
      action: 'create',
      ok: true,
      id: created.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: 'queue',
      action: 'create',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applyWorkerScript(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const scriptPath = desiredString(args.operation, 'scriptPath');
  const mainModule = desiredString(args.operation, 'mainModule');
  const contentHash = desiredString(args.operation, 'contentHash');
  if (!scriptPath || !mainModule || !contentHash) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'skipped',
      ok: false,
      error: 'Worker script operation is missing reviewed source metadata.',
    });
  }
  try {
    const content = requireCloudflareResourceSources(args.binding).readText(scriptPath);
    if (createHash('sha256').update(content).digest('hex') !== contentHash) {
      return result({
        operationId: args.operation.operationId,
        resourceKey: args.operation.resourceKey,
        resourceType: args.operation.resourceType,
        action: 'skipped',
        ok: false,
        error: 'Worker script source hash changed after plan review.',
      });
    }
    await args.beforeEffect();
    const applied = await args.provider.putWorkerScript(
      args.binding.target.accountId,
      args.operation.workerName,
      {
        mainModule,
        content,
        compatibilityDate: desiredString(args.operation, 'compatibilityDate') ?? undefined,
        compatibilityFlags: desiredStringArray(args.operation, 'compatibilityFlags'),
      },
    );
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: true,
      id: applied.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applyWorkerRoute(args: {
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const zoneId = desiredString(args.operation, 'zoneId');
  const pattern = desiredString(args.operation, 'pattern');
  const script = desiredString(args.operation, 'script');
  const routeId = currentId(args.operation);
  if (!zoneId || !pattern || !script) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'skipped',
      ok: false,
      error: 'Worker route operation is missing zone id, pattern, or script.',
    });
  }
  try {
    await args.beforeEffect();
    const applied = routeId
      ? await args.provider.updateWorkerRoute(zoneId, routeId, { pattern, script })
      : await args.provider.createWorkerRoute(zoneId, { pattern, script });
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: routeId ? 'update' : 'create',
      ok: true,
      id: applied.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: routeId ? 'update' : 'create',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applySettingsBinding(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  setting: Record<string, unknown>;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  try {
    const current = await args.provider.listWorkerSettings(
      args.binding.target.accountId,
      args.operation.workerName,
    );
    await args.beforeEffect();
    const applied = await args.provider.updateWorkerSettings(
      args.binding.target.accountId,
      args.operation.workerName,
      upsertBinding(current, args.setting),
    );
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: true,
      id: applied.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applyQueueBinding(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const direction = desiredString(args.operation, 'direction');
  if (direction === 'producer') {
    const name = desiredString(args.operation, 'bindingName');
    const queueName = desiredString(args.operation, 'queueName');
    if (!name || !queueName) {
      return result({
        operationId: args.operation.operationId,
        resourceKey: args.operation.resourceKey,
        resourceType: args.operation.resourceType,
        action: 'skipped',
        ok: false,
        error: 'Worker producer binding is missing binding or queue name.',
      });
    }
    return applySettingsBinding({
      ...args,
      setting: { type: 'queue', name, queue_name: queueName },
    });
  }
  if (direction === 'consumer') {
    const queueId = desiredString(args.operation, 'queueId');
    if (!queueId) {
      return result({
        operationId: args.operation.operationId,
        resourceKey: args.operation.resourceKey,
        resourceType: args.operation.resourceType,
        action: 'skipped',
        ok: false,
        error: 'Worker consumer binding is missing live queue id.',
      });
    }
    try {
      await args.beforeEffect();
      const applied = await args.provider.createQueueConsumer(
        args.binding.target.accountId,
        queueId,
        args.operation.workerName,
        parseConsumerPolicy(args.operation.desired?.consumer),
      );
      return result({
        operationId: args.operation.operationId,
        resourceKey: args.operation.resourceKey,
        resourceType: args.operation.resourceType,
        action: applied.action ?? 'create',
        ok: true,
        id: applied.id,
      });
    } catch (error) {
      return result({
        operationId: args.operation.operationId,
        resourceKey: args.operation.resourceKey,
        resourceType: args.operation.resourceType,
        action: 'create',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return result({
    operationId: args.operation.operationId,
    resourceKey: args.operation.resourceKey,
    resourceType: args.operation.resourceType,
    action: 'skipped',
    ok: false,
    error: 'Worker queue binding has an unsupported direction.',
  });
}

async function applyWorkerVar(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const name = desiredString(args.operation, 'name');
  const value = desiredString(args.operation, 'value');
  if (!name || value === null) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'skipped',
      ok: false,
      error: 'Worker variable is missing name or value.',
    });
  }
  return applySettingsBinding({
    ...args,
    setting: { type: 'plain_text', name, text: value },
  });
}

async function applyWorkerSecret(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const name = desiredString(args.operation, 'name');
  const resolved = name
    ? await requireCloudflareResourceSecrets(args.binding).resolve({
        provider: 'cloudflare',
        profile: args.binding.target.connectionId,
        name,
      })
    : null;
  if (!name || !resolved?.value) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'skipped',
      ok: false,
      error: name
        ? `Worker secret '${name}' could not be resolved.`
        : 'Worker secret operation is missing secret name.',
    });
  }
  try {
    await args.beforeEffect();
    const applied = await args.provider.putWorkerSecret(
      args.binding.target.accountId,
      args.operation.workerName,
      { name, text: resolved.value },
    );
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: true,
      id: applied.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applyWorkerCron(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  const crons = args.operation.desired?.crons;
  if (!Array.isArray(crons) || !crons.every((cron): cron is string => typeof cron === 'string' && Boolean(cron.trim()))) {
    throw new Error('Worker Cron operation requires an explicit schedule set.');
  }
  try {
    await args.beforeEffect();
    const applied = await args.provider.putWorkerCronTriggers(
      args.binding.target.accountId,
      args.operation.workerName,
      crons,
    );
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: true,
      id: applied.id,
    });
  } catch (error) {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'put',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function applyWorkerOperation(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  operation: CloudflareWorkerPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudflareResourceApplyOperationResult> {
  if (args.operation.action === 'no-op') {
    return result({
      operationId: args.operation.operationId,
      resourceKey: args.operation.resourceKey,
      resourceType: args.operation.resourceType,
      action: 'skipped',
      ok: true,
      id: currentId(args.operation),
    });
  }
  switch (args.operation.resourceType) {
    case 'worker-script':
      return applyWorkerScript(args);
    case 'worker-route':
      return applyWorkerRoute(args);
    case 'worker-queue-binding':
      return applyQueueBinding(args);
    case 'worker-var':
      return applyWorkerVar(args);
    case 'worker-secret':
      return applyWorkerSecret(args);
    case 'worker-cron-trigger':
      return applyWorkerCron(args);
  }
}

function receiptStatus(
  results: readonly CloudflareResourceApplyOperationResult[],
): OpsMutationReceipt['status'] {
  const effects = results.filter((entry) => entry.action !== 'skipped');
  const succeeded = effects.filter((entry) => entry.ok).length;
  if (effects.length === 0 || succeeded === effects.length) return 'succeeded';
  if (succeeded === 0) return 'failed';
  return 'partial';
}

function createEngineReceipt(args: {
  plan: ResourcePlan;
  approval: OpsApprovalRecord;
  lease: OpsLockLease;
  actorId: string;
  startedAt: string;
  completedAt: string;
  results: readonly CloudflareResourceApplyOperationResult[];
}): OpsMutationReceipt {
  return opsMutationReceiptSchema.parse({
    schemaVersion: 1,
    kind: 'ops.mutation-receipt',
    receiptId: `receipt-${randomUUID()}`,
    planId: args.plan.safety.planId,
    planHash: args.plan.safety.planHash,
    provider: args.plan.safety.provider,
    projectId: args.plan.safety.projectId,
    environment: args.plan.safety.environment,
    targetIdentity: args.plan.safety.targetIdentity,
    actor: args.actorId,
    approvalId: args.approval.approvalId,
    lockId: args.lease.lockId,
    lockFencingValue: args.lease.fencingValue,
    startedAt: args.startedAt,
    completedAt: args.completedAt,
    status: receiptStatus(args.results),
    results: args.plan.operations.map((operation) => {
      const applied = args.results.find((entry) => entry.operationId === operation.operationId);
      return {
        actionId: operation.operationId,
        status: applied?.ok ? 'succeeded' : applied ? 'failed' : 'skipped',
        outputHash: applied ? hashOpsValue(applied) : null,
      };
    }),
  });
}

async function collectDrift(args: {
  binding: CloudflareResourceRuntimeBinding;
  provider: CloudflareMutationProvider;
  plan: ResourcePlan;
  focus: ResourceFocus;
  generatedAt: string;
}): Promise<CloudflareResourceDriftReport> {
  try {
    const inventory = await collectCloudflareResourceInventory({
      target: args.binding.target,
      provider: args.provider,
      focus: args.focus,
      generatedAt: args.generatedAt,
    });
    const differences: CloudflareResourceDriftReport['differences'] = [];
    if (args.focus === 'queues') {
      const remaining = createCloudflareQueuePlan({
        target: args.binding.target,
        inventory,
        generatedAt: args.generatedAt,
      }).operations.filter((operation) => operation.action !== 'no-op');
      differences.push(
        ...remaining.map((operation) => ({
          resourceKey: operation.resourceKey,
          reason: operation.message,
        })),
      );
    } else {
      for (const operation of args.plan.operations as CloudflareWorkerPlanOperation[]) {
        if (operation.resourceType === 'worker-script') {
          if (!inventory.workers.some((worker) => worker.name === operation.workerName)) {
            differences.push({
              resourceKey: operation.resourceKey,
              reason: 'Worker was not observed after apply.',
            });
          }
        } else if (operation.resourceType === 'worker-route') {
          const pattern = desiredString(operation, 'pattern');
          if (
            pattern &&
            !inventory.workerRoutes.some(
              (route) => route.pattern === pattern && route.script === operation.workerName,
            )
          ) {
            differences.push({
              resourceKey: operation.resourceKey,
              reason: 'Worker route was not observed after apply.',
            });
          }
        } else if (operation.resourceType === 'worker-queue-binding' && operation.desired?.direction === 'consumer') {
          const queue = inventory.queues.find((entry) => entry.id === operation.desired?.queueId);
          const consumer = queue?.consumers?.find((entry) => entry.workerName === operation.workerName);
          const policy = parseConsumerPolicy(operation.desired?.consumer);
          if (!consumer || Object.entries(policy ?? {}).some(([key, value]) => consumer[key as keyof typeof consumer] !== value)) {
            differences.push({ resourceKey: operation.resourceKey, reason: 'Queue consumer limits or dead-letter queue differ after apply.' });
          }
        } else if (operation.resourceType === 'worker-cron-trigger') {
          const desired = operation.desired?.crons;
          const current = inventory.workerCronTriggers.filter((entry) => entry.scriptName === operation.workerName).map((entry) => entry.cron).sort();
          if (!Array.isArray(desired) || JSON.stringify([...desired].sort()) !== JSON.stringify(current)) {
            differences.push({ resourceKey: operation.resourceKey, reason: 'Cron schedule set differs after apply.' });
          }
        }
      }
    }
    return cloudflareResourceDriftReportSchema.parse({
      schemaVersion: 1,
      kind: 'cloudflare.resource-drift',
      provider: 'cloudflare',
      focus: args.focus,
      projectId: args.plan.projectId,
      targetId: args.plan.targetId,
      environment: args.plan.environment,
      generatedAt: args.generatedAt,
      classification: differences.length === 0 ? 'none' : 'remote',
      differences,
    });
  } catch (error) {
    return cloudflareResourceDriftReportSchema.parse({
      schemaVersion: 1,
      kind: 'cloudflare.resource-drift',
      provider: 'cloudflare',
      focus: args.focus,
      projectId: args.plan.projectId,
      targetId: args.plan.targetId,
      environment: args.plan.environment,
      generatedAt: args.generatedAt,
      classification: 'unknown',
      differences: [
        {
          resourceKey: args.plan.safety.targetIdentity,
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
    });
  }
}

async function applyResourcePlan(args: {
  binding: CloudflareResourceRuntimeBinding;
  plan: ResourcePlan;
  focus: ResourceFocus;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}): Promise<CloudflareResourceApplyReport> {
  const provider = requireCloudflareMutationProvider(args.binding);
  const state = requireCloudflareResourceExecutionState(args.binding);
  requireConfirmation(args);
  assertPlanContext(args.binding.target, args.plan);
  const now = args.binding.now ?? new Date();
  const actorId = args.binding.actorId?.trim() || 'local-developer';
  const lockOwner = args.binding.lockOwner?.trim() || `${actorId}:${process.pid}:${randomUUID()}`;
  const lockId = `cloudflare-resource-${hashOpsValue(args.plan.safety.targetIdentity)}`;
  const approval = createApproval({ plan: args.plan, actorId, now });
  await state.approvals.put(approval);
  const lease = await state.locks.acquire({
    lockId,
    owner: lockOwner,
    ttlMs: 5 * 60_000,
    now: now.toISOString(),
  });
  if (!lease) {
    throw new Error('[OPS_LOCK_UNAVAILABLE] Another mutation owns this Cloudflare target.');
  }
  try {
    await assertOpsMutationPreflight({
      plan: args.plan.safety,
      approval,
      lease,
      expectation: {
        provider: args.plan.provider,
        projectId: args.plan.projectId,
        environment: args.plan.environment,
        targetIdentity: args.plan.safety.targetIdentity,
        lockId,
      },
      actor: args.binding.actor ?? 'developer',
      production: args.plan.production,
      multiProcess: args.binding.multiProcess ?? false,
      lockOwner,
      state,
      now,
    });
    const startedAt = now.toISOString();
    const beforeEffect = () => state.locks.assertCurrent(lease, new Date().toISOString());
    const results: CloudflareResourceApplyOperationResult[] = [];
    if (args.focus === 'queues') {
      for (const operation of args.plan.operations as CloudflareQueuePlanOperation[]) {
        results.push(
          await applyQueueOperation({
            provider,
            accountId: args.plan.accountId,
            operation,
            beforeEffect,
          }),
        );
      }
    } else {
      for (const operation of args.plan.operations as CloudflareWorkerPlanOperation[]) {
        results.push(
          await applyWorkerOperation({
            binding: args.binding,
            provider,
            operation,
            beforeEffect,
          }),
        );
      }
    }
    const completedAt = new Date().toISOString();
    const engineReceipt = createEngineReceipt({
      plan: args.plan,
      approval,
      lease,
      actorId,
      startedAt,
      completedAt,
      results,
    });
    await state.artifacts.recordReceipt(engineReceipt);
    const drift = await collectDrift({
      binding: args.binding,
      provider,
      plan: args.plan,
      focus: args.focus,
      generatedAt: completedAt,
    });
    const receipt = cloudflareResourceApplyReceiptSchema.parse({
      schemaVersion: 1,
      kind: 'cloudflare.resource-apply-receipt',
      provider: 'cloudflare',
      focus: args.focus,
      projectId: args.plan.projectId,
      targetId: args.plan.targetId,
      environment: args.plan.environment,
      generatedAt: completedAt,
      planHash: args.plan.safety.planHash,
      accountId: args.plan.accountId,
      production: args.plan.production,
      results,
      engineReceipt,
      drift,
    });
    const artifact = args.binding.artifacts.writeJson({
      class: 'receipt',
      focus: args.focus,
      outputPath: args.receiptOutput,
      value: receipt,
    });
    return {
      ok: results.every((entry) => entry.ok),
      receipt,
      drift,
      artifact,
    };
  } finally {
    await state.locks.release(lease);
  }
}

export async function applyCloudflareQueuePlan(args: {
  binding: CloudflareResourceRuntimeBinding;
  planInput: unknown;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}): Promise<CloudflareResourceApplyReport> {
  return applyResourcePlan({
    ...args,
    plan: cloudflareQueuePlanSchema.parse(args.planInput),
    focus: 'queues',
  });
}

export async function applyCloudflareWorkerPlan(args: {
  binding: CloudflareResourceRuntimeBinding;
  planInput: unknown;
  focus: 'workers' | 'cron';
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}): Promise<CloudflareResourceApplyReport> {
  const plan = cloudflareWorkerPlanSchema.parse(args.planInput);
  if (plan.focus !== args.focus) {
    throw new Error(
      `[CLOUDFLARE_RESOURCE_PLAN_FOCUS_MISMATCH] Expected ${args.focus} plan, received ${plan.focus}.`,
    );
  }
  return applyResourcePlan({ ...args, plan });
}

function parseConsumerPolicy(value: unknown) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid queue consumer policy.');
  const { deadLetterQueue, ...limits } = value as Record<string, unknown>;
  if (deadLetterQueue !== undefined && (typeof deadLetterQueue !== 'string' || !deadLetterQueue.trim())) throw new Error('Invalid dead-letter queue name.');
  return { ...cloudflareQueueConsumerPolicySchema.parse(limits), ...(typeof deadLetterQueue === 'string' ? { deadLetterQueue } : {}) };
}
