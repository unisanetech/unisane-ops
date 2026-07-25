import { log } from '@unisane/cli-core';
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
  AwsAuditCheck,
  AwsAuditCheckStatus,
  AwsAuditOptions,
  AwsAuditReport,
  AwsCommandContext,
  AwsIdentityReader,
  AwsOpsBucketConfig,
} from './types.js';

function addCheck(
  checks: AwsAuditCheck[],
  status: AwsAuditCheckStatus,
  id: string,
  scope: string,
  message: string,
): void {
  checks.push({ id, status, scope, message });
}

function hasClassifiedPrefixes(bucket: AwsOpsBucketConfig): boolean {
  const prefixes = bucket.prefixes ?? [];
  return (
    prefixes.length > 0 &&
    prefixes.every((prefix) => prefix.path.trim().length > 0 && prefix.dataClass.trim().length > 0)
  );
}

function matchingZones(context: AwsCommandContext, domain: string): string[] {
  const normalizedDomain = domain.toLowerCase().replace(/\.+$/, '');
  return configuredDnsZonesForEnvironment(context)
    .filter(([, zone]) => {
      const zoneName = zone.name.toLowerCase().replace(/\.+$/, '');
      return normalizedDomain === zoneName || normalizedDomain.endsWith(`.${zoneName}`);
    })
    .map(([key]) => key);
}

export function createAwsAuditReport(args: {
  context: AwsCommandContext;
  generatedAt?: string;
}): AwsAuditReport {
  const checks: AwsAuditCheck[] = [];
  const buckets = configuredBucketsForEnvironment(args.context);
  const cdn = configuredCloudFrontForEnvironment(args.context);
  const identities = configuredMailIdentitiesForEnvironment(args.context);
  const certificates = configuredCertificatesForEnvironment(args.context);

  addCheck(
    checks,
    args.context.account.actualAccountId === args.context.account.expectedAccountId
      ? 'ok'
      : 'error',
    'account.expected-id',
    `environment:${args.context.environment}`,
    `Expected account ${args.context.account.expectedAccountId}; actual account ${args.context.account.actualAccountId ?? 'unavailable'}.`,
  );

  if (!args.context.account.profile) {
    addCheck(
      checks,
      args.context.account.production ? 'error' : 'warn',
      'account.profile',
      `environment:${args.context.environment}`,
      'AWS profile is not configured; use AWS SSO/profile or assumed-role credentials for repeatable operations.',
    );
  }

  for (const [bucketKey, bucket] of buckets) {
    if (bucket.blockPublicAccess === false) {
      addCheck(
        checks,
        'error',
        's3.public-access-block',
        `bucket:${bucketKey}`,
        `Bucket '${bucket.name}' explicitly disables Block Public Access.`,
      );
    } else {
      addCheck(
        checks,
        'ok',
        's3.public-access-block',
        `bucket:${bucketKey}`,
        `Bucket '${bucket.name}' keeps Block Public Access enabled by policy.`,
      );
    }

    if (args.context.account.production && !hasClassifiedPrefixes(bucket)) {
      addCheck(
        checks,
        'error',
        's3.prefix-data-class',
        `bucket:${bucketKey}`,
        `Production bucket '${bucket.name}' must declare classified prefixes.`,
      );
    }

    if (!bucket.encryption?.type) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        's3.encryption',
        `bucket:${bucketKey}`,
        `Bucket '${bucket.name}' should declare default encryption.`,
      );
    }

    if (!bucket.objectOwnership) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        's3.object-ownership',
        `bucket:${bucketKey}`,
        `Bucket '${bucket.name}' should declare object ownership.`,
      );
    }
  }

  for (const [cdnKey, desiredCdn] of cdn) {
    if (desiredCdn.access !== 'cloudfront-oac') {
      addCheck(
        checks,
        'error',
        'cloudfront.oac',
        `cdn:${cdnKey}`,
        `CDN '${cdnKey}' must use private S3 with CloudFront OAC access.`,
      );
    }
    if ((desiredCdn.publicPrefixes ?? []).length === 0) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        'cloudfront.public-prefixes',
        `cdn:${cdnKey}`,
        `CDN '${cdnKey}' should declare public asset prefixes for invalidation and env output.`,
      );
    }
    if ((desiredCdn.aliases ?? []).length > 0 && !desiredCdn.certificate) {
      addCheck(
        checks,
        'error',
        'cloudfront.alias-certificate',
        `cdn:${cdnKey}`,
        `CDN '${cdnKey}' declares aliases but no ACM certificate reference.`,
      );
    }
    if (!desiredCdn.accessLogs) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        'cloudfront.access-logs',
        `cdn:${cdnKey}`,
        `CDN '${cdnKey}' should declare CloudFront access logs for auditability and incident review.`,
      );
    }
  }

  for (const [identityKey, identity] of identities) {
    if (!identity.mailFromDomain) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        'ses.mail-from',
        `mailIdentity:${identityKey}`,
        `SES identity '${identity.domain}' should declare a MAIL FROM domain.`,
      );
    }
    if (!identity.configurationSet) {
      addCheck(
        checks,
        args.context.account.production ? 'error' : 'warn',
        'ses.configuration-set',
        `mailIdentity:${identityKey}`,
        `SES identity '${identity.domain}' should declare a configuration set for event tracking.`,
      );
    }
    if (!identity.bimi) {
      addCheck(
        checks,
        args.context.account.production ? 'warn' : 'ok',
        'ses.bimi',
        `mailIdentity:${identityKey}`,
        args.context.account.production
          ? `SES identity '${identity.domain}' has no BIMI sender-brand desired state; recipient inbox brand logos are not covered by AWS control-plane readiness.`
          : `SES identity '${identity.domain}' has no BIMI sender-brand desired state for this non-production environment.`,
      );
    } else {
      const bimiHostedZone = identity.bimi.hostedZone;
      addCheck(
        checks,
        'ok',
        'ses.bimi',
        `mailIdentity:${identityKey}`,
        `SES identity '${identity.domain}' declares BIMI selector '${identity.bimi.selector ?? 'default'}'.`,
      );
      if (args.context.account.production && !identity.bimi.certificateUrl) {
        addCheck(
          checks,
          'warn',
          'ses.bimi-certificate',
          `mailIdentity:${identityKey}`,
          `Production BIMI for '${identity.domain}' should declare a VMC or CMC PEM certificate URL for strongest mailbox-provider support.`,
        );
      }
      if (
        bimiHostedZone &&
        !configuredDnsZonesForEnvironment(args.context).some(([key]) => key === bimiHostedZone)
      ) {
        addCheck(
          checks,
          'error',
          'ses.bimi-hosted-zone',
          `mailIdentity:${identityKey}`,
          `BIMI hostedZone '${bimiHostedZone}' is not configured for environment '${args.context.environment}'.`,
        );
      }
    }
    if (
      args.context.account.production &&
      matchingZones(args.context, identity.domain).length === 0
    ) {
      addCheck(
        checks,
        'error',
        'ses.dns-zone',
        `mailIdentity:${identityKey}`,
        `Production SES identity '${identity.domain}' needs a matching Route 53 or external DNS zone for DKIM, SPF, and DMARC records.`,
      );
    }
  }

  for (const [certificateKey, certificate] of certificates) {
    if (certificate.usage === 'cloudfront' && (certificate.region ?? 'us-east-1') !== 'us-east-1') {
      addCheck(
        checks,
        'error',
        'acm.cloudfront-region',
        `certificate:${certificateKey}`,
        `CloudFront certificate '${certificate.domainName}' must be in us-east-1.`,
      );
    }
    if (!certificate.hostedZone && args.context.account.production) {
      addCheck(
        checks,
        'error',
        'acm.validation-zone',
        `certificate:${certificateKey}`,
        `Production certificate '${certificate.domainName}' should declare a hostedZone for DNS validation.`,
      );
    }
  }

  if (checks.length === 0) {
    addCheck(
      checks,
      'ok',
      'aws.config-empty',
      `environment:${args.context.environment}`,
      'No managed AWS resources are configured for this environment.',
    );
  }

  const summary = checks.reduce<Record<AwsAuditCheckStatus, number>>(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, error: 0 },
  );

  return {
    ok: summary.error === 0,
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    checks,
    summary,
  };
}

export async function runAwsAudit(
  options: AwsAuditOptions,
  deps?: { identityReader?: AwsIdentityReader },
): Promise<AwsAuditReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reportWithoutArtifact = createAwsAuditReport({ context });
  if (!options.output) return reportWithoutArtifact;
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/audit/audit.json`,
    value: reportWithoutArtifact,
  });
  return { ...reportWithoutArtifact, artifact };
}

function printHumanAudit(report: AwsAuditReport): void {
  log.info(`AWS audit: ${report.environment}`);
  log.info(
    `Summary: ok=${report.summary.ok}, warn=${report.summary.warn}, error=${report.summary.error}`,
  );
  for (const check of report.checks) {
    log.info(`- [${check.status}] ${check.scope} ${check.id}: ${check.message}`);
  }
  if (report.artifact) log.info(`Artifact: ${report.artifact.relativePath}`);
}

export async function awsAudit(options: AwsAuditOptions): Promise<number> {
  try {
    const report = await runAwsAudit(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanAudit(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS audit error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
