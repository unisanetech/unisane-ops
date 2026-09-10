import assert from 'node:assert/strict';
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { execPath } from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectoryNames = new Set([
  '.git',
  '.tmp',
  '.pnpm-store',
  '.DS_Store',
  '.skopos',
  '.unisane',
  '.turbo',
  'node_modules',
  'dist',
  'coverage',
]);

function makeFixture() {
  const container = mkdtempSync(join(tmpdir(), 'unisane-ops-integrity-'));
  const fixtureRoot = join(container, 'repository');
  cpSync(root, fixtureRoot, {
    recursive: true,
    filter(source) {
      const path = relative(root, source);
      if (!path) return true;
      return !path.split(sep).some((segment) => ignoredDirectoryNames.has(segment));
    },
  });
  return { container, fixtureRoot };
}

function runGuard(fixtureRoot, mode = '--check') {
  return spawnSync(execPath, [join(fixtureRoot, 'scripts/check-repository-integrity.mjs'), mode], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
}

function assertGuardFails(result, pattern) {
  assert.notEqual(result.status, 0, `guard unexpectedly passed:\n${result.stdout}${result.stderr}`);
  assert.match(`${result.stdout}${result.stderr}`, pattern);
}

function withFixture(callback) {
  const { container, fixtureRoot } = makeFixture();
  try {
    callback(fixtureRoot);
  } finally {
    rmSync(container, { recursive: true, force: true });
  }
}

function updateManifest(fixtureRoot, path, mutate) {
  const manifestPath = join(fixtureRoot, path);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  mutate(manifest);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

test('tracked clean shape satisfies the permanent standalone integrity contract', () => {
  const result = runGuard(root);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /0 external blockers, and 2 exact admitted released edges/);
});

test('generated output allowlist and source drift fail closed', () => {
  withFixture((fixtureRoot) => {
    const unexpected = join(fixtureRoot, 'docs/reference/generated/repository/unowned.json');
    mkdirSync(dirname(unexpected), { recursive: true });
    writeFileSync(unexpected, '{}\n');
    assertGuardFails(runGuard(fixtureRoot), /generated output is not owned by the exact allowlist/);
  });

  withFixture((fixtureRoot) => {
    appendFileSync(join(fixtureRoot, 'docs/overview.md'), '\nfixture-only drift\n');
    assertGuardFails(runGuard(fixtureRoot, '--check-generated'), /is missing or stale/);
  });
});

test('the exact two admitted released dependencies cannot drift or disappear', () => {
  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, 'apps/console/package.json', (manifest) => {
      manifest.dependencies['@unisane/ui'] = '0.1.2';
    });
    assertGuardFails(
      runGuard(fixtureRoot),
      /admitted released dependency edges differ from the exact accepted set/,
    );
  });

  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, 'apps/console/package.json', (manifest) => {
      delete manifest.dependencies['@unisane/data-table'];
    });
    assertGuardFails(
      runGuard(fixtureRoot),
      /admitted released dependency edges differ from the exact accepted set/,
    );
  });
});

test('a renewed foreign workspace UI edge fails closed', () => {
  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, 'apps/console/package.json', (manifest) => {
      manifest.dependencies['@unisane/ui'] = 'workspace:*';
    });
    const result = runGuard(fixtureRoot);
    assertGuardFails(result, /foreign workspace blockers differ from the exact accepted set/);
    assert.match(
      `${result.stdout}${result.stderr}`,
      /admitted released dependency edges differ from the exact accepted set/,
    );
  });
});

test('new foreign workspace and file or link edges fail closed', () => {
  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, 'packages/cloud/package.json', (manifest) => {
      manifest.devDependencies = {
        ...manifest.devDependencies,
        '@foreign/workspace': 'workspace:*',
      };
    });
    assertGuardFails(
      runGuard(fixtureRoot),
      /foreign workspace blockers differ from the exact accepted set/,
    );
  });

  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, 'packages/cloud/package.json', (manifest) => {
      manifest.devDependencies = {
        ...manifest.devDependencies,
        '@private/source': `file:${basename(fixtureRoot)}`,
      };
    });
    assertGuardFails(runGuard(fixtureRoot), /file\/link dependency is forbidden/);
  });
});

test('expected standalone root shape is derived from tracked content', () => {
  withFixture((fixtureRoot) => {
    rmSync(join(fixtureRoot, 'tests'), { recursive: true, force: true });
    assertGuardFails(runGuard(fixtureRoot), /expected standalone root path is missing: tests/);
  });

  withFixture((fixtureRoot) => {
    mkdirSync(join(fixtureRoot, 'foreign-root'));
    writeFileSync(join(fixtureRoot, 'foreign-root/README.md'), 'fixture only\n');
    assertGuardFails(runGuard(fixtureRoot), /unexpected standalone root path: foreign-root/);
  });
});
