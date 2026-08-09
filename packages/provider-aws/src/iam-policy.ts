import { providerOutput } from './cli-output.js';
import { writeAwsJsonArtifact } from './artifacts.js';
import { configuredCloudFrontForEnvironment } from './cloudfront-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import {
  configuredCertificatesForEnvironment,
  configuredDnsZonesForEnvironment,
  configuredMailIdentitiesForEnvironment,
} from './domains-inventory.js';
import { configuredBucketsForEnvironment } from './s3-inventory.js';
import type {
  AwsCommandContext,
  AwsIamPolicyOptions,
  AwsIamPolicyReport,
  AwsIamPolicyStatement,
  AwsIdentityReader,
} from './types.js';

function statement(sid: string, actions: string[], resources: string[]): AwsIamPolicyStatement {
  return {
    Sid: sid,
    Effect: 'Allow',
    Action: [...new Set(actions)].sort(),
    Resource: [...new Set(resources)].sort(),
  };
}

function s3BucketArn(bucketName: string): string {
  return `arn:aws:s3:::${bucketName}`;
}

function s3ObjectArn(bucketName: string): string {
  return `arn:aws:s3:::${bucketName}/*`;
}

function route53ZoneArn(hostedZoneId: string): string {
  return `arn:aws:route53:::hostedzone/${hostedZoneId.replace('/hostedzone/', '')}`;
}

function certificateArn(args: { context: AwsCommandContext; region: string }): string {
  return `arn:aws:acm:${args.region}:${args.context.account.expectedAccountId}:certificate/*`;
}

function certificateRegion(context: AwsCommandContext, usage?: string, region?: string): string {
  if (region) return region;
  return usage === 'cloudfront' ? 'us-east-1' : context.account.region;
}

export function createAwsIamPolicyReport(args: {
  context: AwsCommandContext;
  generatedAt?: string;
}): AwsIamPolicyReport {
  const statements: AwsIamPolicyStatement[] = [];
  const notes: string[] = [];
  const buckets = configuredBucketsForEnvironment(args.context);
  const cdn = configuredCloudFrontForEnvironment(args.context);
  const identities = configuredMailIdentitiesForEnvironment(args.context);
  const certificates = configuredCertificatesForEnvironment(args.context);
  const zones = configuredDnsZonesForEnvironment(args.context);

  if (buckets.length > 0) {
    statements.push(
      statement(
        'UnisaneManagedS3Buckets',
        [
          's3:CreateBucket',
          's3:GetBucketCors',
          's3:GetBucketEncryption',
          's3:GetBucketLifecycleConfiguration',
          's3:GetBucketLocation',
          's3:GetBucketOwnershipControls',
          's3:GetBucketPolicy',
          's3:GetBucketPublicAccessBlock',
          's3:GetBucketTagging',
          's3:ListBucket',
          's3:PutBucketEncryption',
          's3:PutBucketLifecycleConfiguration',
          's3:PutBucketOwnershipControls',
          's3:PutBucketPolicy',
          's3:PutBucketPublicAccessBlock',
          's3:PutBucketTagging',
        ],
        buckets.map(([, bucket]) => s3BucketArn(bucket.name)),
      ),
      statement(
        'UnisaneManagedS3Objects',
        ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        buckets.map(([, bucket]) => s3ObjectArn(bucket.name)),
      ),
    );
  }

  if (cdn.length > 0) {
    statements.push(
      statement(
        'UnisaneManagedCloudFront',
        [
          'cloudfront:CreateCachePolicy',
          'cloudfront:CreateDistribution',
          'cloudfront:CreateInvalidation',
          'cloudfront:CreateOriginAccessControl',
          'cloudfront:GetCachePolicy',
          'cloudfront:GetDistribution',
          'cloudfront:GetDistributionConfig',
          'cloudfront:GetOriginAccessControl',
          'cloudfront:ListCachePolicies',
          'cloudfront:ListDistributions',
          'cloudfront:ListOriginAccessControls',
          'cloudfront:UpdateDistribution',
        ],
        ['*'],
      ),
    );
    notes.push('CloudFront actions use Resource=* because several CloudFront APIs require it.');
  }

  if (identities.length > 0) {
    statements.push(
      statement(
        'UnisaneManagedSes',
        [
          'ses:CreateConfigurationSet',
          'ses:CreateEmailIdentity',
          'ses:GetAccount',
          'ses:GetConfigurationSet',
          'ses:GetConfigurationSetEventDestinations',
          'ses:GetEmailIdentity',
          'ses:PutConfigurationSetSendingOptions',
          'ses:PutEmailIdentityConfigurationSetAttributes',
          'ses:PutEmailIdentityDkimAttributes',
          'ses:PutEmailIdentityFeedbackAttributes',
          'ses:PutEmailIdentityMailFromAttributes',
        ],
        ['*'],
      ),
    );
    notes.push('SES identity and configuration-set APIs currently require Resource=*.');
  }

  if (certificates.length > 0) {
    const certificateResources = certificates.map(([, certificate]) =>
      certificateArn({
        context: args.context,
        region: certificateRegion(args.context, certificate.usage, certificate.region),
      }),
    );
    statements.push(
      statement(
        'UnisaneManagedAcm',
        [
          'acm:DescribeCertificate',
          'acm:ListCertificates',
          'acm:ListTagsForCertificate',
          'acm:RequestCertificate',
          'acm:AddTagsToCertificate',
        ],
        certificateResources,
      ),
    );
  }

  const route53Resources = zones
    .filter(([, zone]) => (zone.provider ?? 'route53') === 'route53' && zone.hostedZoneId)
    .map(([, zone]) => route53ZoneArn(zone.hostedZoneId ?? ''));
  if (route53Resources.length > 0) {
    statements.push(
      statement(
        'UnisaneManagedRoute53Zones',
        [
          'route53:GetHostedZone',
          'route53:ListResourceRecordSets',
          'route53:ChangeResourceRecordSets',
        ],
        route53Resources,
      ),
    );
  }
  if (zones.some(([, zone]) => (zone.provider ?? 'route53') === 'route53' && !zone.hostedZoneId)) {
    statements.push(statement('UnisaneRoute53Discovery', ['route53:ListHostedZonesByName'], ['*']));
    notes.push('Route 53 hosted-zone discovery uses Resource=* until hostedZoneId is configured.');
  }

  return {
    ok: true,
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    policy: {
      Version: '2012-10-17',
      Statement: statements,
    },
    notes,
  };
}

export async function runAwsIamPolicy(
  options: AwsIamPolicyOptions,
  deps?: { identityReader?: AwsIdentityReader },
): Promise<AwsIamPolicyReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reportWithoutArtifact = createAwsIamPolicyReport({ context });
  if (!options.output) return reportWithoutArtifact;
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/iam/policy.json`,
    value: reportWithoutArtifact,
  });
  return { ...reportWithoutArtifact, artifact };
}

export async function awsIamPolicy(options: AwsIamPolicyOptions): Promise<number> {
  try {
    const report = await runAwsIamPolicy(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(JSON.stringify(report.policy, null, 2));
      if (report.artifact) providerOutput.info(`Artifact: ${report.artifact.relativePath}`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS IAM policy error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
