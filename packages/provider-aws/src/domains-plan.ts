import { readFileSync } from 'node:fs';
import path from 'node:path';
import { log } from '@unisane/cli-core';
import { writeAwsJsonArtifact } from './artifacts.js';
import {
  collectAwsDomainsInventory,
  configuredCertificatesForEnvironment,
  configuredDnsZonesForEnvironment,
  configuredMailIdentitiesForEnvironment,
  SdkAwsDomainsInventoryReader,
} from './domains-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import type {
  AwsCommandContext,
  AwsDomainCertificateInventory,
  AwsDomainCloudFrontAliasInventory,
  AwsDomainDnsZoneInventory,
  AwsDomainDnsRecordInventory,
  AwsDomainMailIdentityInventory,
  AwsDomainSesAccountInventory,
  AwsDomainSesEventDestinationInventory,
  AwsDomainsInventoryReader,
  AwsDomainsInventoryReport,
  AwsDomainsPlanAction,
  AwsDomainsPlanOperation,
  AwsDomainsPlanOptions,
  AwsDomainsPlanReport,
  AwsIdentityReader,
  AwsOpsCertificateConfig,
  AwsOpsDnsZoneConfig,
  AwsOpsMailEventDestinationConfig,
  AwsOpsMailIdentityConfig,
} from './types.js';

function addOperation(
  operations: AwsDomainsPlanOperation[],
  operation: Omit<AwsDomainsPlanOperation, 'current' | 'desired'> & {
    current?: unknown;
    desired?: unknown;
  },
): void {
  operations.push({
    ...operation,
    current: operation.current ?? null,
    desired: operation.desired ?? null,
  });
}

function sorted(values: string[]): string[] {
  return [...values].sort();
}

function sameSet(left: string[], right: string[]): boolean {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function normalizeDnsName(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function normalizeDnsValue(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function normalizeAliasDnsName(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function recordValuesMatch(left: string[], right: string[]): boolean {
  return sameSet(
    left.map((value) => normalizeDnsValue(value)),
    right.map((value) => normalizeDnsValue(value)),
  );
}

function aliasTargetsMatch(
  current: AwsDomainDnsRecordInventory['aliasTarget'],
  desired: NonNullable<AwsDomainDnsRecordInventory['aliasTarget']>,
): boolean {
  return (
    Boolean(current) &&
    normalizeAliasDnsName(current?.dnsName ?? '') === normalizeAliasDnsName(desired.dnsName) &&
    current?.hostedZoneId === desired.hostedZoneId &&
    current?.evaluateTargetHealth === desired.evaluateTargetHealth
  );
}

function findRecord(args: {
  zone: AwsDomainDnsZoneInventory;
  name: string;
  type: string;
}): AwsDomainDnsRecordInventory | null {
  const name = normalizeDnsName(args.name);
  const type = args.type.toUpperCase();
  return (
    args.zone.records.find(
      (record) => normalizeDnsName(record.name) === name && record.type.toUpperCase() === type,
    ) ?? null
  );
}

function txtRecordContains(record: AwsDomainDnsRecordInventory | null, prefix: string): boolean {
  if (!record) return false;
  const normalizedPrefix = prefix.toLowerCase();
  return record.values.some((value) =>
    value
      .replace(/^"+|"+$/g, '')
      .trim()
      .toLowerCase()
      .startsWith(normalizedPrefix),
  );
}

function normalizedTxtValues(record: AwsDomainDnsRecordInventory | null): string[] {
  return (record?.values ?? []).map((value) =>
    value
      .replace(/^"+|"+$/g, '')
      .trim()
      .toLowerCase(),
  );
}

function dmarcTags(record: AwsDomainDnsRecordInventory | null): Map<string, string> {
  const dmarcValue = normalizedTxtValues(record).find((value) => value.startsWith('v=dmarc1'));
  const tags = new Map<string, string>();
  for (const part of dmarcValue?.split(';') ?? []) {
    const [key, value] = part.split('=');
    if (key?.trim() && value?.trim()) tags.set(key.trim(), value.trim());
  }
  return tags;
}

function dmarcEnforced(record: AwsDomainDnsRecordInventory | null): boolean {
  const tags = dmarcTags(record);
  const policy = tags.get('p');
  const pct = tags.get('pct');
  return (policy === 'quarantine' || policy === 'reject') && (!pct || pct === '100');
}

function findBestZoneForRecord(args: {
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
  zoneKey?: string | null;
  recordName: string;
}): AwsDomainDnsZoneInventory | null {
  if (args.zoneKey) return args.zonesByKey.get(args.zoneKey) ?? null;
  const recordName = normalizeDnsName(args.recordName);
  return (
    [...args.zonesByKey.values()]
      .filter(
        (zone) =>
          recordName === normalizeDnsName(zone.name) ||
          recordName.endsWith(`.${normalizeDnsName(zone.name)}`),
      )
      .sort(
        (left, right) => normalizeDnsName(right.name).length - normalizeDnsName(left.name).length,
      )[0] ?? null
  );
}

function addDnsRecordOperation(args: {
  operations: AwsDomainsPlanOperation[];
  zone: AwsDomainDnsZoneInventory | null;
  record: {
    purpose: string;
    name: string;
    type: string;
    values?: string[];
    ttl?: number;
    aliasTarget?: NonNullable<AwsDomainDnsRecordInventory['aliasTarget']>;
  };
  source: Record<string, unknown>;
}): void {
  if (args.zone && args.zone.provider !== 'route53') {
    addOperation(args.operations, {
      action: 'manual',
      resourceType: 'dns-record',
      resourceKey: `${args.zone.key}:${args.record.name}:${args.record.type}`,
      check: `dns.record.${args.record.purpose}.manual`,
      message: `Create or update ${args.record.type} record '${args.record.name}' in external DNS provider '${args.zone.provider}'.`,
      current: null,
      desired: {
        hostedZoneKey: args.zone.key,
        provider: args.zone.provider,
        zoneName: args.zone.name,
        ttl: args.record.aliasTarget ? null : args.record.ttl,
        ...args.record,
        source: args.source,
      },
    });
    return;
  }

  if (!args.zone?.exists || !args.zone.hostedZoneId) {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'dns-record',
      resourceKey: args.record.name,
      check: `dns.record.${args.record.purpose}.zone-unavailable`,
      message: `Cannot plan Route 53 record '${args.record.name}' because no managed hosted zone is available.`,
      current: null,
      desired: {
        ...args.record,
        source: args.source,
      },
    });
    return;
  }

  const current = findRecord({
    zone: args.zone,
    name: args.record.name,
    type: args.record.type,
  });
  if (current && args.record.aliasTarget) {
    if (aliasTargetsMatch(current.aliasTarget, args.record.aliasTarget)) return;
  } else if (current && recordValuesMatch(current.values, args.record.values ?? [])) {
    return;
  }

  addOperation(args.operations, {
    action: 'update',
    resourceType: 'dns-record',
    resourceKey: `${args.zone.key}:${args.record.name}:${args.record.type}`,
    check: `dns.record.${args.record.purpose}.upsert`,
    message: `Upsert Route 53 ${args.record.type} record '${args.record.name}' in hosted zone '${args.zone.name}'.`,
    current,
    desired: {
      hostedZoneKey: args.zone.key,
      hostedZoneId: args.zone.hostedZoneId,
      ttl: args.record.aliasTarget ? null : args.record.ttl,
      ...args.record,
      source: args.source,
    },
  });
}

function desiredMailPayload(identity: AwsOpsMailIdentityConfig): Record<string, unknown> {
  return {
    domain: identity.domain,
    mailFromDomain: identity.mailFromDomain ?? null,
    configurationSet: identity.configurationSet ?? null,
    dkim: 'required',
    feedbackAndComplaintTracking: 'required',
  };
}

function eventTypesCovered(
  destinations: AwsDomainSesEventDestinationInventory[],
  required: string[],
): boolean {
  const enabledTypes = new Set(
    destinations
      .filter((destination) => destination.enabled === true)
      .flatMap((destination) =>
        destination.matchingEventTypes.map((eventType) => eventType.toUpperCase()),
      ),
  );
  return required.every((eventType) => enabledTypes.has(eventType));
}

function normalizeEventType(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeDestinationType(value: string): string {
  return value.trim().toLowerCase();
}

function desiredEventDestinationPayload(args: {
  configurationSet: string;
  destination: AwsOpsMailEventDestinationConfig;
}): Record<string, unknown> {
  return {
    configurationSet: args.configurationSet,
    name: args.destination.name,
    type: normalizeDestinationType(args.destination.type),
    enabled: args.destination.enabled ?? true,
    matchingEventTypes: sorted(args.destination.matchingEventTypes.map(normalizeEventType)),
    topicArn: args.destination.topicArn ?? null,
  };
}

function normalizeSubscriptionProtocol(value: string): string {
  return value.trim().toLowerCase();
}

function desiredSnsSubscriptionPayload(args: {
  configurationSet: string;
  destination: AwsOpsMailEventDestinationConfig;
  subscription: NonNullable<AwsOpsMailEventDestinationConfig['subscriptions']>[number];
}): Record<string, unknown> {
  return {
    configurationSet: args.configurationSet,
    eventDestinationName: args.destination.name,
    topicArn: args.destination.topicArn ?? null,
    protocol: normalizeSubscriptionProtocol(args.subscription.protocol),
    endpoint: args.subscription.endpoint,
  };
}

function snsSubscriptionMatches(args: {
  current: AwsDomainSesEventDestinationInventory;
  desired: NonNullable<AwsOpsMailEventDestinationConfig['subscriptions']>[number];
}): { exists: boolean; pendingConfirmation: boolean } {
  const protocol = normalizeSubscriptionProtocol(args.desired.protocol);
  const match = args.current.snsSubscriptions.find(
    (subscription) =>
      normalizeSubscriptionProtocol(subscription.protocol ?? '') === protocol &&
      subscription.endpoint === args.desired.endpoint,
  );
  return {
    exists: Boolean(match),
    pendingConfirmation: match?.pendingConfirmation === true,
  };
}

function eventDestinationMatches(args: {
  current: AwsDomainSesEventDestinationInventory;
  desired: AwsOpsMailEventDestinationConfig;
}): boolean {
  const desiredType = normalizeDestinationType(args.desired.type);
  if (args.current.enabled !== (args.desired.enabled ?? true)) return false;
  if (
    !sameSet(
      args.current.matchingEventTypes.map(normalizeEventType),
      args.desired.matchingEventTypes.map(normalizeEventType),
    )
  ) {
    return false;
  }
  if (!args.current.destinationTypes.map(normalizeDestinationType).includes(desiredType))
    return false;
  if (desiredType === 'sns' && args.current.snsTopicArn !== args.desired.topicArn) return false;
  return true;
}

function planMailEventDestinations(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  identity: AwsOpsMailIdentityConfig;
  current: AwsDomainMailIdentityInventory;
}): void {
  if (!args.identity.configurationSet) return;
  for (const destination of args.identity.eventDestinations ?? []) {
    const current = args.current.configurationSetEventDestinations.find(
      (entry) => entry.name === destination.name,
    );
    const desired = desiredEventDestinationPayload({
      configurationSet: args.identity.configurationSet,
      destination,
    });
    if (!current) {
      addOperation(args.operations, {
        action: 'create',
        resourceType: 'mail-identity',
        resourceKey: `${args.key}:${destination.name}`,
        check: 'mail.configuration-set.event-destination.exists',
        message: `Create SES configuration set event destination '${destination.name}'.`,
        current: null,
        desired,
      });
      continue;
    }
    if (!eventDestinationMatches({ current, desired: destination })) {
      addOperation(args.operations, {
        action: 'update',
        resourceType: 'mail-identity',
        resourceKey: `${args.key}:${destination.name}`,
        check: 'mail.configuration-set.event-destination.matches',
        message: `Update SES configuration set event destination '${destination.name}'.`,
        current,
        desired,
      });
    }
    for (const subscription of destination.subscriptions ?? []) {
      const desiredSubscription = desiredSnsSubscriptionPayload({
        configurationSet: args.identity.configurationSet,
        destination,
        subscription,
      });
      const match = snsSubscriptionMatches({ current, desired: subscription });
      if (!match.exists) {
        addOperation(args.operations, {
          action: 'create',
          resourceType: 'mail-identity',
          resourceKey: `${args.key}:${destination.name}:${subscription.protocol}:${subscription.endpoint}`,
          check: 'mail.configuration-set.event-destination.subscription.exists',
          message: `Subscribe SES event destination '${destination.name}' SNS topic to '${subscription.endpoint}'.`,
          current: null,
          desired: desiredSubscription,
        });
      } else if (match.pendingConfirmation) {
        addOperation(args.operations, {
          action: 'update',
          resourceType: 'mail-identity',
          resourceKey: `${args.key}:${destination.name}:${subscription.protocol}:${subscription.endpoint}`,
          check: 'mail.configuration-set.event-destination.subscription.confirmed',
          message: `Confirm SNS subscription for SES event destination '${destination.name}'.`,
          current: { pendingConfirmation: true },
          desired: { ...desiredSubscription, pendingConfirmation: false },
        });
      }
    }
  }
}

function planSesAccountReadiness(args: {
  operations: AwsDomainsPlanOperation[];
  sesAccount: AwsDomainSesAccountInventory;
  identityKey: string;
  identity: AwsOpsMailIdentityConfig;
  production: boolean;
}): void {
  if (!args.production) return;
  if (args.sesAccount.productionAccessEnabled !== true) {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'mail-identity',
      resourceKey: args.identityKey,
      check: 'mail.account.production-access',
      message: `SES account for '${args.identity.domain}' must leave sandbox before production sending.`,
      current: args.sesAccount.productionAccessEnabled,
      desired: true,
    });
  }
  if (args.sesAccount.sendingEnabled !== true) {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'mail-identity',
      resourceKey: args.identityKey,
      check: 'mail.account.sending-enabled',
      message: `SES account sending must be enabled before production sending for '${args.identity.domain}'.`,
      current: args.sesAccount.sendingEnabled,
      desired: true,
    });
  }
  if (args.sesAccount.enforcementStatus && args.sesAccount.enforcementStatus !== 'HEALTHY') {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'mail-identity',
      resourceKey: args.identityKey,
      check: 'mail.account.reputation',
      message: `SES account reputation must be HEALTHY before production sending for '${args.identity.domain}'.`,
      current: args.sesAccount.enforcementStatus,
      desired: 'HEALTHY',
    });
  }
}

function planProductionMailReadiness(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  identity: AwsOpsMailIdentityConfig;
  current: AwsDomainMailIdentityInventory;
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
}): void {
  const zone = findBestZoneForRecord({
    zonesByKey: args.zonesByKey,
    recordName: args.identity.domain,
  });
  const dmarcName = `_dmarc.${args.identity.domain}`;
  const dmarcRecord = zone ? findRecord({ zone, name: dmarcName, type: 'TXT' }) : null;
  if (!txtRecordContains(dmarcRecord, 'v=DMARC1')) {
    addOperation(args.operations, {
      action: zone && zone.provider !== 'route53' ? 'manual' : 'blocked',
      resourceType: 'dns-record',
      resourceKey: zone ? `${zone.key}:${dmarcName}:TXT` : dmarcName,
      check:
        zone && zone.provider !== 'route53'
          ? 'dns.record.dmarc.manual'
          : 'dns.record.dmarc.required',
      message: `DMARC TXT record '${dmarcName}' is required before production sending for '${args.identity.domain}'.`,
      current: dmarcRecord,
      desired: {
        hostedZoneKey: zone?.key ?? null,
        provider: zone?.provider ?? null,
        name: dmarcName,
        type: 'TXT',
        guidance:
          'Publish a DMARC policy appropriate for the sending domain before production volume.',
        source: {
          mailIdentityKey: args.key,
          domain: args.identity.domain,
        },
      },
    });
  }

  if (
    args.identity.configurationSet &&
    !args.identity.eventDestinations?.length &&
    !eventTypesCovered(args.current.configurationSetEventDestinations, ['BOUNCE', 'COMPLAINT'])
  ) {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.configuration-set.event-destinations',
      message: `SES configuration set '${args.identity.configurationSet}' must capture BOUNCE and COMPLAINT events before production sending.`,
      current: args.current.configurationSetEventDestinations,
      desired: {
        configurationSet: args.identity.configurationSet,
        requiredEventTypes: ['BOUNCE', 'COMPLAINT'],
      },
    });
  }
}

function bimiSelector(identity: AwsOpsMailIdentityConfig): string {
  return identity.bimi?.selector ?? 'default';
}

function bimiRecordName(identity: AwsOpsMailIdentityConfig): string {
  return `${bimiSelector(identity)}._bimi.${identity.domain}`;
}

function desiredBimiTxtValue(identity: AwsOpsMailIdentityConfig): string {
  const bimi = identity.bimi;
  if (!bimi) throw new Error('[AWS_DOMAINS_BIMI_MISSING_CONFIG]');
  const certificate = bimi.certificateUrl ? `; a=${bimi.certificateUrl}` : '';
  return `"v=BIMI1; l=${bimi.logoUrl}${certificate}"`;
}

function planBimiSenderBrandReadiness(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  identity: AwsOpsMailIdentityConfig;
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
}): void {
  if (!args.identity.bimi) return;

  const identityZone = findBestZoneForRecord({
    zonesByKey: args.zonesByKey,
    zoneKey: args.identity.bimi.hostedZone,
    recordName: args.identity.domain,
  });
  const dmarcName = `_dmarc.${args.identity.domain}`;
  const dmarcRecord = identityZone
    ? findRecord({ zone: identityZone, name: dmarcName, type: 'TXT' })
    : null;
  if (!dmarcEnforced(dmarcRecord)) {
    addOperation(args.operations, {
      action: identityZone && identityZone.provider !== 'route53' ? 'manual' : 'blocked',
      resourceType: 'dns-record',
      resourceKey: identityZone ? `${identityZone.key}:${dmarcName}:TXT` : dmarcName,
      check:
        identityZone && identityZone.provider !== 'route53'
          ? 'dns.record.dmarc-enforcement.manual'
          : 'dns.record.dmarc-enforcement.required',
      message: `DMARC TXT record '${dmarcName}' must use p=quarantine or p=reject with pct=100 before BIMI can be reliable for '${args.identity.domain}'.`,
      current: dmarcRecord,
      desired: {
        hostedZoneKey: identityZone?.key ?? null,
        provider: identityZone?.provider ?? null,
        name: dmarcName,
        type: 'TXT',
        guidance: 'Publish enforced DMARC before relying on BIMI sender-logo display.',
        requiredPolicy: ['quarantine', 'reject'],
        requiredPct: '100',
        source: {
          mailIdentityKey: args.key,
          domain: args.identity.domain,
          bimiSelector: bimiSelector(args.identity),
        },
      },
    });
  }

  const name = bimiRecordName(args.identity);
  addDnsRecordOperation({
    operations: args.operations,
    zone: findBestZoneForRecord({
      zonesByKey: args.zonesByKey,
      zoneKey: args.identity.bimi.hostedZone,
      recordName: name,
    }),
    record: {
      purpose: 'bimi',
      name,
      type: 'TXT',
      values: [desiredBimiTxtValue(args.identity)],
      ttl: 300,
    },
    source: {
      mailIdentityKey: args.key,
      domain: args.identity.domain,
      bimiSelector: bimiSelector(args.identity),
      bimiLogoUrl: args.identity.bimi.logoUrl,
      bimiCertificateUrl: args.identity.bimi.certificateUrl ?? null,
    },
  });
}

function desiredCertificatePayload(certificate: AwsOpsCertificateConfig): Record<string, unknown> {
  return {
    domainName: certificate.domainName,
    subjectAlternativeNames: certificate.subjectAlternativeNames ?? [],
    validationMethod: 'DNS',
    hostedZone: certificate.hostedZone ?? null,
    usage: certificate.usage ?? 'regional',
    region: certificate.region ?? null,
  };
}

function desiredDnsZonePayload(zone: AwsOpsDnsZoneConfig): Record<string, unknown> {
  return {
    name: zone.name,
    provider: zone.provider ?? 'route53',
    privateZone: zone.privateZone ?? false,
  };
}

function planMailIdentity(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  identity: AwsOpsMailIdentityConfig;
  current: AwsDomainMailIdentityInventory | undefined;
  sesAccount: AwsDomainSesAccountInventory;
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
  context: AwsCommandContext;
}): void {
  const before = args.operations.length;
  if (!args.current?.exists) {
    addOperation(args.operations, {
      action: 'create',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.exists',
      message: `Create SES sending identity '${args.identity.domain}'.`,
      current: false,
      desired: desiredMailPayload(args.identity),
    });
    return;
  }

  planSesAccountReadiness({
    operations: args.operations,
    sesAccount: args.sesAccount,
    identityKey: args.key,
    identity: args.identity,
    production: args.context.account.production,
  });

  if (args.current.verifiedForSending !== true || args.current.verificationStatus !== 'SUCCESS') {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.verified',
      message: `Complete SES verification for '${args.identity.domain}'.`,
      current: {
        verifiedForSending: args.current.verifiedForSending,
        verificationStatus: args.current.verificationStatus,
      },
      desired: {
        verifiedForSending: true,
        verificationStatus: 'SUCCESS',
      },
    });
  }

  if (args.current.dkimStatus !== 'SUCCESS') {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.dkim',
      message: `Complete DKIM verification for '${args.identity.domain}'.`,
      current: args.current.dkimStatus,
      desired: 'SUCCESS',
    });
  }

  if (
    args.identity.mailFromDomain &&
    args.current.mailFromDomain !== args.identity.mailFromDomain
  ) {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.mail-from-domain',
      message: `Configure MAIL FROM domain '${args.identity.mailFromDomain}'.`,
      current: {
        domain: args.current.mailFromDomain,
        status: args.current.mailFromStatus,
      },
      desired: {
        domain: args.identity.mailFromDomain,
        status: 'SUCCESS',
      },
    });
  }

  if (args.identity.configurationSet && args.current.configurationSetExists !== true) {
    addOperation(args.operations, {
      action: 'create',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.configuration-set.exists',
      message: `Create SES configuration set '${args.identity.configurationSet}'.`,
      current: false,
      desired: args.identity.configurationSet,
    });
  }

  if (
    args.identity.configurationSet &&
    args.current.configurationSetName !== args.identity.configurationSet
  ) {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.configuration-set',
      message: `Attach SES configuration set '${args.identity.configurationSet}' to '${args.identity.domain}'.`,
      current: args.current.configurationSetName,
      desired: args.identity.configurationSet,
    });
  }

  planMailEventDestinations({
    operations: args.operations,
    key: args.key,
    identity: args.identity,
    current: args.current,
  });

  if (args.context.account.production) {
    planProductionMailReadiness({
      operations: args.operations,
      key: args.key,
      identity: args.identity,
      current: args.current,
      zonesByKey: args.zonesByKey,
    });
  }

  for (const token of args.current.dkimTokens) {
    const name = `${token}._domainkey.${args.identity.domain}`;
    const signingHostedZone = args.current.dkimSigningHostedZone ?? 'dkim.amazonses.com';
    addDnsRecordOperation({
      operations: args.operations,
      zone: findBestZoneForRecord({
        zonesByKey: args.zonesByKey,
        recordName: name,
      }),
      record: {
        purpose: 'ses-dkim',
        name,
        type: 'CNAME',
        values: [`${token}.${signingHostedZone}`],
        ttl: 300,
      },
      source: {
        mailIdentityKey: args.key,
        domain: args.identity.domain,
      },
    });
  }

  if (args.identity.mailFromDomain) {
    addDnsRecordOperation({
      operations: args.operations,
      zone: findBestZoneForRecord({
        zonesByKey: args.zonesByKey,
        recordName: args.identity.mailFromDomain,
      }),
      record: {
        purpose: 'ses-mail-from-mx',
        name: args.identity.mailFromDomain,
        type: 'MX',
        values: [`10 feedback-smtp.${args.context.account.region}.amazonses.com`],
        ttl: 300,
      },
      source: {
        mailIdentityKey: args.key,
        domain: args.identity.domain,
      },
    });
    addDnsRecordOperation({
      operations: args.operations,
      zone: findBestZoneForRecord({
        zonesByKey: args.zonesByKey,
        recordName: args.identity.mailFromDomain,
      }),
      record: {
        purpose: 'ses-mail-from-spf',
        name: args.identity.mailFromDomain,
        type: 'TXT',
        values: ['"v=spf1 include:amazonses.com ~all"'],
        ttl: 300,
      },
      source: {
        mailIdentityKey: args.key,
        domain: args.identity.domain,
      },
    });
  }

  planBimiSenderBrandReadiness({
    operations: args.operations,
    key: args.key,
    identity: args.identity,
    zonesByKey: args.zonesByKey,
  });

  if (args.operations.length === before) {
    addOperation(args.operations, {
      action: 'no-op',
      resourceType: 'mail-identity',
      resourceKey: args.key,
      check: 'mail.identity.posture',
      message: `SES mail identity '${args.identity.domain}' already matches the current desired-state checks.`,
    });
  }
}

function planCertificate(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  certificate: AwsOpsCertificateConfig;
  current: AwsDomainCertificateInventory | undefined;
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
}): void {
  const before = args.operations.length;
  if (!args.current?.certificateArn) {
    addOperation(args.operations, {
      action: 'create',
      resourceType: 'certificate',
      resourceKey: args.key,
      check: 'certificate.exists',
      message: `Request ACM certificate for '${args.certificate.domainName}'.`,
      current: false,
      desired: desiredCertificatePayload(args.certificate),
    });
    return;
  }

  if (args.current.status !== 'ISSUED') {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'certificate',
      resourceKey: args.key,
      check: 'certificate.validation',
      message: `Complete ACM DNS validation for '${args.certificate.domainName}'.`,
      current: {
        status: args.current.status,
        validationRecords: args.current.validationRecords,
      },
      desired: {
        status: 'ISSUED',
        validationMethod: 'DNS',
      },
    });
  }

  for (const record of args.current.validationRecords) {
    if (!record.name || !record.type || !record.value) continue;
    addDnsRecordOperation({
      operations: args.operations,
      zone: findBestZoneForRecord({
        zonesByKey: args.zonesByKey,
        zoneKey: args.current.desiredHostedZone,
        recordName: record.name,
      }),
      record: {
        purpose: 'acm-validation',
        name: record.name,
        type: record.type,
        values: [record.value],
        ttl: 300,
      },
      source: {
        certificateKey: args.key,
        certificateArn: args.current.certificateArn,
        domainName: args.certificate.domainName,
      },
    });
  }

  const desiredSans = args.certificate.subjectAlternativeNames ?? [];
  const currentExtraSans = args.current.subjectAlternativeNames.filter(
    (name) => name !== args.certificate.domainName,
  );
  if (!sameSet(currentExtraSans, desiredSans)) {
    addOperation(args.operations, {
      action: 'update',
      resourceType: 'certificate',
      resourceKey: args.key,
      check: 'certificate.subject-alternative-names',
      message: `Align ACM certificate SANs for '${args.certificate.domainName}'.`,
      current: sorted(currentExtraSans),
      desired: sorted(desiredSans),
    });
  }

  if (args.operations.length === before) {
    addOperation(args.operations, {
      action: 'no-op',
      resourceType: 'certificate',
      resourceKey: args.key,
      check: 'certificate.posture',
      message: `ACM certificate '${args.certificate.domainName}' already matches the current desired-state checks.`,
    });
  }
}

function planDnsZone(args: {
  operations: AwsDomainsPlanOperation[];
  key: string;
  zone: AwsOpsDnsZoneConfig;
  current: AwsDomainDnsZoneInventory | undefined;
}): void {
  if ((args.zone.provider ?? 'route53') !== 'route53') {
    addOperation(args.operations, {
      action: 'no-op',
      resourceType: 'dns-zone',
      resourceKey: args.key,
      check: 'dns.zone.external-provider',
      message: `DNS zone '${args.zone.name}' uses external provider '${args.zone.provider}'; matching records will be emitted as manual operations.`,
      current: args.zone.provider,
      desired: desiredDnsZonePayload(args.zone),
    });
    return;
  }

  if (!args.current?.exists) {
    addOperation(args.operations, {
      action: 'create',
      resourceType: 'dns-zone',
      resourceKey: args.key,
      check: 'dns.zone.exists',
      message: `Create Route 53 hosted zone '${args.zone.name}'.`,
      current: false,
      desired: desiredDnsZonePayload(args.zone),
    });
    return;
  }

  if (args.zone.privateZone !== undefined && args.current.privateZone !== args.zone.privateZone) {
    addOperation(args.operations, {
      action: 'blocked',
      resourceType: 'dns-zone',
      resourceKey: args.key,
      check: 'dns.zone.private-zone',
      message: `Hosted zone '${args.zone.name}' private/public mode does not match desired state; create a separate zone instead of mutating mode in place.`,
      current: args.current.privateZone,
      desired: args.zone.privateZone,
    });
    return;
  }

  addOperation(args.operations, {
    action: 'no-op',
    resourceType: 'dns-zone',
    resourceKey: args.key,
    check: 'dns.zone.posture',
    message: `Route 53 hosted zone '${args.zone.name}' already matches the current desired-state checks.`,
  });
}

function planCloudFrontAliasRecords(args: {
  operations: AwsDomainsPlanOperation[];
  current: AwsDomainCloudFrontAliasInventory;
  zonesByKey: Map<string, AwsDomainDnsZoneInventory>;
}): void {
  if (!args.current.domainName) {
    for (const alias of args.current.desiredAliases) {
      addOperation(args.operations, {
        action: 'blocked',
        resourceType: 'dns-record',
        resourceKey: `${args.current.cdnKey}:${alias}`,
        check: 'dns.record.cloudfront-alias.distribution-unavailable',
        message: `Cannot plan CloudFront alias '${alias}' because CDN '${args.current.cdnKey}' has no distribution domain yet.`,
        current: null,
        desired: {
          cdnKey: args.current.cdnKey,
          alias,
          target: 'CloudFront distribution domain',
        },
      });
    }
    return;
  }

  for (const alias of args.current.desiredAliases) {
    const zone = findBestZoneForRecord({
      zonesByKey: args.zonesByKey,
      recordName: alias,
    });
    for (const type of ['A', 'AAAA']) {
      addDnsRecordOperation({
        operations: args.operations,
        zone,
        record: {
          purpose: 'cloudfront-alias',
          name: alias,
          type,
          aliasTarget: {
            dnsName: args.current.domainName,
            hostedZoneId: args.current.route53HostedZoneId,
            evaluateTargetHealth: false,
          },
        },
        source: {
          cdnKey: args.current.cdnKey,
          distributionId: args.current.distributionId,
          distributionDomainName: args.current.domainName,
        },
      });
    }
  }
}

export function createAwsDomainsPlan(args: {
  context: AwsCommandContext;
  inventory: AwsDomainsInventoryReport;
  generatedAt?: string;
}): AwsDomainsPlanReport {
  const operations: AwsDomainsPlanOperation[] = [];
  const mailByKey = new Map(args.inventory.mailIdentities.map((entry) => [entry.key, entry]));
  const certificatesByKey = new Map(args.inventory.certificates.map((entry) => [entry.key, entry]));
  const dnsZonesByKey = new Map(args.inventory.dnsZones.map((entry) => [entry.key, entry]));

  for (const [key, identity] of configuredMailIdentitiesForEnvironment(args.context)) {
    planMailIdentity({
      operations,
      key,
      identity,
      current: mailByKey.get(key),
      sesAccount: args.inventory.sesAccount,
      zonesByKey: dnsZonesByKey,
      context: args.context,
    });
  }
  for (const [key, certificate] of configuredCertificatesForEnvironment(args.context)) {
    planCertificate({
      operations,
      key,
      certificate,
      current: certificatesByKey.get(key),
      zonesByKey: dnsZonesByKey,
    });
  }
  for (const [key, zone] of configuredDnsZonesForEnvironment(args.context)) {
    planDnsZone({ operations, key, zone, current: dnsZonesByKey.get(key) });
  }
  for (const cloudFrontAlias of args.inventory.cloudFrontAliases) {
    planCloudFrontAliasRecords({
      operations,
      current: cloudFrontAlias,
      zonesByKey: dnsZonesByKey,
    });
  }

  const summary = operations.reduce<Record<AwsDomainsPlanAction, number>>(
    (acc, operation) => {
      acc[operation.action] += 1;
      return acc;
    },
    { create: 0, update: 0, manual: 0, blocked: 0, 'no-op': 0 },
  );

  return {
    ok: summary.blocked === 0 && args.inventory.ok,
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    operations,
    summary,
  };
}

function ensureInsideCwd(cwd: string, candidate: string): string {
  const resolved = path.resolve(cwd, candidate);
  const normalizedCwd = path.resolve(cwd);
  const prefix = normalizedCwd.endsWith(path.sep) ? normalizedCwd : `${normalizedCwd}${path.sep}`;
  if (resolved !== normalizedCwd && !resolved.startsWith(prefix)) {
    throw new Error(
      `[AWS_DOMAINS_INVENTORY_PATH_OUTSIDE_CWD] Inventory path must stay inside cwd: ${candidate}`,
    );
  }
  return resolved;
}

function readInventoryFromFile(cwd: string, inventoryPath: string): AwsDomainsInventoryReport {
  const resolved = ensureInsideCwd(cwd, inventoryPath);
  return JSON.parse(readFileSync(resolved, 'utf8')) as AwsDomainsInventoryReport;
}

export async function runAwsDomainsPlan(
  options: AwsDomainsPlanOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsDomainsInventoryReader },
): Promise<AwsDomainsPlanReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const inventory = options.inventoryPath
    ? readInventoryFromFile(context.cwd, options.inventoryPath)
    : await collectAwsDomainsInventory({
        context,
        reader: deps?.inventoryReader ?? new SdkAwsDomainsInventoryReader(),
      });

  const planWithoutArtifact = createAwsDomainsPlan({ context, inventory });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/plans/domains-plan.json`,
    value: planWithoutArtifact,
  });

  return { ...planWithoutArtifact, artifact };
}

function printHumanPlan(report: AwsDomainsPlanReport): void {
  log.info(`AWS domains plan: ${report.environment}`);
  for (const operation of report.operations) {
    log.info(
      `- [${operation.action}] ${operation.resourceType}.${operation.resourceKey}.${operation.check}`,
    );
  }
  if (report.artifact) log.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsDomainsPlan(options: AwsDomainsPlanOptions): Promise<number> {
  try {
    const report = await runAwsDomainsPlan(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanPlan(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS domains plan error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
