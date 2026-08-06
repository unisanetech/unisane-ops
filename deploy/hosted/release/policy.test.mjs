import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertDeploymentDigests,
  assertProvenance,
  assertSbom,
  assertSignerPolicy,
  extractRenderedImages,
  parseDigestReference,
} from './policy.mjs';

const digest = `sha256:${'a'.repeat(64)}`;
const image = `registry.example.invalid/unisane/ops@${digest}`;
const provenance = {
  SLSA: {
    buildDefinition: {
      buildType: 'https://mobyproject.org/buildkit@v1',
      externalParameters: {
        request: {
          root: {
            configSource: {
              request: {
                'vcs:source': 'https://github.com/example/unisane.git',
                'vcs:revision': 'abc123',
              },
            },
          },
        },
      },
      resolvedDependencies: [{}],
    },
    runDetails: { builder: {} },
  },
};

test('accepts one exact non-placeholder digest and signer policy', () => {
  assert.deepEqual(parseDigestReference(image), {
    repository: 'registry.example.invalid/unisane/ops',
    digest,
  });
  assert.doesNotThrow(() => assertSignerPolicy('release@example.com', 'https://issuer.test'));
});

test('rejects mutable tags, placeholder digests, and non-HTTPS issuers', () => {
  assert.throws(() => parseDigestReference('registry.example.invalid/unisane/ops:latest'));
  assert.throws(() =>
    parseDigestReference(`registry.example.invalid/unisane/ops@sha256:${'0'.repeat(64)}`),
  );
  assert.throws(() => assertSignerPolicy('release@example.com', 'http://issuer.test'));
});

test('requires complete provenance and SPDX SBOM documents', () => {
  assert.doesNotThrow(() =>
    assertProvenance(provenance, {
      source: 'https://github.com/example/unisane.git',
      revision: 'abc123',
    }),
  );
  assert.doesNotThrow(() => assertSbom({ SPDX: { SPDXID: 'SPDXRef-DOCUMENT', packages: [] } }));
  assert.throws(() =>
    assertProvenance(provenance, {
      source: 'https://github.com/example/unisane.git',
      revision: 'wrong',
    }),
  );
  assert.throws(() => assertSbom({ SPDX: { SPDXID: 'wrong', packages: [] } }));
});

test('requires every rendered workload to share one digest', () => {
  const rendered = `containers:\n  - image: ${image}\n  - image: ${image}\n`;
  assert.equal(assertDeploymentDigests(extractRenderedImages(rendered)), image);
  assert.throws(() =>
    assertDeploymentDigests([
      image,
      `registry.example.invalid/unisane/ops@sha256:${'b'.repeat(64)}`,
    ]),
  );
});
