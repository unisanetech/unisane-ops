import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  assertDeclaredFirstPartyImports,
  assertManifestContract,
  assertOnlyFrameworkIntegration,
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

test('packed manifest, contents, runtime imports, and declarations preserve the boundary', () => {
  const result = verifyPackedReleaseBoundary(packageRoot);
  assert.equal(result.devtoolsDependency, '@unisane/devtools@0.1.0');
  assert.equal(result.allowedDevtoolsExport, '@unisane/devtools/framework-integration');
  assert.ok(result.packedRuntimeDevtoolsImportCount > 0);
  assert.ok(result.packedDeclarationDevtoolsImportCount > 0);
  assert.equal(result.registryAuthorityMutation, false);
  assert.equal(result.published, false);
});
