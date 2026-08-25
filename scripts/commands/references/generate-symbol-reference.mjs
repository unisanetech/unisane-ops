import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  ROOT,
  SYMBOLS_INDEX_JSON_PATH,
  SYMBOLS_INDEX_MD_PATH,
  SYMBOLS_PACKAGES_DIR,
  toRepoPath,
} from '../../_lib/docs-paths.mjs';
import {
  withGeneratedMarkdownEnvelope,
  withReferenceEnvelope,
} from '../../_lib/reference-envelope.mjs';

const SCHEMA_VERSION = 1;
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
]);
const SOURCE_ROOTS = [ROOT];
const REPOSITORY_NAME = String(readJson(path.join(ROOT, 'package.json')).name ?? '');
const REPOSITORY_OWNER = REPOSITORY_NAME.startsWith('unisane-ops')
  ? 'unisane-ops'
  : REPOSITORY_NAME;

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function parseMode() {
  const hasCheck = process.argv.includes('--check');
  const hasWrite = process.argv.includes('--write');

  if (hasCheck === hasWrite) {
    console.error(
      'Usage: node scripts/commands/references/generate-symbol-reference.mjs --write|--check',
    );
    process.exit(2);
  }

  return hasWrite ? 'write' : 'check';
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input: ${rel(filePath)}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON at ${rel(filePath)}: ${message}`);
  }
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function checkOrWriteFile(mode, filePath, nextContent) {
  if (filePath.endsWith('.md')) {
    nextContent = withGeneratedMarkdownEnvelope(nextContent, filePath);
  }
  if (mode === 'write') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, nextContent, 'utf8');
    return;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing generated artifact: ${rel(filePath)}`);
  }

  const current = fs.readFileSync(filePath, 'utf8');
  if (current !== nextContent) {
    throw new Error(
      `Generated artifact is stale: ${rel(filePath)} (run pnpm symbols:reference:generate)`,
    );
  }
}

function cleanupStalePackageArtifacts(mode, expectedFileNames) {
  if (mode !== 'write') return;
  if (!fs.existsSync(SYMBOLS_PACKAGES_DIR)) return;

  const expected = new Set(expectedFileNames);
  const entries = fs.readdirSync(SYMBOLS_PACKAGES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.symbols.json')) continue;
    if (expected.has(entry.name)) continue;
    fs.unlinkSync(path.join(SYMBOLS_PACKAGES_DIR, entry.name));
  }
}

function hasExcludedPath(filePath) {
  return filePath.split(path.sep).some((part) => EXCLUDED_DIRS.has(part));
}

export function listGitVisibleFiles(repositoryRoot, sourceRoots) {
  const relativeRoots = sourceRoots
    .map((sourceRoot) => path.relative(repositoryRoot, sourceRoot))
    .map((sourceRoot) => sourceRoot || '.')
    .filter((sourceRoot) => !sourceRoot.startsWith(`..${path.sep}`));

  if (relativeRoots.length === 0) return [];

  const output = execFileSync(
    'git',
    [
      '-C',
      repositoryRoot,
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      ...relativeRoots,
    ],
    { encoding: 'utf8' },
  );

  return output
    .split('\0')
    .filter(Boolean)
    .map((filePath) => path.join(repositoryRoot, filePath))
    .filter((filePath) => fs.existsSync(filePath));
}

export function selectSourceFiles(visibleFiles, sourceDir) {
  const sourcePrefix = `${sourceDir}${path.sep}`;

  return visibleFiles.filter((filePath) => {
    if (!filePath.startsWith(sourcePrefix)) return false;
    if (hasExcludedPath(path.relative(sourceDir, filePath))) return false;
    if (filePath.endsWith('.d.ts')) return false;

    const supported =
      filePath.endsWith('.ts') ||
      filePath.endsWith('.tsx') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.jsx') ||
      filePath.endsWith('.mjs') ||
      filePath.endsWith('.cjs');

    if (!supported) return false;
    if (filePath.includes(`${path.sep}__tests__${path.sep}`)) return false;
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(path.basename(filePath))) return false;

    return true;
  });
}

function scriptKindForFile(filePath) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS;
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function collectNamedExports(sourceFile) {
  const exports = new Set();

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    for (const element of statement.exportClause.elements) {
      exports.add(element.propertyName?.text ?? element.name.text);
      exports.add(element.name.text);
    }
  }

  return exports;
}

function normalizeTypeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function textOfNode(node, sourceFile) {
  return node.getText(sourceFile);
}

function formatParameterNames(parameters, sourceFile) {
  return parameters
    .map((parameter) => normalizeTypeText(textOfNode(parameter.name, sourceFile)))
    .join(', ');
}

function toShortSignature(name, parameters, returnType, sourceFile) {
  const paramNames = formatParameterNames(parameters, sourceFile);
  const returnText = returnType ? normalizeTypeText(textOfNode(returnType, sourceFile)) : null;
  let signature = `${name}(${paramNames})`;
  if (returnText) signature += `: ${returnText}`;
  if (signature.length > 180) {
    signature = `${signature.slice(0, 177)}...`;
  }
  return signature;
}

function buildTags(fileRepoPath, exported) {
  const tags = new Set();

  if (fileRepoPath.includes('/src/service/')) tags.add('service-layer');
  if (fileRepoPath.includes('/src/contracts/')) tags.add('contracts');
  if (fileRepoPath.includes('/src/domain/')) tags.add('domain');
  if (fileRepoPath.includes('/src/handlers/')) tags.add('handlers');
  if (fileRepoPath.includes('/src/data/')) tags.add('data');
  if (fileRepoPath.endsWith('/manifest.ts')) tags.add('manifest');
  if (fileRepoPath.endsWith('/tokens.ts')) tags.add('tokens');
  if (exported) tags.add('public');

  return [...tags].sort((a, b) => a.localeCompare(b));
}

function deriveOwnerFromPackageDir(packageDir) {
  const dir = normalizePath(packageDir);
  const localPackage = dir.match(/^packages\/([^/]+)$/);
  const localApp = dir.match(/^apps\/([^/]+)$/);

  if (localPackage?.[1]) {
    if (REPOSITORY_NAME.startsWith('unisane-ops')) return `ops/${localPackage[1]}`;
    if (REPOSITORY_NAME === 'unisane-pro') return `pro/${localPackage[1]}`;
    if (REPOSITORY_NAME === 'unisane-ui') return `ui/${localPackage[1]}`;
    if (REPOSITORY_NAME === 'unisane-site') return `site/${localPackage[1]}`;
  }
  if (localApp?.[1]) {
    if (REPOSITORY_NAME.startsWith('unisane-ops')) return `ops-apps/${localApp[1]}`;
    if (REPOSITORY_NAME === 'unisane-ui') return `ui-apps/${localApp[1]}`;
    if (REPOSITORY_NAME === 'unisane-site') return `site-apps/${localApp[1]}`;
  }
 let match = dir.match(/^unisane\/packages\/modules\/([^/]+)$/);
 if (match?.[1]) return `modules/${match[1]}`;

 match = dir.match(/^unisane-pro\/packages\/([^/]+)$/);
 if (match?.[1]) return `pro/${match[1]}`;

 match = dir.match(/^unisane\/packages\/foundation\/([^/]+)$/);
 if (match?.[1]) return `foundation/${match[1]}`;

 match = dir.match(/^unisane\/packages\/adapters\/([^/]+)$/);
 if (match?.[1]) return `adapters/${match[1]}`;

 match = dir.match(/^unisane\/starters\/([^/]+)$/);
 if (match?.[1]) return `starters/${match[1]}`;

 match = dir.match(/^unisane-platforms\/apps\/([^/]+)$/);
 if (match?.[1]) return `apps/${match[1]}`;

 match = dir.match(/^unisane-platforms\/packages\/([^/]+)\/modules\/([^/]+)$/);
 if (match?.[1] && match?.[2]) return `platforms/${match[1]}/modules/${match[2]}`;

 match = dir.match(/^unisane-platforms\/packages\/([^/]+)\/shared$/);
 if (match?.[1]) return `platforms/${match[1]}/shared`;

 match = dir.match(/^unisane-platforms\/packages\/shared\/([^/]+)$/);
 if (match?.[1]) return `platforms/shared/${match[1]}`;

 match = dir.match(/^unisane-tools\/packages\/([^/]+)$/);
 if (match?.[1]) return `tools/${match[1]}`;

 match = dir.match(/^unisane-ops\/packages\/([^/]+)$/);
 if (match?.[1]) return `ops/${match[1]}`;

 match = dir.match(/^unisane-ui\/packages\/([^/]+)$/);
 if (match?.[1]) return `ui/${match[1]}`;

 match = dir.match(/^unisane-ui\/apps\/([^/]+)$/);
 if (match?.[1]) return `ui-apps/${match[1]}`;

 match = dir.match(/^unisane-landing\/packages\/([^/]+)$/);
 if (match?.[1]) return `landing/${match[1]}`;

 match = dir.match(/^unisane-landing\/apps\/([^/]+)$/);
 if (match?.[1]) return `landing-apps/${match[1]}`;

  return dir;
}

function inferLayer(owner, fileRepoPath) {
  if (fileRepoPath.includes('/src/service/')) return 'service-layer';
  if (owner.startsWith('modules/') || owner.startsWith('pro/') || owner.includes('/modules/')) {
    return 'module-layer';
  }
  if (owner.startsWith('foundation/')) return 'foundation-layer';
  if (owner.startsWith('adapters/')) return 'adapter-layer';
  if (owner.startsWith('starters/') || owner.startsWith('apps/')) return 'deployable-layer';
  if (owner.endsWith('/shared') || owner.startsWith('platforms/shared/'))
    return 'platform-shared-layer';
  if (owner.startsWith('tools/') || owner.startsWith('ops/')) return 'tooling-layer';
  if (owner.startsWith('ui/') || owner.startsWith('ui-apps/')) return 'ui-layer';
  if (owner.startsWith('landing/')) return 'landing-layer';
  return 'package-layer';
}

function isFunctionLikeInitializer(node) {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function addRecord(records, record) {
  records.push({
    ...record,
    tags: [...new Set(record.tags)].sort((a, b) => a.localeCompare(b)),
  });
}

function collectFileSymbols(filePath, packageName, owner) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForFile(filePath),
  );

  const fileRepoPath = rel(filePath);
  const namedExports = collectNamedExports(sourceFile);
  const records = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      const name = statement.name?.text;
      if (!name) continue;

      const exported = hasExportModifier(statement) || namedExports.has(name);
      addRecord(records, {
        name,
        kind: 'function',
        package: packageName,
        owner,
        file: fileRepoPath,
        exported,
        tags: buildTags(fileRepoPath, exported),
        signatureShort: toShortSignature(name, statement.parameters, statement.type, sourceFile),
        layer: inferLayer(owner, fileRepoPath),
      });
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const statementExported = hasExportModifier(statement);
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        if (!isFunctionLikeInitializer(declaration.initializer)) continue;

        const name = declaration.name.text;
        const initializer = declaration.initializer;
        const exported = statementExported || namedExports.has(name);

        const returnType = declaration.type ?? initializer.type ?? null;

        addRecord(records, {
          name,
          kind: 'const-function',
          package: packageName,
          owner,
          file: fileRepoPath,
          exported,
          tags: buildTags(fileRepoPath, exported),
          signatureShort: toShortSignature(name, initializer.parameters, returnType, sourceFile),
          layer: inferLayer(owner, fileRepoPath),
        });
      }
      continue;
    }

    if (ts.isClassDeclaration(statement)) {
      const className = statement.name?.text;
      if (!className) continue;

      const classExported = hasExportModifier(statement) || namedExports.has(className);

      for (const member of statement.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        if (!member.name) continue;

        const methodName = ts.isIdentifier(member.name)
          ? member.name.text
          : ts.isStringLiteral(member.name)
            ? member.name.text
            : null;

        if (!methodName) continue;

        const exported = classExported;
        const staticTag = member.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
        )
          ? ['static']
          : [];

        addRecord(records, {
          name: `${className}.${methodName}`,
          kind: 'method',
          package: packageName,
          owner,
          file: fileRepoPath,
          exported,
          tags: [...buildTags(fileRepoPath, exported), 'class-method', ...staticTag],
          signatureShort: toShortSignature(
            `${className}.${methodName}`,
            member.parameters,
            member.type,
            sourceFile,
          ),
          layer: inferLayer(owner, fileRepoPath),
        });
      }
      continue;
    }
  }

  return records;
}

function packageArtifactFileName(packageName) {
  return `${packageName.replace(/\//g, '__')}.symbols.json`;
}

function isFunctionSymbol(record) {
  return record.kind === 'function' || record.kind === 'const-function' || record.kind === 'method';
}

function summarizeRecords(records) {
  const functionRecords = records.filter(isFunctionSymbol);
  const publicFunctionCount = functionRecords.filter((record) => record.exported).length;
  const serviceLayerFunctionCount = functionRecords.filter(
    (record) => record.layer === 'service-layer',
  ).length;

  return {
    symbolCount: records.length,
    functionCount: functionRecords.length,
    publicFunctionCount,
    internalFunctionCount: functionRecords.length - publicFunctionCount,
    serviceLayerFunctionCount,
  };
}

function buildPackageCatalog() {
  const visibleFiles = listGitVisibleFiles(ROOT, SOURCE_ROOTS);
  const packageJsonFiles = visibleFiles
    .filter((filePath) => path.basename(filePath) === 'package.json')
    .sort((a, b) => a.localeCompare(b));

  const packages = [];
  for (const packageJsonPath of packageJsonFiles) {
    const payload = readJson(packageJsonPath);
    const packageName = typeof payload.name === 'string' ? payload.name : null;
    if (!packageName) continue;

    const packageDirAbsolute = path.dirname(packageJsonPath);
    const packageDir = rel(packageDirAbsolute);
    if (packageDir.includes('/packages/create-unisane/templates/')) continue;
    const srcDir = path.join(packageDirAbsolute, 'src');

    if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) continue;

    const sourceFiles = selectSourceFiles(visibleFiles, srcDir).sort((a, b) => a.localeCompare(b));
    if (sourceFiles.length === 0) continue;

    const owner = deriveOwnerFromPackageDir(packageDir);
    const records = sourceFiles.flatMap((filePath) =>
      collectFileSymbols(filePath, packageName, owner),
    );

    const sortedRecords = records.sort((a, b) => {
      const fileCmp = a.file.localeCompare(b.file);
      if (fileCmp !== 0) return fileCmp;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.kind.localeCompare(b.kind);
    });

    const summary = summarizeRecords(sortedRecords);

    packages.push({
      package: packageName,
      owner,
      packageDir: normalizePath(packageDir),
      sourceFileCount: sourceFiles.length,
      summary,
      records: sortedRecords,
      artifactFileName: packageArtifactFileName(packageName),
    });
  }

  return packages.sort((a, b) => a.package.localeCompare(b.package));
}

function buildArtifacts(packageCatalog) {
  const allRecords = packageCatalog.flatMap((entry) => entry.records);
  const summary = summarizeRecords(allRecords);

  const indexPayload = withReferenceEnvelope(
    {
      schemaVersion: SCHEMA_VERSION,
      source: {
        scanRoots: SOURCE_ROOTS.map((value) => rel(value)),
        include: [
          'src/**/*.ts',
          'src/**/*.tsx',
          'src/**/*.js',
          'src/**/*.jsx',
          'src/**/*.mjs',
          'src/**/*.cjs',
        ],
        excludes: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
      },
      summary: {
        packageCount: packageCatalog.length,
        ...summary,
      },
      packages: packageCatalog.map((entry) => ({
        package: entry.package,
        owner: entry.owner,
        packageDir: entry.packageDir,
        sourceFileCount: entry.sourceFileCount,
        artifact: `docs/reference/generated/symbols/packages/${entry.artifactFileName}`,
        ...entry.summary,
      })),
      records: allRecords,
    },
    { generatorScript: 'scripts/commands/references/generate-symbol-reference.mjs' },
  );

  const packagePayloads = packageCatalog.map((entry) => ({
    fileName: entry.artifactFileName,
    payload: withReferenceEnvelope(
      {
        schemaVersion: SCHEMA_VERSION,
        source: {
          packageManifest: `${entry.packageDir}/package.json`,
          sourceRoot: entry.packageDir,
        },
        summary: {
          package: entry.package,
          owner: entry.owner,
          packageDir: entry.packageDir,
          sourceFileCount: entry.sourceFileCount,
          ...entry.summary,
        },
        records: entry.records,
      },
      {
        generatorScript: 'scripts/commands/references/generate-symbol-reference.mjs',
        owner: REPOSITORY_OWNER,
      },
    ),
  }));

  return {
    indexPayload,
    packagePayloads,
  };
}

function renderSymbolsIndexMarkdown(indexPayload) {
  const lines = [
    '# Generated Symbol Inventory Index',
    '',
    '> DO NOT EDIT: generated by `scripts/commands/references/generate-symbol-reference.mjs`.',
    '',
    `- Generated At: \`${indexPayload.generatedAt}\``,
    `- Schema Version: \`${indexPayload.schemaVersion}\``,
    '',
    '## Summary',
    '',
    `- Packages: **${indexPayload.summary.packageCount}**`,
    `- Symbols: **${indexPayload.summary.symbolCount}**`,
    `- Functions: **${indexPayload.summary.functionCount}**`,
    `- Public Functions: **${indexPayload.summary.publicFunctionCount}**`,
    `- Internal Functions: **${indexPayload.summary.internalFunctionCount}**`,
    `- Service-Layer Functions: **${indexPayload.summary.serviceLayerFunctionCount}**`,
    '',
    '## Package Slices',
    '',
    '| Package | Owner | Functions | Public | Internal | Service | Slice |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const entry of indexPayload.packages) {
    const artifactPath = entry.artifact.replace('docs/reference/generated/symbols/', '');
    lines.push(
      `| \`${entry.package}\` | \`${entry.owner}\` | ${entry.functionCount} | ${entry.publicFunctionCount} | ${entry.internalFunctionCount} | ${entry.serviceLayerFunctionCount} | [slice](./${artifactPath}) |`,
    );
  }

  lines.push('', '## Notes', '');
  lines.push(
    '- This index is metadata-only: symbol names, signatures, files, ownership, and visibility.',
  );
  lines.push('- Implementation bodies are intentionally excluded from generated symbol catalogs.');

  return `${lines.join('\n')}\n`;
}

function main() {
  const mode = parseMode();
  const packageCatalog = buildPackageCatalog();
  const { packagePayloads } = buildArtifacts(packageCatalog);
  cleanupStalePackageArtifacts(
    mode,
    packagePayloads.map((packagePayload) => packagePayload.fileName),
  );

  for (const packagePayload of packagePayloads) {
    checkOrWriteFile(
      mode,
      path.join(SYMBOLS_PACKAGES_DIR, packagePayload.fileName),
      serializeJson(packagePayload.payload),
    );
  }

  if (mode === 'write') {
    console.log(
      [
        'Generated symbol reference artifacts:',
        `- per-package slices under ${rel(SYMBOLS_PACKAGES_DIR)}`,
      ].join('\n'),
    );
    return;
  }

  console.log('Symbol reference artifacts are fresh.');
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
