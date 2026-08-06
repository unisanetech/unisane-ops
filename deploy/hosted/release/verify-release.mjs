#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  assertProvenance,
  assertSbom,
  assertSignerPolicy,
  parseDigestReference,
} from './policy.mjs';

function run(command, arguments_) {
  const result = spawnSync(command, arguments_, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Hosted release verification failed while running ${command}.`);
  }
  return result.stdout;
}

function inspect(image, template) {
  const output = run('docker', ['buildx', 'imagetools', 'inspect', image, '--format', template]);
  try {
    return JSON.parse(output);
  } catch {
    throw new Error('Hosted release inspection returned invalid JSON.');
  }
}

function main() {
  const image = process.env.OPS_HOSTED_RELEASE_IMAGE;
  const identity = process.env.OPS_HOSTED_SIGNER_IDENTITY;
  const issuer = process.env.OPS_HOSTED_SIGNER_OIDC_ISSUER;
  const source = process.env.OPS_HOSTED_EXPECTED_SOURCE;
  const revision = process.env.OPS_HOSTED_EXPECTED_REVISION;
  const parsed = parseDigestReference(image);
  assertSignerPolicy(identity, issuer);

  run('cosign', [
    'verify',
    '--certificate-identity',
    identity,
    '--certificate-oidc-issuer',
    issuer,
    image,
  ]);
  assertProvenance(inspect(image, '{{json .Provenance}}'), { source, revision });
  assertSbom(inspect(image, '{{json .SBOM}}'));

  process.stdout.write(
    `${JSON.stringify({
      schemaVersion: 1,
      kind: 'unisane.ops.hosted-release-verification',
      image: `${parsed.repository}@${parsed.digest}`,
      signerIdentity: identity,
      signerIssuer: issuer,
      source,
      revision,
      signature: 'verified',
      provenance: 'verified',
      sbom: 'verified',
    })}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Hosted release verification failed.'}\n`,
  );
  process.exitCode = 1;
}
