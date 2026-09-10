import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  collectConsoleConsumerEvidence,
  evaluateConsoleReleaseBoundary,
} from '../scripts/check-console-release-boundary.mjs';
import {
  assertConversionReadyBoundary,
  assertExactSingletons,
  assertFrozenConsumerLock,
  assertOpsSemanticEvidence,
  assertReceiptContract,
  normalizedConsumerLockDigest,
} from '../scripts/check-console-external-consumer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(
  readFileSync(join(root, 'tools/repository/console-release-boundary-policy.json'), 'utf8'),
);
const artifacts = policy.cleanExternalConsumer.artifacts;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function exactLock() {
  const importerDependencies = Object.entries(artifacts)
    .map(
      ([name, artifact]) =>
        `    '${name}':\n      specifier: ${artifact.version}\n      version: ${artifact.version}\n`,
    )
    .join('');
  const packages = Object.entries(artifacts)
    .map(
      ([name, artifact]) =>
        `  '${name}@${artifact.version}':\n    resolution: {integrity: ${artifact.registryIntegrity}}\n`,
    )
    .join('');
  return `lockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    dependencies:\n${importerDependencies}\npackages:\n${packages}`;
}

test('Ops-owned semantic evidence is exact and independent of a producer checkout', () => {
  const evidence = collectConsoleConsumerEvidence(root, { policy });
  const inventory = assertOpsSemanticEvidence(evidence, policy);
  assert.equal(inventory.imports.length, 165);
  assert.equal(inventory.sourceFiles.length, 62);
  assert.deepEqual(
    inventory.coordinates.map(({ packageName, coordinate }) => ({ packageName, coordinate })),
    [
      { packageName: '@unisane/data-table', coordinate: '0.1.2-next.97f61b1d' },
      { packageName: '@unisane/ui', coordinate: '0.1.2-next.97f61b1d' },
    ],
  );
});

test('semantic inventory or consumer coordinate drift fails closed', () => {
  const evidence = collectConsoleConsumerEvidence(root, { policy });
  const changedPolicy = clone(policy);
  changedPolicy.cleanExternalConsumer.consumerSemanticInventoryDigest = '0'.repeat(64);
  assert.throws(
    () => assertOpsSemanticEvidence(evidence, changedPolicy),
    /semantic inventory differs/u,
  );

  const changedEvidence = clone(evidence);
  changedEvidence.semanticInventory.coordinates[0].coordinate = 'workspace:*';
  assert.throws(
    () => assertOpsSemanticEvidence(changedEvidence, policy),
    /non-registry consumer coordinate/u,
  );
});

test('lock requires exact registry versions and immutable integrities', () => {
  const lock = exactLock();
  assert.doesNotThrow(() => assertFrozenConsumerLock(lock, artifacts));
  assert.equal(normalizedConsumerLockDigest(lock, artifacts).length, 64);
  assert.throws(
    () => assertFrozenConsumerLock(lock.replace('specifier: 0.1.2-next.97f61b1d', 'specifier: 0.1.2'), artifacts),
    /does not bind/u,
  );
  assert.throws(
    () =>
      assertFrozenConsumerLock(
        lock.replace(artifacts['@unisane/ui'].registryIntegrity, 'sha512-drift'),
        artifacts,
      ),
    /integrity differs/u,
  );
});

test('lock rejects every local, sibling, copied-source, alias, and Git fallback class', () => {
  const lock = exactLock();
  const specifierFallbacks = [
    'workspace:*',
    'file:../copied-ui',
    'link:../unisane-ui',
    'portal:../unisane-ui',
    'npm:@unisane/ui@0.1.1',
    'github:unisane/ui',
    'https://registry.example.test/@unisane/ui.tgz',
    '/Users/example/unisane-ui',
    '../Unisane/unisane-ui',
  ];
  for (const fallback of specifierFallbacks) {
    assert.throws(
      () => assertFrozenConsumerLock(`${lock}\n      specifier: ${fallback}\n`, artifacts),
      /retained a workspace, file, link, portal, Git, sibling, copied-source, or local fallback/u,
    );
  }

  const lockFragments = [
    "  'transitive@file:../copied-ui':\n    resolution: {directory: ../copied-ui}",
    "  'transitive@git+file:../copied-ui':\n    resolution: {repository: git+file:../copied-ui}",
    "  'transitive@gitlab:owner/repo':\n    resolution: {repository: gitlab:owner/repo}",
    "  'transitive@bitbucket:owner/repo':\n    resolution: {repository: bitbucket:owner/repo}",
    "  'transitive@ssh://git@example.test/repo':\n    resolution: {repo: ssh://git@example.test/repo}",
    "  'transitive@git@example.test:owner/repo':\n    resolution: {repository: git@example.test:owner/repo}",
  ];
  for (const fragment of lockFragments) {
    assert.throws(
      () => assertFrozenConsumerLock(`${lock}\n${fragment}\n`, artifacts),
      /retained a workspace, file, link, portal, Git, sibling, copied-source, or local fallback/u,
    );
  }
});

test('standalone proof rejects an authority contract that reopens external effects', () => {
  const changedPolicy = clone(policy);
  changedPolicy.authority.opsPublicationAuthorized = true;
  const boundary = evaluateConsoleReleaseBoundary(root, { policy: changedPolicy });
  assert.throws(() => assertConversionReadyBoundary(boundary), /not conversion-ready/u);
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

test('material receipt drift fails closed and reports refreshable observed values', () => {
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
  assert.throws(() => assertReceiptContract(receipt, expected), /expected=.*observed=/u);
});
