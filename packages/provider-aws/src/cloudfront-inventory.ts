import {
  ACMClient,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  type CertificateSummary,
} from '@aws-sdk/client-acm';
import {
  CloudFrontClient,
  GetDistributionConfigCommand,
  ListCachePoliciesCommand,
  ListDistributionsCommand,
  ListOriginAccessControlsCommand,
  type CachePolicySummary,
  type DistributionConfig,
  type DistributionSummary,
  type OriginAccessControlSummary,
} from '@aws-sdk/client-cloudfront';
import { GetBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { log } from '@unisane/cli-core';
import { writeAwsJsonArtifact } from './artifacts.js';
import { resolveAwsCommandContext } from './context.js';
import type {
  AwsCloudFrontDistributionInventory,
  AwsCloudFrontInventoryOptions,
  AwsCloudFrontInventoryReader,
  AwsCloudFrontInventoryReport,
  AwsCloudFrontCachePolicyInventory,
  AwsCloudFrontOriginAccessControlInventory,
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsCertificateConfig,
  AwsOpsCdnConfig,
} from './types.js';

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
  return 'Unknown AWS CloudFront error.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function configuredCloudFrontForEnvironment(
  context: AwsCommandContext,
): Array<[string, AwsOpsCdnConfig]> {
  return Object.entries(context.config.cdn ?? {}).filter(
    ([, cdn]) => cdn.environment === context.environment,
  );
}

export function desiredCloudFrontOriginDomain(args: {
  context: AwsCommandContext;
  cdn: AwsOpsCdnConfig;
}): string | null {
  const bucket = args.context.config.buckets?.[args.cdn.originBucket];
  if (!bucket) return null;
  return `${bucket.name}.s3.${args.context.account.region}.amazonaws.com`;
}

export function desiredCloudFrontOacName(args: {
  context: AwsCommandContext;
  cdnKey: string;
}): string {
  return `unisane-${args.context.environment}-${args.cdnKey}-s3-oac`;
}

export function desiredCloudFrontCachePolicyName(args: {
  context: AwsCommandContext;
  cdnKey: string;
}): string {
  return `unisane-${args.context.environment}-${args.cdnKey}-immutable-assets-cache`;
}

export function desiredCloudFrontCachePolicyTtl(context: AwsCommandContext): number {
  return context.config.defaults?.publicAssetCache?.defaultMaxAgeSeconds ?? 31_536_000;
}

export function desiredCloudFrontAccessLogBucket(args: {
  context: AwsCommandContext;
  cdn: AwsOpsCdnConfig;
}): string | null {
  if (!args.cdn.accessLogs) return null;
  const bucket = args.context.config.buckets?.[args.cdn.accessLogs.bucket];
  if (!bucket) return null;
  return `${bucket.name}.s3.amazonaws.com`;
}

export function desiredCloudFrontAccessLogPrefix(args: {
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
}): string {
  if (args.cdn.accessLogs?.prefix !== undefined) return args.cdn.accessLogs.prefix;
  return `cloudfront/${args.cdnKey}/`;
}

export function desiredCloudFrontAccessLogging(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
}): {
  enabled: true;
  bucketKey: string;
  bucket: string | null;
  prefix: string;
  includeCookies: boolean;
} | null {
  if (!args.cdn.accessLogs) return null;
  return {
    enabled: true,
    bucketKey: args.cdn.accessLogs.bucket,
    bucket: desiredCloudFrontAccessLogBucket({ context: args.context, cdn: args.cdn }),
    prefix: desiredCloudFrontAccessLogPrefix({ cdnKey: args.cdnKey, cdn: args.cdn }),
    includeCookies: args.cdn.accessLogs.includeCookies ?? false,
  };
}

function certificateRegion(
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

function acmClient(context: AwsCommandContext, region: string): ACMClient {
  return new ACMClient({
    region,
    ...credentials(context),
  });
}

function s3Client(context: AwsCommandContext): S3Client {
  return new S3Client({
    region: context.account.region,
    ...credentials(context),
  });
}

async function resolveDesiredCertificate(args: {
  context: AwsCommandContext;
  cdn: AwsOpsCdnConfig;
}): Promise<{ key: string | null; arn: string | null; status: string | null }> {
  if (!args.cdn.certificate) return { key: null, arn: null, status: null };
  const certificate = args.context.config.certificates?.[args.cdn.certificate];
  if (!certificate) return { key: args.cdn.certificate, arn: null, status: null };
  const region = certificateRegion(args.context, certificate);
  const client = acmClient(args.context, region);
  const summaries: CertificateSummary[] = [];
  let nextToken: string | undefined;
  try {
    do {
      const response = await client.send(new ListCertificatesCommand({ NextToken: nextToken }));
      summaries.push(...(response.CertificateSummaryList ?? []));
      nextToken = response.NextToken;
    } while (nextToken);

    const summary = summaries.find((entry) => entry.DomainName === certificate.domainName);
    if (!summary?.CertificateArn) return { key: args.cdn.certificate, arn: null, status: null };
    const detail = await client.send(
      new DescribeCertificateCommand({ CertificateArn: summary.CertificateArn }),
    );
    return {
      key: args.cdn.certificate,
      arn: summary.CertificateArn,
      status: detail.Certificate?.Status ?? null,
    };
  } catch {
    return { key: args.cdn.certificate, arn: null, status: null };
  }
}

function aliases(distribution: DistributionSummary): string[] {
  return distribution.Aliases?.Items?.filter((alias): alias is string => Boolean(alias)) ?? [];
}

type DistributionOrigin = NonNullable<NonNullable<DistributionSummary['Origins']>['Items']>[number];

function origins(distribution: DistributionSummary): DistributionOrigin[] {
  return (distribution.Origins?.Items ?? []).filter(
    (origin): origin is DistributionOrigin => origin !== undefined,
  );
}

function firstOrigin(distribution: DistributionSummary): DistributionOrigin | null {
  return origins(distribution)[0] ?? null;
}

function bucketPolicyResources(bucketName: string, publicPrefixes: string[]): string[] {
  return publicPrefixes.length > 0
    ? publicPrefixes.map((prefix) => `arn:aws:s3:::${bucketName}/${prefix.replace(/^\/+/, '')}*`)
    : [`arn:aws:s3:::${bucketName}/*`];
}

function managedStatementSid(cdnKey: string): string {
  return `UnisaneCloudFrontOAC${cdnKey.replace(/[^a-zA-Z0-9]+/g, '')}`;
}

function arrayValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function stringSet(value: unknown): Set<string> {
  return new Set(arrayValue(value).filter((entry): entry is string => typeof entry === 'string'));
}

function statementAllowsCloudFrontDistribution(args: {
  statement: unknown;
  sid: string;
  distributionArn: string;
  resources: string[];
}): boolean {
  if (!isRecord(args.statement)) return false;
  const condition = isRecord(args.statement.Condition) ? args.statement.Condition : {};
  const stringEquals = isRecord(condition.StringEquals) ? condition.StringEquals : {};
  const principal = isRecord(args.statement.Principal) ? args.statement.Principal : {};
  const resources = stringSet(args.statement.Resource);
  return (
    args.statement.Sid === args.sid &&
    args.statement.Effect === 'Allow' &&
    stringSet(args.statement.Action).has('s3:GetObject') &&
    stringSet(principal.Service).has('cloudfront.amazonaws.com') &&
    stringEquals['AWS:SourceArn'] === args.distributionArn &&
    args.resources.every((resource) => resources.has(resource))
  );
}

async function readBucketPolicyAllowsDistribution(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  distributionId: string | null;
}): Promise<boolean | null> {
  const bucket = args.context.config.buckets?.[args.cdn.originBucket];
  if (!bucket?.name || !args.distributionId) return null;
  try {
    const response = await s3Client(args.context).send(
      new GetBucketPolicyCommand({ Bucket: bucket.name }),
    );
    if (!response.Policy) return false;
    const policy = JSON.parse(response.Policy) as unknown;
    if (!isRecord(policy)) return false;
    const sid = managedStatementSid(args.cdnKey);
    const distributionArn = `arn:aws:cloudfront::${args.context.account.expectedAccountId}:distribution/${args.distributionId}`;
    const resources = bucketPolicyResources(bucket.name, args.cdn.publicPrefixes ?? []);
    return arrayValue(policy.Statement).some((statement) =>
      statementAllowsCloudFrontDistribution({ statement, sid, distributionArn, resources }),
    );
  } catch (error) {
    if (
      ['NoSuchBucketPolicy', 'NoSuchBucketPolicyException', 'NotFound'].includes(errorCode(error))
    ) {
      return false;
    }
    return null;
  }
}

function findDistribution(args: {
  cdn: AwsOpsCdnConfig;
  desiredOriginDomainName: string | null;
  distributions: DistributionSummary[];
}): { distribution: DistributionSummary | null; matchedBy: 'alias' | 'origin' | 'none' } {
  const desiredAliases = new Set(args.cdn.aliases ?? []);
  if (desiredAliases.size > 0) {
    const aliasMatch = args.distributions.find((distribution) =>
      aliases(distribution).some((alias) => desiredAliases.has(alias)),
    );
    if (aliasMatch) return { distribution: aliasMatch, matchedBy: 'alias' };
  }

  if (args.desiredOriginDomainName) {
    const originMatch = args.distributions.find((distribution) =>
      origins(distribution).some((origin) => origin.DomainName === args.desiredOriginDomainName),
    );
    if (originMatch) return { distribution: originMatch, matchedBy: 'origin' };
  }

  return { distribution: null, matchedBy: 'none' };
}

function normalizeOac(
  summary: OriginAccessControlSummary,
): AwsCloudFrontOriginAccessControlInventory {
  return {
    id: summary.Id ?? '',
    name: summary.Name ?? '',
    originType: summary.OriginAccessControlOriginType ?? null,
    signingBehavior: summary.SigningBehavior ?? null,
    signingProtocol: summary.SigningProtocol ?? null,
  };
}

function normalizeCachePolicy(
  summary: CachePolicySummary,
): AwsCloudFrontCachePolicyInventory | null {
  const policy = summary.CachePolicy;
  const config = policy?.CachePolicyConfig;
  if (!policy?.Id || !config?.Name) return null;
  return {
    id: policy.Id,
    name: config.Name,
    comment: config.Comment ?? null,
    defaultTtl: config.DefaultTTL ?? null,
    maxTtl: config.MaxTTL ?? null,
    minTtl: config.MinTTL ?? null,
  };
}

function createInventoryItem(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  distributions: DistributionSummary[];
  distributionConfigs?: Map<string, DistributionConfig>;
  oacs: AwsCloudFrontOriginAccessControlInventory[];
  cachePolicies: AwsCloudFrontCachePolicyInventory[];
  desiredCertificate?: { key: string | null; arn: string | null; status: string | null };
  s3BucketPolicyAllowsDistribution?: boolean | null;
}): AwsCloudFrontDistributionInventory {
  const bucket = args.context.config.buckets?.[args.cdn.originBucket];
  const desiredOriginDomainName = desiredCloudFrontOriginDomain({
    context: args.context,
    cdn: args.cdn,
  });
  const desiredOriginAccessControlName = desiredCloudFrontOacName({
    context: args.context,
    cdnKey: args.cdnKey,
  });
  const desiredCachePolicyName = desiredCloudFrontCachePolicyName({
    context: args.context,
    cdnKey: args.cdnKey,
  });
  const matched = findDistribution({
    cdn: args.cdn,
    desiredOriginDomainName,
    distributions: args.distributions,
  });
  const origin = matched.distribution ? firstOrigin(matched.distribution) : null;
  const oac =
    args.oacs.find((entry) => entry.id === origin?.OriginAccessControlId) ??
    args.oacs.find((entry) => entry.name === desiredOriginAccessControlName) ??
    null;
  const cachePolicyId = matched.distribution?.DefaultCacheBehavior?.CachePolicyId ?? null;
  const cachePolicy = args.cachePolicies.find((entry) => entry.id === cachePolicyId) ?? null;
  const viewerCertificate = matched.distribution?.ViewerCertificate;
  const distributionConfig = matched.distribution?.Id
    ? args.distributionConfigs?.get(matched.distribution.Id)
    : undefined;
  const logging = distributionConfig?.Logging;
  const desiredCertificate = args.desiredCertificate ?? {
    key: args.cdn.certificate ?? null,
    arn: null,
    status: null,
  };

  return {
    key: args.cdnKey,
    environment: args.cdn.environment,
    originBucketKey: args.cdn.originBucket,
    originBucketName: bucket?.name ?? null,
    distributionId: matched.distribution?.Id ?? null,
    domainName: matched.distribution?.DomainName ?? null,
    enabled: matched.distribution?.Enabled ?? null,
    status: matched.distribution?.Status ?? null,
    aliases: matched.distribution ? aliases(matched.distribution) : [],
    originDomainName: origin?.DomainName ?? null,
    originAccessControlId: origin?.OriginAccessControlId ?? null,
    originAccessControlName: oac?.name ?? null,
    viewerProtocolPolicy: matched.distribution?.DefaultCacheBehavior?.ViewerProtocolPolicy ?? null,
    viewerCertificateArn: viewerCertificate?.ACMCertificateArn ?? null,
    viewerCertificateSource: viewerCertificate?.CertificateSource ?? null,
    minimumProtocolVersion: viewerCertificate?.MinimumProtocolVersion ?? null,
    cachePolicyId,
    cachePolicyName: cachePolicy?.name ?? null,
    accessLoggingEnabled: logging?.Enabled ?? null,
    accessLogBucket: logging?.Bucket ?? null,
    accessLogPrefix: logging?.Prefix ?? null,
    accessLogIncludeCookies: logging?.IncludeCookies ?? null,
    s3BucketPolicyAllowsDistribution: args.s3BucketPolicyAllowsDistribution ?? null,
    matchedBy: matched.matchedBy,
    desiredOriginDomainName,
    desiredOriginAccessControlName,
    desiredCachePolicyName,
    desiredCertificateKey: desiredCertificate.key,
    desiredViewerCertificateArn: desiredCertificate.arn,
    desiredViewerCertificateStatus: desiredCertificate.status,
    errors: [],
  };
}

async function readDistributionConfigs(args: {
  client: CloudFrontClient;
  distributions: DistributionSummary[];
}): Promise<{
  configs: Map<string, DistributionConfig>;
  errors: Map<string, { code: string; message: string }>;
}> {
  const configs = new Map<string, DistributionConfig>();
  const errors = new Map<string, { code: string; message: string }>();
  for (const distribution of args.distributions) {
    if (!distribution.Id) continue;
    try {
      const response = await args.client.send(
        new GetDistributionConfigCommand({ Id: distribution.Id }),
      );
      if (response.DistributionConfig) {
        configs.set(distribution.Id, response.DistributionConfig);
      }
    } catch (error) {
      errors.set(distribution.Id, { code: errorCode(error), message: errorMessage(error) });
    }
  }
  return { configs, errors };
}

function withDistributionConfigError(
  item: AwsCloudFrontDistributionInventory,
  errors: Map<string, { code: string; message: string }>,
): AwsCloudFrontDistributionInventory {
  if (!item.distributionId) return item;
  const error = errors.get(item.distributionId);
  if (!error) return item;
  return { ...item, errors: [...item.errors, error] };
}

export class SdkAwsCloudFrontInventoryReader implements AwsCloudFrontInventoryReader {
  async read(args: { context: AwsCommandContext }): Promise<{
    distributions: AwsCloudFrontDistributionInventory[];
    originAccessControls: AwsCloudFrontOriginAccessControlInventory[];
    cachePolicies: AwsCloudFrontCachePolicyInventory[];
  }> {
    const client = new CloudFrontClient({
      region: 'us-east-1',
      ...credentials(args.context),
    });
    const distributionSummaries: DistributionSummary[] = [];
    let distributionConfigs = new Map<string, DistributionConfig>();
    let distributionConfigErrors = new Map<string, { code: string; message: string }>();
    const oacSummaries: AwsCloudFrontOriginAccessControlInventory[] = [];
    const cachePolicies: AwsCloudFrontCachePolicyInventory[] = [];

    try {
      let marker: string | undefined;
      do {
        const response = await client.send(new ListDistributionsCommand({ Marker: marker }));
        distributionSummaries.push(...(response.DistributionList?.Items ?? []));
        marker = response.DistributionList?.IsTruncated
          ? response.DistributionList.NextMarker
          : undefined;
      } while (marker);
    } catch (error) {
      return {
        distributions: configuredCloudFrontForEnvironment(args.context).map(([cdnKey, cdn]) => ({
          key: cdnKey,
          environment: cdn.environment,
          originBucketKey: cdn.originBucket,
          originBucketName: args.context.config.buckets?.[cdn.originBucket]?.name ?? null,
          distributionId: null,
          domainName: null,
          enabled: null,
          status: null,
          aliases: [],
          originDomainName: null,
          originAccessControlId: null,
          originAccessControlName: null,
          viewerProtocolPolicy: null,
          viewerCertificateArn: null,
          viewerCertificateSource: null,
          minimumProtocolVersion: null,
          cachePolicyId: null,
          cachePolicyName: null,
          accessLoggingEnabled: null,
          accessLogBucket: null,
          accessLogPrefix: null,
          accessLogIncludeCookies: null,
          s3BucketPolicyAllowsDistribution: null,
          matchedBy: 'none',
          desiredOriginDomainName: desiredCloudFrontOriginDomain({ context: args.context, cdn }),
          desiredOriginAccessControlName: desiredCloudFrontOacName({
            context: args.context,
            cdnKey,
          }),
          desiredCachePolicyName: desiredCloudFrontCachePolicyName({
            context: args.context,
            cdnKey,
          }),
          desiredCertificateKey: cdn.certificate ?? null,
          desiredViewerCertificateArn: null,
          desiredViewerCertificateStatus: null,
          errors: [{ code: errorCode(error), message: errorMessage(error) }],
        })),
        originAccessControls: [],
        cachePolicies: [],
      };
    }

    const distributionConfigRead = await readDistributionConfigs({
      client,
      distributions: distributionSummaries,
    });
    distributionConfigs = distributionConfigRead.configs;
    distributionConfigErrors = distributionConfigRead.errors;

    try {
      let marker: string | undefined;
      do {
        const response = await client.send(new ListOriginAccessControlsCommand({ Marker: marker }));
        oacSummaries.push(
          ...(response.OriginAccessControlList?.Items ?? []).map((entry) => normalizeOac(entry)),
        );
        marker = response.OriginAccessControlList?.IsTruncated
          ? response.OriginAccessControlList.NextMarker
          : undefined;
      } while (marker);
    } catch (error) {
      oacSummaries.push({
        id: '',
        name: '',
        originType: null,
        signingBehavior: null,
        signingProtocol: null,
      });
      const message = errorMessage(error);
      return {
        distributions: await Promise.all(
          configuredCloudFrontForEnvironment(args.context).map(async ([cdnKey, cdn]) => {
            const item = withDistributionConfigError(
              createInventoryItem({
                context: args.context,
                cdnKey,
                cdn,
                distributions: distributionSummaries,
                distributionConfigs,
                oacs: [],
                cachePolicies: [],
                desiredCertificate: await resolveDesiredCertificate({
                  context: args.context,
                  cdn,
                }),
              }),
              distributionConfigErrors,
            );
            return {
              ...item,
              errors: [...item.errors, { code: errorCode(error), message }],
            };
          }),
        ),
        originAccessControls: [],
        cachePolicies: [],
      };
    }

    try {
      let marker: string | undefined;
      do {
        const response = await client.send(
          new ListCachePoliciesCommand({ Type: 'custom', Marker: marker }),
        );
        cachePolicies.push(
          ...(response.CachePolicyList?.Items ?? [])
            .map((entry) => normalizeCachePolicy(entry))
            .filter((entry): entry is AwsCloudFrontCachePolicyInventory => entry !== null),
        );
        marker = response.CachePolicyList?.NextMarker;
      } while (marker);
    } catch (error) {
      const message = errorMessage(error);
      return {
        distributions: await Promise.all(
          configuredCloudFrontForEnvironment(args.context).map(async ([cdnKey, cdn]) => {
            const item = withDistributionConfigError(
              createInventoryItem({
                context: args.context,
                cdnKey,
                cdn,
                distributions: distributionSummaries,
                distributionConfigs,
                oacs: oacSummaries,
                cachePolicies: [],
                desiredCertificate: await resolveDesiredCertificate({
                  context: args.context,
                  cdn,
                }),
              }),
              distributionConfigErrors,
            );
            return {
              ...item,
              errors: [...item.errors, { code: errorCode(error), message }],
            };
          }),
        ),
        originAccessControls: oacSummaries,
        cachePolicies: [],
      };
    }

    return {
      distributions: await Promise.all(
        configuredCloudFrontForEnvironment(args.context).map(async ([cdnKey, cdn]) => {
          const desiredCertificate = await resolveDesiredCertificate({
            context: args.context,
            cdn,
          });
          const base = createInventoryItem({
            context: args.context,
            cdnKey,
            cdn,
            distributions: distributionSummaries,
            distributionConfigs,
            oacs: oacSummaries,
            cachePolicies,
          });
          return withDistributionConfigError(
            {
              ...base,
              desiredCertificateKey: desiredCertificate.key,
              desiredViewerCertificateArn: desiredCertificate.arn,
              desiredViewerCertificateStatus: desiredCertificate.status,
              s3BucketPolicyAllowsDistribution: await readBucketPolicyAllowsDistribution({
                context: args.context,
                cdnKey,
                cdn,
                distributionId: base.distributionId,
              }),
            },
            distributionConfigErrors,
          );
        }),
      ),
      originAccessControls: oacSummaries,
      cachePolicies,
    };
  }
}

export async function collectAwsCloudFrontInventory(args: {
  context: AwsCommandContext;
  reader: AwsCloudFrontInventoryReader;
  generatedAt?: string;
}): Promise<AwsCloudFrontInventoryReport> {
  const inventory = await args.reader.read({ context: args.context });
  return {
    ok: inventory.distributions.every((distribution) => distribution.errors.length === 0),
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    distributions: inventory.distributions,
    originAccessControls: inventory.originAccessControls,
    cachePolicies: inventory.cachePolicies,
  };
}

export async function runAwsCloudFrontInventory(
  options: AwsCloudFrontInventoryOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsCloudFrontInventoryReader },
): Promise<AwsCloudFrontInventoryReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reportWithoutArtifact = await collectAwsCloudFrontInventory({
    context,
    reader: deps?.inventoryReader ?? new SdkAwsCloudFrontInventoryReader(),
  });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/inventory/cloudfront.json`,
    value: reportWithoutArtifact,
  });
  return { ...reportWithoutArtifact, artifact };
}

function printHumanInventory(report: AwsCloudFrontInventoryReport): void {
  log.info(`AWS CloudFront inventory: ${report.environment}`);
  for (const distribution of report.distributions) {
    const state = distribution.distributionId ? distribution.distributionId : 'missing';
    const suffix =
      distribution.errors.length > 0 ? ` (${distribution.errors.length} read error(s))` : '';
    log.info(`- ${distribution.key}: ${state}${suffix}`);
  }
  if (report.artifact) log.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsCloudFrontInventory(
  options: AwsCloudFrontInventoryOptions,
): Promise<number> {
  try {
    const report = await runAwsCloudFrontInventory(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanInventory(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown AWS CloudFront inventory error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
