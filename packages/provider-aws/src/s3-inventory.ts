import {
  GetBucketCorsCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketOwnershipControlsCommand,
  GetBucketTaggingCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { providerOutput } from './cli-output.js';
import { writeAwsJsonArtifact } from './artifacts.js';
import { resolveAwsCommandContext } from './context.js';
import type {
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsBucketConfig,
  AwsS3BucketInventory,
  AwsS3CorsRuleInventory,
  AwsS3InventoryOptions,
  AwsS3InventoryReader,
  AwsS3InventoryReport,
  AwsS3LifecycleRuleInventory,
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
  return 'Unknown AWS S3 error.';
}

function statusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const metadata = (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata;
  return typeof metadata?.httpStatusCode === 'number' ? metadata.httpStatusCode : null;
}

function isMissingBucket(error: unknown): boolean {
  const code = errorCode(error);
  return code === 'NotFound' || code === 'NoSuchBucket' || statusCode(error) === 404;
}

function isMissingOptionalConfig(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code === 'NoSuchPublicAccessBlockConfiguration' ||
    code === 'NoSuchOwnershipControls' ||
    code === 'ServerSideEncryptionConfigurationNotFoundError' ||
    code === 'NoSuchCORSConfiguration' ||
    code === 'NoSuchLifecycleConfiguration' ||
    code === 'NoSuchTagSet' ||
    statusCode(error) === 404
  );
}

function normalizeOwnership(value: string | undefined): string | null {
  if (!value) return null;
  if (value === 'BucketOwnerEnforced') return 'bucket-owner-enforced';
  if (value === 'BucketOwnerPreferred') return 'bucket-owner-preferred';
  if (value === 'ObjectWriter') return 'object-writer';
  return value;
}

function normalizeEncryption(value: string | undefined): string | null {
  if (!value) return null;
  if (value === 'AES256') return 'sse-s3';
  if (value === 'aws:kms') return 'sse-kms';
  return value;
}

function lifecyclePrefix(rule: {
  Prefix?: string;
  Filter?: { Prefix?: string; And?: { Prefix?: string } };
}): string | null {
  return rule.Filter?.Prefix ?? rule.Filter?.And?.Prefix ?? rule.Prefix ?? null;
}

function normalizeStringList(value: readonly (string | undefined)[] | undefined): string[] {
  return (value ?? []).filter((entry): entry is string => typeof entry === 'string').sort();
}

function normalizeCorsRule(rule: {
  AllowedMethods?: (string | undefined)[];
  AllowedOrigins?: (string | undefined)[];
  AllowedHeaders?: (string | undefined)[];
  ExposeHeaders?: (string | undefined)[];
  MaxAgeSeconds?: number;
}): AwsS3CorsRuleInventory {
  return {
    allowedMethods: normalizeStringList(rule.AllowedMethods),
    allowedOrigins: normalizeStringList(rule.AllowedOrigins),
    allowedHeaders: normalizeStringList(rule.AllowedHeaders),
    exposeHeaders: normalizeStringList(rule.ExposeHeaders),
    maxAgeSeconds: rule.MaxAgeSeconds ?? null,
  };
}

export class SdkAwsS3InventoryReader implements AwsS3InventoryReader {
  async readBucket(args: {
    bucketKey: string;
    bucket: AwsOpsBucketConfig;
    context: AwsCommandContext;
  }): Promise<AwsS3BucketInventory> {
    const client = new S3Client({
      region: args.context.account.region,
      ...(args.context.account.profile
        ? { credentials: fromIni({ profile: args.context.account.profile }) }
        : {}),
    });
    const base: AwsS3BucketInventory = {
      key: args.bucketKey,
      name: args.bucket.name,
      environment: args.bucket.environment,
      exists: false,
      expectedRegion: args.context.account.region,
      publicAccessBlock: null,
      objectOwnership: null,
      encryption: null,
      tags: {},
      corsConfigured: null,
      corsRules: [],
      lifecycleRules: [],
      errors: [],
    };

    try {
      await client.send(new HeadBucketCommand({ Bucket: args.bucket.name }));
      base.exists = true;
    } catch (error) {
      if (isMissingBucket(error)) return base;
      base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      return base;
    }

    try {
      const access = await client.send(
        new GetPublicAccessBlockCommand({ Bucket: args.bucket.name }),
      );
      base.publicAccessBlock = {
        blockPublicAcls: access.PublicAccessBlockConfiguration?.BlockPublicAcls ?? null,
        ignorePublicAcls: access.PublicAccessBlockConfiguration?.IgnorePublicAcls ?? null,
        blockPublicPolicy: access.PublicAccessBlockConfiguration?.BlockPublicPolicy ?? null,
        restrictPublicBuckets: access.PublicAccessBlockConfiguration?.RestrictPublicBuckets ?? null,
      };
    } catch (error) {
      if (!isMissingOptionalConfig(error)) {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    try {
      const ownership = await client.send(
        new GetBucketOwnershipControlsCommand({ Bucket: args.bucket.name }),
      );
      base.objectOwnership = normalizeOwnership(
        ownership.OwnershipControls?.Rules?.[0]?.ObjectOwnership,
      );
    } catch (error) {
      if (!isMissingOptionalConfig(error)) {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    try {
      const encryption = await client.send(
        new GetBucketEncryptionCommand({ Bucket: args.bucket.name }),
      );
      base.encryption = normalizeEncryption(
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
          ?.SSEAlgorithm,
      );
    } catch (error) {
      if (!isMissingOptionalConfig(error)) {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    try {
      const tagging = await client.send(new GetBucketTaggingCommand({ Bucket: args.bucket.name }));
      base.tags = Object.fromEntries(
        (tagging.TagSet ?? []).flatMap((tag) =>
          tag.Key && tag.Value !== undefined ? [[tag.Key, tag.Value]] : [],
        ),
      );
    } catch (error) {
      if (!isMissingOptionalConfig(error)) {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    try {
      const cors = await client.send(new GetBucketCorsCommand({ Bucket: args.bucket.name }));
      base.corsConfigured = (cors.CORSRules ?? []).length > 0;
      base.corsRules = (cors.CORSRules ?? []).map((rule) => normalizeCorsRule(rule));
    } catch (error) {
      if (isMissingOptionalConfig(error)) {
        base.corsConfigured = false;
      } else {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    try {
      const lifecycle = await client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: args.bucket.name }),
      );
      base.lifecycleRules = (lifecycle.Rules ?? []).map(
        (rule): AwsS3LifecycleRuleInventory => ({
          id: rule.ID ?? null,
          status: rule.Status ?? null,
          prefix: lifecyclePrefix(rule),
          expirationDays: rule.Expiration?.Days ?? null,
        }),
      );
    } catch (error) {
      if (!isMissingOptionalConfig(error)) {
        base.errors.push({ code: errorCode(error), message: errorMessage(error) });
      }
    }

    return base;
  }
}

export function configuredBucketsForEnvironment(
  context: AwsCommandContext,
): Array<[string, AwsOpsBucketConfig]> {
  return Object.entries(context.config.buckets ?? {}).filter(
    ([, bucket]) => bucket.environment === context.environment,
  );
}

export async function collectAwsS3Inventory(args: {
  context: AwsCommandContext;
  reader: AwsS3InventoryReader;
  generatedAt?: string;
}): Promise<AwsS3InventoryReport> {
  const buckets: AwsS3BucketInventory[] = [];

  for (const [bucketKey, bucket] of configuredBucketsForEnvironment(args.context)) {
    buckets.push(await args.reader.readBucket({ bucketKey, bucket, context: args.context }));
  }

  return {
    ok: buckets.every((bucket) => bucket.errors.length === 0),
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    buckets,
  };
}

export async function runAwsS3Inventory(
  options: AwsS3InventoryOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsS3InventoryReader },
): Promise<AwsS3InventoryReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reader = deps?.inventoryReader ?? new SdkAwsS3InventoryReader();
  const reportWithoutArtifact = await collectAwsS3Inventory({ context, reader });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/inventory/s3.json`,
    value: reportWithoutArtifact,
  });

  return { ...reportWithoutArtifact, artifact };
}

function printHumanInventory(report: AwsS3InventoryReport): void {
  providerOutput.info(`AWS S3 inventory: ${report.environment}`);
  for (const bucket of report.buckets) {
    const state = bucket.exists ? 'exists' : 'missing';
    const suffix = bucket.errors.length > 0 ? ` (${bucket.errors.length} read error(s))` : '';
    providerOutput.info(`- ${bucket.key}: ${bucket.name} [${state}]${suffix}`);
  }
  if (report.artifact) providerOutput.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsS3Inventory(options: AwsS3InventoryOptions): Promise<number> {
  try {
    const report = await runAwsS3Inventory(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanInventory(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS S3 inventory error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
