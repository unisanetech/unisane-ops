import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  assertCertifiedInputs,
  assertExactSingletons,
  assertFrozenConsumerLock,
  assertReceiptContract,
  hashValue,
  normalizedConsumerLockDigest,
  selectOpsSemanticInventory,
} from '../scripts/check-console-external-consumer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(
  readFileSync(join(root, 'tools/repository/console-release-boundary-policy.json'), 'utf8'),
);

function artifact(name) {
  return { name, ...policy.cleanExternalConsumer.artifacts[name] };
}

function certificate() {
  const imports = [
    {
      file: 'unisane-ops/apps/console/src/browser/main.tsx',
      packageName: '@unisane/ui',
      specifier: '@unisane/ui/styles.css',
      types: [],
      values: [],
      order: 0,
    },
  ];
  return {
    publicationAuthorized: false,
    consumerConversionAuthorized: false,
    externalEffects: [],
    sourceIdentity: {
      producerContentDigest: policy.cleanExternalConsumer.producerContentDigest,
    },
    artifacts: [
      artifact('@unisane/tokens'),
      artifact('@unisane/ui'),
      artifact('@unisane/data-table'),
    ],
    consumerImports: {
      semanticInventory: {
        imports,
        sourceFiles: [imports[0].file],
        coordinates: [
          {
            consumerRoot: 'unisane-ops/apps/console',
            consumerName: '@unisane/ops-console',
            consumerPrivate: true,
            packageName: '@unisane/data-table',
            coordinate: 'workspace:*',
            field: 'dependencies',
          },
          {
            consumerRoot: 'unisane-ops/apps/console',
            consumerName: '@unisane/ops-console',
            consumerPrivate: true,
            packageName: '@unisane/ui',
            coordinate: 'workspace:*',
            field: 'dependencies',
          },
        ],
      },
    },
  };
}

test('Ops semantic inventory excludes non-console consumers', () => {
  const value = certificate();
  value.consumerImports.semanticInventory.imports.push({
    ...value.consumerImports.semanticInventory.imports[0],
    file: 'unisane/starters/saaskit/src/main.tsx',
  });
  const inventory = selectOpsSemanticInventory(value);
  assert.equal(inventory.imports.length, 1);
  assert.equal(inventory.coordinates.length, 2);
});

test('certified producer and consumer digest drift fails closed', () => {
  const value = certificate();
  value.sourceIdentity.producerContentDigest = '0'.repeat(64);
  assert.throws(
    () => assertCertifiedInputs(value, policy, new Map()),
    /producer content digest differs/u,
  );
  assert.notEqual(
    hashValue(selectOpsSemanticInventory(certificate())),
    policy.cleanExternalConsumer.consumerSemanticInventoryDigest,
  );
});

test('lock permits only exact certified tarball locators', () => {
  const lock = [
    'file:/private/tmp/proof/tarballs/unisane-tokens-0.1.0.tgz',
    'file:/private/tmp/proof/tarballs/unisane-ui-0.1.0.tgz',
    'file:/private/tmp/proof/tarballs/unisane-data-table-0.1.0.tgz',
  ].join('\n');
  assert.doesNotThrow(() => assertFrozenConsumerLock(lock));
  assert.equal(normalizedConsumerLockDigest(lock).length, 64);
  assert.throws(() => assertFrozenConsumerLock(`${lock}\nworkspace:*\n`), /retained a workspace/u);
  assert.throws(
    () => assertFrozenConsumerLock(`${lock}\nfile:../source-copy\n`),
    /retained a workspace/u,
  );
});

test('React and ReactDOM must resolve to exact singleton paths', () => {
  assert.doesNotThrow(() =>
    assertExactSingletons({ react: ['/one/react'], reactDom: ['/one/react-dom'] }),
  );
  assert.throws(
    () => assertExactSingletons({ react: ['/one/react', '/two/react'] }),
    /one exact external-consumer singleton/u,
  );
});

test('material receipt drift fails closed', () => {
  const expected = policy.cleanExternalConsumer.receipt;
  const receipt = {
    install: { normalizedLockSha256: expected.normalizedLockSha256 },
    reactSingletons: {
      react: { version: expected.reactVersion },
      reactDom: { version: expected.reactDomVersion },
    },
    validation: {
      runtimeModuleCount: expected.runtimeModuleCount,
      browser: {
        cssSha256: expected.browserCssSha256,
        fontAssets: [{ sha256: expected.materialSymbolsFontSha256 }],
      },
    },
  };
  assert.doesNotThrow(() => assertReceiptContract(receipt, expected));
  receipt.validation.runtimeModuleCount += 1;
  assert.throws(() => assertReceiptContract(receipt, expected), /receipt differs/u);
});
