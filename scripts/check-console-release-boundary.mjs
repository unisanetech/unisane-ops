import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import ts from 'typescript';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultPolicyPath = 'tools/repository/console-release-boundary-policy.json';
const ignoredDirectories = new Set([
  '.git',
  '.skopos',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);
const boundaryPackages = ['@unisane/data-table', '@unisane/ui'];
const relevantPackages = [
  '@material-symbols/font-400',
  '@unisane/data-table',
  '@unisane/ui',
  'react',
  'react-dom',
];
const privateSpecifier = /^@unisane\/(?:ui|data-table)\/(?:internal|private|src)(?:\/|$)/u;
const localLocator = /^(?:file|link|portal|workspace):/u;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]),
  );
}

function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function scriptKind(path) {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.ts') || path.endsWith('.d.ts')) return ts.ScriptKind.TS;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

function literalSpecifier(node) {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

function importNames(clause) {
  const runtimeNames = [];
  const typeNames = [];
  if (!clause) return { runtimeNames, typeNames };
  const target = clause.isTypeOnly ? typeNames : runtimeNames;
  if (clause.name) target.push('default');
  if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) target.push('*');
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    for (const element of clause.namedBindings.elements) {
      const name = element.propertyName?.text ?? element.name.text;
      (clause.isTypeOnly || element.isTypeOnly ? typeNames : runtimeNames).push(name);
    }
  }
  return {
    runtimeNames: [...new Set(runtimeNames)].sort(),
    typeNames: [...new Set(typeNames)].sort(),
  };
}

function scanModule(path, root) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    scriptKind(path),
  );
  const records = [];
  const violations = [];
  const file = relative(root, path).split('\\').join('/');
  const addRecord = (kind, specifier, names = {}) => {
    records.push({
      file,
      kind,
      specifier,
      runtimeNames: names.runtimeNames ?? [],
      typeNames: names.typeNames ?? [],
    });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const specifier = literalSpecifier(node.moduleSpecifier);
      if (specifier === null) violations.push(`${file}: nonliteral import declaration`);
      else addRecord('import', specifier, importNames(node.importClause));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      const specifier = literalSpecifier(node.moduleSpecifier);
      if (specifier === null) violations.push(`${file}: nonliteral export declaration`);
      else addRecord('export', specifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      const specifier = literalSpecifier(node.moduleReference.expression);
      if (specifier === null) violations.push(`${file}: nonliteral import assignment`);
      else addRecord('import-equals', specifier);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const specifier = literalSpecifier(node.argument.literal);
      if (specifier !== null) addRecord('import-type', specifier, { typeNames: ['*'] });
    }
    if (ts.isCallExpression(node)) {
      let loader = null;
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) loader = 'import()';
      if (ts.isIdentifier(node.expression) && node.expression.text === 'require')
        loader = 'require()';
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'require' &&
        node.expression.name.text === 'resolve'
      ) {
        loader = 'require.resolve()';
      }
      if (
        ts.isElementAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'require' &&
        literalSpecifier(node.expression.argumentExpression) === 'resolve'
      ) {
        loader = 'require.resolve()';
      }
      if (loader) {
        if (node.arguments.length !== 1) {
          violations.push(`${file}: ${loader} must have one exact literal argument`);
        } else {
          const specifier = literalSpecifier(node.arguments[0]);
          if (specifier === null) violations.push(`${file}: nonliteral ${loader}`);
          else addRecord(loader, specifier);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { records, violations };
}

function blocker(policy, id) {
  const entry = policy.blockers.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Policy does not define blocker ${id}.`);
  return entry;
}

function collectAuthored(root, policy, consoleManifest) {
  const sourceRoot = join(root, policy.paths.sourceRoot);
  const configuredFiles = policy.paths.authoredConfigFiles.map((path) => join(root, path));
  const moduleFiles = [
    ...walkFiles(sourceRoot).filter((path) => /\.[cm]?[jt]sx?$/u.test(path)),
    ...configuredFiles.filter((path) => existsSync(path)),
  ];
  const records = [];
  const violations = [];
  for (const path of moduleFiles) {
    const scanned = scanModule(path, root);
    records.push(...scanned.records);
    violations.push(...scanned.violations);
  }
  const relevantRecords = records
    .filter(({ specifier }) => relevantPackages.includes(packageName(specifier)))
    .sort((left, right) =>
      `${left.file}\0${left.kind}\0${left.specifier}`.localeCompare(
        `${right.file}\0${right.kind}\0${right.specifier}`,
      ),
    );
  const stylesheetRecords = records.filter(
    ({ kind, specifier }) =>
      kind === 'import' &&
      specifier.endsWith('.css') &&
      relevantPackages.includes(packageName(specifier)),
  );
  const boundaryRecords = relevantRecords.filter(({ specifier }) =>
    boundaryPackages.includes(packageName(specifier)),
  );
  const manifestDependencies = consoleManifest.dependencies ?? {};
  for (const record of relevantRecords) {
    const dependency = packageName(record.specifier);
    if (!(dependency in manifestDependencies)) {
      violations.push(
        `${record.file}: ${record.specifier} is imported without a dependency declaration`,
      );
    }
    if (privateSpecifier.test(record.specifier)) {
      violations.push(
        `${record.file}: private UI producer surface is forbidden: ${record.specifier}`,
      );
    }
  }
  const observedSpecifiers = [...new Set(boundaryRecords.map(({ specifier }) => specifier))].sort();
  if (JSON.stringify(observedSpecifiers) !== JSON.stringify(policy.authoredInventory.specifiers)) {
    violations.push(
      'authored UI/DataTable specifier set differs from the exact reviewed inventory',
    );
  }
  const inventory = {
    declarationCount: boundaryRecords.length,
    sourceFileCount: new Set(boundaryRecords.map(({ file }) => file)).size,
    digest: digest(boundaryRecords),
    specifiers: observedSpecifiers,
    packages: Object.fromEntries(
      boundaryPackages.map((name) => {
        const matches = boundaryRecords.filter(({ specifier }) => packageName(specifier) === name);
        return [
          name,
          {
            declarationCount: matches.length,
            sourceFileCount: new Set(matches.map(({ file }) => file)).size,
            runtimeDeclarationCount: matches.filter(({ runtimeNames }) => runtimeNames.length > 0)
              .length,
            typeDeclarationCount: matches.filter(({ typeNames }) => typeNames.length > 0).length,
          },
        ];
      }),
    ),
    stylesheets: stylesheetRecords.map(({ file, specifier }) => ({ file, specifier })),
    computedLoaderCount: relevantRecords.filter(({ kind }) =>
      ['import()', 'require()', 'require.resolve()'].includes(kind),
    ).length,
  };
  for (const field of ['declarationCount', 'sourceFileCount', 'digest']) {
    if (inventory[field] !== policy.authoredInventory[field]) {
      violations.push(`authored UI/DataTable ${field} differs from policy`);
    }
  }
  return { inventory, records: relevantRecords, violations };
}

function collectCssEvidence(root, emittedFiles, expectedDataTableSelectors) {
  const cssFiles = emittedFiles.filter((path) => extname(path) === '.css');
  const assetReferences = [];
  const unresolvedAssets = [];
  const stylesheetImports = [];
  const fontFaces = [];
  const stylesheetContents = [];
  let fontFaceCount = 0;
  for (const path of cssFiles) {
    const content = readFileSync(path, 'utf8');
    stylesheetContents.push(content);
    fontFaceCount += [...content.matchAll(/@font-face\b/gu)].length;
    for (const match of content.matchAll(/@font-face\s*\{([^{}]*)\}/giu)) {
      const block = match[1];
      const familyMatch = block.match(
        /(?:^|;)\s*font-family\s*:\s*(?:"([^"]+)"|'([^']+)'|([^;]+))/iu,
      );
      const srcMatch = block.match(/(?:^|;)\s*src\s*:\s*([^;]+)/iu);
      const family = (familyMatch?.[1] ?? familyMatch?.[2] ?? familyMatch?.[3] ?? '').trim();
      const sources = [];
      for (const sourceMatch of (srcMatch?.[1] ?? '').matchAll(/url\(([^)]+)\)/giu)) {
        const specifier = sourceMatch[1].trim().replace(/^["']|["']$/gu, '');
        if (/^(?:data:|https?:|#)/u.test(specifier)) {
          sources.push({ specifier, target: null, resolves: false, fontAsset: false });
          continue;
        }
        const withoutQuery = specifier.split(/[?#]/u)[0];
        const target = resolve(dirname(path), withoutQuery);
        sources.push({
          specifier,
          target: relative(root, target).split('\\').join('/'),
          resolves: existsSync(target) && statSync(target).isFile(),
          fontAsset: /\.(?:woff2?|ttf|otf)$/u.test(target),
        });
      }
      fontFaces.push({
        from: relative(root, path).split('\\').join('/'),
        family,
        sources,
      });
    }
    for (const match of content.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?/gu)) {
      stylesheetImports.push({
        from: relative(root, path).split('\\').join('/'),
        specifier: match[1],
      });
    }
    for (const match of content.matchAll(/url\(([^)]+)\)/gu)) {
      const specifier = match[1].trim().replace(/^["']|["']$/gu, '');
      if (/^(?:data:|https?:|#)/u.test(specifier)) continue;
      const withoutQuery = specifier.split(/[?#]/u)[0];
      const target = resolve(dirname(path), withoutQuery);
      const record = {
        from: relative(root, path).split('\\').join('/'),
        specifier,
        target: relative(root, target).split('\\').join('/'),
      };
      assetReferences.push(record);
      if (!existsSync(target) || !statSync(target).isFile()) unresolvedAssets.push(record);
    }
  }
  const combinedContent = stylesheetContents.join('\n');
  const dataTableSelectors = expectedDataTableSelectors.map((selector) => ({
    selector,
    present: combinedContent.includes(`${selector}{`) || combinedContent.includes(`${selector} {`),
  }));
  return {
    cssFileCount: cssFiles.length,
    fontFaceCount,
    fontAssetCount: emittedFiles.filter((path) => /\.(?:woff2?|ttf|otf)$/u.test(path)).length,
    fontFaces,
    stylesheetImports,
    assetReferences,
    unresolvedAssets,
    dataTableSelectors,
  };
}

function collectEmitted(root, policy) {
  const emittedRoot = join(root, policy.paths.emittedRoot);
  const violations = [];
  if (!existsSync(emittedRoot)) {
    return {
      report: { status: 'missing', root: policy.paths.emittedRoot },
      violations: [`emitted root is missing: ${policy.paths.emittedRoot}`],
    };
  }
  const emittedFiles = walkFiles(emittedRoot);
  const moduleFiles = emittedFiles.filter((path) => /\.(?:[cm]?js|d\.[cm]?ts)$/u.test(path));
  const records = [];
  for (const path of moduleFiles) {
    const scanned = scanModule(path, root);
    records.push(...scanned.records);
    violations.push(...scanned.violations);
  }
  const foreignBoundaryRecords = records.filter(({ specifier }) =>
    boundaryPackages.includes(packageName(specifier)),
  );
  for (const record of foreignBoundaryRecords) {
    violations.push(
      `${record.file}: emitted UI/DataTable import must be browser-bundled: ${record.specifier}`,
    );
  }
  const css = collectCssEvidence(root, emittedFiles, policy.dataTableStylesheet.emittedSelectors);
  if (css.cssFileCount === 0) violations.push('emitted browser CSS is missing');
  const materialSymbolsFontFaces = css.fontFaces.filter(
    ({ family }) => family === policy.materialSymbols.emittedFontFamily,
  );
  const resolvedMaterialSymbolsFontSources = materialSymbolsFontFaces.flatMap(({ sources }) =>
    sources.filter(({ resolves, fontAsset }) => resolves && fontAsset),
  );
  if (materialSymbolsFontFaces.length === 0) {
    violations.push(
      `emitted Material Symbols @font-face family is missing: ${policy.materialSymbols.emittedFontFamily}`,
    );
  } else if (resolvedMaterialSymbolsFontSources.length === 0) {
    violations.push(
      `emitted Material Symbols @font-face source does not resolve to a font asset: ${policy.materialSymbols.emittedFontFamily}`,
    );
  }
  for (const record of css.stylesheetImports) {
    violations.push(
      `${record.from}: emitted CSS retains an unresolved @import: ${record.specifier}`,
    );
  }
  for (const record of css.unresolvedAssets) {
    violations.push(`${record.from}: emitted CSS asset does not resolve: ${record.specifier}`);
  }
  for (const { selector, present } of css.dataTableSelectors) {
    if (!present) violations.push(`emitted DataTable stylesheet selector is missing: ${selector}`);
  }
  return {
    report: {
      status: 'checked',
      root: policy.paths.emittedRoot,
      fileCount: emittedFiles.length,
      moduleFileCount: moduleFiles.length,
      declarationFileCount: emittedFiles.filter((path) => /\.d\.[cm]?ts$/u.test(path)).length,
      bareSpecifierCount: records.length,
      uiDataTableSpecifierCount: foreignBoundaryRecords.length,
      css,
      materialSymbols: {
        expectedFontFamily: policy.materialSymbols.emittedFontFamily,
        fontFaceCount: materialSymbolsFontFaces.length,
        resolvedFontAssetCount: resolvedMaterialSymbolsFontSources.length,
      },
      digest: digest(
        emittedFiles.map((path) => ({
          path: relative(root, path).split('\\').join('/'),
          sha256: sha256(readFileSync(path)),
        })),
      ),
    },
    violations,
  };
}

export function evaluateConsoleReleaseBoundary(
  root = defaultRoot,
  { checkEmitted = false, policy: suppliedPolicy } = {},
) {
  const policy = suppliedPolicy ?? readJson(join(root, defaultPolicyPath));
  const consoleManifest = readJson(join(root, policy.paths.consoleManifest));
  const rootManifest = readJson(join(root, 'package.json'));
  const nodeVersion = readFileSync(join(root, policy.paths.nodeVersionFile), 'utf8').trim();
  const violations = [];
  const blockers = [];
  const dependencies = consoleManifest.dependencies ?? {};
  for (const [dependency, expected] of Object.entries(policy.currentDependencies)) {
    const actual = dependencies[dependency] ?? null;
    if (actual !== expected)
      violations.push(`${dependency} coordinate differs from the reviewed current policy`);
  }
  if (localLocator.test(dependencies['@unisane/ui'] ?? '')) {
    blockers.push(blocker(policy, 'OPS-CONSOLE-RB01-UI-COORDINATE'));
  }
  if (localLocator.test(dependencies['@unisane/data-table'] ?? '')) {
    blockers.push(blocker(policy, 'OPS-CONSOLE-RB02-DATA-TABLE-COORDINATE'));
  }
  const authored = collectAuthored(root, policy, consoleManifest);
  violations.push(...authored.violations);
  if (
    JSON.stringify(authored.inventory.stylesheets) !==
    JSON.stringify(policy.requiredCurrentStylesheets)
  ) {
    violations.push('current stylesheet composition-root imports or deterministic order differ');
  }
  if (consoleManifest.engines?.node !== policy.nodeRuntime.engineFloor) {
    violations.push('console Node engine floor differs from the canonical release-boundary policy');
  }
  if (rootManifest.engines?.node !== policy.nodeRuntime.engineFloor) {
    violations.push(
      'standalone root Node engine floor differs from the canonical release-boundary policy',
    );
  }
  if (nodeVersion !== policy.nodeRuntime.version) {
    violations.push('standalone .node-version differs from the canonical release-boundary policy');
  }
  if (
    !policy.registry.uiVersion ||
    !policy.registry.dataTableVersion ||
    !policy.registry.accessApproved
  ) {
    blockers.push(blocker(policy, 'OPS-CONSOLE-RB05-REGISTRY-VERSION-ACCESS'));
  }
  if (!policy.cleanExternalConsumer.proofId) {
    blockers.push(blocker(policy, 'OPS-CONSOLE-RB06-CLEAN-EXTERNAL-CONSUMER'));
  }
  if (
    !policy.authority.publicationAuthorized ||
    !policy.authority.consumerConversionAuthorized ||
    policy.authority.licenseAdmission !== 'approved'
  ) {
    blockers.push(blocker(policy, 'OPS-CONSOLE-RB07-RELEASE-AUTHORITY'));
  }
  if (
    dependencies.react !== policy.react.currentRange ||
    dependencies['react-dom'] !== policy.reactDom.currentRange
  ) {
    violations.push('React singleton dependency ranges differ from the reviewed current policy');
  }
  if (dependencies['@material-symbols/font-400'] !== policy.materialSymbols.currentRange) {
    violations.push('Material Symbols dependency range differs from the reviewed current policy');
  }
  const emitted = checkEmitted
    ? collectEmitted(root, policy)
    : { report: { status: 'not-requested', root: policy.paths.emittedRoot }, violations: [] };
  violations.push(...emitted.violations);
  const blockerIds = blockers.map(({ id }) => id).sort();
  const expectedBlockerIds = policy.blockers.map(({ id }) => id).sort();
  if (JSON.stringify(blockerIds) !== JSON.stringify(expectedBlockerIds)) {
    violations.push('active blocker set differs from the exact fail-closed policy');
  }
  const uniqueViolations = [...new Set(violations)].sort();
  return {
    schemaVersion: 1,
    state: uniqueViolations.length > 0 ? 'invalid' : 'blocked-with-exact-preconditions',
    conversionReady: uniqueViolations.length === 0 && blockers.length === 0,
    package: {
      name: consoleManifest.name,
      version: consoleManifest.version,
      private: consoleManifest.private,
      license: consoleManifest.license,
      coordinates: Object.fromEntries(
        ['@unisane/data-table', '@unisane/ui'].map((name) => [name, dependencies[name] ?? null]),
      ),
      nodeFloor: consoleManifest.engines?.node ?? null,
      standaloneNodeFloor: rootManifest.engines?.node ?? null,
      standaloneNodeVersion: nodeVersion,
      reactSingletons: {
        react: dependencies.react ?? null,
        reactDom: dependencies['react-dom'] ?? null,
      },
      materialSymbols: dependencies['@material-symbols/font-400'] ?? null,
    },
    producerTechnicalEvidence: policy.producerTechnicalEvidence,
    requiredPeerExpectations: policy.requiredPeerExpectations,
    authored: authored.inventory,
    emitted: emitted.report,
    cleanExternalConsumerInputs: {
      producerCertificateArtifact: 'required-at-conversion',
      immutablePackageArtifacts: ['@unisane/tokens', '@unisane/ui', '@unisane/data-table'],
      exactRegistryCoordinates: 'required-at-conversion',
      isolatedLockfile: 'required-at-conversion',
      reactSingletonProof: 'required-at-conversion',
      browserCssAssetProof: 'required-at-conversion',
    },
    blockers,
    violations: uniqueViolations,
    authority: policy.authority,
    externalEffects: [],
  };
}

function main() {
  const checkEmitted = process.argv.includes('--check-emitted');
  const requireReady = process.argv.includes('--require-conversion-ready');
  const report = evaluateConsoleReleaseBoundary(defaultRoot, { checkEmitted });
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(
      `Ops console release boundary ${report.state}: ${report.authored.declarationCount} UI/DataTable imports across ${report.authored.sourceFileCount} files, ${report.blockers.length} exact blockers, conversionReady=${report.conversionReady}.`,
    );
    for (const entry of report.blockers) console.log(`${entry.id}: ${entry.reason}`);
  }
  if (report.violations.length > 0) {
    for (const violation of report.violations) console.error(violation);
    process.exitCode = 1;
  } else if (requireReady && !report.conversionReady) {
    console.error('Ops console conversion readiness remains blocked.');
    process.exitCode = 1;
  }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
