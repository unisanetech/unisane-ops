import { readFileSync } from 'node:fs';
import path from 'node:path';
import { providerOutput } from './cli-output.js';
import { writeAwsJsonArtifact } from './artifacts.js';
import { resolveAwsCommandContext } from './context.js';
import {
  collectAwsS3Inventory,
  configuredBucketsForEnvironment,
  SdkAwsS3InventoryReader,
} from './s3-inventory.js';
import type {
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsBucketConfig,
  AwsOpsBucketCorsConfig,
  AwsS3BucketInventory,
  AwsS3CorsRuleInventory,
  AwsS3InventoryReader,
  AwsS3InventoryReport,
  AwsS3PlanAction,
  AwsS3PlanOperation,
  AwsS3PlanOptions,
  AwsS3PlanReport,
} from './types.js';

function requiredPublicAccessBlock(): NonNullable<AwsS3BucketInventory['publicAccessBlock']> {
  return {
    blockPublicAcls: true,
    ignorePublicAcls: true,
    blockPublicPolicy: true,
    restrictPublicBuckets: true,
  };
}

function publicAccessBlockMatches(
  current: AwsS3BucketInventory['publicAccessBlock'],
): current is NonNullable<AwsS3BucketInventory['publicAccessBlock']> {
  return (
    current?.blockPublicAcls === true &&
    current.ignorePublicAcls === true &&
    current.blockPublicPolicy === true &&
    current.restrictPublicBuckets === true
  );
}

function defaultTags(
  context: AwsCommandContext,
  bucket: AwsOpsBucketConfig,
): Record<string, string> {
  return {
    ...(context.config.defaults?.tags ?? {}),
    Environment: bucket.environment,
    DataClass: Array.from(new Set((bucket.prefixes ?? []).map((prefix) => prefix.dataClass))).join(
      '+',
    ),
  };
}

function hasAllTags(current: Record<string, string>, desired: Record<string, string>): boolean {
  return Object.entries(desired).every(([key, value]) => current[key] === value);
}

function normalizeList(value: readonly string[] | undefined): string[] {
  return [...(value ?? [])].sort();
}

function desiredCorsRules(cors: AwsOpsBucketCorsConfig): AwsS3CorsRuleInventory[] {
  return [
    {
      allowedMethods: normalizeList(cors.allowedMethods ?? ['PUT', 'POST', 'GET', 'HEAD']),
      allowedOrigins: normalizeList(cors.allowedOrigins),
      allowedHeaders: normalizeList(cors.allowedHeaders ?? ['*']),
      exposeHeaders: normalizeList(cors.exposeHeaders ?? ['ETag']),
      maxAgeSeconds: cors.maxAgeSeconds ?? 3000,
    },
  ];
}

function corsRulesMatch(
  current: readonly AwsS3CorsRuleInventory[],
  desired: readonly AwsS3CorsRuleInventory[],
): boolean {
  return JSON.stringify(current) === JSON.stringify(desired);
}

function desiredLifecyclePrefixes(bucket: AwsOpsBucketConfig): string[] {
  return (bucket.prefixes ?? [])
    .filter((prefix) => prefix.dataClass === 'temporary')
    .map((prefix) => prefix.path);
}

function productionPrefixesAreClassified(bucket: AwsOpsBucketConfig): boolean {
  const prefixes = bucket.prefixes ?? [];
  return (
    prefixes.length > 0 &&
    prefixes.every((prefix) => prefix.path.trim().length > 0 && prefix.dataClass.trim().length > 0)
  );
}

function productionCorsIsRestricted(bucket: AwsOpsBucketConfig): boolean {
  return !bucket.cors?.allowedOrigins.some((origin) => origin.trim() === '*');
}

function hasLifecycleForPrefix(bucket: AwsS3BucketInventory, prefix: string): boolean {
  return bucket.lifecycleRules.some(
    (rule) =>
      rule.status === 'Enabled' &&
      rule.prefix === prefix &&
      typeof rule.expirationDays === 'number',
  );
}

function addOperation(
  operations: AwsS3PlanOperation[],
  operation: Omit<AwsS3PlanOperation, 'current' | 'desired'> & {
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

export function createAwsS3Plan(args: {
  context: AwsCommandContext;
  inventory: AwsS3InventoryReport;
  generatedAt?: string;
}): AwsS3PlanReport {
  const operations: AwsS3PlanOperation[] = [];
  const inventoryByKey = new Map(args.inventory.buckets.map((bucket) => [bucket.key, bucket]));

  for (const [bucketKey, desiredBucket] of configuredBucketsForEnvironment(args.context)) {
    const current = inventoryByKey.get(bucketKey);
    if (args.context.account.production && !productionPrefixesAreClassified(desiredBucket)) {
      addOperation(operations, {
        action: 'blocked',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'prefix.data-class.production',
        message: `Production bucket '${desiredBucket.name}' must declare at least one classified prefix before apply.`,
        current: desiredBucket.prefixes ?? [],
        desired: 'non-empty prefixes with dataClass',
      });
      continue;
    }
    if (args.context.account.production && !productionCorsIsRestricted(desiredBucket)) {
      addOperation(operations, {
        action: 'blocked',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'cors.production-origin',
        message: `Production bucket '${desiredBucket.name}' cannot allow wildcard browser upload origins.`,
        current: desiredBucket.cors?.allowedOrigins ?? [],
        desired: 'explicit allowedOrigins',
      });
      continue;
    }

    if (!current || !current.exists) {
      addOperation(operations, {
        action: 'create',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'bucket.exists',
        message: `Create bucket '${desiredBucket.name}' in ${args.context.account.region}.`,
        current: current?.exists ?? false,
        desired: true,
      });
      continue;
    }

    if (desiredBucket.blockPublicAccess === false) {
      addOperation(operations, {
        action: 'blocked',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'public-access-block',
        message: 'Public S3 buckets are blocked by the AWS control-plane policy.',
        current: current.publicAccessBlock,
        desired: requiredPublicAccessBlock(),
      });
    } else if (!publicAccessBlockMatches(current.publicAccessBlock)) {
      addOperation(operations, {
        action: 'update',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'public-access-block',
        message: `Enable full S3 Block Public Access for '${desiredBucket.name}'.`,
        current: current.publicAccessBlock,
        desired: requiredPublicAccessBlock(),
      });
    }

    const desiredOwnership = desiredBucket.objectOwnership ?? 'bucket-owner-enforced';
    if (current.objectOwnership !== desiredOwnership) {
      addOperation(operations, {
        action: 'update',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'object-ownership',
        message: `Set object ownership to '${desiredOwnership}' for '${desiredBucket.name}'.`,
        current: current.objectOwnership,
        desired: desiredOwnership,
      });
    }

    const desiredEncryption = desiredBucket.encryption?.type ?? 'sse-s3';
    if (current.encryption !== desiredEncryption) {
      addOperation(operations, {
        action: 'update',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'encryption',
        message: `Set default bucket encryption to '${desiredEncryption}' for '${desiredBucket.name}'.`,
        current: current.encryption,
        desired: desiredEncryption,
      });
    }

    const tags = defaultTags(args.context, desiredBucket);
    if (!hasAllTags(current.tags, tags)) {
      addOperation(operations, {
        action: 'update',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'tags',
        message: `Apply required ownership and data-class tags to '${desiredBucket.name}'.`,
        current: current.tags,
        desired: tags,
      });
    }

    if (desiredBucket.cors) {
      const desiredCors = desiredCorsRules(desiredBucket.cors);
      if (!corsRulesMatch(current.corsRules, desiredCors)) {
        addOperation(operations, {
          action: 'update',
          bucketKey,
          bucketName: desiredBucket.name,
          check: 'cors',
          message: `Apply browser upload CORS rules to '${desiredBucket.name}'.`,
          current: current.corsRules,
          desired: desiredCors,
        });
      }
    }

    for (const prefix of desiredLifecyclePrefixes(desiredBucket)) {
      if (!hasLifecycleForPrefix(current, prefix)) {
        addOperation(operations, {
          action: 'update',
          bucketKey,
          bucketName: desiredBucket.name,
          check: 'lifecycle.temporary-prefix',
          message: `Add lifecycle expiration for temporary prefix '${prefix}' in '${desiredBucket.name}'.`,
          current: current.lifecycleRules,
          desired: { prefix, expirationDays: 30 },
        });
      }
    }

    if (!operations.some((operation) => operation.bucketKey === bucketKey)) {
      addOperation(operations, {
        action: 'no-op',
        bucketKey,
        bucketName: desiredBucket.name,
        check: 'bucket.posture',
        message: `Bucket '${desiredBucket.name}' already matches the current S3 desired-state checks.`,
      });
    }
  }

  const summary = operations.reduce<Record<AwsS3PlanAction, number>>(
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
      `[AWS_INVENTORY_PATH_OUTSIDE_CWD] Inventory path must stay inside cwd: ${candidate}`,
    );
  }
  return resolved;
}

function readInventoryFromFile(cwd: string, inventoryPath: string): AwsS3InventoryReport {
  const resolved = ensureInsideCwd(cwd, inventoryPath);
  return JSON.parse(readFileSync(resolved, 'utf8')) as AwsS3InventoryReport;
}

export async function runAwsS3Plan(
  options: AwsS3PlanOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsS3InventoryReader },
): Promise<AwsS3PlanReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const inventory = options.inventoryPath
    ? readInventoryFromFile(context.cwd, options.inventoryPath)
    : await collectAwsS3Inventory({
        context,
        reader: deps?.inventoryReader ?? new SdkAwsS3InventoryReader(),
      });

  const planWithoutArtifact = createAwsS3Plan({ context, inventory });
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/plans/s3-plan.json`,
    value: planWithoutArtifact,
  });

  return { ...planWithoutArtifact, artifact };
}

function printHumanPlan(report: AwsS3PlanReport): void {
  providerOutput.info(`AWS S3 plan: ${report.environment}`);
  providerOutput.info(
    `Summary: create=${report.summary.create}, update=${report.summary.update}, blocked=${report.summary.blocked}, no-op=${report.summary['no-op']}`,
  );
  for (const operation of report.operations) {
    providerOutput.info(
      `- [${operation.action}] ${operation.bucketKey}.${operation.check}: ${operation.message}`,
    );
  }
  if (report.artifact) providerOutput.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsS3Plan(options: AwsS3PlanOptions): Promise<number> {
  try {
    const report = await runAwsS3Plan(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanPlan(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS S3 plan error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
