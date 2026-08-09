import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  assertDeclaredFirstPartyImports,
  assertManifestContract,
  assertOnlyFrameworkIntegration,
  assertPackedImportContract,
  assertReachableEmittedFiles,
  auditAuthoredBoundary,
  extractModuleSpecifiers,
  verifyPackedReleaseBoundary,
} from '../scripts/verify-release-boundary.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

test('authored source uses only the exact Devtools framework-integration export', () => {
  const result = auditAuthoredBoundary(packageRoot);
  assert.equal(result.devtoolsDependency, '@unisane/devtools@0.1.0');
  assert.equal(result.devtoolsIntegrationImportCount, 2);
  assert.deepEqual(result.devtoolsIntegrationImportPaths, [
    'src/contributions/add.ts',
    'src/handlers/framework.ts',
  ]);
});

test('private, root, dynamic, import-type, and require Devtools paths fail closed', () => {
  const cases = [
    "import '@unisane/devtools';",
    "export * from '@unisane/devtools/private/compiler';",
    "void import('@unisane/devtools/src/compiler', { with: { type: 'json' } });",
    "type Private = import('@unisane/devtools/internal').Private;",
    "require.resolve('@unisane/devtools/dist/cli.js');",
  ];
  for (const source of cases) {
    assert.throws(
      () => assertOnlyFrameworkIntegration(extractModuleSpecifiers(source), 'Synthetic fixture'),
      /forbidden Devtools surfaces/,
    );
  }
});

test('non-literal dynamic import, require, and require.resolve fail closed in source audit', () => {
  for (const source of [
    "const target = '@unisane/devtools/private/compiler'; void import(target);",
    "const target = '@unisane/devtools/private/compiler'; require(target);",
    "const target = '@unisane/devtools/private/compiler'; require.resolve(target);",
  ]) {
    assert.throws(
      () => assertOnlyFrameworkIntegration(extractModuleSpecifiers(source), 'Source fixture'),
      /non-literal dynamic module loading/,
    );
  }
});

test('non-literal loaders fail through the packed module audit path', () => {
  for (const source of [
    'const target = process.env.MODULE; void import(target);',
    'const target = process.env.MODULE; require(target);',
    'const target = process.env.MODULE; require.resolve(target);',
  ]) {
    const records = extractModuleSpecifiers(source, 'package/dist/fixture.js');
    assert.throws(
      () => assertPackedImportContract(records, manifest, 'Synthetic packed artifact'),
      /non-literal dynamic module loading/,
    );
  }
});

test('ordinary non-loader calls with computed arguments remain outside the module audit', () => {
  const records = extractModuleSpecifiers(
    'const target = process.env.MODULE; load(target); resolver.resolve(target); notRequire(target);',
  );
  assert.deepEqual(records, []);
  assert.deepEqual(assertOnlyFrameworkIntegration(records, 'Ordinary call fixture'), []);
});

test('local fallback, alias, and range coordinates fail the manifest contract', () => {
  for (const specifier of [
    'workspace:*',
    'file:../devtools',
    'link:../devtools',
    'npm:@other/devtools@0.1.0',
    '^0.1.0',
  ]) {
    assert.throws(
      () =>
        assertManifestContract({
          ...manifest,
          dependencies: { ...manifest.dependencies, '@unisane/devtools': specifier },
        }),
      /must depend on @unisane\/devtools@0\.1\.0 exactly/,
    );
  }
});

test('undeclared first-party emitted imports fail closed', () => {
  assert.throws(
    () =>
      assertDeclaredFirstPartyImports(
        [{ kind: 'import', specifier: '@unisane/private-owner/runtime' }],
        manifest,
        'Synthetic packed artifact',
      ),
    /undeclared emitted imports: @unisane\/private-owner/,
  );
});

test('unreferenced emitted JavaScript and declaration files fail the packed content audit', () => {
  const fixtureManifest = {
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': { import: './dist/index.js', types: './dist/index.d.ts' },
    },
  };
  for (const unexpected of ['package/dist/private.js', 'package/dist/stale.d.ts']) {
    const files = new Map([
      ['package/dist/index.js', 'export const value = true;'],
      ['package/dist/index.d.ts', 'export declare const value: boolean;'],
      [unexpected, 'export declare const stale: boolean;'],
    ]);
    assert.throws(
      () =>
        assertReachableEmittedFiles([...files.keys()], fixtureManifest, (entry) =>
          files.get(entry),
        ),
      /unreferenced emitted files/,
    );
  }
});

test('packed Devtools import cardinality is exact', () => {
  const records = [
    {
      kind: 'import',
      specifier: '@unisane/devtools/framework-integration',
      path: 'package/dist/index.js',
    },
    {
      kind: 'import',
      specifier: '@unisane/devtools/framework-integration',
      path: 'package/dist/index.d.ts',
    },
    { kind: 'import', specifier: '@unisane/ops-engine/pack', path: 'package/dist/index.js' },
  ];
  assert.throws(
    () => assertPackedImportContract(records, manifest, 'Synthetic packed artifact'),
    /exactly 2 runtime and 2 declaration/,
  );
});

test('packed first-party package set is exact even when an extra package is declared', () => {
  const records = [
    ...['runtime-a.js', 'runtime-b.js', 'types-a.d.ts', 'types-b.d.ts'].map((filePath) => ({
      kind: 'import',
      specifier: '@unisane/devtools/framework-integration',
      path: `package/dist/${filePath}`,
    })),
    { kind: 'import', specifier: '@unisane/ops-engine/pack', path: 'package/dist/index.js' },
    { kind: 'import', specifier: '@unisane/extra/runtime', path: 'package/dist/index.js' },
  ];
  const expandedManifest = {
    ...manifest,
    dependencies: { ...manifest.dependencies, '@unisane/extra': '0.1.0' },
  };
  assert.throws(
    () => assertPackedImportContract(records, expandedManifest, 'Synthetic packed artifact'),
    /must contain exactly these first-party imports/,
  );
});

test('packed manifest, contents, runtime imports, and declarations preserve the boundary', () => {
  const result = verifyPackedReleaseBoundary(packageRoot);
  assert.equal(result.devtoolsDependency, '@unisane/devtools@0.1.0');
  assert.equal(result.allowedDevtoolsExport, '@unisane/devtools/framework-integration');
  assert.equal(result.packedEntryCount, 12);
  assert.equal(result.packedRuntimeDevtoolsImportCount, 2);
  assert.equal(result.packedDeclarationDevtoolsImportCount, 2);
  assert.deepEqual(result.packedFirstPartyImports, ['@unisane/devtools', '@unisane/ops-engine']);
  assert.equal(result.registryAuthorityMutation, false);
  assert.equal(result.published, false);
});
