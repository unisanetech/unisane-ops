import { describe, expect, it, vi } from 'vitest';
import type { PackCommandContext, PackCommandDescriptor } from '@unisane/ops-engine/pack';
import { executeFrameworkCommand } from '../handlers/framework.js';

const descriptor: PackCommandDescriptor = {
  id: 'framework.sync',
  path: ['sync'],
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
  it('routes exact selection context through the narrow Framework bridge', () => {
    const bridge = vi.fn(() => ({
      schemaVersion: 1 as const,
      root: 'sync' as const,
      exitCode: 0,
      stdout: 'Framework sync help\n',
      stderr: '',
    }));
    const result = executeFrameworkCommand(context(), bridge);
    expect(bridge).toHaveBeenCalledWith({
      root: 'sync',
      argv: ['--help'],
      cwd: '/tmp/framework-project',
      json: false,
    });
    expect(result).toMatchObject({
      command: 'framework.sync',
      pack: 'framework',
      status: 'ok',
      actualEffect: 'write',
      presentation: { stdout: 'Framework sync help\n', stderr: '' },
    });
  });

  it('wraps JSON output without emitting human presentation', () => {
    const result = executeFrameworkCommand(context(true), () => ({
      schemaVersion: 1,
      root: 'sync',
      exitCode: 0,
      stdout: '{"ok":true}\n',
      stderr: '',
    }));
    expect(result.result).toEqual({ exitCode: 0, output: { ok: true } });
    expect(result.presentation).toBeUndefined();
  });

  it('fails closed without exact host selection context', () => {
    expect(() =>
      executeFrameworkCommand({ argv: [], cwd: '/tmp', manifests: [] }, () => ({
        schemaVersion: 1,
        root: 'sync',
        exitCode: 0,
        stdout: '',
        stderr: '',
      })),
    ).toThrow('FRAMEWORK_OPS_SELECTION_MISSING');
  });
});
