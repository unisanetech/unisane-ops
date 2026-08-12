import assert from 'node:assert/strict';
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { evaluateConsoleReleaseBoundary } from '../scripts/check-console-release-boundary.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(
  readFileSync(join(root, 'tools/repository/console-release-boundary-policy.json'), 'utf8'),
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeFixture() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'ops-console-release-boundary-'));
  mkdirSync(join(fixtureRoot, 'apps/console'), { recursive: true });
  cpSync(join(root, 'apps/console/src'), join(fixtureRoot, 'apps/console/src'), {
    recursive: true,
  });
  for (const path of [
    '.node-version',
    'package.json',
    'apps/console/package.json',
    'apps/console/tsup.browser.config.ts',
  ]) {
    const target = join(fixtureRoot, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(root, path), target);
  }
  return fixtureRoot;
}

function withFixture(callback) {
  const fixtureRoot = makeFixture();
  try {
    callback(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function updateManifest(fixtureRoot, mutate) {
  const path = join(fixtureRoot, 'apps/console/package.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  mutate(manifest);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

function createEmittedFixture(fixtureRoot) {
  const browser = join(fixtureRoot, 'apps/console/dist/browser');
  mkdirSync(browser, { recursive: true });
  writeFileSync(join(fixtureRoot, 'apps/console/dist/index.js'), 'export {};\n');
  writeFileSync(join(fixtureRoot, 'apps/console/dist/index.d.ts'), 'export {};\n');
  writeFileSync(join(browser, 'main.js'), 'export {};\n');
  writeFileSync(
    join(browser, 'main.css'),
    [
      '@font-face { font-family: "Material Symbols Outlined"; src: url("./symbols.woff2"); }',
      '.cursor-cell{cursor:cell}',
      '.group-hover\\/row\\:overflow-visible{overflow:visible}',
      '.row-5000{grid-row:5000}',
      '',
    ].join('\n'),
  );
  writeFileSync(join(browser, 'symbols.woff2'), 'fixture-font');
}

test('current source inventory remains blocked on five exact preconditions', () => {
  const report = evaluateConsoleReleaseBoundary(root);
  assert.equal(report.state, 'blocked-with-exact-preconditions');
  assert.equal(report.conversionReady, false);
  assert.equal(report.authored.declarationCount, 153);
  assert.equal(report.authored.sourceFileCount, 53);
  assert.equal(report.authored.packages['@unisane/ui'].declarationCount, 142);
  assert.equal(report.authored.packages['@unisane/data-table'].declarationCount, 11);
  assert.equal(report.authored.computedLoaderCount, 0);
  assert.deepEqual(
    report.blockers.map(({ id }) => id),
    policy.blockers.map(({ id }) => id),
  );
  assert.deepEqual(report.violations, []);
  assert.equal(report.authority.publicationAuthorized, false);
  assert.equal(report.authority.consumerConversionAuthorized, false);
});

test('nonliteral import, require, and require.resolve loaders fail closed', () => {
  for (const statement of [
    'void import(target);',
    'require(target);',
    'require.resolve(target);',
    "require['resolve'](target);",
  ]) {
    withFixture((fixtureRoot) => {
      appendFileSync(
        join(fixtureRoot, 'apps/console/src/index.ts'),
        `\nconst target = '@unisane/ui/private/compiler';\n${statement}\n`,
      );
      const report = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
      assert.match(
        report.violations.join('\n'),
        /nonliteral (?:import\(\)|require\(\)|require\.resolve\(\))/u,
      );
    });
  }
});

test('private and undeclared UI runtime surfaces fail closed', () => {
  withFixture((fixtureRoot) => {
    appendFileSync(
      join(fixtureRoot, 'apps/console/src/index.ts'),
      "\nimport '@unisane/ui/private/compiler';\n",
    );
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(report.violations.join('\n'), /private UI producer surface is forbidden/u);
  });

  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, (manifest) => {
      delete manifest.dependencies['@material-symbols/font-400'];
    });
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(report.violations.join('\n'), /imported without a dependency declaration/u);
  });
});

test('stylesheet, Material Symbols, React singleton, and Node facts stay explicit', () => {
  const report = evaluateConsoleReleaseBoundary(root);
  assert.deepEqual(report.authored.stylesheets, policy.requiredCurrentStylesheets);
  assert.equal(
    report.blockers.some(({ id }) => id === 'OPS-CONSOLE-RB03-DATA-TABLE-STYLESHEET'),
    false,
  );
  assert.equal(
    report.blockers.some(({ id }) => id === 'OPS-CONSOLE-RB04-NODE-FLOOR'),
    false,
  );
  assert.equal(report.package.nodeFloor, '>=24.13.0');
  assert.equal(report.package.standaloneNodeFloor, '>=24.13.0');
  assert.equal(report.package.standaloneNodeVersion, '24.13.0');
  assert.deepEqual(report.package.reactSingletons, {
    react: '^19.1.0',
    reactDom: '^19.1.0',
  });

  withFixture((fixtureRoot) => {
    const mainPath = join(fixtureRoot, 'apps/console/src/browser/main.tsx');
    writeFileSync(
      mainPath,
      readFileSync(mainPath, 'utf8').replace("import '@unisane/data-table/styles.css';\n", ''),
    );
    const drift = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(
      drift.violations.join('\n'),
      /stylesheet composition-root imports or deterministic order differ/u,
    );
  });

  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, (manifest) => {
      manifest.dependencies.react = '^18.0.0';
    });
    const drift = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(drift.violations.join('\n'), /React singleton dependency ranges differ/u);
  });

  withFixture((fixtureRoot) => {
    updateManifest(fixtureRoot, (manifest) => {
      manifest.engines.node = '>=18.17.0';
    });
    const drift = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(drift.violations.join('\n'), /console Node engine floor differs/u);
  });

  withFixture((fixtureRoot) => {
    const rootManifestPath = join(fixtureRoot, 'package.json');
    const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));
    rootManifest.engines.node = '>=22.13.0';
    writeFileSync(rootManifestPath, `${JSON.stringify(rootManifest, null, 2)}\n`);
    const drift = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(drift.violations.join('\n'), /standalone root Node engine floor differs/u);
  });

  withFixture((fixtureRoot) => {
    writeFileSync(join(fixtureRoot, '.node-version'), '22.13.0\n');
    const drift = evaluateConsoleReleaseBoundary(fixtureRoot, { policy });
    assert.match(drift.violations.join('\n'), /standalone \.node-version differs/u);
  });
});

test('emitted declarations, CSS, and Material Symbols assets are closed and resolvable', () => {
  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.deepEqual(report.violations, []);
    assert.equal(report.emitted.status, 'checked');
    assert.equal(report.emitted.uiDataTableSpecifierCount, 0);
    assert.equal(report.emitted.css.fontFaceCount, 1);
    assert.equal(report.emitted.css.fontAssetCount, 1);
    assert.equal(report.emitted.materialSymbols.fontFaceCount, 1);
    assert.equal(report.emitted.materialSymbols.resolvedFontAssetCount, 1);
    assert.equal(
      report.emitted.css.dataTableSelectors.every(({ present }) => present),
      true,
    );
    assert.deepEqual(report.emitted.css.unresolvedAssets, []);
  });

  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    const cssPath = join(fixtureRoot, 'apps/console/dist/browser/main.css');
    writeFileSync(cssPath, readFileSync(cssPath, 'utf8').replace('.row-5000{grid-row:5000}\n', ''));
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(report.violations.join('\n'), /emitted DataTable stylesheet selector is missing/u);
  });

  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    const browser = join(fixtureRoot, 'apps/console/dist/browser');
    rmSync(join(browser, 'symbols.woff2'));
    writeFileSync(
      join(browser, 'main.css'),
      '@font-face { font-family: "Unrelated Review Font"; src: url("./unrelated.woff2"); }\n',
    );
    writeFileSync(join(browser, 'unrelated.woff2'), 'unrelated-fixture-font');
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(
      report.violations.join('\n'),
      /emitted Material Symbols @font-face family is missing/u,
    );
  });

  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    rmSync(join(fixtureRoot, 'apps/console/dist/browser/main.css'));
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(report.violations.join('\n'), /emitted browser CSS is missing/u);
  });

  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    rmSync(join(fixtureRoot, 'apps/console/dist/browser/symbols.woff2'));
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(report.violations.join('\n'), /font asset is missing|CSS asset does not resolve/u);
  });

  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    appendFileSync(
      join(fixtureRoot, 'apps/console/dist/browser/main.css'),
      '@import "@foreign/private.css";\n',
    );
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(report.violations.join('\n'), /emitted CSS retains an unresolved @import/u);
  });
});

test('emitted private or first-party UI imports cannot escape the browser bundle', () => {
  withFixture((fixtureRoot) => {
    createEmittedFixture(fixtureRoot);
    writeFileSync(
      join(fixtureRoot, 'apps/console/dist/browser/main.js'),
      "import value from '@unisane/ui/private/compiler';\nvoid value;\n",
    );
    const report = evaluateConsoleReleaseBoundary(fixtureRoot, { checkEmitted: true, policy });
    assert.match(
      report.violations.join('\n'),
      /emitted UI\/DataTable import must be browser-bundled/u,
    );
  });
});

test('authority or blocker drift cannot make conversion appear complete', () => {
  const changedPolicy = clone(policy);
  changedPolicy.authority = {
    publicationAuthorized: true,
    consumerConversionAuthorized: true,
    licenseAdmission: 'approved',
  };
  const report = evaluateConsoleReleaseBoundary(root, { policy: changedPolicy });
  assert.equal(report.conversionReady, false);
  assert.match(
    report.violations.join('\n'),
    /active blocker set differs from the exact fail-closed policy/u,
  );
});
