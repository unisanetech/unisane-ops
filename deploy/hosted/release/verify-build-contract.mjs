#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function main() {
  const result = spawnSync(
    'docker',
    ['buildx', 'bake', '--file', 'unisane-ops/deploy/hosted/release/docker-bake.hcl', '--print'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error('Failed to resolve the hosted release build contract.');
  }

  const contract = JSON.parse(result.stdout);
  const target = contract.target?.runtime;
  const attestations = target?.attest ?? [];
  const hasAttestation = (expected) =>
    attestations.some((attestation) =>
      Object.entries(expected).every(([key, value]) => attestation?.[key] === value),
    );
  if (
    target?.context !== '.' ||
    target?.dockerfile !== 'unisane-ops/apps/hosted-runtime/Dockerfile' ||
    target?.target !== 'runtime' ||
    !hasAttestation({ type: 'provenance', mode: 'max', version: 'v1' }) ||
    !hasAttestation({ type: 'sbom' }) ||
    !Array.isArray(target.platforms) ||
    target.platforms.length !== 2
  ) {
    throw new Error('The hosted release build contract is incomplete.');
  }

  process.stdout.write(
    `${JSON.stringify({
      schemaVersion: 1,
      kind: 'unisane.ops.hosted-release-build-contract',
      target: 'runtime',
      platforms: target.platforms,
      provenance: 'max-v1',
      sbom: 'spdx',
    })}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Hosted build verification failed.'}\n`,
  );
  process.exitCode = 1;
}
