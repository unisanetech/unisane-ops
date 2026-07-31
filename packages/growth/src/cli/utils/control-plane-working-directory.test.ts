import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveControlPlaneWorkingDirectory } from './control-plane-working-directory.js';

const temporaryDirectories: string[] = [];

function createWorkspace(): { appDirectory: string; root: string } {
  const root = mkdtempSync(path.join(tmpdir(), 'unisane-growth-cwd-'));
  temporaryDirectories.push(root);
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
  const appDirectory = path.join(root, 'apps', 'example');
  mkdirSync(appDirectory, { recursive: true });
  return { appDirectory, root };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('resolveControlPlaneWorkingDirectory', () => {
  it('keeps dot relative to the invoking app directory', () => {
    const { appDirectory } = createWorkspace();

    expect(resolveControlPlaneWorkingDirectory('.', { baseCwd: appDirectory })).toBe(appDirectory);
  });

  it('falls back to a workspace-relative path when caller-relative input is absent', () => {
    const { appDirectory, root } = createWorkspace();
    const sibling = path.join(root, 'apps', 'sibling');
    mkdirSync(sibling, { recursive: true });

    expect(resolveControlPlaneWorkingDirectory('apps/sibling', { baseCwd: appDirectory })).toBe(
      sibling,
    );
  });
});
