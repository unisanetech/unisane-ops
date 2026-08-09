import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
} from '@aws-sdk/client-acm';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { providerOutput } from './cli-output.js';
import { awsSafeArtifactStamp, writeAwsJsonArtifact } from './artifacts.js';
import { resolveAwsCommandContext } from './context.js';
import { withAwsOperationLock } from './lock.js';
import type {
  AwsCommandContext,
  AwsDomainsCertificateDeleteExecutor,
  AwsDomainsCertificateDeleteOptions,
  AwsDomainsCertificateDeleteReceipt,
  AwsDomainsCertificateDeleteReport,
  AwsDomainsCertificateDeleteTarget,
  AwsIdentityReader,
} from './types.js';

const RECEIPT_KIND = 'unisane.aws.domains-certificate-delete-receipt' as const;

function acmClient(context: AwsCommandContext, region: string): ACMClient {
  return new ACMClient({
    region,
    ...(context.account.profile
      ? { credentials: fromIni({ profile: context.account.profile }) }
      : {}),
  });
}

function parseCertificateArn(arn: string): { region: string; accountId: string } {
  const parts = arn.split(':');
  if (
    parts.length < 6 ||
    parts[0] !== 'arn' ||
    parts[2] !== 'acm' ||
    !parts[3] ||
    !parts[4] ||
    !parts[5]?.startsWith('certificate/')
  ) {
    throw new Error(
      '[AWS_DOMAINS_CERTIFICATE_DELETE_INVALID_ARN] Provide a valid ACM certificate ARN.',
    );
  }
  return { region: parts[3], accountId: parts[4] };
}

function validateCertificateDeleteRequest(args: {
  context: AwsCommandContext;
  options: AwsDomainsCertificateDeleteOptions;
}): string {
  const arn = args.options.certificateArn.trim();
  if (!arn) {
    throw new Error('[AWS_DOMAINS_CERTIFICATE_DELETE_ARN_REQUIRED] Provide --certificate-arn.');
  }
  if (args.context.account.production) {
    throw new Error(
      '[AWS_DOMAINS_CERTIFICATE_DELETE_PRODUCTION_FORBIDDEN] Certificate deletion is not available for production environments.',
    );
  }
  if (!args.options.yes) {
    throw new Error(
      '[AWS_DOMAINS_CERTIFICATE_DELETE_REQUIRES_YES] Certificate deletion requires --yes.',
    );
  }
  if (args.options.accountConfirm !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_DOMAINS_CERTIFICATE_DELETE_ACCOUNT_CONFIRM_REQUIRED] Expected --account-confirm ${args.context.account.expectedAccountId}.`,
    );
  }
  const parsed = parseCertificateArn(arn);
  if (parsed.accountId !== args.context.account.expectedAccountId) {
    throw new Error(
      `[AWS_DOMAINS_CERTIFICATE_DELETE_ACCOUNT_MISMATCH] Certificate ARN account '${parsed.accountId}' does not match expected '${args.context.account.expectedAccountId}'.`,
    );
  }
  return parsed.region;
}

function validateCertificateTarget(args: {
  target: AwsDomainsCertificateDeleteTarget;
  expectedDomainName?: string;
}): void {
  if (args.expectedDomainName && args.target.domainName !== args.expectedDomainName) {
    throw new Error(
      `[AWS_DOMAINS_CERTIFICATE_DELETE_DOMAIN_MISMATCH] Certificate domain '${args.target.domainName ?? 'unknown'}' does not match '${args.expectedDomainName}'.`,
    );
  }
  if (args.target.inUseBy.length > 0) {
    throw new Error(
      `[AWS_DOMAINS_CERTIFICATE_DELETE_IN_USE] Certificate is attached to ${args.target.inUseBy.join(', ')}.`,
    );
  }
}

export class SdkAwsDomainsCertificateDeleteExecutor implements AwsDomainsCertificateDeleteExecutor {
  async describeCertificate(args: {
    context: AwsCommandContext;
    certificateArn: string;
    region: string;
  }): Promise<AwsDomainsCertificateDeleteTarget> {
    const response = await acmClient(args.context, args.region).send(
      new DescribeCertificateCommand({ CertificateArn: args.certificateArn }),
    );
    const certificate = response.Certificate;
    return {
      certificateArn: args.certificateArn,
      domainName: certificate?.DomainName ?? null,
      status: certificate?.Status ?? null,
      inUseBy: certificate?.InUseBy ?? [],
      region: args.region,
    };
  }

  async deleteCertificate(args: {
    context: AwsCommandContext;
    certificateArn: string;
    region: string;
  }): Promise<void> {
    await acmClient(args.context, args.region).send(
      new DeleteCertificateCommand({ CertificateArn: args.certificateArn }),
    );
  }
}

export async function runAwsDomainsCertificateDelete(
  options: AwsDomainsCertificateDeleteOptions,
  deps?: {
    identityReader?: AwsIdentityReader;
    executor?: AwsDomainsCertificateDeleteExecutor;
    now?: () => Date;
  },
): Promise<AwsDomainsCertificateDeleteReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const region = validateCertificateDeleteRequest({ context, options });
  const requestedAt = (deps?.now ?? (() => new Date()))();
  const executor = deps?.executor ?? new SdkAwsDomainsCertificateDeleteExecutor();
  const certificateArn = options.certificateArn.trim();

  return await withAwsOperationLock({
    cwd: context.cwd,
    environment: context.environment,
    family: 'domains-certificate-delete',
    run: async (lockPath) => {
      let target: AwsDomainsCertificateDeleteTarget | null = null;
      let receipt: AwsDomainsCertificateDeleteReceipt;
      try {
        target = await executor.describeCertificate({ context, certificateArn, region });
        validateCertificateTarget({ target, expectedDomainName: options.domainName });
        await executor.deleteCertificate({ context, certificateArn, region });
        receipt = {
          version: 1,
          kind: RECEIPT_KIND,
          status: 'succeeded',
          environment: context.environment,
          account: context.account,
          certificateArn,
          domainName: target.domainName,
          certificateStatus: target.status,
          region,
          requestedAt: requestedAt.toISOString(),
          completedAt: (deps?.now ?? (() => new Date()))().toISOString(),
          lockPath,
          message: 'Unused ACM certificate deleted.',
        };
      } catch (error) {
        receipt = {
          version: 1,
          kind: RECEIPT_KIND,
          status: 'failed',
          environment: context.environment,
          account: context.account,
          certificateArn,
          domainName: target?.domainName ?? null,
          certificateStatus: target?.status ?? null,
          region,
          requestedAt: requestedAt.toISOString(),
          completedAt: (deps?.now ?? (() => new Date()))().toISOString(),
          lockPath,
          message: error instanceof Error ? error.message : 'Unknown ACM certificate delete error.',
        };
      }

      const artifact = writeAwsJsonArtifact({
        cwd: context.cwd,
        outputPath: options.receiptOutput,
        defaultRelativePath: `.unisane/aws/${context.environment}/receipts/domains-certificate-delete-${awsSafeArtifactStamp(requestedAt)}.json`,
        value: receipt,
      });
      return { ok: receipt.status === 'succeeded', receipt, artifact };
    },
  });
}

function printHumanReport(report: AwsDomainsCertificateDeleteReport): void {
  providerOutput.info(`AWS domains certificate delete: ${report.receipt.environment}`);
  providerOutput.info(`Certificate: ${report.receipt.certificateArn}`);
  providerOutput.info(`Domain: ${report.receipt.domainName ?? 'unknown'}`);
  providerOutput.info(`Status: ${report.receipt.status}`);
  providerOutput.info(`Receipt: ${report.artifact.relativePath}`);
}

export async function awsDomainsCertificateDelete(
  options: AwsDomainsCertificateDeleteOptions,
): Promise<number> {
  try {
    const report = await runAwsDomainsCertificateDelete(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHumanReport(report);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown AWS domains certificate delete error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      providerOutput.error(message);
    }
    return 2;
  }
}
