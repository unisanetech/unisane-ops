#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const AUTHORED_EXTENSIONS = ['.cjs', '.cts', '.d.ts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'];
const FRAMEWORK_COORDINATES = new Set([
  '@unisane/compiler',
  '@unisane/devtools',
  '@unisane/kernel',
  '@unisane/platform',
]);
const EXPECTED_EXPORTS = {
  '.': {
    types: './dist/index.d.ts',
    import: './dist/index.js',
    default: './dist/index.js',
  },
  './meta': './unisane.meta.json',
};
const EXPECTED_FILES = ['dist', 'unisane.meta.json', 'README.md'];
const SOURCE_SCRIPTS = {
  build: 'tsup src/index.ts --format esm --dts --clean',
  dev: 'tsup src/index.ts --format esm --dts --watch',
  lint: 'eslint src scripts tests --max-warnings 0',
  test: 'pnpm build && vitest run src && node --test tests/*.test.mjs',
  'check-types': 'tsc --noEmit',
  'check:boundary': 'node scripts/verify-release-boundary.mjs --source-only',
  'pack:check': 'pnpm build && node scripts/verify-release-boundary.mjs',
  prepublishOnly: 'pnpm pack:check && pnpm check-types && pnpm test',
};
const PACKED_SCRIPTS = Object.fromEntries(
  Object.entries(SOURCE_SCRIPTS).filter(([name]) => name !== 'prepublishOnly'),
);
const EXPECTED_ARCHIVE_FILES = [
  'package/README.md',
  'package/dist/index.d.ts',
  'package/dist/index.js',
  'package/package.json',
  'package/unisane.meta.json',
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `:\n${detail}` : '.'}`);
  }
  return result.stdout ?? '';
}

function walkFiles(root) {
  const files = [];
  const visit = (current) => {
    for (const name of readdirSync(current).sort()) {
      const target = path.join(current, name);
      const stat = statSync(target);
      if (stat.isDirectory()) visit(target);
      else if (stat.isFile()) files.push(target);
    }
  };
  visit(root);
  return files;
}

function literalText(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
}

export function extractModuleSpecifiers(source, fileName = 'fixture.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    /\.[cm]?jsx?$/u.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS,
  );
  const specifiers = [];
  const add = (node, kind) => {
    const specifier = literalText(node);
    if (specifier) specifiers.push({ kind, specifier });
  };
  const addLoader = (node, kind) => {
    const specifier = literalText(node);
    specifiers.push(specifier ? { kind, specifier } : { kind, staticallyResolved: false });
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      add(node.moduleSpecifier, ts.isImportDeclaration(node) ? 'import' : 'export');
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression
    ) {
      add(node.moduleReference.expression, 'import-equals');
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      add(node.argument.literal, 'import-type');
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        addLoader(node.arguments[0], 'dynamic-import');
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        addLoader(node.arguments[0], 'require');
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'require' &&
        node.expression.name.text === 'resolve'
      ) {
        addLoader(node.arguments[0], 'require-resolve');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function packageCoordinate(specifier) {
  if (!specifier.startsWith('@')) return specifier.split('/')[0];
  return specifier.split('/').slice(0, 2).join('/');
}

export function assertStaticModuleBoundary(records, context) {
  const unresolved = records.filter(({ staticallyResolved }) => staticallyResolved === false);
  if (unresolved.length > 0) {
    throw new Error(`${context} contains non-literal dynamic module loading.`);
  }
  const firstParty = [
    ...new Set(
      records
        .map(({ specifier }) => packageCoordinate(specifier))
        .filter((coordinate) => coordinate.startsWith('@unisane/')),
    ),
  ].sort();
  if (firstParty.length > 0) {
    throw new Error(`${context} imports forbidden first-party packages: ${firstParty.join(', ')}`);
  }
  const framework = records
    .map(({ specifier }) => packageCoordinate(specifier))
    .filter((coordinate) => FRAMEWORK_COORDINATES.has(coordinate));
  if (framework.length > 0) {
    throw new Error(`${context} imports Framework runtime packages: ${framework.join(', ')}`);
  }
  return firstParty;
}

export function assertManifestContract(
  manifest,
  context = 'framework-ops manifest',
  expectedScripts = SOURCE_SCRIPTS,
) {
  if (manifest.name !== '@unisane/framework-ops' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(manifest.version ?? '')) {
    throw new Error(`${context} has an unexpected package identity.`);
  }
  for (const field of DEPENDENCY_FIELDS) {
    if (Object.keys(manifest[field] ?? {}).length > 0) {
      throw new Error(`${context} must declare zero runtime, optional, and peer dependencies.`);
    }
  }
  if (JSON.stringify(manifest.exports) !== JSON.stringify(EXPECTED_EXPORTS)) {
    throw new Error(`${context} has unexpected public exports.`);
  }
  if (JSON.stringify(manifest.files) !== JSON.stringify(EXPECTED_FILES)) {
    throw new Error(`${context} has an unexpected packed file allowlist.`);
  }
  if (JSON.stringify(manifest.scripts) !== JSON.stringify(expectedScripts)) {
    throw new Error(
      `${context} has unexpected executable scripts: ${JSON.stringify(manifest.scripts ?? {})}.`,
    );
  }
  return manifest;
}

function authoredRecords(root) {
  const records = [];
  for (const directory of ['scripts', 'src', 'tests']) {
    const directoryPath = path.join(root, directory);
    for (const filePath of walkFiles(directoryPath)) {
      if (!AUTHORED_EXTENSIONS.some((extension) => filePath.endsWith(extension))) continue;
      const relativePath = path.relative(root, filePath).split(path.sep).join('/');
      for (const record of extractModuleSpecifiers(readFileSync(filePath, 'utf8'), relativePath)) {
        records.push({ ...record, path: relativePath });
      }
    }
  }
  return records;
}

export function auditAuthoredBoundary(root = packageRoot) {
  const manifest = assertManifestContract(readJson(path.join(root, 'package.json')));
  const records = authoredRecords(root);
  const firstPartyImports = assertStaticModuleBoundary(records, 'Authored framework-ops source');
  return {
    schemaVersion: 1,
    package: manifest.name,
    version: manifest.version,
    runtimeDependencyCount: DEPENDENCY_FIELDS.reduce(
      (count, field) => count + Object.keys(manifest[field] ?? {}).length,
      0,
    ),
    authoredModuleSpecifierCount: records.length,
    firstPartyImports,
    executableBridgePresent: false,
    commandDiscoveryPresent: false,
  };
}

function parsePackOutput(output) {
  const parsed = JSON.parse(output.trim());
  const record = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!record?.filename) throw new Error('pnpm pack did not report a tarball filename.');
  return record.filename;
}

function archiveEntries(tarballPath) {
  return run('tar', ['-tzf', tarballPath])
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry && !entry.endsWith('/'))
    .sort();
}

function archiveText(tarballPath, entry) {
  return run('tar', ['-xOf', tarballPath, entry]);
}

export function verifyPackedReleaseBoundary(root = packageRoot) {
  auditAuthoredBoundary(root);
  const workRoot = mkdtempSync(path.join(tmpdir(), 'framework-ops-release-boundary-'));
  try {
    const tarballPath = parsePackOutput(
      run('pnpm', ['pack', '--pack-destination', workRoot, '--json'], { cwd: root }),
    );
    const entries = archiveEntries(tarballPath);
    if (JSON.stringify(entries) !== JSON.stringify(EXPECTED_ARCHIVE_FILES)) {
      throw new Error(
        `Packed framework-ops artifact has unexpected files: ${entries.join(', ') || 'none'}.`,
      );
    }
    const manifest = assertManifestContract(
      JSON.parse(archiveText(tarballPath, 'package/package.json')),
      'Packed framework-ops manifest',
      PACKED_SCRIPTS,
    );
    const sourceManifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (manifest.version !== sourceManifest.version) {
      throw new Error('Packed framework-ops version differs from its source manifest.');
    }
    const emittedRecords = ['package/dist/index.js', 'package/dist/index.d.ts'].flatMap((entry) =>
      extractModuleSpecifiers(archiveText(tarballPath, entry), entry).map((record) => ({
        ...record,
        path: entry,
      })),
    );
    const firstPartyImports = assertStaticModuleBoundary(
      emittedRecords,
      'Packed framework-ops runtime and declarations',
    );
    return {
      schemaVersion: 1,
      package: manifest.name,
      version: manifest.version,
      packedEntryCount: entries.length,
      runtimeDependencyCount: 0,
      packedFirstPartyImports: firstPartyImports,
      executableBridgePresent: false,
      commandDiscoveryPresent: false,
      registryAuthorityMutation: false,
      published: false,
    };
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
}

function main() {
  const result = process.argv.includes('--source-only')
    ? auditAuthoredBoundary(packageRoot)
    : verifyPackedReleaseBoundary(packageRoot);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
