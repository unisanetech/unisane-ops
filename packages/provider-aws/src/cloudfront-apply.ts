import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ACMClient,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  type CertificateSummary,
} from '@aws-sdk/client-acm';
import {
  CloudFrontClient,
  CreateCachePolicyCommand,
  CreateDistributionCommand,
  CreateOriginAccessControlCommand,
  GetDistributionConfigCommand,
  ListCachePoliciesCommand,
  ListOriginAccessControlsCommand,
  type CachePolicySummary,
  UpdateDistributionCommand,
  type DistributionConfig,
  type LoggingConfig,
  type OriginAccessControlSummary,
} from '@aws-sdk/client-cloudfront';
import { GetBucketPolicyCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { providerOutput } from './cli-output.js';
import { awsSafeArtifactStamp, writeAwsJsonArtifact } from './artifacts.js';
import {
  desiredCloudFrontAccessLogging,
  desiredCloudFrontCachePolicyName,
  desiredCloudFrontCachePolicyTtl,
  desiredCloudFrontOacName,
  desiredCloudFrontOriginDomain,
} from './cloudfront-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import { withAwsOperationLock } from './lock.js';
import type {
  AwsCloudFrontApplyExecutor,
  AwsCloudFrontApplyOperationResult,
  AwsCloudFrontApplyOptions,
  AwsCloudFrontApplyReceipt,
  AwsCloudFrontApplyReport,
  AwsCloudFrontPlanOperation,
  AwsCloudFrontPlanReport,
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsCertificateConfig,
  AwsOpsCdnConfig,
} from './types.js';

const RECEIPT_KIND = 'unisane.aws.cloudfront-apply-receipt' as const;
const MAX_PRODUCTION_PLAN_AGE_MS = 24 * 60 * 60 * 1000;

function ensureInsideCwd(cwd: string, candidate: string): string {
  const resolved = path.resolve(cwd, candidate);
  const normalizedCwd = path.resolve(cwd);
  const prefix = normalizedCwd.endsWith(path.sep) ? normalizedCwd : `${normalizedCwd}${path.sep}`;
  if (resolved !== normalizedCwd && !resolved.startsWith(prefix)) {
    throw new Error(
      `[AWS_PLAN_PATH_OUTSIDE_CWD] CloudFront apply plan must stay inside cwd: ${candidate}`,
    );
  }
  return resolved;
}

function readPlan(
  cwd: string,
  planPath: string,
): { planPath: string; plan: AwsCloudFrontPlanReport } {
  const resolved = ensureInsideCwd(cwd, planPath);
  return {
    planPath: resolved,
    plan: JSON.parse(readFileSync(resolved, 'utf8')) as AwsCloudFrontPlanReport,
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

function desiredBoolean(value: unknown, code: string): boolean {
  if (typeof value !== 'boolean') throw new Error(code);
  return value;
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const named = error as { name?: unknown; Code?: unknown; code?: unknown };
    const code = named.name ?? named.Code ?? named.code;
    if (typeof code === 'string' && code.trim()) return code;
  }
  return 'UnknownError';
}

function assertSupportedOperation(operation: AwsCloudFrontPlanOperation): void {
  if (operation.action === 'no-op') return;
  if (operation.action === 'blocked') {
    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_BLOCKED_PLAN] Plan contains blocked operation '${operation.cdnKey}.${operation.check}'.`,
    );
  }
  if (operation.action === 'create' && operation.check === 'distribution.exists') return;
  if (
    operation.action === 'update' &&
    [
      'origin-domain',
      'origin-access-control',
      'aliases',
      'viewer-protocol-policy',
      'viewer-certificate',
      'cache-policy',
      'access-logging',
      's3-oac-bucket-policy',
    ].includes(operation.check)
  ) {
    return;
  }
  throw new Error(
    `[AWS_CLOUDFRONT_APPLY_UNSUPPORTED_OPERATION] CloudFront apply cannot safely execute '${operation.action}:${operation.check}'.`,
  );
}

function validatePlanForApply(args: {
  context: AwsCommandContext;
  plan: AwsCloudFrontPlanReport;
  options: AwsCloudFrontApplyOptions;
}): void {
  if (!args.options.yes) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_REQUIRES_YES] CloudFront apply requires --yes after reviewing the plan.',
    );
  }
  if (args.options.accountConfirm !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_ACCOUNT_CONFIRM_REQUIRED] Expected --account-confirm ${args.context.account.expectedAccountId}.`,
    );
  }
  if (args.plan.environment !== args.context.environment) {
    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_ENVIRONMENT_MISMATCH] Plan environment '${args.plan.environment}' does not match selected environment '${args.context.environment}'.`,
    );
  }
  if (args.plan.account.expectedAccountId !== args.context.account.expectedAccountId) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_ACCOUNT_MISMATCH] Plan account does not match active account.',
    );
  }
  if (!args.plan.ok || args.plan.summary.blocked > 0) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_BLOCKED_PLAN] Refusing to apply a blocked or failed CloudFront plan.',
    );
  }
  for (const operation of args.plan.operations) {
    assertSupportedOperation(operation);
  }
  if (args.context.account.production) {
    const expected = `${args.context.environment}:${args.context.account.expectedAccountId}:cloudfront-apply`;
    if (args.options.productionConfirm !== expected) {
      throw new Error(
        `[AWS_CLOUDFRONT_APPLY_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${expected}.`,
      );
    }
    const createdAt = Date.parse(args.plan.generatedAt);
    if (
      !args.options.force &&
      Number.isFinite(createdAt) &&
      Date.now() - createdAt > MAX_PRODUCTION_PLAN_AGE_MS
    ) {
      throw new Error(
        '[AWS_CLOUDFRONT_APPLY_STALE_PRODUCTION_PLAN] Production CloudFront plan is older than 24 hours.',
      );
    }
  }
}

function cloudFrontClient(context: AwsCommandContext): CloudFrontClient {
  return new CloudFrontClient({
    region: 'us-east-1',
    ...(context.account.profile
      ? { credentials: fromIni({ profile: context.account.profile }) }
      : {}),
  });
}

function acmClient(context: AwsCommandContext, region: string): ACMClient {
  return new ACMClient({
    region,
    ...(context.account.profile
      ? { credentials: fromIni({ profile: context.account.profile }) }
      : {}),
  });
}

function s3Client(context: AwsCommandContext): S3Client {
  return new S3Client({
    region: context.account.region,
    ...(context.account.profile
      ? { credentials: fromIni({ profile: context.account.profile }) }
      : {}),
  });
}

function configuredCdn(context: AwsCommandContext, cdnKey: string): AwsOpsCdnConfig {
  const cdn = context.config.cdn?.[cdnKey];
  if (!cdn || cdn.environment !== context.environment) {
    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_UNKNOWN_CDN] Unknown CDN '${cdnKey}' for environment '${context.environment}'.`,
    );
  }
  return cdn;
}

function configuredBucketName(context: AwsCommandContext, cdn: AwsOpsCdnConfig): string {
  const bucket = context.config.buckets?.[cdn.originBucket];
  if (!bucket?.name || bucket.environment !== context.environment) {
    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_UNKNOWN_BUCKET] Unknown origin bucket '${cdn.originBucket}'.`,
    );
  }
  return bucket.name;
}

function configuredCertificate(
  context: AwsCommandContext,
  cdn: AwsOpsCdnConfig,
): AwsOpsCertificateConfig {
  if (!cdn.certificate) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_CERTIFICATE_CONFIG] CDN aliases require cdn.<key>.certificate.',
    );
  }
  const certificate = context.config.certificates?.[cdn.certificate];
  if (!certificate || certificate.environment !== context.environment) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_UNKNOWN_CERTIFICATE] Configured CDN certificate is not available for this environment.',
    );
  }
  return certificate;
}

function certificateRegion(
  context: AwsCommandContext,
  certificate: AwsOpsCertificateConfig,
): string {
  if (certificate.region) return certificate.region;
  return certificate.usage === 'cloudfront' ? 'us-east-1' : context.account.region;
}

async function resolveIssuedCertificateArn(args: {
  context: AwsCommandContext;
  cdn: AwsOpsCdnConfig;
}): Promise<string> {
  const certificate = configuredCertificate(args.context, args.cdn);
  const region = certificateRegion(args.context, certificate);
  if (region !== 'us-east-1') {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_CERTIFICATE_REGION] CloudFront certificates must be in us-east-1.',
    );
  }
  const client = acmClient(args.context, region);
  const summaries: CertificateSummary[] = [];
  let nextToken: string | undefined;
  do {
    const response = await client.send(new ListCertificatesCommand({ NextToken: nextToken }));
    summaries.push(...(response.CertificateSummaryList ?? []));
    nextToken = response.NextToken;
  } while (nextToken);
  const summary = summaries.find((entry) => entry.DomainName === certificate.domainName);
  if (!summary?.CertificateArn) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_CERTIFICATE_NOT_FOUND] Configured ACM certificate was not found.',
    );
  }
  const detail = await client.send(
    new DescribeCertificateCommand({ CertificateArn: summary.CertificateArn }),
  );
  if (detail.Certificate?.Status !== 'ISSUED') {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_CERTIFICATE_NOT_ISSUED] Configured ACM certificate is not issued.',
    );
  }
  return summary.CertificateArn;
}

async function ensureOriginAccessControl(args: {
  client: CloudFrontClient;
  name: string;
}): Promise<{ id: string; name: string }> {
  const matches: OriginAccessControlSummary[] = [];
  let marker: string | undefined;
  do {
    const response = await args.client.send(
      new ListOriginAccessControlsCommand({ Marker: marker }),
    );
    matches.push(...(response.OriginAccessControlList?.Items ?? []));
    marker = response.OriginAccessControlList?.IsTruncated
      ? response.OriginAccessControlList.NextMarker
      : undefined;
  } while (marker);

  const current = matches.find((entry) => entry.Name === args.name);
  if (current?.Id) return { id: current.Id, name: current.Name ?? args.name };

  const created = await args.client.send(
    new CreateOriginAccessControlCommand({
      OriginAccessControlConfig: {
        Name: args.name,
        Description: 'Managed by Unisane Ops.',
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      },
    }),
  );
  const id = created.OriginAccessControl?.Id;
  if (!id)
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_OAC_CREATE_FAILED] CloudFront did not return an OAC id.',
    );
  return { id, name: args.name };
}

async function ensureCachePolicy(args: {
  client: CloudFrontClient;
  context: AwsCommandContext;
  cdnKey: string;
}): Promise<{ id: string; name: string }> {
  const name = desiredCloudFrontCachePolicyName({
    context: args.context,
    cdnKey: args.cdnKey,
  });
  const matches: CachePolicySummary[] = [];
  let marker: string | undefined;
  do {
    const response = await args.client.send(
      new ListCachePoliciesCommand({ Type: 'custom', Marker: marker }),
    );
    matches.push(...(response.CachePolicyList?.Items ?? []));
    marker = response.CachePolicyList?.NextMarker;
  } while (marker);

  const current = matches.find((entry) => entry.CachePolicy?.CachePolicyConfig?.Name === name);
  if (current?.CachePolicy?.Id) return { id: current.CachePolicy.Id, name };

  const ttl = desiredCloudFrontCachePolicyTtl(args.context);
  const created = await args.client.send(
    new CreateCachePolicyCommand({
      CachePolicyConfig: {
        Name: name,
        Comment: 'Managed by Unisane Ops for immutable versioned public assets.',
        MinTTL: 0,
        DefaultTTL: ttl,
        MaxTTL: ttl,
        ParametersInCacheKeyAndForwardedToOrigin: {
          EnableAcceptEncodingBrotli: true,
          EnableAcceptEncodingGzip: true,
          HeadersConfig: {
            HeaderBehavior: 'none',
          },
          CookiesConfig: {
            CookieBehavior: 'none',
          },
          QueryStringsConfig: {
            QueryStringBehavior: 'none',
          },
        },
      },
    }),
  );
  const id = created.CachePolicy?.Id;
  if (!id) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_CACHE_POLICY_CREATE_FAILED] CloudFront did not return a cache policy id.',
    );
  }
  return { id, name };
}

function distributionConfigForCreate(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  originAccessControlId: string;
  cachePolicyId: string;
  viewerCertificateArn: string | null;
}): DistributionConfig {
  const originDomainName = desiredCloudFrontOriginDomain({ context: args.context, cdn: args.cdn });
  if (!originDomainName) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_ORIGIN_DOMAIN] CloudFront origin bucket is not configured.',
    );
  }
  const aliases = args.cdn.aliases ?? [];
  const originId = `${args.cdnKey}-s3-origin`;
  const accessLogging = desiredCloudFrontAccessLogging({
    context: args.context,
    cdnKey: args.cdnKey,
    cdn: args.cdn,
  });
  const viewerCertificate =
    aliases.length > 0
      ? {
          ACMCertificateArn: args.viewerCertificateArn ?? undefined,
          SSLSupportMethod: 'sni-only' as const,
          MinimumProtocolVersion: 'TLSv1.2_2021' as const,
        }
      : {
          CloudFrontDefaultCertificate: true,
        };
  if (aliases.length > 0 && !args.viewerCertificateArn) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_VIEWER_CERTIFICATE] CloudFront aliases require an issued ACM certificate.',
    );
  }

  return {
    CallerReference: `unisane-${args.context.environment}-${args.cdnKey}-${Date.now()}`,
    Comment: `Unisane ${args.context.environment} ${args.cdnKey} public asset CDN.`,
    Enabled: true,
    PriceClass: 'PriceClass_100',
    HttpVersion: 'http2',
    IsIPV6Enabled: true,
    Aliases: {
      Quantity: aliases.length,
      ...(aliases.length > 0 ? { Items: aliases } : {}),
    },
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: originId,
          DomainName: originDomainName,
          OriginAccessControlId: args.originAccessControlId,
          S3OriginConfig: { OriginAccessIdentity: '' },
        },
      ],
    },
    DefaultCacheBehavior: {
      TargetOriginId: originId,
      ViewerProtocolPolicy: 'redirect-to-https',
      AllowedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD'],
        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
      },
      CachePolicyId: args.cachePolicyId,
      Compress: true,
    },
    ...(accessLogging
      ? {
          Logging: {
            Enabled: true,
            IncludeCookies: accessLogging.includeCookies,
            Bucket: accessLogging.bucket ?? '',
            Prefix: accessLogging.prefix,
          },
        }
      : {}),
    ViewerCertificate: viewerCertificate,
    Restrictions: {
      GeoRestriction: {
        RestrictionType: 'none',
        Quantity: 0,
      },
    },
  };
}

function accessLoggingConfigFromDesired(desiredValue: unknown): LoggingConfig {
  const desired = desiredObject(desiredValue, '[AWS_CLOUDFRONT_APPLY_INVALID_ACCESS_LOGGING]');
  return {
    Enabled: desiredBoolean(
      desired.enabled,
      '[AWS_CLOUDFRONT_APPLY_INVALID_ACCESS_LOGGING_ENABLED]',
    ),
    IncludeCookies: desiredBoolean(
      desired.includeCookies,
      '[AWS_CLOUDFRONT_APPLY_INVALID_ACCESS_LOGGING_COOKIES]',
    ),
    Bucket: desiredString(desired.bucket, '[AWS_CLOUDFRONT_APPLY_INVALID_ACCESS_LOGGING_BUCKET]'),
    Prefix:
      typeof desired.prefix === 'string'
        ? desired.prefix
        : desiredString(desired.prefix, '[AWS_CLOUDFRONT_APPLY_INVALID_ACCESS_LOGGING_PREFIX]'),
  };
}

function firstOrigin(config: DistributionConfig) {
  const origin = config.Origins?.Items?.[0];
  if (!origin)
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_ORIGIN] CloudFront distribution has no origin to update.',
    );
  return origin;
}

function defaultCacheBehavior(config: DistributionConfig) {
  if (!config.DefaultCacheBehavior) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_DEFAULT_CACHE_BEHAVIOR] CloudFront distribution has no default cache behavior.',
    );
  }
  return config.DefaultCacheBehavior;
}

async function updateDistribution(args: {
  context: AwsCommandContext;
  operation: AwsCloudFrontPlanOperation;
  mutate: (config: DistributionConfig, client: CloudFrontClient) => Promise<void> | void;
}): Promise<void> {
  if (!args.operation.distributionId) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_MISSING_DISTRIBUTION_ID] Update operation is missing distribution id.',
    );
  }
  const client = cloudFrontClient(args.context);
  const response = await client.send(
    new GetDistributionConfigCommand({ Id: args.operation.distributionId }),
  );
  if (!response.DistributionConfig || !response.ETag) {
    throw new Error(
      '[AWS_CLOUDFRONT_APPLY_CONFIG_READ_FAILED] CloudFront did not return distribution config and ETag.',
    );
  }
  await args.mutate(response.DistributionConfig, client);
  await client.send(
    new UpdateDistributionCommand({
      Id: args.operation.distributionId,
      IfMatch: response.ETag,
      DistributionConfig: response.DistributionConfig,
    }),
  );
}

function bucketPolicyResources(bucketName: string, publicPrefixes: string[]): string[] {
  return publicPrefixes.length > 0
    ? publicPrefixes.map((prefix) => `arn:aws:s3:::${bucketName}/${prefix.replace(/^\/+/, '')}*`)
    : [`arn:aws:s3:::${bucketName}/*`];
}

function managedStatementSid(cdnKey: string): string {
  return `UnisaneCloudFrontOAC${cdnKey.replace(/[^a-zA-Z0-9]+/g, '')}`;
}

async function putBucketPolicyForDistribution(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  distributionId: string;
}): Promise<void> {
  const bucketName = configuredBucketName(args.context, args.cdn);
  const client = s3Client(args.context);
  let policy: Record<string, unknown> = {
    Version: '2012-10-17',
    Statement: [],
  };

  try {
    const response = await client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
    if (response.Policy) policy = JSON.parse(response.Policy) as Record<string, unknown>;
  } catch (error) {
    if (
      !['NoSuchBucketPolicy', 'NoSuchBucketPolicyException', 'NotFound'].includes(errorCode(error))
    ) {
      throw error;
    }
  }

  const statements = Array.isArray(policy.Statement)
    ? policy.Statement
    : policy.Statement
      ? [policy.Statement]
      : [];
  const sid = managedStatementSid(args.cdnKey);
  const distributionArn = `arn:aws:cloudfront::${args.context.account.expectedAccountId}:distribution/${args.distributionId}`;
  const nextStatements = statements.filter((statement) => {
    return !isRecord(statement) || statement.Sid !== sid;
  });
  nextStatements.push({
    Sid: sid,
    Effect: 'Allow',
    Principal: { Service: 'cloudfront.amazonaws.com' },
    Action: 's3:GetObject',
    Resource: bucketPolicyResources(bucketName, args.cdn.publicPrefixes ?? []),
    Condition: {
      StringEquals: {
        'AWS:SourceArn': distributionArn,
      },
    },
  });

  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(
        {
          ...policy,
          Version: typeof policy.Version === 'string' ? policy.Version : '2012-10-17',
          Statement: nextStatements,
        },
        null,
        2,
      ),
    }),
  );
}

export class SdkAwsCloudFrontApplyExecutor implements AwsCloudFrontApplyExecutor {
  private readonly createdDistributionIds = new Map<string, string>();

  async applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsCloudFrontPlanOperation;
  }): Promise<AwsCloudFrontApplyOperationResult> {
    const operation = args.operation;
    if (operation.action === 'no-op') {
      return { operation, status: 'skipped', message: 'No change required.' };
    }

    const cdn = configuredCdn(args.context, operation.cdnKey);

    if (operation.action === 'create' && operation.check === 'distribution.exists') {
      const client = cloudFrontClient(args.context);
      const oac = await ensureOriginAccessControl({
        client,
        name: desiredCloudFrontOacName({ context: args.context, cdnKey: operation.cdnKey }),
      });
      const cachePolicy = await ensureCachePolicy({
        client,
        context: args.context,
        cdnKey: operation.cdnKey,
      });
      const viewerCertificateArn =
        (cdn.aliases ?? []).length > 0
          ? await resolveIssuedCertificateArn({ context: args.context, cdn })
          : null;
      const response = await client.send(
        new CreateDistributionCommand({
          DistributionConfig: distributionConfigForCreate({
            context: args.context,
            cdnKey: operation.cdnKey,
            cdn,
            originAccessControlId: oac.id,
            cachePolicyId: cachePolicy.id,
            viewerCertificateArn,
          }),
        }),
      );
      const distributionId = response.Distribution?.Id;
      if (!distributionId) {
        throw new Error(
          '[AWS_CLOUDFRONT_APPLY_CREATE_FAILED] CloudFront did not return distribution id.',
        );
      }
      this.createdDistributionIds.set(operation.cdnKey, distributionId);
      await putBucketPolicyForDistribution({
        context: args.context,
        cdnKey: operation.cdnKey,
        cdn,
        distributionId,
      });
      return {
        operation,
        status: 'succeeded',
        message: `Distribution created: ${distributionId}.`,
      };
    }

    if (operation.check === 'origin-domain') {
      const domainName = desiredString(
        operation.desired,
        '[AWS_CLOUDFRONT_APPLY_INVALID_ORIGIN_DOMAIN]',
      );
      await updateDistribution({
        context: args.context,
        operation,
        mutate: (config) => {
          firstOrigin(config).DomainName = domainName;
        },
      });
      return { operation, status: 'succeeded', message: 'Origin domain updated.' };
    }

    if (operation.check === 'origin-access-control') {
      const desired = desiredObject(operation.desired, '[AWS_CLOUDFRONT_APPLY_INVALID_OAC]');
      const name = desiredString(desired.name, '[AWS_CLOUDFRONT_APPLY_INVALID_OAC_NAME]');
      await updateDistribution({
        context: args.context,
        operation,
        mutate: async (config, client) => {
          const oac = await ensureOriginAccessControl({ client, name });
          const origin = firstOrigin(config);
          origin.OriginAccessControlId = oac.id;
          origin.S3OriginConfig = { OriginAccessIdentity: '' };
        },
      });
      if (operation.distributionId) {
        await putBucketPolicyForDistribution({
          context: args.context,
          cdnKey: operation.cdnKey,
          cdn,
          distributionId: operation.distributionId,
        });
      }
      return { operation, status: 'succeeded', message: 'Origin Access Control attached.' };
    }

    if (operation.check === 'aliases') {
      const aliases = desiredStringArray(
        operation.desired,
        '[AWS_CLOUDFRONT_APPLY_INVALID_ALIASES]',
      );
      await updateDistribution({
        context: args.context,
        operation,
        mutate: (config) => {
          config.Aliases = {
            Quantity: aliases.length,
            ...(aliases.length > 0 ? { Items: aliases } : {}),
          };
        },
      });
      return { operation, status: 'succeeded', message: 'Aliases updated.' };
    }

    if (operation.check === 'viewer-protocol-policy') {
      if (operation.desired !== 'redirect-to-https') {
        throw new Error(
          '[AWS_CLOUDFRONT_APPLY_UNSUPPORTED_VIEWER_POLICY] Only redirect-to-https is supported.',
        );
      }
      await updateDistribution({
        context: args.context,
        operation,
        mutate: (config) => {
          defaultCacheBehavior(config).ViewerProtocolPolicy = 'redirect-to-https';
        },
      });
      return { operation, status: 'succeeded', message: 'Viewer protocol policy updated.' };
    }

    if (operation.check === 'viewer-certificate') {
      await updateDistribution({
        context: args.context,
        operation,
        mutate: async (config) => {
          const certificateArn = await resolveIssuedCertificateArn({ context: args.context, cdn });
          config.ViewerCertificate = {
            ACMCertificateArn: certificateArn,
            SSLSupportMethod: 'sni-only',
            MinimumProtocolVersion: 'TLSv1.2_2021',
          };
        },
      });
      return { operation, status: 'succeeded', message: 'Viewer ACM certificate attached.' };
    }

    if (operation.check === 'cache-policy') {
      await updateDistribution({
        context: args.context,
        operation,
        mutate: async (config, client) => {
          const cachePolicy = await ensureCachePolicy({
            client,
            context: args.context,
            cdnKey: operation.cdnKey,
          });
          defaultCacheBehavior(config).CachePolicyId = cachePolicy.id;
          defaultCacheBehavior(config).Compress = true;
        },
      });
      return { operation, status: 'succeeded', message: 'Immutable asset cache policy attached.' };
    }

    if (operation.check === 'access-logging') {
      const logging = accessLoggingConfigFromDesired(operation.desired);
      await updateDistribution({
        context: args.context,
        operation,
        mutate: (config) => {
          config.Logging = logging;
        },
      });
      return { operation, status: 'succeeded', message: 'CloudFront access logging enabled.' };
    }

    if (operation.check === 's3-oac-bucket-policy') {
      const distributionId =
        operation.distributionId ?? this.createdDistributionIds.get(operation.cdnKey);
      if (!distributionId) {
        throw new Error(
          '[AWS_CLOUDFRONT_APPLY_MISSING_POLICY_DISTRIBUTION_ID] Bucket policy operation has no distribution id.',
        );
      }
      await putBucketPolicyForDistribution({
        context: args.context,
        cdnKey: operation.cdnKey,
        cdn,
        distributionId,
      });
      return { operation, status: 'succeeded', message: 'S3 OAC bucket policy attached.' };
    }

    throw new Error(
      `[AWS_CLOUDFRONT_APPLY_UNSUPPORTED_OPERATION] CloudFront apply cannot execute '${operation.action}:${operation.check}'.`,
    );
  }
}

async function applyOperations(args: {
  context: AwsCommandContext;
  plan: AwsCloudFrontPlanReport;
  executor: AwsCloudFrontApplyExecutor;
}): Promise<AwsCloudFrontApplyOperationResult[]> {
  const results: AwsCloudFrontApplyOperationResult[] = [];
  for (const operation of args.plan.operations) {
    try {
      results.push(await args.executor.applyOperation({ context: args.context, operation }));
    } catch (error) {
      results.push({
        operation,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown CloudFront apply error.',
      });
      break;
    }
  }
  return results;
}

export async function runAwsCloudFrontApply(
  options: AwsCloudFrontApplyOptions,
  deps?: {
    identityReader?: AwsIdentityReader;
    executor?: AwsCloudFrontApplyExecutor;
    now?: () => Date;
  },
): Promise<AwsCloudFrontApplyReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const { planPath, plan } = readPlan(context.cwd, options.planPath);
  validatePlanForApply({ context, plan, options });
  const executor = deps?.executor ?? new SdkAwsCloudFrontApplyExecutor();
  const now = deps?.now ?? (() => new Date());
  const appliedAt = now();

  return await withAwsOperationLock({
    cwd: context.cwd,
    environment: context.environment,
    family: 'cloudfront-apply',
    run: async (lockPath) => {
      const results = await applyOperations({ context, plan, executor });
      const receipt: AwsCloudFrontApplyReceipt = {
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
        defaultRelativePath: `.unisane/aws/${context.environment}/receipts/cloudfront-apply-${awsSafeArtifactStamp(appliedAt)}.json`,
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

function printHumanApply(report: AwsCloudFrontApplyReport): void {
  providerOutput.info(`AWS CloudFront apply: ${report.receipt.environment}`);
  for (const result of report.receipt.results) {
    providerOutput.info(
      `- [${result.status}] ${result.operation.cdnKey}.${result.operation.check}: ${result.message}`,
    );
  }
  providerOutput.info(`Receipt: ${report.artifact.relativePath}`);
}

export async function awsCloudFrontApply(options: AwsCloudFrontApplyOptions): Promise<number> {
  try {
    const report = await runAwsCloudFrontApply(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanApply(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS CloudFront apply error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
