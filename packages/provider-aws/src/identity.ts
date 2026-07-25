import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import type { AwsCallerIdentity, AwsIdentityReader } from './types.js';

export function describeCredentialSource(args: {
  profile?: string;
  production?: boolean;
  env?: NodeJS.ProcessEnv;
}): { source: string; warnings: string[] } {
  const env = args.env ?? process.env;
  const warnings: string[] = [];
  if (args.profile) {
    return { source: `profile:${args.profile}`, warnings };
  }
  if (env.AWS_PROFILE) {
    return { source: `profile:${env.AWS_PROFILE}`, warnings };
  }
  if (env.AWS_WEB_IDENTITY_TOKEN_FILE || env.AWS_ROLE_ARN) {
    return { source: 'web-identity-or-assumed-role', warnings };
  }
  if (env.AWS_ACCESS_KEY_ID) {
    if (args.production) {
      warnings.push('Production should use AWS SSO or assumed roles instead of long-lived keys.');
    }
    return { source: 'env:AWS_ACCESS_KEY_ID', warnings };
  }
  return { source: 'aws-default-provider-chain', warnings };
}

export function redactAwsSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => redactAwsSecrets(entry));
  if (typeof value !== 'object' || value === null) return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes('secret') ||
      normalizedKey.includes('token') ||
      normalizedKey.includes('accesskey') ||
      normalizedKey.includes('password')
    ) {
      redacted[key] = '<REDACTED>';
      continue;
    }
    redacted[key] = redactAwsSecrets(entry);
  }
  return redacted;
}

export class StsAwsIdentityReader implements AwsIdentityReader {
  async read(args: { profile?: string; region: string }): Promise<AwsCallerIdentity> {
    const client = new STSClient({
      region: args.region,
      ...(args.profile ? { credentials: fromIni({ profile: args.profile }) } : {}),
    });
    const identity = await client.send(new GetCallerIdentityCommand({}));
    return {
      accountId: identity.Account ?? null,
      arn: identity.Arn ?? null,
      userId: identity.UserId ?? null,
    };
  }
}
