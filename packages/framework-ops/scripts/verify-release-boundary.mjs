#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEVTOOLS_PACKAGE = '@unisane/devtools';
const DEVTOOLS_VERSION = '0.1.0';
const DEVTOOLS_INTEGRATION = '@unisane/devtools/framework-integration';
const DEPENDENCY_FIELDS = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
];
const RUNTIME_DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const AUTHORED_EXTENSIONS = ['.cjs', '.cts', '.d.ts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'];
const REQUIRED_ARCHIVE_FILES = [
  'package/README.md',
  'package/dist/contributions/add.d.ts',
  'package/dist/contributions/add.js',
  'package/dist/handlers/framework.d.ts',
  'package/dist/handlers/framework.js',
  'package/dist/index.d.ts',
  'package/dist/index.js',
  'package/pack.manifest.json',
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
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null;
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
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
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
        add(node.arguments[0], 'require-resolve');
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

export function assertOnlyFrameworkIntegration(records, context) {
  const devtools = records.filter(
    ({ specifier }) => packageCoordinate(specifier) === DEVTOOLS_PACKAGE,
  );
  const forbidden = devtools.filter(({ specifier }) => specifier !== DEVTOOLS_INTEGRATION);
  if (forbidden.length > 0) {
    throw new Error(
      `${context} imports forbidden Devtools surfaces: ${[...new Set(forbidden.map(({ specifier }) => specifier))].sort().join(', ')}`,
    );
  }
  return devtools;
}

export function assertManifestContract(manifest, context = 'framework-ops manifest') {
  if (manifest.name !== '@unisane/framework-ops' || manifest.version !== '0.1.0') {
    throw new Error(`${context} has an unexpected package identity.`);
  }
  if (manifest.dependencies?.[DEVTOOLS_PACKAGE] !== DEVTOOLS_VERSION) {
    throw new Error(`${context} must depend on ${DEVTOOLS_PACKAGE}@${DEVTOOLS_VERSION} exactly.`);
  }
  for (const field of DEPENDENCY_FIELDS) {
    if (field !== 'dependencies' && manifest[field]?.[DEVTOOLS_PACKAGE] !== undefined) {
      throw new Error(`${context} declares ${DEVTOOLS_PACKAGE} outside runtime dependencies.`);
    }
  }
  return manifest;
}

export function assertDeclaredFirstPartyImports(records, manifest, context) {
  const declared = new Set(
    RUNTIME_DEPENDENCY_FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {})),
  );
  const firstParty = [
    ...new Set(
      records
        .map(({ specifier }) => packageCoordinate(specifier))
        .filter((coordinate) => coordinate.startsWith('@unisane/')),
    ),
  ].sort();
  const undeclared = firstParty.filter((coordinate) => !declared.has(coordinate));
  if (undeclared.length > 0) {
    throw new Error(`${context} contains undeclared emitted imports: ${undeclared.join(', ')}`);
  }
  return firstParty;
}

export function auditAuthoredBoundary(root = packageRoot) {
  const manifest = assertManifestContract(readJson(path.join(root, 'package.json')));
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
  const devtools = assertOnlyFrameworkIntegration(records, 'Authored framework-ops source');
  if (devtools.length !== 2) {
    throw new Error(
      `Authored framework-ops source must contain exactly 2 Devtools integration imports; found ${devtools.length}.`,
    );
  }
  return {
    schemaVersion: 1,
    package: manifest.name,
    version: manifest.version,
    devtoolsDependency: `${DEVTOOLS_PACKAGE}@${DEVTOOLS_VERSION}`,
    allowedDevtoolsExport: DEVTOOLS_INTEGRATION,
    authoredModuleSpecifierCount: records.length,
    devtoolsIntegrationImportCount: devtools.length,
    devtoolsIntegrationImportPaths: [
      ...new Set(devtools.map(({ path: filePath }) => filePath)),
    ].sort(),
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
    .map((entry) => entry.trim().replace(/\/$/u, ''))
    .filter(Boolean);
}

function archiveText(tarballPath, entry) {
  return run('tar', ['-xOf', tarballPath, entry]);
}

export function verifyPackedReleaseBoundary(root = packageRoot) {
  const authored = auditAuthoredBoundary(root);
  const workRoot = mkdtempSync(path.join(tmpdir(), 'framework-ops-release-boundary-'));
  try {
    const output = run('pnpm', ['pack', '--pack-destination', workRoot, '--json'], { cwd: root });
    const tarballPath = parsePackOutput(output);
    const entries = archiveEntries(tarballPath);
    for (const required of REQUIRED_ARCHIVE_FILES) {
      if (!entries.includes(required))
        throw new Error(`Packed framework-ops artifact is missing ${required}.`);
    }
    const forbidden = entries.filter((entry) =>
      /(?:^|\/)package\/(?:scripts|src|test|tests)(?:\/|$)/u.test(entry),
    );
    if (forbidden.length > 0) {
      throw new Error(
        `Packed framework-ops artifact contains source/test files: ${forbidden.join(', ')}`,
      );
    }
    const unexpected = entries.filter((entry) =>
      entry.startsWith('package/dist/')
        ? !entry.endsWith('.js') && !entry.endsWith('.d.ts')
        : ![
            'package',
            'package/README.md',
            'package/pack.manifest.json',
            'package/package.json',
            'package/unisane.meta.json',
          ].includes(entry),
    );
    if (unexpected.length > 0) {
      throw new Error(
        `Packed framework-ops artifact contains unexpected files: ${unexpected.join(', ')}`,
      );
    }
    const packedManifest = assertManifestContract(
      JSON.parse(archiveText(tarballPath, 'package/package.json')),
      'Packed framework-ops manifest',
    );
    const emittedRecords = [];
    for (const entry of entries.filter(
      (value) => value.endsWith('.js') || value.endsWith('.d.ts'),
    )) {
      for (const record of extractModuleSpecifiers(archiveText(tarballPath, entry), entry)) {
        emittedRecords.push({ ...record, path: entry });
      }
    }
    const emittedDevtools = assertOnlyFrameworkIntegration(
      emittedRecords,
      'Packed framework-ops runtime/declarations',
    );
    const runtimeCount = emittedDevtools.filter(({ path: filePath }) =>
      filePath.endsWith('.js'),
    ).length;
    const declarationCount = emittedDevtools.filter(({ path: filePath }) =>
      filePath.endsWith('.d.ts'),
    ).length;
    if (runtimeCount === 0 || declarationCount === 0) {
      throw new Error(
        'Packed framework-ops artifact must retain runtime and declaration imports for the Devtools integration subpath.',
      );
    }
    const emittedFirstPartyPackages = assertDeclaredFirstPartyImports(
      emittedRecords,
      packedManifest,
      'Packed framework-ops artifact',
    );
    return {
      schemaVersion: 1,
      package: packedManifest.name,
      version: packedManifest.version,
      devtoolsDependency: `${DEVTOOLS_PACKAGE}@${DEVTOOLS_VERSION}`,
      allowedDevtoolsExport: DEVTOOLS_INTEGRATION,
      authoredModuleSpecifierCount: authored.authoredModuleSpecifierCount,
      authoredDevtoolsIntegrationImportCount: authored.devtoolsIntegrationImportCount,
      authoredDevtoolsIntegrationImportPaths: authored.devtoolsIntegrationImportPaths,
      packedEntryCount: entries.filter((entry) => entry !== 'package').length,
      packedRuntimeDevtoolsImportCount: runtimeCount,
      packedDeclarationDevtoolsImportCount: declarationCount,
      packedFirstPartyImports: emittedFirstPartyPackages,
      tarballSha256: createHash('sha256').update(readFileSync(tarballPath)).digest('hex'),
      registryAuthorityMutation: false,
      published: false,
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
