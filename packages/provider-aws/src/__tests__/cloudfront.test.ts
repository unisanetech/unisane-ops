import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createAwsCloudFrontPlan,
  runAwsCloudFrontApply,
  runAwsCloudFrontInvalidate,
  runAwsCloudFrontInventory,
  runAwsCloudFrontPlan,
  runAwsEnvOutput,
} from '../index.js';
import type {
  AwsCloudFrontApplyExecutor,
  AwsCloudFrontDistributionInventory,
  AwsCloudFrontInvalidationExecutor,
  AwsCloudFrontInventoryReader,
  AwsCloudFrontInventoryReport,
  AwsCloudFrontPlanReport,
  AwsCommandContext,
  AwsIdentityReader,
} from '../types.js';

function createTempProject(configSource: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-aws-cloudfront-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  writeFileSync(path.join(cwd, 'config/aws.ops.mjs'), configSource, 'utf8');
  return cwd;
}

function configSource(access = 'cloudfront-oac'): string {
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
      prefixes: [
        { path: 'platforms/resume/templates/', dataClass: 'public-assets' }
      ]
    }
  },
  certificates: {
    devAssetsCertificate: {
      environment: 'dev',
      domainName: 'assets.dev.unisane.test',
      subjectAlternativeNames: [],
      usage: 'cloudfront',
      region: 'us-east-1'
    }
  },
  mailIdentities: {
    trueResumeMail: {
      environment: 'dev',
      domain: 'mail.dev.unisane.test',
      mailFromDomain: 'bounce.dev.unisane.test',
      configurationSet: 'unisane-dev-true-resume-mail',
      eventDestinations: [
        {
          name: 'feedback',
          type: 'sns',
          topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
          matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
          enabled: true,
          subscriptions: [
            {
              protocol: 'https',
              endpoint: 'https://dev.unisane.test/api/rest/v1/webhooks/in/ses'
            }
          ]
        }
      ]
    }
  },
  cdn: {
    devAssets: {
      environment: 'dev',
      originBucket: 'devSharedStorage',
      access: '${access}',
      certificate: 'devAssetsCertificate',
      aliases: ['assets.dev.unisane.test'],
      publicPrefixes: ['platforms/resume/templates/']
    }
  },
  apps: {
    'true-resume': {
      environment: 'dev',
      storageBucket: 'devSharedStorage',
      objectDeliveryPublicBaseUrlFromCdn: 'devAssets',
      mailIdentity: 'trueResumeMail'
    },
    'data-entry-lm': {
      environment: 'dev',
      storageBucket: 'devSharedStorage'
    },
    'example-platform': {
      environment: 'dev',
      storageBucket: 'devSharedStorage'
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
    cwd: '/tmp/unisane-aws-cloudfront-test',
    configPath: '/tmp/unisane-aws-cloudfront-test/config/aws.ops.mjs',
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
          prefixes: [{ path: 'platforms/resume/templates/', dataClass: 'public-assets' }],
        },
      },
      certificates: {
        devAssetsCertificate: {
          environment: 'dev',
          domainName: 'assets.dev.unisane.test',
          subjectAlternativeNames: [],
          usage: 'cloudfront',
          region: 'us-east-1',
        },
      },
      cdn: {
        devAssets: {
          environment: 'dev',
          originBucket: 'devSharedStorage',
          access: 'cloudfront-oac',
          certificate: 'devAssetsCertificate',
          aliases: ['assets.dev.unisane.test'],
          publicPrefixes: ['platforms/resume/templates/'],
        },
      },
      apps: {
        'true-resume': {
          environment: 'dev',
          storageBucket: 'devSharedStorage',
          objectDeliveryPublicBaseUrlFromCdn: 'devAssets',
        },
        'data-entry-lm': {
          environment: 'dev',
          storageBucket: 'devSharedStorage',
        },
        'example-platform': {
          environment: 'dev',
          storageBucket: 'devSharedStorage',
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

function distributionInventory(
  overrides?: Partial<AwsCloudFrontDistributionInventory>,
): AwsCloudFrontDistributionInventory {
  return {
    key: 'devAssets',
    environment: 'dev',
    originBucketKey: 'devSharedStorage',
    originBucketName: 'unisane-dev-shared-storage-123456789012',
    distributionId: 'E1234567890',
    domainName: 'd111111abcdef8.cloudfront.net',
    enabled: true,
    status: 'Deployed',
    aliases: ['assets.dev.unisane.test'],
    originDomainName: 'unisane-dev-shared-storage-123456789012.s3.us-east-1.amazonaws.com',
    originAccessControlId: 'OAC123',
    originAccessControlName: 'unisane-dev-devAssets-s3-oac',
    viewerProtocolPolicy: 'redirect-to-https',
    viewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/dev-assets',
    viewerCertificateSource: 'acm',
    minimumProtocolVersion: 'TLSv1.2_2021',
    cachePolicyId: 'cache-policy',
    cachePolicyName: 'unisane-dev-devAssets-immutable-assets-cache',
    accessLoggingEnabled: null,
    accessLogBucket: null,
    accessLogPrefix: null,
    accessLogIncludeCookies: null,
    s3BucketPolicyAllowsDistribution: true,
    matchedBy: 'alias',
    desiredOriginDomainName: 'unisane-dev-shared-storage-123456789012.s3.us-east-1.amazonaws.com',
    desiredOriginAccessControlName: 'unisane-dev-devAssets-s3-oac',
    desiredCachePolicyName: 'unisane-dev-devAssets-immutable-assets-cache',
    desiredCertificateKey: 'devAssetsCertificate',
    desiredViewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/dev-assets',
    desiredViewerCertificateStatus: 'ISSUED',
    errors: [],
    ...overrides,
  };
}

function writeCloudFrontPlan(cwd: string, plan: AwsCloudFrontPlanReport): string {
  const relativePath = '.unisane/aws/dev/plans/test-cloudfront-apply-plan.json';
  const fullPath = path.join(cwd, relativePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return relativePath;
}

function inventoryReport(
  distribution: AwsCloudFrontDistributionInventory,
): AwsCloudFrontInventoryReport {
  const ctx = context();
  return {
    ok: distribution.errors.length === 0,
    environment: 'dev',
    generatedAt: '2026-05-14T00:00:00.000Z',
    configPath: ctx.configPath,
    account: ctx.account,
    distributions: [distribution],
    originAccessControls: [
      {
        id: 'OAC123',
        name: 'unisane-dev-devAssets-s3-oac',
        originType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    ],
    cachePolicies: [
      {
        id: 'cache-policy',
        name: 'unisane-dev-devAssets-immutable-assets-cache',
        comment: 'Managed by Unisane Ops for immutable versioned public assets.',
        defaultTtl: 31536000,
        maxTtl: 31536000,
        minTtl: 0,
      },
    ],
  };
}

describe('aws cloudfront inventory and plan', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('writes a read-only CloudFront inventory artifact with an injected reader', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsCloudFrontInventoryReader = {
      read: async () => ({
        distributions: [distributionInventory()],
        originAccessControls: [
          {
            id: 'OAC123',
            name: 'unisane-dev-devAssets-s3-oac',
            originType: 's3',
            signingBehavior: 'always',
            signingProtocol: 'sigv4',
          },
        ],
        cachePolicies: [
          {
            id: 'cache-policy',
            name: 'unisane-dev-devAssets-immutable-assets-cache',
            comment: 'Managed by Unisane Ops for immutable versioned public assets.',
            defaultTtl: 31536000,
            maxTtl: 31536000,
            minTtl: 0,
          },
        ],
      }),
    };

    const report = await runAwsCloudFrontInventory(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        output: '.unisane/aws/dev/inventory/test-cloudfront.json',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.artifact?.relativePath).toBe('.unisane/aws/dev/inventory/test-cloudfront.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/inventory/test-cloudfront.json'))).toBe(
      true,
    );
    const persisted = JSON.parse(
      readFileSync(path.join(cwd, '.unisane/aws/dev/inventory/test-cloudfront.json'), 'utf8'),
    ) as AwsCloudFrontInventoryReport;
    expect(persisted.distributions[0]?.distributionId).toBe('E1234567890');
  });

  it('plans distribution creation when no matching distribution exists', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          distributionId: null,
          domainName: null,
          aliases: [],
          originDomainName: null,
          originAccessControlId: null,
          originAccessControlName: null,
          viewerProtocolPolicy: null,
          matchedBy: 'none',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.create).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'create',
        check: 'distribution.exists',
        desired: expect.objectContaining({
          cachePolicyName: 'unisane-dev-devAssets-immutable-assets-cache',
        }),
      }),
    );
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'update',
          check: 's3-oac-bucket-policy',
        }),
      ]),
    );
  });

  it('blocks unsupported CloudFront access modes', () => {
    const ctx = context({
      config: {
        ...context().config,
        cdn: {
          devAssets: {
            ...context().config.cdn?.devAssets,
            environment: 'dev',
            originBucket: 'devSharedStorage',
            access: 'public-bucket',
          },
        },
      },
    });
    const plan = createAwsCloudFrontPlan({
      context: ctx,
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.summary.blocked).toBe(1);
  });

  it('plans updates for CloudFront origin, OAC, aliases, and viewer policy drift', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          aliases: [],
          originDomainName: 'old-bucket.s3.us-east-1.amazonaws.com',
          originAccessControlId: null,
          originAccessControlName: null,
          viewerProtocolPolicy: 'allow-all',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(4);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'origin-domain',
        'origin-access-control',
        'aliases',
        'viewer-protocol-policy',
      ]),
    );
  });

  it('blocks aliased CloudFront distributions until the configured ACM certificate is issued', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          desiredViewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/dev-assets',
          desiredViewerCertificateStatus: 'PENDING_VALIDATION',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.summary.blocked).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'blocked',
        check: 'viewer-certificate.unissued',
      }),
    );
  });

  it('plans viewer certificate attachment when CloudFront uses a different certificate', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          viewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/old',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'update',
        check: 'viewer-certificate',
        desired: expect.objectContaining({
          certificateKey: 'devAssetsCertificate',
          acmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/dev-assets',
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        }),
      }),
    );
  });

  it('plans viewer certificate attachment before alias updates', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          aliases: [],
          viewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/old',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining(['viewer-certificate', 'aliases']),
    );
    expect(
      plan.operations.findIndex((operation) => operation.check === 'viewer-certificate'),
    ).toBeLessThan(plan.operations.findIndex((operation) => operation.check === 'aliases'));
  });

  it('plans updates for CloudFront immutable cache policy drift', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          cachePolicyId: 'managed-cache-policy',
          cachePolicyName: 'Managed-CachingOptimized',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'update',
        check: 'cache-policy',
        desired: expect.objectContaining({
          name: 'unisane-dev-devAssets-immutable-assets-cache',
          defaultTtlSeconds: 31536000,
          compression: 'brotli-and-gzip',
        }),
      }),
    );
  });

  it('plans access-log attachment when configured logging is missing', () => {
    const baseContext = context();
    const ctx = context({
      config: {
        ...baseContext.config,
        buckets: {
          ...baseContext.config.buckets,
          devAccessLogs: {
            environment: 'dev',
            name: 'unisane-dev-access-logs-123456789012',
            blockPublicAccess: true,
            objectOwnership: 'bucket-owner-preferred',
            encryption: { type: 'sse-s3' },
            prefixes: [{ path: 'cloudfront/', dataClass: 'logs' }],
          },
        },
        cdn: {
          devAssets: {
            ...baseContext.config.cdn?.devAssets,
            environment: 'dev',
            originBucket: 'devSharedStorage',
            access: 'cloudfront-oac',
            certificate: 'devAssetsCertificate',
            aliases: ['assets.dev.unisane.test'],
            publicPrefixes: ['platforms/resume/templates/'],
            accessLogs: {
              bucket: 'devAccessLogs',
              prefix: 'cloudfront/dev-assets/',
              includeCookies: false,
            },
          },
        },
      },
    });
    const plan = createAwsCloudFrontPlan({
      context: ctx,
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'update',
        check: 'access-logging',
        desired: {
          enabled: true,
          bucketKey: 'devAccessLogs',
          bucket: 'unisane-dev-access-logs-123456789012.s3.amazonaws.com',
          prefix: 'cloudfront/dev-assets/',
          includeCookies: false,
        },
      }),
    );
  });

  it('blocks CloudFront standard access logs for bucket-owner-enforced log buckets', () => {
    const baseContext = context();
    const ctx = context({
      config: {
        ...baseContext.config,
        buckets: {
          ...baseContext.config.buckets,
          devAccessLogs: {
            environment: 'dev',
            name: 'unisane-dev-access-logs-123456789012',
            blockPublicAccess: true,
            objectOwnership: 'bucket-owner-enforced',
            encryption: { type: 'sse-s3' },
            prefixes: [{ path: 'cloudfront/', dataClass: 'logs' }],
          },
        },
        cdn: {
          devAssets: {
            ...baseContext.config.cdn?.devAssets,
            environment: 'dev',
            originBucket: 'devSharedStorage',
            access: 'cloudfront-oac',
            certificate: 'devAssetsCertificate',
            aliases: ['assets.dev.unisane.test'],
            publicPrefixes: ['platforms/resume/templates/'],
            accessLogs: {
              bucket: 'devAccessLogs',
            },
          },
        },
      },
    });
    const plan = createAwsCloudFrontPlan({
      context: ctx,
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'blocked',
        check: 'access-logging.bucket-ownership',
      }),
    );
  });

  it('plans S3 OAC bucket-policy attachment when inventory cannot prove it', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          s3BucketPolicyAllowsDistribution: null,
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(1);
    expect(plan.operations[0]).toEqual(
      expect.objectContaining({
        action: 'update',
        check: 's3-oac-bucket-policy',
      }),
    );
  });

  it('plans no-op when CloudFront state matches desired checks', () => {
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.summary['no-op']).toBe(1);
  });

  it('writes a CloudFront plan artifact with an injected inventory reader', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsCloudFrontInventoryReader = {
      read: async () => ({
        distributions: [distributionInventory()],
        originAccessControls: [],
        cachePolicies: [],
      }),
    };

    const report = await runAwsCloudFrontPlan(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        output: '.unisane/aws/dev/plans/test-cloudfront-plan.json',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.artifact?.relativePath).toBe('.unisane/aws/dev/plans/test-cloudfront-plan.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/plans/test-cloudfront-plan.json'))).toBe(
      true,
    );
  });

  it('refuses CloudFront apply without explicit yes', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(distributionInventory({ s3BucketPolicyAllowsDistribution: null })),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);

    await expect(
      runAwsCloudFrontApply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('[AWS_CLOUDFRONT_APPLY_REQUIRES_YES]');
  });

  it('refuses blocked CloudFront plans before executor mutation', async () => {
    const cwd = createTempProject(configSource('public-bucket'));
    tempProjects.push(cwd);
    const ctx = context({
      config: {
        ...context().config,
        cdn: {
          devAssets: {
            environment: 'dev',
            originBucket: 'devSharedStorage',
            access: 'public-bucket',
          },
        },
      },
    });
    const plan = createAwsCloudFrontPlan({
      context: ctx,
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);
    const executor: AwsCloudFrontApplyExecutor = {
      applyOperation: async () => {
        throw new Error('executor should not run');
      },
    };

    await expect(
      runAwsCloudFrontApply(
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
    ).rejects.toThrow('[AWS_CLOUDFRONT_APPLY_BLOCKED_PLAN]');
  });

  it('writes a CloudFront apply receipt with an injected executor', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(distributionInventory({ s3BucketPolicyAllowsDistribution: null })),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);
    const executed: string[] = [];
    const executor: AwsCloudFrontApplyExecutor = {
      applyOperation: async ({ operation }) => {
        executed.push(operation.check);
        return { operation, status: 'succeeded', message: 'mock applied' };
      },
    };

    const report = await runAwsCloudFrontApply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-cloudfront-apply-receipt.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T00:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(executed).toEqual(['s3-oac-bucket-policy']);
    expect(report.artifact.relativePath).toBe(
      '.unisane/aws/dev/receipts/test-cloudfront-apply-receipt.json',
    );
    expect(existsSync(path.join(cwd, report.artifact.relativePath))).toBe(true);
    expect(report.receipt.kind).toBe('unisane.aws.cloudfront-apply-receipt');
  });

  it('allows reviewed viewer-certificate apply operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(
        distributionInventory({
          viewerCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/old',
        }),
      ),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);
    const executor: AwsCloudFrontApplyExecutor = {
      applyOperation: async ({ operation }) => ({
        operation,
        status: 'succeeded',
        message: 'mock applied',
      }),
    };

    const report = await runAwsCloudFrontApply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-cloudfront-certificate-apply.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T00:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(report.receipt.results[0]?.operation.check).toBe('viewer-certificate');
  });

  it('allows reviewed access-logging apply operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const baseContext = context();
    const ctx = context({
      config: {
        ...baseContext.config,
        buckets: {
          ...baseContext.config.buckets,
          devAccessLogs: {
            environment: 'dev',
            name: 'unisane-dev-access-logs-123456789012',
            blockPublicAccess: true,
            objectOwnership: 'bucket-owner-preferred',
            encryption: { type: 'sse-s3' },
            prefixes: [{ path: 'cloudfront/', dataClass: 'logs' }],
          },
        },
        cdn: {
          devAssets: {
            ...baseContext.config.cdn?.devAssets,
            environment: 'dev',
            originBucket: 'devSharedStorage',
            access: 'cloudfront-oac',
            certificate: 'devAssetsCertificate',
            aliases: ['assets.dev.unisane.test'],
            publicPrefixes: ['platforms/resume/templates/'],
            accessLogs: {
              bucket: 'devAccessLogs',
              prefix: 'cloudfront/dev-assets/',
              includeCookies: false,
            },
          },
        },
      },
    });
    const plan = createAwsCloudFrontPlan({
      context: ctx,
      inventory: inventoryReport(distributionInventory()),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);
    const executor: AwsCloudFrontApplyExecutor = {
      applyOperation: async ({ operation }) => ({
        operation,
        status: 'succeeded',
        message: 'mock applied',
      }),
    };

    const report = await runAwsCloudFrontApply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-cloudfront-access-logging-apply.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T00:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(report.receipt.results[0]?.operation.check).toBe('access-logging');
  });

  it('refuses unsupported CloudFront apply operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const ctx = context();
    const plan: AwsCloudFrontPlanReport = {
      ok: true,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: ctx.configPath,
      account: ctx.account,
      operations: [
        {
          action: 'update',
          cdnKey: 'devAssets',
          distributionId: 'E1234567890',
          check: 'invalidation',
          message: 'Unsupported in this slice.',
          current: null,
          desired: '/*',
        },
      ],
      summary: { create: 0, update: 1, blocked: 0, 'no-op': 0 },
    };
    const planPath = writeCloudFrontPlan(cwd, plan);

    await expect(
      runAwsCloudFrontApply(
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
    ).rejects.toThrow('[AWS_CLOUDFRONT_APPLY_UNSUPPORTED_OPERATION]');
  });

  it('refuses CloudFront apply while the environment lock exists', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsCloudFrontPlan({
      context: context(),
      inventory: inventoryReport(distributionInventory({ s3BucketPolicyAllowsDistribution: null })),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeCloudFrontPlan(cwd, plan);
    const lockPath = path.join(cwd, '.unisane/aws/dev/locks/cloudfront-apply.lock.json');
    mkdirSync(path.dirname(lockPath), { recursive: true });
    writeFileSync(lockPath, '{}\n', 'utf8');

    await expect(
      runAwsCloudFrontApply(
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
    ).rejects.toThrow('[AWS_APPLY_LOCKED]');
  });

  it('refuses CloudFront invalidation without explicit yes', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    await expect(
      runAwsCloudFrontInvalidate(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          cdnKey: 'devAssets',
          accountConfirm: '123456789012',
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('[AWS_CLOUDFRONT_INVALIDATE_REQUIRES_YES]');
  });

  it('writes a CloudFront invalidation receipt with default public-prefix paths', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsCloudFrontInventoryReader = {
      read: async () => ({
        distributions: [distributionInventory()],
        originAccessControls: [],
        cachePolicies: [],
      }),
    };
    const executor: AwsCloudFrontInvalidationExecutor = {
      createInvalidation: async ({ paths }) => ({
        invalidationId: 'I1234567890',
        status: 'InProgress',
        message: `invalidated ${paths.join(',')}`,
      }),
    };

    const report = await runAwsCloudFrontInvalidate(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        cdnKey: 'devAssets',
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-cloudfront-invalidation.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        inventoryReader,
        executor,
        now: () => new Date('2026-05-14T00:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(report.receipt.paths).toEqual(['/platforms/resume/templates/*']);
    expect(report.receipt.invalidationId).toBe('I1234567890');
    expect(report.artifact.relativePath).toBe(
      '.unisane/aws/dev/receipts/test-cloudfront-invalidation.json',
    );
  });

  it('emits secret-free app env output with CloudFront public asset base URL', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsCloudFrontInventoryReader = {
      read: async () => ({
        distributions: [distributionInventory()],
        originAccessControls: [],
        cachePolicies: [],
      }),
    };

    const report = await runAwsEnvOutput(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        appKey: 'true-resume',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.variables).toEqual(
      expect.arrayContaining([
        {
          name: 'AWS_REGION',
          value: 'us-east-1',
          source: 'environment.region',
          sensitive: false,
        },
        {
          name: 'STORAGE_BUCKET',
          value: 'unisane-dev-shared-storage-123456789012',
          source: 'app.storageBucket',
          sensitive: false,
        },
        {
          name: 'OBJECT_DELIVERY_PROVIDER',
          value: 'public-base-url',
          source: 'app.objectDeliveryPublicBaseUrlFromCdn',
          sensitive: false,
        },
        {
          name: 'OBJECT_DELIVERY_PUBLIC_BASE_URL',
          value: 'https://assets.dev.unisane.test',
          source: 'app.objectDeliveryPublicBaseUrlFromCdn',
          sensitive: false,
        },
        {
          name: 'SES_IDENTITY_DOMAIN',
          value: 'mail.dev.unisane.test',
          source: 'app.mailIdentity.domain',
          sensitive: false,
        },
        {
          name: 'SES_MAIL_FROM_DOMAIN',
          value: 'bounce.dev.unisane.test',
          source: 'app.mailIdentity.mailFromDomain',
          sensitive: false,
        },
        {
          name: 'SES_CONFIGURATION_SET',
          value: 'unisane-dev-true-resume-mail',
          source: 'app.mailIdentity.configurationSet',
          sensitive: false,
        },
        {
          name: 'SES_SNS_TOPIC_ARN',
          value: 'arn:aws:sns:us-east-1:123456789012:ses-events',
          source: 'app.mailIdentity.eventDestinations.sns.topicArn',
          sensitive: false,
        },
      ]),
    );
  });

  it('emits app env output from an environment-scoped app entry', async () => {
    const source = configSource().replace(
      `    'true-resume': {
      environment: 'dev',
      storageBucket: 'devSharedStorage',
      objectDeliveryPublicBaseUrlFromCdn: 'devAssets',
      mailIdentity: 'trueResumeMail'
    },`,
      `    'true-resume': {
      environments: {
        dev: {
          storageBucket: 'devSharedStorage',
          objectDeliveryPublicBaseUrlFromCdn: 'devAssets',
          mailIdentity: 'trueResumeMail'
        }
      }
    },`,
    );
    const cwd = createTempProject(source);
    tempProjects.push(cwd);
    const inventoryReader: AwsCloudFrontInventoryReader = {
      read: async () => ({
        distributions: [distributionInventory()],
        originAccessControls: [],
        cachePolicies: [],
      }),
    };

    const report = await runAwsEnvOutput(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        appKey: 'true-resume',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.variables).toEqual(
      expect.arrayContaining([
        {
          name: 'OBJECT_DELIVERY_PUBLIC_BASE_URL',
          value: 'https://assets.dev.unisane.test',
          source: 'app.objectDeliveryPublicBaseUrlFromCdn',
          sensitive: false,
        },
      ]),
    );
  });

  it('emits storage-only app env output without CloudFront inventory', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = await runAwsEnvOutput(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        appKey: 'data-entry-lm',
      },
      { identityReader: identityReader() },
    );

    expect(report.ok).toBe(true);
    expect(report.variables).toEqual([
      {
        name: 'AWS_REGION',
        value: 'us-east-1',
        source: 'environment.region',
        sensitive: false,
      },
      {
        name: 'STORAGE_BUCKET',
        value: 'unisane-dev-shared-storage-123456789012',
        source: 'app.storageBucket',
        sensitive: false,
      },
    ]);
  });
});
