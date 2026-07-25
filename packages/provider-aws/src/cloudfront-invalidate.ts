import { CreateInvalidationCommand, CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { log } from '@unisane/cli-core';
import { awsSafeArtifactStamp, writeAwsJsonArtifact } from './artifacts.js';
import {
  collectAwsCloudFrontInventory,
  SdkAwsCloudFrontInventoryReader,
} from './cloudfront-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import { withAwsOperationLock } from './lock.js';
import type {
  AwsCloudFrontInvalidationExecutor,
  AwsCloudFrontInvalidationReceipt,
  AwsCloudFrontInvalidationReport,
  AwsCloudFrontInvalidateOptions,
  AwsCloudFrontInventoryReader,
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsCdnConfig,
} from './types.js';

const RECEIPT_KIND = 'unisane.aws.cloudfront-invalidation-receipt' as const;

function cloudFrontClient(context: AwsCommandContext): CloudFrontClient {
  return new CloudFrontClient({
    region: 'us-east-1',
    ...(context.account.profile
      ? { credentials: fromIni({ profile: context.account.profile }) }
      : {}),
  });
}

function configuredCdn(context: AwsCommandContext, cdnKey: string): AwsOpsCdnConfig {
  const cdn = context.config.cdn?.[cdnKey];
  if (!cdn || cdn.environment !== context.environment) {
    throw new Error(
      `[AWS_CLOUDFRONT_INVALIDATE_UNKNOWN_CDN] Unknown CDN '${cdnKey}' for environment '${context.environment}'.`,
    );
  }
  if (cdn.access !== 'cloudfront-oac') {
    throw new Error(
      `[AWS_CLOUDFRONT_INVALIDATE_UNSUPPORTED_ACCESS] CDN '${cdnKey}' must use cloudfront-oac access.`,
    );
  }
  return cdn;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed)
    throw new Error('[AWS_CLOUDFRONT_INVALIDATE_EMPTY_PATH] Invalidation path cannot be empty.');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function defaultPaths(cdn: AwsOpsCdnConfig): string[] {
  const prefixes = cdn.publicPrefixes ?? [];
  if (prefixes.length === 0) {
    throw new Error(
      '[AWS_CLOUDFRONT_INVALIDATE_PATHS_REQUIRED] Provide --paths or configure publicPrefixes for the CDN.',
    );
  }
  return prefixes.map((prefix) => normalizePath(`${prefix.replace(/^\/+/, '')}*`));
}

function normalizePaths(options: AwsCloudFrontInvalidateOptions, cdn: AwsOpsCdnConfig): string[] {
  const paths = options.paths && options.paths.length > 0 ? options.paths : defaultPaths(cdn);
  return [...new Set(paths.map((path) => normalizePath(path)))];
}

function validateInvalidationForApply(args: {
  context: AwsCommandContext;
  options: AwsCloudFrontInvalidateOptions;
}): void {
  if (!args.options.yes) {
    throw new Error(
      '[AWS_CLOUDFRONT_INVALIDATE_REQUIRES_YES] CloudFront invalidation requires --yes.',
    );
  }
  if (args.options.accountConfirm !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_CLOUDFRONT_INVALIDATE_ACCOUNT_CONFIRM_REQUIRED] Expected --account-confirm ${args.context.account.expectedAccountId}.`,
    );
  }
  if (args.context.account.production) {
    const expected = `${args.context.environment}:${args.context.account.expectedAccountId}:cloudfront-invalidate`;
    if (args.options.productionConfirm !== expected) {
      throw new Error(
        `[AWS_CLOUDFRONT_INVALIDATE_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${expected}.`,
      );
    }
  }
}

async function resolveDistributionId(args: {
  context: AwsCommandContext;
  cdnKey: string;
  inventoryReader: AwsCloudFrontInventoryReader;
}): Promise<string> {
  const inventory = await collectAwsCloudFrontInventory({
    context: args.context,
    reader: args.inventoryReader,
  });
  const distribution = inventory.distributions.find((entry) => entry.key === args.cdnKey);
  if (!inventory.ok || distribution?.errors.length) {
    throw new Error(
      `[AWS_CLOUDFRONT_INVALIDATE_INVENTORY_FAILED] Could not read CloudFront inventory for '${args.cdnKey}'.`,
    );
  }
  if (!distribution?.distributionId) {
    throw new Error(
      `[AWS_CLOUDFRONT_INVALIDATE_MISSING_DISTRIBUTION] No CloudFront distribution found for '${args.cdnKey}'.`,
    );
  }
  return distribution.distributionId;
}

export class SdkAwsCloudFrontInvalidationExecutor implements AwsCloudFrontInvalidationExecutor {
  async createInvalidation(args: {
    context: AwsCommandContext;
    cdnKey: string;
    distributionId: string;
    paths: string[];
  }): Promise<{ invalidationId: string | null; status: string | null; message: string }> {
    const client = cloudFrontClient(args.context);
    const response = await client.send(
      new CreateInvalidationCommand({
        DistributionId: args.distributionId,
        InvalidationBatch: {
          CallerReference: `unisane-${args.context.environment}-${args.cdnKey}-${Date.now()}`,
          Paths: {
            Quantity: args.paths.length,
            Items: args.paths,
          },
        },
      }),
    );
    return {
      invalidationId: response.Invalidation?.Id ?? null,
      status: response.Invalidation?.Status ?? null,
      message: 'CloudFront invalidation requested.',
    };
  }
}

export async function runAwsCloudFrontInvalidate(
  options: AwsCloudFrontInvalidateOptions,
  deps?: {
    identityReader?: AwsIdentityReader;
    inventoryReader?: AwsCloudFrontInventoryReader;
    executor?: AwsCloudFrontInvalidationExecutor;
    now?: () => Date;
  },
): Promise<AwsCloudFrontInvalidationReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const cdn = configuredCdn(context, options.cdnKey);
  validateInvalidationForApply({ context, options });
  const paths = normalizePaths(options, cdn);
  const requestedAt = (deps?.now ?? (() => new Date()))();
  const inventoryReader = deps?.inventoryReader ?? new SdkAwsCloudFrontInventoryReader();
  const distributionId = await resolveDistributionId({
    context,
    cdnKey: options.cdnKey,
    inventoryReader,
  });
  const executor = deps?.executor ?? new SdkAwsCloudFrontInvalidationExecutor();

  return await withAwsOperationLock({
    cwd: context.cwd,
    environment: context.environment,
    family: 'cloudfront-invalidate',
    run: async (lockPath) => {
      let receipt: AwsCloudFrontInvalidationReceipt;
      try {
        const result = await executor.createInvalidation({
          context,
          cdnKey: options.cdnKey,
          distributionId,
          paths,
        });
        receipt = {
          version: 1,
          kind: RECEIPT_KIND,
          status: 'succeeded',
          environment: context.environment,
          account: context.account,
          cdnKey: options.cdnKey,
          distributionId,
          paths,
          invalidationId: result.invalidationId,
          invalidationStatus: result.status,
          requestedAt: requestedAt.toISOString(),
          completedAt: (deps?.now ?? (() => new Date()))().toISOString(),
          lockPath,
          message: result.message,
        };
      } catch (error) {
        receipt = {
          version: 1,
          kind: RECEIPT_KIND,
          status: 'failed',
          environment: context.environment,
          account: context.account,
          cdnKey: options.cdnKey,
          distributionId,
          paths,
          invalidationId: null,
          invalidationStatus: null,
          requestedAt: requestedAt.toISOString(),
          completedAt: (deps?.now ?? (() => new Date()))().toISOString(),
          lockPath,
          message:
            error instanceof Error ? error.message : 'Unknown CloudFront invalidation error.',
        };
      }
      const artifact = writeAwsJsonArtifact({
        cwd: context.cwd,
        outputPath: options.receiptOutput,
        defaultRelativePath: `.unisane/aws/${context.environment}/receipts/cloudfront-invalidation-${awsSafeArtifactStamp(requestedAt)}.json`,
        value: receipt,
      });
      return { ok: receipt.status === 'succeeded', receipt, artifact };
    },
  });
}

function printHumanInvalidate(report: AwsCloudFrontInvalidationReport): void {
  log.info(`AWS CloudFront invalidation: ${report.receipt.environment}`);
  log.info(`CDN: ${report.receipt.cdnKey}`);
  log.info(`Distribution: ${report.receipt.distributionId}`);
  log.info(`Paths: ${report.receipt.paths.join(', ')}`);
  log.info(`Status: ${report.receipt.status}`);
  log.info(`Receipt: ${report.artifact.relativePath}`);
}

export async function awsCloudFrontInvalidate(
  options: AwsCloudFrontInvalidateOptions,
): Promise<number> {
  try {
    const report = await runAwsCloudFrontInvalidate(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanInvalidate(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown AWS CloudFront invalidation error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
