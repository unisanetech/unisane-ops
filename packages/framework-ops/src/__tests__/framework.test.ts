import { describe, expect, it, vi } from 'vitest';
import type { PackCommandContext, PackCommandDescriptor } from '@unisane/ops-engine/pack';
import { executeFrameworkCommand } from '../handlers/framework.js';

const descriptor: PackCommandDescriptor = {
  id: 'framework.app',
  path: ['app'],
  handler: {
    exportPath: './handlers/framework',
    exportName: 'runFrameworkCommand',
  },
  maximumEffect: 'write',
  writeTargets: ['project'],
  artifactClasses: [],
  riskGuards: [],
  json: true,
};

function context(json = false): PackCommandContext {
  return {
    argv: ['--help'],
    cwd: '/tmp/framework-project',
    manifests: [],
    json,
    selection: {
      command: descriptor,
      packId: 'framework',
    },
  };
}

describe('Framework Ops handler', () => {
  it('routes exact selection context through the captured Framework bridge', async () => {
    const bridge = vi.fn(() => ({
      schemaVersion: 1 as const,
      root: 'app' as const,
      exitCode: 0,
      stdout: 'Framework app help\n',
      stderr: '',
    }));
    const result = await executeFrameworkCommand(context(), bridge);
    expect(bridge).toHaveBeenCalledWith({
      root: 'app',
      argv: ['--help'],
      cwd: '/tmp/framework-project',
      json: false,
      mode: 'captured',
    });
    expect(result).toMatchObject({
      command: 'framework.app',
      pack: 'framework',
      status: 'ok',
      actualEffect: 'write',
      presentation: { stdout: 'Framework app help\n', stderr: '' },
    });
  });

  it('wraps JSON output without emitting human presentation', async () => {
    const result = await executeFrameworkCommand(context(true), () => ({
      schemaVersion: 1,
      root: 'app',
      exitCode: 0,
      stdout: '{"ok":true}\n',
      stderr: '',
    }));
    expect(result.result).toEqual({ exitCode: 0, output: { ok: true } });
    expect(result.presentation).toBeUndefined();
  });

  it('streams interactive commands without replaying captured presentation', async () => {
    const interactiveDescriptor = { ...descriptor, id: 'framework.dev', path: ['dev'] };
    const bridge = vi.fn(async () => ({
      schemaVersion: 1 as const,
      root: 'dev' as const,
      exitCode: 0,
      stdout: '',
      stderr: '',
    }));
    const result = await executeFrameworkCommand(
      {
        ...context(),
        selection: { command: interactiveDescriptor, packId: 'framework' },
      },
      bridge,
    );

    expect(bridge).toHaveBeenCalledWith({
      root: 'dev',
      argv: ['--help'],
      cwd: '/tmp/framework-project',
      json: false,
      mode: 'interactive',
    });
    expect(result.presentation).toEqual({ stdout: '', stderr: '' });
  });

  it('treats an interactive signal shutdown as a successful cancellation', async () => {
    const interactiveDescriptor = { ...descriptor, id: 'framework.dev', path: ['dev'] };
    const result = await executeFrameworkCommand(
      {
        ...context(),
        selection: { command: interactiveDescriptor, packId: 'framework' },
      },
      async () => ({
        schemaVersion: 1,
        root: 'dev',
        exitCode: 130,
        stdout: '',
        stderr: '',
      }),
    );

    expect(result.status).toBe('ok');
    expect(result.result).toEqual({ exitCode: 130, output: null });
  });

  it('fails closed without exact host selection context', async () => {
    await expect(
      executeFrameworkCommand({ argv: [], cwd: '/tmp', manifests: [] }, () => ({
        schemaVersion: 1,
        root: 'app',
        exitCode: 0,
        stdout: '',
        stderr: '',
      })),
    ).rejects.toThrow('FRAMEWORK_OPS_SELECTION_MISSING');
  });
});
