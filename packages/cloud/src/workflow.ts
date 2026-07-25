import { randomUUID } from 'node:crypto';
import {
  assertOpsMutationPreflight,
  createOpsMutationPlan,
  hashOpsValue,
  opsMutationReceiptSchema,
  type OpsApprovalRecord,
  type OpsLockLease,
  type OpsMutationAction,
  type OpsMutationReceipt,
} from '@unisane/ops-engine';
import { assessCloudDnsDrift, unknownCloudDnsDrift } from './dns.js';
import {
  bindCloudDnsSafetyPlan,
  cloudDnsImportProposalSchema,
  cloudDnsInventorySchema,
  hashCloudDnsOperationInput,
  parseCloudDnsInventory,
  parseCloudDnsMutationPlan,
  type CloudDnsApplyOperationResult,
  type CloudDnsDriftReport,
  type CloudDnsInventory,
  type CloudDnsImportProposal,
  type CloudDnsMutationPlan,
  type CloudDnsPlanOperation,
  type CloudDnsProvider,
  type CloudDnsRecord,
  type CloudDnsRecordConfig,
  type CloudDnsTargetContext,
  type CloudDnsZone,
  type CloudDnsZoneConfig,
} from './contracts.js';
import type { CloudDnsArtifactRef, CloudDnsRuntimeBinding } from './runtime.js';

export interface CloudDnsApplyReceipt {
  schemaVersion: 1;
  kind: 'cloud.dns-apply-receipt';
  provider: 'cloudflare';
  projectId: string;
  targetId: string;
  environment: string;
  generatedAt: string;
  planHash: string;
  accountId: string;
  production: boolean;
  results: CloudDnsApplyOperationResult[];
  engineReceipt: OpsMutationReceipt;
  drift: CloudDnsDriftReport;
}

export interface CloudDnsApplyReport {
  ok: boolean;
  receipt: CloudDnsApplyReceipt;
  drift: CloudDnsDriftReport;
  artifact: CloudDnsArtifactRef;
}

function stableImportKey(value: string, prefix: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || `${prefix}-${hashOpsValue(value).slice(0, 10)}`;
}

function importedRecordConfig(record: CloudDnsRecord, zoneKey: string): CloudDnsRecordConfig {
  return {
    zone: zoneKey,
    type: record.type.toUpperCase(),
    name: normalizeName(record.name),
    content: record.content,
    ttl: record.ttl ?? 1,
    ...(record.proxied !== null ? { proxied: record.proxied } : {}),
    ...(record.comment?.trim() ? { comment: record.comment.trim() } : {}),
    ...(record.priority !== null && record.priority > 0 ? { priority: record.priority } : {}),
  };
}

export function createCloudDnsImportProposal(args: {
  inventory: CloudDnsInventory;
  zoneIds: readonly string[];
  generatedAt?: string;
}): CloudDnsImportProposal {
  if (args.inventory.errors.length > 0) {
    throw new Error(
      '[CLOUD_DNS_IMPORT_INCOMPLETE_INVENTORY] Resolve inventory errors before importing desired state.',
    );
  }
  const selectedZoneIds = [
    ...new Set(args.zoneIds.map((value) => value.trim()).filter(Boolean)),
  ].sort();
  if (selectedZoneIds.length === 0) {
    throw new Error('[CLOUD_DNS_IMPORT_ZONE_REQUIRED] Select at least one zone with --zone.');
  }
  const selectedZones = selectedZoneIds.map((zoneId) => {
    const zone = args.inventory.zones.find((candidate) => candidate.id === zoneId);
    if (!zone) {
      throw new Error(
        `[CLOUD_DNS_IMPORT_ZONE_UNKNOWN] Zone '${zoneId}' is not present in the inventory.`,
      );
    }
    return zone;
  });
  const zones: Record<string, CloudDnsZoneConfig> = {};
  const zoneKeys = new Map<string, string>();
  for (const zone of selectedZones) {
    const base = zone.key ?? stableImportKey(zone.name, 'zone');
    let key = base;
    if (zones[key]) key = `${base}-${hashOpsValue(zone.id).slice(0, 8)}`;
    zones[key] = { name: zone.name, zoneId: zone.id };
    zoneKeys.set(zone.id, key);
  }
  const records: Record<string, CloudDnsRecordConfig> = {};
  for (const record of [...args.inventory.records]
    .filter((candidate) => zoneKeys.has(candidate.zoneId) && candidate.content.trim())
    .sort((left, right) =>
      [left.zoneId, left.type, left.name, left.content, left.id]
        .join('\0')
        .localeCompare([right.zoneId, right.type, right.name, right.content, right.id].join('\0')),
    )) {
    const zoneKey = zoneKeys.get(record.zoneId)!;
    const base = stableImportKey(`${record.type}-${record.name}`, 'record');
    const key = `${base}-${hashOpsValue({
      zoneId: record.zoneId,
      type: record.type,
      name: normalizeName(record.name),
      content: record.content,
    }).slice(0, 10)}`;
    records[key] = importedRecordConfig(record, zoneKey);
  }
  return cloudDnsImportProposalSchema.parse({
    schemaVersion: 1,
    kind: 'cloud.dns-import-proposal',
    provider: args.inventory.provider,
    projectId: args.inventory.projectId,
    targetId: args.inventory.targetId,
    environment: args.inventory.environment,
    connectionId: args.inventory.connectionId,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    sourceInventoryHash: hashOpsValue(args.inventory),
    selectedZoneIds,
    desired: { zones, records },
    summary: {
      zones: Object.keys(zones).length,
      records: Object.keys(records).length,
    },
  });
}

function zoneMatchesConfigured(zone: CloudDnsZone, configured: CloudDnsZoneConfig): boolean {
  return configured.zoneId
    ? zone.id === configured.zoneId
    : zone.name.toLowerCase() === configured.name.toLowerCase();
}

async function collectZones(
  target: CloudDnsTargetContext,
  provider: CloudDnsProvider,
  errors: CloudDnsInventory['errors'],
): Promise<CloudDnsZone[]> {
  const zones: CloudDnsZone[] = [];
  for (const [key, configured] of Object.entries(target.desired.zones)) {
    const matches = await provider.listZones({
      accountId: target.accountId,
      name: configured.zoneId ? undefined : configured.name,
    });
    const matched = matches.find((zone) => zoneMatchesConfigured(zone, configured));
    if (!matched) {
      errors.push({
        code: 'CLOUD_DNS_ZONE_NOT_FOUND',
        message: `Configured DNS zone '${configured.name}' was not found.`,
      });
      continue;
    }
    zones.push({ ...matched, key, configured: true });
  }
  return zones;
}

export async function collectCloudDnsInventory(args: {
  target: CloudDnsTargetContext;
  provider: CloudDnsProvider;
  generatedAt?: string;
}): Promise<CloudDnsInventory> {
  const errors: CloudDnsInventory['errors'] = [];
  const liveAccounts = await args.provider.listAccounts();
  if (!liveAccounts.some((account) => account.id === args.target.accountId)) {
    errors.push({
      code: 'CLOUD_DNS_ACCOUNT_NOT_FOUND',
      message: `Configured account '${args.target.accountId}' was not found.`,
    });
  }
  const zones = await collectZones(args.target, args.provider, errors);
  const records: CloudDnsRecord[] = [];
  for (const zone of zones) {
    records.push(
      ...(await args.provider.listDnsRecords({
        zoneId: zone.id,
        zoneName: zone.name,
      })),
    );
  }
  return cloudDnsInventorySchema.parse({
    schemaVersion: 1,
    kind: 'cloud.dns-inventory',
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
    records,
    errors,
  });
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function desiredValues(record: CloudDnsRecordConfig): string[] {
  return record.values ?? (record.content ? [record.content] : []);
}

function desiredRecord(record: CloudDnsRecordConfig, content: string) {
  return {
    type: record.type.toUpperCase(),
    name: normalizeName(record.name),
    content: content.trim(),
    ttl: record.ttl ?? 1,
    ...(record.proxied !== undefined ? { proxied: record.proxied } : {}),
    ...(record.comment ? { comment: record.comment } : {}),
    ...(record.priority !== undefined ? { priority: record.priority } : {}),
  };
}

function configuredZoneForRecord(
  target: CloudDnsTargetContext,
  record: CloudDnsRecordConfig,
): [string, CloudDnsZoneConfig] | null {
  if (record.zone) {
    const zone = target.desired.zones[record.zone];
    return zone ? [record.zone, zone] : null;
  }
  const first = Object.entries(target.desired.zones)[0];
  return first ?? null;
}

function liveZoneForConfigured(
  inventory: CloudDnsInventory,
  configured: [string, CloudDnsZoneConfig] | null,
): CloudDnsZone | null {
  if (!configured) return null;
  const [key, zoneConfig] = configured;
  return (
    inventory.zones.find(
      (zone) =>
        zone.key === key ||
        (zoneConfig.zoneId
          ? zone.id === zoneConfig.zoneId
          : zone.name.toLowerCase() === zoneConfig.name.toLowerCase()),
    ) ?? null
  );
}

function matchingRecords(
  records: readonly CloudDnsRecord[],
  desired: ReturnType<typeof desiredRecord>,
  zoneId: string,
): CloudDnsRecord[] {
  return records.filter(
    (record) =>
      record.zoneId === zoneId &&
      record.type.toUpperCase() === desired.type &&
      normalizeName(record.name) === desired.name,
  );
}

function recordMatchesDesired(
  current: CloudDnsRecord,
  desired: ReturnType<typeof desiredRecord>,
): boolean {
  return (
    current.content.trim() === desired.content &&
    (current.ttl ?? 1) === desired.ttl &&
    (desired.proxied === undefined || current.proxied === desired.proxied) &&
    (desired.priority === undefined || current.priority === desired.priority)
  );
}

function addOperation(
  operations: CloudDnsPlanOperation[],
  operation: Omit<CloudDnsPlanOperation, 'operationId'>,
): void {
  operations.push({
    ...operation,
    operationId: `dns_${String(operations.length + 1).padStart(4, '0')}`,
  });
}

function safetyAction(operation: CloudDnsPlanOperation): OpsMutationAction {
  return {
    id: operation.operationId,
    type:
      operation.action === 'create' || operation.action === 'update'
        ? operation.action
        : operation.action === 'no-op'
          ? 'no-op'
          : 'verify',
    risk:
      operation.risk === 'high_risk_mutation' || operation.risk === 'dangerous'
        ? 'high'
        : operation.risk === 'low_risk_mutation'
          ? 'medium'
          : 'low',
    resourceIdentity: operation.resourceKey,
    inputHash: hashCloudDnsOperationInput(operation),
  };
}

function assertInventoryContext(target: CloudDnsTargetContext, inventory: CloudDnsInventory): void {
  if (
    inventory.provider !== target.provider ||
    inventory.projectId !== target.projectId ||
    inventory.targetId !== target.targetId ||
    inventory.environment !== target.environment ||
    inventory.connectionId !== target.connectionId ||
    inventory.account.configuredAccountId !== target.accountId
  ) {
    throw new Error(
      '[CLOUD_DNS_INVENTORY_CONTEXT_MISMATCH] Inventory does not match the selected target.',
    );
  }
}

export function createCloudDnsPlan(args: {
  target: CloudDnsTargetContext;
  inventory: CloudDnsInventory;
  generatedAt?: string;
}): CloudDnsMutationPlan {
  assertInventoryContext(args.target, args.inventory);
  const operations: CloudDnsPlanOperation[] = [];
  for (const [recordId, record] of Object.entries(args.target.desired.records)) {
    const configuredZone = configuredZoneForRecord(args.target, record);
    const liveZone = liveZoneForConfigured(args.inventory, configuredZone);
    for (const content of desiredValues(record)) {
      const desired = desiredRecord(record, content);
      const resourceKey = `${configuredZone?.[0] ?? 'unknown'}:${desired.name}:${desired.type}:${desired.content}`;
      if (!configuredZone || !liveZone) {
        addOperation(operations, {
          action: 'blocked',
          risk: 'read_only',
          resourceType: 'dns-record',
          resourceKey,
          zoneKey: configuredZone?.[0] ?? null,
          zoneId: null,
          recordId: null,
          check: 'dns.zone.exists',
          message: `DNS record '${recordId}' cannot be planned because its configured zone was not observed.`,
          current: null,
          desired,
        });
        continue;
      }
      const currentRecords = matchingRecords(args.inventory.records, desired, liveZone.id);
      const exact = currentRecords.find((current) => recordMatchesDesired(current, desired));
      if (exact) {
        addOperation(operations, {
          action: 'no-op',
          risk: 'read_only',
          resourceType: 'dns-record',
          resourceKey,
          zoneKey: configuredZone[0],
          zoneId: liveZone.id,
          recordId: exact.id,
          check: 'dns.record.matches',
          message: `DNS record '${desired.name}' already matches desired state.`,
          current: exact,
          desired,
        });
        continue;
      }
      if (currentRecords.length === 1 && desiredValues(record).length === 1) {
        addOperation(operations, {
          action: 'update',
          risk: args.target.production ? 'high_risk_mutation' : 'low_risk_mutation',
          resourceType: 'dns-record',
          resourceKey,
          zoneKey: configuredZone[0],
          zoneId: liveZone.id,
          recordId: currentRecords[0]!.id,
          check: 'dns.record.update',
          message: `Update DNS ${desired.type} record '${desired.name}'.`,
          current: currentRecords[0]!,
          desired,
        });
        continue;
      }
      addOperation(operations, {
        action: 'create',
        risk: args.target.production ? 'high_risk_mutation' : 'low_risk_mutation',
        resourceType: 'dns-record',
        resourceKey,
        zoneKey: configuredZone[0],
        zoneId: liveZone.id,
        recordId: null,
        check: 'dns.record.create',
        message: `Create DNS ${desired.type} record '${desired.name}'.`,
        current: null,
        desired,
      });
    }
  }
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const targetIdentity = `cloudflare:account:${args.target.accountId}:target:${args.target.targetId}:zones:${args.inventory.zones
    .map((zone) => zone.id)
    .sort()
    .join(',')}`;
  const safety = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId: `cloud-dns-${hashOpsValue({
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
    actions: operations.map(safetyAction),
  });
  return parseCloudDnsMutationPlan({
    schemaVersion: 1,
    kind: 'cloud.dns-plan',
    provider: args.target.provider,
    projectId: args.target.projectId,
    targetId: args.target.targetId,
    environment: args.target.environment,
    connectionId: args.target.connectionId,
    configPath: args.target.configPath,
    generatedAt,
    production: args.target.production,
    accountId: args.target.accountId,
    operations,
    summary: {
      create: operations.filter((operation) => operation.action === 'create').length,
      update: operations.filter((operation) => operation.action === 'update').length,
      noOp: operations.filter((operation) => operation.action === 'no-op').length,
      blocked: operations.filter((operation) => operation.action === 'blocked').length,
    },
    safety: bindCloudDnsSafetyPlan({ operations, safety }),
  });
}

function requireReviewConfirmation(args: {
  plan: CloudDnsMutationPlan;
  accountConfirm?: string;
  productionConfirm?: string;
  yes?: boolean;
}): void {
  if (!args.yes) {
    throw new Error(
      '[CLOUD_DNS_APPLY_CONFIRMATION_REQUIRED] Pass --yes to apply a reviewed DNS plan.',
    );
  }
  if (args.accountConfirm !== args.plan.accountId) {
    throw new Error(
      `[CLOUD_DNS_ACCOUNT_CONFIRM_MISMATCH] Pass --account-confirm ${args.plan.accountId} to apply this plan.`,
    );
  }
  if (args.plan.production) {
    const expected = `${args.plan.environment}:${args.plan.accountId}:cloud-dns-apply`;
    if (args.productionConfirm !== expected) {
      throw new Error(
        `[CLOUD_DNS_PRODUCTION_CONFIRMATION_REQUIRED] Production DNS apply requires --production-confirm ${expected}.`,
      );
    }
  }
}

function assertPlanContext(target: CloudDnsTargetContext, plan: CloudDnsMutationPlan): void {
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
      '[CLOUD_DNS_PLAN_CONTEXT_MISMATCH] DNS plan does not match the selected target context.',
    );
  }
  for (const operation of plan.operations) {
    if (operation.action === 'blocked') {
      throw new Error(
        `[CLOUD_DNS_APPLY_BLOCKED_PLAN] Plan contains blocked operation '${operation.resourceKey}'.`,
      );
    }
  }
}

async function applyOperation(args: {
  provider: CloudDnsProvider;
  operation: CloudDnsPlanOperation;
  beforeEffect: () => Promise<void>;
}): Promise<CloudDnsApplyOperationResult> {
  const { operation } = args;
  if (operation.action === 'no-op') {
    return {
      resourceKey: operation.resourceKey,
      action: 'skipped',
      ok: true,
      id: operation.recordId,
      error: null,
    };
  }
  if (operation.action === 'blocked') {
    return {
      resourceKey: operation.resourceKey,
      action: 'skipped',
      ok: false,
      id: null,
      error: 'Blocked DNS operations cannot be applied.',
    };
  }
  if (!operation.zoneId || !operation.desired) {
    return {
      resourceKey: operation.resourceKey,
      action: operation.action,
      ok: false,
      id: null,
      error: 'Operation is missing zone id or desired record.',
    };
  }
  try {
    await args.beforeEffect();
    const result =
      operation.action === 'create'
        ? await args.provider.createDnsRecord(operation.zoneId, operation.desired)
        : await args.provider.updateDnsRecord(
            operation.zoneId,
            operation.recordId ?? '',
            operation.desired,
          );
    return {
      resourceKey: operation.resourceKey,
      action: operation.action,
      ok: true,
      id: result.id,
      error: null,
    };
  } catch (error) {
    return {
      resourceKey: operation.resourceKey,
      action: operation.action,
      ok: false,
      id: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function collectPostApplyDrift(args: {
  provider: CloudDnsProvider;
  plan: CloudDnsMutationPlan;
  generatedAt: string;
}): Promise<CloudDnsDriftReport> {
  try {
    const zones = new Map<string, string>();
    for (const operation of args.plan.operations) {
      if (operation.zoneId) {
        zones.set(operation.zoneId, operation.current?.zoneName ?? operation.zoneKey ?? 'unknown');
      }
    }
    const records = (
      await Promise.all(
        [...zones].map(([zoneId, zoneName]) => args.provider.listDnsRecords({ zoneId, zoneName })),
      )
    ).flat();
    return assessCloudDnsDrift({ plan: args.plan, records, generatedAt: args.generatedAt });
  } catch (error) {
    return unknownCloudDnsDrift({ plan: args.plan, error, generatedAt: args.generatedAt });
  }
}

function createApproval(args: {
  plan: CloudDnsMutationPlan;
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

function receiptStatus(
  results: readonly CloudDnsApplyOperationResult[],
): OpsMutationReceipt['status'] {
  const effects = results.filter((result) => result.action !== 'skipped');
  const succeeded = effects.filter((result) => result.ok).length;
  if (effects.length === 0 || succeeded === effects.length) return 'succeeded';
  if (succeeded === 0) return 'failed';
  return 'partial';
}

function createEngineReceipt(args: {
  plan: CloudDnsMutationPlan;
  approval: OpsApprovalRecord;
  lease: OpsLockLease;
  actorId: string;
  startedAt: string;
  completedAt: string;
  results: readonly CloudDnsApplyOperationResult[];
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
      const result = args.results.find(
        (candidate) => candidate.resourceKey === operation.resourceKey,
      );
      return {
        actionId: operation.operationId,
        status: result?.ok ? 'succeeded' : result ? 'failed' : 'skipped',
        outputHash: result ? hashOpsValue(result) : null,
      };
    }),
  });
}

export async function applyCloudDnsPlan(args: {
  binding: CloudDnsRuntimeBinding;
  planInput: unknown;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}): Promise<CloudDnsApplyReport> {
  if (!args.binding.provider || !args.binding.state) {
    throw new Error(
      '[CLOUD_DNS_RUNTIME_BINDING_INCOMPLETE] Apply requires provider and execution state.',
    );
  }
  const plan = parseCloudDnsMutationPlan(args.planInput);
  requireReviewConfirmation({
    plan,
    accountConfirm: args.accountConfirm,
    productionConfirm: args.productionConfirm,
    yes: args.yes,
  });
  assertPlanContext(args.binding.target, plan);
  const now = args.binding.now ?? new Date();
  const actorId = args.binding.actorId?.trim() || 'local-developer';
  const lockOwner = args.binding.lockOwner?.trim() || `${actorId}:${process.pid}:${randomUUID()}`;
  const lockId = `cloud-dns-${hashOpsValue(plan.safety.targetIdentity)}`;
  const approval = createApproval({ plan, actorId, now });
  await args.binding.state.approvals.put(approval);
  const lease = await args.binding.state.locks.acquire({
    lockId,
    owner: lockOwner,
    ttlMs: 5 * 60_000,
    now: now.toISOString(),
  });
  if (!lease) throw new Error('[OPS_LOCK_UNAVAILABLE] Another mutation owns this DNS target.');
  try {
    await assertOpsMutationPreflight({
      plan: plan.safety,
      approval,
      lease,
      expectation: {
        provider: plan.provider,
        projectId: plan.projectId,
        environment: plan.environment,
        targetIdentity: plan.safety.targetIdentity,
        lockId,
      },
      actor: args.binding.actor ?? 'developer',
      production: plan.production,
      multiProcess: args.binding.multiProcess ?? false,
      lockOwner,
      state: args.binding.state,
      now,
    });
    const startedAt = now.toISOString();
    const results: CloudDnsApplyOperationResult[] = [];
    for (const operation of plan.operations) {
      results.push(
        await applyOperation({
          provider: args.binding.provider,
          operation,
          beforeEffect: () =>
            args.binding.state!.locks.assertCurrent(lease, new Date().toISOString()),
        }),
      );
    }
    const completedAt = new Date().toISOString();
    const engineReceipt = createEngineReceipt({
      plan,
      approval,
      lease,
      actorId,
      startedAt,
      completedAt,
      results,
    });
    await args.binding.state.artifacts.recordReceipt(engineReceipt);
    const drift = await collectPostApplyDrift({
      provider: args.binding.provider,
      plan,
      generatedAt: completedAt,
    });
    const receipt: CloudDnsApplyReceipt = {
      schemaVersion: 1,
      kind: 'cloud.dns-apply-receipt',
      provider: plan.provider,
      projectId: plan.projectId,
      targetId: plan.targetId,
      environment: plan.environment,
      generatedAt: completedAt,
      planHash: plan.safety.planHash,
      accountId: plan.accountId,
      production: plan.production,
      results,
      engineReceipt,
      drift,
    };
    const artifact = args.binding.artifacts.writeJson({
      class: 'receipt',
      outputPath: args.receiptOutput,
      value: receipt,
    });
    return {
      ok: results.every((result) => result.ok),
      receipt,
      drift,
      artifact,
    };
  } finally {
    await args.binding.state.locks.release(lease);
  }
}

export function readCloudDnsInventory(
  binding: CloudDnsRuntimeBinding,
  relativePath: string,
): CloudDnsInventory {
  return parseCloudDnsInventory(binding.artifacts.readJson(relativePath, 'inventory'));
}
