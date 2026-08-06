import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./verify-release.mjs', import.meta.url));
const digest = 'a'.repeat(64);
const image = `registry.example.invalid/unisane/ops@sha256:${digest}`;
const source = 'https://github.com/example/unisane.git';
const revision = 'abc123';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'unisane-ops-release-'));
  const log = join(root, 'cosign.log');
  const cosign = join(root, 'cosign');
  const docker = join(root, 'docker');
  writeFileSync(cosign, `#!/bin/sh\nprintf '%s\\n' "$*" > "$OPS_HOSTED_TEST_COSIGN_LOG"\n`, 'utf8');
  writeFileSync(
    docker,
    `#!/bin/sh\ncase "$*" in\n  *Provenance*) printf '%s\\n' '{"SLSA":{"buildDefinition":{"buildType":"https://mobyproject.org/buildkit@v1","externalParameters":{"request":{"root":{"configSource":{"request":{"vcs:source":"${source}","vcs:revision":"${revision}"}}}}},"resolvedDependencies":[{}]},"runDetails":{"builder":{}}}}' ;;\n  *SBOM*) printf '%s\\n' '{"SPDX":{"SPDXID":"SPDXRef-DOCUMENT","packages":[]}}' ;;\n  *) exit 2 ;;\nesac\n`,
    'utf8',
  );
  chmodSync(cosign, 0o700);
  chmodSync(docker, 0o700);
  return { root, log };
}

test('verifies one digest with the exact signer identity and issuer', () => {
  const { root, log } = fixture();
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${root}${delimiter}${process.env.PATH}`,
      OPS_HOSTED_TEST_COSIGN_LOG: log,
      OPS_HOSTED_RELEASE_IMAGE: image,
      OPS_HOSTED_SIGNER_IDENTITY: 'release@example.com',
      OPS_HOSTED_SIGNER_OIDC_ISSUER: 'https://issuer.test',
      OPS_HOSTED_EXPECTED_SOURCE: source,
      OPS_HOSTED_EXPECTED_REVISION: revision,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).signature, 'verified');
  assert.equal(
    readFileSync(log, 'utf8').trim(),
    `verify --certificate-identity release@example.com --certificate-oidc-issuer https://issuer.test ${image}`,
  );
});

test('rejects a mutable tag before invoking verification tools', () => {
  const { root, log } = fixture();
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${root}${delimiter}${process.env.PATH}`,
      OPS_HOSTED_TEST_COSIGN_LOG: log,
      OPS_HOSTED_RELEASE_IMAGE: 'registry.example.invalid/unisane/ops:latest',
      OPS_HOSTED_SIGNER_IDENTITY: 'release@example.com',
      OPS_HOSTED_SIGNER_OIDC_ISSUER: 'https://issuer.test',
      OPS_HOSTED_EXPECTED_SOURCE: source,
      OPS_HOSTED_EXPECTED_REVISION: revision,
    },
  });
  assert.notEqual(result.status, 0);
  assert.throws(() => readFileSync(log, 'utf8'));
});
