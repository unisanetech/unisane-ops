#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPENDENCY_FIELDS = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
];
const RUNTIME_DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const EXPECTED_FILES = ['README.md', 'dist', 'unisane.meta.json'];
const EXPECTED_EXPORTS = ['.', './meta'];
const EXPECTED_ARCHIVE_FILES = [
  'package/README.md',
  'package/dist/index.d.ts',
  'package/dist/index.js',
  'package/package.json',
  'package/unisane.meta.json',
];
const RETIRED_AUTHORED_PATHS = [
  'pack.manifest.json',
  'src/contributions/add.ts',
  'src/handlers/framework.ts',
];
const FORBIDDEN_SCRIPT_PATTERNS = [
  /@unisane\/(?:compiler|devtools)/u,
  /contributions\/add/u,
  /framework-integration/u,
  /handlers\/framework/u,
  /pack\.manifest/u,
  /vitest/u,
];
const FORBIDDEN_RUNTIME_PATTERNS = [
  ['raw argv handling', /\bargv\b/u],
  ['stdout access', /\bstdout\b/u],
  ['stderr access', /\bstderr\b/u],
  ['process exit handling', /\bprocess\s*\.\s*exit(?:Code)?\b/u],
  ['nested CLI execution', /\b(?:exec|execFile|execFileSync|execSync|fork|spawn|spawnSync)\s*\(/u],
  ['Framework command bridge', /\brunFrameworkCommand\b/u],
  ['pack command contract', /\bPackCommand(?:Context|Handler|Result)\b/u],
  ['lifecycle command contribution', /\bOpsLifecycleContribution(?:Context|Result)\b/u],
  ['retired Framework integration export', /framework-integration/u],
  ['retired Framework handler export', /handlers\/framework/u],
  ['retired Framework contribution export', /contributions\/add/u],
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

function assertParseable(sourceFile, context) {
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(`${context} contains invalid TypeScript syntax.`);
  }
}

export function extractModuleSpecifiers(source, fileName = 'fixture.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    /\.[cm]?jsx?$/u.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS,
  );
  assertParseable(sourceFile, fileName);
  const records = [];
  const add = (node, kind) => {
    const specifier = literalText(node);
    records.push({ kind, specifier });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) add(node.moduleSpecifier, 'static');
    } else if (ts.isImportTypeNode(node)) {
      add(node.argument.literal, 'import-type');
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        add(node.arguments[0], 'dynamic-import');
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        add(node.arguments[0], 'require');
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'require' &&
        node.expression.name.text === 'resolve'
      ) {
        add(node.arguments[0], 'require.resolve');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return records;
}

export function assertNoModuleImports(records, context) {
  const unresolved = records.filter(({ specifier }) => specifier === null);
  if (unresolved.length > 0) {
    throw new Error(`${context} contains non-literal dynamic module loading.`);
  }
  if (records.length > 0) {
    throw new Error(
      `${context} must remain dependency-free; found module imports: ${[
        ...new Set(records.map(({ specifier }) => specifier)),
      ]
        .sort()
        .join(', ')}`,
    );
  }
  return [];
}

function assertTypeOnlySource(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assertParseable(sourceFile, fileName);
  const executable = sourceFile.statements.filter(
    (statement) =>
      !ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement),
  );
  if (executable.length > 0) {
    throw new Error(`${fileName} must contain type declarations only.`);
  }
}

export function assertRuntimeSourceContract(source, fileName = 'fixture.ts') {
  assertTypeOnlySource(source, fileName);
  assertNoModuleImports(extractModuleSpecifiers(source, fileName), fileName);
  const violations = FORBIDDEN_RUNTIME_PATTERNS.filter(([, expression]) =>
    expression.test(source),
  ).map(([label]) => label);
  if (violations.length > 0) {
    throw new Error(`${fileName} contains forbidden runtime patterns: ${violations.join(', ')}.`);
  }
  return { typeOnly: true, moduleImportCount: 0, forbiddenPatternCount: 0 };
}

function sortedObjectKeys(value) {
  return Object.keys(value ?? {}).sort();
}

export function assertManifestContract(manifest, context = 'framework-ops manifest') {
  if (manifest.name !== '@unisane/framework-ops' || manifest.version !== '0.1.0') {
    throw new Error(`${context} has an unexpected package identity.`);
  }
  if (manifest.private !== true) {
    throw new Error(`${context} must remain private until the descriptor adapter is implemented.`);
  }
  if (manifest.bin !== undefined) {
    throw new Error(`${context} must not expose a binary.`);
  }
  const runtimeDependencies = RUNTIME_DEPENDENCY_FIELDS.flatMap((field) =>
    Object.keys(manifest[field] ?? {}).map((name) => `${field}:${name}`),
  );
  if (runtimeDependencies.length > 0) {
    throw new Error(
      `${context} must have zero runtime dependencies; found ${runtimeDependencies.join(', ')}.`,
    );
  }
  const firstPartyDependencies = DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(
        ([name, specifier]) =>
          name.startsWith('@unisane/') ||
          String(specifier).includes('@unisane/') ||
          /^(?:file|link|workspace):/u.test(String(specifier)),
      )
      .map(([name]) => `${field}:${name}`),
  );
  if (firstPartyDependencies.length > 0) {
    throw new Error(
      `${context} must have zero Framework, Compiler, Devtools, or other first-party dependencies; found ${firstPartyDependencies.join(', ')}.`,
    );
  }
  if (JSON.stringify(sortedObjectKeys(manifest.exports)) !== JSON.stringify(EXPECTED_EXPORTS)) {
    throw new Error(`${context} exposes an unexpected package subpath.`);
  }
  if (
    manifest.exports?.['.']?.types !== './dist/index.d.ts' ||
    manifest.exports?.['.']?.import !== './dist/index.js' ||
    manifest.exports?.['.']?.default !== './dist/index.js' ||
    manifest.exports?.['./meta'] !== './unisane.meta.json'
  ) {
    throw new Error(`${context} has an unexpected root or metadata export.`);
  }
  if (JSON.stringify([...(manifest.files ?? [])].sort()) !== JSON.stringify(EXPECTED_FILES)) {
    throw new Error(`${context} has an unexpected packed file declaration.`);
  }
  if (
    manifest.main !== './dist/index.js' ||
    manifest.types !== './dist/index.d.ts' ||
    manifest.sideEffects !== false
  ) {
    throw new Error(`${context} has an unexpected entrypoint contract.`);
  }
  if (
    manifest.scripts?.build !== 'tsup src/index.ts --format esm --dts --clean' ||
    manifest.scripts?.test !== 'pnpm build && node --test tests/*.test.mjs' ||
    manifest.scripts?.['pack:check'] !==
      'pnpm build && node scripts/verify-release-boundary.mjs'
  ) {
    throw new Error(`${context} has an unexpected build, test, or pack-check contract.`);
  }
  const forbiddenScripts = Object.entries(manifest.scripts ?? {})
    .filter(([, command]) =>
      FORBIDDEN_SCRIPT_PATTERNS.some((expression) => expression.test(String(command))),
    )
    .map(([name]) => name);
  if (forbiddenScripts.length > 0) {
    throw new Error(`${context} scripts retain retired executable surfaces: ${forbiddenScripts}.`);
  }
  return manifest;
}

export function assertMetaContract(meta, context = 'framework-ops metadata') {
  if (
    meta.schemaVersion !== 1 ||
    meta.kind !== 'tooling' ||
    meta.id !== '@unisane/framework-ops'
  ) {
    throw new Error(`${context} has an unexpected identity.`);
  }
  if (
    !Array.isArray(meta.requiresPackages) ||
    meta.requiresPackages.length > 0 ||
    !Array.isArray(meta.exports) ||
    JSON.stringify(meta.exports) !== JSON.stringify(['.'])
  ) {
    throw new Error(`${context} retains a package dependency or retired export.`);
  }
  if (JSON.stringify(meta.docs) !== JSON.stringify(['README.md'])) {
    throw new Error(`${context} has an unexpected documentation contract.`);
  }
  return meta;
}

export function auditAuthoredBoundary(root = packageRoot) {
  const manifest = assertManifestContract(readJson(path.join(root, 'package.json')));
  assertMetaContract(readJson(path.join(root, 'unisane.meta.json')));
  const retiredPaths = RETIRED_AUTHORED_PATHS.filter((relativePath) =>
    existsSync(path.join(root, relativePath)),
  );
  if (retiredPaths.length > 0) {
    throw new Error(
      `framework-ops retains retired executable surfaces: ${retiredPaths.join(', ')}.`,
    );
  }
  const sourceRoot = path.join(root, 'src');
  const sourceFiles = walkFiles(sourceRoot).filter((filePath) => filePath.endsWith('.ts'));
  if (sourceFiles.length !== 1 || path.basename(sourceFiles[0]) !== 'index.ts') {
    throw new Error('framework-ops must contain exactly one typed runtime boundary source file.');
  }
  for (const filePath of sourceFiles) {
    assertRuntimeSourceContract(
      readFileSync(filePath, 'utf8'),
      path.relative(root, filePath).split(path.sep).join('/'),
    );
  }
  return {
    schemaVersion: 1,
    package: manifest.name,
    version: manifest.version,
    private: manifest.private,
    runtimeDependencyCount: 0,
    firstPartyDependencyCount: 0,
    runtimeSourceFileCount: sourceFiles.length,
    runtimeModuleImportCount: 0,
    executableRuntimeSourceCount: 0,
    retiredExecutableSurfaceCount: 0,
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
    .filter((entry) => entry && !entry.endsWith('/'));
}

function archiveText(tarballPath, entry) {
  return run('tar', ['-xOf', tarballPath, entry]);
}

function assertExactArchive(entries) {
  if (JSON.stringify([...entries].sort()) !== JSON.stringify(EXPECTED_ARCHIVE_FILES)) {
    throw new Error(
      `Packed framework-ops artifact has an unexpected file set: ${[...entries]
        .sort()
        .join(', ')}.`,
    );
  }
}

export function verifyPackedReleaseBoundary(root = packageRoot) {
  const authored = auditAuthoredBoundary(root);
  const workRoot = mkdtempSync(path.join(tmpdir(), 'framework-ops-release-boundary-'));
  try {
    const output = run('pnpm', ['pack', '--pack-destination', workRoot, '--json'], { cwd: root });
    const tarballPath = parsePackOutput(output);
    const entries = archiveEntries(tarballPath);
    assertExactArchive(entries);
    const packedManifest = assertManifestContract(
      JSON.parse(archiveText(tarballPath, 'package/package.json')),
      'Packed framework-ops manifest',
    );
    assertMetaContract(
      JSON.parse(archiveText(tarballPath, 'package/unisane.meta.json')),
      'Packed framework-ops metadata',
    );
    assertNoModuleImports(
      extractModuleSpecifiers(
        archiveText(tarballPath, 'package/dist/index.js'),
        'package/dist/index.js',
      ),
      'Packed framework-ops runtime',
    );
    assertNoModuleImports(
      extractModuleSpecifiers(
        archiveText(tarballPath, 'package/dist/index.d.ts'),
        'package/dist/index.d.ts',
      ),
      'Packed framework-ops declarations',
    );
    return {
      ...authored,
      packedEntryCount: entries.length,
      packedModuleImportCount: 0,
      tarballSha256: createHash('sha256').update(readFileSync(tarballPath)).digest('hex'),
      registryAuthorityMutation: false,
      published: false,
      publishBlocked: packedManifest.private,
    };
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const result = process.argv.includes('--source-only')
    ? auditAuthoredBoundary()
    : verifyPackedReleaseBoundary();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
