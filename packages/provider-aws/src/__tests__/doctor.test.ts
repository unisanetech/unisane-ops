import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runAwsDoctor } from '../doctor.js';
import type { AwsIdentityReader } from '../types.js';

function createTempProject(configSource: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-aws-doctor-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  writeFileSync(path.join(cwd, 'config/aws.ops.mjs'), configSource, 'utf8');
  return cwd;
}

function configSource(accountId: string): string {
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
      accountId: '${accountId}',
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
  }
};`;
}

describe('aws doctor', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('passes when STS identity matches the configured account', async () => {
    const cwd = createTempProject(configSource('123456789012'));
    tempProjects.push(cwd);
    const identityReader: AwsIdentityReader = {
      read: async () => ({
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/dev',
        userId: 'user-id',
      }),
    };

    const report = await runAwsDoctor(
      { cwd, configPath: 'config/aws.ops.mjs', env: 'dev', json: true },
      { identityReader },
    );

    expect(report.ok).toBe(true);
    expect(report.account.actualAccountId).toBe('123456789012');
    expect(report.credentialSource).toBe('profile:unisane-dev');
  });

  it('fails before STS when the configured account is a placeholder', async () => {
    const cwd = createTempProject(configSource('<AWS_DEV_ACCOUNT_ID>'));
    tempProjects.push(cwd);
    const identityReader: AwsIdentityReader = {
      read: async () => {
        throw new Error('STS should not be called for placeholder account ids');
      },
    };

    const report = await runAwsDoctor(
      { cwd, configPath: 'config/aws.ops.mjs', env: 'dev', json: true },
      { identityReader },
    );

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'account.expected',
        status: 'error',
      }),
    );
  });

  it('fails when STS identity does not match the configured account', async () => {
    const cwd = createTempProject(configSource('123456789012'));
    tempProjects.push(cwd);
    const identityReader: AwsIdentityReader = {
      read: async () => ({
        accountId: '210987654321',
        arn: 'arn:aws:iam::210987654321:user/wrong',
        userId: 'user-id',
      }),
    };

    const report = await runAwsDoctor(
      { cwd, configPath: 'config/aws.ops.mjs', env: 'dev', json: true },
      { identityReader },
    );

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'identity.account',
        status: 'error',
      }),
    );
  });

  it('redacts secret-shaped fields in report output', async () => {
    const cwd = createTempProject(configSource('123456789012'));
    tempProjects.push(cwd);
    const identityReader: AwsIdentityReader = {
      read: async () => ({
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/dev',
        userId: 'user-id',
      }),
    };

    const report = await runAwsDoctor(
      { cwd, configPath: 'config/aws.ops.mjs', env: 'dev', json: true },
      { identityReader },
    );

    expect(JSON.stringify(report)).not.toContain('AWS_SECRET_ACCESS_KEY');
    expect(JSON.stringify(report)).not.toContain('sessionToken');
  });
});
