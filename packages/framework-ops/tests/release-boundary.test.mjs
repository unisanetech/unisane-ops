import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  assertManifestContract,
  assertStaticModuleBoundary,
  auditAuthoredBoundary,
  extractModuleSpecifiers,
  verifyPackedReleaseBoundary,
} from '../scripts/verify-release-boundary.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

test('authored package has zero first-party imports and no executable integration surface', () => {
  assert.deepEqual(auditAuthoredBoundary(packageRoot), {
    schemaVersion: 1,
    package: '@unisane/framework-ops',
    version: '0.1.0',
    runtimeDependencyCount: 0,
    authoredModuleSpecifierCount: 24,
    firstPartyImports: [],
    executableBridgePresent: false,
    commandDiscoveryPresent: false,
  });
});

test('manifest exposes only the descriptor mapper and declares no runtime dependency', () => {
  assert.equal(assertManifestContract(manifest), manifest);
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.optionalDependencies, undefined);
  assert.equal(manifest.peerDependencies, undefined);
  assert.deepEqual(manifest.exports, {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    },
    './meta': './unisane.meta.json',
  });
});

test('Framework, Compiler, Devtools, Ops Engine, and dynamic package imports fail closed', () => {
  for (const specifier of [
    '@unisane/compiler',
    '@unisane/compiler/project-descriptor-contract/v1',
    '@unisane/devtools',
    '@unisane/devtools/framework-integration',
    '@unisane/kernel',
    '@unisane/ops-engine',
  ]) {
    assert.throws(
      () =>
        assertStaticModuleBoundary(
          [{ kind: 'import', specifier, path: 'synthetic.ts' }],
          'Synthetic source',
        ),
      /forbidden first-party packages/u,
    );
  }
  assert.throws(
    () =>
      assertStaticModuleBoundary(
        extractModuleSpecifiers('const name = process.argv[2]; import(name);'),
        'Synthetic source',
      ),
    /non-literal dynamic module loading/u,
  );
});

test('runtime dependency or retired executable export declarations fail closed', () => {
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        dependencies: { '@unisane/devtools': '0.1.0' },
      }),
    /zero runtime, optional, and peer dependencies/u,
  );
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        exports: {
          ...manifest.exports,
          './handlers/framework': './dist/handlers/framework.js',
        },
      }),
    /unexpected public exports/u,
  );
});

test('packed artifact is descriptor-only with an exact dependency-free file boundary', () => {
  assert.deepEqual(verifyPackedReleaseBoundary(packageRoot), {
    schemaVersion: 1,
    package: '@unisane/framework-ops',
    version: '0.1.0',
    packedEntryCount: 5,
    runtimeDependencyCount: 0,
    packedFirstPartyImports: [],
    executableBridgePresent: false,
    commandDiscoveryPresent: false,
    registryAuthorityMutation: false,
    published: false,
  });
});
