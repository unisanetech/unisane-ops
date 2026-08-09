import { readFileSync } from 'node:fs';
import path from 'node:path';
import { providerOutput } from './cli-output.js';
import { writeAwsJsonArtifact } from './artifacts.js';
import {
  collectAwsCloudFrontInventory,
  configuredCloudFrontForEnvironment,
  desiredCloudFrontAccessLogging,
  desiredCloudFrontCachePolicyName,
  desiredCloudFrontCachePolicyTtl,
  desiredCloudFrontOacName,
  desiredCloudFrontOriginDomain,
  SdkAwsCloudFrontInventoryReader,
} from './cloudfront-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import type {
  AwsCloudFrontDistributionInventory,
  AwsCloudFrontInventoryReader,
  AwsCloudFrontInventoryReport,
  AwsCloudFrontPlanAction,
  AwsCloudFrontPlanOperation,
  AwsCloudFrontPlanOptions,
  AwsCloudFrontPlanReport,
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsCdnConfig,
} from './types.js';

function addOperation(
  operations: AwsCloudFrontPlanOperation[],
  operation: Omit<AwsCloudFrontPlanOperation, 'current' | 'desired'> & {
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

function desiredAliases(cdn: AwsOpsCdnConfig): string[] {
  return [...(cdn.aliases ?? [])].sort();
}

function aliasesMatch(current: string[], desired: string[]): boolean {
  return JSON.stringify([...current].sort()) === JSON.stringify(desired);
}

function desiredCreatePayload(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
}): Record<string, unknown> {
  return {
    enabled: true,
    access: 'cloudfront-oac',
    originBucket: args.cdn.originBucket,
    originDomainName: desiredCloudFrontOriginDomain({ context: args.context, cdn: args.cdn }),
    originAccessControlName: desiredCloudFrontOacName({
      context: args.context,
      cdnKey: args.cdnKey,
    }),
    aliases: desiredAliases(args.cdn),
    viewerCertificate: args.cdn.certificate
      ? {
          certificateKey: args.cdn.certificate,
          acmCertificateArn: null,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        }
      : null,
    publicPrefixes: args.cdn.publicPrefixes ?? [],
    viewerProtocolPolicy: 'redirect-to-https',
    accessLogging: desiredCloudFrontAccessLogging({
      context: args.context,
      cdnKey: args.cdnKey,
      cdn: args.cdn,
    }),
    cachePolicyName: desiredCloudFrontCachePolicyName({
      context: args.context,
      cdnKey: args.cdnKey,
    }),
    cachePolicy: desiredCachePolicyPayload({
      context: args.context,
      cdnKey: args.cdnKey,
    }),
  };
}

function desiredViewerCertificatePayload(
  current: AwsCloudFrontDistributionInventory,
): Record<string, unknown> {
  return {
    certificateKey: current.desiredCertificateKey,
    acmCertificateArn: current.desiredViewerCertificateArn,
    sslSupportMethod: 'sni-only',
    minimumProtocolVersion: 'TLSv1.2_2021',
  };
}

function addViewerCertificateReadinessOperation(args: {
  operations: AwsCloudFrontPlanOperation[];
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  current: AwsCloudFrontDistributionInventory | undefined;
}): boolean {
  const aliases = desiredAliases(args.cdn);
  if (aliases.length === 0) return true;
  if (!args.cdn.certificate) {
    addOperation(args.operations, {
      action: 'blocked',
      cdnKey: args.cdnKey,
      distributionId: args.current?.distributionId ?? null,
      check: 'viewer-certificate.missing-config',
      message: `CDN '${args.cdnKey}' has aliases but no configured ACM certificate reference.`,
      current: null,
      desired: {
        aliases,
        certificate: 'cdn.<key>.certificate',
      },
    });
    return false;
  }
  if (
    !args.current?.desiredViewerCertificateArn ||
    args.current.desiredViewerCertificateStatus !== 'ISSUED'
  ) {
    addOperation(args.operations, {
      action: 'blocked',
      cdnKey: args.cdnKey,
      distributionId: args.current?.distributionId ?? null,
      check: 'viewer-certificate.unissued',
      message: `CDN '${args.cdnKey}' requires an issued ACM certificate before CloudFront aliases can be applied.`,
      current: {
        certificateKey: args.cdn.certificate,
        status: args.current?.desiredViewerCertificateStatus ?? null,
      },
      desired: {
        certificateKey: args.cdn.certificate,
        status: 'ISSUED',
      },
    });
    return false;
  }
  return true;
}

function desiredCachePolicyPayload(args: {
  context: AwsCommandContext;
  cdnKey: string;
}): Record<string, unknown> {
  const ttl = desiredCloudFrontCachePolicyTtl(args.context);
  return {
    name: desiredCloudFrontCachePolicyName({
      context: args.context,
      cdnKey: args.cdnKey,
    }),
    strategy:
      args.context.config.defaults?.publicAssetCache?.strategy ?? 'immutable-versioned-assets',
    minTtlSeconds: 0,
    defaultTtlSeconds: ttl,
    maxTtlSeconds: ttl,
    cookies: 'none',
    headers: 'none',
    queryStrings: 'none',
    compression: 'brotli-and-gzip',
  };
}

function desiredBucketPolicyPayload(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  distributionId: string | null;
}): Record<string, unknown> {
  const bucket = args.context.config.buckets?.[args.cdn.originBucket];
  return {
    bucketName: bucket?.name ?? null,
    originBucket: args.cdn.originBucket,
    publicPrefixes: args.cdn.publicPrefixes ?? [],
    distributionArn: args.distributionId
      ? `arn:aws:cloudfront::${args.context.account.expectedAccountId}:distribution/${args.distributionId}`
      : null,
    statementSid: `UnisaneCloudFrontOAC${args.cdnKey.replace(/[^a-zA-Z0-9]+/g, '')}`,
  };
}

function accessLoggingMatches(
  current: AwsCloudFrontDistributionInventory,
  desired: ReturnType<typeof desiredCloudFrontAccessLogging>,
): boolean {
  if (!desired) return true;
  return (
    current.accessLoggingEnabled === true &&
    current.accessLogBucket === desired.bucket &&
    current.accessLogPrefix === desired.prefix &&
    current.accessLogIncludeCookies === desired.includeCookies
  );
}

export function createAwsCloudFrontPlan(args: {
  context: AwsCommandContext;
  inventory: AwsCloudFrontInventoryReport;
  generatedAt?: string;
}): AwsCloudFrontPlanReport {
  const operations: AwsCloudFrontPlanOperation[] = [];
  const inventoryByKey = new Map(
    args.inventory.distributions.map((distribution) => [distribution.key, distribution]),
  );

  for (const [cdnKey, cdn] of configuredCloudFrontForEnvironment(args.context)) {
    const current = inventoryByKey.get(cdnKey);
    if (cdn.access !== 'cloudfront-oac') {
      addOperation(operations, {
        action: 'blocked',
        cdnKey,
        distributionId: current?.distributionId ?? null,
        check: 'access-mode',
        message: `CloudFront access mode '${cdn.access}' is not allowed; use cloudfront-oac.`,
        current: cdn.access,
        desired: 'cloudfront-oac',
      });
      continue;
    }

    const certificateReady = addViewerCertificateReadinessOperation({
      operations,
      cdnKey,
      cdn,
      current,
    });
    if (!certificateReady) continue;

    const desiredAccessLogging = desiredCloudFrontAccessLogging({
      context: args.context,
      cdnKey,
      cdn,
    });
    if (cdn.accessLogs && !desiredAccessLogging?.bucket) {
      addOperation(operations, {
        action: 'blocked',
        cdnKey,
        distributionId: current?.distributionId ?? null,
        check: 'access-logging.bucket',
        message: `CDN '${cdnKey}' references an access log bucket that is not configured for this environment.`,
        current: null,
        desired: {
          bucketKey: cdn.accessLogs.bucket,
        },
      });
      continue;
    }
    const accessLogBucket = cdn.accessLogs
      ? args.context.config.buckets?.[cdn.accessLogs.bucket]
      : undefined;
    if (cdn.accessLogs && accessLogBucket?.objectOwnership !== 'bucket-owner-preferred') {
      addOperation(operations, {
        action: 'blocked',
        cdnKey,
        distributionId: current?.distributionId ?? null,
        check: 'access-logging.bucket-ownership',
        message: `CDN '${cdnKey}' access log bucket '${cdn.accessLogs.bucket}' must use bucket-owner-preferred ownership for CloudFront standard S3 access logs.`,
        current: accessLogBucket?.objectOwnership ?? null,
        desired: 'bucket-owner-preferred',
      });
      continue;
    }

    if (!current?.distributionId) {
      addOperation(operations, {
        action: 'create',
        cdnKey,
        distributionId: null,
        check: 'distribution.exists',
        message: `Create CloudFront distribution for CDN '${cdnKey}'.`,
        current: false,
        desired: desiredCreatePayload({ context: args.context, cdnKey, cdn }),
      });
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: null,
        check: 's3-oac-bucket-policy',
        message: `Attach S3 bucket policy for CloudFront OAC access to CDN '${cdnKey}' after distribution creation.`,
        current: false,
        desired: desiredBucketPolicyPayload({
          context: args.context,
          cdnKey,
          cdn,
          distributionId: null,
        }),
      });
      continue;
    }

    const desiredOriginDomainName = desiredCloudFrontOriginDomain({
      context: args.context,
      cdn,
    });
    if (current.originDomainName !== desiredOriginDomainName) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'origin-domain',
        message: `Update CloudFront origin to private S3 bucket '${cdn.originBucket}'.`,
        current: current.originDomainName,
        desired: desiredOriginDomainName,
      });
    }

    const desiredOacName = desiredCloudFrontOacName({ context: args.context, cdnKey });
    if (current.originAccessControlName !== desiredOacName) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'origin-access-control',
        message: `Attach CloudFront Origin Access Control '${desiredOacName}'.`,
        current: {
          id: current.originAccessControlId,
          name: current.originAccessControlName,
        },
        desired: {
          name: desiredOacName,
          originType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        },
      });
    }

    const aliases = desiredAliases(cdn);
    if (
      aliases.length > 0 &&
      current.viewerCertificateArn !== current.desiredViewerCertificateArn
    ) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'viewer-certificate',
        message: `Attach ACM certificate '${current.desiredCertificateKey}' to CloudFront CDN '${cdnKey}'.`,
        current: {
          acmCertificateArn: current.viewerCertificateArn,
          certificateSource: current.viewerCertificateSource,
          minimumProtocolVersion: current.minimumProtocolVersion,
        },
        desired: desiredViewerCertificatePayload(current),
      });
    }

    if (!aliasesMatch(current.aliases, aliases)) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'aliases',
        message: `Update CloudFront aliases for CDN '${cdnKey}'.`,
        current: current.aliases,
        desired: aliases,
      });
    }

    if (current.viewerProtocolPolicy !== 'redirect-to-https') {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'viewer-protocol-policy',
        message: `Set viewer protocol policy to redirect-to-https for CDN '${cdnKey}'.`,
        current: current.viewerProtocolPolicy,
        desired: 'redirect-to-https',
      });
    }

    const desiredCachePolicyName = desiredCloudFrontCachePolicyName({
      context: args.context,
      cdnKey,
    });
    if (current.cachePolicyName !== desiredCachePolicyName) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'cache-policy',
        message: `Attach immutable public-asset cache policy '${desiredCachePolicyName}'.`,
        current: {
          id: current.cachePolicyId,
          name: current.cachePolicyName,
        },
        desired: desiredCachePolicyPayload({ context: args.context, cdnKey }),
      });
    }

    if (!accessLoggingMatches(current, desiredAccessLogging)) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 'access-logging',
        message: `Enable CloudFront access logs for CDN '${cdnKey}'.`,
        current: {
          enabled: current.accessLoggingEnabled,
          bucket: current.accessLogBucket,
          prefix: current.accessLogPrefix,
          includeCookies: current.accessLogIncludeCookies,
        },
        desired: desiredAccessLogging,
      });
    }

    if (current.s3BucketPolicyAllowsDistribution !== true) {
      addOperation(operations, {
        action: 'update',
        cdnKey,
        distributionId: current.distributionId,
        check: 's3-oac-bucket-policy',
        message: `Ensure S3 bucket policy grants CloudFront distribution '${current.distributionId}' access to configured public prefixes.`,
        current: current.s3BucketPolicyAllowsDistribution,
        desired: desiredBucketPolicyPayload({
          context: args.context,
          cdnKey,
          cdn,
          distributionId: current.distributionId,
        }),
      });
    }

    if (!operations.some((operation) => operation.cdnKey === cdnKey)) {
      addOperation(operations, {
        action: 'no-op',
        cdnKey,
        distributionId: current.distributionId,
        check: 'distribution.posture',
        message: `CloudFront CDN '${cdnKey}' already matches the current desired-state checks.`,
      });
    }
  }

  const summary = operations.reduce<Record<AwsCloudFrontPlanAction, number>>(
    (acc, operation) => {
      acc[operation.action] += 1;
      return acc;
    },
    { create: 0, update: 0, blocked: 0, 'no-op': 0 },
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
      `[AWS_CLOUDFRONT_INVENTORY_PATH_OUTSIDE_CWD] Inventory path must stay inside cwd: ${candidate}`,
    );
  }
  return resolved;
}

function readInventoryFromFile(cwd: string, inventoryPath: string): AwsCloudFrontInventoryReport {
  const resolved = ensureInsideCwd(cwd, inventoryPath);
  return JSON.parse(readFileSync(resolved, 'utf8')) as AwsCloudFrontInventoryReport;
}

export async function runAwsCloudFrontPlan(
  options: AwsCloudFrontPlanOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsCloudFrontInventoryReader },
): Promise<AwsCloudFrontPlanReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const inventory = options.inventoryPath
    ? readInventoryFromFile(context.cwd, options.inventoryPath)
    : await collectAwsCloudFrontInventory({
        context,
        reader: deps?.inventoryReader ?? new SdkAwsCloudFrontInventoryReader(),
      });

  const planWithoutArtifact = createAwsCloudFrontPlan({ context, inventory });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/plans/cloudfront-plan.json`,
    value: planWithoutArtifact,
  });

  return { ...planWithoutArtifact, artifact };
}

function printHumanPlan(report: AwsCloudFrontPlanReport): void {
  providerOutput.info(`AWS CloudFront plan: ${report.environment}`);
  providerOutput.info(
    `Summary: create=${report.summary.create}, update=${report.summary.update}, blocked=${report.summary.blocked}, no-op=${report.summary['no-op']}`,
  );
  for (const operation of report.operations) {
    providerOutput.info(
      `- [${operation.action}] ${operation.cdnKey}.${operation.check}: ${operation.message}`,
    );
  }
  if (report.artifact) providerOutput.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsCloudFrontPlan(options: AwsCloudFrontPlanOptions): Promise<number> {
  try {
    const report = await runAwsCloudFrontPlan(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanPlan(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS CloudFront plan error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
