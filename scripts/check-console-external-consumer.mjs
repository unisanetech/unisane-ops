#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  collectConsoleConsumerEvidence,
  evaluateConsoleReleaseBoundary,
} from './check-console-release-boundary.mjs';

const opsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageNames = Object.freeze(['@unisane/tokens', '@unisane/ui', '@unisane/data-table']);
const forbiddenFallbackPatterns = Object.freeze([
  /(?:^|[\s'"@{[(])(?:workspace|file|link|portal|github|gitlab|bitbucket):/imu,
  /(?:^|[\s'"@{[(])(?:https?|ssh):\/\//imu,
  /(?:^|[\s'"@{[(])git(?:\+(?:https?|ssh|file))?:/imu,
  /(?:^|[\s'"@{[(])git@[a-z0-9.-]+:/imu,
  /(?:^|[\s'"@{[(])\/(?:Users|home|private|tmp|var|opt)\//imu,
  /(?:specifier|version):\s*['"]?npm:|@npm:/imu,
  /(?:directory|path|tarball):\s*['"]?(?:\.\.?\/|\/)/imu,
  /(?:repo|repository):\s*['"]?(?:(?:workspace|file|link|portal|github|gitlab|bitbucket):|(?:https?|ssh):\/\/|git(?:\+(?:https?|ssh|file))?:|git@[a-z0-9.-]+:)/imu,
  /(?:\.\.\/)+(?:Unisane|unisane-(?:ops|pro|ui|site|platforms|infrastructure))(?:\/|$)/imu,
]);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
}

export function hashValue(value) {
  return createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? opsRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status ?? 'signal'}).\n${result.stderr || result.stdout || ''}`,
    );
  }
  return result.stdout ?? '';
}

function packageProfiles(policy) {
  return packageNames.map((name) => ({ name, ...policy.cleanExternalConsumer.artifacts[name] }));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function assertOpsSemanticEvidence(evidence, policy) {
  const inventory = evidence.semanticInventory;
  if (!inventory || inventory.imports.length === 0 || inventory.coordinates.length !== 2) {
    throw new Error('Ops-owned evidence lacks the exact console UI consumer boundary.');
  }
  if (evidence.violations.length !== 0) {
    throw new Error(`Ops-owned semantic evidence is invalid: ${evidence.violations.join('; ')}`);
  }
  for (const coordinate of inventory.coordinates) {
    const expected = policy.currentDependencies[coordinate.packageName];
    if (
      !packageNames.includes(coordinate.packageName) ||
      !expected ||
      coordinate.coordinate !== expected ||
      coordinate.field !== 'dependencies'
    ) {
      throw new Error('Ops console semantic evidence retains a non-registry consumer coordinate.');
    }
  }
  if (
    evidence.semanticInventoryDigest !==
    policy.cleanExternalConsumer.consumerSemanticInventoryDigest
  ) {
    throw new Error(
      `Ops console semantic inventory differs from policy: observed=${evidence.semanticInventoryDigest}.`,
    );
  }
  return inventory;
}

export function assertFrozenConsumerLock(lock, artifacts) {
  const forbiddenPattern = forbiddenFallbackPatterns.find((pattern) => pattern.test(lock));
  if (forbiddenPattern) {
    const forbiddenMatch = lock.match(forbiddenPattern)?.[0] ?? '';
    const matchIndex = lock.search(forbiddenPattern);
    const context = lock.slice(
      Math.max(0, matchIndex - 80),
      matchIndex + forbiddenMatch.length + 80,
    );
    throw new Error(
      `External consumer lock retained a workspace, file, link, portal, Git, sibling, copied-source, or local fallback: ${JSON.stringify(forbiddenMatch)} in ${JSON.stringify(context)}.`,
    );
  }
  const packagesStart = lock.indexOf('\npackages:\n');
  if (packagesStart === -1) throw new Error('External consumer lock lacks a packages inventory.');
  const importers = lock.slice(0, packagesStart);
  const packages = lock.slice(packagesStart);
  for (const [name, artifact] of Object.entries(artifacts)) {
    const exactImporter = new RegExp(
      `\\n[ \\t]+['"]?${escapeRegExp(name)}['"]?:\\n[ \\t]+specifier: ['"]?${escapeRegExp(artifact.version)}['"]?\\n[ \\t]+version: ['"]?${escapeRegExp(artifact.version)}['"]?(?:\\(|\\n|$)`,
      'u',
    );
    if (!exactImporter.test(importers)) {
      throw new Error(`External consumer lock does not bind ${name} to exact ${artifact.version}.`);
    }
    const marker = `\n  '${name}@${artifact.version}':\n`;
    const start = packages.indexOf(marker);
    if (start === -1) {
      throw new Error(
        `External consumer lock lacks the exact ${name}@${artifact.version} package.`,
      );
    }
    const next = packages.indexOf('\n  ', start + marker.length);
    const block = packages.slice(start, next === -1 ? undefined : next);
    if (!block.includes(`resolution: {integrity: ${artifact.registryIntegrity}}`)) {
      throw new Error(`External consumer lock integrity differs for ${name}@${artifact.version}.`);
    }
  }
}

export function normalizedConsumerLockDigest(lock, artifacts) {
  assertFrozenConsumerLock(lock, artifacts);
  return createHash('sha256').update(lock).digest('hex');
}

export function assertExactSingletons(singletons) {
  for (const [name, paths] of Object.entries(singletons)) {
    if (paths.length === 0 || new Set(paths).size !== 1) {
      throw new Error(`${name} does not resolve to one exact external-consumer singleton.`);
    }
  }
}

export function assertReceiptContract(receipt, expected) {
  const observed = {
    normalizedLockSha256: receipt.install.normalizedLockSha256,
    reactVersion: receipt.reactSingletons.react.version,
    reactDomVersion: receipt.reactSingletons.reactDom.version,
    runtimeModuleCount: receipt.validation.runtimeModuleCount,
    browserCssSha256: receipt.validation.browser.cssSha256,
    materialSymbolsFontSha256: receipt.validation.browser.fontAssets[0]?.sha256 ?? null,
  };
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error(
      `External consumer receipt differs from policy: expected=${JSON.stringify(expected)} observed=${JSON.stringify(observed)}.`,
    );
  }
}

export function assertConversionReadyBoundary(boundary) {
  if (!boundary.conversionReady) {
    throw new Error(
      `Ops console release boundary is not conversion-ready: ${boundary.violations.join('; ')}`,
    );
  }
}

function fixtureImports(records) {
  const bySpecifier = new Map();
  for (const record of records) {
    if (record.specifier.endsWith('.css')) continue;
    const current = bySpecifier.get(record.specifier) ?? { types: new Set(), values: new Set() };
    record.types.forEach((name) => current.types.add(name));
    record.values.forEach((name) => current.values.add(name));
    bySpecifier.set(record.specifier, current);
  }
  const typeLines = [];
  const valueLines = [];
  const runtimeChecks = [];
  let index = 0;
  for (const [specifier, imports] of [...bySpecifier].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const typeNames = [...imports.types].sort();
    if (typeNames.includes('*')) {
      typeLines.push(`import type * as T${index++} from ${JSON.stringify(specifier)};`);
    }
    if (typeNames.includes('default')) {
      typeLines.push(`import type T${index++} from ${JSON.stringify(specifier)};`);
    }
    const namedTypes = typeNames.filter((name) => name !== '*' && name !== 'default');
    if (namedTypes.length > 0) {
      typeLines.push(
        `import type { ${namedTypes.map((name) => `${name} as T${index++}`).join(', ')} } from ${JSON.stringify(specifier)};`,
      );
    }
    const valueNames = [...imports.values].sort();
    if (valueNames.includes('*')) {
      const alias = `V${index++}`;
      valueLines.push(`import * as ${alias} from ${JSON.stringify(specifier)};`);
      valueLines.push(`void ${alias};`);
    }
    if (valueNames.includes('default')) {
      const alias = `V${index++}`;
      valueLines.push(`import ${alias} from ${JSON.stringify(specifier)};`);
      valueLines.push(`void ${alias};`);
    }
    const namedValues = valueNames.filter((name) => name !== '*' && name !== 'default');
    if (namedValues.length > 0) {
      const aliases = namedValues.map((name) => ({ alias: `V${index++}`, name }));
      valueLines.push(
        `import { ${aliases.map(({ alias, name }) => `${name} as ${alias}`).join(', ')} } from ${JSON.stringify(specifier)};`,
      );
      valueLines.push(`void [${aliases.map(({ alias }) => alias).join(', ')}];`);
    }
    runtimeChecks.push({ specifier, values: valueNames });
  }
  return {
    runtimeChecks,
    source: `${typeLines.join('\n')}\n${valueLines.join('\n')}\n`,
  };
}

function materializeConsumer(workRoot, inventory, policy) {
  const fixtureRoot = path.join(workRoot, 'consumer');
  mkdirSync(fixtureRoot, { recursive: true });
  const toolchain = policy.toolchain;
  const artifacts = policy.cleanExternalConsumer.artifacts;
  writeJson(path.join(fixtureRoot, 'package.json'), {
    name: 'unisane-ops-console-external-consumer-proof',
    version: '0.0.0',
    private: true,
    type: 'module',
    engines: { node: policy.nodeRuntime.engineFloor },
    scripts: {
      typecheck: 'tsc --noEmit',
      build: 'tsup --config tsup.config.ts',
    },
    dependencies: {
      '@material-symbols/font-400': toolchain.materialSymbols,
      '@unisane/data-table': artifacts['@unisane/data-table'].version,
      '@unisane/tokens': artifacts['@unisane/tokens'].version,
      '@unisane/ui': artifacts['@unisane/ui'].version,
      react: toolchain.react,
      'react-dom': toolchain.reactDom,
    },
    devDependencies: {
      '@types/react': toolchain.typesReact,
      '@types/react-dom': toolchain.typesReactDom,
      tsup: toolchain.tsup,
      typescript: toolchain.typescript,
    },
    packageManager: toolchain.packageManager,
  });
  writeJson(path.join(fixtureRoot, 'tsconfig.json'), {
    compilerOptions: {
      strict: true,
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      jsx: 'react-jsx',
      skipLibCheck: false,
      noEmit: true,
    },
    include: ['browser.tsx'],
  });
  writeFileSync(
    path.join(fixtureRoot, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup';\nexport default defineConfig({ entry: ['browser.tsx'], format: ['esm'], platform: 'browser', target: 'es2022', outDir: 'dist', clean: true, splitting: false, minify: true, dts: false, noExternal: [/.*/] });\n`,
  );
  const imports = fixtureImports(inventory.imports);
  writeFileSync(
    path.join(fixtureRoot, 'browser.tsx'),
    `import '@material-symbols/font-400/outlined.css';\nimport '@unisane/ui/styles.css';\nimport '@unisane/data-table/styles.css';\n${imports.source}\n`,
  );
  writeFileSync(
    path.join(fixtureRoot, 'runtime-check.mjs'),
    `import { createRequire } from 'node:module';\nimport { readFileSync, realpathSync } from 'node:fs';\nimport { createElement } from 'react';\nimport { renderToStaticMarkup } from 'react-dom/server';\nimport { Button } from '@unisane/ui/button';\nimport { DataTable } from '@unisane/data-table';\nimport { preloadPDF, preloadXLSX } from '@unisane/data-table/export';\nconst checks = ${JSON.stringify(imports.runtimeChecks)};\nfor (const check of checks) {\n  const loaded = await import(check.specifier);\n  for (const name of check.values) if (name !== '*' && !(name in loaded)) throw new Error(check.specifier + ' lacks ' + name);\n}\nconst request = createRequire(import.meta.url);\nconst roots = [import.meta.url, request.resolve('@unisane/ui/button'), request.resolve('@unisane/data-table')];\nconst singletonPaths = { react: [], reactDom: [] };\nfor (const root of roots) {\n  const nestedRequest = createRequire(root);\n  singletonPaths.react.push(realpathSync(nestedRequest.resolve('react/package.json')));\n  singletonPaths.reactDom.push(realpathSync(nestedRequest.resolve('react-dom/package.json')));\n}\nconst packageVersion = (file) => JSON.parse(readFileSync(file, 'utf8')).version;\nconst button = renderToStaticMarkup(createElement(Button, null, 'External Ops'));\nconst table = renderToStaticMarkup(createElement(DataTable, { data: [{ id: '1', name: 'Ada' }], columns: [{ key: 'name', header: 'Name' }], preset: 'simple' }));\nif (!button.includes('External Ops') || !table.includes('Ada')) throw new Error('UI SSR runtime smoke failed.');\nawait preloadXLSX();\nawait preloadPDF();\nconsole.log(JSON.stringify({ singletonPaths, singletonVersions: { react: packageVersion(singletonPaths.react[0]), reactDom: packageVersion(singletonPaths.reactDom[0]) }, runtimeModuleCount: checks.length, dynamicDependencies: ['jspdf', 'jspdf-autotable', 'xlsx'] }));\n`,
  );
  return fixtureRoot;
}

function inspectBrowserOutput(fixtureRoot, policy) {
  const distRoot = path.join(fixtureRoot, 'dist');
  const entries = readdirSync(distRoot).sort();
  const cssEntry = entries.find((entry) => entry.endsWith('.css'));
  if (!cssEntry) throw new Error('External consumer browser build emitted no CSS.');
  const css = readFileSync(path.join(distRoot, cssEntry), 'utf8');
  if (/@import\s/iu.test(css)) throw new Error('External consumer CSS retains unresolved @import.');
  if (!css.includes(policy.materialSymbols.emittedFontFamily)) {
    throw new Error('External consumer CSS lacks the exact Material Symbols family.');
  }
  for (const selector of policy.dataTableStylesheet.emittedSelectors) {
    if (!css.includes(selector.replaceAll('\\/', '/')) && !css.includes(selector)) {
      throw new Error(`External consumer CSS lacks DataTable selector ${selector}.`);
    }
  }
  const assets = entries.filter((entry) => /\.(?:woff2?|ttf|otf)$/iu.test(entry));
  if (assets.length === 0) throw new Error('External consumer emitted no Material Symbols asset.');
  return {
    entries,
    cssEntry,
    cssSha256: sha256File(path.join(distRoot, cssEntry)),
    fontAssets: assets.map((entry) => ({
      entry,
      bytes: statSync(path.join(distRoot, entry)).size,
      sha256: sha256File(path.join(distRoot, entry)),
    })),
  };
}

function inspectInstalledPackages(fixtureRoot, profiles) {
  const fixtureRealPath = realpathSync(fixtureRoot);
  return Object.fromEntries(
    profiles.map(({ name, version }) => {
      const packageRoot = realpathSync(path.join(fixtureRoot, 'node_modules', ...name.split('/')));
      if (
        packageRoot !== fixtureRealPath &&
        !packageRoot.startsWith(`${fixtureRealPath}${path.sep}`)
      ) {
        throw new Error(`${name} resolved outside the disposable consumer.`);
      }
      const installedVersion = readJson(path.join(packageRoot, 'package.json')).version;
      if (installedVersion !== version) {
        throw new Error(`${name} installed ${installedVersion}; expected exact ${version}.`);
      }
      return [name, { version: installedVersion, resolvedInsideConsumer: true }];
    }),
  );
}

export function executeProof(root = opsRoot) {
  const policy = readJson(path.join(root, 'tools/repository/console-release-boundary-policy.json'));
  const boundary = evaluateConsoleReleaseBoundary(root, { policy });
  assertConversionReadyBoundary(boundary);
  const evidence = collectConsoleConsumerEvidence(root, { policy });
  const inventory = assertOpsSemanticEvidence(evidence, policy);
  const profiles = packageProfiles(policy);
  const workRoot = mkdtempSync(path.join(tmpdir(), 'unisane-ops-console-external-consumer-'));
  const storeRoot = path.join(root, policy.toolchain.storeDir);
  try {
    const fixtureRoot = materializeConsumer(workRoot, inventory, policy);
    const installArgs = [
      'install',
      '--offline',
      '--ignore-workspace',
      '--config.shared-workspace-lockfile=false',
      '--store-dir',
      storeRoot,
    ];
    run('pnpm', [...installArgs, '--lockfile-only'], { cwd: fixtureRoot });
    const lockPath = path.join(fixtureRoot, 'pnpm-lock.yaml');
    const artifacts = policy.cleanExternalConsumer.artifacts;
    assertFrozenConsumerLock(readFileSync(lockPath, 'utf8'), artifacts);
    run('pnpm', [...installArgs, '--frozen-lockfile'], { cwd: fixtureRoot });
    const lock = readFileSync(lockPath, 'utf8');
    assertFrozenConsumerLock(lock, artifacts);
    run('pnpm', ['typecheck'], { cwd: fixtureRoot });
    run('pnpm', ['build'], { cwd: fixtureRoot });
    const runtime = JSON.parse(run('node', ['runtime-check.mjs'], { cwd: fixtureRoot }).trim());
    assertExactSingletons(runtime.singletonPaths);
    if (
      runtime.singletonVersions.react !== policy.toolchain.react ||
      runtime.singletonVersions.reactDom !== policy.toolchain.reactDom
    ) {
      throw new Error('External consumer React singleton versions differ from policy.');
    }
    const browser = inspectBrowserOutput(fixtureRoot, policy);
    const receipt = {
      schemaVersion: 2,
      proofId: policy.cleanExternalConsumer.proofId,
      state: 'verified-offline-frozen-isolated-consumer',
      consumerSemanticInventory: {
        digest: evidence.semanticInventoryDigest,
        declarationCount: inventory.imports.length,
        sourceFileCount: inventory.sourceFiles.length,
        coordinates: inventory.coordinates,
      },
      artifacts: profiles.map(({ name, version, registryIntegrity }) => ({
        name,
        version,
        registryIntegrity,
      })),
      install: {
        mode: 'offline-frozen-exact-registry',
        normalizedLockSha256: normalizedConsumerLockDigest(lock, artifacts),
        installedPackages: inspectInstalledPackages(fixtureRoot, profiles),
        forbiddenFallbackCount: 0,
      },
      reactSingletons: {
        react: { version: runtime.singletonVersions.react, resolvedPathCount: 1 },
        reactDom: { version: runtime.singletonVersions.reactDom, resolvedPathCount: 1 },
      },
      validation: {
        typecheck: true,
        browserBuild: true,
        runtimeModuleCount: runtime.runtimeModuleCount,
        dynamicDependencies: runtime.dynamicDependencies,
        browser,
      },
      authority: policy.authority,
      externalEffects: [],
    };
    assertReceiptContract(receipt, policy.cleanExternalConsumer.receipt);
    return receipt;
  } finally {
    if (existsSync(workRoot)) rmSync(workRoot, { recursive: true, force: true });
  }
}

function main() {
  const receipt = executeProof();
  console.log(JSON.stringify(receipt, null, 2));
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
