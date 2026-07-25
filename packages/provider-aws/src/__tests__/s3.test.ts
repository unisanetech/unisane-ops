import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createAwsS3Plan, runAwsS3Apply, runAwsS3Inventory } from '../index.js';
import type {
  AwsCommandContext,
  AwsIdentityReader,
  AwsS3ApplyExecutor,
  AwsS3BucketInventory,
  AwsS3InventoryReader,
  AwsS3InventoryReport,
  AwsS3PlanReport,
} from '../types.js';

function createTempProject(configSource: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-aws-s3-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  writeFileSync(path.join(cwd, 'config/aws.ops.mjs'), configSource, 'utf8');
  return cwd;
}

function configSource(): string {
  return `export default {
  defaults: {
    tags: {
      Project: 'Unisane',
      ManagedBy: 'unisane-devtools',
      Owner: 'architecture-program'
    }
  },
  accounts: {
    dev: {
      accountId: '123456789012',
      profile: 'unisane-dev',
      defaultRegion: 'us-east-1'
    }
  },
  environments: {
    dev: {
      account: 'dev',
      region: 'us-east-1',
      production: false
    }
  },
  buckets: {
    devSharedStorage: {
      environment: 'dev',
      name: 'unisane-dev-shared-storage-123456789012',
      blockPublicAccess: true,
      objectOwnership: 'bucket-owner-enforced',
      encryption: { type: 'sse-s3' },
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['PUT', 'POST', 'GET', 'HEAD'],
        allowedHeaders: ['*'],
        exposeHeaders: ['ETag'],
        maxAgeSeconds: 3000
      },
      prefixes: [
        { path: 'true-resume/templates/', dataClass: 'public-assets' },
        { path: 'shared/tmp/', dataClass: 'temporary' }
      ]
    }
  }
};`;
}

function identityReader(): AwsIdentityReader {
  return {
    read: async () => ({
      accountId: '123456789012',
      arn: 'arn:aws:iam::123456789012:user/dev',
      userId: 'user-id',
    }),
  };
}

function context(overrides?: Partial<AwsCommandContext>): AwsCommandContext {
  return {
    cwd: '/tmp/unisane-aws-s3-test',
    configPath: '/tmp/unisane-aws-s3-test/config/aws.ops.mjs',
    environment: 'dev',
    config: {
      defaults: {
        tags: {
          Project: 'Unisane',
          ManagedBy: 'unisane-devtools',
          Owner: 'architecture-program',
        },
      },
      accounts: {
        dev: {
          accountId: '123456789012',
          profile: 'unisane-dev',
          defaultRegion: 'us-east-1',
        },
      },
      environments: {
        dev: {
          account: 'dev',
          region: 'us-east-1',
          production: false,
        },
      },
      buckets: {
        devSharedStorage: {
          environment: 'dev',
          name: 'unisane-dev-shared-storage-123456789012',
          blockPublicAccess: true,
          objectOwnership: 'bucket-owner-enforced',
          encryption: { type: 'sse-s3' },
          cors: {
            allowedOrigins: ['http://localhost:3000'],
            allowedMethods: ['PUT', 'POST', 'GET', 'HEAD'],
            allowedHeaders: ['*'],
            exposeHeaders: ['ETag'],
            maxAgeSeconds: 3000,
          },
          prefixes: [
            { path: 'true-resume/templates/', dataClass: 'public-assets' },
            { path: 'shared/tmp/', dataClass: 'temporary' },
          ],
        },
      },
    },
    account: {
      key: 'dev',
      expectedAccountId: '123456789012',
      actualAccountId: '123456789012',
      profile: 'unisane-dev',
      region: 'us-east-1',
      production: false,
    },
    ...overrides,
  };
}

function bucketInventory(overrides?: Partial<AwsS3BucketInventory>): AwsS3BucketInventory {
  return {
    key: 'devSharedStorage',
    name: 'unisane-dev-shared-storage-123456789012',
    environment: 'dev',
    exists: true,
    expectedRegion: 'us-east-1',
    publicAccessBlock: {
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: true,
      restrictPublicBuckets: true,
    },
    objectOwnership: 'bucket-owner-enforced',
    encryption: 'sse-s3',
    tags: {
      Project: 'Unisane',
      ManagedBy: 'unisane-devtools',
      Owner: 'architecture-program',
      Environment: 'dev',
      DataClass: 'public-assets+temporary',
    },
    corsConfigured: false,
    corsRules: [
      {
        allowedMethods: ['GET', 'HEAD', 'POST', 'PUT'],
        allowedOrigins: ['http://localhost:3000'],
        allowedHeaders: ['*'],
        exposeHeaders: ['ETag'],
        maxAgeSeconds: 3000,
      },
    ],
    lifecycleRules: [
      {
        id: 'expire-temporary',
        status: 'Enabled',
        prefix: 'shared/tmp/',
        expirationDays: 30,
      },
    ],
    errors: [],
    ...overrides,
  };
}

function inventoryReport(bucket: AwsS3BucketInventory): AwsS3InventoryReport {
  const ctx = context();
  return {
    ok: bucket.errors.length === 0,
    environment: 'dev',
    generatedAt: '2026-05-14T00:00:00.000Z',
    configPath: ctx.configPath,
    account: ctx.account,
    buckets: [bucket],
  };
}

function writePlan(cwd: string, plan: AwsS3PlanReport): string {
  const planPath = path.join(cwd, '.unisane/aws/dev/plans/s3-plan.json');
  mkdirSync(path.dirname(planPath), { recursive: true });
  writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return '.unisane/aws/dev/plans/s3-plan.json';
}

describe('aws s3 inventory and plan', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('writes a read-only inventory artifact with an injected reader', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsS3InventoryReader = {
      readBucket: async ({ bucketKey, bucket, context: awsContext }) =>
        bucketInventory({
          key: bucketKey,
          name: bucket.name,
          environment: awsContext.environment,
        }),
    };

    const report = await runAwsS3Inventory(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        output: '.unisane/aws/dev/inventory/test-s3.json',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.artifact?.relativePath).toBe('.unisane/aws/dev/inventory/test-s3.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/inventory/test-s3.json'))).toBe(true);
    const persisted = JSON.parse(
      readFileSync(path.join(cwd, '.unisane/aws/dev/inventory/test-s3.json'), 'utf8'),
    ) as AwsS3InventoryReport;
    expect(persisted.buckets[0]?.name).toBe('unisane-dev-shared-storage-123456789012');
  });

  it('plans bucket creation when the configured bucket is missing', () => {
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(bucketInventory({ exists: false })),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.create).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'create',
        check: 'bucket.exists',
      }),
    );
  });

  it('blocks desired public bucket access', () => {
    const ctx = context({
      config: {
        ...context().config,
        buckets: {
          devSharedStorage: {
            ...context().config.buckets?.devSharedStorage,
            environment: 'dev',
            name: 'unisane-dev-shared-storage-123456789012',
            blockPublicAccess: false,
          },
        },
      },
    });

    const plan = createAwsS3Plan({
      context: ctx,
      inventory: inventoryReport(bucketInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.summary.blocked).toBe(1);
  });

  it('plans posture updates for weak existing bucket settings', () => {
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(
        bucketInventory({
          publicAccessBlock: {
            blockPublicAcls: false,
            ignorePublicAcls: false,
            blockPublicPolicy: false,
            restrictPublicBuckets: false,
          },
          objectOwnership: 'object-writer',
          encryption: null,
          tags: {},
          lifecycleRules: [],
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBeGreaterThanOrEqual(5);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'public-access-block',
        'object-ownership',
        'encryption',
        'tags',
        'lifecycle.temporary-prefix',
      ]),
    );
  });

  it('blocks production buckets without classified prefixes', () => {
    const base = context();
    const ctx = context({
      environment: 'prod',
      config: {
        ...base.config,
        environments: {
          prod: {
            account: 'dev',
            region: 'us-east-1',
            production: true,
          },
        },
        buckets: {
          prodPrivate: {
            environment: 'prod',
            name: 'unisane-prod-private-123456789012',
            blockPublicAccess: true,
            objectOwnership: 'bucket-owner-enforced',
            encryption: { type: 'sse-s3' },
          },
        },
      },
      account: {
        ...base.account,
        production: true,
      },
    });

    const plan = createAwsS3Plan({
      context: ctx,
      inventory: {
        ...inventoryReport(
          bucketInventory({
            key: 'prodPrivate',
            name: 'unisane-prod-private-123456789012',
            environment: 'prod',
          }),
        ),
        environment: 'prod',
        buckets: [
          bucketInventory({
            key: 'prodPrivate',
            name: 'unisane-prod-private-123456789012',
            environment: 'prod',
          }),
        ],
      },
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'blocked',
        check: 'prefix.data-class.production',
      }),
    );
  });

  it('plans CORS updates for browser upload buckets', () => {
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(bucketInventory({ corsConfigured: false, corsRules: [] })),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        action: 'update',
        check: 'cors',
      }),
    );
  });

  it('plans no-op when existing bucket state matches desired checks', () => {
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(bucketInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.summary['no-op']).toBe(1);
    expect(plan.operations[0]?.action).toBe('no-op');
  });

  it('refuses S3 apply without explicit confirmation', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(bucketInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writePlan(cwd, plan);

    await expect(
      runAwsS3Apply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_S3_APPLY_REQUIRES_YES');
  });

  it('refuses blocked S3 apply plans before executor calls', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const blockedPlan: AwsS3PlanReport = {
      ...createAwsS3Plan({
        context: context(),
        inventory: inventoryReport(bucketInventory()),
        generatedAt: '2026-05-14T00:00:00.000Z',
      }),
      ok: false,
      summary: { create: 0, update: 0, blocked: 1, 'no-op': 0 },
      operations: [
        {
          action: 'blocked',
          bucketKey: 'devSharedStorage',
          bucketName: 'unisane-dev-shared-storage-123456789012',
          check: 'public-access-block',
          message: 'blocked',
          current: null,
          desired: null,
        },
      ],
    };
    const planPath = writePlan(cwd, blockedPlan);
    const executor: AwsS3ApplyExecutor = {
      applyOperation: async () => {
        throw new Error('executor should not be called');
      },
    };

    await expect(
      runAwsS3Apply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader(), executor },
      ),
    ).rejects.toThrow('AWS_S3_APPLY_BLOCKED_PLAN');
  });

  it('refuses unsupported S3 apply operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan: AwsS3PlanReport = {
      ok: true,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: path.join(cwd, 'config/aws.ops.mjs'),
      account: context().account,
      summary: { create: 0, update: 1, blocked: 0, 'no-op': 0 },
      operations: [
        {
          action: 'update',
          bucketKey: 'devSharedStorage',
          bucketName: 'unisane-dev-shared-storage-123456789012',
          check: 'bucket-policy',
          message: 'unsupported',
          current: null,
          desired: null,
        },
      ],
    };
    const planPath = writePlan(cwd, plan);

    await expect(
      runAwsS3Apply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_S3_APPLY_UNSUPPORTED_OPERATION');
  });

  it('writes an S3 apply receipt for reviewed safe operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(
        bucketInventory({
          publicAccessBlock: {
            blockPublicAcls: false,
            ignorePublicAcls: false,
            blockPublicPolicy: false,
            restrictPublicBuckets: false,
          },
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writePlan(cwd, plan);
    const appliedChecks: string[] = [];
    const executor: AwsS3ApplyExecutor = {
      applyOperation: async ({ operation }) => {
        appliedChecks.push(operation.check);
        return { operation, status: 'succeeded', message: 'applied' };
      },
    };

    const report = await runAwsS3Apply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-s3-apply.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T01:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(appliedChecks).toContain('public-access-block');
    expect(report.artifact.relativePath).toBe('.unisane/aws/dev/receipts/test-s3-apply.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/receipts/test-s3-apply.json'))).toBe(true);
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/locks/s3-apply.lock.json'))).toBe(false);
  });

  it('refuses S3 apply while the local lock exists', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const lockPath = path.join(cwd, '.unisane/aws/dev/locks/s3-apply.lock.json');
    mkdirSync(path.dirname(lockPath), { recursive: true });
    writeFileSync(lockPath, '{}\n', 'utf8');
    const plan = createAwsS3Plan({
      context: context(),
      inventory: inventoryReport(bucketInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writePlan(cwd, plan);

    await expect(
      runAwsS3Apply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_APPLY_LOCKED');
  });
});
