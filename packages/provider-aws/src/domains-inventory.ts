import {
  ACMClient,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  type CertificateSummary,
} from '@aws-sdk/client-acm';
import {
  GetHostedZoneCommand,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
  type RRType,
  type ResourceRecordSet,
} from '@aws-sdk/client-route-53';
import {
  GetAccountCommand,
  GetConfigurationSetCommand,
  GetConfigurationSetEventDestinationsCommand,
  GetEmailIdentityCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2';
import { ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { log } from '@unisane/cli-core';
import { writeAwsJsonArtifact } from './artifacts.js';
import {
  configuredCloudFrontForEnvironment,
  SdkAwsCloudFrontInventoryReader,
} from './cloudfront-inventory.js';
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
  AwsDomainSnsSubscriptionInventory,
  AwsDomainsInventoryOptions,
  AwsDomainsInventoryReader,
  AwsDomainsInventoryReport,
  AwsIdentityReader,
  AwsOpsCertificateConfig,
  AwsOpsDnsZoneConfig,
  AwsOpsMailIdentityConfig,
} from './types.js';

const CLOUDFRONT_ROUTE53_HOSTED_ZONE_ID = 'Z2FDTNDATAQYW2';

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const named = error as { name?: unknown; Code?: unknown; code?: unknown };
    const code = named.name ?? named.Code ?? named.code;
    if (typeof code === 'string' && code.trim()) return code;
  }
  return 'UnknownError';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown AWS domains inventory error.';
}

function isMissing(error: unknown): boolean {
  return ['NotFoundException', 'NotFound', 'NoSuchHostedZone'].includes(errorCode(error));
}

function emptySesAccountInventory(
  errors?: AwsDomainSesAccountInventory['errors'],
): AwsDomainSesAccountInventory {
  return {
    productionAccessEnabled: null,
    sendingEnabled: null,
    enforcementStatus: null,
    suppressedReasons: [],
    errors: errors ?? [],
  };
}

export function configuredMailIdentitiesForEnvironment(
  context: AwsCommandContext,
): Array<[string, AwsOpsMailIdentityConfig]> {
  return Object.entries(context.config.mailIdentities ?? {}).filter(
    ([, identity]) => identity.environment === context.environment,
  );
}

export function configuredCertificatesForEnvironment(
  context: AwsCommandContext,
): Array<[string, AwsOpsCertificateConfig]> {
  return Object.entries(context.config.certificates ?? {}).filter(
    ([, certificate]) => certificate.environment === context.environment,
  );
}

export function configuredDnsZonesForEnvironment(
  context: AwsCommandContext,
): Array<[string, AwsOpsDnsZoneConfig]> {
  return Object.entries(context.config.dnsZones ?? {}).filter(
    ([, zone]) => zone.environment === context.environment,
  );
}

export function certificateRegion(
  context: AwsCommandContext,
  certificate: AwsOpsCertificateConfig,
): string {
  if (certificate.region) return certificate.region;
  return certificate.usage === 'cloudfront' ? 'us-east-1' : context.account.region;
}

function credentials(context: AwsCommandContext) {
  return context.account.profile
    ? { credentials: fromIni({ profile: context.account.profile }) }
    : {};
}

function sesClient(context: AwsCommandContext): SESv2Client {
  return new SESv2Client({
    region: context.account.region,
    ...credentials(context),
  });
}

function snsClient(context: AwsCommandContext): SNSClient {
  return new SNSClient({
    region: context.account.region,
    ...credentials(context),
  });
}

function acmClient(context: AwsCommandContext, region: string): ACMClient {
  return new ACMClient({
    region,
    ...credentials(context),
  });
}

function route53Client(context: AwsCommandContext): Route53Client {
  return new Route53Client({
    region: 'us-east-1',
    ...credentials(context),
  });
}

function emptyMailInventory(args: {
  key: string;
  identity: AwsOpsMailIdentityConfig;
  errors?: AwsDomainMailIdentityInventory['errors'];
}): AwsDomainMailIdentityInventory {
  return {
    key: args.key,
    environment: args.identity.environment,
    domain: args.identity.domain,
    exists: false,
    identityType: null,
    verifiedForSending: null,
    verificationStatus: null,
    dkimStatus: null,
    dkimTokens: [],
    dkimSigningHostedZone: null,
    mailFromDomain: null,
    mailFromStatus: null,
    configurationSetName: null,
    desiredMailFromDomain: args.identity.mailFromDomain ?? null,
    desiredConfigurationSetName: args.identity.configurationSet ?? null,
    configurationSetExists: args.identity.configurationSet ? false : null,
    configurationSetEventDestinations: [],
    errors: args.errors ?? [],
  };
}

async function readSesAccount(context: AwsCommandContext): Promise<AwsDomainSesAccountInventory> {
  const client = sesClient(context);
  try {
    const response = await client.send(new GetAccountCommand({}));
    return {
      productionAccessEnabled: response.ProductionAccessEnabled ?? null,
      sendingEnabled: response.SendingEnabled ?? null,
      enforcementStatus: response.EnforcementStatus ?? null,
      suppressedReasons: response.SuppressionAttributes?.SuppressedReasons ?? [],
      errors: [],
    };
  } catch (error) {
    return emptySesAccountInventory([{ code: errorCode(error), message: errorMessage(error) }]);
  }
}

function eventDestinationInventory(
  destination: {
    Name?: string;
    Enabled?: boolean;
    MatchingEventTypes?: string[];
    KinesisFirehoseDestination?: unknown;
    CloudWatchDestination?: unknown;
    SnsDestination?: unknown;
    EventBridgeDestination?: unknown;
    PinpointDestination?: unknown;
  },
  snsSubscriptions: AwsDomainSnsSubscriptionInventory[] = [],
): AwsDomainSesEventDestinationInventory {
  const destinationTypes: string[] = [];
  if (destination.KinesisFirehoseDestination) destinationTypes.push('kinesis-firehose');
  if (destination.CloudWatchDestination) destinationTypes.push('cloudwatch');
  if (destination.SnsDestination) destinationTypes.push('sns');
  if (destination.EventBridgeDestination) destinationTypes.push('eventbridge');
  if (destination.PinpointDestination) destinationTypes.push('pinpoint');
  return {
    name: destination.Name ?? 'unnamed',
    enabled: destination.Enabled ?? null,
    matchingEventTypes: destination.MatchingEventTypes ?? [],
    destinationTypes,
    snsTopicArn:
      typeof destination.SnsDestination === 'object' &&
      destination.SnsDestination &&
      'TopicArn' in destination.SnsDestination &&
      typeof destination.SnsDestination.TopicArn === 'string'
        ? destination.SnsDestination.TopicArn
        : null,
    snsSubscriptions,
  };
}

async function readSnsSubscriptionsByTopic(args: {
  client: SNSClient;
  topicArn: string;
}): Promise<AwsDomainSnsSubscriptionInventory[]> {
  const subscriptions: AwsDomainSnsSubscriptionInventory[] = [];
  let nextToken: string | undefined;
  do {
    const response = await args.client.send(
      new ListSubscriptionsByTopicCommand({
        TopicArn: args.topicArn,
        NextToken: nextToken,
      }),
    );
    for (const subscription of response.Subscriptions ?? []) {
      const subscriptionArn = subscription.SubscriptionArn ?? null;
      subscriptions.push({
        protocol: subscription.Protocol ?? null,
        endpoint: subscription.Endpoint ?? null,
        subscriptionArn,
        pendingConfirmation: subscriptionArn === 'PendingConfirmation',
      });
    }
    nextToken = response.NextToken;
  } while (nextToken);
  return subscriptions;
}

async function readConfigurationSetEventDestinations(args: {
  context: AwsCommandContext;
  client: SESv2Client;
  configurationSetName: string;
}): Promise<AwsDomainSesEventDestinationInventory[]> {
  const response = await args.client.send(
    new GetConfigurationSetEventDestinationsCommand({
      ConfigurationSetName: args.configurationSetName,
    }),
  );
  const subscriptionCache = new Map<string, AwsDomainSnsSubscriptionInventory[]>();
  const sns = snsClient(args.context);
  const destinations: AwsDomainSesEventDestinationInventory[] = [];
  for (const destination of response.EventDestinations ?? []) {
    const topicArn =
      typeof destination.SnsDestination?.TopicArn === 'string'
        ? destination.SnsDestination.TopicArn
        : null;
    let subscriptions: AwsDomainSnsSubscriptionInventory[] = [];
    if (topicArn) {
      const cached = subscriptionCache.get(topicArn);
      if (cached) {
        subscriptions = cached;
      } else {
        subscriptions = await readSnsSubscriptionsByTopic({ client: sns, topicArn });
        subscriptionCache.set(topicArn, subscriptions);
      }
    }
    destinations.push(eventDestinationInventory(destination, subscriptions));
  }
  return destinations;
}

async function readMailIdentity(args: {
  context: AwsCommandContext;
  key: string;
  identity: AwsOpsMailIdentityConfig;
}): Promise<AwsDomainMailIdentityInventory> {
  const client = sesClient(args.context);
  try {
    const response = await client.send(
      new GetEmailIdentityCommand({ EmailIdentity: args.identity.domain }),
    );
    let configurationSetExists: boolean | null = args.identity.configurationSet ? false : null;
    let configurationSetEventDestinations: AwsDomainSesEventDestinationInventory[] = [];
    if (args.identity.configurationSet) {
      try {
        await client.send(
          new GetConfigurationSetCommand({ ConfigurationSetName: args.identity.configurationSet }),
        );
        configurationSetExists = true;
        configurationSetEventDestinations = await readConfigurationSetEventDestinations({
          context: args.context,
          client,
          configurationSetName: args.identity.configurationSet,
        });
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
    }
    return {
      key: args.key,
      environment: args.identity.environment,
      domain: args.identity.domain,
      exists: true,
      identityType: response.IdentityType ?? null,
      verifiedForSending: response.VerifiedForSendingStatus ?? null,
      verificationStatus: response.VerificationStatus ?? null,
      dkimStatus: response.DkimAttributes?.Status ?? null,
      dkimTokens: response.DkimAttributes?.Tokens ?? [],
      dkimSigningHostedZone: response.DkimAttributes?.SigningHostedZone ?? null,
      mailFromDomain: response.MailFromAttributes?.MailFromDomain ?? null,
      mailFromStatus: response.MailFromAttributes?.MailFromDomainStatus ?? null,
      configurationSetName: response.ConfigurationSetName ?? null,
      desiredMailFromDomain: args.identity.mailFromDomain ?? null,
      desiredConfigurationSetName: args.identity.configurationSet ?? null,
      configurationSetExists,
      configurationSetEventDestinations,
      errors: [],
    };
  } catch (error) {
    if (isMissing(error)) return emptyMailInventory({ key: args.key, identity: args.identity });
    return emptyMailInventory({
      key: args.key,
      identity: args.identity,
      errors: [{ code: errorCode(error), message: errorMessage(error) }],
    });
  }
}

function emptyCertificateInventory(args: {
  context: AwsCommandContext;
  key: string;
  certificate: AwsOpsCertificateConfig;
  errors?: AwsDomainCertificateInventory['errors'];
}): AwsDomainCertificateInventory {
  return {
    key: args.key,
    environment: args.certificate.environment,
    domainName: args.certificate.domainName,
    certificateArn: null,
    region: certificateRegion(args.context, args.certificate),
    status: null,
    subjectAlternativeNames: [],
    validationMethod: null,
    renewalEligibility: null,
    inUseBy: [],
    desiredSubjectAlternativeNames: args.certificate.subjectAlternativeNames ?? [],
    desiredHostedZone: args.certificate.hostedZone ?? null,
    validationRecords: [],
    errors: args.errors ?? [],
  };
}

function certificateMatches(
  summary: CertificateSummary,
  certificate: AwsOpsCertificateConfig,
): boolean {
  return summary.DomainName === certificate.domainName;
}

async function findCertificateArn(args: {
  client: ACMClient;
  certificate: AwsOpsCertificateConfig;
}): Promise<string | null> {
  let nextToken: string | undefined;
  do {
    const response = await args.client.send(new ListCertificatesCommand({ NextToken: nextToken }));
    const match = (response.CertificateSummaryList ?? []).find((summary) =>
      certificateMatches(summary, args.certificate),
    );
    if (match?.CertificateArn) return match.CertificateArn;
    nextToken = response.NextToken;
  } while (nextToken);
  return null;
}

async function readCertificate(args: {
  context: AwsCommandContext;
  key: string;
  certificate: AwsOpsCertificateConfig;
}): Promise<AwsDomainCertificateInventory> {
  const region = certificateRegion(args.context, args.certificate);
  const client = acmClient(args.context, region);
  try {
    const certificateArn = await findCertificateArn({ client, certificate: args.certificate });
    if (!certificateArn) return emptyCertificateInventory(args);
    const response = await client.send(
      new DescribeCertificateCommand({ CertificateArn: certificateArn }),
    );
    const detail = response.Certificate;
    return {
      key: args.key,
      environment: args.certificate.environment,
      domainName: args.certificate.domainName,
      certificateArn,
      region,
      status: detail?.Status ?? null,
      subjectAlternativeNames: detail?.SubjectAlternativeNames ?? [],
      validationMethod: detail?.DomainValidationOptions?.[0]?.ValidationMethod ?? null,
      renewalEligibility: detail?.RenewalEligibility ?? null,
      inUseBy: detail?.InUseBy ?? [],
      desiredSubjectAlternativeNames: args.certificate.subjectAlternativeNames ?? [],
      desiredHostedZone: args.certificate.hostedZone ?? null,
      validationRecords:
        detail?.DomainValidationOptions?.map((option) => ({
          name: option.ResourceRecord?.Name ?? null,
          type: option.ResourceRecord?.Type ?? null,
          value: option.ResourceRecord?.Value ?? null,
          status: option.ValidationStatus ?? null,
        })) ?? [],
      errors: [],
    };
  } catch (error) {
    return emptyCertificateInventory({
      context: args.context,
      key: args.key,
      certificate: args.certificate,
      errors: [{ code: errorCode(error), message: errorMessage(error) }],
    });
  }
}

function normalizeZoneName(name: string): string {
  return name.endsWith('.') ? name : `${name}.`;
}

function hostedZoneId(value: string | undefined): string | null {
  if (!value) return null;
  return value.replace('/hostedzone/', '');
}

function emptyDnsZoneInventory(args: {
  key: string;
  zone: AwsOpsDnsZoneConfig;
  errors?: AwsDomainDnsZoneInventory['errors'];
}): AwsDomainDnsZoneInventory {
  return {
    key: args.key,
    environment: args.zone.environment,
    name: args.zone.name,
    hostedZoneId: args.zone.hostedZoneId ?? null,
    exists: false,
    provider: args.zone.provider ?? 'route53',
    privateZone: null,
    nameServers: [],
    records: [],
    errors: args.errors ?? [],
  };
}

function normalizeRecord(record: ResourceRecordSet): AwsDomainDnsRecordInventory | null {
  if (!record.Name || !record.Type) return null;
  return {
    name: record.Name,
    type: record.Type,
    values:
      record.ResourceRecords?.map((entry) => entry.Value).filter((value): value is string =>
        Boolean(value),
      ) ?? [],
    ttl: record.TTL ?? null,
    aliasTarget:
      record.AliasTarget?.DNSName && record.AliasTarget.HostedZoneId
        ? {
            dnsName: record.AliasTarget.DNSName,
            hostedZoneId: record.AliasTarget.HostedZoneId,
            evaluateTargetHealth: record.AliasTarget.EvaluateTargetHealth ?? null,
          }
        : null,
  };
}

async function listRecordSets(args: {
  client: Route53Client;
  hostedZoneId: string;
}): Promise<AwsDomainDnsRecordInventory[]> {
  const records: AwsDomainDnsRecordInventory[] = [];
  let startRecordName: string | undefined;
  let startRecordType: RRType | undefined;
  do {
    const response = await args.client.send(
      new ListResourceRecordSetsCommand({
        HostedZoneId: args.hostedZoneId,
        StartRecordName: startRecordName,
        StartRecordType: startRecordType,
      }),
    );
    records.push(
      ...(response.ResourceRecordSets ?? [])
        .map((record) => normalizeRecord(record))
        .filter((record): record is AwsDomainDnsRecordInventory => record !== null),
    );
    startRecordName = response.IsTruncated ? response.NextRecordName : undefined;
    startRecordType = response.IsTruncated ? response.NextRecordType : undefined;
  } while (startRecordName);
  return records;
}

async function readDnsZone(args: {
  context: AwsCommandContext;
  key: string;
  zone: AwsOpsDnsZoneConfig;
}): Promise<AwsDomainDnsZoneInventory> {
  if ((args.zone.provider ?? 'route53') !== 'route53') return emptyDnsZoneInventory(args);
  const client = route53Client(args.context);
  try {
    const response = args.zone.hostedZoneId
      ? await client.send(new GetHostedZoneCommand({ Id: args.zone.hostedZoneId }))
      : await client.send(
          new ListHostedZonesByNameCommand({ DNSName: normalizeZoneName(args.zone.name) }),
        );
    const zone =
      'HostedZone' in response
        ? response.HostedZone
        : (response.HostedZones ?? []).find(
            (entry) => entry.Name === normalizeZoneName(args.zone.name),
          );
    const delegationSet = 'DelegationSet' in response ? response.DelegationSet : null;
    if (!zone) return emptyDnsZoneInventory(args);
    const id = hostedZoneId(zone.Id);
    const records = id ? await listRecordSets({ client, hostedZoneId: id }) : [];
    return {
      key: args.key,
      environment: args.zone.environment,
      name: args.zone.name,
      hostedZoneId: id,
      exists: true,
      provider: args.zone.provider ?? 'route53',
      privateZone: zone.Config?.PrivateZone ?? null,
      nameServers: delegationSet?.NameServers ?? [],
      records,
      errors: [],
    };
  } catch (error) {
    if (isMissing(error)) return emptyDnsZoneInventory(args);
    return emptyDnsZoneInventory({
      key: args.key,
      zone: args.zone,
      errors: [{ code: errorCode(error), message: errorMessage(error) }],
    });
  }
}

export class SdkAwsDomainsInventoryReader implements AwsDomainsInventoryReader {
  async read(args: { context: AwsCommandContext }): Promise<{
    sesAccount: AwsDomainSesAccountInventory;
    mailIdentities: AwsDomainMailIdentityInventory[];
    certificates: AwsDomainCertificateInventory[];
    dnsZones: AwsDomainDnsZoneInventory[];
    cloudFrontAliases: AwsDomainCloudFrontAliasInventory[];
  }> {
    const shouldReadSesAccount = configuredMailIdentitiesForEnvironment(args.context).length > 0;
    const sesAccount = shouldReadSesAccount
      ? await readSesAccount(args.context)
      : emptySesAccountInventory();
    const mailIdentities = await Promise.all(
      configuredMailIdentitiesForEnvironment(args.context).map(([key, identity]) =>
        readMailIdentity({ context: args.context, key, identity }),
      ),
    );
    const certificates = await Promise.all(
      configuredCertificatesForEnvironment(args.context).map(([key, certificate]) =>
        readCertificate({ context: args.context, key, certificate }),
      ),
    );
    const dnsZones = await Promise.all(
      configuredDnsZonesForEnvironment(args.context).map(([key, zone]) =>
        readDnsZone({ context: args.context, key, zone }),
      ),
    );
    const cloudFront = await new SdkAwsCloudFrontInventoryReader().read({ context: args.context });
    const cloudFrontAliases = cloudFront.distributions
      .filter((distribution) => distribution.environment === args.context.environment)
      .map(
        (distribution): AwsDomainCloudFrontAliasInventory => ({
          cdnKey: distribution.key,
          environment: distribution.environment,
          distributionId: distribution.distributionId,
          domainName: distribution.domainName,
          status: distribution.status,
          enabled: distribution.enabled,
          aliases: distribution.aliases,
          desiredAliases:
            configuredCloudFrontForEnvironment(args.context).find(
              ([key]) => key === distribution.key,
            )?.[1].aliases ?? [],
          route53HostedZoneId: CLOUDFRONT_ROUTE53_HOSTED_ZONE_ID,
          errors: distribution.errors,
        }),
      );
    return { sesAccount, mailIdentities, certificates, dnsZones, cloudFrontAliases };
  }
}

export async function collectAwsDomainsInventory(args: {
  context: AwsCommandContext;
  reader: AwsDomainsInventoryReader;
  generatedAt?: string;
}): Promise<AwsDomainsInventoryReport> {
  const inventory = await args.reader.read({ context: args.context });
  const allErrors = [
    ...(inventory.sesAccount ?? emptySesAccountInventory()).errors,
    ...inventory.mailIdentities.flatMap((entry) => entry.errors),
    ...inventory.certificates.flatMap((entry) => entry.errors),
    ...inventory.dnsZones.flatMap((entry) => entry.errors),
    ...(inventory.cloudFrontAliases ?? []).flatMap((entry) => entry.errors),
  ];
  return {
    ok: allErrors.length === 0,
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    sesAccount: inventory.sesAccount ?? emptySesAccountInventory(),
    mailIdentities: inventory.mailIdentities,
    certificates: inventory.certificates,
    dnsZones: inventory.dnsZones,
    cloudFrontAliases: inventory.cloudFrontAliases ?? [],
  };
}

export async function runAwsDomainsInventory(
  options: AwsDomainsInventoryOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsDomainsInventoryReader },
): Promise<AwsDomainsInventoryReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reportWithoutArtifact = await collectAwsDomainsInventory({
    context,
    reader: deps?.inventoryReader ?? new SdkAwsDomainsInventoryReader(),
  });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/inventory/domains.json`,
    value: reportWithoutArtifact,
  });
  return { ...reportWithoutArtifact, artifact };
}

function printHumanInventory(report: AwsDomainsInventoryReport): void {
  log.info(`AWS domains inventory: ${report.environment}`);
  for (const identity of report.mailIdentities) {
    log.info(
      `- mail ${identity.key}: ${identity.exists ? (identity.verificationStatus ?? 'exists') : 'missing'}`,
    );
  }
  for (const certificate of report.certificates) {
    log.info(
      `- cert ${certificate.key}: ${certificate.certificateArn ? (certificate.status ?? 'exists') : 'missing'}`,
    );
  }
  for (const zone of report.dnsZones) {
    log.info(`- zone ${zone.key}: ${zone.exists ? (zone.hostedZoneId ?? 'exists') : 'missing'}`);
  }
  if (report.artifact) log.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsDomainsInventory(options: AwsDomainsInventoryOptions): Promise<number> {
  try {
    const report = await runAwsDomainsInventory(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanInventory(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS domains inventory error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
