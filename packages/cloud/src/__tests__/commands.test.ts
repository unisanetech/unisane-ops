import { describe, expect, it, vi } from 'vitest';
import { runCloudDnsImport, runProviderCloudflareDnsPlan } from '../handlers/dns.js';
import type { CloudDnsRuntimeBinding } from '../runtime.js';

const inventory = {
  schemaVersion: 1 as const,
  kind: 'cloud.dns-inventory' as const,
  provider: 'cloudflare' as const,
  projectId: 'project-1',
  targetId: 'website',
  environment: 'dev',
  connectionId: 'edge',
  generatedAt: '2026-07-24T10:00:00.000Z',
  account: {
    configuredAccountId: 'account_1',
    liveAccounts: [{ id: 'account_1', name: 'Example' }],
  },
  zones: [
    {
      key: 'site',
      id: 'zone_1',
      name: 'example.test',
      status: 'active',
      accountId: 'account_1',
      accountName: 'Example',
      configured: true,
    },
  ],
  records: [],
  errors: [],
};

function binding(): CloudDnsRuntimeBinding {
  return {
    target: {
      projectId: 'project-1',
      targetId: 'website',
      environment: 'dev',
      connectionId: 'edge',
      provider: 'cloudflare',
      accountId: 'account_1',
      production: false,
      configPath: '/project/unisane.config.ts',
      desired: {
        zones: { site: { name: 'example.test', zoneId: 'zone_1' } },
        records: {
          website: {
            zone: 'site',
            type: 'CNAME',
            name: 'www.example.test',
            content: 'target.example.test',
          },
        },
      },
    },
    artifacts: {
      readJson: vi.fn(() => inventory),
      writeJson: vi.fn(({ class: artifactClass }) => ({
        path: `/project/${artifactClass}.json`,
        relativePath: `${artifactClass}.json`,
      })),
    },
    now: new Date('2026-07-24T11:00:00.000Z'),
  };
}

describe('@unisane/cloud command routing', () => {
  it('keeps import offline and emits a reviewable proposal artifact', async () => {
    const runtimeBinding = binding();
    const resolveBinding = vi.fn(async () => runtimeBinding);
    const result = await runCloudDnsImport({
      argv: ['--inventory', 'inventory.json', '--zone', 'zone_1'],
      cwd: '/project',
      manifests: [],
      runtime: { resolveBinding },
    });

    expect(result.command).toBe('cloud.dns.import');
    expect(result.actualEffect).toBe('offline');
    expect(result.status).toBe('ok');
    expect(result.artifacts).toEqual(['import.json']);
    expect(resolveBinding).toHaveBeenCalledWith(
      'cloud.dns.context',
      expect.objectContaining({ command: 'import' }),
    );
  });

  it('uses the same planning workflow with the expert Cloudflare command identity', async () => {
    const runtimeBinding = binding();
    const result = await runProviderCloudflareDnsPlan({
      argv: ['--inventory', 'inventory.json'],
      cwd: '/project',
      manifests: [],
      runtime: { resolveBinding: vi.fn(async () => runtimeBinding) },
    });

    expect(result.command).toBe('provider.cloudflare.dns.plan');
    expect(result.pack).toBe('cloud');
    expect(result.actualEffect).toBe('offline');
    expect(result.status).toBe('ok');
  });
});
