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

const opsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const umbrellaRoot = path.resolve(opsRoot, '..');
const packageProfiles = Object.freeze([
  Object.freeze({ name: '@unisane/tokens', tarball: 'unisane-tokens-0.1.0.tgz' }),
  Object.freeze({ name: '@unisane/ui', tarball: 'unisane-ui-0.1.0.tgz' }),
  Object.freeze({ name: '@unisane/data-table', tarball: 'unisane-data-table-0.1.0.tgz' }),
]);
const allowedTarballLocator =
  /file:[^\s"',}\]]*\/tarballs\/unisane-(?:data-table|tokens|ui)-0\.1\.0\.tgz/gu;
const forbiddenFallback =
  /(?:^|[\s'"])(?:workspace|file|link|portal):|(?:\.\.\/)+(?:Unisane|unisane-(?:ops|pro|ui|site|platforms|infrastructure))(?:\/|$)/mu;

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
    cwd: options.cwd ?? umbrellaRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    stdio: options.inherit ? 'inherit' : 'pipe',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status ?? 'signal'}).\n${result.stderr || result.stdout || ''}`,
    );
  }
  return result.stdout ?? '';
}

export function selectOpsSemanticInventory(certificate) {
  const semantic = certificate.consumerImports?.semanticInventory;
  if (!semantic) throw new Error('Packed producer certificate lacks consumer semantic inventory.');
  const imports = semantic.imports.filter(({ file }) =>
    file.startsWith('unisane-ops/apps/console/'),
  );
  const inventory = {
    imports,
    sourceFiles: [...new Set(imports.map(({ file }) => file))].sort(),
    coordinates: semantic.coordinates.filter(
      ({ consumerRoot }) => consumerRoot === 'unisane-ops/apps/console',
    ),
  };
  if (imports.length === 0 || inventory.coordinates.length !== 2) {
    throw new Error(
      'Packed producer certificate lacks the exact Ops console UI consumer boundary.',
    );
  }
  return inventory;
}

export function assertCertifiedInputs(certificate, policy, tarballs) {
  if (
    certificate.publicationAuthorized !== false ||
    certificate.consumerConversionAuthorized !== false ||
    certificate.externalEffects?.length !== 0
  ) {
    throw new Error('Packed producer certificate must remain fail-closed and side-effect free.');
  }
  if (
    certificate.sourceIdentity?.producerContentDigest !==
    policy.cleanExternalConsumer.producerContentDigest
  ) {
    throw new Error(
      'Packed producer content digest differs from the canonical Ops proof contract.',
    );
  }
  const certified = new Map(certificate.artifacts.map((artifact) => [artifact.name, artifact]));
  for (const profile of packageProfiles) {
    const expected = policy.cleanExternalConsumer.artifacts[profile.name];
    const artifact = certified.get(profile.name);
    const tarballPath = tarballs.get(profile.name);
    if (!expected || !artifact || !tarballPath) {
      throw new Error(`Certified artifact input is missing for ${profile.name}.`);
    }
    if (
      artifact.version !== expected.version ||
      artifact.contentDigest !== expected.contentDigest ||
      artifact.runArtifactSha256 !== expected.tarballSha256 ||
      sha256File(tarballPath) !== expected.tarballSha256
    ) {
      throw new Error(`Certified artifact digest differs for ${profile.name}.`);
    }
  }
  const inventory = selectOpsSemanticInventory(certificate);
  if (hashValue(inventory) !== policy.cleanExternalConsumer.consumerSemanticInventoryDigest) {
    throw new Error('Ops console semantic inventory differs from the canonical proof contract.');
  }
  return inventory;
}

export function assertFrozenConsumerLock(lock) {
  const withoutCertifiedTarballs = lock.replace(allowedTarballLocator, '');
  if (forbiddenFallback.test(withoutCertifiedTarballs)) {
    throw new Error(
      'External consumer lock retained a workspace, file, link, portal, sibling, or source fallback.',
    );
  }
  for (const profile of packageProfiles) {
    if (!lock.includes(profile.tarball)) {
      throw new Error(`External consumer lock does not bind ${profile.name} to its tarball.`);
    }
  }
}

export function normalizedConsumerLockDigest(lock) {
  assertFrozenConsumerLock(lock);
  return createHash('sha256')
    .update(lock.replace(allowedTarballLocator, 'file:<CERTIFIED_TARBALL>'))
    .digest('hex');
}

export function assertExactSingletons(singletons) {
  for (const [name, paths] of Object.entries(singletons)) {
    if (new Set(paths).size !== 1) {
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
    throw new Error('External consumer receipt differs from the exact canonical proof contract.');
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
    const types = [...imports.types].filter((name) => name !== '*' && name !== 'default');
    if (types.length > 0) {
      typeLines.push(
        `import type { ${types.map((name) => `${name} as T${index++}`).join(', ')} } from ${JSON.stringify(specifier)};`,
      );
    }
    const values = [...imports.values].filter((name) => name !== '*' && name !== 'default');
    if (values.length > 0) {
      const aliases = values.map((name) => ({ alias: `V${index++}`, name }));
      valueLines.push(
        `import { ${aliases.map(({ alias, name }) => `${name} as ${alias}`).join(', ')} } from ${JSON.stringify(specifier)};`,
      );
      valueLines.push(`void [${aliases.map(({ alias }) => alias).join(', ')}];`);
    }
    runtimeChecks.push({ specifier, values });
  }
  return {
    runtimeChecks,
    source: `${typeLines.join('\n')}\n${valueLines.join('\n')}\n`,
  };
}

function prepareCertifiedArtifacts(workRoot) {
  const certificateRoot = path.join(workRoot, 'certificate');
  const tarballRoot = path.join(workRoot, 'tarballs');
  mkdirSync(certificateRoot, { recursive: true });
  mkdirSync(tarballRoot, { recursive: true });
  run('pnpm', ['--dir', 'unisane-ui', 'check:packed-producer-certificate'], {
    env: { SKOPOS_ARTIFACT_ROOT: certificateRoot },
  });
  for (const profile of packageProfiles) {
    run('pnpm', ['--filter', profile.name, 'pack', '--pack-destination', tarballRoot]);
  }
  const certificate = readJson(
    path.join(certificateRoot, 'unisane-ui/packed-producer-certificate.json'),
  );
  const tarballs = new Map(
    packageProfiles.map((profile) => [profile.name, path.join(tarballRoot, profile.tarball)]),
  );
  return { certificate, tarballs };
}

function materializeConsumer(workRoot, inventory, tarballs) {
  const fixtureRoot = path.join(workRoot, 'consumer');
  mkdirSync(fixtureRoot, { recursive: true });
  const installed = (name) =>
    readJson(path.join(umbrellaRoot, 'node_modules', name, 'package.json'));
  const locator = (name) => `file:${tarballs.get(name)}`;
  writeJson(path.join(fixtureRoot, 'package.json'), {
    name: 'unisane-ops-console-external-consumer-proof',
    version: '0.0.0',
    private: true,
    type: 'module',
    engines: { node: '>=24.13.0' },
    scripts: {
      typecheck: 'tsc --noEmit',
      build: 'tsup --config tsup.config.ts',
      runtime: 'node runtime-check.mjs',
    },
    dependencies: {
      '@material-symbols/font-400': installed('@material-symbols/font-400').version,
      '@unisane/data-table': locator('@unisane/data-table'),
      '@unisane/tokens': locator('@unisane/tokens'),
      '@unisane/ui': locator('@unisane/ui'),
      react: installed('react').version,
      'react-dom': installed('react-dom').version,
    },
    devDependencies: {
      '@types/react': installed('@types/react').version,
      '@types/react-dom': installed('@types/react-dom').version,
      tsup: installed('tsup').version,
      typescript: installed('typescript').version,
    },
    pnpm: {
      overrides: {
        '@unisane/tokens@0.1.0': locator('@unisane/tokens'),
        '@unisane/ui@0.1.0': locator('@unisane/ui'),
      },
    },
    packageManager: 'pnpm@10.26.0',
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
    `import { createRequire } from 'node:module';\nimport { readFileSync, realpathSync } from 'node:fs';\nimport { createElement } from 'react';\nimport { renderToStaticMarkup } from 'react-dom/server';\nimport { Button } from '@unisane/ui/button';\nimport { DataTable } from '@unisane/data-table';\nimport { preloadPDF, preloadXLSX } from '@unisane/data-table/export';\nconst checks = ${JSON.stringify(imports.runtimeChecks)};\nfor (const check of checks) {\n  const loaded = await import(check.specifier);\n  for (const name of check.values) if (!(name in loaded)) throw new Error(check.specifier + ' lacks ' + name);\n}\nconst roots = [import.meta.url, new URL('./node_modules/@unisane/ui/package.json', import.meta.url), new URL('./node_modules/@unisane/data-table/package.json', import.meta.url)];\nconst singletonPaths = { react: [], reactDom: [] };\nfor (const root of roots) {\n  const request = createRequire(root);\n  singletonPaths.react.push(realpathSync(request.resolve('react/package.json')));\n  singletonPaths.reactDom.push(realpathSync(request.resolve('react-dom/package.json')));\n}\nconst packageVersion = (file) => JSON.parse(readFileSync(file, 'utf8')).version;\nconst button = renderToStaticMarkup(createElement(Button, null, 'External Ops'));\nconst table = renderToStaticMarkup(createElement(DataTable, { data: [{ id: '1', name: 'Ada' }], columns: [{ key: 'name', header: 'Name' }], preset: 'simple' }));\nif (!button.includes('External Ops') || !table.includes('Ada')) throw new Error('UI SSR runtime smoke failed.');\nawait preloadXLSX();\nawait preloadPDF();\nconsole.log(JSON.stringify({ singletonPaths, singletonVersions: { react: packageVersion(singletonPaths.react[0]), reactDom: packageVersion(singletonPaths.reactDom[0]) }, runtimeModuleCount: checks.length, dynamicDependencies: ['jspdf', 'jspdf-autotable', 'xlsx'] }));\n`,
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
    if (!css.includes(selector.replace('\\/', '/')) && !css.includes(selector)) {
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

export function executeProof(root = opsRoot) {
  const policy = readJson(path.join(root, 'tools/repository/console-release-boundary-policy.json'));
  const workRoot = mkdtempSync(path.join(tmpdir(), 'unisane-ops-console-external-consumer-'));
  try {
    const { certificate, tarballs } = prepareCertifiedArtifacts(workRoot);
    const inventory = assertCertifiedInputs(certificate, policy, tarballs);
    const fixtureRoot = materializeConsumer(workRoot, inventory, tarballs);
    run('pnpm', ['install', '--lockfile-only', '--offline', '--ignore-workspace'], {
      cwd: fixtureRoot,
    });
    const lockPath = path.join(fixtureRoot, 'pnpm-lock.yaml');
    assertFrozenConsumerLock(readFileSync(lockPath, 'utf8'));
    run('pnpm', ['install', '--offline', '--frozen-lockfile', '--ignore-workspace'], {
      cwd: fixtureRoot,
    });
    assertFrozenConsumerLock(readFileSync(lockPath, 'utf8'));
    run('pnpm', ['typecheck'], { cwd: fixtureRoot });
    run('pnpm', ['build'], { cwd: fixtureRoot });
    const runtime = JSON.parse(run('node', ['runtime-check.mjs'], { cwd: fixtureRoot }).trim());
    assertExactSingletons(runtime.singletonPaths);
    const browser = inspectBrowserOutput(fixtureRoot, policy);
    const installedPackages = Object.fromEntries(
      packageProfiles.map(({ name }) => {
        const installedRoot = realpathSync(
          path.join(fixtureRoot, 'node_modules', ...name.split('/')),
        );
        if (!installedRoot.startsWith(realpathSync(fixtureRoot))) {
          throw new Error(`${name} resolved outside the disposable consumer.`);
        }
        return [name, true];
      }),
    );
    const receipt = {
      schemaVersion: 1,
      proofId: policy.cleanExternalConsumer.proofId,
      state: 'verified-offline-frozen-isolated-consumer',
      producerContentDigest: certificate.sourceIdentity.producerContentDigest,
      artifacts: certificate.artifacts.map(
        ({ name, version, contentDigest, runArtifactSha256 }) => ({
          name,
          version,
          contentDigest,
          tarballSha256: runArtifactSha256,
        }),
      ),
      consumerSemanticInventory: {
        digest: hashValue(inventory),
        declarationCount: inventory.imports.length,
        sourceFileCount: inventory.sourceFiles.length,
        coordinates: inventory.coordinates,
      },
      install: {
        mode: 'offline-frozen',
        normalizedLockSha256: normalizedConsumerLockDigest(readFileSync(lockPath, 'utf8')),
        installedPackages,
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
      externalEffects: [],
      publicationAuthorized: false,
      consumerConversionAuthorized: false,
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
