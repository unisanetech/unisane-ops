import { providerOutput } from './cli-output.js';
import path from 'node:path';
import { loadAwsOpsConfig } from './config-loader.js';
import { isPlaceholderAccountId } from './context.js';
import { describeCredentialSource, redactAwsSecrets, StsAwsIdentityReader } from './identity.js';
import type {
  AwsDoctorCheck,
  AwsDoctorOptions,
  AwsDoctorReport,
  AwsIdentityReader,
  AwsOpsConfig,
} from './types.js';

function addCheck(checks: AwsDoctorCheck[], check: AwsDoctorCheck): void {
  checks.push(check);
}

function hasErrors(checks: AwsDoctorCheck[]): boolean {
  return checks.some((check) => check.status === 'error');
}

function resolveEnvironment(
  config: AwsOpsConfig,
  envName: string,
): {
  accountKey: string | null;
  expectedAccountId: string | null;
  profile: string | null;
  region: string | null;
  production: boolean;
} {
  const environment = config.environments[envName];
  if (!environment) {
    return {
      accountKey: null,
      expectedAccountId: null,
      profile: null,
      region: null,
      production: false,
    };
  }
  const account = config.accounts[environment.account];
  return {
    accountKey: environment.account,
    expectedAccountId: account?.accountId ?? null,
    profile: account?.profile ?? null,
    region: environment.region ?? account?.defaultRegion ?? null,
    production: environment.production === true,
  };
}

function requiredTags(config: AwsOpsConfig): string[] {
  const tags = config.defaults?.tags ?? {};
  return ['Project', 'ManagedBy', 'Owner'].filter((tag) => !tags[tag]);
}

function createFailureReport(args: {
  envName: string;
  configPath: string | null;
  checks: AwsDoctorCheck[];
  nextSteps: string[];
}): AwsDoctorReport {
  return {
    ok: false,
    environment: args.envName,
    configPath: args.configPath,
    account: {
      key: null,
      expectedAccountId: null,
      actualAccountId: null,
      profile: null,
      region: null,
      production: false,
    },
    credentialSource: 'unresolved',
    checks: args.checks,
    nextSteps: args.nextSteps,
  };
}

export async function runAwsDoctor(
  options: AwsDoctorOptions,
  deps?: { identityReader?: AwsIdentityReader },
): Promise<AwsDoctorReport> {
  const envName = options.env ?? 'dev';
  const checks: AwsDoctorCheck[] = [];
  const nextSteps: string[] = [];
  const cwd = path.resolve(options.cwd ?? process.cwd());
  let loadedConfig: Awaited<ReturnType<typeof loadAwsOpsConfig>>;

  try {
    loadedConfig = await loadAwsOpsConfig({
      cwd,
      configPath: options.configPath,
    });
    addCheck(checks, {
      id: 'config.load',
      status: 'ok',
      message: `Loaded AWS ops config from ${loadedConfig.path}.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS ops config error.';
    addCheck(checks, { id: 'config.load', status: 'error', message });
    nextSteps.push('Create config/aws.ops.ts or pass --config <path>.');
    return createFailureReport({ envName, configPath: null, checks, nextSteps });
  }

  const account = resolveEnvironment(loadedConfig.config, envName);
  if (!account.accountKey) {
    addCheck(checks, {
      id: 'environment.exists',
      status: 'error',
      message: `Environment '${envName}' is not declared in AWS ops config.`,
    });
    nextSteps.push(`Add environments.${envName} to the AWS ops config.`);
    return createFailureReport({
      envName,
      configPath: loadedConfig.path,
      checks,
      nextSteps,
    });
  }

  addCheck(checks, {
    id: 'environment.exists',
    status: 'ok',
    message: `Environment '${envName}' uses account '${account.accountKey}'.`,
  });

  if (isPlaceholderAccountId(account.expectedAccountId)) {
    addCheck(checks, {
      id: 'account.expected',
      status: 'error',
      message: `Environment '${envName}' must declare a real 12-digit AWS account id before doctor can verify identity.`,
    });
    nextSteps.push(
      `Replace the placeholder account id for accounts.${account.accountKey}.accountId.`,
    );
  } else {
    addCheck(checks, {
      id: 'account.expected',
      status: 'ok',
      message: `Expected AWS account id is ${account.expectedAccountId}.`,
    });
  }

  if (!account.region) {
    addCheck(checks, {
      id: 'region',
      status: 'error',
      message: `Environment '${envName}' must declare a region or its account must declare defaultRegion.`,
    });
    nextSteps.push(
      `Add region to environments.${envName} or defaultRegion to accounts.${account.accountKey}.`,
    );
  } else {
    addCheck(checks, {
      id: 'region',
      status: 'ok',
      message: `AWS region is ${account.region}.`,
    });
  }

  const missingTags = requiredTags(loadedConfig.config);
  if (missingTags.length > 0) {
    addCheck(checks, {
      id: 'tags.defaults',
      status: 'warn',
      message: `Missing recommended default tag(s): ${missingTags.join(', ')}.`,
    });
  } else {
    addCheck(checks, {
      id: 'tags.defaults',
      status: 'ok',
      message: 'Required default ownership tags are configured.',
    });
  }

  addCheck(checks, {
    id: 'artifacts.path',
    status: 'ok',
    message: `AWS operation artifacts will use ${path.join(cwd, '.unisane', 'aws', envName)} when write-capable commands are added.`,
  });

  const credential = describeCredentialSource({
    profile: account.profile ?? undefined,
    production: account.production,
  });
  for (const warning of credential.warnings) {
    addCheck(checks, { id: 'credentials.warning', status: 'warn', message: warning });
  }

  let actualAccountId: string | null = null;
  if (!hasErrors(checks) && account.region) {
    try {
      const identityReader = deps?.identityReader ?? new StsAwsIdentityReader();
      const identity = await identityReader.read({
        profile: account.profile ?? undefined,
        region: account.region,
      });
      actualAccountId = identity.accountId;
      if (identity.accountId === account.expectedAccountId) {
        addCheck(checks, {
          id: 'identity.account',
          status: 'ok',
          message: `Active AWS identity matches expected account ${account.expectedAccountId}.`,
        });
      } else {
        addCheck(checks, {
          id: 'identity.account',
          status: 'error',
          message: `Active AWS account '${identity.accountId ?? 'unknown'}' does not match expected '${account.expectedAccountId}'.`,
        });
        nextSteps.push('Switch AWS profile/role or correct the expected account id.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AWS identity error.';
      addCheck(checks, {
        id: 'identity.account',
        status: 'error',
        message: `Could not read AWS caller identity: ${message}`,
      });
      nextSteps.push(
        'Run `aws sts get-caller-identity` with the same profile to verify credentials.',
      );
    }
  }

  if (!hasErrors(checks)) {
    nextSteps.push('Next safe slice: add read-only S3 inventory and planning.');
  }

  return redactAwsSecrets({
    ok: !hasErrors(checks),
    environment: envName,
    configPath: loadedConfig.path,
    account: {
      key: account.accountKey,
      expectedAccountId: account.expectedAccountId,
      actualAccountId,
      profile: account.profile,
      region: account.region,
      production: account.production,
    },
    credentialSource: credential.source,
    checks,
    nextSteps,
  }) as AwsDoctorReport;
}

function printHumanReport(report: AwsDoctorReport): void {
  providerOutput.info(`AWS environment: ${report.environment}`);
  if (report.configPath) providerOutput.info(`Config: ${report.configPath}`);
  providerOutput.info(`Credential source: ${report.credentialSource}`);
  for (const check of report.checks) {
    const label = check.status === 'ok' ? 'OK' : check.status === 'warn' ? 'WARN' : 'ERROR';
    providerOutput.info(`[${label}] ${check.id}: ${check.message}`);
  }
  if (report.nextSteps.length > 0) {
    providerOutput.info('Next steps:');
    for (const step of report.nextSteps) providerOutput.info(`- ${step}`);
  }
}

export async function awsDoctor(options: AwsDoctorOptions): Promise<number> {
  const report = await runAwsDoctor(options);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }
  return report.ok ? 0 : 2;
}
