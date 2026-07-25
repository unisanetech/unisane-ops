import { describe, expect, it } from 'vitest';
import { createAwsAuditReport, createAwsIamPolicyReport } from '../index.js';
import type { AwsCommandContext } from '../types.js';

function context(overrides?: Partial<AwsCommandContext>): AwsCommandContext {
  return {
    cwd: '/tmp/unisane-aws-audit-test',
    configPath: '/tmp/unisane-aws-audit-test/config/aws.ops.mjs',
    environment: 'prod',
    config: {
      defaults: {
        tags: {
          Project: 'Unisane',
          ManagedBy: 'unisane-devtools',
          Owner: 'architecture-program',
        },
      },
      accounts: {
        prod: {
          accountId: '123456789012',
          profile: 'unisane-prod',
          defaultRegion: 'us-east-1',
        },
      },
      environments: {
        prod: {
          account: 'prod',
          region: 'us-east-1',
          production: true,
        },
      },
      buckets: {
        prodAssets: {
          environment: 'prod',
          name: 'unisane-prod-public-assets-123456789012',
          blockPublicAccess: true,
          objectOwnership: 'bucket-owner-enforced',
          encryption: { type: 'sse-s3' },
          prefixes: [{ path: 'true-resume/templates/', dataClass: 'public-assets' }],
        },
      },
      cdn: {
        prodAssets: {
          environment: 'prod',
          originBucket: 'prodAssets',
          access: 'cloudfront-oac',
          certificate: 'prodAssetsCertificate',
          aliases: ['assets.unisane.test'],
          publicPrefixes: ['true-resume/templates/'],
        },
      },
      mailIdentities: {
        trueResumeMail: {
          environment: 'prod',
          domain: 'mail.unisane.test',
          mailFromDomain: 'bounce.unisane.test',
          configurationSet: 'unisane-prod-true-resume-mail',
        },
      },
      dnsZones: {
        unisane: {
          environment: 'prod',
          name: 'unisane.test',
          hostedZoneId: 'Z1234567890',
          provider: 'route53',
          privateZone: false,
        },
      },
      certificates: {
        prodAssetsCertificate: {
          environment: 'prod',
          domainName: 'assets.unisane.test',
          subjectAlternativeNames: [],
          usage: 'cloudfront',
          region: 'us-east-1',
          hostedZone: 'unisane',
        },
      },
    },
    account: {
      key: 'prod',
      expectedAccountId: '123456789012',
      actualAccountId: '123456789012',
      profile: 'unisane-prod',
      region: 'us-east-1',
      production: true,
    },
    ...overrides,
  };
}

describe('aws audit and IAM policy helpers', () => {
  it('reports production readiness errors for missing required posture', () => {
    const base = context();
    const report = createAwsAuditReport({
      context: context({
        config: {
          ...base.config,
          buckets: {
            prodAssets: {
              environment: 'prod',
              name: 'unisane-prod-public-assets-123456789012',
              blockPublicAccess: true,
            },
          },
          mailIdentities: {
            trueResumeMail: {
              environment: 'prod',
              domain: 'mail.unisane.test',
            },
          },
        },
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(report.ok).toBe(false);
    expect(report.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        's3.prefix-data-class',
        's3.encryption',
        's3.object-ownership',
        'ses.mail-from',
        'ses.configuration-set',
      ]),
    );
  });

  it('generates IAM policy statements for configured AWS control-plane families', () => {
    const report = createAwsIamPolicyReport({
      context: context(),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(report.ok).toBe(true);
    expect(report.policy.Statement.map((statement) => statement.Sid)).toEqual(
      expect.arrayContaining([
        'UnisaneManagedS3Buckets',
        'UnisaneManagedS3Objects',
        'UnisaneManagedCloudFront',
        'UnisaneManagedSes',
        'UnisaneManagedAcm',
        'UnisaneManagedRoute53Zones',
      ]),
    );
    expect(
      report.policy.Statement.find((statement) => statement.Sid === 'UnisaneManagedS3Buckets')
        ?.Resource,
    ).toContain('arn:aws:s3:::unisane-prod-public-assets-123456789012');
  });
});
