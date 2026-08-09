import type { Command } from 'commander';
import { providerOutput } from '../cli-output.js';
import { loadLocalEnvironment } from '@unisane/ops-engine/local';
import {
  awsCloudFrontApply,
  awsCloudFrontInvalidate,
  awsCloudFrontInventory,
  awsCloudFrontPlan,
  awsAudit,
  awsDoctor,
  awsDomainsInventory,
  awsDomainsApply,
  awsDomainsCertificateDelete,
  awsDomainsPlan,
  awsEnvOutput,
  awsIamPolicy,
  awsS3Apply,
  awsS3Inventory,
  awsS3Plan,
} from '../index.js';

interface AwsCliOptions {
  cwd?: string;
  config?: string;
  env?: string;
  json?: boolean;
  output?: string;
  inventory?: string;
  plan?: string;
  app?: string;
  cdn?: string;
  paths?: string;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  certificateArn?: string;
  domainName?: string;
  force?: boolean;
  yes?: boolean;
}

function parseCsv(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function registerAwsCommands(program: Command): void {
  const aws = program
    .command('aws')
    .description('AWS control-plane commands for Unisane-managed resources');

  aws
    .command('doctor')
    .description('Read-only AWS ops config, credential, and account readiness check')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsDoctor({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
      });
      process.exitCode = code;
    });

  aws
    .command('audit')
    .description('Run a CI-friendly non-mutating AWS control-plane readiness audit')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Optional JSON artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsAudit({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        output: options.output,
      });
      process.exitCode = code;
    });

  aws
    .command('env')
    .description('Emit secret-free AWS environment values for a configured app')
    .requiredOption('--app <key>', 'Configured app key')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Optional JSON artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsEnvOutput({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        appKey: options.app ?? '',
        output: options.output,
      });
      process.exitCode = code;
    });

  const iam = aws.command('iam').description('IAM policy helpers for AWS control-plane operators');

  iam
    .command('policy')
    .description('Emit a least-privilege IAM policy for configured AWS control-plane operations')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Optional JSON artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsIamPolicy({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        output: options.output,
      });
      process.exitCode = code;
    });

  const s3 = aws.command('s3').description('Read-only S3 inventory and desired-state planning');

  s3.command('inventory')
    .description('Read configured S3 bucket state and write an inventory artifact')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsS3Inventory({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        output: options.output,
      });
      process.exitCode = code;
    });

  s3.command('plan')
    .description('Generate a non-mutating S3 desired-state plan')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--inventory <path>', 'Read an existing S3 inventory artifact instead of remote AWS')
    .option('--output <path>', 'Plan output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsS3Plan({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        inventoryPath: options.inventory,
        output: options.output,
      });
      process.exitCode = code;
    });

  s3.command('apply')
    .description('Apply a reviewed S3 plan with explicit account confirmation')
    .requiredOption('--plan <path>', 'S3 plan artifact path')
    .requiredOption('--account-confirm <id>', 'Expected 12-digit AWS account id')
    .option('--env <name>', 'AWS ops environment to apply', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--production-confirm <value>',
      'Required for production apply: <env>:<account-id>:s3-apply',
    )
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option('--force', 'Allow reviewed production plans older than the default age guard')
    .option('--yes', 'Confirm the reviewed S3 plan should be applied')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsS3Apply({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        planPath: options.plan ?? '',
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        receiptOutput: options.receiptOutput,
        force: options.force,
        yes: options.yes,
      });
      process.exitCode = code;
    });

  const cloudfront = aws
    .command('cloudfront')
    .description('CloudFront/OAC inventory, desired-state planning, and guarded apply');

  cloudfront
    .command('inventory')
    .description('Read configured CloudFront distribution state and write an inventory artifact')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsCloudFrontInventory({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        output: options.output,
      });
      process.exitCode = code;
    });

  cloudfront
    .command('plan')
    .description('Generate a non-mutating CloudFront/OAC desired-state plan')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--inventory <path>',
      'Read an existing CloudFront inventory artifact instead of remote AWS',
    )
    .option('--output <path>', 'Plan output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsCloudFrontPlan({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        inventoryPath: options.inventory,
        output: options.output,
      });
      process.exitCode = code;
    });

  cloudfront
    .command('apply')
    .description('Apply a reviewed CloudFront/OAC plan with explicit account confirmation')
    .requiredOption('--plan <path>', 'CloudFront plan artifact path')
    .requiredOption('--account-confirm <id>', 'Expected 12-digit AWS account id')
    .option('--env <name>', 'AWS ops environment to apply', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--production-confirm <value>',
      'Required for production apply: <env>:<account-id>:cloudfront-apply',
    )
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option('--force', 'Allow reviewed production plans older than the default age guard')
    .option('--yes', 'Confirm the reviewed CloudFront plan should be applied')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsCloudFrontApply({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        planPath: options.plan ?? '',
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        receiptOutput: options.receiptOutput,
        force: options.force,
        yes: options.yes,
      });
      process.exitCode = code;
    });

  cloudfront
    .command('invalidate')
    .description('Request a guarded CloudFront invalidation for configured public asset prefixes')
    .requiredOption('--cdn <key>', 'Configured CDN key')
    .requiredOption('--account-confirm <id>', 'Expected 12-digit AWS account id')
    .option('--env <name>', 'AWS ops environment to apply', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--paths <paths>',
      'Comma-separated invalidation paths; defaults to configured public prefixes',
    )
    .option(
      '--production-confirm <value>',
      'Required for production invalidation: <env>:<account-id>:cloudfront-invalidate',
    )
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option('--yes', 'Confirm the CloudFront invalidation should be requested')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsCloudFrontInvalidate({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        cdnKey: options.cdn ?? '',
        paths: parseCsv(options.paths),
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        receiptOutput: options.receiptOutput,
        yes: options.yes,
      });
      process.exitCode = code;
    });

  const domains = aws
    .command('domains')
    .description('Read-only SES, ACM, and Route 53 inventory and desired-state planning');

  domains
    .command('inventory')
    .description('Read configured SES, ACM, and Route 53 state and write an inventory artifact')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--output <path>', 'Artifact output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsDomainsInventory({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        output: options.output,
      });
      process.exitCode = code;
    });

  domains
    .command('plan')
    .description('Generate a non-mutating SES, ACM, and Route 53 desired-state plan')
    .option('--env <name>', 'AWS ops environment to inspect', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--inventory <path>',
      'Read an existing domains inventory artifact instead of remote AWS',
    )
    .option('--output <path>', 'Plan output path inside cwd')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsDomainsPlan({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        inventoryPath: options.inventory,
        output: options.output,
      });
      process.exitCode = code;
    });

  domains
    .command('apply')
    .description(
      'Apply a reviewed SES, ACM, and Route 53 domains plan with explicit account confirmation',
    )
    .requiredOption('--plan <path>', 'Domains plan artifact path')
    .requiredOption('--account-confirm <id>', 'Expected 12-digit AWS account id')
    .option('--env <name>', 'AWS ops environment to apply', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option(
      '--production-confirm <value>',
      'Required for production apply: <env>:<account-id>:domains-apply',
    )
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option('--force', 'Allow reviewed production plans older than the default age guard')
    .option('--yes', 'Confirm the reviewed domains plan should be applied')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsDomainsApply({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        planPath: options.plan ?? '',
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        receiptOutput: options.receiptOutput,
        force: options.force,
        yes: options.yes,
      });
      process.exitCode = code;
    });

  domains
    .command('delete-certificate')
    .description('Delete an unused ACM certificate in a non-production AWS ops environment')
    .requiredOption('--certificate-arn <arn>', 'ACM certificate ARN to delete')
    .requiredOption('--account-confirm <id>', 'Expected 12-digit AWS account id')
    .option('--domain-name <name>', 'Optional domain-name guard for the certificate')
    .option('--env <name>', 'AWS ops environment to apply', 'dev')
    .option('--config <path>', 'Path to AWS ops config')
    .option('--cwd <path>', 'Working directory to execute from')
    .option('--receipt-output <path>', 'Receipt output path inside cwd')
    .option('--yes', 'Confirm the unused certificate should be deleted')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: AwsCliOptions) => {
      if (!options.json) providerOutput.banner('Unisane');
      loadLocalEnvironment({ appDir: options.cwd });
      const code = await awsDomainsCertificateDelete({
        cwd: options.cwd,
        configPath: options.config,
        env: options.env,
        json: options.json,
        certificateArn: options.certificateArn ?? '',
        accountConfirm: options.accountConfirm,
        domainName: options.domainName,
        receiptOutput: options.receiptOutput,
        yes: options.yes,
      });
      process.exitCode = code;
    });
}
