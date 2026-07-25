import { createOpsMutationPlan, hashOpsValue } from '@unisane/ops-engine';
import { describe, expect, it } from 'vitest';
import {
  assessCloudDnsDrift,
  createCloudDnsImportProposal,
  hashCloudDnsOperationInput,
  parseCloudDnsMutationPlan,
  type CloudDnsMutationPlan,
  type CloudDnsPlanOperation,
} from '../index.js';

const operation: CloudDnsPlanOperation = {
  operationId: 'dns_1',
  action: 'create',
  risk: 'low_risk_mutation',
  resourceType: 'dns-record',
  resourceKey: 'zone:www.example.test:CNAME:target.example.test',
  zoneKey: 'site',
  zoneId: 'zone_1',
  recordId: null,
  check: 'dns.record.create',
  message: 'Create DNS record.',
  current: null,
  desired: {
    type: 'CNAME',
    name: 'www.example.test',
    content: 'target.example.test',
    ttl: 1,
    proxied: false,
  },
};

function plan(): CloudDnsMutationPlan {
  const safety = createOpsMutationPlan({
    schemaVersion: 1,
    kind: 'ops.mutation-plan',
    planId: 'plan_1',
    provider: 'cloudflare',
    projectId: 'project-1',
    environment: 'dev',
    targetIdentity: 'cloudflare:account:account_1:target:target-1:zones:zone_1',
    commandVersion: '0.1.0',
    configHash: hashOpsValue({ config: true }),
    inventoryHash: hashOpsValue({ inventory: true }),
    generatedAt: '2026-07-24T10:00:00.000Z',
    expiresAt: '2026-07-24T10:15:00.000Z',
    actions: [
      {
        id: operation.operationId,
        type: 'create',
        risk: 'medium',
        resourceIdentity: operation.resourceKey,
        inputHash: hashCloudDnsOperationInput(operation),
      },
    ],
  });
  return {
    schemaVersion: 1,
    kind: 'cloud.dns-plan',
    provider: 'cloudflare',
    projectId: 'project-1',
    targetId: 'target-1',
    environment: 'dev',
    connectionId: 'cloudflare-main',
    configPath: '/workspace/unisane.config.ts',
    generatedAt: '2026-07-24T10:00:00.000Z',
    production: false,
    accountId: 'account_1',
    operations: [operation],
    summary: { create: 1, update: 0, noOp: 0, blocked: 0 },
    safety,
  };
}

describe('@unisane/cloud DNS contracts', () => {
  it('creates a deterministic import proposal only for explicitly selected zones', () => {
    const inventory = {
      schemaVersion: 1 as const,
      kind: 'cloud.dns-inventory' as const,
      provider: 'cloudflare' as const,
      projectId: 'project-1',
      targetId: 'target-1',
      environment: 'dev',
      connectionId: 'cloudflare-main',
      generatedAt: '2026-07-24T10:00:00.000Z',
      account: {
        configuredAccountId: 'account_1',
        liveAccounts: [{ id: 'account_1', name: 'Example' }],
      },
      zones: [
        {
          key: null,
          id: 'zone_1',
          name: 'example.test',
          status: 'active',
          accountId: 'account_1',
          accountName: 'Example',
          configured: false,
        },
        {
          key: null,
          id: 'zone_2',
          name: 'other.test',
          status: 'active',
          accountId: 'account_1',
          accountName: 'Example',
          configured: false,
        },
      ],
      records: [
        {
          id: 'record_1',
          zoneId: 'zone_1',
          zoneName: 'example.test',
          type: 'CNAME',
          name: 'www.example.test',
          content: 'target.example.test',
          ttl: 1,
          proxied: false,
          comment: null,
          priority: null,
        },
        {
          id: 'record_2',
          zoneId: 'zone_2',
          zoneName: 'other.test',
          type: 'A',
          name: 'other.test',
          content: '192.0.2.1',
          ttl: 300,
          proxied: null,
          comment: null,
          priority: null,
        },
      ],
      errors: [],
    };
    const first = createCloudDnsImportProposal({
      inventory,
      zoneIds: ['zone_1'],
      generatedAt: '2026-07-24T11:00:00.000Z',
    });
    const second = createCloudDnsImportProposal({
      inventory,
      zoneIds: ['zone_1', 'zone_1'],
      generatedAt: '2026-07-24T11:00:00.000Z',
    });

    expect(second).toEqual(first);
    expect(first.selectedZoneIds).toEqual(['zone_1']);
    expect(first.summary).toEqual({ zones: 1, records: 1 });
    expect(Object.values(first.desired.records)[0]).toEqual(
      expect.objectContaining({
        zone: 'example-test',
        type: 'CNAME',
        name: 'www.example.test',
        content: 'target.example.test',
      }),
    );
    expect(() => createCloudDnsImportProposal({ inventory, zoneIds: [] })).toThrow(
      '[CLOUD_DNS_IMPORT_ZONE_REQUIRED]',
    );
    expect(() => createCloudDnsImportProposal({ inventory, zoneIds: ['zone_missing'] })).toThrow(
      "[CLOUD_DNS_IMPORT_ZONE_UNKNOWN] Zone 'zone_missing'",
    );
  });

  it('strictly parses a versioned plan bound to the engine action hashes', () => {
    expect(parseCloudDnsMutationPlan(plan()).safety.projectId).toBe('project-1');
    expect(() => parseCloudDnsMutationPlan({ ...plan(), extra: true })).toThrow();
    const changed = {
      ...plan(),
      operations: [{ ...operation, desired: { ...operation.desired!, content: 'changed.test' } }],
    };
    expect(() => parseCloudDnsMutationPlan(changed)).toThrow('[CLOUD_DNS_PLAN_SAFETY_MISMATCH]');
  });

  it('classifies post-apply DNS drift as none, remote, or configuration', () => {
    expect(
      assessCloudDnsDrift({
        plan: plan(),
        records: [
          {
            id: 'record_1',
            zoneId: 'zone_1',
            zoneName: 'example.test',
            type: 'CNAME',
            name: 'www.example.test',
            content: 'target.example.test',
            ttl: 1,
            proxied: false,
            comment: null,
            priority: null,
          },
        ],
      }).classification,
    ).toBe('none');
    expect(assessCloudDnsDrift({ plan: plan(), records: [] }).classification).toBe('remote');
    const blocked = {
      ...plan(),
      operations: [{ ...operation, action: 'blocked' as const }],
    };
    expect(assessCloudDnsDrift({ plan: blocked, records: [] }).classification).toBe(
      'configuration',
    );
  });
});
