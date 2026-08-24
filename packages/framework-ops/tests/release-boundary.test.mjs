import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  assertManifestContract,
  assertMetaContract,
  assertNoModuleImports,
  assertRuntimeSourceContract,
  auditAuthoredBoundary,
  extractModuleSpecifiers,
  verifyPackedReleaseBoundary,
} from '../scripts/verify-release-boundary.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const meta = JSON.parse(readFileSync(path.join(packageRoot, 'unisane.meta.json'), 'utf8'));

test('authored source is a dependency-free, type-only boundary', () => {
  const result = auditAuthoredBoundary(packageRoot);
  assert.equal(result.private, true);
  assert.equal(result.runtimeDependencyCount, 0);
  assert.equal(result.firstPartyDependencyCount, 0);
  assert.equal(result.runtimeSourceFileCount, 1);
  assert.equal(result.runtimeModuleImportCount, 0);
  assert.equal(result.executableRuntimeSourceCount, 0);
  assert.equal(result.retiredExecutableSurfaceCount, 0);
});

test('the typed seam leaves Framework descriptor and Ops projection shapes unknown', () => {
  const source = readFileSync(path.join(packageRoot, 'src/index.ts'), 'utf8');
  assert.match(source, /SerializedFrameworkProjectDescriptor = unknown/u);
  assert.match(source, /FrameworkOpsDescriptorBoundary<TValidatedDescriptor, TOpsProjection>/u);
  for (const inventedField of [
    'schemaVersion',
    'digest',
    'projectId',
    'capabilities',
    'compatibility',
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\b${inventedField}\\b`, 'u'));
  }
});

test('runtime dependencies and first-party development dependencies fail closed', () => {
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        dependencies: { zod: '^3.23.0' },
      }),
    /zero runtime dependencies/u,
  );
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        devDependencies: { ...manifest.devDependencies, '@unisane/devtools': '0.1.0' },
      }),
    /zero Framework, Compiler, Devtools, or other first-party dependencies/u,
  );
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        devDependencies: {
          ...manifest.devDependencies,
          bridge: 'npm:@unisane/compiler@0.1.0',
        },
      }),
    /zero Framework, Compiler, Devtools, or other first-party dependencies/u,
  );
});

test('package metadata rejects dependencies and retired exports', () => {
  assert.throws(
    () => assertMetaContract({ ...meta, requiresPackages: ['@unisane/devtools'] }),
    /retains a package dependency or retired export/u,
  );
  assert.throws(
    () => assertMetaContract({ ...meta, exports: ['.', './handlers/framework'] }),
    /retains a package dependency or retired export/u,
  );
});

test('publication, binaries, old exports, and old packed files fail closed', () => {
  assert.throws(
    () => assertManifestContract({ ...manifest, private: false }),
    /must remain private/u,
  );
  assert.throws(
    () => assertManifestContract({ ...manifest, bin: { unisane: './dist/index.js' } }),
    /must not expose a binary/u,
  );
  for (const [exportPath, target] of [
    ['./pack-manifest', './pack.manifest.json'],
    ['./handlers/framework', './dist/handlers/framework.js'],
    ['./contributions/add', './dist/contributions/add.js'],
  ]) {
    assert.throws(
      () =>
        assertManifestContract({
          ...manifest,
          exports: { ...manifest.exports, [exportPath]: target },
        }),
      /unexpected package subpath/u,
    );
  }
  assert.throws(
    () => assertManifestContract({ ...manifest, files: [...manifest.files, 'pack.manifest.json'] }),
    /unexpected packed file declaration/u,
  );
});

test('build and test scripts cannot restore retired executable entrypoints', () => {
  assert.throws(
    () =>
      assertManifestContract({
        ...manifest,
        scripts: {
          ...manifest.scripts,
          build: `${manifest.scripts.build} src/handlers/framework.ts`,
        },
      }),
    /unexpected build, test, or pack-check contract|retired executable surfaces/u,
  );
});

test('Framework, Compiler, Devtools, and dynamic module imports fail closed', () => {
  for (const source of [
    "import type { FrameworkCommandRequest } from '@unisane/devtools/framework-integration';",
    "export type Compiler = import('@unisane/compiler').Compiler;",
    "const target = '@unisane/devtools'; void import(target);",
  ]) {
    assert.throws(
      () => assertNoModuleImports(extractModuleSpecifiers(source), 'Synthetic runtime source'),
      /dependency-free|non-literal dynamic module loading/u,
    );
  }
});

test('executable declarations and retired bridge behavior fail closed', () => {
  const cases = [
    'export const executable = true;',
    'export interface Boundary { argv: readonly string[]; }',
    'export interface Boundary { stdout: string; stderr: string; }',
    'export interface Boundary { runFrameworkCommand(): void; }',
    'export interface Boundary { execute(): typeof process.exitCode; }',
    'spawnSync("unisane", []);',
  ];
  for (const source of cases) {
    assert.throws(
      () => assertRuntimeSourceContract(source, 'Synthetic runtime source'),
      /type declarations only|forbidden runtime patterns/u,
    );
  }
});

test('packed artifact preserves the exact private typed-boundary shape', () => {
  const result = verifyPackedReleaseBoundary(packageRoot);
  assert.equal(result.private, true);
  assert.equal(result.packedEntryCount, 5);
  assert.equal(result.packedModuleImportCount, 0);
  assert.equal(result.publishBlocked, true);
  assert.equal(result.registryAuthorityMutation, false);
  assert.equal(result.published, false);
});
