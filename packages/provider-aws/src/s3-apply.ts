import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketEncryptionCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketTaggingCommand,
  PutPublicAccessBlockCommand,
  S3Client,
  type BucketLocationConstraint,
} from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { providerOutput } from './cli-output.js';
import { awsSafeArtifactStamp, writeAwsJsonArtifact } from './artifacts.js';
import { resolveAwsCommandContext } from './context.js';
import { withAwsOperationLock } from './lock.js';
import type {
  AwsCommandContext,
  AwsIdentityReader,
  AwsS3ApplyExecutor,
  AwsS3ApplyOperationResult,
  AwsS3ApplyOptions,
  AwsS3ApplyReceipt,
  AwsS3ApplyReport,
  AwsS3CorsRuleInventory,
  AwsS3LifecycleRuleInventory,
  AwsS3PlanOperation,
  AwsS3PlanReport,
} from './types.js';

const RECEIPT_KIND = 'unisane.aws.s3-apply-receipt' as const;
const MAX_PRODUCTION_PLAN_AGE_MS = 24 * 60 * 60 * 1000;

function ensureInsideCwd(cwd: string, candidate: string): string {
  const resolved = path.resolve(cwd, candidate);
  const normalizedCwd = path.resolve(cwd);
  const prefix = normalizedCwd.endsWith(path.sep) ? normalizedCwd : `${normalizedCwd}${path.sep}`;
  if (resolved !== normalizedCwd && !resolved.startsWith(prefix)) {
    throw new Error(`[AWS_PLAN_PATH_OUTSIDE_CWD] S3 apply plan must stay inside cwd: ${candidate}`);
  }
  return resolved;
}

function readPlan(cwd: string, planPath: string): { planPath: string; plan: AwsS3PlanReport } {
  const resolved = ensureInsideCwd(cwd, planPath);
  return {
    planPath: resolved,
    plan: JSON.parse(readFileSync(resolved, 'utf8')) as AwsS3PlanReport,
  };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function desiredRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    throw new Error(
      '[AWS_S3_APPLY_INVALID_TAGS] S3 tag operation desired value must be an object.',
    );
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, String(entry ?? '')]),
  );
}

function desiredPublicAccessBlock(value: unknown): {
  blockPublicAcls: boolean;
  ignorePublicAcls: boolean;
  blockPublicPolicy: boolean;
  restrictPublicBuckets: boolean;
} {
  if (!isRecord(value)) {
    throw new Error(
      '[AWS_S3_APPLY_INVALID_PUBLIC_ACCESS_BLOCK] Public access block desired value must be an object.',
    );
  }
  return {
    blockPublicAcls: value.blockPublicAcls === true,
    ignorePublicAcls: value.ignorePublicAcls === true,
    blockPublicPolicy: value.blockPublicPolicy === true,
    restrictPublicBuckets: value.restrictPublicBuckets === true,
  };
}

function desiredObjectOwnership(value: unknown): 'BucketOwnerEnforced' | 'BucketOwnerPreferred' {
  if (value === 'bucket-owner-enforced') return 'BucketOwnerEnforced';
  if (value === 'bucket-owner-preferred') return 'BucketOwnerPreferred';
  throw new Error(
    '[AWS_S3_APPLY_UNSUPPORTED_OWNERSHIP] Only bucket-owner-enforced and bucket-owner-preferred are supported.',
  );
}

function desiredCorsRules(value: unknown): AwsS3CorsRuleInventory[] {
  if (!Array.isArray(value)) {
    throw new Error('[AWS_S3_APPLY_INVALID_CORS] CORS desired value must be an array.');
  }
  return value.map((entry) => {
    if (!isRecord(entry)) throw new Error('[AWS_S3_APPLY_INVALID_CORS] CORS rule is invalid.');
    const allowedMethods = Array.isArray(entry.allowedMethods)
      ? entry.allowedMethods.map(String)
      : [];
    const allowedOrigins = Array.isArray(entry.allowedOrigins)
      ? entry.allowedOrigins.map(String)
      : [];
    if (allowedMethods.length === 0 || allowedOrigins.length === 0) {
      throw new Error('[AWS_S3_APPLY_INVALID_CORS] CORS rule needs methods and origins.');
    }
    return {
      allowedMethods,
      allowedOrigins,
      allowedHeaders: Array.isArray(entry.allowedHeaders) ? entry.allowedHeaders.map(String) : [],
      exposeHeaders: Array.isArray(entry.exposeHeaders) ? entry.exposeHeaders.map(String) : [],
      maxAgeSeconds:
        typeof entry.maxAgeSeconds === 'number' && Number.isFinite(entry.maxAgeSeconds)
          ? entry.maxAgeSeconds
          : null,
    };
  });
}

function desiredLifecycle(value: unknown): { prefix: string; expirationDays: number } {
  if (
    !isRecord(value) ||
    typeof value.prefix !== 'string' ||
    typeof value.expirationDays !== 'number'
  ) {
    throw new Error('[AWS_S3_APPLY_INVALID_LIFECYCLE] Lifecycle desired value is invalid.');
  }
  return {
    prefix: value.prefix,
    expirationDays: value.expirationDays,
  };
}

function currentLifecycleRules(value: unknown): AwsS3LifecycleRuleInventory[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): AwsS3LifecycleRuleInventory[] => {
    if (!isRecord(entry)) return [];
    return [
      {
        id: typeof entry.id === 'string' ? entry.id : null,
        status: typeof entry.status === 'string' ? entry.status : null,
        prefix: typeof entry.prefix === 'string' ? entry.prefix : null,
        expirationDays: typeof entry.expirationDays === 'number' ? entry.expirationDays : null,
      },
    ];
  });
}

function sanitizeLifecycleId(prefix: string): string {
  const clean = prefix.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return `unisane-expire-${clean || 'temporary'}`.slice(0, 255);
}

function assertSupportedOperation(operation: AwsS3PlanOperation): void {
  if (operation.action === 'no-op') return;
  if (operation.action === 'blocked') {
    throw new Error(
      `[AWS_S3_APPLY_BLOCKED_PLAN] Plan contains blocked operation '${operation.bucketKey}.${operation.check}'.`,
    );
  }
  if (operation.action === 'create' && operation.check === 'bucket.exists') return;
  if (
    operation.action === 'update' &&
    [
      'public-access-block',
      'object-ownership',
      'encryption',
      'cors',
      'tags',
      'lifecycle.temporary-prefix',
    ].includes(operation.check)
  ) {
    return;
  }
  throw new Error(
    `[AWS_S3_APPLY_UNSUPPORTED_OPERATION] S3 apply cannot safely execute '${operation.action}:${operation.check}'.`,
  );
}

function validatePlanForApply(args: {
  context: AwsCommandContext;
  plan: AwsS3PlanReport;
  options: AwsS3ApplyOptions;
}): void {
  if (!args.options.yes) {
    throw new Error(
      '[AWS_S3_APPLY_REQUIRES_YES] S3 apply requires --yes after reviewing the plan.',
    );
  }
  if (args.options.accountConfirm !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_S3_APPLY_ACCOUNT_CONFIRM_REQUIRED] Expected --account-confirm ${args.context.account.expectedAccountId}.`,
    );
  }
  if (args.plan.environment !== args.context.environment) {
    throw new Error(
      `[AWS_S3_APPLY_ENVIRONMENT_MISMATCH] Plan environment '${args.plan.environment}' does not match selected environment '${args.context.environment}'.`,
    );
  }
  if (args.plan.account.expectedAccountId !== args.context.account.expectedAccountId) {
    throw new Error('[AWS_S3_APPLY_ACCOUNT_MISMATCH] Plan account does not match active account.');
  }
  if (!args.plan.ok || args.plan.summary.blocked > 0) {
    throw new Error('[AWS_S3_APPLY_BLOCKED_PLAN] Refusing to apply a blocked or failed S3 plan.');
  }
  for (const operation of args.plan.operations) {
    assertSupportedOperation(operation);
  }
  if (args.context.account.production) {
    const expected = `${args.context.environment}:${args.context.account.expectedAccountId}:s3-apply`;
    if (args.options.productionConfirm !== expected) {
      throw new Error(
        `[AWS_S3_APPLY_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${expected}.`,
      );
    }
    const createdAt = Date.parse(args.plan.generatedAt);
    if (
      !args.options.force &&
      Number.isFinite(createdAt) &&
      Date.now() - createdAt > MAX_PRODUCTION_PLAN_AGE_MS
    ) {
      throw new Error(
        '[AWS_S3_APPLY_STALE_PRODUCTION_PLAN] Production S3 plan is older than 24 hours.',
      );
    }
  }
}

export class SdkAwsS3ApplyExecutor implements AwsS3ApplyExecutor {
  async applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsS3PlanOperation;
  }): Promise<AwsS3ApplyOperationResult> {
    const operation = args.operation;
    if (operation.action === 'no-op') {
      return { operation, status: 'skipped', message: 'No change required.' };
    }

    const client = new S3Client({
      region: args.context.account.region,
      ...(args.context.account.profile
        ? { credentials: fromIni({ profile: args.context.account.profile }) }
        : {}),
    });

    if (operation.action === 'create' && operation.check === 'bucket.exists') {
      await client.send(
        new CreateBucketCommand({
          Bucket: operation.bucketName,
          ...(args.context.account.region === 'us-east-1'
            ? {}
            : {
                CreateBucketConfiguration: {
                  LocationConstraint: args.context.account.region as BucketLocationConstraint,
                },
              }),
        }),
      );
      return { operation, status: 'succeeded', message: 'Bucket created.' };
    }

    if (operation.check === 'public-access-block') {
      const desired = desiredPublicAccessBlock(operation.desired);
      await client.send(
        new PutPublicAccessBlockCommand({
          Bucket: operation.bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: desired.blockPublicAcls,
            IgnorePublicAcls: desired.ignorePublicAcls,
            BlockPublicPolicy: desired.blockPublicPolicy,
            RestrictPublicBuckets: desired.restrictPublicBuckets,
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Block Public Access enabled.' };
    }

    if (operation.check === 'object-ownership') {
      const objectOwnership = desiredObjectOwnership(operation.desired);
      await client.send(
        new PutBucketOwnershipControlsCommand({
          Bucket: operation.bucketName,
          OwnershipControls: {
            Rules: [{ ObjectOwnership: objectOwnership }],
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Object ownership set.' };
    }

    if (operation.check === 'encryption') {
      if (operation.desired !== 'sse-s3') {
        throw new Error('[AWS_S3_APPLY_UNSUPPORTED_ENCRYPTION] Only sse-s3 is supported.');
      }
      await client.send(
        new PutBucketEncryptionCommand({
          Bucket: operation.bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Default SSE-S3 encryption set.' };
    }

    if (operation.check === 'tags') {
      const desired = desiredRecord(operation.desired);
      await client.send(
        new PutBucketTaggingCommand({
          Bucket: operation.bucketName,
          Tagging: {
            TagSet: Object.entries(desired).map(([Key, Value]) => ({ Key, Value })),
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Bucket tags applied.' };
    }

    if (operation.check === 'cors') {
      const desired = desiredCorsRules(operation.desired);
      await client.send(
        new PutBucketCorsCommand({
          Bucket: operation.bucketName,
          CORSConfiguration: {
            CORSRules: desired.map((rule) => ({
              AllowedMethods: rule.allowedMethods,
              AllowedOrigins: rule.allowedOrigins,
              AllowedHeaders: rule.allowedHeaders,
              ExposeHeaders: rule.exposeHeaders,
              ...(rule.maxAgeSeconds !== null ? { MaxAgeSeconds: rule.maxAgeSeconds } : {}),
            })),
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Bucket CORS applied.' };
    }

    if (operation.check === 'lifecycle.temporary-prefix') {
      const desired = desiredLifecycle(operation.desired);
      const current = currentLifecycleRules(operation.current);
      if (current.some((rule) => !rule.prefix || typeof rule.expirationDays !== 'number')) {
        throw new Error(
          '[AWS_S3_APPLY_UNSUPPORTED_LIFECYCLE] Existing lifecycle configuration is too complex for safe additive apply.',
        );
      }
      await client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: operation.bucketName,
          LifecycleConfiguration: {
            Rules: [
              ...current.map((rule) => ({
                ID: rule.id ?? sanitizeLifecycleId(rule.prefix ?? 'existing'),
                Status: rule.status === 'Disabled' ? ('Disabled' as const) : ('Enabled' as const),
                Filter: { Prefix: rule.prefix ?? '' },
                Expiration: { Days: rule.expirationDays ?? desired.expirationDays },
              })),
              {
                ID: sanitizeLifecycleId(desired.prefix),
                Status: 'Enabled',
                Filter: { Prefix: desired.prefix },
                Expiration: { Days: desired.expirationDays },
              },
            ],
          },
        }),
      );
      return { operation, status: 'succeeded', message: 'Temporary-prefix lifecycle rule added.' };
    }

    throw new Error(
      `[AWS_S3_APPLY_UNSUPPORTED_OPERATION] S3 apply cannot execute '${operation.action}:${operation.check}'.`,
    );
  }
}

async function applyOperations(args: {
  context: AwsCommandContext;
  plan: AwsS3PlanReport;
  executor: AwsS3ApplyExecutor;
}): Promise<AwsS3ApplyOperationResult[]> {
  const results: AwsS3ApplyOperationResult[] = [];
  for (const operation of args.plan.operations) {
    try {
      results.push(await args.executor.applyOperation({ context: args.context, operation }));
    } catch (error) {
      results.push({
        operation,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown S3 apply error.',
      });
      break;
    }
  }
  return results;
}

export async function runAwsS3Apply(
  options: AwsS3ApplyOptions,
  deps?: { identityReader?: AwsIdentityReader; executor?: AwsS3ApplyExecutor; now?: () => Date },
): Promise<AwsS3ApplyReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const { planPath, plan } = readPlan(context.cwd, options.planPath);
  validatePlanForApply({ context, plan, options });
  const executor = deps?.executor ?? new SdkAwsS3ApplyExecutor();
  const now = deps?.now ?? (() => new Date());
  const appliedAt = now();

  return await withAwsOperationLock({
    cwd: context.cwd,
    environment: context.environment,
    family: 's3-apply',
    run: async (lockPath) => {
      const results = await applyOperations({ context, plan, executor });
      const receipt: AwsS3ApplyReceipt = {
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
        defaultRelativePath: `.unisane/aws/${context.environment}/receipts/s3-apply-${awsSafeArtifactStamp(appliedAt)}.json`,
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

function printHumanApply(report: AwsS3ApplyReport): void {
  providerOutput.info(`AWS S3 apply: ${report.receipt.environment}`);
  for (const result of report.receipt.results) {
    providerOutput.info(
      `- [${result.status}] ${result.operation.bucketKey}.${result.operation.check}: ${result.message}`,
    );
  }
  providerOutput.info(`Receipt: ${report.artifact.relativePath}`);
}

export async function awsS3Apply(options: AwsS3ApplyOptions): Promise<number> {
  try {
    const report = await runAwsS3Apply(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanApply(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS S3 apply error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
