import { describe, expect, it, vi } from 'vitest';
import { runCloudflareConnectionCheck } from '../handlers/connection.js';

describe('@unisane/provider-cloudflare connection command', () => {
  it('writes a redacted discovery report through the canonical runtime binding', async () => {
    const artifact = vi.fn(() => ({
      path: '/project/report.json',
      relativePath: '.unisane/ops/connections/edge/inventory/report.json',
    }));
    const resolveBinding = vi.fn(async () => ({
      projectId: 'project-1',
      connectionId: 'edge',
      configuredAccountId: null,
      provider: {
        verifyConnection: vi.fn(async () => ({ id: 'token_1', status: 'active' })),
        listAccounts: vi.fn(async () => [{ id: 'account_1', name: 'Example' }]),
        listZones: vi.fn(async () => [
          {
            key: null,
            id: 'zone_1',
            name: 'example.test',
            status: 'active',
            accountId: 'account_1',
            accountName: 'Example',
            configured: false,
          },
        ]),
      },
      artifacts: { writeJson: artifact },
      now: new Date('2026-07-24T11:00:00.000Z'),
    }));

    const result = await runCloudflareConnectionCheck({
      argv: ['--connection', 'edge'],
      cwd: '/project',
      manifests: [],
      runtime: { resolveBinding },
    });

    expect(result.command).toBe('provider.cloudflare.connection.check');
    expect(result.pack).toBe('provider.cloudflare');
    expect(result.status).toBe('ok');
    expect(result.actualEffect).toBe('read-network');
    expect(result.nextActions[0]).toContain('Select an observed account id');
    expect(JSON.stringify(result)).not.toContain('super-secret-token');
    expect(resolveBinding).toHaveBeenCalledWith(
      'provider.cloudflare.connection',
      expect.objectContaining({ command: 'connection.check', connection: 'edge' }),
    );
    expect(artifact).toHaveBeenCalledOnce();
  });
});
