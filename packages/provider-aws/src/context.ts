import path from 'node:path';
import { loadAwsOpsConfig } from './config-loader.js';
import { StsAwsIdentityReader } from './identity.js';
import type {
  AwsCommandContext,
  AwsCommandOptions,
  AwsIdentityReader,
  AwsOpsConfig,
} from './types.js';

export function isPlaceholderAccountId(accountId: string | null | undefined): boolean {
  if (!accountId) return true;
  const trimmed = accountId.trim();
  return (
    trimmed.length === 0 ||
    trimmed.includes('<') ||
    trimmed.includes('>') ||
    trimmed.toUpperCase().includes('TODO') ||
    !/^\d{12}$/.test(trimmed)
  );
}

export function resolveAwsOpsEnvironment(
  config: AwsOpsConfig,
  envName: string,
): {
  accountKey: string;
  expectedAccountId: string;
  profile: string | null;
  region: string;
  production: boolean;
} {
  const environment = config.environments[envName];
  if (!environment) {
    throw new Error(`[AWS_ENVIRONMENT_NOT_FOUND] Environment '${envName}' is not declared.`);
  }

  const account = config.accounts[environment.account];
  if (!account) {
    throw new Error(
      `[AWS_ACCOUNT_NOT_FOUND] Environment '${envName}' references unknown account '${environment.account}'.`,
    );
  }

  const region = environment.region ?? account.defaultRegion;
  if (!region) {
    throw new Error(
      `[AWS_REGION_NOT_FOUND] Environment '${envName}' must declare region or account defaultRegion.`,
    );
  }

  if (isPlaceholderAccountId(account.accountId)) {
    throw new Error(
      `[AWS_ACCOUNT_PLACEHOLDER] Environment '${envName}' must declare a real 12-digit AWS account id before AWS resource inventory or planning.`,
    );
  }

  return {
    accountKey: environment.account,
    expectedAccountId: account.accountId,
    profile: account.profile ?? null,
    region,
    production: environment.production === true,
  };
}

export async function resolveAwsCommandContext(
  options: AwsCommandOptions,
  deps?: { identityReader?: AwsIdentityReader },
): Promise<AwsCommandContext> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const environment = options.env ?? 'dev';
  const loaded = await loadAwsOpsConfig({ cwd, configPath: options.configPath });
  const resolved = resolveAwsOpsEnvironment(loaded.config, environment);
  const identityReader = deps?.identityReader ?? new StsAwsIdentityReader();
  const identity = await identityReader.read({
    profile: resolved.profile ?? undefined,
    region: resolved.region,
  });

  if (identity.accountId !== resolved.expectedAccountId) {
    throw new Error(
      `[AWS_ACCOUNT_MISMATCH] Active AWS account '${identity.accountId ?? 'unknown'}' does not match expected '${resolved.expectedAccountId}'.`,
    );
  }

  return {
    cwd,
    configPath: loaded.path,
    environment,
    config: loaded.config,
    account: {
      key: resolved.accountKey,
      expectedAccountId: resolved.expectedAccountId,
      actualAccountId: identity.accountId,
      profile: resolved.profile,
      region: resolved.region,
      production: resolved.production,
    },
  };
}
