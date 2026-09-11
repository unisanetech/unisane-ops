import { createOpsMutationPlan, hashOpsValue, type OpsMutationAction } from '@unisane/ops-engine';
import {
  cloudflareEnvironmentReportSchema,
  cloudflareQueuePlanSchema,
  cloudflareReadinessReportSchema,
  cloudflareResourceInventorySchema,
  cloudflareWorkerPlanSchema,
  type CloudflareEnvironmentReport,
  type CloudflareMutationRisk,
  type CloudflareQueueConfig,
  type CloudflareQueuePlan,
  type CloudflareQueuePlanOperation,
  type CloudflareReadinessReport,
  type CloudflareReadProvider,
  type CloudflareResourceFocus,
  type CloudflareResourceInventory,
  type CloudflareResourceTarget,
  type CloudflareWorkerCronInventory,
  type CloudflareWorkerConfig,
  type CloudflareWorkerPlan,
  type CloudflareWorkerPlanOperation,
  type CloudflareWorkerRouteConfig,
  type CloudflareWorkerRouteInventory,
} from './cloudflare-resources.js';
import type { CloudDnsZone, CloudDnsZoneConfig } from './contracts.js';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function risk(target: CloudflareResourceTarget): CloudflareMutationRisk {
  return target.production ? 'high_risk_mutation' : 'low_risk_mutation';
}

function recordValue(value: object): Record<string, unknown> {
  return { ...value };
}

function assertInventoryContext(
  target: CloudflareResourceTarget,
  inventory: CloudflareResourceInventory,
): void {
  if (
    inventory.provider !== target.provider ||
    inventory.projectId !== target.projectId ||
    inventory.targetId !== target.targetId ||
    inventory.environment !== target.environment ||
    inventory.connectionId !== target.connectionId ||
    inventory.account.configuredAccountId !== target.accountId
  ) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_INVENTORY_CONTEXT_MISMATCH] Inventory does not match the selected target.',
    );
  }
}

function addQueueOperation(
  operations: CloudflareQueuePlanOperation[],
  operation: Omit<CloudflareQueuePlanOperation, 'operationId'>,
): void {
  operations.push({
    ...operation,
    operationId: `queue_${String(operations.length + 1).padStart(4, '0')}`,
  });
}

function addWorkerOperation(
  operations: CloudflareWorkerPlanOperation[],
  operation: Omit<CloudflareWorkerPlanOperation, 'operationId'>,
): void {
  operations.push({
    ...operation,
    operationId: `worker_${String(operations.length + 1).padStart(4, '0')}`,
  });
}

function safetyRisk(riskValue: CloudflareMutationRisk): OpsMutationAction['risk'] {
  return riskValue === 'high_risk_mutation'
    ? 'high'
    : riskValue === 'low_risk_mutation'
      ? 'medium'
      : 'low';
}

function queueSafetyAction(operation: CloudflareQueuePlanOperation): OpsMutationAction {
  return {
    id: operation.operationId,
    type:
      operation.action === 'create' ? 'create' : operation.action === 'no-op' ? 'no-op' : 'verify',
    risk: safetyRisk(operation.risk),
    resourceIdentity: operation.resourceKey,
    inputHash: hashOpsValue(operation),
  };
}

function workerSafetyAction(operation: CloudflareWorkerPlanOperation): OpsMutationAction {
  return {
    id: operation.operationId,
    type:
      operation.action === 'no-op'
        ? 'no-op'
        : operation.action === 'blocked'
          ? 'verify'
          : operation.current
            ? 'update'
            : 'create',
    risk: safetyRisk(operation.risk),
    resourceIdentity: operation.resourceKey,
    inputHash: hashOpsValue(operation),
  };
}

function zoneMatches(zone: CloudDnsZone, configured: CloudDnsZoneConfig): boolean {
  return configured.zoneId
    ? zone.id === configured.zoneId
    : normalize(zone.name) === normalize(configured.name);
}

async function collectZones(
  target: CloudflareResourceTarget,
  provider: CloudflareReadProvider,
  errors: CloudflareResourceInventory['errors'],
): Promise<CloudDnsZone[]> {
  const configuredEntries = Object.entries(target.desired.zones);
  if (configuredEntries.length === 0) {
    return provider.listZones({ accountId: target.accountId });
  }
  const zones: CloudDnsZone[] = [];
  for (const [key, configured] of configuredEntries) {
    const candidates = await provider.listZones({
      accountId: target.accountId,
      name: configured.zoneId ? undefined : configured.name,
    });
    const match = candidates.find((zone) => zoneMatches(zone, configured));
    if (!match) {
      errors.push({
        code: 'CLOUDFLARE_ZONE_NOT_FOUND',
        message: `Configured zone '${configured.name}' was not found.`,
      });
      continue;
    }
    zones.push({ ...match, key, configured: true });
  }
  return zones;
}

export async function collectCloudflareResourceInventory(args: {
  target: CloudflareResourceTarget;
  provider: CloudflareReadProvider;
  focus: CloudflareResourceFocus;
  generatedAt?: string;
}): Promise<CloudflareResourceInventory> {
  const errors: CloudflareResourceInventory['errors'] = [];
  const liveAccounts = await args.provider.listAccounts();
  if (!liveAccounts.some((account) => account.id === args.target.accountId)) {
    errors.push({
      code: 'CLOUDFLARE_ACCOUNT_NOT_FOUND',
      message: `Configured account '${args.target.accountId}' was not found.`,
    });
  }
  const zones = await collectZones(args.target, args.provider, errors);
  const needsQueues = args.focus === 'queues' || args.focus === 'workers';
  const needsWorkers = args.focus === 'workers' || args.focus === 'cron';
  const queues = needsQueues ? await args.provider.listQueues(args.target.accountId) : [];
  const workers = needsWorkers ? await args.provider.listWorkers(args.target.accountId) : [];
  const workerRoutes: CloudflareWorkerRouteInventory[] = [];
  if (args.focus === 'workers') {
    for (const zone of zones) {
      workerRoutes.push(
        ...(await args.provider.listWorkerRoutes({
          zoneId: zone.id,
          zoneName: zone.name,
        })),
      );
    }
  }
  const workerCronTriggers: CloudflareWorkerCronInventory[] = [];
  if (needsWorkers) {
    for (const worker of Object.values(args.target.desired.workers)) {
      try {
        workerCronTriggers.push(
          ...(await args.provider.listWorkerCronTriggers(args.target.accountId, worker.name)),
        );
      } catch (error) {
        errors.push({
          code: 'CLOUDFLARE_WORKER_CRON_INVENTORY_FAILED',
          message: `Cannot read Cron triggers for '${worker.name}': ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  }
  const kindByFocus = {
    zones: 'cloudflare.zone-inventory',
    queues: 'cloudflare.queue-inventory',
    workers: 'cloudflare.worker-inventory',
    cron: 'cloudflare.cron-inventory',
  } as const;
  return cloudflareResourceInventorySchema.parse({
    schemaVersion: 1,
    kind: kindByFocus[args.focus],
    provider: 'cloudflare',
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    connectionId: args.target.connectionId,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    account: {
      configuredAccountId: args.target.accountId,
      liveAccounts,
    },
    zones,
    queues,
    workers,
    workerRoutes,
    workerCronTriggers,
    errors,
  });
}

function queueEntries(
  sourceKey: string,
  queue: CloudflareQueueConfig,
): Array<{
  sourceKey: string;
  role: 'primary' | 'dlq';
  name: string;
}> {
  return [
    { sourceKey, role: 'primary', name: queue.name.trim() },
    ...(queue.dlq ? [{ sourceKey, role: 'dlq' as const, name: queue.dlq.trim() }] : []),
  ];
}

export function createCloudflareQueuePlan(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  generatedAt?: string;
}): CloudflareQueuePlan {
  assertInventoryContext(args.target, args.inventory);
  const operations: CloudflareQueuePlanOperation[] = [];
  const seen = new Set<string>();
  for (const [sourceKey, queue] of Object.entries(args.target.desired.queues)) {
    for (const entry of queueEntries(sourceKey, queue)) {
      const normalized = normalize(entry.name);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      const current =
        args.inventory.queues.find((candidate) => normalize(candidate.name) === normalized) ?? null;
      addQueueOperation(
        operations,
        current
          ? {
              action: 'no-op',
              risk: 'read_only',
              resourceType: 'queue',
              resourceKey: entry.name,
              queueId: current.id,
              check: 'queues.queue.exists',
              message: `Cloudflare Queue '${entry.name}' already exists.`,
              current,
              desired: { name: entry.name },
              role: entry.role,
              sourceKey: entry.sourceKey,
            }
          : {
              action: 'create',
              risk: risk(args.target),
              resourceType: 'queue',
              resourceKey: entry.name,
              queueId: null,
              check: 'queues.queue.create',
              message: `Create Cloudflare Queue '${entry.name}'.`,
              current: null,
              desired: { name: entry.name },
              role: entry.role,
              sourceKey: entry.sourceKey,
            },
      );
    }
  }
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const targetIdentity = `cloudflare:account:${args.target.accountId}:target:${args.target.targetId}:queues`;
  const safety = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId: `cloudflare-queues-${hashOpsValue({
      projectId: args.target.projectId,
      targetIdentity,
      inventory: args.inventory,
      operations,
    }).slice(0, 20)}`,
    provider: args.target.provider,
    projectId: args.target.projectId,
    environment: args.target.environment,
    targetIdentity,
    commandVersion: '0.1.0',
    configHash: hashOpsValue(args.target),
    inventoryHash: hashOpsValue(args.inventory),
    generatedAt,
    expiresAt: new Date(Date.parse(generatedAt) + 15 * 60_000).toISOString(),
    actions: operations.map(queueSafetyAction),
  });
  return cloudflareQueuePlanSchema.parse({
    schemaVersion: 1,
    kind: 'cloudflare.queue-plan',
    provider: 'cloudflare',
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    connectionId: args.target.connectionId,
    configPath: args.target.configPath,
    generatedAt,
    production: args.target.production,
    accountId: args.target.accountId,
    sourceInventoryHash: hashOpsValue(args.inventory),
    operations,
    safety,
    summary: {
      create: operations.filter((operation) => operation.action === 'create').length,
      noOp: operations.filter((operation) => operation.action === 'no-op').length,
      blocked: operations.filter((operation) => operation.action === 'blocked').length,
    },
  });
}

function configuredZone(
  target: CloudflareResourceTarget,
  route: CloudflareWorkerRouteConfig,
): [string, CloudDnsZoneConfig] | null {
  if (route.zone) {
    const zone = target.desired.zones[route.zone];
    return zone ? [route.zone, zone] : null;
  }
  const entries = Object.entries(target.desired.zones);
  return entries.length === 1 ? entries[0]! : null;
}

function addScriptOperation(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  operations: CloudflareWorkerPlanOperation[];
  workerKey: string;
  worker: CloudflareWorkerConfig;
}): void {
  const current =
    args.inventory.workers.find(
      (worker) => normalize(worker.name) === normalize(args.worker.name),
    ) ?? null;
  const source = args.target.scriptSources[args.workerKey] ?? null;
  if (args.worker.script && !source) {
    addWorkerOperation(args.operations, {
      action: 'blocked',
      risk: 'read_only',
      resourceType: 'worker-script',
      resourceKey: args.worker.name,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.script.source.readable',
      message: `Worker '${args.worker.name}' script source is not readable inside the project.`,
      current: current ? recordValue(current) : null,
      desired: { path: args.worker.script.path },
    });
    return;
  }
  if (!source && current) {
    addWorkerOperation(args.operations, {
      action: 'no-op',
      risk: 'read_only',
      resourceType: 'worker-script',
      resourceKey: args.worker.name,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.script.exists',
      message: `Cloudflare Worker '${args.worker.name}' already exists.`,
      current: recordValue(current),
      desired: { name: args.worker.name },
    });
    return;
  }
  if (!source) {
    addWorkerOperation(args.operations, {
      action: 'blocked',
      risk: 'read_only',
      resourceType: 'worker-script',
      resourceKey: args.worker.name,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.script.source.configured',
      message: `Worker '${args.worker.name}' has no script source and is not present.`,
      current: null,
      desired: { name: args.worker.name },
    });
    return;
  }
  addWorkerOperation(args.operations, {
    action: 'planned',
    risk: risk(args.target),
    resourceType: 'worker-script',
    resourceKey: args.worker.name,
    workerKey: args.workerKey,
    workerName: args.worker.name,
    check: current ? 'workers.script.upload.plan' : 'workers.script.create.plan',
    message: current
      ? `Plan Worker '${args.worker.name}' script upload from reviewed source.`
      : `Plan Worker '${args.worker.name}' creation from reviewed source.`,
    current: current ? recordValue(current) : null,
    desired: {
      name: args.worker.name,
      scriptPath: source.relativePath,
      mainModule: source.mainModule,
      contentHash: source.contentHash,
      ...(source.compatibilityDate ? { compatibilityDate: source.compatibilityDate } : {}),
      ...(source.compatibilityFlags ? { compatibilityFlags: source.compatibilityFlags } : {}),
    },
  });
}

function addRouteOperations(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  operations: CloudflareWorkerPlanOperation[];
  workerKey: string;
  worker: CloudflareWorkerConfig;
}): void {
  for (const route of args.worker.routes) {
    const zoneEntry = configuredZone(args.target, route);
    if (!zoneEntry) {
      addWorkerOperation(args.operations, {
        action: 'blocked',
        risk: 'read_only',
        resourceType: 'worker-route',
        resourceKey: `${args.worker.name}:${route.pattern}`,
        workerKey: args.workerKey,
        workerName: args.worker.name,
        check: 'workers.route.zone.configured',
        message: `Worker route '${route.pattern}' requires one explicit zone.`,
        current: null,
        desired: { pattern: route.pattern, script: args.worker.name },
      });
      continue;
    }
    const [zoneKey, zone] = zoneEntry;
    const current =
      args.inventory.workerRoutes.find(
        (candidate) =>
          normalize(candidate.pattern) === normalize(route.pattern) &&
          normalize(candidate.script ?? '') === normalize(args.worker.name),
      ) ?? null;
    const currentForPattern =
      current ??
      args.inventory.workerRoutes.find(
        (candidate) =>
          normalize(candidate.pattern) === normalize(route.pattern) &&
          (zone.zoneId
            ? candidate.zoneId === zone.zoneId
            : normalize(candidate.zoneName) === normalize(zone.name)),
      ) ??
      null;
    addWorkerOperation(args.operations, {
      action: current ? 'no-op' : 'planned',
      risk: current ? 'read_only' : risk(args.target),
      resourceType: 'worker-route',
      resourceKey: `${args.worker.name}:${route.pattern}`,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: current ? 'workers.route.matches' : 'workers.route.plan',
      message: current
        ? `Worker route '${route.pattern}' already targets '${args.worker.name}'.`
        : `Plan Worker route '${route.pattern}' for '${args.worker.name}'.`,
      current: currentForPattern ? recordValue(currentForPattern) : null,
      desired: {
        pattern: route.pattern,
        zoneKey,
        zoneId: zone.zoneId ?? null,
        routeId: currentForPattern?.id ?? null,
        script: args.worker.name,
      },
    });
  }
}

function bindingName(queueKey: string): string {
  const normalized = queueKey
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized.endsWith('_QUEUE') ? normalized : `${normalized}_QUEUE`;
}

function addQueueOperations(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  operations: CloudflareWorkerPlanOperation[];
  workerKey: string;
  worker: CloudflareWorkerConfig;
}): void {
  const entries = [
    ...args.worker.queues.producers.map((queueKey) => ({
      direction: 'producer',
      queueKey,
    })),
    ...args.worker.queues.consumers.map((queueKey) => ({
      direction: 'consumer',
      queueKey,
    })),
  ];
  for (const entry of entries) {
    const queue = args.target.desired.queues[entry.queueKey];
    const live = queue
      ? (args.inventory.queues.find(
          (candidate) => normalize(candidate.name) === normalize(queue.name),
        ) ?? null)
      : null;
    if (!queue || (entry.direction === 'consumer' && !live?.id)) {
      addWorkerOperation(args.operations, {
        action: 'blocked',
        risk: 'read_only',
        resourceType: 'worker-queue-binding',
        resourceKey: `${args.worker.name}:${entry.direction}:${entry.queueKey}`,
        workerKey: args.workerKey,
        workerName: args.worker.name,
        check: queue
          ? 'workers.queue-binding.queue.live'
          : 'workers.queue-binding.queue.configured',
        message: queue
          ? `Consumer queue '${queue.name}' is absent from inventory.`
          : `Unknown queue '${entry.queueKey}'.`,
        current: live ? recordValue(live) : null,
        desired: { direction: entry.direction, queueKey: entry.queueKey },
      });
      continue;
    }
    addWorkerOperation(args.operations, {
      action: 'planned',
      risk: risk(args.target),
      resourceType: 'worker-queue-binding',
      resourceKey: `${args.worker.name}:${entry.direction}:${queue.name}`,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.queue-binding.plan',
      message: `Plan Worker ${entry.direction} binding to '${queue.name}'.`,
      current: null,
      desired: {
        direction: entry.direction,
        queueKey: entry.queueKey,
        queueName: queue.name,
        queueId: live?.id ?? null,
        bindingName: bindingName(entry.queueKey),
        ...(entry.direction === 'consumer' ? { consumer: { ...queue.consumer, ...(queue.dlq ? { deadLetterQueue: queue.dlq } : {}) } } : {}),
      },
    });
  }
}

function addCronOperations(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  operations: CloudflareWorkerPlanOperation[];
  workerKey: string;
  worker: CloudflareWorkerConfig;
}): void {
  const current = [...new Set(args.inventory.workerCronTriggers
    .filter((trigger) => normalize(trigger.scriptName) === normalize(args.worker.name))
    .map((trigger) => trigger.cron.trim()))].sort();
  const crons = [...new Set(args.worker.crons.map((cron) => cron.trim()))].sort();
  const matches = JSON.stringify(current) === JSON.stringify(crons);
  const removed = current.filter((cron) => !crons.includes(cron));
  addWorkerOperation(args.operations, {
    action: matches ? 'no-op' : 'planned',
    risk: matches ? 'read_only' : risk(args.target),
    resourceType: 'worker-cron-trigger',
    resourceKey: `${args.worker.name}:cron-schedules`,
    workerKey: args.workerKey,
    workerName: args.worker.name,
    check: matches ? 'workers.cron.matches' : 'workers.cron.reconcile',
    message: matches
      ? `Cron schedules match for '${args.worker.name}'.`
      : `Set ${crons.length} Cron schedules for '${args.worker.name}'${removed.length ? `; remove ${removed.join(', ')}` : ''}.`,
    current: { crons: current },
    desired: { crons, script: args.worker.name },
  });
}

function addVariables(args: {
  target: CloudflareResourceTarget;
  operations: CloudflareWorkerPlanOperation[];
  workerKey: string;
  worker: CloudflareWorkerConfig;
}): void {
  for (const [name, value] of Object.entries(args.worker.vars)) {
    addWorkerOperation(args.operations, {
      action: 'planned',
      risk: risk(args.target),
      resourceType: 'worker-var',
      resourceKey: `${args.worker.name}:var:${name}`,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.var.plan',
      message: `Plan Worker var '${name}' for '${args.worker.name}'.`,
      current: null,
      desired: { name, value },
    });
  }
  for (const name of args.worker.secrets) {
    addWorkerOperation(args.operations, {
      action: 'planned',
      risk: risk(args.target),
      resourceType: 'worker-secret',
      resourceKey: `${args.worker.name}:secret:${name}`,
      workerKey: args.workerKey,
      workerName: args.worker.name,
      check: 'workers.secret.plan',
      message: `Plan Worker secret '${name}' without exposing its value.`,
      current: null,
      desired: { name, value: '<SECRET>' },
    });
  }
}

export function createCloudflareWorkerPlan(args: {
  target: CloudflareResourceTarget;
  inventory: CloudflareResourceInventory;
  focus: 'workers' | 'cron';
  generatedAt?: string;
}): CloudflareWorkerPlan {
  assertInventoryContext(args.target, args.inventory);
  const operations: CloudflareWorkerPlanOperation[] = [];
  for (const [workerKey, worker] of Object.entries(args.target.desired.workers)) {
    if (args.focus === 'workers') {
      addScriptOperation({ ...args, operations, workerKey, worker });
      addRouteOperations({ ...args, operations, workerKey, worker });
      addQueueOperations({ ...args, operations, workerKey, worker });
      addVariables({ target: args.target, operations, workerKey, worker });
    }
    addCronOperations({ ...args, operations, workerKey, worker });
  }
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const targetIdentity = `cloudflare:account:${args.target.accountId}:target:${args.target.targetId}:${args.focus}`;
  const safety = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId: `cloudflare-${args.focus}-${hashOpsValue({
      projectId: args.target.projectId,
      targetIdentity,
      inventory: args.inventory,
      operations,
    }).slice(0, 20)}`,
    provider: args.target.provider,
    projectId: args.target.projectId,
    environment: args.target.environment,
    targetIdentity,
    commandVersion: '0.1.0',
    configHash: hashOpsValue(args.target),
    inventoryHash: hashOpsValue(args.inventory),
    generatedAt,
    expiresAt: new Date(Date.parse(generatedAt) + 15 * 60_000).toISOString(),
    actions: operations.map(workerSafetyAction),
  });
  return cloudflareWorkerPlanSchema.parse({
    schemaVersion: 1,
    kind: 'cloudflare.worker-plan',
    provider: 'cloudflare',
    focus: args.focus,
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    connectionId: args.target.connectionId,
    configPath: args.target.configPath,
    generatedAt,
    production: args.target.production,
    accountId: args.target.accountId,
    sourceInventoryHash: hashOpsValue(args.inventory),
    operations,
    safety,
    summary: {
      planned: operations.filter((operation) => operation.action === 'planned').length,
      noOp: operations.filter((operation) => operation.action === 'no-op').length,
      blocked: operations.filter((operation) => operation.action === 'blocked').length,
    },
  });
}

function envName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function createCloudflareEnvironmentReport(args: {
  target: CloudflareResourceTarget;
  generatedAt?: string;
}): CloudflareEnvironmentReport {
  const variables: CloudflareEnvironmentReport['variables'] = [
    {
      name: 'CLOUDFLARE_API_TOKEN',
      value: '<SECRET>',
      source: 'connection credential environment reference',
      target: 'local-ops',
      sensitive: true,
    },
    {
      name: 'CLOUDFLARE_ACCOUNT_ID',
      value: args.target.accountId,
      source: 'connection.accountId',
      target: 'provider-ref',
      sensitive: false,
    },
  ];
  for (const [zoneKey, zone] of Object.entries(args.target.desired.zones)) {
    variables.push({
      name: `CLOUDFLARE_${envName(zoneKey)}_ZONE_NAME`,
      value: zone.name,
      source: `zones.${zoneKey}.name`,
      target: 'provider-ref',
      sensitive: false,
    });
    if (zone.zoneId) {
      variables.push({
        name: `CLOUDFLARE_${envName(zoneKey)}_ZONE_ID`,
        value: zone.zoneId,
        source: `zones.${zoneKey}.zoneId`,
        target: 'provider-ref',
        sensitive: false,
      });
    }
  }
  for (const [queueKey, queue] of Object.entries(args.target.desired.queues)) {
    variables.push({
      name: `CLOUDFLARE_${envName(queueKey)}_QUEUE_NAME`,
      value: queue.name,
      source: `queues.${queueKey}.name`,
      target: 'application-runtime',
      sensitive: false,
    });
    if (queue.dlq) {
      variables.push({
        name: `CLOUDFLARE_${envName(queueKey)}_DLQ_NAME`,
        value: queue.dlq,
        source: `queues.${queueKey}.dlq`,
        target: 'application-runtime',
        sensitive: false,
      });
    }
  }
  for (const [workerKey, worker] of Object.entries(args.target.desired.workers)) {
    variables.push({
      name: `CLOUDFLARE_${envName(workerKey)}_WORKER_NAME`,
      value: worker.name,
      source: `workers.${workerKey}.name`,
      target: 'application-runtime',
      sensitive: false,
    });
    for (const secret of worker.secrets) {
      variables.push({
        name: secret,
        value: '<SECRET>',
        source: `workers.${workerKey}.secrets`,
        target: 'cloudflare-worker',
        sensitive: true,
      });
    }
  }
  return cloudflareEnvironmentReportSchema.parse({
    schemaVersion: 1,
    kind: 'cloudflare.environment-report',
    provider: 'cloudflare',
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    variables,
    notes: [
      'Secret values are placeholders and must be resolved through the configured secret source.',
      'Review generated names before copying them into deployment configuration.',
    ],
  });
}

export function createCloudflareReadinessReport(args: {
  target: CloudflareResourceTarget;
  generatedAt?: string;
}): CloudflareReadinessReport {
  const checks: CloudflareReadinessReport['checks'] = [
    {
      id: 'connection.account',
      status: args.target.accountId ? 'ok' : 'error',
      message: args.target.accountId
        ? 'Cloudflare account is selected.'
        : 'Cloudflare account is not selected.',
    },
    {
      id: 'desired.capabilities',
      status:
        Object.keys(args.target.desired.zones).length +
          Object.keys(args.target.desired.queues).length +
          Object.keys(args.target.desired.workers).length >
        0
          ? 'ok'
          : 'warn',
      message: `Configured zones=${Object.keys(args.target.desired.zones).length}, queues=${Object.keys(args.target.desired.queues).length}, workers=${Object.keys(args.target.desired.workers).length}.`,
    },
    {
      id: 'worker.script-sources',
      status: Object.entries(args.target.desired.workers).every(
        ([workerKey, worker]) => !worker.script || Boolean(args.target.scriptSources[workerKey]),
      )
        ? 'ok'
        : 'error',
      message: 'Configured Worker script sources must resolve inside the project.',
    },
  ];
  const ok = checks.every((check) => check.status !== 'error');
  return cloudflareReadinessReportSchema.parse({
    schemaVersion: 1,
    kind: 'cloudflare.readiness-report',
    provider: 'cloudflare',
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    ok,
    checks,
    nextActions: ok ? [] : ['Resolve error checks before generating or applying Cloudflare plans.'],
  });
}
