import type { CloudDnsDriftReport, CloudDnsMutationPlan, CloudDnsRecord } from './contracts.js';

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function recordMatches(
  current: CloudDnsRecord,
  desired: NonNullable<CloudDnsMutationPlan['operations'][number]['desired']>,
  zoneId: string,
): boolean {
  return (
    current.zoneId === zoneId &&
    current.type.toUpperCase() === desired.type.toUpperCase() &&
    normalizeName(current.name) === normalizeName(desired.name) &&
    current.content.trim() === desired.content.trim() &&
    (current.ttl ?? 1) === desired.ttl &&
    (desired.proxied === undefined || current.proxied === desired.proxied) &&
    (desired.priority === undefined || current.priority === desired.priority)
  );
}

export function assessCloudDnsDrift(args: {
  plan: CloudDnsMutationPlan;
  records: readonly CloudDnsRecord[];
  generatedAt?: string;
}): CloudDnsDriftReport {
  const blocked = args.plan.operations.filter((operation) => operation.action === 'blocked');
  if (blocked.length > 0) {
    return {
      kind: 'cloud.dns-drift',
      provider: 'cloudflare',
      projectId: args.plan.projectId,
      targetId: args.plan.targetId,
      environment: args.plan.environment,
      generatedAt: args.generatedAt ?? new Date().toISOString(),
      classification: 'configuration',
      differences: blocked.map((operation) => ({
        resourceKey: operation.resourceKey,
        reason: operation.message,
      })),
    };
  }
  const differences = args.plan.operations.flatMap((operation) => {
    if (!operation.desired || !operation.zoneId) return [];
    return args.records.some((record) =>
      recordMatches(record, operation.desired!, operation.zoneId!),
    )
      ? []
      : [{ resourceKey: operation.resourceKey, reason: 'Desired DNS state was not observed.' }];
  });
  return {
    kind: 'cloud.dns-drift',
    provider: 'cloudflare',
    projectId: args.plan.projectId,
    targetId: args.plan.targetId,
    environment: args.plan.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    classification: differences.length === 0 ? 'none' : 'remote',
    differences,
  };
}

export function unknownCloudDnsDrift(args: {
  plan: CloudDnsMutationPlan;
  error: unknown;
  generatedAt?: string;
}): CloudDnsDriftReport {
  return {
    kind: 'cloud.dns-drift',
    provider: 'cloudflare',
    projectId: args.plan.projectId,
    targetId: args.plan.targetId,
    environment: args.plan.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    classification: 'unknown',
    differences: [
      {
        resourceKey: args.plan.safety.targetIdentity,
        reason: args.error instanceof Error ? args.error.message : String(args.error),
      },
    ],
  };
}
