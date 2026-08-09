import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ACMClient, RequestCertificateCommand } from '@aws-sdk/client-acm';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
  type RRType,
} from '@aws-sdk/client-route-53';
import {
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  CreateEmailIdentityCommand,
  PutEmailIdentityConfigurationSetAttributesCommand,
  PutEmailIdentityMailFromAttributesCommand,
  SESv2Client,
  UpdateConfigurationSetEventDestinationCommand,
  type EventType,
} from '@aws-sdk/client-sesv2';
import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { providerOutput } from './cli-output.js';
import { awsSafeArtifactStamp, writeAwsJsonArtifact } from './artifacts.js';
import {
  certificateRegion,
  configuredCertificatesForEnvironment,
  configuredMailIdentitiesForEnvironment,
} from './domains-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import { withAwsOperationLock } from './lock.js';
import type {
  AwsCommandContext,
  AwsDomainsApplyExecutor,
  AwsDomainsApplyOperationResult,
  AwsDomainsApplyOptions,
  AwsDomainsApplyReceipt,
  AwsDomainsApplyReport,
  AwsDomainsPlanOperation,
  AwsDomainsPlanReport,
  AwsIdentityReader,
  AwsOpsCertificateConfig,
  AwsOpsMailIdentityConfig,
} from './types.js';

const RECEIPT_KIND = 'unisane.aws.domains-apply-receipt' as const;
const MAX_PRODUCTION_PLAN_AGE_MS = 24 * 60 * 60 * 1000;

function ensureInsideCwd(cwd: string, candidate: string): string {
  const resolved = path.resolve(cwd, candidate);
  const normalizedCwd = path.resolve(cwd);
  const prefix = normalizedCwd.endsWith(path.sep) ? normalizedCwd : `${normalizedCwd}${path.sep}`;
  if (resolved !== normalizedCwd && !resolved.startsWith(prefix)) {
    throw new Error(
      `[AWS_PLAN_PATH_OUTSIDE_CWD] Domains apply plan must stay inside cwd: ${candidate}`,
    );
  }
  return resolved;
}

function readPlan(cwd: string, planPath: string): { planPath: string; plan: AwsDomainsPlanReport } {
  const resolved = ensureInsideCwd(cwd, planPath);
  return {
    planPath: resolved,
    plan: JSON.parse(readFileSync(resolved, 'utf8')) as AwsDomainsPlanReport,
  };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function desiredObject(value: unknown, code: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(code);
  return value;
}

function desiredString(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(code);
  return value;
}

function desiredStringArray(value: unknown, code: string): string[] {
  if (!Array.isArray(value)) throw new Error(code);
  return value.map((entry) => desiredString(entry, code));
}

function desiredBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
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

function defaultTags(context: AwsCommandContext): Array<{ Key: string; Value: string }> {
  return Object.entries({
    ...(context.config.defaults?.tags ?? {}),
    Environment: context.environment,
  }).map(([Key, Value]) => ({ Key, Value }));
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const named = error as { name?: unknown; Code?: unknown; code?: unknown };
    const code = named.name ?? named.Code ?? named.code;
    if (typeof code === 'string' && code.trim()) return code;
  }
  return 'UnknownError';
}

function isAlreadyExists(error: unknown): boolean {
  return ['AlreadyExistsException', 'AlreadyExists', 'ResourceAlreadyExistsException'].includes(
    errorCode(error),
  );
}

async function ignoreAlreadyExists(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
}

function configuredMailIdentity(context: AwsCommandContext, key: string): AwsOpsMailIdentityConfig {
  const identity = new Map(configuredMailIdentitiesForEnvironment(context)).get(key);
  if (!identity) {
    throw new Error(`[AWS_DOMAINS_APPLY_UNKNOWN_MAIL_IDENTITY] Unknown mail identity '${key}'.`);
  }
  return identity;
}

function configuredCertificate(context: AwsCommandContext, key: string): AwsOpsCertificateConfig {
  const certificate = new Map(configuredCertificatesForEnvironment(context)).get(key);
  if (!certificate) {
    throw new Error(`[AWS_DOMAINS_APPLY_UNKNOWN_CERTIFICATE] Unknown certificate '${key}'.`);
  }
  return certificate;
}

function isAllowedStagedBlockedOperation(operation: AwsDomainsPlanOperation): boolean {
  return (
    operation.action === 'blocked' &&
    ((operation.resourceType === 'dns-record' &&
      operation.check === 'dns.record.cloudfront-alias.distribution-unavailable') ||
      (operation.resourceType === 'mail-identity' &&
        operation.check === 'mail.configuration-set.event-destinations'))
  );
}

function isAllowedStagedStatusOperation(operation: AwsDomainsPlanOperation): boolean {
  return (
    operation.action === 'update' &&
    ((operation.resourceType === 'mail-identity' &&
      [
        'mail.identity.verified',
        'mail.identity.dkim',
        'mail.configuration-set.event-destination.subscription.confirmed',
      ].includes(operation.check)) ||
      (operation.resourceType === 'certificate' && operation.check === 'certificate.validation'))
  );
}

function assertSupportedOperation(operation: AwsDomainsPlanOperation): void {
  if (operation.action === 'no-op') return;
  if (operation.action === 'manual') return;
  if (isAllowedStagedBlockedOperation(operation)) return;
  if (isAllowedStagedStatusOperation(operation)) return;
  if (operation.action === 'blocked') {
    throw new Error(
      `[AWS_DOMAINS_APPLY_BLOCKED_PLAN] Plan contains blocked operation '${operation.resourceType}.${operation.resourceKey}.${operation.check}'.`,
    );
  }
  if (operation.action === 'create' && operation.resourceType === 'mail-identity') {
    if (
      [
        'mail.identity.exists',
        'mail.configuration-set.exists',
        'mail.configuration-set.event-destination.exists',
        'mail.configuration-set.event-destination.subscription.exists',
      ].includes(operation.check)
    )
      return;
  }
  if (operation.action === 'update' && operation.resourceType === 'mail-identity') {
    if (
      [
        'mail.identity.configuration-set',
        'mail.identity.mail-from-domain',
        'mail.configuration-set.event-destination.matches',
      ].includes(operation.check)
    )
      return;
  }
  if (operation.action === 'create' && operation.resourceType === 'certificate') {
    if (operation.check === 'certificate.exists') return;
  }
  if (operation.action === 'update' && operation.resourceType === 'dns-record') {
    if (
      [
        'dns.record.acm-validation.upsert',
        'dns.record.ses-dkim.upsert',
        'dns.record.ses-mail-from-mx.upsert',
        'dns.record.ses-mail-from-spf.upsert',
        'dns.record.bimi.upsert',
        'dns.record.cloudfront-alias.upsert',
      ].includes(operation.check)
    ) {
      return;
    }
  }
  throw new Error(
    `[AWS_DOMAINS_APPLY_UNSUPPORTED_OPERATION] Domains apply cannot safely execute '${operation.action}:${operation.resourceType}:${operation.check}'.`,
  );
}

function validatePlanForApply(args: {
  context: AwsCommandContext;
  plan: AwsDomainsPlanReport;
  options: AwsDomainsApplyOptions;
}): void {
  if (!args.options.yes) {
    throw new Error(
      '[AWS_DOMAINS_APPLY_REQUIRES_YES] Domains apply requires --yes after reviewing the plan.',
    );
  }
  if (args.options.accountConfirm !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_DOMAINS_APPLY_ACCOUNT_CONFIRM_REQUIRED] Expected --account-confirm ${args.context.account.expectedAccountId}.`,
    );
  }
  if (args.plan.environment !== args.context.environment) {
    throw new Error(
      `[AWS_DOMAINS_APPLY_ENVIRONMENT_MISMATCH] Plan environment '${args.plan.environment}' does not match selected environment '${args.context.environment}'.`,
    );
  }
  if (args.plan.account.expectedAccountId !== args.context.account.expectedAccountId) {
    throw new Error(
      '[AWS_DOMAINS_APPLY_ACCOUNT_MISMATCH] Plan account does not match active account.',
    );
  }
  const blockedOperations = args.plan.operations.filter(
    (operation) => operation.action === 'blocked',
  );
  const hasUnsupportedBlockedOperation = blockedOperations.some(
    (operation) => !isAllowedStagedBlockedOperation(operation),
  );
  if ((!args.plan.ok || args.plan.summary.blocked > 0) && hasUnsupportedBlockedOperation) {
    throw new Error(
      '[AWS_DOMAINS_APPLY_BLOCKED_PLAN] Refusing to apply a blocked or failed domains plan.',
    );
  }
  for (const operation of args.plan.operations) {
    assertSupportedOperation(operation);
  }
  if (args.context.account.production) {
    const expected = `${args.context.environment}:${args.context.account.expectedAccountId}:domains-apply`;
    if (args.options.productionConfirm !== expected) {
      throw new Error(
        `[AWS_DOMAINS_APPLY_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${expected}.`,
      );
    }
    const createdAt = Date.parse(args.plan.generatedAt);
    if (
      !args.options.force &&
      Number.isFinite(createdAt) &&
      Date.now() - createdAt > MAX_PRODUCTION_PLAN_AGE_MS
    ) {
      throw new Error(
        '[AWS_DOMAINS_APPLY_STALE_PRODUCTION_PLAN] Production domains plan is older than 24 hours.',
      );
    }
  }
}

function certificateIdempotencyToken(context: AwsCommandContext, key: string): string {
  return createHash('sha256')
    .update(`${context.environment}:${context.account.expectedAccountId}:${key}`)
    .digest('hex')
    .slice(0, 32);
}

function sesEventDestinationDefinition(desired: Record<string, unknown>) {
  const type = desiredString(
    desired.type,
    '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_TYPE]',
  ).toLowerCase();
  if (type !== 'sns') {
    throw new Error(
      `[AWS_DOMAINS_APPLY_UNSUPPORTED_EVENT_DESTINATION_TYPE] Unsupported SES event destination type '${type}'.`,
    );
  }
  const topicArn = desiredString(
    desired.topicArn,
    '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_TOPIC_ARN]',
  );
  return {
    Enabled: desiredBoolean(desired.enabled, true),
    MatchingEventTypes: desiredStringArray(
      desired.matchingEventTypes,
      '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_EVENT_TYPES]',
    ) as EventType[],
    SnsDestination: {
      TopicArn: topicArn,
    },
  };
}

export class SdkAwsDomainsApplyExecutor implements AwsDomainsApplyExecutor {
  async applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsDomainsPlanOperation;
  }): Promise<AwsDomainsApplyOperationResult> {
    const operation = args.operation;
    if (operation.action === 'no-op') {
      return { operation, status: 'skipped', message: 'No change required.' };
    }
    if (operation.action === 'manual') {
      return {
        operation,
        status: 'skipped',
        message: 'Manual external DNS action; no AWS mutation executed.',
      };
    }
    if (isAllowedStagedBlockedOperation(operation)) {
      return {
        operation,
        status: 'skipped',
        message: 'Staged readiness blocker; complete the prerequisite resource first.',
      };
    }
    if (isAllowedStagedStatusOperation(operation)) {
      return {
        operation,
        status: 'skipped',
        message: 'Verification status check; complete DNS/readiness prerequisites first.',
      };
    }

    if (operation.action === 'create' && operation.check === 'mail.identity.exists') {
      const identity = configuredMailIdentity(args.context, operation.resourceKey);
      const client = sesClient(args.context);
      await ignoreAlreadyExists(async () => {
        await client.send(
          new CreateEmailIdentityCommand({
            EmailIdentity: identity.domain,
            Tags: defaultTags(args.context),
          }),
        );
      });
      return {
        operation,
        status: 'succeeded',
        message: `SES identity created: ${identity.domain}.`,
      };
    }

    if (operation.action === 'create' && operation.check === 'mail.configuration-set.exists') {
      const name = desiredString(
        operation.desired,
        '[AWS_DOMAINS_APPLY_INVALID_CONFIGURATION_SET]',
      );
      const client = sesClient(args.context);
      await ignoreAlreadyExists(async () => {
        await client.send(
          new CreateConfigurationSetCommand({
            ConfigurationSetName: name,
            Tags: defaultTags(args.context),
          }),
        );
      });
      return { operation, status: 'succeeded', message: `SES configuration set created: ${name}.` };
    }

    if (
      operation.action === 'create' &&
      operation.check === 'mail.configuration-set.event-destination.exists'
    ) {
      const desired = desiredObject(
        operation.desired,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION]',
      );
      const configurationSetName = desiredString(
        desired.configurationSet,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_CONFIGURATION_SET]',
      );
      const destinationName = desiredString(
        desired.name,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_NAME]',
      );
      await ignoreAlreadyExists(async () => {
        await sesClient(args.context).send(
          new CreateConfigurationSetEventDestinationCommand({
            ConfigurationSetName: configurationSetName,
            EventDestinationName: destinationName,
            EventDestination: sesEventDestinationDefinition(desired),
          }),
        );
      });
      return {
        operation,
        status: 'succeeded',
        message: `SES event destination created: ${destinationName}.`,
      };
    }

    if (
      operation.action === 'create' &&
      operation.check === 'mail.configuration-set.event-destination.subscription.exists'
    ) {
      const desired = desiredObject(
        operation.desired,
        '[AWS_DOMAINS_APPLY_INVALID_SNS_SUBSCRIPTION]',
      );
      const topicArn = desiredString(
        desired.topicArn,
        '[AWS_DOMAINS_APPLY_INVALID_SNS_SUBSCRIPTION_TOPIC_ARN]',
      );
      const protocol = desiredString(
        desired.protocol,
        '[AWS_DOMAINS_APPLY_INVALID_SNS_SUBSCRIPTION_PROTOCOL]',
      );
      const endpoint = desiredString(
        desired.endpoint,
        '[AWS_DOMAINS_APPLY_INVALID_SNS_SUBSCRIPTION_ENDPOINT]',
      );
      const response = await snsClient(args.context).send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: protocol,
          Endpoint: endpoint,
          ReturnSubscriptionArn: true,
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `SNS subscription requested: ${response.SubscriptionArn ?? endpoint}.`,
      };
    }

    if (
      operation.action === 'update' &&
      operation.check === 'mail.configuration-set.event-destination.matches'
    ) {
      const desired = desiredObject(
        operation.desired,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION]',
      );
      const configurationSetName = desiredString(
        desired.configurationSet,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_CONFIGURATION_SET]',
      );
      const destinationName = desiredString(
        desired.name,
        '[AWS_DOMAINS_APPLY_INVALID_EVENT_DESTINATION_NAME]',
      );
      await sesClient(args.context).send(
        new UpdateConfigurationSetEventDestinationCommand({
          ConfigurationSetName: configurationSetName,
          EventDestinationName: destinationName,
          EventDestination: sesEventDestinationDefinition(desired),
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `SES event destination updated: ${destinationName}.`,
      };
    }

    if (operation.action === 'update' && operation.check === 'mail.identity.configuration-set') {
      const identity = configuredMailIdentity(args.context, operation.resourceKey);
      const configurationSet = desiredString(
        operation.desired,
        '[AWS_DOMAINS_APPLY_INVALID_IDENTITY_CONFIGURATION_SET]',
      );
      await sesClient(args.context).send(
        new PutEmailIdentityConfigurationSetAttributesCommand({
          EmailIdentity: identity.domain,
          ConfigurationSetName: configurationSet,
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `SES configuration set attached: ${configurationSet}.`,
      };
    }

    if (operation.action === 'update' && operation.check === 'mail.identity.mail-from-domain') {
      const identity = configuredMailIdentity(args.context, operation.resourceKey);
      const desired = desiredObject(operation.desired, '[AWS_DOMAINS_APPLY_INVALID_MAIL_FROM]');
      const mailFromDomain = desiredString(
        desired.domain,
        '[AWS_DOMAINS_APPLY_INVALID_MAIL_FROM_DOMAIN]',
      );
      await sesClient(args.context).send(
        new PutEmailIdentityMailFromAttributesCommand({
          EmailIdentity: identity.domain,
          MailFromDomain: mailFromDomain,
          BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `SES MAIL FROM configured: ${mailFromDomain}.`,
      };
    }

    if (operation.action === 'create' && operation.check === 'certificate.exists') {
      const certificate = configuredCertificate(args.context, operation.resourceKey);
      const region = certificateRegion(args.context, certificate);
      const subjectAlternativeNames = certificate.subjectAlternativeNames?.filter(Boolean) ?? [];
      const response = await acmClient(args.context, region).send(
        new RequestCertificateCommand({
          DomainName: certificate.domainName,
          ...(subjectAlternativeNames.length > 0
            ? { SubjectAlternativeNames: subjectAlternativeNames }
            : {}),
          ValidationMethod: 'DNS',
          IdempotencyToken: certificateIdempotencyToken(args.context, operation.resourceKey),
          Tags: defaultTags(args.context),
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `ACM certificate requested: ${response.CertificateArn ?? certificate.domainName}.`,
      };
    }

    if (operation.action === 'update' && operation.resourceType === 'dns-record') {
      const desired = desiredObject(operation.desired, '[AWS_DOMAINS_APPLY_INVALID_DNS_RECORD]');
      const hostedZoneId = desiredString(
        desired.hostedZoneId,
        '[AWS_DOMAINS_APPLY_INVALID_HOSTED_ZONE_ID]',
      );
      const name = desiredString(desired.name, '[AWS_DOMAINS_APPLY_INVALID_RECORD_NAME]');
      const type = desiredString(
        desired.type,
        '[AWS_DOMAINS_APPLY_INVALID_RECORD_TYPE]',
      ).toUpperCase() as RRType;
      const aliasTarget = isRecord(desired.aliasTarget) ? desired.aliasTarget : null;
      const values = aliasTarget
        ? []
        : desiredStringArray(desired.values, '[AWS_DOMAINS_APPLY_INVALID_RECORD_VALUES]');
      const ttl = typeof desired.ttl === 'number' ? desired.ttl : 300;
      const response = await route53Client(args.context).send(
        new ChangeResourceRecordSetsCommand({
          HostedZoneId: hostedZoneId,
          ChangeBatch: {
            Comment: `Managed by Unisane Ops: ${operation.check}`,
            Changes: [
              {
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: name,
                  Type: type,
                  ...(aliasTarget
                    ? {
                        AliasTarget: {
                          DNSName: desiredString(
                            aliasTarget.dnsName,
                            '[AWS_DOMAINS_APPLY_INVALID_ALIAS_DNS_NAME]',
                          ),
                          HostedZoneId: desiredString(
                            aliasTarget.hostedZoneId,
                            '[AWS_DOMAINS_APPLY_INVALID_ALIAS_HOSTED_ZONE_ID]',
                          ),
                          EvaluateTargetHealth: aliasTarget.evaluateTargetHealth === true,
                        },
                      }
                    : {
                        TTL: ttl,
                        ResourceRecords: values.map((Value) => ({ Value })),
                      }),
                },
              },
            ],
          },
        }),
      );
      return {
        operation,
        status: 'succeeded',
        message: `Route 53 record upsert requested: ${response.ChangeInfo?.Id ?? name}.`,
      };
    }

    throw new Error(
      `[AWS_DOMAINS_APPLY_UNSUPPORTED_OPERATION] Domains apply cannot execute '${operation.action}:${operation.resourceType}:${operation.check}'.`,
    );
  }
}

async function applyOperations(args: {
  context: AwsCommandContext;
  plan: AwsDomainsPlanReport;
  executor: AwsDomainsApplyExecutor;
}): Promise<AwsDomainsApplyOperationResult[]> {
  const results: AwsDomainsApplyOperationResult[] = [];
  for (const operation of args.plan.operations) {
    try {
      results.push(await args.executor.applyOperation({ context: args.context, operation }));
    } catch (error) {
      results.push({
        operation,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown domains apply error.',
      });
      break;
    }
  }
  return results;
}

export async function runAwsDomainsApply(
  options: AwsDomainsApplyOptions,
  deps?: {
    identityReader?: AwsIdentityReader;
    executor?: AwsDomainsApplyExecutor;
    now?: () => Date;
  },
): Promise<AwsDomainsApplyReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const { planPath, plan } = readPlan(context.cwd, options.planPath);
  validatePlanForApply({ context, plan, options });
  const executor = deps?.executor ?? new SdkAwsDomainsApplyExecutor();
  const now = deps?.now ?? (() => new Date());
  const appliedAt = now();

  return await withAwsOperationLock({
    cwd: context.cwd,
    environment: context.environment,
    family: 'domains-apply',
    run: async (lockPath) => {
      const results = await applyOperations({ context, plan, executor });
      const receipt: AwsDomainsApplyReceipt = {
        version: 1,
        kind: RECEIPT_KIND,
        status: results.every((result) => result.status !== 'failed') ? 'succeeded' : 'failed',
        environment: context.environment,
        account: context.account,
        planPath,
        planHash: hashJson(plan),
        planGeneratedAt: plan.generatedAt,
        appliedAt: appliedAt.toISOString(),
        completedAt: now().toISOString(),
        lockPath,
        results,
      };
      const artifact = writeAwsJsonArtifact({
        cwd: context.cwd,
        outputPath: options.receiptOutput,
        defaultRelativePath: `.unisane/aws/${context.environment}/receipts/domains-apply-${awsSafeArtifactStamp(appliedAt)}.json`,
        value: receipt,
      });
      return {
        ok: receipt.status === 'succeeded',
        receipt,
        artifact,
      };
    },
  });
}

function printHumanApply(report: AwsDomainsApplyReport): void {
  providerOutput.info(`AWS domains apply: ${report.receipt.environment}`);
  for (const result of report.receipt.results) {
    providerOutput.info(
      `- [${result.status}] ${result.operation.resourceType}.${result.operation.resourceKey}.${result.operation.check}: ${result.message}`,
    );
  }
  providerOutput.info(`Receipt: ${report.artifact.relativePath}`);
}

export async function awsDomainsApply(options: AwsDomainsApplyOptions): Promise<number> {
  try {
    const report = await runAwsDomainsApply(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanApply(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS domains apply error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
